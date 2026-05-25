# IT Staff Role — Backend Modification Guide

**Relates to:** `IT_Antony` (Antony Joseph — IT Hardware & Networking)  
**New Role String:** `IT Staff`  
**Prepared:** May 25, 2026  
**Frontend Status:** ✅ Complete (see Steps 2–7 summary below)

---

## Context

The `role` column in Supabase `user_profiles` is plain `text` — no `CHECK` constraint, no PostgreSQL enum.  
Supabase will accept any string. **No SQL migration is required.**

Role validation happens exclusively in FastAPI (Python) Pydantic models and route-level role checks.  
All backend changes below are Python-only.

---

## 1. Supabase — Create the User Account

Run this in the Supabase SQL Editor (or use the dashboard):

```sql
-- 1. Create auth user (replace the UUID with whatever Supabase generates)
-- Easiest: use the Supabase Dashboard → Authentication → Users → "Add User"
--    Email:    antony.joseph@clamflow.internal   (internal placeholder)
--    Password: <set a strong initial password>

-- 2. After the auth user is created, insert the profile row:
INSERT INTO user_profiles (
  id,           -- must match the UUID from supabase auth.users
  username,
  full_name,
  role,
  is_active,
  created_at
) VALUES (
  '<UUID from auth.users>',
  'IT_Antony',
  'Antony Joseph',
  'IT Staff',
  true,
  now()
);
```

> **Login ID:** `IT_Antony`  
> **Role stored in DB:** `IT Staff` (plain text — matches exactly what the frontend `UserRole` type expects)

---

## 2. FastAPI — Pydantic Role Validation

### 2a. Find the `UserRole` Literal / Enum

In the FastAPI codebase, search for the file that defines the allowed role values.  
It is most likely one of:

| Likely file | What to look for |
|---|---|
| `app/schemas/user.py` | `UserRole = Literal[...]` or `class UserRole(str, Enum)` |
| `app/models/user.py` | Same pattern |
| `app/core/roles.py` | Standalone roles module |
| `app/schemas/auth.py` | Role used in login/token response schema |

**Search command (run from backend repo root):**

```bash
grep -rn "Super Admin\|Production Lead\|Gate Staff" app/ --include="*.py"
```

### 2b. Add `'IT Staff'` to the Role Definition

#### If roles use `Literal`:

```python
# BEFORE
UserRole = Literal[
    "Super Admin", "Admin",
    "Production Lead", "QC Lead", "Staff Lead",
    "QC Staff", "Production Staff",
    "Maintenance Staff", "Security Guard", "Gate Staff"
]

# AFTER — add IT Staff
UserRole = Literal[
    "Super Admin", "Admin", "IT Staff",
    "Production Lead", "QC Lead", "Staff Lead",
    "QC Staff", "Production Staff",
    "Maintenance Staff", "Security Guard", "Gate Staff"
]
```

#### If roles use `Enum`:

```python
# BEFORE
class UserRole(str, Enum):
    super_admin = "Super Admin"
    admin       = "Admin"
    # ...

# AFTER — add the new member
class UserRole(str, Enum):
    super_admin = "Super Admin"
    admin       = "Admin"
    it_staff    = "IT Staff"   # ← ADD THIS
    # ...
```

> ⚠️ If `UserRole` appears in more than one file (e.g. imported into multiple schemas), update **all** occurrences.

---

## 3. FastAPI — Route-Level Role Guards

### 3a. Device / Hardware Endpoints

The following backend routes serve the `DeviceRegistry` and `HardwareConfig` frontend components.  
They are likely gated to `["Super Admin", "Admin"]`.  
Add `"IT Staff"` to each allowed-roles list.

| Endpoint | File (likely) | Change |
|---|---|---|
| `GET /api/admin/hardware/devices` | `app/routers/hardware.py` | Add `"IT Staff"` |
| `POST /api/admin/hardware/devices` | `app/routers/hardware.py` | Add `"IT Staff"` |
| `DELETE /api/admin/hardware/devices/{device_id}` | `app/routers/hardware.py` | Add `"IT Staff"` |
| `GET /admin/hardware/configurations/{type}` | `app/routers/hardware.py` | Add `"IT Staff"` |
| `POST /admin/hardware/configurations` | `app/routers/hardware.py` | Add `"IT Staff"` |

