import warnings
import logging
warnings.filterwarnings("ignore", category=FutureWarning)

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import supabase, SUPABASE_URL, SUPABASE_KEY
from auth.auth_middleware import get_current_user
from logger import success, error, warning, info, step, request_received
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from uuid import uuid4
from datetime import datetime, timezone
import requests
from email_service import (
    send_report_submitted_email,
    send_report_assigned_email,
    send_report_resolved_email,
    send_report_rejected_email
)
from ai_processor import (
    load_nlp_model,
    run_ai_analysis,
    run_text_analysis,
    run_image_analysis,
    get_model_components,
    convert_to_human_readable_label,
    classify_text
)
from typing import Optional
from PIL import Image
import io

# Pydantic models
class ClassifyRequest(BaseModel):
    text: str

class CommentRequest(BaseModel):
    comment: str

# Department mapping for automatic assignment
DEPARTMENT_MAPPING = {
    "leakage": "water_dept",
    "blockage": "pwd", 
    "contamination": "health_dept"
}

# Category mapping for department filtering
DEPARTMENT_CATEGORY_MAPPING = {
    "water_dept": "leakage",
    "pwd": "blockage",
    "health_dept": "contamination"
}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Add rate limit exception handler
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize NLP model at server startup"""
    load_nlp_model()

def calculate_risk(category):
    if category == "contamination":
        return "HIGH"
    elif category == "leakage":
        return "MEDIUM"
    elif category == "blockage":
        return "MEDIUM"
    else:
        return "LOW"

def log_activity(report_id: str, user_id: str, action: str, details: dict = None):
    try:
        supabase.table("activity_logs").insert({
            "id": str(uuid4()),
            "report_id": report_id,
            "user_id": user_id,
            "action": action,
            "details": details or {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")

@app.get("/")
async def health_check():
    return {"status": "WaterGuard API running"}

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
@limiter.limit("10/hour")
async def create_report(
    request: Request,
    description: Optional[str] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    location: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    user = Depends(get_current_user)
):
    # Simple input validation
    if description and len(description.strip()) == 0:
        return {"success": False, "message": "Empty description", "status": "error"}
    if description and len(description) < 5:
        return {"success": False, "message": "Description too short", "status": "error"}
    
    # Simple coordinate validation
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")
    
    # Simple text sanitization
    if description:
        description = description.strip()[:1000]  # Basic length limit
    # Simple image validation
    if image and image.filename:
        # Check file extension
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
        file_ext = image.filename.split('.')[-1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Invalid image format")
        file_bytes = await image.read()
    else:
        file_ext = None
        file_bytes = None

    text_category = "other"
    text_confidence = 0.0
    image_category = None
    image_confidence = None
    risk_level = calculate_risk(text_category)
    
    if supabase is None:
        return {"success": False, "message": "Database not available", "status": "error"}

    try:
        if image:
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
        else:
            public_url = None

        report_data = {
            "description": description,
            "user_id": user["user_id"],
            "status": "submitted",
            "category": text_category,
            "latitude": latitude,
            "longitude": longitude,
            "location": location or f"Lat: {latitude}, Lon: {longitude}",
            "image_url": public_url,
            "risk_level": risk_level,
            "text_confidence": text_confidence,
            "image_prediction": image_category,
            "image_confidence": image_confidence,
            "ai_processed": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        result = supabase.table("reports").insert(report_data).execute()

        if hasattr(result, "error") and result.error:
            raise Exception(f"Database error: {result.error}")

        if not result.data:
            raise Exception("Database insert failed or blocked (possibly RLS)")
        
        if not result.data or len(result.data) == 0:
            raise Exception("Database insert failed or blocked (possibly RLS)")

        report_id = result.data[0]["id"]
        
        # Send email notification
        try:
            user_email = user.get("email")
            send_report_submitted_email(
                str(report_id),
                text_category,
                report_data.get('location', 'Location not provided'),
                user_email
            )
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send submitted email: {e}")
        
        run_ai_analysis(report_id, description, file_bytes)
        log_activity(report_id, user["user_id"], "submitted", {"description": description[:100] if description else ""})
        return {
            "success": True,
            "message": "Report created successfully. AI analysis running in background.",
            "report_id": report_id,
            "category": text_category,
            "risk_level": risk_level,
            "status": "success"
        }
            
    except Exception as e:
        return {"success": False, "message": "Failed to save report", "status": "error", "error": str(e)}

@app.post("/classify")
async def classify_text_endpoint(request: ClassifyRequest):
    # Use rule-based classification with model fallback
    category = classify_text(request.text)
    risk = calculate_risk(category)
    
    # Log request details with rich formatting
    request_received(request.text, category, risk)
    
    return {"category": category, "confidence": 1.0, "risk_level": risk}

@app.get("/stats")
async def get_stats():
    if supabase is None:
        return {"status": "error", "message": "Database not available"}
    try:
        # Use lightweight count queries only
        total = supabase.table("reports").select("id", count="exact", head=True).execute()
        active = supabase.table("reports").select("id", count="exact", head=True).eq("status", "submitted").execute()
        resolved = supabase.table("reports").select("id", count="exact", head=True).eq("status", "resolved").execute()
        high = supabase.table("reports").select("id", count="exact", head=True).eq("risk_level", "high").execute()
        
        return {
            "status": "success",
            "total_reports": total.count or 0,
            "active_alerts": active.count or 0,
            "issues_resolved": resolved.count or 0,
            "high_risk": high.count or 0
        }
    except Exception as e:
        logger.error(f"Stats query failed: {e}")
        return {"status": "error", "message": "Failed to retrieve stats", "error": str(e)}

@app.get("/reports")
async def get_all_reports(
    page: int = 1,
    limit: int = 20,
    status: str = None,
    category: str = None,
    risk_level: str = None
):
    if supabase is None:
        return {"status": "error", "message": "Database not available"}
    try:
        offset = (page - 1) * limit

        # Build count query with filters
        count_query = supabase.table("reports").select("id", count="exact")
        if status:
            count_query = count_query.eq("status", status)
        if category:
            count_query = count_query.eq("category", category)
        if risk_level:
            count_query = count_query.eq("risk_level", risk_level)
        count_result = count_query.execute()
        total_count = count_result.count or 0

        # Build data query with filters + pagination
        data_query = supabase.table("reports").select("*").order("created_at", desc=True).range(offset, offset + limit - 1)
        if status:
            data_query = data_query.eq("status", status)
        if category:
            data_query = data_query.eq("category", category)
        if risk_level:
            data_query = data_query.eq("risk_level", risk_level)
        result = data_query.execute()

        user_ids = list(set(r.get("user_id") for r in result.data if r.get("user_id")))
        email_map = {}
        if user_ids:
            try:
                profiles = supabase.table("profiles").select("id, email").in_("id", user_ids).execute()
                for p in profiles.data:
                    email_map[p["id"]] = p["email"]
            except:
                pass

        reports = []
        for report in result.data:
            reports.append({
                "submitter_email": email_map.get(report.get("user_id")),
                "id": report.get("id"),
                "description": report.get("description"),
                "category": report.get("category", "other"),
                "risk_level": report.get("risk_level", "low"),
                "latitude": report.get("latitude"),
                "longitude": report.get("longitude"),
                "image_url": report.get("image_url"),
                "created_at": report.get("created_at"),
                "user_id": report.get("user_id"),
                "status": report.get("status", "submitted"),
                "text_confidence": report.get("text_confidence"),
                "image_confidence": report.get("image_confidence"),
                "final_confidence": report.get("final_confidence"),
                "image_prediction": report.get("image_prediction"),
                "ai_explanation": report.get("ai_explanation"),
                "ai_processed": report.get("ai_processed"),
                "ai_processed_at": report.get("ai_processed_at")
            })

        total_pages = (total_count + limit - 1) // limit

        return {
            "status": "success",
            "data": reports,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    except Exception as e:
        return {"status": "error", "message": "Failed to retrieve reports", "error": str(e)}

@app.get("/department/reports")
async def get_department_reports(
    page: int = 1,
    limit: int = 20,
    status: str = None,
    user = Depends(get_current_user)
):
    if user.get("role") != "department":
        raise HTTPException(status_code=403, detail="Only department workers can access this")
    dept = user.get("department")
    if not dept:
        raise HTTPException(status_code=400, detail="No department assigned to this user")
    try:
        offset = (page - 1) * limit

        # Filter by department column directly
        count_query = supabase.table("reports").select("id", count="exact").eq("department", dept)
        if status:
            count_query = count_query.eq("status", status)
        else:
            count_query = count_query.in_("status", ["assigned", "ASSIGNED", "in_progress", "IN_PROGRESS"])
        count_result = count_query.execute()
        total_count = count_result.count or 0

        data_query = supabase.table("reports").select("*").eq("department", dept).order("created_at", desc=True).range(offset, offset + limit - 1)
        if status:
            data_query = data_query.eq("status", status)
        else:
            data_query = data_query.in_("status", ["assigned", "ASSIGNED", "in_progress", "IN_PROGRESS"])
        result = data_query.execute()

        reports = []
        for report in result.data:
            reports.append({
                "id": report.get("id"),
                "description": report.get("description"),
                "category": report.get("category", "other"),
                "risk_level": report.get("risk_level", "low"),
                "latitude": report.get("latitude"),
                "longitude": report.get("longitude"),
                "image_url": report.get("image_url"),
                "created_at": report.get("created_at"),
                "user_id": report.get("user_id"),
                "status": report.get("status", "submitted"),
                "department": report.get("department"),
            })

        total_pages = (total_count + limit - 1) // limit

        return {
            "status": "success",
            "data": reports,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    except Exception as e:
        return {"status": "error", "message": "Failed to retrieve reports", "error": str(e)}

@app.put('/reports/{report_id}/start')
async def start_work_report(report_id: str, user = Depends(get_current_user)):
    if user.get("role") not in ["admin", "department"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if supabase is None:
        return {"message": "Database not available", "status": "error"}
    try:
        report_result = supabase.table("reports").select("category", "status").eq("id", report_id).execute()
        if len(report_result.data) == 0:
            return {"message": "Report not found", "status": "error"}
        current_status = report_result.data[0]["status"]
        if current_status != "submitted":
            return {"message": f"Cannot assign report with status '{current_status}'. Only submitted reports can be assigned.", "status": "error"}
        category = report_result.data[0]["category"]
        department = DEPARTMENT_MAPPING.get(category)
        update_data = {
            "status": "in_progress",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        if department:
            update_data["department"] = department
        result = supabase.table("reports").update(update_data).eq("id", report_id).execute()
        if len(result.data) == 0:
            return {"message": "Report not found", "status": "error"}
        return {"status": "in_progress", "department": department}
    except Exception as e:
        return {"message": "Failed to assign report", "status": "error", "error": str(e)}

@app.put('/reports/{report_id}/assign')
async def assign_report(report_id: str, department: str = Form(...), user = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can assign reports")
    if supabase is None:
        return {"message": "Database not available", "status": "error"}
    try:
        report_result = supabase.table("reports").select("*").eq("id", report_id).execute()
        if len(report_result.data) == 0:
            return {"message": "Report not found", "status": "error"}
        current_status = report_result.data[0]["status"]
        if current_status != "submitted":
            return {"message": f"Cannot assign report with status '{current_status}'. Only submitted reports can be assigned.", "status": "error"}
        update_data = {
            "status": "assigned",
            "department": department,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        result = supabase.table("reports").update(update_data).eq("id", report_id).execute()
        if len(result.data) == 0:
            return {"message": "Report not found", "status": "error"}
        
        # Send email notification
        try:
            owner_id = report_result.data[0].get("user_id")
            profile = supabase.table("profiles").select("email").eq("id", owner_id).execute()
            owner_email = profile.data[0]["email"] if profile.data else None
            send_report_assigned_email(str(report_id), report_result.data[0]["category"], department, owner_email)
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send assigned email: {e}")
        
        return {"status": "assigned", "department": department}
    except Exception as e:
        return {"message": "Failed to assign report", "status": "error", "error": str(e)}

@app.get("/reports/{report_id}/comments")
async def get_comments(report_id: str):
    try:
        result = supabase.table("comments") \
            .select("*") \
            .eq("report_id", report_id) \
            .order("created_at", desc=True) \
            .execute()
        
        return {"status": "success", "data": result.data or []}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/reports/{report_id}/comments")
async def add_comment(report_id: str, request: CommentRequest, user = Depends(get_current_user)):
    try:
        new_comment = {
            "id": str(uuid4()),
            "report_id": report_id,
            "user_id": user["user_id"],
            "comment": request.comment,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = supabase.table("comments").insert(new_comment).execute()
        
        return {"status": "success", "data": result.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.put('/reports/{report_id}/resolve')
async def resolve_report(report_id: str, user = Depends(get_current_user)):
    if user.get("role") not in ["admin", "department"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if supabase is None:
        return {"message": "Database not available", "status": "error"}
    try:
        report_result = supabase.table("reports").select("*").eq("id", report_id).execute()
        if len(report_result.data) == 0:
            return {"message": "Report not found", "status": "error"}
        
        update_data = {
            "status": "resolved",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        result = supabase.table("reports").update(update_data).eq("id", report_id).execute()
        if len(result.data) == 0:
            return {"message": "Report not found", "status": "error"}
        
        # Send email notification
        try:
            owner_id = report_result.data[0].get("user_id")
            profile = supabase.table("profiles").select("email").eq("id", owner_id).execute()
            owner_email = profile.data[0]["email"] if profile.data else None
            send_report_resolved_email(str(report_id), report_result.data[0]["category"], report_result.data[0].get("location", "Unknown location"), owner_email)
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send resolved email: {e}")
        
        return {"status": "resolved"}
    except Exception as e:
        return {"message": "Failed to resolve report", "status": "error", "error": str(e)}

@app.put('/reports/{report_id}/reject')
async def reject_report(report_id: str, user = Depends(get_current_user)):
    if user.get("role") not in ["admin", "department"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if supabase is None:
        return {"message": "Database not available", "status": "error"}
    try:
        report_result = supabase.table("reports").select("*").eq("id", report_id).execute()
        if len(report_result.data) == 0:
            return {"message": "Report not found", "status": "error"}
        
        update_data = {
            "status": "rejected",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        result = supabase.table("reports").update(update_data).eq("id", report_id).execute()
        if len(result.data) == 0:
            return {"message": "Report not found", "status": "error"}
        
        # Send email notification
        try:
            owner_id = report_result.data[0].get("user_id")
            profile = supabase.table("profiles").select("email").eq("id", owner_id).execute()
            owner_email = profile.data[0]["email"] if profile.data else None
            send_report_rejected_email(str(report_id), report_result.data[0]["category"], report_result.data[0].get("location", "Unknown location"), owner_email)
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send rejected email: {e}")
        
        return {"status": "rejected"}
    except Exception as e:
        return {"message": "Failed to reject report", "status": "error", "error": str(e)}

@app.get("/reports/{report_id}/timeline")
async def get_timeline(report_id: str):
    try:
        # Fetch from activity_logs table
        result = supabase.table("activity_logs") \
            .select("*") \
            .eq("report_id", report_id) \
            .order("created_at", desc=True) \
            .execute()
        
        # Map each record to timeline format
        timeline = []
        for activity in result.data or []:
            # Create readable message based on action
            message_map = {
                "submitted": "Report submitted",
                "verified": "AI analysis completed",
                "assigned": "Assigned to department",
                "in_progress": "Work started",
                "resolved": "Report resolved"
            }
            
            timeline.append({
                "type": activity.get("action", "submitted"),
                "message": message_map.get(activity.get("action"), activity.get("action", "submitted")),
                "timestamp": activity.get("created_at")
            })
        
        return {"status": "success", "data": timeline}
    except Exception as e:
        return {"status": "error", "message": str(e)}
