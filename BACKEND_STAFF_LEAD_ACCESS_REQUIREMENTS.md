# Backend Configuration Required: Staff Lead Role Access

**Created**: January 28, 2026  
**Status**: ✅ BACKEND UPDATED  
**Updated**: January 28, 2026  
**Priority**: COMPLETED  

---

## Problem Summary

The **Staff Lead** role MUST have access to the following features that are currently restricted:

### Staff Lead Core Responsibilities:

| Responsibility | Required Endpoints | Current Status |
|---------------|-------------------|----------------|
| **1. Supplier/Agent Onboarding** | `/api/onboarding/*`, `/api/gate/suppliers` | ✅ Has Access |
| **2. ALL Security Events** | `/api/security/events` | ✅ UPDATED |
| **3. Security Attendance Monitoring** | `/api/staff/attendance`, `/attendance/*` | ✅ UPDATED |
| **4. ALL Security Camera Outputs** | `/api/security/cameras`, `/api/security/face-detection` | ✅ UPDATED |
| **5. Staff Locations** | `/api/staff/locations` | ✅ UPDATED |

**Note**: Shift Scheduling remains with Production Supervisor - Staff Lead only monitors.

---

## Complete List of Endpoints Requiring Staff Lead Access

### Security Endpoints (`/api/security/*` or `/security/*`)

| Endpoint | Method | Description | Staff Lead Access |
|----------|--------|-------------|-------------------|
| `/api/security/cameras` | GET | List ALL security cameras | ✅ ADDED |
| `/api/security/events` | GET | ALL security events/alerts | ✅ ADDED |
| `/api/security/face-detection` | GET | Face detection logs | ✅ ADDED |
| `/api/security/unauthorized` | GET | Unauthorized access attempts | ✅ ADDED |

### Staff/Attendance Endpoints (`/api/staff/*` or `/attendance/*`)

| Endpoint | Method | Description | Staff Lead Access |
|----------|--------|-------------|-------------------|
| `/api/staff/attendance` | GET | Staff attendance records | ✅ ADDED |
| `/api/staff/locations` | GET | Current staff locations | ✅ ADDED |
| `/api/staff/performance` | GET | Staff performance metrics | ❌ NO - Production/QC domain |
| `/attendance/log` | POST | Log attendance | ✅ Already has access |
| `/attendance/override` | POST | Override attendance | ✅ Already has access |

**Note**: Staff Lead manages functions OUTSIDE of Production & QC areas. Performance metrics for Production/QC staff remain under Production Lead and QC Lead jurisdiction.

### Onboarding Endpoints (Already Has Access - Verified)

| Endpoint | Method | Description | Staff Lead Access |
|----------|--------|-------------|-------------------|
| `/api/onboarding/` | POST | Submit onboarding request | ✅ Confirmed |
| `/api/onboarding/pending` | GET | Get pending requests | ✅ Confirmed |
| `/api/gate/suppliers` | GET | Supplier list | ✅ Confirmed |

---

## ✅ Backend Code Changes COMPLETED

### 1. Security Router - Staff Lead ADDED to ALL endpoints

**File**: `app/routers/security.py`

```python
# UPDATED - All security endpoints now include "Staff Lead"

@router.get("/cameras")
async def get_camera_status(
    current_user: dict = Depends(require_role(["Super Admin", "Admin", "Staff Lead"]))  # ✅ ADDED
):

@router.get("/events")
async def get_security_events(
    current_user: dict = Depends(require_role(["Super Admin", "Admin", "Staff Lead"]))  # ✅ ADDED
):

@router.get("/face-detection")
async def get_face_detection_events(
    current_user: dict = Depends(require_role(["Super Admin", "Admin", "Staff Lead"]))  # ✅ ADDED
):

@router.get("/unauthorized")
async def get_unauthorized_attempts(
    current_user: dict = Depends(require_role(["Super Admin", "Admin", "Staff Lead"]))  # ✅ ADDED
):
```

### 2. Staff Dashboard Router - Staff Lead ADDED

**File**: `app/routers/staff_dashboard.py`

```python
# UPDATED - Staff monitoring endpoints now include "Staff Lead"

@router.get("/attendance")
async def get_live_attendance(
    current_user: dict = Depends(require_role(["Super Admin", "Admin", "Staff Lead"]))  # ✅ ADDED
):

@router.get("/locations")
async def get_staff_locations(
    current_user: dict = Depends(require_role(["Super Admin", "Admin", "Staff Lead"]))  # ✅ ADDED
):

# NOTE: /performance endpoint does NOT include Staff Lead (as intended)
# Performance metrics for Production/QC staff are managed by their respective Leads
```

