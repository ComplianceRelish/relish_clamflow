# ClamFlow Backend API Requirements

**Last Updated:** January 29, 2026  
**Version:** 3.0  
**Status:** Backend Configuration Required

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [New API Endpoints Required](#new-api-endpoints-required)
3. [Database Schema Changes](#database-schema-changes)
4. [Aadhar Verification Integration](#aadhar-verification-integration)
5. [Face Recognition/Biometric API](#face-recognitionbiometric-api)
6. [Staff Lead Access (Previous Requirements)](#staff-lead-access-previous-requirements)
7. [Data Validation Rules](#data-validation-rules)
8. [PWA Offline Sync Considerations](#pwa-offline-sync-considerations)
9. [Testing Checklist](#testing-checklist)

---

## 📌 Executive Summary

The frontend has been updated with new onboarding features. The following backend work is required:

| Component | Status | Priority |
|-----------|--------|----------|
| Aadhar Verification Endpoints | ❌ New | 🔴 HIGH |
| Staff Onboarding Endpoints | ❌ New | 🔴 HIGH |
| Supplier Onboarding Endpoints | ❌ New | 🔴 HIGH |
| Face Registration Mode | ⚠️ Verify | 🔴 HIGH |
| Database Schema Updates | ❌ Required | 🔴 HIGH |
| Staff Lead Access | ✅ Completed | ✅ Done |

---

## 🔌 New API Endpoints Required

### 1. Aadhar Verification Endpoints

These endpoints integrate with UIDAI for Aadhar OTP verification.

#### `POST /aadhar/send-otp`

Initiates Aadhar verification by sending OTP via SMS to registered mobile.

**Request:**
```json
{
  "aadhar_number": "123456789012"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent to registered mobile number",
  "transaction_id": "TXN123456789"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid Aadhar number" | "Service temporarily unavailable"
}
```

**Notes:**
- Aadhar number must be 12 digits
- OTP is sent via SMS through mobile carrier network (not internet)
- Store `transaction_id` for verification step
- Rate limit: Max 3 OTP requests per Aadhar per day

---

#### `POST /aadhar/verify-otp`

Verifies the OTP entered by user.

**Request:**
```json
{
  "aadhar_number": "123456789012",
  "otp": "123456",
  "transaction_id": "TXN123456789"
}
```

**Response (Success):**
```json
{
  "success": true,
  "verified": true,
  "name": "Name as per UIDAI",
  "last_4_digits": "9012",
  "verified_at": "2026-01-29T10:30:00Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid OTP" | "OTP expired" | "Max attempts exceeded"
}
```

**Notes:**
- OTP valid for 10 minutes
- Max 3 verification attempts per OTP
- On success, store verification record in database

---

### 2. Staff Onboarding Endpoints

#### `POST /staff/onboarding-requests`

Submit a new staff onboarding request.

**Authorization:** Bearer Token (Production Lead, Staff Lead, Admin, Super Admin)

**Request:**
```json
{
  "full_name": "John Doe",
  "username": "johndoe",
  "role": "Production Staff",
  "department": "production",
  "phone": "+919876543210",
  "email": "john@example.com",
  "emergency_contact": "+919876543211",
  "start_date": "2026-02-01",
  "initial_station": "Station A",
  "skills": ["weighing", "sorting"],
  "notes": "Experienced worker",
  "onboarding_status": "complete",
  "missing_fields": [],
  "aadhar_details": {
    "aadhar_number": "123456789012",
    "verified": true,
    "verified_at": "2026-01-29T10:30:00Z",
    "verification_method": "otp"
  },
  "bank_details": {
    "bank_name": "State Bank of India",
    "account_number": "12345678901234",
    "ifsc_code": "SBIN0001234",
    "account_holder_name": "John Doe",
    "upi_id": "johndoe@sbi"
  },
  "face_registration": {
    "face_image": "base64_encoded_jpeg",
    "registered": true,
    "registered_at": "2026-01-29T10:35:00Z",
    "face_encoding_id": "FACE_ENC_123"
  },
  "requested_by": "user_uuid",
  "requested_by_name": "Production Lead Name"
}
```

**Response (Success):**
```json
{
  "success": true,
  "id": "onboarding_request_uuid",
  "status": "pending",
  "message": "Onboarding request submitted successfully"
}
```

**Onboarding Status Values:**
- `complete` - All verifications done (Aadhar, Bank, Face)
- `pending_verification` - 1-2 verifications done
- `incomplete` - No verifications done

---

#### `GET /staff/onboarding-requests`

Get list of onboarding requests.

**Authorization:** Bearer Token (Admin, Super Admin)

**Query Parameters:**
- `status`: `pending` | `approved` | `rejected` | `all`
- `department`: `production` | `qc` | `security` | `all`
- `limit`: Number (default 50)
- `offset`: Number (default 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "role": "Production Staff",
      "department": "production",
      "onboarding_status": "complete",
      "status": "pending",
      "requested_by_name": "Production Lead",
      "requested_at": "2026-01-29T10:40:00Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

---

#### `POST /staff/onboarding-requests/{id}/approve`

Approve an onboarding request and create user account.

**Authorization:** Bearer Token (Admin, Super Admin)

**Request:**
```json
{
  "approval_notes": "Verified documents, approved for hire"
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "new_user_uuid",
  "message": "Staff member created successfully"
}
```

**Actions on Approval:**
1. Create user account in `users` table
2. Generate temporary password
3. Copy bank_details, aadhar_details to user record
4. Update onboarding request status to `approved`
5. Send notification (if enabled)

---

#### `POST /staff/onboarding-requests/{id}/reject`

Reject an onboarding request.

**Authorization:** Bearer Token (Admin, Super Admin)

**Request:**
```json
{
  "rejection_reason": "Incomplete documentation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding request rejected"
}
```

---

### 3. Supplier Onboarding Endpoints

#### `POST /suppliers/onboarding`

Submit supplier or agent registration.

**Authorization:** Bearer Token (Staff Lead, Admin, Super Admin)

**Request (Boat Owner/Supplier):**
```json
{
  "type": "boat_owner",
  "first_name": "Ravi",
  "last_name": "Kumar",
  "address": "123 Coastal Road, Kerala",
  "contact_number": "+919876543210",
  "boat_registration_number": "KL-12-ABC-1234",
  "gst_number": "32ABCDE1234F1Z5",
  "aadhar_details": {
    "aadhar_number": "123456789012",
    "verified": true,
    "verified_at": "2026-01-29T10:30:00Z",
    "verification_method": "otp"
  },
  "bank_details": {
    "bank_name": "State Bank of India",
    "account_number": "12345678901234",
    "ifsc_code": "SBIN0001234",
    "account_holder_name": "Ravi Kumar",
    "upi_id": "ravikumar@sbi"
  },
  "face_registration": {
    "face_image": "base64_encoded_jpeg",
    "registered": true,
    "registered_at": "2026-01-29T10:35:00Z",
    "face_encoding_id": "FACE_ENC_456"
  },
  "agent_declarations": [
    {
      "agent_name": "Suresh Agent",
      "agent_phone": "+919876543211",
      "relationship": "Authorized Agent",
      "authorized_activities": ["Delivery", "Weighing", "Payment Collection"],
      "consent_given": true
    }
  ],
  "onboarding_status": "complete",
  "submitted_by": "user_uuid"
}
```

**Request (Agent):**
```json
{
  "type": "agent",
  "first_name": "Suresh",
  "last_name": "Agent",
  "address": "456 Market Road, Kerala",
  "contact_number": "+919876543211",
  "linked_boat_owner_id": "boat_owner_uuid",
  "aadhar_details": { ... },
  "bank_details": { ... },
  "face_registration": { ... },
  "onboarding_status": "complete",
  "submitted_by": "user_uuid"
}
```

**Response:**
```json
{
  "success": true,
  "id": "supplier_uuid",
  "status": "pending",
  "message": "Supplier registration submitted successfully"
}
```

---

### 4. Biometric/Face Registration

#### `POST /biometric/register-face`

Register face encoding for a person.

**Authorization:** Bearer Token

**Request:**
```json
{
  "face_data": "base64_encoded_jpeg_image",
  "person_name": "John Doe",
  "person_type": "staff" | "supplier" | "agent",
  "department": "production" | "qc" | "security",
  "timestamp": "2026-01-29T10:35:00Z"
}
```

**Response (Success):**
```json
{
  "success": true,
  "face_id": "FACE_ENC_789",
  "encoding_id": "FACE_ENC_789",
  "quality_score": 0.95,
  "message": "Face registered successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "No face detected" | "Multiple faces detected" | "Image quality too low"
}
```

**Notes:**
- Image should be JPEG, base64 encoded
- Recommended minimum resolution: 640x480
- Face should be clearly visible, well-lit
- Store face encoding for authentication

---

### 5. Accounts Export Endpoints (Already Exist - Verify)

#### `GET /users`

Returns user list with bank details for export.

**Required Fields in Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "phone": "+919876543210",
      "aadhar_details": {
        "aadhar_number": "123456789012",
        "verified": true
      },
      "bank_details": {
        "bank_name": "State Bank of India",
        "account_number": "12345678901234",
        "ifsc_code": "SBIN0001234",
        "account_holder_name": "John Doe",
        "upi_id": "johndoe@sbi"
      },
      "face_registration": {
        "registered": true
      },
      "created_at": "2026-01-29T10:00:00Z"
    }
  ]
}
```

#### `GET /suppliers`

Returns supplier/agent list with bank details for export.

**Required Fields:** Same structure as above, plus:
- `type`: "boat_owner" | "agent"
- `linked_boat_owner_id`: For agents

---

## 🗄️ Database Schema Changes

### 1. Users Table Updates

```sql
-- Add new columns for onboarding verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhar_number VARCHAR(12);
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhar_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhar_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(11);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS face_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS face_encoding_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(20) DEFAULT 'incomplete';

-- Index for Aadhar lookups
CREATE INDEX IF NOT EXISTS idx_users_aadhar ON users(aadhar_number);
```

### 2. Suppliers Table Updates

```sql
-- Add verification columns
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS aadhar_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS aadhar_verified_at TIMESTAMP;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS account_number VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(11);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS upi_id VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS face_encoding_id VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(20) DEFAULT 'incomplete';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS linked_boat_owner_id UUID REFERENCES suppliers(id);

-- Index for type and status queries
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(type);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(onboarding_status);
```

### 3. New Table: Staff Onboarding Requests

```sql
CREATE TABLE IF NOT EXISTS staff_onboarding_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  full_name VARCHAR(100) NOT NULL,
  username VARCHAR(50),
  role VARCHAR(50) NOT NULL,
  department VARCHAR(20) NOT NULL CHECK (department IN ('production', 'qc', 'security')),
  phone VARCHAR(20),
  email VARCHAR(100),
  emergency_contact VARCHAR(20),
  start_date DATE,
  initial_station VARCHAR(50),
  skills TEXT[],
  notes TEXT,
  
  -- Aadhar Verification
  aadhar_number VARCHAR(12),
  aadhar_verified BOOLEAN DEFAULT FALSE,
  aadhar_verified_at TIMESTAMP,
  
  -- Bank Details (stored as JSONB for flexibility)
  bank_details JSONB,
  
  -- Face Registration
  face_image TEXT,
  face_encoding_id VARCHAR(50),
  
  -- Status Tracking
  onboarding_status VARCHAR(20) DEFAULT 'incomplete' 
    CHECK (onboarding_status IN ('incomplete', 'pending_verification', 'complete')),
  missing_fields TEXT[],
  
  -- Approval Workflow
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID REFERENCES users(id),
  requested_by_name VARCHAR(100),
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  approval_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON staff_onboarding_requests(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_department ON staff_onboarding_requests(department);
CREATE INDEX IF NOT EXISTS idx_onboarding_requested_at ON staff_onboarding_requests(requested_at DESC);
```

### 4. New Table: Agent Declarations

```sql
CREATE TABLE IF NOT EXISTS agent_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_owner_id UUID REFERENCES suppliers(id) NOT NULL,
  agent_name VARCHAR(100) NOT NULL,
  agent_phone VARCHAR(20) NOT NULL,
  relationship VARCHAR(50),
  authorized_activities TEXT[],
  declaration_date TIMESTAMP DEFAULT NOW(),
  consent_given BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMP,
  
  -- Link to agent record when they register
  agent_supplier_id UUID REFERENCES suppliers(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for boat owner lookups
CREATE INDEX IF NOT EXISTS idx_declarations_boat_owner ON agent_declarations(boat_owner_id);
```

---

## 🔐 Aadhar Verification Integration

### Option 1: UIDAI Direct Integration

Requires certified ASA (Authentication Service Agency) or KUA (KYC User Agency) registration.

**Process:**
1. Register as ASA with UIDAI
2. Obtain license and API credentials
3. Implement e-KYC authentication flow

### Option 2: Third-Party Provider

Use a UIDAI-certified provider:
- **Digio** - https://www.digio.in
- **SignDesk** - https://signdesk.com
- **Karza** - https://karza.in
- **Surepass** - https://surepass.io

**Sample Integration (Surepass):**
```python
import requests

SUREPASS_API_KEY = "your_api_key"
SUREPASS_BASE_URL = "https://kyc-api.surepass.io/api/v1"

async def send_aadhar_otp(aadhar_number: str):
    response = requests.post(
        f"{SUREPASS_BASE_URL}/aadhaar-v2/generate-otp",
        headers={"Authorization": f"Bearer {SUREPASS_API_KEY}"},
        json={"id_number": aadhar_number}
    )
    return response.json()

async def verify_aadhar_otp(client_id: str, otp: str):
    response = requests.post(
        f"{SUREPASS_BASE_URL}/aadhaar-v2/submit-otp",
        headers={"Authorization": f"Bearer {SUREPASS_API_KEY}"},
        json={"client_id": client_id, "otp": otp}
    )
    return response.json()
```

---

## 📹 Face Recognition/Biometric API

### Verify Existing Endpoint

The `/biometric/register-face` endpoint may already exist for attendance. Verify it supports:

1. **Registration Mode** (new requirement):
   - Store face encoding with person details
   - Return `face_id` / `encoding_id`
   - Handle image quality validation

2. **Authentication Mode** (existing):
   - Match face against stored encodings
   - Return matched person details

### Sample Implementation

```python
import face_recognition
import base64
import numpy as np
from io import BytesIO
from PIL import Image

@router.post("/biometric/register-face")
async def register_face(
    request: FaceRegistrationRequest,
    current_user: dict = Depends(get_current_user)
):
    # Decode base64 image
    image_data = base64.b64decode(
        request.face_data.split(',')[1] if ',' in request.face_data else request.face_data
    )
    image = Image.open(BytesIO(image_data))
    
    # Convert to numpy array
    image_array = np.array(image)
    
    # Detect faces
    face_locations = face_recognition.face_locations(image_array)
    
    if len(face_locations) == 0:
        raise HTTPException(400, "No face detected in image")
    if len(face_locations) > 1:
        raise HTTPException(400, "Multiple faces detected - please provide image with single face")
    
    # Get face encoding
    face_encoding = face_recognition.face_encodings(image_array, face_locations)[0]
    
    # Store encoding
    face_id = f"FACE_{uuid.uuid4().hex[:12].upper()}"
    
    # Save to database
    await db.execute(
        """INSERT INTO face_encodings (id, person_name, person_type, encoding, created_at) 
           VALUES ($1, $2, $3, $4, NOW())""",
        face_id, request.person_name, request.person_type, face_encoding.tobytes()
    )
    
    return {
        "success": True,
        "face_id": face_id,
        "encoding_id": face_id,
        "quality_score": 0.95
    }
```

---

## 👥 Staff Lead Access (Previous Requirements - COMPLETED)

**Status:** ✅ Completed on January 28, 2026

Staff Lead has been granted access to:

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/security/cameras` | GET | ✅ Added |
| `/api/security/events` | GET | ✅ Added |
| `/api/security/face-detection` | GET | ✅ Added |
| `/api/security/unauthorized` | GET | ✅ Added |
| `/api/staff/attendance` | GET | ✅ Added |
| `/api/staff/locations` | GET | ✅ Added |

**Not Added (Intentional):**
- `/api/staff/performance` - Production/QC domain only

---

## ✅ Data Validation Rules

### Aadhar Number
- Exactly 12 digits
- Numeric only
- First digit cannot be 0 or 1

```python
def validate_aadhar(aadhar: str) -> bool:
    if not aadhar.isdigit() or len(aadhar) != 12:
        return False
    if aadhar[0] in ['0', '1']:
        return False
    return True
```

### Bank Account
- Account Number: 9-18 digits
- IFSC Code: 11 characters (4 letters + 0 + 6 alphanumeric)
- UPI ID: Format `username@bankcode`

```python
import re

def validate_ifsc(ifsc: str) -> bool:
    pattern = r'^[A-Z]{4}0[A-Z0-9]{6}$'
    return bool(re.match(pattern, ifsc))

def validate_upi(upi: str) -> bool:
    pattern = r'^[a-zA-Z0-9._-]+@[a-zA-Z]+$'
    return bool(re.match(pattern, upi))
```

### Phone Number
- Indian format: +91 followed by 10 digits
- First digit of number: 6, 7, 8, or 9

```python
def validate_phone(phone: str) -> bool:
    pattern = r'^\+91[6-9]\d{9}$'
    return bool(re.match(pattern, phone.replace(' ', '')))
```

---

## 🔄 PWA Offline Sync Considerations

The frontend queues operations when offline and syncs when online. Backend should handle:

### 1. Idempotent Operations
- Use client-generated IDs when possible
- Check for duplicate submissions

### 2. Conflict Resolution
- Accept `requested_at` timestamp from client
- Handle out-of-order submissions

### 3. Sync Status Response
```json
{
  "success": true,
  "sync_status": "synced",
  "server_timestamp": "2026-01-29T10:45:00Z",
  "conflicts": []
}
```

---

## ✅ Testing Checklist

### Aadhar Verification
- [ ] Send OTP - valid Aadhar
- [ ] Send OTP - invalid Aadhar (error handling)
- [ ] Verify OTP - correct OTP
- [ ] Verify OTP - incorrect OTP
- [ ] Verify OTP - expired OTP
- [ ] Rate limiting (3 per day)

### Staff Onboarding
- [ ] Submit complete onboarding
- [ ] Submit incomplete onboarding (missing fields tracked)
- [ ] Get pending requests
- [ ] Approve request (user created)
- [ ] Reject request (reason saved)

### Supplier Onboarding
- [ ] Register boat owner
- [ ] Register agent (linked to boat owner)
- [ ] Agent declarations stored

### Face Registration
- [ ] Valid face image - single face
- [ ] No face detected - error
- [ ] Multiple faces - error
- [ ] Low quality image - error

### Accounts Export
- [ ] GET /users returns bank_details
- [ ] GET /suppliers returns bank_details
- [ ] Type filtering works

---

## 📞 Quick Reference

### Endpoints Summary

| Endpoint | Method | Auth Required | Roles |
|----------|--------|---------------|-------|
| `/aadhar/send-otp` | POST | No | Public |
| `/aadhar/verify-otp` | POST | No | Public |
| `/staff/onboarding-requests` | POST | Yes | Production Lead, Staff Lead, Admin |
| `/staff/onboarding-requests` | GET | Yes | Admin, Super Admin |
| `/staff/onboarding-requests/{id}/approve` | POST | Yes | Admin, Super Admin |
| `/staff/onboarding-requests/{id}/reject` | POST | Yes | Admin, Super Admin |
| `/suppliers/onboarding` | POST | Yes | Staff Lead, Admin, Super Admin |
| `/biometric/register-face` | POST | Yes | All authenticated |
| `/users` | GET | Yes | Admin, Super Admin |
| `/suppliers` | GET | Yes | Staff Lead, Admin, Super Admin |

---

**Document Version:** 3.0  
**Author:** GitHub Copilot  
**Last Updated:** January 29, 2026
