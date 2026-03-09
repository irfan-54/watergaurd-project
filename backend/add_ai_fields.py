"""
Database migration script to add AI fields to the reports table
Run this script once to update your database schema
"""

from db import supabase
import sys

def add_ai_fields():
    """Add new AI-related fields to the reports table"""
    
    # SQL statements to add new columns
    alterations = [
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS text_ai FLOAT;",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS image_ai FLOAT;", 
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS final_ai FLOAT;",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_explanation TEXT;",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMP;",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS text_category VARCHAR(50);",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS image_category VARCHAR(50);"
    ]
    
    print("Please run the following SQL statements in your Supabase SQL editor:")
    print("\n".join(alterations))
        
        # Alternative approach: Check if fields exist by trying to select them
        try:
            test_result = supabase.table("reports").select(
                "text_ai, image_ai, final_ai, ai_explanation, ai_processed, ai_processed_at, text_category, image_category"
            ).limit(1).execute()
            
            if test_result.data is not None:
                print("✅ AI fields appear to exist in the database")
            else:
                print("⚠️  Could not verify AI fields - please run the SQL statements above")
                
        except Exception as e:
            if "column" in str(e).lower():
                print("❌ AI fields do not exist - please run the SQL statements above")
            else:
                print(f"⚠️  Database check failed: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = add_ai_fields()
    if success:
        print("\n🎉 Migration preparation completed!")
        print("Remember to run the SQL statements in your Supabase SQL editor.")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)
