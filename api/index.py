"""
Vercel API Handler for ClamFlow FastAPI Application
This file serves as the entry point for Vercel serverless deployment.
"""
from clamflow.main import app

# Export the FastAPI app for Vercel
app = app

# Vercel ASGI handler with proper interface
async def handler(scope, receive, send):
    await app(scope, receive, send)

if __name__ == "__main__":
    print("🚀 ClamFlow API ready for Vercel deployment")
    print("📋 Features included:")
    print("  - Admin dual onboarding capabilities")  
    print("  - Mobile-first interface")
    print("  - Sequential approval workflow")
    print("  - QR code generation")
    print("  - Supabase PostgreSQL integration")
    print("  - Supabase PostgreSQL integration")
