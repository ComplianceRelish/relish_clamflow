#!/usr/bin/env python3
"""
ClamFlow Local Development Server
=================================

This script starts the ClamFlow FastAPI backend in development mode.
Frontend should be run separately (Next.js, React, etc.)
"""

import os
import sys
import subprocess
from pathlib import Path

def start_fastapi():
    """Start FastAPI development server."""
    print("🚀 Starting ClamFlow FastAPI backend...")
    try:
        # Change to project directory
        os.chdir(Path(__file__).parent)
        
        # Start FastAPI with uvicorn
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "clamflow.main:app", 
            "--reload", 
            "--host", "127.0.0.1", 
            "--port", "8000"
        ], check=True)
    except KeyboardInterrupt:
        print("🛑 FastAPI server stopped")
    except Exception as e:
        print(f"❌ FastAPI server error: {e}")

def main():
    """Main development server."""
    print("🌊 ClamFlow Development Server")
    print("=" * 40)
    print("Starting FastAPI backend...")
    print("\n📊 Access Points:")
    print("- API Docs: http://localhost:8000/docs")
    print("- API Base: http://localhost:8000/api")
    print("- Health Check: http://localhost:8000/health")
    print("\n💡 Frontend:")
    print("- Run your Next.js/React frontend separately")
    print("- Configure API base URL to: http://localhost:8000")
    print("\nPress Ctrl+C to stop server\n")
    
    start_fastapi()

if __name__ == "__main__":
    main()
