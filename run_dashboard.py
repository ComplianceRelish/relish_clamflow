#!/usr/bin/env python
# run_dashboard.py
import subprocess
import sys
import os

# Change to the dashboard directory
dashboard_path = "clamflow/dashboard"
if os.path.exists(dashboard_path):
    os.chdir(dashboard_path)
    
# Run streamlit with the main.py file
subprocess.run([sys.executable, "-m", "streamlit", "run", "main.py", "--server.port=8501"])
