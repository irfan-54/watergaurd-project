from fastapi import HTTPException, Depends, Request
from .jwt_handler import decode_access_token
from db import supabase

def get_current_user(request: Request):
    """
    Dependency to verify Supabase JWT token and return authenticated user info.
    """
    authorization = request.headers.get("Authorization")
    
    print(f"[AUTH] Authorization header: {authorization[:50] if authorization else 'None'}...")  # DEBUG

    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    token = authorization.split(" ")[1]

    try:
        payload = decode_access_token(token)
        print(f"[AUTH] Decoded payload: {payload}")  # DEBUG

        # Extract user information from token payload
        user_id = payload.get("sub")
        email = payload.get("email")
        
        print(f"[AUTH] User ID: {user_id}, Email: {email}")  # DEBUG

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user_id")

        # Fetch role and department from profiles table
        try:
            result = supabase.table("profiles")\
                .select("role, department")\
                .eq("user_id", user_id)\
                .single()\
                .execute()
            
            profile = result.data
            role = profile.get("role", "user")
            department = profile.get("department")
            
            print(f"[AUTH] Profile found - Role: {role}, Department: {department}")  # DEBUG
            
        except Exception as db_error:
            print(f"[AUTH] Profile fetch error: {db_error}")  # DEBUG
            role = "user"
            department = None

        return {
            "user_id": user_id,
            "email": email,
            "role": role,
            "department": department
        }

    except Exception as e:
        print(f"[AUTH] Token decode error: {e}")  # DEBUG
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")