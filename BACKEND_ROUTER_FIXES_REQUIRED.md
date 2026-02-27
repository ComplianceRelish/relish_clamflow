# ClamFlow Backend — Required Fixes & Frontend API Contract

**Date:** February 27, 2026  
**Purpose:** Actionable backend fix list based on verified frontend expectations  
**Frontend Version:** Post-fix (transform layer added, endpoints aligned, bugs fixed)  
**Backend Version Audited:** 2.0.0 (Complete Enterprise Edition)  
**Deployment:** Railway (Dockerized) + Supabase PostgreSQL  

> **How to use this document:** Open the backend codebase and work through the fixes in priority order.  
> The frontend has been updated to expect exactly the endpoints and response shapes listed below.  
> All backend responses should use **snake_case** JSON keys — the frontend auto-converts to camelCase.

---

## Table of Contents

1. [P0 — Critical Security Fixes (Before Production)](#p0--critical-security-fixes)
2. [P1 — Route Collision Fixes](#p1--route-collision-fixes)
3. [P2 — Station Data Audit](#p2--station-data-audit)
4. [P3 — Authentication Unification](#p3--authentication-unification)
5. [P4 — Dead Code Removal](#p4--dead-code-removal)
6. [P5 — Bug Fixes](#p5--bug-fixes)
7. [P6 — Technical Debt](#p6--technical-debt)
8. [Full Frontend API Contract](#full-frontend-api-contract)
9. [Response Format Standard](#response-format-standard)
10. [Appendix: Original Audit Findings](#appendix-original-audit-findings)

---

## P0 — Critical Security Fixes

**Do these BEFORE any production traffic.**

### Fix 1: Remove All Hardcoded Password Fallbacks

| File | Line(s) | What to Remove/Change |
|------|---------|----------------------|
| `main.py` | ~95, ~449 | `os.getenv("SUPER_ADMIN_PASSWORD", "Phes0061")` → **Make env var mandatory, crash on missing** |
| `main.py` | ~73 | `os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")` → **Mandatory env var** |
| `auth.py` | ~12 | `SECRET_KEY` fallback → **Remove entire file (dead code)** |
| `config.py` | ~14 | `"dev-secret-key-change-in-production"` → **Remove fallback** |
| `database.py` | ~27 | Hardcoded `Phes0061%24%24%24` in URL fix → **Use env var only** |
| `seed_super_admin.py` | — | Plaintext `Phes0061` → **Read from env var** |
| `seed_sa_motty_complete.py` | — | Plaintext `Phes0061` → **Read from env var** |
| `hardware_endpoints/face_recognition.py` | ~21 | `"your-secret-key-here"` → **Use `JWT_SECRET_KEY` env var** |

**Validation:** `grep -rn "Phes0061\|your-secret-key\|dev-secret-key" .` should return zero results.

### Fix 2: Fix CORS Configuration

In `main.py` (~lines 58-60), replace:

```python
# BROKEN — browsers reject credentials with wildcard origin
allow_origins=["*"],
allow_credentials=True,
```

With:

```python
# Use the properly configured list from config.py
from config import ALLOWED_ORIGINS
allow_origins=ALLOWED_ORIGINS,
allow_credentials=True,
```

### Fix 3: Remove Debug/Test Endpoints

Remove or gate behind authentication:

| Endpoint | File | Action |
|----------|------|--------|
| `GET /debug` | `main.py` | **DELETE** — leaks Python version, Railway env |
| `POST /test-login` | `main.py` | **DELETE** — bypasses schema validation, uses hardcoded password |
| `GET /test` | `main.py` | **DELETE** — reveals service identity |
| `GET /health/detailed` | `main.py` | **Fix** — currently returns hardcoded `"uptime": "99.9%"` (fake data) |

### Fix 4: Unify JWT Secret Key

All modules must read from `JWT_SECRET_KEY`:

| File | Currently Reads | Fix |
|------|----------------|-----|
| `main.py` | `JWT_SECRET_KEY` | ✅ Correct |
| `deps.py` | `JWT_SECRET_KEY` | ✅ Correct |
| `auth.py` | `SECRET_KEY` | **Delete file** (dead code) |
| `hardware_endpoints/face_recognition.py` | `SECRET_KEY` | **Change to `JWT_SECRET_KEY`** |

---

## P1 — Route Collision Fixes

The backend has **6 confirmed route prefix collisions** where two routers mount to the same path. FastAPI silently lets the last-registered router shadow the first.

**The frontend calls these endpoint paths — the backend must ensure ONE router responds to each:**

### Collision 1: `/api/gate/*`

`api.gate.routes` and `app.routers.gate` both mount at `/api/gate`.

**Frontend expects these endpoints at `/api/gate/`:**

| Method | Path | Response Type |
|--------|------|--------------|
| `GET` | `/api/gate/vehicles` | `VehicleLog[]` |
| `GET` | `/api/gate/active` | `ActiveDelivery[]` |
| `GET` | `/api/gate/suppliers` | `SupplierHistory[]` |
| `GET` | `/api/gate/checkpoints` | `CheckpointHistory[]` |
| `POST` | `/api/gate/vehicle-entry` | Vehicle entry record |
| `POST` | `/api/gate/vehicle-exit` | Vehicle exit record |

**Fix:** Move the dashboard version (`app.routers.gate`) to `/api/dashboard/gate` or merge overlapping endpoints into `api.gate.routes`.

### Collision 2: `/api/staff/*`

`api.staff.routes` and `app.routers.staff_dashboard` both mount at `/api/staff`.

**Frontend expects these endpoints at `/api/staff/`:**

| Method | Path | Response Type |
|--------|------|--------------|
| `GET` | `/api/staff/` | `StaffMember[]` |
| `GET` | `/api/staff/?role=qc` | `StaffMember[]` (filtered) |
| `GET` | `/api/staff/attendance` | `AttendanceRecord[]` |
| `GET` | `/api/staff/locations` | `StaffLocation[]` |
| `GET` | `/api/staff/performance` | `StaffPerformance[]` |
| `GET` | `/api/staff/shifts` | `ShiftSchedule[]` |

**Fix:** Move `app.routers.staff_dashboard` to `/api/dashboard/staff` or merge.

### Collision 3: `/api/inventory/*`

`api.inventory.routes` and `app.routers.inventory_dashboard` both mount at `/api/inventory`.

**Frontend expects these endpoints at `/api/inventory/`:**

| Method | Path | Response Type |
|--------|------|--------------|
| `GET` | `/api/inventory/finished-products` | `FinishedProduct[]` |
| `GET` | `/api/inventory/items` | `InventoryItem[]` |
| `GET` | `/api/inventory/test-results` | `TestResult[]` |
| `GET` | `/api/inventory/ready-for-shipment` | `ReadyForShipment[]` |
| `GET` | `/api/inventory/pending-approvals` | `PendingApproval[]` |

**Fix:** Move `app.routers.inventory_dashboard` to `/api/dashboard/inventory` or merge.

### Collision 4: `/api/attendance`

`api.attendance.routes` and `api.attendance.views` both mount at `/api/attendance`.

**Fix:** Consolidate into single router file.

### Collision 5: `/health`

`main.py` and `app.routers.shifts` both define `GET /health`.

**Fix:** Remove health endpoint from shifts router.

### Collision 6: Hardware Stats

`main.py` defines `/hardware/stats` (root) and `api.hardware_endpoints` defines `/api/hardware/stats`.

**Fix:** Keep only the `/api/hardware/stats` version (via router), remove the inline one from `main.py`.

---

## P2 — Station Data Audit

### The "18 Stations" Problem

The frontend displays **"Active Stations: 0 / 18"** because `GET /api/operations/stations` returns 18 station objects from the `station_definitions` table.

**Action required:**
1. Audit the `station_definitions` table — **only seed stations that exist in the real facility**
2. Document the actual ClamFlow station inventory
3. Update the seed data accordingly

**The frontend dynamically renders `stations.length`** — it does NOT hardcode "18". Fix the data, and the frontend auto-corrects.

### Station Response Shape Expected

`GET /api/operations/stations` must return an array of objects with these fields (snake_case):

```json
{
  "station_id": "uuid",
  "station_name": "Raw Material Receiving",
  "current_operator": "John Doe" | null,
  "current_lot": "LOT-2026-001" | null,
  "status": "active" | "idle" | "maintenance",
  "efficiency": 85.5
}
```

---

## P3 — Authentication Unification

### Current State: 3 Auth Implementations

| Module | JWT Library | Secret Env Var | Status |
|--------|------------|----------------|--------|
| `main.py` | `PyJWT` | `JWT_SECRET_KEY` | **Primary — keep** |
| `deps.py` | `PyJWT` | `JWT_SECRET_KEY` | **Dependency — keep** |
| `auth.py` | `python-jose` | `SECRET_KEY` | **Dead code — DELETE** |
| `face_recognition.py` | `PyJWT` | `SECRET_KEY` | **Fix env var name** |

### Frontend Auth Contract

The frontend sends `POST /auth/login` with:
```json
{ "username": "string", "password": "string" }
```

And expects this response:
```json
{
  "access_token": "jwt-token-string",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "string",
    "full_name": "string",
    "role": "Super Admin" | "Admin" | "Production Lead" | "QC Lead" | "Staff Lead" | "QC Staff" | "Production Staff" | "Security Guard",
    "station": "string" | null,
    "is_active": true,
    "requires_password_change": false,
    "first_login": false
  }
}
```

**Roles must be Title Case with spaces** — the frontend enum is:
```
Super Admin | Admin | Production Lead | QC Lead | Staff Lead | QC Staff | Production Staff | Security Guard
```

### Fix: `/user/profile` Must Query Database

Currently, `GET /user/profile` decodes the JWT and returns the payload. If a user's role or `is_active` status changes after login, stale data persists for 24 hours.

**Fix:** Query `UserProfile` from the database using the JWT's `user_id`.

### Fix: Wire Up Failed Login Tracking

`failed_login_attempts` and `account_locked_until` columns exist on `UserProfile` but are never used.

**Action:** Increment `failed_login_attempts` on failed login, lock account after 5 failures, reset on success.

---

## P4 — Dead Code Removal

These files/constructs are never imported or mounted by any active code:

| File | Reason |
|------|--------|
| `auth.py` (root) | Uses `python-jose`, never imported by any route |
| `api/__init__.py` | Assembles `api_router` with `/api/v1` prefix — **never mounted** |
| `api/api_router.py` | Simple router with `/health` — **never mounted** |
| `api/admin_hardware.py` (root) | 12+ endpoints — **never mounted** (only `api/admin_hardware/routes.py` is) |
| `api/lots/routes_new.py` | Empty file |
| `api/auth/routes.py` | Only defines `GET /api/auth/health` — all real auth is in `main.py` |

**Delete all of the above.**

---

## P5 — Bug Fixes

### Fix: Staff Face Detection Runtime Crash

In `api/staff/routes.py`, the face detection endpoint calls `app.get(img)` where `app` is **never defined in that scope**. This crashes at runtime when `FACE_RECOGNITION_AVAILABLE=True`.

### Fix: Duplicate Decorator

`api/hardware_endpoints.py` has `@router.post("/authenticate-face")` applied **twice** to the same function. Remove the duplicate.

### Fix: Duplicate Schema Classes

`schemas.py` (root, 797 lines) defines these classes **twice** — the second definition silently overrides the first:
- `LotCreate` (~line 36 and ~line 740)
- `WeightNoteCreate`
- `PPCFormCreate`
- `FPFormCreate`

**Fix:** Delete the duplicate definitions, keep the most complete version.

### Fix: Duplicate ORM Model

`app/models/user.py` defines a `User` class mapped to `user_profiles` with `extend_existing=True`. Root-level `models.py` already defines `UserProfile` on the same table.

**Fix:** Delete `app/models/user.py`, use `UserProfile` everywhere.

---

## P6 — Technical Debt

| # | Fix | Estimated Effort |
|---|-----|-----------------|
| 1 | Split `main.py` (909 lines) into focused modules | 4-6 hours |
| 2 | Standardize API versioning — all routes to `/api/` or `/api/v1/` | 2-3 hours |
| 3 | Unify `database.py` `Base` — single `declarative_base()` for all models | 2 hours |
| 4 | Ensure Alembic discovers all models (currently misses `app/models/`) | 2 hours |
| 5 | Add rate limiting on `POST /auth/login` and `POST /auth/face-login` | 2 hours |
| 6 | Replace `datetime.utcnow()` (deprecated Python 3.12+) with `datetime.now(timezone.utc)` | 1 hour |
| 7 | Replace `@app.on_event("startup")` with `lifespan` context manager | 1 hour |
| 8 | Add structured JSON logging + request/response middleware | 4-5 hours |
| 9 | Add pytest test suite with CI pipeline | 1-2 weeks |
| 10 | Consolidate `api/` and `app/routers/` into single module system | 2-3 days |

---

## Full Frontend API Contract

**The frontend has been fixed to call exactly these endpoints. The backend must serve them.**

> All responses use snake_case JSON keys. The frontend auto-converts to camelCase.

### Authentication (root level — NO `/api/` prefix)

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| `POST` | `/auth/login` | `{ username, password }` | `{ access_token, token_type, user: {...} }` |
| `POST` | `/auth/face-login` | Face recognition data | Same as login |
| `POST` | `/auth/change-password` | `{ current_password, new_password }` | `{ success, message }` |
| `GET` | `/user/profile` | — (JWT in header) | `User` object |
| `GET` | `/health` | — | `{ status, uptime, database: {...}, services: {...} }` |

### Dashboard Metrics (root level — NO `/api/` prefix)

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/dashboard/metrics` | `{ total_users, active_users, total_lots, pending_approvals, system_health, last_updated }` |

### Super Admin (`/super-admin/`)

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/super-admin/admins` | `User[]` |
| `POST` | `/super-admin/create-admin` | `User` |
| `PUT` | `/super-admin/admins/{id}` | `User` |
| `DELETE` | `/super-admin/admins/{id}` | `void` |
| `GET` | `/super-admin/api-monitoring` | Monitoring data |

### User Management (`/api/users/`)

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/users/` | `User[]` |
| `POST` | `/api/users/` | `User` |
| `PUT` | `/api/users/{id}` | `User` |
| `DELETE` | `/api/users/{id}` | `void` |

### Operations Monitor (`/api/operations/`) — 10-second polling

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/operations/stations` | `StationStatus[]` (see shape above) |
| `GET` | `/api/operations/active-lots` | `ActiveLot[]` — `{ lot_id, lot_number, current_station, status, entry_time, estimated_completion, progress }` |
| `GET` | `/api/operations/bottlenecks` | `Bottleneck[]` — `{ station_name, queued_lots, avg_wait_time, severity, recommendation }` |
| `GET` | `/api/operations/live` | Combined stations + lots + bottlenecks + timestamp |

### Gate & Vehicles (`/api/gate/`) — 30-second polling

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/gate/vehicles` | `VehicleLog[]` |
| `GET` | `/api/gate/active` | `ActiveDelivery[]` |
| `GET` | `/api/gate/suppliers` | `SupplierHistory[]` |
| `GET` | `/api/gate/checkpoints` | `CheckpointHistory[]` |
| `POST` | `/api/gate/vehicle-entry` | Entry record |
| `POST` | `/api/gate/vehicle-exit` | Exit record |

### Security (`/api/security/`) — 15-second polling

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/security/cameras` | `Camera[]` |
| `GET` | `/api/security/events` | `SecurityEvent[]` |
| `GET` | `/api/security/face-detection` | `FaceDetectionEvent[]` |
| `GET` | `/api/security/unauthorized` | `UnauthorizedAccess[]` |

### Analytics (`/api/analytics/`) — 60-second polling

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/analytics/throughput` | `ThroughputData` — `{ daily: [...], weekly: [...], monthly: [...] }` |
| `GET` | `/api/analytics/efficiency` | `StationEfficiency[]` |
| `GET` | `/api/analytics/quality` | `QualityMetrics` — `{ pass_rate, fail_rate, avg_score, by_station: [...] }` |
| `GET` | `/api/analytics/processing-times` | `ProcessingTime[]` |

### Staff Management (`/api/staff/`) — 30-second polling

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/staff/` | `StaffMember[]` |
| `GET` | `/api/staff/?role=qc` | `StaffMember[]` (filtered) |
| `GET` | `/api/staff/attendance` | `AttendanceRecord[]` |
| `GET` | `/api/staff/locations` | `StaffLocation[]` |
| `GET` | `/api/staff/performance` | `StaffPerformance[]` |
| `GET` | `/api/staff/shifts` | `ShiftSchedule[]` |

### Inventory (`/api/inventory/`) — 45-second polling

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/inventory/finished-products` | `FinishedProduct[]` |
| `GET` | `/api/inventory/items` | `InventoryItem[]` |
| `GET` | `/api/inventory/test-results` | `TestResult[]` |
| `GET` | `/api/inventory/ready-for-shipment` | `ReadyForShipment[]` |
| `GET` | `/api/inventory/pending-approvals` | `PendingApproval[]` |

### Weight Notes (`/weight-notes/` — root level, no `/api/` prefix)

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/weight-notes/` | `WeightNote[]` |
| `POST` | `/weight-notes/` | `WeightNote` |
| `PUT` | `/weight-notes/{id}` | `WeightNote` |

> **Note:** `api-client.ts` also calls `/api/weight-notes/` (with `/api/` prefix). The backend should support BOTH or consolidate under one path.

### PPC Forms (`/api/ppc-forms/`)

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/ppc-forms/` | `PPCForm[]` |
| `POST` | `/api/ppc-forms/` | `PPCForm` |
| `GET` | `/api/ppc-forms/{id}` | `PPCForm` |
| `PUT` | `/api/ppc-forms/{id}` | `PPCForm` |
| `POST` | `/api/ppc-forms/{id}/boxes` | Box record |
| `PUT` | `/api/ppc-forms/{id}/submit` | Submission result |

### FP Forms (`/api/fp-forms/`)

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/fp-forms/` | `FPForm[]` |
| `POST` | `/api/fp-forms/` | `FPForm` |
| `GET` | `/api/fp-forms/{id}` | `FPForm` |
| `PUT` | `/api/fp-forms/{id}` | `FPForm` |
| `POST` | `/api/fp-forms/{id}/boxes` | Box record |
| `PUT` | `/api/fp-forms/{id}/submit` | Submission result |
| `POST` | `/api/fp-forms/generate-qr-label` | `{ qr_code_data, qr_code_image, label_data, generated_at }` |

### QC Workflow (`/api/qc/` + `/api/forms/`)

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/qc/forms?status=&form_type=` | `QCForm[]` |
| `GET` | `/api/qc/metrics` | `{ pending, approved, rejected, by_form_type: {...} }` |
| `GET` | `/api/forms/pending` | `QCForm[]` |
| `PUT` | `/api/forms/{id}/approve` | `ApprovalResponse` |
| `PUT` | `/api/forms/{id}/reject` | `ApprovalResponse` |
| `PUT` | `/api/forms/{id}/production-lead-approve` | `ApprovalResponse` |
| `PUT` | `/api/forms/{id}/qc-lead-approve` | `ApprovalResponse` |

### Approvals (`/api/approval/`)

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/approval/pending` | `ApprovalItem[]` |
| `PUT` | `/api/approval/{id}/approve` | Approval result |
| `PUT` | `/api/approval/{id}/reject` | Rejection result |

### Depuration (`/api/v1/depuration/`)

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/v1/depuration/forms` | `DepurationForm[]` |
| `POST` | `/api/v1/depuration/sample` | Sample extraction result |
| `POST` | `/api/v1/depuration/form` | `DepurationForm` |
| `PUT` | `/api/v1/depuration/{id}/approve` | Approval result |

### Lots (`/api/v1/lots/`)

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/v1/lots/` | `Lot[]` |
| `POST` | `/api/v1/lots/` | `Lot` |
| `GET` | `/api/v1/lots/{id}` | `Lot` |
| `PUT` | `/api/v1/lots/{id}` | `Lot` |

### Stations (`/api/stations/`)

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/stations/` | `StationDefinition[]` |
| `GET` | `/api/stations/?plant_type=PPC&status=operational` | Filtered |
| `GET` | `/api/stations/with-assignments?date=2026-02-27` | `StationWithAssignments[]` |
| `GET` | `/api/stations/{id}` | `StationDefinition` |
| `POST` | `/api/stations/` | `StationDefinition` |
| `PUT` | `/api/stations/{id}` | `StationDefinition` |
| `DELETE` | `/api/stations/{id}` | `void` |
| `GET` | `/api/stations/assignments/` | `StationAssignment[]` |
| `GET` | `/api/stations/assignments/{id}` | `StationAssignment` |
| `POST` | `/api/stations/assignments/` | `StationAssignment` |
| `PUT` | `/api/stations/assignments/{id}` | `StationAssignment` |
| `DELETE` | `/api/stations/assignments/{id}` | `void` |
| `POST` | `/api/stations/assignments/bulk` | `{ created, updated, assignments: [...] }` |
| `DELETE` | `/api/stations/assignments/by-date/{date}` | `void` |

### Shifts (`/api/shifts/`)

| Method | Path | Response |
|--------|------|---------|
| `GET` | `/api/shifts/shift-definitions` | `ShiftDefinition[]` |
| `GET` | `/api/shifts/shift-definitions/{id}` | `ShiftDefinition` |
| `POST` | `/api/shifts/shift-definitions` | `ShiftDefinition` |
| `PUT` | `/api/shifts/shift-definitions/{id}` | `ShiftDefinition` |
| `DELETE` | `/api/shifts/shift-definitions/{id}` | `void` |
| `GET` | `/api/shifts/shift-assignments` | `ShiftAssignment[]` |
| `GET` | `/api/shifts/shift-assignments/{id}` | `ShiftAssignment` |
| `POST` | `/api/shifts/shift-assignments` | `ShiftAssignment` |
| `PUT` | `/api/shifts/shift-assignments/{id}` | `ShiftAssignment` |
| `DELETE` | `/api/shifts/shift-assignments/{id}` | `void` |
| `GET` | `/api/shifts/staff-for-scheduler` | `StaffForScheduler[]` |

> **Note:** The backend currently mounts shifts at ROOT LEVEL (no prefix). They need to be under `/api/shifts/`.

### Onboarding (`/api/onboarding/`)

| Method | Path | Response |
|--------|------|---------|
| `POST` | `/api/onboarding/staff` | `OnboardingResponse` |
| `POST` | `/api/onboarding/supplier` | `OnboardingResponse` |
| `POST` | `/api/onboarding/vendor` | `OnboardingResponse` |
| `PUT` | `/api/onboarding/{id}/approve` | `OnboardingResponse` |
| `PUT` | `/api/onboarding/{id}/reject` | `OnboardingResponse` |
| `GET` | `/api/onboarding/pending` | `OnboardingResponse[]` |

### RFID (`/api/rfid/`)

| Method | Path | Response |
|--------|------|---------|
| `POST` | `/api/rfid/link` | `RFIDTag` |
| `GET` | `/api/rfid/scan/{tagId}` | `RFIDTag` |
| `GET` | `/api/rfid/tags` | `RFIDTag[]` |
| `PUT` | `/api/rfid/tags/{tagId}` | `RFIDTag` |

### Attendance (`/api/attendance/`)

| Method | Path | Response |
|--------|------|---------|
| `POST` | `/api/attendance/` | Attendance record |

### Hardware Admin (`/api/admin/hardware/`)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/admin/hardware/configs` | |
| `POST` | `/api/admin/hardware/configs` | |
| `GET` | `/api/admin/hardware/devices` | |
| `POST` | `/api/admin/hardware/devices/{id}/test` | |
| `GET` | `/api/admin/hardware/diagnostics` | |
| `GET` | `/api/admin/hardware/test-history` | |

---

## Response Format Standard

All endpoints should return JSON with **snake_case keys**:

### Success (single object):
```json
{
  "station_id": "uuid",
  "station_name": "Raw Material Receiving",
  "current_operator": null,
  "status": "idle"
}
```

### Success (list):
```json
[
  { "station_id": "uuid-1", "station_name": "...", ... },
  { "station_id": "uuid-2", "station_name": "...", ... }
]
```

### Success (paginated — frontend auto-unwraps these wrapper keys):
```json
{
  "items": [ ... ],
  "total": 42,
  "page": 1,
  "pages": 5
}
```

The frontend also unwraps `"data"`, `"finished_products"`, and `"test_results"` wrapper keys.

### Error:
```json
{
  "detail": "Error message string"
}
```

Or for validation errors (422):
```json
{
  "detail": [
    { "loc": ["body", "field_name"], "msg": "description", "type": "value_error" }
  ]
}
```

---

## Appendix: Original Audit Findings

The original full audit (February 27, 2026) identified the following grades:

| Category | Grade | Notes |
|----------|-------|-------|
| Functionality | B+ | Broad feature coverage |
| Security | D | Hardcoded secrets, wildcard CORS, exposed debug endpoints |
| Architecture | C- | Dual module systems, monolithic main.py, route collisions |
| Code Quality | C | Inconsistent patterns, dead code, duplicate models/schemas |
| Database Design | B | Well-structured relational model, proper UUIDs, audit fields |
| API Design | C- | Inconsistent versioning, route collisions, no standard error format |
| Testing | D- | No test suite |
| Documentation | B- | Extensive but often outdated |

### Positive patterns to preserve:
- Consistent UUID primary keys
- Proper `created_at` / `updated_at` audit columns
- `created_by` / `approved_by` foreign keys
- `CheckConstraint` on lot status values
- Lazy database engine initialization
- `QueuePool` with `pre_ping=True`, `pool_recycle=300`
- SSL mode enforced for Supabase

---

*Document updated February 27, 2026 — reflects frontend fixes applied same day.*  
*Frontend changes: transform layer, endpoint alignment, bug fixes committed.*  
*Use this document to update the backend to match.*