**Search command:**

```bash
grep -rn "admin/hardware" app/ --include="*.py"
```

**Typical FastAPI role guard pattern:**

```python
# BEFORE
def require_admin(current_user = Depends(get_current_user)):
    if current_user.role not in ["Super Admin", "Admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")

# AFTER
def require_admin_or_it(current_user = Depends(get_current_user)):
    if current_user.role not in ["Super Admin", "Admin", "IT Staff"]:
        raise HTTPException(status_code=403, detail="Admin or IT Staff access required")
```

Alternatively, if the router uses an inline dependency:

```python
# BEFORE
@router.get("/hardware/devices")
async def get_devices(
    current_user: User = Depends(require_roles(["Super Admin", "Admin"]))
):

# AFTER
@router.get("/hardware/devices")
async def get_devices(
    current_user: User = Depends(require_roles(["Super Admin", "Admin", "IT Staff"]))
):
```

### 3b. RFID Device Handover Endpoint

The `DeviceRFIDHandover` component calls endpoints that link an RFID device to a station staff member.  
These may be under `/api/devices/handover` or `/api/rfid/handover`.

**Search command:**

```bash
grep -rn "handover\|DEVICE_RFID" app/ --include="*.py"
```

Add `"IT Staff"` to the allowed roles for any matching routes.

### 3c. System Health Endpoint (`GET /health`)

This endpoint is called by `ITStaffDashboard` → System Health tab.  
The `/health` endpoint is typically public (no auth required) or limited to Admins.  
If it is auth-gated:

```python
# Add IT Staff to the allowed roles
require_roles(["Super Admin", "Admin", "IT Staff"])
```

### 3d. Audit Log Endpoint (`GET /audit/logs`)

Called by `ITStaffDashboard` → Audit Log tab.  
This is likely restricted to `["Super Admin", "Admin"]`.

```python
# BEFORE
require_roles(["Super Admin", "Admin"])

# AFTER
require_roles(["Super Admin", "Admin", "IT Staff"])
```

---

## 4. FastAPI — Token / JWT Response Schema

When a user logs in, the backend returns a JWT payload that includes the `role` field.  
Ensure the login response schema allows `"IT Staff"` as a valid role value.

**File:** likely `app/schemas/auth.py` or `app/routers/auth.py`

```python
# If there is a response model with role validation, add IT Staff:
class TokenData(BaseModel):
    username: str
    role: UserRole          # this will automatically accept IT Staff once Step 2 is done
    # ...
```

If `role` is typed as `str` (no Literal), no change is needed here.

---

## 5. FastAPI — User Management (Onboarding / User Creation)

When an Admin creates a new user via the user management panel, the `role` field must accept `"IT Staff"`.

**File:** likely `app/routers/users.py` or `app/routers/admin.py`

Check if the create-user endpoint validates `role` against an allowed list:

```bash
grep -rn "role" app/routers/users.py
```

Add `"IT Staff"` if it is in an explicit list. Example:

```python
ALLOWED_ROLES = [
    "Admin", "IT Staff",                    # ← add
    "Production Lead", "QC Lead", "Staff Lead",
    "QC Staff", "Production Staff",
    "Maintenance Staff", "Security Guard", "Gate Staff"
]
```

> **Note:** Admins should be able to create `IT Staff` accounts, but should **not** be able to create `Super Admin` accounts. Ensure `IT Staff` is allowed in the admin user-creation endpoint but not in a position that grants it Admin-level powers.

---

## 6. Endpoints IT Staff Must NOT Access

The following endpoint groups must **remain blocked** for `IT Staff`.  
Do not add `"IT Staff"` to the role guards for these:

| Area | Endpoint prefix | Reason |
|---|---|---|
| User management (Admin panel) | `/api/admin/users`, `/super-admin/` | Not an admin role |
| QC / PPC / FP forms | `/api/qc/`, `/api/ppc/`, `/api/fp/` | Production/QC domain only |
| Shift scheduling | `/api/shifts/` | Staff Lead / Production Lead domain |
| Lot management | `/api/lots/` | Production Lead domain |
| Weight notes | `/api/weight-notes/` | Production domain |
| Attendance override | `/api/attendance/override` | Staff Lead / Production Lead only |
| Gate pass creation | `/api/gate/`, `/api/vehicles/` | Security Guard / Gate Staff domain |
| Visitor pass | `/api/visitors/` | Security Guard / Gate Staff domain |
| Financial / export | `/api/reports/export` | Admin and above only |

---

## 7. Verification Checklist

After deploying the backend changes, verify with the `IT_Antony` account:

| Check | Expected Result |
|---|---|
| `POST /auth/login` with `IT_Antony` credentials | Returns 200 with JWT; `role` field = `"IT Staff"` |
| `GET /api/admin/hardware/devices` with IT Staff token | Returns 200 with device list |
| `POST /api/admin/hardware/devices` with IT Staff token | Returns 201 — device created |
| `GET /health` with IT Staff token | Returns 200 system health |
| `GET /audit/logs` with IT Staff token | Returns 200 audit entries |
| `GET /api/lots/` with IT Staff token | Returns **403** — blocked as expected |
| `GET /api/admin/users` with IT Staff token | Returns **403** — blocked as expected |
| IT Staff dashboard loads in browser | Shows 6-tab dashboard with no crashes |
| Device Registry tab | Shows registered devices, allows add/remove |
| Hardware Config tab | Shows RFID / Face / Printer / QR config forms |
| RFID Handover tab | Shows handover form (DeviceHandoverAccess passes) |
| System Health tab | Shows backend health status |
| Audit Log tab | Shows system audit entries |

---

## 8. Frontend Changes Summary (Already Applied)

For reference — all frontend changes were applied before this document was created:

| File | Change |
|---|---|
| `src/types/auth.ts` | Added `'IT Staff'` to `UserRole` union; added to `ROLE_DISPLAY_NAMES` and `ROLE_HIERARCHY` (level 7); added 6 new permissions (`DEVICE_VIEW`, `DEVICE_REGISTER`, `DEVICE_CONFIGURE`, `DEVICE_DEREGISTER`, `NETWORK_VIEW`, `NETWORK_CONFIGURE`); added `ROLE_PERMISSIONS['IT Staff']` |
| `src/components/auth/RoleBasedAccess.tsx` | Added `ITStaffAccess` convenience component (`allowedRoles: ['Super Admin', 'Admin', 'IT Staff']`) |
| `src/app/dashboard/page.tsx` | Added `'IT Staff'` to `DASHBOARD_ROLES`, `getPageTitle()`, and `renderDashboard()` with import of `ITStaffDashboard` |
| `src/components/dashboards/Dashboard.tsx` | Added `'IT Staff': 'IT Staff'` to `getDisplayRole` role map |
| `src/components/dashboards/ITStaffDashboard.tsx` | **Created** — 6-tab dashboard (Overview, Device Registry, Hardware Config, RFID Handover, System Health, Audit Log) |

Hardware component files (`HardwareConfig.tsx`, `DeviceRegistry.tsx`, `DeviceRFIDHandover.tsx`) required no frontend changes — they are rendered inside the IT Staff dashboard and the `DeviceHandoverAccess` guard is permission-based (IT Staff has `DEVICE_RFID_HANDOVER`).

---

## 9. Notes

- The `'IT Staff'` role string uses Title Case with a space — this is the canonical format for all ClamFlow roles. Ensure the backend stores and compares **exactly** `"IT Staff"` (case-sensitive).
- The Supabase `role` column has no constraint — Supabase will accept the value without any schema changes. The FastAPI Pydantic `UserRole` Literal is the sole enforcement point.
- `IT_Antony` is the login username. The full name stored in `user_profiles.full_name` should be `Antony Joseph`.