### 3. Attendance Router - Already Has Staff Lead Access

**File**: `api/attendance/routes.py`

```python
# Already configured - Staff Lead has access to:
# - POST /api/attendance/log (logging attendance)
# - POST /api/attendance/override (manual override)
```

---

## Quick Reference: Files Modified

| File Path | Endpoints Updated | Status |
|-----------|-------------------|--------|
| `app/routers/security.py` | `/cameras`, `/events`, `/face-detection`, `/unauthorized` | ✅ DONE |
| `app/routers/staff_dashboard.py` | `/attendance`, `/locations` | ✅ DONE |
| `api/attendance/routes.py` | `/log`, `/override` | ✅ Already had access |

---

## Staff Lead Role Definition (Updated)

```python
"Staff Lead": {
    "level": 5,
    "description": "Manages ALL functions OUTSIDE of Production & QC areas",
    "capabilities": {
        "create_users": "Staff only",
        "approve_forms": "Onboarding",
        "access_dashboard": "Staff Lead Dashboard",
        "manage_hardware": False,
        "gate_control": False,
        
        # Security Oversight - FULL ACCESS
        "view_security_cameras": True,      # All camera feeds
        "view_security_events": True,       # All security alerts
        "view_face_detection": True,        # Face detection logs
        
        # Staff Monitoring (Read-Only) - Attendance & Locations only
        "view_staff_attendance": True,      # Attendance records
        "view_staff_locations": True,       # Current locations
        "view_staff_performance": False,    # ❌ NO - Production/QC domain
        
        # Supplier Management
        "submit_onboarding": True,          # Submit for Admin approval
        "view_suppliers": True,             # View supplier list
    }
}
```

---

## Summary of Changes COMPLETED

**`"Staff Lead"` ADDED to these role checks:**

1. ✅ `GET /api/security/cameras` - View all camera feeds - **DONE**
2. ✅ `GET /api/security/events` - View all security events - **DONE**
3. ✅ `GET /api/security/face-detection` - View face detection logs - **DONE**
4. ✅ `GET /api/security/unauthorized` - View unauthorized access - **DONE**
5. ✅ `GET /api/staff/attendance` - View attendance monitoring - **DONE**
6. ✅ `GET /api/staff/locations` - View staff locations - **DONE**

**NOT added (as intended):**
- ❌ `GET /api/staff/performance` - This is Production/QC domain (managed by Production Lead & QC Lead)

---

## Frontend Integration Ready

The Staff Lead Dashboard can now access:

- 📹 **Security & Surveillance** - Live camera feeds, security events, face detection
- 👥 **Staff Management** - Attendance monitoring, staff locations
- 🚚 **Supplier Onboarding** - Already working

---

## ✅ Frontend Changes COMPLETED (January 28, 2026)

### Files Modified:

| File | Changes Made |
|------|-------------|
| `src/components/dashboards/StaffLeadDashboard.tsx` | Removed `restricted` flags from Security & Staff nav items; Replaced `AccessRestrictedPanel` with actual components |
| `src/components/dashboards/stafflead/SupervisionOverview.tsx` | Added API calls to security/staff endpoints; Updated stats grid to show real data |
| `src/components/dashboards/stafflead/StaffLeadStaffPanel.tsx` | **NEW** - Staff panel showing attendance & locations (excludes performance) |

### Navigation Items Updated:
```tsx
// BEFORE (restricted)
{ id: 'security', label: 'Security & Surveillance', icon: '🔒', restricted: true },
{ id: 'staff', label: 'Staff Management', icon: '👥', restricted: true },

// AFTER (accessible)
{ id: 'security', label: 'Security & Surveillance', icon: '📹', restricted: false },
{ id: 'staff', label: 'Staff Management', icon: '👥', restricted: false },
```

### API Endpoints Now Fetched in SupervisionOverview:
- `clamflowAPI.getSecurityEvents()` - Security alerts count
- `clamflowAPI.getStaffAttendance()` - Attendance data
- `clamflowAPI.getStaffLocations()` - Staff locations

### Components Now Available:
- `SecuritySurveillance` - Reused from operations dashboards
- `StaffLeadStaffPanel` - New component for attendance & locations (no performance)

---

*Document updated: January 28, 2026*
*Backend permissions updated successfully ✅*
*Frontend integration completed successfully ✅*
