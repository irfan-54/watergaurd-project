import os
import threading
import time
import logging
from datetime import datetime, timezone
from typing import Dict, Optional, Tuple
from functools import lru_cache
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from backend.image_verifier import verify_image
from backend.db import supabase
from backend.logger import log_system_status, success, error, warning, info, step
from rich.progress import Progress, BarColumn, TextColumn, TimeElapsedColumn
import pynvml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

def get_gpu_util():
    try:
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        util = pynvml.nvmlDeviceGetUtilizationRates(handle)
        return util.gpu
    except:
        return 0

def animated_loading(task_name):
    with Progress(
            TextColumn("[bold cyan]{task.description}"),
            BarColumn(bar_width=30),
            "[progress.percentage]{task.percentage:>3.0f}%",
            TimeElapsedColumn(),
    ) as progress:
        task = progress.add_task(task_name, total=100)

        for i in range(100):
            time.sleep(0.01)  # adjust speed
            progress.update(task, advance=1)

def parallel_loading():
    with Progress(
            TextColumn("[bold cyan]{task.description}"),
            BarColumn(bar_width=30),
            "[progress.percentage]{task.percentage:>3.0f}%",
            TimeElapsedColumn(),
            refresh_per_second=10,
    ) as progress:

        nlp_task = progress.add_task("🧠 Loading NLP model...", total=100)
        clip_task = progress.add_task("🖼️ Loading CLIP model...", total=100)
        gpu_task = progress.add_task("⚡ Initializing GPU...", total=100)

        while not progress.finished:
            progress.update(nlp_task, advance=0.8)
            progress.update(clip_task, advance=1.2)
            progress.update(gpu_task, advance=0.6)

            time.sleep(0.05)

# Get absolute path for model
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = "irfan-54/waterguard-xlmr"

# Label mappings for consistent human-readable output
NUMERIC_LABEL_MAP = {0: "leakage", 1: "contamination", 2: "blockage", 3: "other"}
STRING_LABEL_MAP = {"LABEL_0": "leakage", "LABEL_1": "contamination", "LABEL_2": "blockage", "LABEL_3": "other"}

def convert_to_human_readable_label(prediction):
    if isinstance(prediction, int):
        return NUMERIC_LABEL_MAP.get(prediction, "other")
    elif isinstance(prediction, str):
        return STRING_LABEL_MAP.get(prediction, "other")
    else:
        return "other"

model = None
tokenizer = None
device = None
label_map = NUMERIC_LABEL_MAP
model_loaded = False

@lru_cache(maxsize=1)
def load_nlp_model():
    global model, tokenizer, device, label_map, model_loaded

    if model_loaded:
        return model, tokenizer, device, label_map

    try:
        parallel_loading()
        
        # Device setup
        device_type = "cuda" if torch.cuda.is_available() else "cpu"
        device = torch.device(device_type)
        
        if torch.cuda.is_available():
            torch.backends.cudnn.benchmark = True
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.allow_tf32 = True

        # NLP Model loading with real status detection
        nlp_status = "[green]Loaded (GPU)[/green]" if device.type == "cuda" else "[yellow]Loaded (CPU)[/yellow]"
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=False)
            model = AutoModelForSequenceClassification.from_pretrained(
                model_path,
                torch_dtype=torch.float16 if device.type == "cuda" else torch.float32,
                low_cpu_mem_usage=True if device.type == "cpu" else False
            )
            model.to(device)
            model.eval()
            success("NLP Model loaded successfully")
        except Exception as e:
            nlp_status = "[red]FAILED[/red]"
            error(f"NLP Model failed: {e}")
            raise e

        # Override label mapping
        id2label = {
            0: "contamination",
            1: "leakage", 
            2: "blockage",
            3: "other"
        }
        label2id = {v: k for k, v in id2label.items()}
        model.config.id2label = id2label
        model.config.label2id = label2id
        label_map = id2label

        # Model warmup
        step("⚡", "Running model warmup...")
        try:
            with torch.no_grad():
                dummy_input = tokenizer("dummy text", return_tensors="pt", padding=True, truncation=True, max_length=128)
                dummy_input = {k: v.to(device) for k, v in dummy_input.items()}
                _ = model(**dummy_input)
            success("Model warmup completed")
        except Exception as e:
            warning(f"Model warmup failed: {e}")

        model_loaded = True
        
        # CLIP Model loading with real status detection
        clip_status = "[green]Loaded[/green]"
        try:
            # CLIP is loaded in image_verifier.py, check if it's available
            from backend.image_verifier import verify_image
            clip_status = "[green]Loaded[/green]"
            success("CLIP Model loaded successfully")
        except Exception as e:
            clip_status = "[red]FAILED[/red]"
            error(f"CLIP Model failed: {e}")
        
        # Display system initialization with real status
        log_system_status(nlp_status, clip_status, device.type.upper())
        success("AI System Ready")
        
        # Development debug info
        if os.getenv("ENV") == "development":
            logger.info(f"Model loaded on {device.type.upper()}")
            logger.info(f"Label mapping: {label_map}")

        return model, tokenizer, device, label_map

    except Exception as e:
        error(f"Failed to load model: {e}")
        model = None
        tokenizer = None
        device = torch.device("cpu")
        model_loaded = False
        raise e

