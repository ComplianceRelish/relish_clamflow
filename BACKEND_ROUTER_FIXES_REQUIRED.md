# Backend Router Fixes Required

**Date:** February 2, 2026  
**Status:** Pending Backend Configuration  
**Impact:** Face Recognition Login + Type annotation fixes

---

## 🔴 PRIORITY 1: Face Recognition Login Endpoint

The frontend now has Face Recognition Login implemented. The backend needs an endpoint at `/auth/face-login`.

### Option A: Add Route Alias to Existing Endpoint (Recommended)

The backend already has `/biometric/face-login` in `hardware_endpoints/face_recognition.py`. 

**File:** `api/auth/routes.py` (or wherever auth routes are defined)

Add this import and route:

```python
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from database import get_db

# Import the face login function from biometric module
from hardware_endpoints.face_recognition import face_login as biometric_face_login

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Add this route to proxy to the biometric face-login
@router.post("/face-login")
async def face_login(
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Face Recognition Login endpoint.
    Authenticates user by face and returns JWT token.
    """
    return biometric_face_login(image=image, db=db)
```

### Option B: Update Frontend to Use Existing Endpoint

If you prefer not to add a new route, update the frontend instead:

**File:** `src/components/auth/FaceRecognitionLogin.tsx`  
**Line:** ~144

Change:
```typescript
const response = await fetch(`${API_BASE_URL}/auth/face-login`, {
```

To:
```typescript
const response = await fetch(`${API_BASE_URL}/biometric/face-login`, {
```

---

## 🟡 PRIORITY 2: Verify Face Recognition Backend Implementation

### Check `hardware_endpoints/face_recognition.py`

Ensure the `/biometric/face-login` endpoint:

1. **Accepts image upload** via `UploadFile`
2. **Returns JWT token** on successful authentication
3. **Returns user data** in this format:

```python
{
    "success": True,
    "access_token": "jwt_token_here",
    "token_type": "bearer",
    "user": {
        "id": "user_uuid",
        "username": "john.doe",
        "full_name": "John Doe",
        "role": "Staff Lead",
        "station": "Station A",
        "is_active": True,
        "requires_password_change": False,
        "first_login": False
    },
    "message": "Face authentication successful"
}
```

### Required Imports in face_recognition.py

```python
import os
import jwt
import cv2
import numpy as np
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Optional

from face_recognition_unified import get_face_recognition
from database import get_db
from deps import require_role
from models import HardwareConfiguration, Staff, FaceEncoding
```

### Face Login Endpoint Implementation

If the endpoint doesn't exist or is incomplete, here's the full implementation:

```python
# JWT Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def is_face_recognition_enabled(db: Session) -> bool:
    """Check if face recognition is enabled in hardware config."""
    config = db.query(HardwareConfiguration).filter(
        HardwareConfiguration.config_type == "face_recognition"
    ).first()
    return config.enabled if config else True  # Default enabled for dev

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def find_matching_staff(db: Session, face_embedding: np.ndarray, threshold: float = 0.6) -> Optional[Staff]:
    """Find a staff member whose face encoding matches the given embedding."""
    face_encodings = db.query(FaceEncoding).filter(FaceEncoding.is_active == True).all()
    
    for encoding in face_encodings:
        try:
            stored_embedding = np.frombuffer(encoding.encoding_data, dtype=np.float32)
            
            # Calculate cosine similarity
            similarity = np.dot(face_embedding, stored_embedding) / (
                np.linalg.norm(face_embedding) * np.linalg.norm(stored_embedding)
            )
            
            if similarity >= threshold:
                return db.query(Staff).filter(Staff.id == encoding.staff_id).first()
        except Exception as e:
            print(f"Error comparing face encoding: {e}")
            continue
    
    return None

@router.post("/face-login")
def face_login(
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Authenticate a user by face recognition and return JWT token.
    This is the primary face-based login endpoint.
    """
    # Check if face recognition is enabled
    if not is_face_recognition_enabled(db):
        raise HTTPException(
            status_code=503,
            detail="Face recognition is currently disabled"
        )

    # Read and decode image
    try:
        contents = image.file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

    # Get face recognition service
    face_recognition = get_face_recognition()
    
    if not face_recognition.available:
        raise HTTPException(
            status_code=503,
            detail="Face recognition service is not available"
        )
    
    # Get face embedding from uploaded image
    embedding = face_recognition.get_embedding(img)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected in image")
    
    # Find matching staff member
    staff = find_matching_staff(db, embedding)
    
    if staff is None:
        raise HTTPException(
            status_code=401,
            detail="Face not recognized. Please ensure your face is registered or use password login."
        )
    
    # Check if staff is active
    if not staff.is_active:
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    # Create JWT token for authenticated user
    access_token = create_access_token(
        data={
            "sub": str(staff.id),
            "username": staff.username,
            "role": staff.role
        }
    )
    
    # Update last login time
    staff.last_login = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(staff.id),
            "username": staff.username,
            "full_name": staff.full_name or f"{staff.first_name} {staff.last_name}".strip(),
            "role": staff.role,
            "station": getattr(staff, 'station', None),
            "is_active": staff.is_active,
            "requires_password_change": getattr(staff, 'requires_password_change', False),
            "first_login": getattr(staff, 'first_login', False)
        },
        "message": "Face authentication successful"
    }
```

