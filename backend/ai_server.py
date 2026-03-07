from fastapi import FastAPI
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from pydantic import BaseModel
import torch.nn.functional as F

# Input model for API
class ClassificationRequest(BaseModel):
    text: str

# Create FastAPI app
app = FastAPI(title="WaterGuard AI Classification Service")

# Label mapping
label_map = {0: "leakage", 1: "contamination", 2: "blockage", 3: "other"}

# Risk mapping
risk_map = {
    "contamination": "HIGH",
    "leakage": "MEDIUM",
    "blockage": "MEDIUM",
    "other": "LOW"
}

# Global variables for model and tokenizer
model = None
tokenizer = None
device = None

@app.on_event("startup")
async def load_model():
    global model, tokenizer, device

    # Set device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load tokenizer and model
    model_path = "models/xlmr_water_model"
    print(f"Loading model from: {model_path}")

    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)

    # Move model to device
    model.to(device)
    model.eval()

    print("Model and tokenizer loaded successfully")

@app.post("/classify")
async def classify_text(request: ClassificationRequest):
    global model, tokenizer, device

    if model is None or tokenizer is None:
        return {
            "error": "Model not loaded",
            "status": "error"
        }

    # Tokenize input
    inputs = tokenizer(
        request.text,
        padding="max_length",
        truncation=True,
        max_length=128,
        return_tensors="pt"
    )

    # Move to device
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Run inference
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits

        # Get probabilities
        probabilities = F.softmax(logits, dim=1)

        # Get prediction and confidence
        confidence, predicted_class = torch.max(probabilities, dim=1)

        predicted_index = predicted_class.item()
        predicted_label = label_map[predicted_index]
        confidence_score = confidence.item()
        risk_level = risk_map[predicted_label]

    return {
        "category": predicted_label,
        "confidence": round(confidence_score, 4),
        "risk_level": risk_level
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
