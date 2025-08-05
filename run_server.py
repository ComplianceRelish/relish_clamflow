#!/usr/bin/env python
# run_server.py - LOCAL DEVELOPMENT ONLY
# This file is for local development only and should not be used in production
# Production deployment is handled by Vercel automatically

import uvicorn
import os

if __name__ == "__main__":
    # Only run locally if explicitly in development mode
    if os.getenv('ENVIRONMENT') == 'development':
        print("🚨 LOCAL DEVELOPMENT MODE - Not for production!")
        uvicorn.run("clamflow.main:app", host="127.0.0.1", port=8000, reload=True)
    else:
        print("❌ This server is designed for production deployment via Vercel")
        print("🚀 Check your Vercel deployment at: https://your-app.vercel.app")
        print("📚 API Docs: https://your-app.vercel.app/docs")
