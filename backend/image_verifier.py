import torch
from transformers import CLIPProcessor, CLIPModel
from logger import step, success
from PIL import Image
import io
from functools import lru_cache

# Label mappings for consistent output
NUMERIC_LABEL_MAP = {0: "blockage", 1: "leakage", 2: "contamination", 3: "other"}
STRING_LABEL_MAP = {"LABEL_0": "blockage", "LABEL_1": "leakage", "LABEL_2": "contamination", "LABEL_3": "other"}

# Global variables for CLIP model (legacy - now using cached loader)
clip_model = None
clip_processor = None

@lru_cache(maxsize=1)
def get_clip_model():
    """Load and cache CLIP model and processor"""
    global clip_model, clip_processor
    if clip_model is None:
        try:
            # Removed noisy logs for cleaner startup
            clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            # CLIP model loading message moved to ai_processor.py for cleaner startup
        except Exception as e:
            from logger import error
            error(f"CLIP ERROR: Failed to load CLIP model: {e}")
            clip_model = None
            clip_processor = None
    
    return clip_model, clip_processor

def load_clip_model():
    """Legacy function - now calls cached loader"""
    get_clip_model()

# Load CLIP model automatically when module is imported
load_clip_model()

def rule_based_image_classify(labels, probs):
    """
    Apply rule-based classification on CLIP labels before final scoring
    
    Args:
        labels: List of CLIP prompt labels
        probs: CLIP probability scores for each label
        
    Returns:
        tuple or None: (label, confidence) or None if no match
    """
    # Create label-to-probability mapping
    label_probs = {label.lower(): float(prob) for label, prob in zip(labels, probs)}
    
    # Priority 1: Contamination (highest)
    contamination_keywords = [
        "dirty", "contaminated", "brown", "yellow", "black", "sludge", 
        "foam", "sewage", "polluted", "murky", "cloudy", "discolored"
    ]
    
    # Priority 2: Leakage
    leakage_keywords = [
        "burst", "leaking", "broken", "flooding", "overflow", "spraying",
        "gushing", "jet", "spilling", "water coming out"
    ]
    
    # Priority 3: Blockage (FIXED - only strong signals)
    blockage_keywords = [
        "dry tap", "empty tap", "no water flow", "no water coming"
    ]
    
    # Check contamination first (highest priority)
    matched_probs = []
    for label, prob in label_probs.items():
        if prob > 0.45:  # Updated confidence threshold
            if any(keyword in label for keyword in contamination_keywords):
                matched_probs.append(prob)
                print(f"[RULE] Contamination matched: '{label}' ({prob:.2f})")
    
    if matched_probs:
        confidence = max(matched_probs)
        return "contamination", confidence
    
    # Then check leakage
    matched_probs = []
    for label, prob in label_probs.items():
        if prob > 0.45:  # Updated confidence threshold
            if any(keyword in label for keyword in leakage_keywords):
                matched_probs.append(prob)
                print(f"[RULE] Leakage matched: '{label}' ({prob:.2f})")
    
    if matched_probs:
        confidence = max(matched_probs)
        return "leakage", confidence
    
    # Then check blockage (FIXED keywords)
    matched_probs = []
    for label, prob in label_probs.items():
        if prob > 0.45:  # Updated confidence threshold
            if any(keyword in label for keyword in blockage_keywords):
                matched_probs.append(prob)
                print(f"[RULE] Blockage matched: '{label}' ({prob:.2f})")
    
    if matched_probs:
        confidence = max(matched_probs)
        return "blockage", confidence
    
    # No rule matched - safe fallback
    return None

def verify_image(image_bytes):
    """
    Verify image using CLIP model with rule-based classification layer
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        dict: {
            "image_prediction": <label>,
            "image_confidence": <float between 0 and 1>
        }
    """
    try:
        # Ensure CLIP model is loaded
        if clip_model is None or clip_processor is None:
            load_clip_model()
        
        if clip_model is None or clip_processor is None:
            return {
                "image_prediction": "other",
                "image_confidence": 0.0
            }
        
        # Validate image bytes
        if not image_bytes or len(image_bytes) == 0:
            return {
                "image_prediction": "other", 
                "image_confidence": 0.0
            }
        
        # Load and process image
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
        except Exception as e:
            return {
                "image_prediction": "other",
                "image_confidence": 0.0
            }
        
        # Define prompts for water-related categories (enhanced for rule detection)
        labels = [
            # leakage (STRONG SIGNALS)
            "high pressure water jet from burst underground pipe",
            "water spraying forcefully from broken pipeline",
            "water leaking from broken pipe",
            "pipe burst with water flooding",
            "overflowing water from damaged pipeline",
            
            # blockage (WEAKEN THIS)
            "blocked drain causing slow water overflow",
            "clogged pipe with stagnant water",
            "dry tap with no water flow",
            "blocked water supply pipe",
            
            # contamination (ENHANCED)
            "dirty contaminated water from tap",
            "brown dirty water with particles",
            "yellow polluted water from faucet",
            "black sewage water contamination",
            "murky cloudy water with sludge",
            "foamy contaminated water source",
            
            # other
            "normal water system no issue",
            "clean clear water from tap",
            "functional water supply system"
        ]
        
        inputs = clip_processor(text=labels, images=image, return_tensors="pt", padding=True)
        outputs = clip_model(**inputs)
        
        probs = outputs.logits_per_image.softmax(dim=1)[0]
        
        # STEP 1: Apply rule-based classification FIRST
        rule_result = rule_based_image_classify(labels, probs)
        
        if rule_result:
            # Rule matched - return rule result with calculated confidence
            rule_label, rule_confidence = rule_result
            print(f"[IMAGE] Rule-based classification: {rule_label} ({rule_confidence:.2f})")
            return {
                "image_prediction": rule_label,
                "image_confidence": rule_confidence
            }
        
        # STEP 2: Fallback to CLIP scoring if no rule matched
        print("[IMAGE] No rule matched - using CLIP scoring")
        
        # Use weighted scoring to prioritize leakage over blockage
        leakage_score = (probs[0] + probs[1] + probs[2] + probs[3]) * 1.3   # boost leakage
        blockage_score = (probs[4] + probs[5] + probs[6]) * 0.8  # reduce blockage
        contamination_score = (probs[7] + probs[8] + probs[9] + probs[10] + probs[11]) * 1.2  # boost contamination
        other_score = (probs[12] + probs[13]) * 1.0
        
        scores = {
            "leakage": leakage_score,
            "blockage": blockage_score,
            "contamination": contamination_score,
            "other": other_score
        }
        
        # Get the index of the highest score
        scores_list = list(scores.values())
        labels_list = list(scores.keys())
        max_index = scores_list.index(max(scores_list))
        
        # Convert to human-readable label (already in correct format)
        image_prediction = labels_list[max_index]
        image_confidence = scores[image_prediction]
        
        # Print debug
        print("CLIP Scores:", scores)
        print("CLIP Chosen:", image_prediction)
        
        return {
            "image_prediction": image_prediction,
            "image_confidence": image_confidence
        }
        
    except Exception as e:
        # Return fallback values if verification fails
        return {
            "image_prediction": "other",
            "image_confidence": 0.0
        }
