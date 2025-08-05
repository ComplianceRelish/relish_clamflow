#!/usr/bin/env python3
"""
Local Deployment Script for ClamFlow
====================================

This script allows you to test the deployment process locally
before pushing to GitHub Actions.
"""

import os
import subprocess
import sys
from pathlib import Path

def check_environment():
    """Check if all required environment variables are set."""
    required_vars = [
        'DATABASE_URL',
        'NEXT_PUBLIC_SUPABASE_URL', 
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'VERCEL_TOKEN'
    ]
    
    missing = []
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        print("\n📋 Please set these variables in your .env file:")
        for var in missing:
            print(f"export {var}=your_value_here")
        return False
    
    print("✅ All environment variables are set")
    return True

def run_tests():
    """Run local tests before deployment."""
    print("🧪 Running local tests...")
    try:
        # Test database connection
        from clamflow.database import check_database_connection, get_database_info
        import json
        
        print("🔍 Database Info:", json.dumps(get_database_info(), indent=2))
        
        if not check_database_connection():
            print("❌ Database connection failed")
            return False
            
        print("✅ Database connection successful")
        
        # Test imports
        print("🔍 Testing imports...")
        from clamflow.main import app
        from clamflow.models import Base
        print("✅ All imports successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Tests failed: {e}")
        return False

def deploy_to_vercel():
    """Deploy to Vercel using CLI."""
    print("🚀 Deploying to Vercel...")
    
    try:
        # Check if Vercel CLI is installed
        subprocess.run(['vercel', '--version'], check=True, capture_output=True)
        print("✅ Vercel CLI is installed")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Vercel CLI not found. Installing...")
        subprocess.run(['npm', 'install', '-g', 'vercel'], check=True)
    
    try:
        # Deploy to production
        print("🔄 Deploying to production...")
        vercel_token = os.getenv('VERCEL_TOKEN')
        if not vercel_token:
            print("❌ VERCEL_TOKEN not found in environment")
            return None
            
        result = subprocess.run([
            'vercel', 
            '--prod', 
            '--yes',
            '--token', vercel_token
        ], capture_output=True, text=True, check=True)
        
        deployment_url = result.stdout.strip()
        print(f"✅ Deployment successful!")
        print(f"🌐 Production URL: {deployment_url}")
        print(f"📚 API Docs: {deployment_url}/api/docs")
        
        return deployment_url
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Deployment failed: {e}")
        print(f"Error output: {e.stderr}")
        return None

def main():
    """Main deployment process."""
    print("🌊 ClamFlow Local Deployment Script")
    print("=" * 50)
    
    # Step 1: Check environment
    if not check_environment():
        sys.exit(1)
    
    # Step 2: Run tests
    if not run_tests():
        print("❌ Tests failed. Aborting deployment.")
        sys.exit(1)
    
    # Step 3: Deploy
    deployment_url = deploy_to_vercel()
    if not deployment_url:
        sys.exit(1)
    
    print("\n🎉 ClamFlow Deployment Complete!")
    print("\n📊 What's Deployed:")
    print("- ✅ FastAPI backend with Admin dual onboarding")
    print("- ✅ PostgreSQL database via Supabase")
    print("- ✅ Mobile-first onboarding system")
    print("- ✅ Sequential approval workflow")
    print("- ✅ QR code generation and tracking")
    print("\n🔗 Next Steps:")
    print(f"1. Test the API: {deployment_url}/api/docs")
    print("2. Run Streamlit dashboard locally for full features")
    print("3. Configure DNS (if using custom domain)")
    print("4. Set up monitoring and alerts")

if __name__ == "__main__":
    main()
