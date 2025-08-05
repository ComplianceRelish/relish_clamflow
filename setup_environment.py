#!/usr/bin/env python3
"""
Environment Setup Script for ClamFlow Cloud Deployment
======================================================

This script helps set up your local environment for ClamFlow deployment.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

def check_prerequisites():
    """Check if all required tools are installed."""
    tools = {
        'python': ['python', '--version'],
        'node': ['node', '--version'],
        'npm': ['npm', '--version'],
        'git': ['git', '--version']
    }
    
    missing = []
    for tool, cmd in tools.items():
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            version = result.stdout.strip()
            print(f"✅ {tool}: {version}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            missing.append(tool)
            print(f"❌ {tool} not found")
    
    if missing:
        print(f"\n📦 Please install missing tools: {', '.join(missing)}")
        print("\n📋 Installation instructions:")
        if 'python' in missing:
            print("- Python: https://python.org/downloads")
        if 'node' in missing:
            print("- Node.js: https://nodejs.org")
        if 'git' in missing:
            print("- Git: https://git-scm.com")
        return False
    
    return True

def setup_python_environment():
    """Set up Python virtual environment and dependencies."""
    print("\n🐍 Setting up Python environment...")
    
    venv_path = Path('.venv')
    if not venv_path.exists():
        print("📦 Creating virtual environment...")
        subprocess.run([sys.executable, '-m', 'venv', '.venv'], check=True)
        print("✅ Virtual environment created")
    else:
        print("✅ Virtual environment already exists")
    
    # Activate virtual environment and install dependencies
    if os.name == 'nt':  # Windows
        pip_path = venv_path / 'Scripts' / 'pip.exe'
        python_path = venv_path / 'Scripts' / 'python.exe'
    else:  # Unix/Linux/Mac
        pip_path = venv_path / 'bin' / 'pip'
        python_path = venv_path / 'bin' / 'python'
    
    print("📦 Installing dependencies...")
    subprocess.run([str(pip_path), 'install', '--upgrade', 'pip'], check=True)
    subprocess.run([str(pip_path), 'install', '-r', 'requirements.txt'], check=True)
    print("✅ Dependencies installed")
    
    return str(python_path)

def setup_vercel_cli():
    """Install Vercel CLI globally."""
    print("\n🚀 Setting up Vercel CLI...")
    
    try:
        subprocess.run(['vercel', '--version'], capture_output=True, check=True)
        print("✅ Vercel CLI already installed")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("📦 Installing Vercel CLI...")
        try:
            subprocess.run(['npm', 'install', '-g', 'vercel'], check=True)
            print("✅ Vercel CLI installed")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install Vercel CLI: {e}")
            return False

def create_env_template():
    """Create environment variable template."""
    print("\n📝 Creating environment template...")
    
    env_template = """# ClamFlow Environment Variables
# Copy .env.production to .env and fill in your values

# Database Configuration (from Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.ozbckmkhxaldcxbqxwlu.supabase.co:5432/postgres
POSTGRES_HOST=db.ozbckmkhxaldcxbqxwlu.supabase.co
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=[your-supabase-password]

# Supabase Configuration
SUPABASE_URL=https://ozbckmkhxaldcxbqxwlu.supabase.co
SUPABASE_ANON_KEY=[your-supabase-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-supabase-service-role-key]

# Frontend Variables
NEXT_PUBLIC_SUPABASE_URL=https://ozbckmkhxaldcxbqxwlu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-supabase-anon-key]

# Deployment Configuration
API_BASE_URL=https://clamflowcloud.vercel.app
VERCEL_TOKEN=[your-vercel-token]
PYTHON_PATH=/usr/bin/python3

# Environment
VERCEL_ENV=development
"""
    
    with open('.env.template', 'w') as f:
        f.write(env_template)
    
    print("✅ Created .env.template")
    
    if not Path('.env').exists():
        print("📋 Copying template to .env...")
        shutil.copy('.env.template', '.env')
        print("✅ Created .env file")
        print("\n⚠️  IMPORTANT: Edit .env file with your actual credentials!")
    else:
        print("ℹ️  .env file already exists (not overwritten)")

def verify_database_connection(python_path):
    """Test database connection."""
    print("\n🔍 Testing database connection...")
    
    test_script = """
import os
from clamflow.database import check_database_connection, get_database_info
import json

try:
    info = get_database_info()
    print("Database Info:", json.dumps(info, indent=2))
    
    if check_database_connection():
        print("✅ Database connection successful")
    else:
        print("❌ Database connection failed")
        print("Check your DATABASE_URL in .env file")
except Exception as e:
    print(f"❌ Database test failed: {e}")
"""
    
    try:
        result = subprocess.run([
            python_path, '-c', test_script
        ], capture_output=True, text=True, timeout=30)
        
        print(result.stdout)
        if result.stderr:
            print("Errors:", result.stderr)
            
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print("❌ Database connection test timed out")
        return False
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def main():
    """Main setup process."""
    print("🌊 ClamFlow Environment Setup")
    print("=" * 50)
    
    # Step 1: Check prerequisites
    if not check_prerequisites():
        sys.exit(1)
    
    # Step 2: Set up Python environment
    python_path = setup_python_environment()
    
    # Step 3: Set up Vercel CLI
    if not setup_vercel_cli():
        print("⚠️  Vercel CLI setup failed, but you can continue")
    
    # Step 4: Create environment template
    create_env_template()
    
    # Step 5: Test database (if .env is configured)
    if Path('.env').exists():
        env_vars = {}
        with open('.env', 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env_vars[key] = value
        
        if env_vars.get('DATABASE_URL') and '[' not in env_vars['DATABASE_URL']:
            # Load environment variables
            for key, value in env_vars.items():
                os.environ[key] = value
            
            if verify_database_connection(python_path):
                print("✅ Database connection verified")
            else:
                print("⚠️  Database connection failed - check your credentials")
    
    print("\n🎉 Environment setup complete!")
    print("\n📋 Next Steps:")
    print("1. Edit .env file with your actual credentials")
    print("2. Test locally: python dev.py")
    print("3. Deploy: python local_deploy.py")
    print("4. Push to GitHub for automated deployment")
    
    print("\n🔗 Useful Commands:")
    print("- Local development: python dev.py")
    print("- Local deployment: python local_deploy.py")
    print("- Database migration: python -c 'from clamflow.models import Base; from clamflow.database import engine; Base.metadata.create_all(bind=engine)'")
    print("- Test API: curl http://localhost:8000/docs")

if __name__ == "__main__":
    main()
