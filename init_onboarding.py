#!/usr/bin/env python3
"""
ClamFlow Database Initialization Script
Adds onboarding tables to existing database
"""

import sqlite3
import os

def init_onboarding_tables():
    """Initialize onboarding tables in ClamFlow database"""
    
    # Database path
    db_path = "clamflow.db"
    
    # Read SQL schema
    sql_file = "clamflow/onboarding_schema.sql"
    
    if not os.path.exists(sql_file):
        print(f"❌ SQL file not found: {sql_file}")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🗄️ Connected to ClamFlow database")
        
        # Read and execute SQL
        with open(sql_file, 'r') as f:
            sql_content = f.read()
        
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for stmt in statements:
            if stmt and not stmt.startswith('--') and not stmt.startswith('/*'):
                try:
                    cursor.execute(stmt)
                    print(f"✅ Executed: {stmt[:50]}...")
                except Exception as e:
                    print(f"⚠️ Warning: {e}")
        
        conn.commit()
        print("✅ Database initialization completed successfully!")
        
        # Verify tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'pending_%'")
        tables = cursor.fetchall()
        
        print(f"📊 Created {len(tables)} onboarding tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Initializing ClamFlow Onboarding System...")
    success = init_onboarding_tables()
    
    if success:
        print("\n🎉 Onboarding system ready!")
        print("📱 Staff Lead can now onboard staff/suppliers")
        print("👔 Admin can approve/reject from dashboard")
        print("\n🚀 Run the application:")
        print("   Backend:  python -m uvicorn clamflow.main:app --reload")
        print("   Frontend: streamlit run clamflow/dashboard/main.py")
    else:
        print("\n❌ Initialization failed. Please check errors above.")
