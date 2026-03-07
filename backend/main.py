from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import supabase, SUPABASE_URL, SUPABASE_KEY
from uuid import uuid4
from datetime import datetime, timezone
import requests
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image
import io

class ClassifyRequest(BaseModel):
    text: str

app = FastAPI()

# Global variables for NLP model
model = None
tokenizer = None
device = None
label_map = {0: "leakage", 1: "contamination", 2: "blockage", 3: "other"}

image_model = None
preprocess = None

def calculate_risk(category):
    if category in ["leakage", "contamination"]:
        return "HIGH"
    elif category == "blockage":
        return "MEDIUM"
    else:
        return "LOW"

async def run_nlp_classify(text):
    """Run NLP inference on text and return category and confidence"""
    global model, tokenizer, device, label_map

    if model is None or tokenizer is None:
        # Fallback if model not loaded
        return "other", 0.0

    # Tokenize input
    inputs = tokenizer(
        text,
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
        category_label = label_map[predicted_index]
        confidence_score = confidence.item()

    return category_label, confidence_score

async def classify_image(image_bytes):
    global image_model, preprocess
    if image_model is None:
        return "unknown", 0.0
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        input_tensor = preprocess(image)
        input_batch = input_tensor.unsqueeze(0)
        with torch.no_grad():
            output = image_model(input_batch)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            confidence, predicted_class = torch.max(probabilities, dim=0)
            class_idx = predicted_class.item()
            confidence_score = confidence.item()
            image_category = f"imagenet_{class_idx}"
            return image_category, confidence_score
    except Exception as e:
        return "unknown", 0.0

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def load_nlp_model():
    global model, tokenizer, device

    # Set device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Loading NLP model on device: {device}")

    # Load tokenizer and model
    model_path = "models/xlmr_water_model"
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)

    # Move model to device
    model.to(device)
    model.eval()

    print("NLP model loaded successfully")

    global image_model, preprocess
    image_model = models.mobilenet_v2(pretrained=True)
    image_model.to(device)
    image_model.eval()
    preprocess = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    print("Image model loaded successfully")

@app.get("/test-db")
async def test_database():
    try:
        # Insert dummy row into reports table
        test_data = {
            "description": "Test report from API",
            "category": "other",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "image_url": "test.jpg",
            "risk_level": "LOW"
        }
        
        result = supabase.table("reports").insert(test_data).execute()
        
        return {
            "message": "Database test successful",
            "data": result.data,
            "status": "success"
        }
    except Exception as e:
        return {
            "message": "Database test failed",
            "error": str(e),
            "status": "error"
        }

@app.post("/reports")
async def create_report(
    description: str = Form(...),
    latitude: str = Form(...),
    longitude: str = Form(...),
    image: UploadFile = File(...)
):
    print(f"Received report:")
    print(f"Description: {description}")
    print(f"Latitude: {latitude}")
    print(f"Longitude: {longitude}")
    print(f"Image filename: {image.filename}")

    file_ext = image.filename.split(".")[-1]

    file_bytes = await image.read()

    # Run NLP inference to classify the description
    category, confidence = await run_nlp_classify(description)
    print(f"Predicted category: {category}")
    print(f"Confidence: {confidence:.4f}")

    image_category, image_confidence = await classify_image(file_bytes)
    print(f"Image category: {image_category}")
    print(f"Image confidence: {image_confidence:.4f}")

    final_category = category

    # Calculate risk based on category
    risk_level = calculate_risk(final_category)
    print(f"Calculated risk: {risk_level}")
    
    # Insert into Supabase if available
    if supabase is None:
        return {
            "message": "Database not available",
            "text_category": category,
            "text_confidence": confidence,
            "image_category": image_category,
            "image_confidence": image_confidence,
            "final_category": final_category,
            "risk_level": risk_level,
            "status": "error"
        }
    
    try:
        file_ext = image.filename.split(".")[-1]
        unique_filename = f"{uuid4()}.{file_ext}"
        file_bytes = await image.read()
        
        storage_url = f"{SUPABASE_URL}/storage/v1/object/report-images/{unique_filename}"
        
        headers = {
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "apikey": SUPABASE_KEY,
            "Content-Type": image.content_type
        }
        
        upload_response = requests.post(
            storage_url,
            headers=headers,
            data=file_bytes
        )
        
        print("Storage status:", upload_response.status_code)
        print("Storage response:", upload_response.text)
        
        if upload_response.status_code not in [200, 201]:
            raise Exception(f"Storage upload failed: {upload_response.text}")
        
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/report-images/{unique_filename}"
        
        report_data = {
            "description": description,
            "category": category,
            "confidence": confidence,
            "latitude": float(latitude),
            "longitude": float(longitude),
            "image_url": public_url,
            "risk_level": risk_level
        }
        
        result = supabase.table("reports").insert(report_data).execute()
        print("DB insert result:", result)
        
        return {
            "message": "Report created successfully",
            "category": category,
            "risk_level": risk_level,
            "status": "success"
        }
    except Exception as e:
        return {
            "message": "Failed to save report",
            "category": category,
            "risk_level": risk_level,
            "status": "error",
            "error": str(e)
        }

