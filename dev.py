#!/usr/bin/env python3
"""
ClamFlow Local Development Server
=================================

This script starts the ClamFlow application in development mode.
Runs both FastAPI backend and Streamlit dashboard concurrently.
"""

import os
import sys
import subprocess
import time
import signal
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

def start_fastapi():
    """Start FastAPI development server."""
    print("🚀 Starting FastAPI backend...")
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

def start_streamlit():
    """Start Streamlit dashboard."""
    print("🎨 Starting Streamlit dashboard...")
    try:
        # Change to project directory
        os.chdir(Path(__file__).parent)
        
        # Wait a moment for FastAPI to start
        time.sleep(3)
        
        # Start Streamlit
        subprocess.run([
            sys.executable, "-m", "streamlit", "run", 
            "clamflow/dashboard/🏠_Home.py",
            "--server.port", "8501",
            "--server.address", "127.0.0.1"
        ], check=True)
    except KeyboardInterrupt:
        print("🛑 Streamlit server stopped")
    except Exception as e:
        print(f"❌ Streamlit server error: {e}")

def main():
    """Main development server orchestration."""
    print("🌊 ClamFlow Development Server")
    print("=" * 40)
    print("Starting both FastAPI backend and Streamlit dashboard...")
    print("\n📊 Access Points:")
    print("- Dashboard: http://localhost:8501")
    print("- API Docs: http://localhost:8000/docs")
    print("- Admin Panel: http://localhost:8501/Onboarding (Admin login)")
    print("\nPress Ctrl+C to stop all servers\n")
    
    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        print("\n🛑 Shutting down servers...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start both servers concurrently
    with ThreadPoolExecutor(max_workers=2) as executor:
        # Submit both tasks
        fastapi_future = executor.submit(start_fastapi)
        streamlit_future = executor.submit(start_streamlit)
        
        try:
            # Wait for both to complete (they won't unless there's an error)
            fastapi_future.result()
            streamlit_future.result()
        except KeyboardInterrupt:
            print("🛑 Development servers stopped")

if __name__ == "__main__":
    main()