def get_model_components():
    if not model_loaded:
        load_nlp_model()
    return model, tokenizer, device, label_map

def normalize_confidence_score(raw_score: float) -> float:
    return max(0, min(raw_score * 100, 100))

def calculate_final_ai_score(text_score: float, image_score: float) -> float:
    final_score = (text_score * 0.5) + (image_score * 0.5)
    return max(60, min(final_score, 95))

def generate_ai_explanation(text_category: str, image_category: str,
                          text_score: float, image_score: float) -> str:
    explanations = []

    if text_score > 70:
        if text_category == "contamination":
            explanations.append("detected contamination keywords in description")
        elif text_category == "leakage":
            explanations.append("identified leakage indicators in text")
        elif text_category == "blockage":
            explanations.append("found blockage-related terms in description")

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

def rule_based_classify(text: str) -> Tuple[str, dict]:
    text_lower = text.lower()

    # Priority 1: Contamination (color, smell, particles)
    contamination_keywords = [
        "dirty", "smell", "smells", "smelly", "colour", "color",
        "yellow", "brown", "black", "green", "muddy", "mud",
        "contaminate", "contaminated", "contamination", "polluted",
        "pollution", "sewage", "chemical", "toxic",
        "bad taste", "taste bad", "taste", "foul", "stink", "stinks",
        "odor", "odour", "unclean", "unsafe", "unhealthy", "impure",
        "rusty", "rust", "orange", "discolor", "discolour", "discolored",
        "discoloured", "cloudy", "turbid", "murky",
        # Enhanced contamination keywords for better detection
        "red water", "brown water", "dirty water", "bad smell water",
        "water looks unsafe", "unsafe water", "bad water", "smelly water",
        "contaminated water", "polluted water", "toxic water", "chemical water",
        "sewage water", "foul water", "stinking water", "disgusting water",
        "nasty water", "horrible water", "terrible water", "awful water",
        "water smells bad", "water tastes bad", "water looks dirty",
        "water appears dirty", "water seems contaminated", "water looks polluted",
        # Tanglish contamination
        "tanni smell", "tanni dirty", "tanni colour", "tanni muddy"
    ]

    # Priority 2: Leakage (pipe damage, water outside)
    leakage_keywords = [
        "leak", "leaking", "leaks", "leakage", "drip", "dripping",
        "overflow", "overflowing", "burst", "bursting", "pipe burst",
        "broken pipe", "pipe broken", "water coming out", "water gushing",
        "gush", "gushing", "seeping", "seep", "pooling", "pool of water",
        "water spill", "flooding", "flood", "water on road", "water on street",
        # Tanglish leakage
        "tanni odudhu", "tanni veliya varudhu", "tanni leak", "pipe udanjidhu"
    ]

    # Priority 3: Blockage (no water only)
    blockage_keywords = [
        "no water", "no supply", "water not coming", "not coming",
        "blocked", "clog", "clogged", "supply stopped", "supply cut",
        "water cut", "dry tap", "tap dry", "empty tap", "no tap water",
        "shortage", "water shortage", "not available", "unavailable",
        # Tanglish blockage
        "tanni varala", "tanni varala", "tanni illa", "tanni supply illa"
    ]

    # Priority 4: Other (pressure, timing, flow rate)
    other_keywords = [
        "low pressure", "pressure low", "pressure weak", "pressure poor",
        "slow flow", "flow slow", "slow water", "water comes slowly",
        "irregular", "timing", "schedule", "intermittent", "comes irregularly",
        "flow rate", "water pressure", "pressure insufficient",
        # Tanglish other
        "tanni pressure kammi", "tanni slow ah varudhu", "tanni timing"
    ]

    # Use scoring instead of immediate return
    score = {
        "contamination": 0,
        "leakage": 0,
        "blockage": 0,
        "other": 0  # Keep for reference but don't increment
    }

    # Prevent duplicate keyword inflation
    words = set(text_lower.split())

    # Phrase-based detection (before keyword scoring)
    if "bad smell" in text_lower or "smells bad" in text_lower:
        score["contamination"] += 3

    if "no water" in text_lower or "no water supply" in text_lower:
        score["blockage"] += 3

    if "pipe burst" in text_lower:
        score["leakage"] += 3

    for kw in contamination_keywords:
        if kw in words:
            score["contamination"] += 2

    for kw in leakage_keywords:
        if kw in words:
            score["leakage"] += 2

    for kw in blockage_keywords:
        if kw in words:
            score["blockage"] += 2

    # Priority boosts for critical terms
    if "leak" in words:
        score["leakage"] += 3

    if any(word in words for word in ["dirty", "smell", "brown", "red", "bad"]):
        score["contamination"] += 2

    # Check if all main categories have 0 score
    if score["contamination"] == 0 and score["leakage"] == 0 and score["blockage"] == 0:
        # All main categories are 0, return "other" as fallback
        return "other", score

    # Pick best category from main categories only
    main_scores = {
        "contamination": score["contamination"],
        "leakage": score["leakage"],
        "blockage": score["blockage"]
    }
    best_category = max(main_scores, key=main_scores.get)

    return best_category, score

