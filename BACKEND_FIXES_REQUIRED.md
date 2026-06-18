# ClamFlow Backend — Fixes Required & API Contract

**Merged from**: `BACKEND_ROUTER_FIXES_REQUIRED.md` + `BACKEND_FRONTEND_FIXES_REQUIRED.md`  
**Router audit date**: February 27, 2026 | **Onboarding fix date**: May 28, 2026  
**Last Updated**: June 18, 2026

> ⚠️ **Active production failures as of June 18, 2026:** The shift scheduling feature is partially broken because `GET/POST /api/shifts/shift-assignments` does not exist on the backend. See [Missing Endpoints](#missing-endpoints-not-yet-implemented) section below.

> **How to use this document:** Work through fixes in priority order (P0 first).  
> The frontend has been updated to expect exactly the endpoints listed in the Full API Contract section.  
> All backend responses must use **snake_case** keys — the frontend auto-converts to camelCase.

---

## Table of Contents

1. [**Missing Endpoints (Implement These)**](#missing-endpoints-not-yet-implemented) ← **Start here — active 404s**
2. [P0 — Critical Security Fixes](#p0--critical-security-fixes)
3. [P1 — Route Collision Fixes](#p1--route-collision-fixes)
4. [P2 — Station Data Audit](#p2--station-data-audit)
5. [P3 — Authentication Unification](#p3--authentication-unification)
6. [P4 — Dead Code Removal](#p4--dead-code-removal)
7. [P5 — Bug Fixes](#p5--bug-fixes)
8. [P6 — Technical Debt](#p6--technical-debt)
9. [Onboarding Module Bugs (all fixed)](#onboarding-module-bugs)
10. [Full Frontend API Contract](#full-frontend-api-contract)
11. [Response Format Standard](#response-format-standard)

---

## Missing Endpoints (Not Yet Implemented)

> These endpoints are called by the live frontend today. They do not exist on the backend — the router either has no handler registered or the entire sub-route is absent. Each one listed here currently returns **HTTP 404**.

---

### 1. Shift Assignments CRUD — `GET/POST/PUT/DELETE /api/shifts/shift-assignments`

**Why it's needed:** The shift scheduling calendar (`/shift-scheduling`) fully loads (staff list and shift definitions both work), but every drag-and-drop assignment and every page load returns 404 because the assignments sub-routes don't exist.

**Current backend state:** `/api/shifts/shift-definitions` ✅ works · `/api/shifts/staff-for-scheduler` ✅ works · `/api/shifts/shift-assignments` ❌ missing.

**Database table required:**
```sql
CREATE TABLE shift_assignments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id            UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  shift_definition_id UUID NOT NULL REFERENCES shift_definitions(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  plant               VARCHAR(10) NOT NULL CHECK (plant IN ('PPC', 'FP')),
  status              VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_shift_assignment
  ON shift_assignments (staff_id, shift_definition_id, date);
```

**Endpoints to implement:**

#### `GET /api/shifts/shift-assignments`
```
Query params:
  start_date  string  YYYY-MM-DD  (optional)
  end_date    string  YYYY-MM-DD  (optional)
  plant       string  PPC | FP    (optional)
  staff_id    UUID                (optional)

Response 200:
[
  {
    "id":                   "uuid",
    "staff_id":             "uuid",
    "shift_definition_id":  "uuid",
    "date":                 "YYYY-MM-DD",
    "plant":                "PPC" | "FP",
    "status":               "scheduled" | "completed" | "cancelled" | "no_show",
    "notes":                "string" | null,
    "created_at":           "ISO datetime",
    "updated_at":           "ISO datetime"
  }
]
```

#### `POST /api/shifts/shift-assignments`
```
Request body:
{
  "staff_id":             "uuid",           // required
  "shift_definition_id":  "uuid",           // required
  "date":                 "YYYY-MM-DD",     // required
  "plant":                "PPC" | "FP",    // required
  "notes":                "string"          // optional
}

Response 201: same shape as GET single item above
Response 409: { "detail": "Staff member already assigned to this shift on this date" }
Auth: requires JWT — any role in ['Production Lead','QC Lead','Staff Lead','Admin','Super Admin']
```

#### `GET /api/shifts/shift-assignments/{assignment_id}`
```
Response 200: single ShiftAssignment object (same shape as above)
Response 404: { "detail": "Assignment not found" }
```

#### `PUT /api/shifts/shift-assignments/{assignment_id}`
```
Request body (all fields optional — partial update):
{
  "shift_definition_id":  "uuid",
  "date":                 "YYYY-MM-DD",
  "plant":                "PPC" | "FP",
  "status":               "scheduled" | "completed" | "cancelled" | "no_show",
  "notes":                "string"
}

Response 200: updated ShiftAssignment object
```

#### `DELETE /api/shifts/shift-assignments/{assignment_id}`
```
Response 204: no body
Response 404: { "detail": "Assignment not found" }
```

**Additional action:** The shifts router is currently mounted at the root level (`/shifts/`). It must be moved to `/api/shifts/` so all its routes are reachable at the paths the frontend expects. `shift-definitions` and `staff-for-scheduler` appear to work, which suggests the router may already be at `/api/shifts/` in the current Railway deployment — but `shift-assignments` sub-routes are simply absent from the router file.

---

### 2. Shifts Router Path — Confirm prefix is `/api/shifts/`

**Current state:** `shift-definitions` and `staff-for-scheduler` return 200 at `/api/shifts/...` → the prefix is already correct in the deployed version. No path change needed; just implement the missing `shift-assignments` routes above.

---

### 3. Attendance Override — `POST /api/attendance/override`

**Why it's needed:** When a staff member fails face recognition + RFID at the gate, the Security Guard logs an override request (stored locally). The supervisor (Production Lead / Staff Lead) then needs to execute the actual override via their dashboard.

**Current state:** Frontend `SECURITY_GUARD_DASHBOARD.md` notes this endpoint is referenced but the backend implementation is unconfirmed. The endpoint is **required by the supervisor override flow**.

```
POST /api/attendance/override

Query params (or body — confirm with backend preference):
  person_id   UUID    (required) — the staff member who failed to authenticate
  reason      string  (required) — override reason text
  location    string  (required) — gate/station location

Response 200:
{
  "success":    true,
  "message":    "Override recorded",
  "logged_by":  "supervisor-uuid",
  "timestamp":  "ISO datetime"
}

Auth: requires JWT role in ['Production Lead', 'Staff Lead', 'Admin', 'Super Admin']
      Security Guard role → 403 Forbidden (by design)
```

---

### 4. Camera Locations — `GET /api/camera/locations` (Low Priority)

**Why it's needed:** Camera location values (`docks`, `main_gate`, `processing`) are hardcoded in two places in the frontend (`SecurityGuardDashboard.tsx` and `security-monitor/page.tsx`). Any new camera the backend adds will not appear in the frontend until a developer manually updates both files.

**Current state:** Endpoint does not exist. Hardcoded values are a temporary workaround.

```
GET /api/camera/locations

Response 200:
[
  { "value": "docks",     "label": "Docks" },
  { "value": "main_gate", "label": "Main Gate" },
  { "value": "processing","label": "Processing" }
]
```

If this endpoint is added, both camera location `<select>` dropdowns in the frontend should be switched to dynamic data fetching.

---

### 5. Box Tally Response Shape — `GET /api/gate/inside-vehicles`

**Why it matters:** The SecurityGuardDashboard defensively handles 3 different response shapes (`data[]`, `data.count`, `data.total`) because the backend shape is unstable. Pick **one** and document it. The frontend should be simplified once confirmed.

**Recommended canonical shape:**
```json
{ "count": 42 }
```

---

## P0 — Critical Security Fixes

**Do these BEFORE any production traffic.**

### Fix 1: Remove All Hardcoded Password Fallbacks

| File | What to Remove/Change |
|------|-----------------------|
| `main.py` | `os.getenv("SUPER_ADMIN_PASSWORD", "Phes0061")` → mandatory env var, crash on missing |
| `main.py` | `os.getenv("JWT_SECRET_KEY", "your-secret-key-...")` → mandatory env var |
| `auth.py` | `SECRET_KEY` fallback → delete file (dead code) |
| `config.py` | `"dev-secret-key-change-in-production"` → remove fallback |
| `database.py` | Hardcoded `Phes0061%24%24%24` in URL fix → use env var only |
| `seed_super_admin.py` | Plaintext `Phes0061` → read from env var |
| `hardware_endpoints/face_recognition.py` | `"your-secret-key-here"` → use `JWT_SECRET_KEY` |

**Validation:** `grep -rn "Phes0061\|your-secret-key\|dev-secret-key" .` should return zero results.

### Fix 2: Fix CORS Configuration

```python
# BROKEN — browsers reject credentials with wildcard origin
allow_origins=["*"],
allow_credentials=True,

# Fix — use the properly configured list from config.py:
from config import ALLOWED_ORIGINS
allow_origins=ALLOWED_ORIGINS,
allow_credentials=True,
```

### Fix 3: Remove Debug/Test Endpoints

| Endpoint | File | Action |
|----------|------|--------|
| `GET /debug` | `main.py` | **DELETE** — leaks Python version, Railway env |
| `POST /test-login` | `main.py` | **DELETE** — bypasses schema validation, uses hardcoded password |
| `GET /test` | `main.py` | **DELETE** — reveals service identity |
| `GET /health/detailed` | `main.py` | **Fix** — currently returns hardcoded `"uptime": "99.9%"` (fake) |

### Fix 4: Unify JWT Secret Key

| File | Currently Reads | Fix |
|------|----------------|-----|
| `main.py` | `JWT_SECRET_KEY` | ✅ Correct |
| `deps.py` | `JWT_SECRET_KEY` | ✅ Correct |
| `auth.py` | `SECRET_KEY` | Delete file (dead code) |
| `hardware_endpoints/face_recognition.py` | `SECRET_KEY` | Change to `JWT_SECRET_KEY` |

---

## P1 — Route Collision Fixes

Six confirmed route prefix collisions where two routers mount to the same path. FastAPI silently lets the last-registered router shadow the first.

### Collision 1: `/api/gate/*`
`api.gate.routes` and `app.routers.gate` both mount at `/api/gate`.  
**Fix:** Move dashboard version to `/api/dashboard/gate` or merge both routers.

### Collision 2: `/api/staff/*`
`api.staff.routes` and `app.routers.staff_dashboard` both mount at `/api/staff`.  
**Fix:** Move `app.routers.staff_dashboard` to `/api/dashboard/staff` or merge.

### Collision 3: `/api/inventory/*`
`api.inventory.routes` and `app.routers.inventory_dashboard` both mount at `/api/inventory`.  
**Fix:** Move `app.routers.inventory_dashboard` to `/api/dashboard/inventory` or merge.

### Collision 4: `/api/attendance`
`api.attendance.routes` and `api.attendance.views` both mount here.  
**Fix:** Consolidate into single router file.

### Collision 5: `/health`
`main.py` and `app.routers.shifts` both define `GET /health`.  
**Fix:** Remove health endpoint from shifts router.

### Collision 6: Hardware Stats
`main.py` defines `/hardware/stats` (root) and `api.hardware_endpoints` defines `/api/hardware/stats`.  
**Fix:** Keep only `/api/hardware/stats` via router, remove inline one from `main.py`.

---

## P2 — Station Data Audit

The frontend shows **"Active Stations: 0 / 18"** because `GET /api/operations/stations` returns 18 objects from `station_definitions`. The frontend dynamically renders `stations.length` — fix the data, it auto-corrects.

1. Audit `station_definitions` table — seed only real facility stations
2. Update seed data accordingly

**Expected station response shape:**
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

| Module | JWT Library | Secret | Action |
|--------|------------|--------|--------|
| `main.py` | `PyJWT` | `JWT_SECRET_KEY` | ✅ Keep |
| `deps.py` | `PyJWT` | `JWT_SECRET_KEY` | ✅ Keep |
| `auth.py` | `python-jose` | `SECRET_KEY` | **Delete** (dead code) |
| `face_recognition.py` | `PyJWT` | `SECRET_KEY` | **Fix env var name** |

### Frontend Auth Contract

`POST /auth/login` expects:
```json
// Request
{ "username": "string", "password": "string" }

// Response
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "string",
    "full_name": "string",
    "role": "Super Admin|Admin|Production Lead|QC Lead|Staff Lead|QC Staff|Production Staff|Security Guard",
    "station": "string" | null,
    "is_active": true,
    "requires_password_change": false,
    "first_login": false
  }
}
```

**Roles must be Title Case with spaces** as shown above.

### Fix: `/user/profile` Must Query Database

Currently decodes JWT and returns payload — stale data persists 24 hours after role changes.  
**Fix:** Query `UserProfile` from database using JWT's `user_id`.

### Fix: Wire Up Failed Login Tracking

`failed_login_attempts` and `account_locked_until` columns exist but are never used.  
**Fix:** Increment on failed login, lock after 5 failures, reset on success.

---

## P4 — Dead Code Removal

| File | Reason |
|------|--------|
| `auth.py` (root) | Uses `python-jose`, never imported by any route |
| `api/__init__.py` | Assembles `api_router` with `/api/v1` prefix — **never mounted** |
| `api/api_router.py` | Simple router with `/health` — **never mounted** |
| `api/admin_hardware.py` (root) | 12+ endpoints — **never mounted** |
| `api/lots/routes_new.py` | Empty file |
| `api/auth/routes.py` | Only defines `GET /api/auth/health` — all real auth is in `main.py` |

---

## P5 — Bug Fixes

### Staff Face Detection Runtime Crash
`api/staff/routes.py` calls `app.get(img)` where `app` is never defined in that scope. Crashes at runtime when `FACE_RECOGNITION_AVAILABLE=True`.

### Duplicate Decorator
`api/hardware_endpoints.py` has `@router.post("/authenticate-face")` applied **twice**. Remove duplicate.

### Duplicate Schema Classes
`schemas.py` (root, 797 lines) defines these classes twice — second silently overrides first:
- `LotCreate`, `WeightNoteCreate`, `PPCFormCreate`, `FPFormCreate`

**Fix:** Delete the duplicate definitions.

### Duplicate ORM Model
`app/models/user.py` defines a `User` class on `user_profiles` with `extend_existing=True`. Root-level `models.py` already defines `UserProfile` on the same table.  
**Fix:** Delete `app/models/user.py`, use `UserProfile` everywhere.

---

## P6 — Technical Debt

| # | Fix | Effort |
|---|-----|--------|
| 1 | Split `main.py` (909 lines) into focused modules | 4-6 hrs |
| 2 | Standardize API versioning — all routes to `/api/` | 2-3 hrs |
| 3 | Unify `database.py` `Base` — single `declarative_base()` | 2 hrs |
| 4 | Ensure Alembic discovers all models in `app/models/` | 2 hrs |
| 5 | Add rate limiting on `POST /auth/login` | 2 hrs |
| 6 | Replace `datetime.utcnow()` (deprecated Python 3.12+) with `datetime.now(timezone.utc)` | 1 hr |
| 7 | Replace `@app.on_event("startup")` with `lifespan` context manager | 1 hr |
| 8 | Add structured JSON logging + request/response middleware | 4-5 hrs |
| 9 | Add pytest test suite with CI pipeline | 1-2 weeks |
| 10 | Consolidate `api/` and `app/routers/` into single module system | 2-3 days |

---

## Onboarding Module Bugs

> **Status: All fixed.** Backend fixes in commit `cc2e5e0` (2026-05-28). Frontend fixes applied same day.

| # | Bug | Fix Applied |
|---|-----|-------------|
| 1 | `OnboardingPending` model columns don't match route usage — every submission crashes | Replaced model; DB recreated via Supabase SQL |
| 2 | `uuid.uuid4()` NameError on every approval (import was aliased) | Fixed to `uuid_module.uuid4()` |
| 3 | `aadhaar_qr_text` treated as query param in multipart form — always `None` | Changed `= None` → `= Form(None)` |
| 4 | `Form` not imported from `fastapi` | Added to import line |
| 5 | Aadhaar endpoints return `"parsed"` key; frontend expects `"parsed_result"` | Added `_to_aadhaar_result()` helper; renamed key in all 4 endpoints |
| 6 | Parsed Aadhaar has `last4_uid`; frontend expects `uid` + `raw_text` | `_to_aadhaar_result()` maps both fields |
| 7 | Mobile scan sent `qr_text`; backend requires `qr_data` | ✅ Fixed in frontend commit `ec21d59` |
| 8 | `approveOnboarding()` sent no body; route requires `status` | Added `{ status: 'approved', remarks }` body |
| 9 | Admin approval never called `completeOnboarding()` → AWS Rekognition never triggered | `ApprovalWorkflowPanel.tsx` now calls `completeOnboarding()` post-approval |

### Railway Build Fix (2026-05-29)

Deployment `63c9efe7` failed on transient pip network error mid-download. Fix (commit `91c9c64`):

```dockerfile
# Before
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# After — retries on transient failures
RUN pip install --no-cache-dir --retries 5 --upgrade pip && \
    pip install --no-cache-dir --retries 5 -r requirements.txt
```

Deployment `76530b2c` — fully successful. All 36 routers loaded, Supabase connected, healthcheck 200.

> **Note:** Railway logs show `"severity":"error"` on all Python INFO lines — Railway misclassifies stderr. Application is healthy.

---

## Full Frontend API Contract

> The frontend calls exactly these paths. Snake_case keys — auto-converted to camelCase by the frontend transform layer.

### Authentication (root level — no `/api/` prefix)

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/auth/login` | `{ username, password }` → `{ access_token, user }` |
| `POST` | `/auth/face-login` | Face recognition login |
| `POST` | `/auth/change-password` | `{ current_password, new_password }` |
| `GET` | `/user/profile` | JWT in header → `User` object |
| `GET` | `/health` | `{ status, uptime, database, services }` |
| `GET` | `/dashboard/metrics` | `{ total_users, active_users, total_lots, pending_approvals, system_health, last_updated }` |

### Super Admin (`/super-admin/`)

| Method | Path |
|--------|------|
| `GET` | `/super-admin/admins` |
| `POST` | `/super-admin/create-admin` |
| `PUT` | `/super-admin/admins/{id}` |
| `DELETE` | `/super-admin/admins/{id}` |
| `GET` | `/super-admin/api-monitoring` |

### Users (`/api/users/`)

| Method | Path |
|--------|------|
| `GET/POST` | `/api/users/` |
| `PUT/DELETE` | `/api/users/{id}` |

### Operations (`/api/operations/`) — 10-second polling

| Method | Path |
|--------|------|
| `GET` | `/api/operations/stations` |
| `GET` | `/api/operations/active-lots` |
| `GET` | `/api/operations/bottlenecks` |
| `GET` | `/api/operations/live` |

### Gate & Vehicles (`/api/gate/`) — 30-second polling

| Method | Path |
|--------|------|
| `GET` | `/api/gate/vehicles`, `/api/gate/active`, `/api/gate/suppliers`, `/api/gate/checkpoints` |
| `POST` | `/api/gate/vehicle-entry`, `/api/gate/vehicle-exit` |

### Security (`/api/security/`) — 15-second polling

| Method | Path |
|--------|------|
| `GET` | `/api/security/cameras`, `/api/security/events`, `/api/security/face-detection`, `/api/security/unauthorized` |

### Analytics (`/api/analytics/`) — 60-second polling

| Method | Path |
|--------|------|
| `GET` | `/api/analytics/throughput`, `/api/analytics/efficiency`, `/api/analytics/quality`, `/api/analytics/processing-times` |

### Staff (`/api/staff/`) — 30-second polling

| Method | Path |
|--------|------|
| `GET` | `/api/staff/`, `/api/staff/attendance`, `/api/staff/locations`, `/api/staff/performance`, `/api/staff/shifts` |

### Inventory (`/api/inventory/`) — 45-second polling

| Method | Path |
|--------|------|
| `GET` | `/api/inventory/finished-products`, `/api/inventory/items`, `/api/inventory/test-results`, `/api/inventory/ready-for-shipment`, `/api/inventory/pending-approvals` |

### Weight Notes (root level — `/weight-notes/`)

| Method | Path |
|--------|------|
| `GET/POST` | `/weight-notes/` |
| `PUT` | `/weight-notes/{id}` |

> `api-client.ts` also calls `/api/weight-notes/` — backend should support both or consolidate.

### PPC Forms (`/api/ppc-forms/`)

`GET/POST /api/ppc-forms/` · `GET/PUT /api/ppc-forms/{id}` · `POST /api/ppc-forms/{id}/boxes` · `PUT /api/ppc-forms/{id}/submit`

### FP Forms (`/api/fp-forms/`)

`GET/POST /api/fp-forms/` · `GET/PUT /api/fp-forms/{id}` · `POST /api/fp-forms/{id}/boxes` · `PUT /api/fp-forms/{id}/submit` · `POST /api/fp-forms/generate-qr-label`

### QC Workflow (`/api/qc/` + `/api/forms/`)

`GET /api/qc/forms?status=&form_type=` · `GET /api/qc/metrics` · `GET /api/forms/pending` · `PUT /api/forms/{id}/approve|reject|production-lead-approve|qc-lead-approve`

### Approvals (`/api/approval/`)

`GET /api/approval/pending` · `PUT /api/approval/{id}/approve|reject`

### Depuration (`/api/v1/depuration/`)

`GET /api/v1/depuration/forms` · `POST /api/v1/depuration/sample|form` · `PUT /api/v1/depuration/{id}/approve`

### Lots (`/api/v1/lots/`)

`GET/POST /api/v1/lots/` · `GET/PUT /api/v1/lots/{id}`

### Stations (`/api/stations/`)

```
GET/POST  /api/stations/                              (list/create)
GET/PUT/DELETE /api/stations/{id}
GET       /api/stations/with-assignments?date=...
GET/POST  /api/stations/assignments/
GET/PUT/DELETE /api/stations/assignments/{id}
POST      /api/stations/assignments/bulk
DELETE    /api/stations/assignments/by-date/{date}
```

### Shifts (`/api/shifts/`)

> **Note:** Router prefix appears correct in current Railway deployment (`shift-definitions` and `staff-for-scheduler` return 200). The `shift-assignments` sub-routes are simply absent — implement them per [Missing Endpoints §1](#1-shift-assignments-crud--getpostputdelete-apishiftsshift-assignments) above.

| Method | Path | Status |
|--------|------|--------|
| `GET/POST` | `/api/shifts/shift-definitions` | ✅ Working |
| `GET/PUT/DELETE` | `/api/shifts/shift-definitions/{id}` | ✅ Working |
| `GET` | `/api/shifts/staff-for-scheduler` | ✅ Working |
| `GET/POST` | `/api/shifts/shift-assignments` | ❌ **404 — Not implemented** |
| `GET/PUT/DELETE` | `/api/shifts/shift-assignments/{id}` | ❌ **404 — Not implemented** |

### Onboarding (`/api/onboarding/`)

`POST /api/onboarding/staff|supplier|vendor` · `PUT /api/onboarding/{id}/approve|reject` · `GET /api/onboarding/pending`

### RFID (`/api/rfid/`)

`POST /api/rfid/link` · `GET /api/rfid/scan/{tagId}` · `GET /api/rfid/tags` · `PUT /api/rfid/tags/{tagId}`

### Attendance (`/api/attendance/`)

`POST /api/attendance/`

### Hardware Admin (`/api/admin/hardware/`)

`GET /api/admin/hardware/configs|devices|diagnostics|test-history` · `POST /api/admin/hardware/configs` · `POST /api/admin/hardware/devices/{id}/test`

---

## Response Format Standard

```json
// Success — single object (snake_case keys)
{ "station_id": "uuid", "station_name": "...", "status": "idle" }

// Success — array
[ { "station_id": "uuid-1", ... }, { "station_id": "uuid-2", ... } ]

// Success — paginated (frontend auto-unwraps "items", "data", "finished_products", "test_results")
{ "items": [...], "total": 42, "page": 1, "pages": 5 }

// Error
{ "detail": "Error message" }

// Validation error (422)
{ "detail": [ { "loc": ["body", "field"], "msg": "description", "type": "value_error" } ] }
```

---

## Original Audit Grades (February 27, 2026)

| Category | Grade | Notes |
|----------|-------|-------|
| Functionality | B+ | Broad feature coverage |
| Security | D | Hardcoded secrets, wildcard CORS, debug endpoints |
| Architecture | C- | Dual module systems, monolithic main.py, route collisions |
| Code Quality | C | Inconsistent patterns, dead code, duplicate models/schemas |
| Database Design | B | Well-structured relational model, UUIDs, audit fields |
| API Design | C- | Inconsistent versioning, route collisions |
| Testing | D- | No test suite |

**Positive patterns to preserve:** consistent UUID PKs · `created_at`/`updated_at` audit columns · `created_by`/`approved_by` FKs · `CheckConstraint` on lot statuses · lazy DB engine init · `QueuePool` with `pre_ping=True`, `pool_recycle=300` · SSL mode for Supabase.

---

*Document consolidated June 18, 2026*
