from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import supabase, SUPABASE_URL, SUPABASE_KEY
from uuid import uuid4
from datetime import datetime, timezone
import requests
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from image_verifier import verify_image
import torch
import torch.nn.functional as F
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

    # ✅ FIX 1: Returns (category, confidence) — unpack correctly in caller
    return category_label, confidence_score

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

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Loading NLP model on device: {device}")

    model_path = "models/xlmr_water_model"
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)

    model.to(device)
    model.eval()

    print("NLP model loaded successfully")

@app.get("/test-db")
async def test_database():
    try:
        test_data = {
            "description": "Test report from API",
            "category": "other",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "image_url": "test.jpg",
            "risk_level": "LOW"
        }
        result = supabase.table("reports").insert(test_data).execute()
        return {"message": "Database test successful", "data": result.data, "status": "success"}
    except Exception as e:
        return {"message": "Database test failed", "error": str(e), "status": "error"}

@app.post("/reports")
async def create_report(
    description: str = Form(...),
    latitude: float = Form(...),   # ✅ FIX 2: float instead of str (fixes 422 error)
    longitude: float = Form(...),  # ✅ FIX 2: float instead of str (fixes 422 error)
    image: UploadFile = File(...)
):
    print(f"Received report:")
    print(f"Description: {description}")
    print(f"Latitude: {latitude}")
    print(f"Longitude: {longitude}")
    print(f"Image filename: {image.filename}")

    file_ext = image.filename.split(".")[-1]

    # ✅ FIX 3: Read bytes ONCE here and reuse everywhere — fixes N/A columns
    file_bytes = await image.read()

    # Run NLP inference to classify the description
    category, text_confidence = await run_nlp_classify(description)
    print(f"Predicted category: {category}")
    try:
        print(f"Text confidence: {float(text_confidence):.4f}")
    except (ValueError, TypeError):
        print(f"Text confidence: {text_confidence} (invalid format)")

    # Image verification using CLIP
    image_result = verify_image(file_bytes)
    print("Image result:", image_result)

    if image_result is None:
        print("ERROR: image_result is None!")
        image_prediction = "other"
        image_confidence = 0.0
    else:
        image_prediction = image_result.get("image_prediction")
        image_confidence = image_result.get("image_confidence")
        print(f"Image prediction: {image_prediction}")
        print(f"Image confidence: {image_confidence:.4f}")

    # Combine scores for final confidence
    if text_confidence is not None and image_confidence is not None:
        final_confidence = (text_confidence + image_confidence) / 2
    else:
        final_confidence = None
        print("ERROR: Cannot calculate final_confidence!")

    risk_level = calculate_risk(category)
    print(f"Calculated risk: {risk_level}")
    print("TEXT CONF:", text_confidence)
    print("IMAGE CONF:", image_confidence)
    print("FINAL CONF:", final_confidence)

    if supabase is None:
        return {
            "message": "Database not available",
            "text_category": category,
            "text_confidence": text_confidence,
            "image_prediction": image_prediction,
            "image_confidence": image_confidence,
            "final_confidence": final_confidence,
            "risk_level": risk_level,
            "status": "error"
        }

    try:
        unique_filename = f"{uuid4()}.{file_ext}"
        storage_url = f"{SUPABASE_URL}/storage/v1/object/report-images/{unique_filename}"

        headers = {
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "apikey": SUPABASE_KEY,
            "Content-Type": image.content_type
        }

        # ✅ FIX 3: Reuse file_bytes — no second .read() call
        upload_response = requests.post(storage_url, headers=headers, data=file_bytes)

        print("Storage status:", upload_response.status_code)
        print("Storage response:", upload_response.text)

        if upload_response.status_code not in [200, 201]:
            raise Exception(f"Storage upload failed: {upload_response.text}")

        public_url = f"{SUPABASE_URL}/storage/v1/object/public/report-images/{unique_filename}"

        report_data = {
            "description": description,
            "category": category,
            "latitude": latitude,
            "longitude": longitude,
            "image_url": public_url,
            "risk_level": risk_level,
            "text_confidence": text_confidence,    # ✅ Now correct value
            "image_prediction": image_prediction,
            "image_confidence": image_confidence,  # ✅ Now correct value
            "final_confidence": final_confidence   # ✅ Now correct value
        }

        result = supabase.table("reports").insert(report_data).execute()
        print("DB insert result:", result)

        return {
            "message": "Report created successfully",
            "category": category,
            "text_confidence": text_confidence,
            "image_prediction": image_prediction,
            "image_confidence": image_confidence,
            "final_confidence": final_confidence,
            "risk_level": risk_level,
            "status": "success"
        }
    except Exception as e:
        print("DB INSERT ERROR:", str(e))
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
        return {"status": "error", "message": "Database not available"}

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
        return {"status": "error", "message": "Failed to retrieve stats", "error": str(e)}

