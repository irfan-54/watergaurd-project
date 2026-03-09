import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import io

# Global variables for CLIP model
clip_model = None
clip_processor = None

def load_clip_model():
    """Load CLIP model and processor once at startup"""
    global clip_model, clip_processor
    if clip_model is None:
        try:
            clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        except Exception as e:
            clip_model = None
            clip_processor = None

# Load CLIP model automatically when module is imported
load_clip_model()

def verify_image(image_bytes):
    """
    Verify image using CLIP model against water-related categories
    
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
        
        # Define prompts for water-related categories
        prompts = [
            "a leaking water pipe",
            "dirty contaminated drinking water", 
            "a blocked drain or sewer pipe",
            "a normal water system or plumbing"
        ]
        
        # Map prompt indices to labels
        label_map = {
            0: "leakage",
            1: "contamination", 
            2: "blockage",
            3: "other"
        }
        
        # Process inputs
        inputs = clip_processor(
            text=prompts, 
            images=image, 
            return_tensors="pt", 
            padding=True
        )
        
        # Run inference
        with torch.no_grad():
            outputs = clip_model(**inputs)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1)
            
        # Get top prediction
        top_prob, top_idx = torch.max(probs, dim=1)
        
        # Convert to Python types
        image_prediction = label_map[top_idx.item()]
        image_confidence = top_prob.item()
        
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
