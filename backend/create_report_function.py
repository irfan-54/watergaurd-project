@app.post("/reports")
@limiter.limit("10/hour")
async def create_report(
    request: Request,
    description: Optional[str] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
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
            "image_url": public_url,
            "risk_level": risk_level,
            "text_confidence": text_confidence,
            "image_prediction": image_category,
            "image_confidence": image_confidence,
            "ai_processed": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        result = supabase.table("reports").insert(report_data).execute()

        print("[DB RESULT RAW]:", result)

        if hasattr(result, "error") and result.error:
            print("[DB ERROR]:", result.error)

        if not result.data:
            print("[DB ERROR]: No data returned (possible RLS issue)")
        
        if not result.data or len(result.data) == 0:
            raise Exception("Database insert failed or blocked (possibly RLS)")

        report_id = result.data[0]["id"]
        run_ai_analysis(report_id, description, file_bytes)
        log_activity(report_id, user["user_id"], "SUBMITTED", {"description": description[:100] if description else ""})
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