@app.get("/reports")
async def get_all_reports():
    if supabase is None:
        return {"status": "error", "message": "Database not available"}

    try:
        result = supabase.table("reports").select("*").order("created_at", desc=True).execute()

        reports = []
        for report in result.data:
            reports.append({
                "id": report.get("id"),
                "description": report.get("description"),
                "category": report.get("category", "other"),
                "risk_level": report.get("risk_level", "LOW"),
                "latitude": report.get("latitude"),
                "longitude": report.get("longitude"),
                "image_url": report.get("image_url"),
                "created_at": report.get("created_at"),
                "user_id": report.get("user_id"),
                "status": report.get("status", "OPEN"),
                # ✅ FIX 4: Include AI confidence fields in GET /reports response
                "text_confidence": report.get("text_confidence"),
                "image_confidence": report.get("image_confidence"),
                "final_confidence": report.get("final_confidence"),
                "image_prediction": report.get("image_prediction"),
            })

        return {"status": "success", "count": len(reports), "data": reports}
    except Exception as e:
        return {"status": "error", "message": "Failed to retrieve reports", "error": str(e)}

@app.put('/reports/{report_id}/resolve')
async def resolve_report(report_id: str):
    if supabase is None:
        return {"message": "Database not available", "status": "error"}

    try:
        report_check = supabase.table("reports").select("status").eq("id", report_id).execute()

        if len(report_check.data) == 0:
            return {"message": "Report not found", "status": "error"}

        current_status = report_check.data[0]["status"]
        if current_status != "IN_PROGRESS":
            return {
                "message": f"Cannot resolve report with status '{current_status}'. Only IN_PROGRESS reports can be resolved.",
                "status": "error"
            }

        result = supabase.table("reports").update({
            "status": "RESOLVED",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", report_id).execute()

        return {"message": "Report resolved successfully"}
    except Exception as e:
        return {"message": "Failed to resolve report", "status": "error", "error": str(e)}

@app.put('/reports/{report_id}/start')
async def start_work_report(report_id: str):
    if supabase is None:
        return {"message": "Database not available", "status": "error"}

    try:
        result = supabase.table("reports").update({
            "status": "IN_PROGRESS",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", report_id).execute()

        if len(result.data) == 0:
            return {"message": "Report not found", "status": "error"}

        return {"status": "IN_PROGRESS", "message": "Work started on report"}
    except Exception as e:
        return {"message": "Failed to start work on report", "status": "error", "error": str(e)}

@app.delete('/reports/{report_id}')
async def delete_report(report_id: str):
    if supabase is None:
        return {"message": "Database not available", "status": "error"}

    try:
        result = supabase.table("reports").delete().eq("id", report_id).execute()

        if len(result.data) == 0:
            return {"message": "Report not found", "status": "error"}

        return {"message": "Report deleted successfully"}
    except Exception as e:
        return {"message": "Failed to delete report", "status": "error", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)