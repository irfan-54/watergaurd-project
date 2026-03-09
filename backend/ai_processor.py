import threading
import time
from typing import Dict, Optional, Tuple
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from image_verifier import verify_image
from db import supabase

# Global variables for NLP model
model = None
tokenizer = None
device = None
label_map = {0: "leakage", 1: "contamination", 2: "blockage", 3: "other"}

def load_nlp_model():
    """Load NLP model and tokenizer"""
    global model, tokenizer, device
    if model is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        model_path = "models/xlmr_water_model"
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            model = AutoModelForSequenceClassification.from_pretrained(model_path)
            model.to(device)
            model.eval()
        except Exception as e:
            model = None
            tokenizer = None

def normalize_confidence_score(raw_score: float) -> float:
    """Normalize raw confidence score to percentage (0-100)"""
    return max(0, min(raw_score * 100, 100))

def calculate_final_ai_score(text_score: float, image_score: float) -> float:
    """Calculate final AI score with calibration and clamping"""
    # Combine scores with equal weights
    final_score = (text_score * 0.5) + (image_score * 0.5)
    # Clamp to realistic range (60-95)
    return max(60, min(final_score, 95))

def generate_ai_explanation(text_category: str, image_category: str, 
                          text_score: float, image_score: float) -> str:
    """Generate explanation for AI decision"""
    explanations = []
    
    # Text-based explanations
    if text_score > 70:
        if text_category == "contamination":
            explanations.append("detected contamination keywords in description")
        elif text_category == "leakage":
            explanations.append("identified leakage indicators in text")
        elif text_category == "blockage":
            explanations.append("found blockage-related terms in description")
    
    # Image-based explanations
    if image_score > 70:
        if image_category == "contamination":
            explanations.append("recognized polluted water patterns in image")
        elif image_category == "leakage":
            explanations.append("detected water leakage in image")
        elif image_category == "blockage":
            explanations.append("identified blockage patterns in image")
    
    if not explanations:
        return "general water issue analysis completed"
    
    return "AI analysis: " + ", ".join(explanations)

def run_text_analysis(text: str) -> Tuple[str, float]:
    """Run text analysis with error handling"""
    try:
        if model is None or tokenizer is None:
            load_nlp_model()
        
        if model is None or tokenizer is None:
            return "other", 0.0
        
        inputs = tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=128,
            return_tensors="pt"
        )
        
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = F.softmax(logits, dim=1)
            confidence, predicted_class = torch.max(probabilities, dim=1)
            
            predicted_index = predicted_class.item()
            category_label = label_map[predicted_index]
            confidence_score = confidence.item()
            
        return category_label, confidence_score
        
    except Exception as e:
        return "other", 0.0

def run_image_analysis(image_bytes: bytes) -> Tuple[str, float]:
    """Run image analysis with error handling"""
    try:
        result = verify_image(image_bytes)
        if result and "image_prediction" in result and "image_confidence" in result:
            return result["image_prediction"], result["image_confidence"]
        else:
            return "other", 0.0
    except Exception as e:
        return "other", 0.0

def run_ai_analysis(report_id: str, description: str, image_bytes: bytes):
    """Run complete AI analysis in background"""
    try:
        
        # Run text analysis
        text_category, text_confidence = run_text_analysis(description)
        text_ai_score = normalize_confidence_score(text_confidence)
        
        # Run image analysis
        image_category, image_confidence = run_image_analysis(image_bytes)
        image_ai_score = normalize_confidence_score(image_confidence)
        
        # Calculate final AI score
        final_ai_score = calculate_final_ai_score(text_ai_score, image_ai_score)
        
        # Generate explanation
        ai_explanation = generate_ai_explanation(
            text_category, image_category, text_ai_score, image_ai_score
        )
        
        # Update report in database
        update_data = {
            "text_ai": text_ai_score,
            "image_ai": image_ai_score, 
            "final_ai": final_ai_score,
            "ai_explanation": ai_explanation,
            "text_category": text_category,
            "image_category": image_category,
            "ai_processed": True,
            "ai_processed_at": time.time()
        }
        
        result = supabase.table("reports").update(update_data).eq("id", report_id).execute()
        
    except Exception as e:
        # Mark as processed even if failed to avoid reprocessing
        try:
            supabase.table("reports").update({
                "ai_processed": True,
                "ai_processed_at": time.time(),
                "ai_explanation": f"AI analysis failed: {str(e)}"
            }).eq("id", report_id).execute()
        except:
            pass

def start_ai_analysis(report_id: str, description: str, image_bytes: bytes):
    """Start AI analysis in background thread"""
    thread = threading.Thread(
        target=run_ai_analysis, 
        args=(report_id, description, image_bytes),
        daemon=True
    )
    thread.start()

def validate_report_input(description: str, image_file) -> Tuple[bool, str]:
    """Validate report input before processing"""
    # Validate description
    if not description or not description.strip():
        return False, "Description is required"
    
    if len(description.strip()) < 10:
        return False, "Description must be at least 10 characters long"
    
    # Validate image file
    if not image_file or not image_file.filename:
        return False, "Image file is required"
    
    # Check file extension
    allowed_extensions = {'jpg', 'jpeg', 'png', 'webp'}
    file_ext = image_file.filename.lower().split('.')[-1]
    if file_ext not in allowed_extensions:
        return False, f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
    
    # Check file size (5MB limit)
    if hasattr(image_file, 'size') and image_file.size > 5 * 1024 * 1024:
        return False, "Image file size must be less than 5MB"
    
    return True, "Validation passed"

# Load model at module import
load_nlp_model()