@app.post("/classify")
async def classify_text(request: ClassifyRequest):
    category, confidence = await run_nlp_classify(request.text)
    return {"category": category, "confidence": confidence, "risk_level": calculate_risk(category)}

@app.get("/stats")
async def get_stats():
    if supabase is None:
        return {
            "status": "error",
            "message": "Database not available"
        }
    
    try:
        total = supabase.table("reports").select("id", count="exact").execute()
        active = supabase.table("reports").select("id", count="exact").eq("status", "OPEN").execute()
        resolved = supabase.table("reports").select("id", count="exact").eq("status", "RESOLVED").execute()
        high = supabase.table("reports").select("id", count="exact").eq("risk_level", "HIGH").execute()
        
        return {
            "status": "success",
            "total_reports": total.count or 0,
            "active_alerts": active.count or 0,
            "issues_resolved": resolved.count or 0,
            "high_risk": high.count or 0
        }
    except Exception as e:
        return {
            "status": "error",
            "message": "Failed to retrieve stats",
            "error": str(e)
        }

@app.get("/reports")
async def get_all_reports():
    if supabase is None:
        return {
            "status": "error",
            "message": "Database not available"
        }
    
    try:
        result = supabase.table("reports").select("*").order("created_at", desc=True).execute()
        
        # Map the fields to match frontend expectations
        reports = []
        for report in result.data:
            reports.append({
                "id": report.get("id"),
                "description": report.get("description"),
                "category": report.get("category", "other"),  # Default to "other" if missing
                "risk_level": report.get("risk_level", "LOW"),
                "confidence": report.get("confidence", 0.0),
                "latitude": report.get("latitude"),
                "longitude": report.get("longitude"),
                "image_url": report.get("image_url"),
                "created_at": report.get("created_at"),
                "user_id": report.get("user_id"),
                "status": report.get("status", "OPEN")
            })
        
        return {
            "status": "success",
            "count": len(reports),
            "data": reports
        }
    except Exception as e:
        return {
            "status": "error",
            "message": "Failed to retrieve reports",
            "error": str(e)
        }

@app.put('/reports/{report_id}/resolve')
async def resolve_report(report_id: str):
    if supabase is None:
        return {
            "message": "Database not available",
            "status": "error"
        }
    
    try:
        # First check if report exists and has correct status
        report_check = supabase.table("reports").select("status").eq("id", report_id).execute()
        
        if len(report_check.data) == 0:
            return {
                "message": "Report not found",
                "status": "error"
            }
        
        current_status = report_check.data[0]["status"]
        if current_status != "IN_PROGRESS":
            return {
                "message": f"Cannot resolve report with status '{current_status}'. Only IN_PROGRESS reports can be resolved.",
                "status": "error"
            }
        
        # Update status to RESOLVED
        result = supabase.table("reports").update({
            "status": "RESOLVED",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", report_id).execute()
        
        return {
            "message": "Report resolved successfully"
        }
    except Exception as e:
        return {
            "message": "Failed to resolve report",
            "status": "error",
            "error": str(e)
        }

@app.put('/reports/{report_id}/start')
async def start_work_report(report_id: str):
    if supabase is None:
        return {
            "message": "Database not available",
            "status": "error"
        }
    
    try:
        result = supabase.table("reports").update({
            "status": "IN_PROGRESS",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", report_id).execute()
        
        if len(result.data) == 0:
            return {
                "message": "Report not found",
                "status": "error"
            }
        
        return {
            "status": "IN_PROGRESS",
            "message": "Work started on report"
        }
    except Exception as e:
        return {
            "message": "Failed to start work on report",
            "status": "error",
            "error": str(e)
        }

@app.delete('/reports/{report_id}')
async def delete_report(report_id: str):
    if supabase is None:
        return {
            "message": "Database not available",
            "status": "error"
        }
    
    try:
        result = supabase.table("reports").delete().eq("id", report_id).execute()
        
        if len(result.data) == 0:
            return {
                "message": "Report not found",
                "status": "error"
            }
        
        return {
            "message": "Report deleted successfully"
        }
    except Exception as e:
        return {
            "message": "Failed to delete report",
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