---

## 🟢 PRIORITY 3: Return Type Annotation Fixes

These are type hint fixes - the endpoints work but have incorrect annotations.

**Total Files to Edit:** 6  
**Total Changes:** 18 modifications

All changes involve correcting return type annotations from `Dict[str, Any]` to `List[Dict[str, Any]]` where endpoints actually return arrays.

---

### File 1: `routers/inventory_dashboard.py`

| Line | Current | Replace With |
|------|---------|--------------|
| 23 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |
| 107 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |
| 174 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |
| 240 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |
| 319 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |

---

### File 2: `routers/gate.py`

| Line | Current | Replace With |
|------|---------|--------------|
| 23 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |
| 96 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |
| 171 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |
| 273 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |

---

### File 3: `routers/staff_dashboard.py`

| Line | Current | Replace With |
|------|---------|--------------|
| 23 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |
| 95 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |
| 211 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |

---

### File 4: `routers/security.py`

| Line | Current | Replace With |
|------|---------|--------------|
| 23 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |
| 109 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |
| 185 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |
| 283 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |

---

### File 5: `routers/analytics.py`

| Line | Current | Replace With |
|------|---------|--------------|
| 95 | `) -> Dict[str, Any]:` | `) -> List[Dict[str, Any]]:` |

---

### File 6: `routers/operations.py`

**Remove duplicate error handling (Lines 242-244):**

```python
# Current (BROKEN):
    except Exception as e:
        logger.warning(f"Bottlenecks query failed: {e}")
        return []
        logger.warning(f"Bottlenecks query failed: {e}")
        return []

# Replace with:
    except Exception as e:
        logger.warning(f"Bottlenecks query failed: {e}")
        return []
```

---

## 📋 Implementation Checklist

### Face Recognition (Priority 1)
- [ ] Verify `hardware_endpoints/face_recognition.py` has `/face-login` endpoint
- [ ] Verify endpoint returns JWT token and user data
- [ ] Add `/auth/face-login` alias OR update frontend to use `/biometric/face-login`
- [ ] Test face login from frontend

### Type Annotations (Priority 3)
- [ ] Update 5 endpoints in `inventory_dashboard.py`
- [ ] Update 4 endpoints in `gate.py`
- [ ] Update 3 endpoints in `staff_dashboard.py`
- [ ] Update 4 endpoints in `security.py`
- [ ] Update 1 endpoint in `analytics.py`
- [ ] Fix duplicate code in `operations.py`

---

## Git Commands

```bash
cd "C:\Users\user\Desktop\SOFTWARE DEV\APP Folders\clamflow_backend"

# After making changes:
git add .
git commit -m "feat: Add face recognition login endpoint + fix type annotations"
git push origin main
```

---

## Testing Face Recognition

1. **Start backend locally** (optional):
   ```bash
   cd "C:\Users\user\Desktop\SOFTWARE DEV\APP Folders\clamflow_backend"
   .\venv\Scripts\activate
   uvicorn main:app --reload --port 8000
   ```

2. **Test endpoint with curl**:
   ```bash
   curl -X POST "http://localhost:8000/auth/face-login" \
     -F "image=@test_face.jpg"
   ```

3. **Expected response**:
   ```json
   {
     "success": true,
     "access_token": "eyJhbGciOiJIUzI1NiIs...",
     "token_type": "bearer",
     "user": {
       "id": "uuid-here",
       "username": "john.doe",
       "full_name": "John Doe",
       "role": "Staff Lead"
     },
     "message": "Face authentication successful"
   }
   ```

4. **Test from frontend**:
   - Go to login page
   - Click "Use Face Recognition Instead"
   - Allow camera access
   - Position face and click "Capture & Authenticate"

---

## Database Requirements

Ensure these tables exist:

### `face_encodings` table
```sql
CREATE TABLE IF NOT EXISTS face_encodings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id),
    encoding_data BYTEA NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `hardware_configuration` table
```sql
CREATE TABLE IF NOT EXISTS hardware_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default face recognition config
INSERT INTO hardware_configuration (config_type, enabled, settings)
VALUES ('face_recognition', true, '{"threshold": 0.6}')
ON CONFLICT DO NOTHING;
```
