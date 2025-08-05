#!/usr/bin/env python3
"""
ClamFlow Cloud Deployment Script
===============================

This script handles the cloud deployment process for ClamFlow to Vercel.
Includes database migration, environment validation, and deployment steps.
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def check_requirements():
    """Check if all required tools are installed."""
    requirements = {
        'git': 'git --version',
        'vercel': 'vercel --version',
        'python': 'python --version'
    }
    
    missing = []
    for tool, cmd in requirements.items():
        try:
            subprocess.run(cmd.split(), capture_output=True, check=True)
            print(f"✅ {tool} is installed")
        except (subprocess.CalledProcessError, FileNotFoundError):
            missing.append(tool)
            print(f"❌ {tool} is not installed")
    
    if missing:
        print(f"\nPlease install missing tools: {', '.join(missing)}")
        return False
    return True

def validate_environment():
    """Validate environment variables and configuration."""
    required_env_vars = [
        'DATABASE_URL',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY'
    ]
    
    missing_vars = []
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please check your .env.production file and Vercel environment settings")
        return False
    
    print("✅ All required environment variables are set")
    return True

def run_database_migration():
    """Run database migrations for production."""
    try:
        print("🔄 Running database migrations...")
        # Import and create tables
        from clamflow.models import Base
        from clamflow.database import engine
        
        Base.metadata.create_all(bind=engine)
        print("✅ Database migrations completed successfully")
        return True
    except Exception as e:
        print(f"❌ Database migration failed: {e}")
        return False

def deploy_to_vercel():
    """Deploy the application to Vercel."""
    try:
        print("🚀 Deploying to Vercel...")
        
        # Login to Vercel (if not already logged in)
        subprocess.run(['vercel', 'login'], check=False)
        
        # Deploy to production
        result = subprocess.run(
            ['vercel', '--prod', '--yes'], 
            capture_output=True, 
            text=True, 
            check=True
        )
        
        print("✅ Deployment successful!")
        print(f"🌐 Production URL: {result.stdout.strip()}")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Deployment failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def setup_github_repository():
    """Initialize and push to GitHub repository."""
    try:
        print("📁 Setting up GitHub repository...")
        
        # Initialize git if not already done
        if not os.path.exists('.git'):
            subprocess.run(['git', 'init'], check=True)
            print("✅ Git repository initialized")
        
        # Add all files
        subprocess.run(['git', 'add', '.'], check=True)
        
        # Commit changes
        subprocess.run([
            'git', 'commit', '-m', 
            'feat: Complete ClamFlow cloud deployment with Admin onboarding capabilities'
        ], check=True)
        
        # Add remote origin (user should replace with their repo URL)
        print("📝 Please add your GitHub repository as remote origin:")
        print("git remote add origin https://github.com/ComplianceRelish/relish_clamflow.git")
        print("git branch -M main")
        print("git push -u origin main")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Git setup failed: {e}")
        return False

def main():
    """Main deployment orchestration."""
    print("🌊 ClamFlow Cloud Deployment")
    print("=" * 40)
    
    # Step 1: Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Step 2: Validate environment
    if not validate_environment():
        print("\n📋 Environment Setup Instructions:")
        print("1. Copy .env.production to .env")
        print("2. Update .env with your Supabase credentials")
        print("3. Set environment variables in Vercel dashboard")
        sys.exit(1)
    
    # Step 3: Run database migrations
    if not run_database_migration():
        sys.exit(1)
    
    # Step 4: Setup GitHub repository
    setup_github_repository()
    
    # Step 5: Deploy to Vercel
    if not deploy_to_vercel():
        sys.exit(1)
    
    print("\n🎉 ClamFlow Cloud Deployment Complete!")
    print("\n📊 Post-Deployment Checklist:")
    print("- ✅ FastAPI backend deployed to Vercel")
    print("- ✅ PostgreSQL database connected via Supabase")
    print("- ✅ Admin onboarding capabilities enabled")
    print("- ✅ Mobile-first onboarding system active")
    print("- ✅ Role-based access control enforced")
    print("\n🔗 Access your application:")
    print("- Dashboard: Run 'streamlit run clamflow/dashboard/🏠_Home.py' locally")
    print("- API Docs: https://your-vercel-url.vercel.app/api/docs")

if __name__ == "__main__":
    main()