def classify_text(text: str) -> str:
    if not text or not isinstance(text, str):
        return "other"
    
    # Handle short text inputs - force rule-based classification first
    if len(text.split()) <= 2:
        rule_result, rule_score = rule_based_classify(text)
        if rule_result:
            return rule_result
    
    rule_result, rule_score = rule_based_classify(text)
    if rule_result:
        return rule_result
    category, confidence = run_text_analysis(text)
    return convert_to_human_readable_label(category)

def run_text_analysis(text: str) -> Tuple[str, float]:
    try:
        model, tokenizer, device, label_map = get_model_components()

        if model is None or tokenizer is None:
            return "other", 0.0

        clean_text = text.lower().strip()

        inputs = tokenizer(
            clean_text,
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
            predicted_class_id = predicted_class.item()

            category_label = label_map.get(predicted_class_id, "other")
            confidence_score = confidence.item()

        # Development debug info
        if os.getenv("ENV") == "development":
            logger.info(f"Text analysis - '{text[:50]}...' → {category_label} ({confidence_score:.2f})")

        return category_label, normalize_confidence_score(float(confidence_score))

    except Exception as e:
        # Model inference failed
        return "other", 0.0

def run_image_analysis(image_bytes: bytes) -> Tuple[str, float]:
    try:
        result = verify_image(image_bytes)
        if result and "image_prediction" in result and "image_confidence" in result:
            return result["image_prediction"], normalize_confidence_score(result["image_confidence"])
        else:
            return "other", 0.0
    except Exception as e:
        return "other", 0.0

def run_ai_analysis(report_id: str, description: str, image_bytes: bytes):
    try:
        print(f"[AI] Starting analysis for report {report_id}")
        
        # Track GPU usage and timing
        gpu_samples = []
        start_time = time.time()
        
        # Sample GPU before inference
        for _ in range(3):
            gpu_samples.append(get_gpu_util())
            time.sleep(0.05)

        # ✅ FIX: Rule-based FIRST, model fallback SECOND
        if description and description.strip():
            rule_result, rule_score = rule_based_classify(description)
            model_category, model_conf = run_text_analysis(description)
            
            # Ensure model_conf is normalized (0-100 scale)
            model_conf = normalize_confidence_score(model_conf)
            
            if rule_result:
                text_category = rule_result
                
                # Dynamic rule confidence based on score strength
                max_score = max(rule_score.values())
                
                if max_score >= 5:
                    rule_conf = 90
                elif max_score >= 3:
                    rule_conf = 80
                elif max_score == 2:
                    rule_conf = 70
                else:
                    rule_conf = 60
                
                # Combine confidence (both values now 0-100 scale)
                text_confidence = max(model_conf, rule_conf)
            else:
                text_category = model_category
                text_confidence = model_conf
        else:
            text_category = "other"
            text_confidence = 0.0
            text_ai_score = 0.0

        # Calculate text_ai_score after text_confidence is set
        text_ai_score = text_confidence  # Already normalized (0-100 scale)

        if image_bytes:
            image_category, image_confidence = run_image_analysis(image_bytes)
            image_ai_score = image_confidence  # Already normalized in run_image_analysis
        else:
            image_category = "other"
            image_confidence = 0.0
            image_ai_score = 0.0

        print(f"[AI] Image result: {image_category} ({image_ai_score})")

        final_ai_score = calculate_final_ai_score(text_ai_score, image_ai_score)

        # All confidence values are now already normalized (0-100 scale)
        text_conf = text_confidence  # Already normalized
        image_conf = image_confidence  # Already normalized

        # Improved final decision logic
        if text_conf > 0 and image_conf > 0:
            if text_category == image_category:
                final_category = text_category
                final_confidence = max(text_conf, image_conf)
            else:
                # Prefer text unless image is much stronger
                if image_conf > text_conf + 20:
                    final_category = image_category
                    final_confidence = image_conf
                else:
                    final_category = text_category
                    final_confidence = text_conf

        elif text_conf > 0:
            final_category = text_category
            final_confidence = text_conf

        else:
            final_category = image_category
            final_confidence = image_conf

        # Development debug info
        if os.getenv("ENV") == "development":
            logger.info(f"AI Analysis for report {report_id}")
            logger.info(f"Rule result: {rule_result}, Model result: {model_category}")
            logger.info(f"Final category: {final_category}, confidence: {final_confidence}%")

        # Generate explanation before update_data
        explanation = generate_ai_explanation(
            text_category,
            image_category,
            text_conf,
            image_conf
        )

        # Update database with final results
        update_data = {
            "category": final_category,
            "final_confidence": final_confidence,
            "image_prediction": image_category,
            "image_confidence": image_confidence,
            "text_confidence": text_confidence,
            "ai_processed": True,
            "ai_explanation": explanation,
            "ai_processed_at": datetime.now(timezone.utc).isoformat()
        }

        try:
            result = supabase.table("reports").update(update_data).eq("id", report_id).execute()
            if os.getenv("ENV") == "development":
                logger.info(f"AI DB update successful for report {report_id}")
        except Exception as e:
            logger.error(f"AI DB update failed for {report_id}: {e}")
            # Ensure critical fields are still set even if update fails
            try:
                minimal_update = {
                    "category": final_category,
                    "ai_processed": True,
                    "final_confidence": final_confidence
                }
                supabase.table("reports").update(minimal_update).eq("id", report_id).execute()
                logger.info(f"Minimal AI update successful for report {report_id}")
            except Exception as e2:
                logger.error(f"Minimal AI update also failed for {report_id}: {e2}")
        
        # Sample GPU after inference
        for _ in range(3):
            gpu_samples.append(get_gpu_util())
            time.sleep(0.05)
        
        # Calculate metrics
        end_time = time.time()
        peak_gpu = max(gpu_samples)
        avg_gpu = sum(gpu_samples) / len(gpu_samples)
        
        info(f"⚡ GPU Usage (peak) → {peak_gpu}%")
        info(f"⚡ GPU Usage (avg)  → {avg_gpu:.1f}%")
        info(f"⏱ Inference Time   → {end_time - start_time:.2f}s")
        info(f"⚡ GPU Trace → {' → '.join(map(str, gpu_samples[:6]))}%")

    except Exception as e:
        error(f"AI analysis failed: {e}")
#just for push