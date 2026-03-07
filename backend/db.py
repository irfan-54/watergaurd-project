from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL:
    print("Warning: SUPABASE_URL not found in environment variables")
if not SUPABASE_KEY:
    print("Warning: SUPABASE_KEY not found in environment variables")

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("Warning: Supabase client not initialized due to missing credentials")
    supabase = None
