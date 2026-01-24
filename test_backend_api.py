# Test Backend Login API
# This will show us what the backend expects

import requests
import json

# Backend URL
backend_url = "https://clamflow-backend-production.up.railway.app"

# Test 1: Try to login (will fail but shows us the error)
print("=" * 60)
print("TEST 1: Login Attempt")
print("=" * 60)

response = requests.post(
    f"{backend_url}/auth/login",
    json={"username": "SA_Motty", "password": "Phes0061"}
)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
print()

# Test 2: Check if there's a user creation endpoint
print("=" * 60)
print("TEST 2: Check Backend Health/Docs")
print("=" * 60)

try:
    health_response = requests.get(f"{backend_url}/docs")
    print(f"Docs Status: {health_response.status_code}")
    print("Backend is online. Check /docs for available endpoints")
except:
    print("Could not reach /docs")

print()
print("=" * 60)
print("NEXT STEPS:")
print("=" * 60)
print("1. Go to: https://clamflow-backend-production.up.railway.app/docs")
print("2. Find the user creation endpoint (usually POST /users or /auth/register)")
print("3. Create the user through the API with password 'Phes0061'")
print("=" * 60)
