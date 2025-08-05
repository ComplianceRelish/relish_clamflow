#!/usr/bin/env python3
"""
ClamFlow Database Initialization Script
Creates all tables including onboarding tables
"""

import sys
import os

# Add project root to path
sys.path.append(os.path.abspath('.'))

from clamflow.database import engine
from clamflow.models import Base

def init_database():
    """Initialize all database tables using SQLAlchemy"""
    
    try:
        print("🗄️ Creating all database tables...")
        
        # Create all tables defined in models.py
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database initialization completed successfully!")
        
        # List all created tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"📊 Created {len(tables)} tables:")
        for table in sorted(tables):
            print(f"   - {table}")
        
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Initializing ClamFlow Database with Onboarding System...")
    success = init_database()
    
    if success:
        print("\n🎉 Database ready with onboarding system!")
        print("📱 Staff Lead can now onboard staff/suppliers")
        print("👔 Admin can approve/reject from dashboard")
        print("\n🚀 Run the application:")
        print("   Backend:  python run_server.py")
        print("   Frontend: python run_dashboard.py")
    else:
        print("\n❌ Initialization failed. Please check errors above.")
