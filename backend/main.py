from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import supabase, SUPABASE_URL, SUPABASE_KEY
from uuid import uuid4
from datetime import datetime, timezone
import requests
from ai_processor import (
    validate_report_input, 
    start_ai_analysis,
    run_text_analysis,
    run_image_analysis
)
from PIL import Image
import io

class ClassifyRequest(BaseModel):
    text: str

app = FastAPI()

def calculate_risk(category):
    if category in ["leakage", "contamination"]:
        return "HIGH"
    elif category == "blockage":
        return "MEDIUM"
    else:
        return "LOW"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    user_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(...)
):
    
    # Validate input
    is_valid, validation_message = validate_report_input(description, image)
    if not is_valid:
        return {
            "success": False,
            "message": validation_message,
            "status": "error"
        }

    file_ext = image.filename.split(".")[-1]
    file_bytes = await image.read()

    # Run quick text analysis for immediate category determination
    text_category, text_confidence = run_text_analysis(description)
    
    # Quick image analysis for basic validation
    image_category, image_confidence = run_image_analysis(file_bytes)
    
    risk_level = calculate_risk(text_category)
    
    if supabase is None:
        return {
            "success": False,
            "message": "Database not available",
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

        upload_response = requests.post(storage_url, headers=headers, data=file_bytes)

        
        if upload_response.status_code not in [200, 201]:
            raise Exception(f"Storage upload failed: {upload_response.text}")

        public_url = f"{SUPABASE_URL}/storage/v1/object/public/report-images/{unique_filename}"

        # Create report with basic info (AI scores will be added in background)
        report_data = {
            "description": description,
            "user_id": user_id,
            "status": "OPEN",
            "category": text_category,
            "latitude": latitude,
            "longitude": longitude,
            "image_url": public_url,
            "risk_level": risk_level,
            "text_confidence": text_confidence,
            "image_prediction": image_category,
            "image_confidence": image_confidence,
            "ai_processed": False,  # Mark for background processing
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        result = supabase.table("reports").insert(report_data).execute()
        
        if result.data and len(result.data) > 0:
            report_id = result.data[0]["id"]
            
            # Start AI analysis in background
            start_ai_analysis(report_id, description, file_bytes)
            
            return {
                "success": True,
                "message": "Report created successfully. AI analysis running in background.",
                "report_id": report_id,
                "category": text_category,
                "risk_level": risk_level,
                "status": "success"
            }
        else:
            raise Exception("Failed to create report record")
            
    except Exception as e:
                return {
            "success": False,
            "message": "Failed to save report",
            "status": "error",
            "error": str(e)
        }

@app.post("/classify")
async def classify_text(request: ClassifyRequest):
    category, confidence = run_text_analysis(request.text)
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
                "text_ai": report.get("text_ai"),
                "image_ai": report.get("image_ai"),
                "final_ai": report.get("final_ai"),
                "ai_explanation": report.get("ai_explanation"),
                "ai_processed": report.get("ai_processed"),
                "ai_processed_at": report.get("ai_processed_at")
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

@app.get('/reports/{report_id}/ai-status')
async def get_ai_status(report_id: str):
    """Check AI processing status for a specific report"""
    if supabase is None:
        return {"status": "error", "message": "Database not available"}
    
    try:
        result = supabase.table("reports").select(
            "ai_processed, ai_processed_at, text_ai, image_ai, final_ai, ai_explanation"
        ).eq("id", report_id).execute()
        
        if len(result.data) == 0:
            return {"status": "error", "message": "Report not found"}
        
        report = result.data[0]
        return {
            "status": "success",
            "ai_processed": report.get("ai_processed", False),
            "ai_processed_at": report.get("ai_processed_at"),
            "text_ai": report.get("text_ai"),
            "image_ai": report.get("image_ai"),
            "final_ai": report.get("final_ai"),
            "ai_explanation": report.get("ai_explanation")
        }
        
    except Exception as e:
        return {"status": "error", "message": f"Failed to get AI status: {str(e)}"}

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