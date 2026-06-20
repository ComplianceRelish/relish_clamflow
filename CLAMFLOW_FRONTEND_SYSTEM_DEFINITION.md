# ClamFlow Frontend — System Definition

> Derived entirely from source code in `clamflow_frontend/clamflow-frontend/src/`.
> No backend behaviour is inferred or included. Where the frontend calls an API endpoint,
> only the URL/method called by the frontend is recorded; what the endpoint does internally
> is the backend doc's job.
> Generated: 2026-06-19.

---

## 1. Technology Stack & Configuration

**Framework:** Next.js 13+ (App Router) with TypeScript.  
**Styling:** Tailwind CSS.  
**HTTP client:** Axios (`src/services/api.ts` `APIClient` singleton) and native `fetch` (used directly in several components and `src/lib/clamflow-api.ts`).  
**Primary API wrapper:** `ClamFlowAPI` class singleton exported from `src/lib/clamflow-api.ts` as `clamflowAPI`.  
**Auth state:** `React.Context` (`src/context/AuthContext.tsx`). Token and user object are persisted to `localStorage` under keys `clamflow_token` and `clamflow_user`.  
**Token injection:** Two mechanisms coexist:
- `APIClient` (Axios) reads `localStorage.getItem('clamflow_token')` in a request interceptor and adds `Authorization: Bearer <token>`.
- `ClamFlowAPI` (fetch) reads `localStorage.getItem('clamflow_token')` in its constructor and in `getHeaders()`.

**Backend base URL:** Resolved at runtime as:
```ts
process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app'
```
All API calls in every component use this same pattern.

**401 handling:** Both clients redirect to `/login` and clear `localStorage` keys `clamflow_token` and `clamflow_user` on HTTP 401.

**Key response transformation:** `ClamFlowAPI.request()` passes every response through `transformKeysToCamel()` (`src/lib/transform.ts`) — snake_case keys from the backend are converted to camelCase before the data reaches component state.

---

## 2. Supabase / API Calls This Frontend Makes

All calls go to `NEXT_PUBLIC_API_URL`. Bearer token is injected from `localStorage.clamflow_token` unless noted as "No Auth".

### Authentication

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| POST | `/auth/login` | None | JSON `{ username, password }` → `{ access_token, user: { id, username, full_name, role, station, is_active, requires_password_change } }` |
| POST | `/auth/face-login` | None | `multipart/form-data`, field `image` (JPEG blob, `face_capture.jpg`) → `{ success, access_token, user }` |
| POST | `/auth/change-password` | Bearer | JSON `{ current_password, new_password }` |
| GET | `/user/profile` | Bearer | Returns current user profile |

### User Management

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/users/` | Bearer | List all users |
| POST | `/api/users/` | Bearer | JSON `{ username, full_name, role, station, password, phone_number? }` |
| PUT | `/api/users/${userId}` | Bearer | JSON partial user update |
| DELETE | `/api/users/${userId}` | Bearer | Delete user |
| GET | `/api/users/statistics` | Bearer | User statistics |
| GET | `/super-admin/admins` | Bearer | Admin user list (Super Admin only; falls back to `/api/users/`) |
| POST | `/super-admin/create-admin` | Bearer | Create admin user |
| PUT | `/super-admin/admins/${adminId}` | Bearer | Update admin |
| DELETE | `/super-admin/admins/${adminId}` | Bearer | Delete admin |
| GET | `/super-admin/api-monitoring` | Bearer | API monitoring data |

### Lots

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/v1/lots/` | Bearer | List lots |
| POST | `/api/v1/lots/` | Bearer | JSON `{ supplierId, weightNoteId, notes? }` |
| GET | `/api/v1/lots/${lotId}` | Bearer | Get single lot |
| PUT | `/api/v1/lots/${lotId}` | Bearer | JSON `{ status }` |

### Weight Notes

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/weight-notes/` | Bearer | List weight notes |
| POST | `/api/weight-notes/` | Bearer | JSON weight note data |
| PUT | `/api/weight-notes/${noteId}` | Bearer | Approve weight note |

### Workflow (13-step)

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/v1/workflow/${lotId}/status` | Bearer | Full workflow status |
| POST | `/api/v1/workflow/${lotId}/initialize` | Bearer | Initialise lot workflow |
| POST | `/api/v1/workflow/${lotId}/steps/${n}/start` | Bearer | Start step N |
| POST | `/api/v1/workflow/${lotId}/steps/${n}/complete` | Bearer | JSON `{ qc_result?, qc_notes?, reference_type?, reference_id? }` |
| POST | `/api/v1/workflow/${lotId}/steps/${n}/fail` | Bearer | JSON `{ qc_notes }` |
| POST | `/api/v1/workflow/${lotId}/steps/${n}/retry` | Bearer | Retry failed step |

### PPC Forms

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/ppc-forms/` | Bearer | List PPC forms |
| POST | `/api/ppc-forms/` | Bearer | Create PPC form |
| GET | `/api/ppc-forms/${id}` | Bearer | Get single PPC form |
| PUT | `/api/ppc-forms/${id}` | Bearer | Update PPC form |
| POST | `/api/ppc-forms/${id}/boxes` | Bearer | Add box to PPC form |
| PUT | `/api/ppc-forms/${id}/submit` | Bearer | Submit for QC |

### FP Forms

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/fp-forms/` | Bearer | List FP forms |
| POST | `/api/fp-forms/` | Bearer | Create FP form |
| GET | `/api/fp-forms/${id}` | Bearer | Get single FP form |
| PUT | `/api/fp-forms/${id}` | Bearer | Update FP form |
| POST | `/api/fp-forms/${id}/boxes` | Bearer | Add box to FP form |
| PUT | `/api/fp-forms/${id}/submit` | Bearer | Submit for QC |
| POST | `/api/fp-forms/generate-qr-label` | Bearer | Generate QR label for FP box |

### QC Forms & Approval

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/qc/forms?status=&form_type=` | Bearer | List QC forms (filtered) |
| GET | `/api/qc/metrics` | Bearer | QC metrics |
| GET | `/api/forms/pending` | Bearer | Pending QC forms |
| PUT | `/api/forms/${id}/approve` | Bearer | JSON `{ observations? }` |
| PUT | `/api/forms/${id}/reject` | Bearer | JSON `{ rejection_reason }` |
| PUT | `/api/forms/${id}/production-lead-approve` | Bearer | PPC → Gate Pass approval |
| PUT | `/api/forms/${id}/qc-lead-approve` | Bearer | FP → Inventory approval |
| GET | `/api/approval/pending` | Bearer | Pending approval items |
| PUT | `/api/approval/${formId}/approve` | Bearer | JSON `{ form_type }` |
| PUT | `/api/approval/${formId}/reject` | Bearer | JSON `{ rejection_reason? }` |

### Depuration / Testing

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/v1/depuration/forms` | Bearer | List depuration forms |
| POST | `/api/v1/depuration/sample` | Bearer | Extract sample |
| POST | `/api/v1/depuration/form` | Bearer | Submit depuration form |
| PUT | `/api/v1/depuration/${id}/approve` | Bearer | Approve depuration |

### Onboarding

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| POST | `/api/onboarding/staff` | Bearer | JSON — full staff onboarding data including face_image (base64 dataURL), aadhaar_qr_text; sets `status: 'pending'` |
| POST | `/api/onboarding/supplier` | Bearer | JSON supplier data |
| POST | `/api/onboarding/vendor` | Bearer | JSON vendor data |
| PUT | `/api/onboarding/${id}/approve` | Bearer | JSON `{ status: 'approved', remarks? }` |
| PUT | `/api/onboarding/${id}/reject` | Bearer | JSON `{ reason? }` |
| GET | `/api/onboarding/pending` | Bearer | List pending onboarding requests |
| POST | `/api/onboarding/mobile-scan/create` | Bearer | Create Aadhaar mobile scan session → `{ qrImageBase64, mobileUrl, sessionToken, token? }` |
| GET | `/api/onboarding/mobile-scan/${token}/result` | Bearer | Poll session result → `{ status: 'pending'\|'completed', parsedResult? }` |
| POST | `/api/onboarding/scan-aadhaar-image` | Bearer | `multipart/form-data`, field `aadhaar_image` (JPEG File) |
| POST | `/api/onboarding/complete/${personRecordId}` | Bearer | `multipart/form-data`, fields: `face_image`, `aadhaar_image?`, `aadhaar_qr_text?` |
| POST | `/api/onboarding/mobile-scan/${token}/submit` | **None** | JSON `{ qr_text }` — called from mobile scan page |
| POST | `/staff/onboarding-requests` | Bearer | Older component path — note: no `/api/` prefix (see § 6 Gap F-01) |
| POST | `/aadhar/send-otp` | None | JSON `{ aadhar_number }` — from older SupplierOnboarding component (see § 6 Gap F-02) |
| POST | `/aadhar/verify-otp` | None | JSON `{ aadhar_number, otp }` — from older SupplierOnboarding component (see § 6 Gap F-02) |

### Stations

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/stations/?plant_type=&status=` | Bearer | List station definitions |
| GET | `/api/stations/with-assignments?assigned_date=&plant_type=` | Bearer | Stations with staff assignments |
| GET | `/api/stations/${id}` | Bearer | Get single station |
| POST | `/api/stations/` | Bearer | Create station |
| PUT | `/api/stations/${id}` | Bearer | Update station |
| DELETE | `/api/stations/${id}` | Bearer | Delete station |
| GET | `/api/stations/assignments/?...` | Bearer | List assignments (filterable) |
| GET | `/api/stations/assignments/${id}` | Bearer | Get single assignment |
| POST | `/api/stations/assignments/` | Bearer | Create assignment |
| PUT | `/api/stations/assignments/${id}` | Bearer | Update assignment |
| DELETE | `/api/stations/assignments/${id}` | Bearer | Delete assignment |
| POST | `/api/stations/assignments/bulk` | Bearer | Bulk create `{ date, assignments[] }` |
| DELETE | `/api/stations/assignments/by-date/${date}` | Bearer | Clear all assignments for a date |

### Shifts

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/shifts/shift-definitions` | Bearer | List shift definitions |
| GET | `/api/shifts/shift-definitions/${id}` | Bearer | Get single definition |
| POST | `/api/shifts/shift-definitions` | Bearer | Create shift definition |
| PUT | `/api/shifts/shift-definitions/${id}` | Bearer | Update shift definition |
| DELETE | `/api/shifts/shift-definitions/${id}` | Bearer | Delete shift definition |
| GET | `/api/shifts/shift-assignments` | Bearer | List shift assignments (filterable) |
| GET | `/api/shifts/shift-assignments/${id}` | Bearer | Get single assignment |
| POST | `/api/shifts/shift-assignments` | Bearer | Create assignment |
| PUT | `/api/shifts/shift-assignments/${id}` | Bearer | Update assignment |
| DELETE | `/api/shifts/shift-assignments/${id}` | Bearer | Delete assignment |
| GET | `/api/shifts/staff-for-scheduler` | Bearer | Staff list for scheduler |

### Gate & Vehicles

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/gate/vehicles` | Bearer | Vehicle logs |
| GET | `/api/gate/active` | Bearer | Active deliveries |
| GET | `/api/gate/suppliers` | Bearer | Supplier history |
| GET | `/api/gate/checkpoints` | Bearer | Checkpoint history |
| POST | `/api/gate/vehicle-entry` | Bearer | JSON `{ rfid_tags: [], timestamp? }` |
| POST | `/api/gate/vehicle-exit` | Bearer | JSON `{ rfid_tags: [], timestamp? }` |
| GET | `/api/gate/inside-vehicles` | Bearer | Box tally inside gate |

### Security / Surveillance

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/security/cameras` | Bearer | Camera list |
| GET | `/api/security/events` | Bearer | Security events |
| GET | `/api/security/face-detection` | Bearer | Face detection events |
| GET | `/api/security/unauthorized` | Bearer | Unauthorized access events |

### Visitor Pass

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| POST | `/api/visitors/register` | Bearer | JSON `VisitorRegisterRequest` (see §7 for `face_image_b64` format) |
| POST | `/api/visitors/identify` | Bearer | JSON `{ face_image_b64: <raw base64 JPEG>, gate? }` — primary gate-screen endpoint |
| POST | `/api/visitors/verify` | Bearer | JSON `{ face_image_b64: <raw base64 JPEG>, gate? }` |
| GET | `/api/visitors/${passToken}` | Bearer | Scan visitor pass by token |
| GET | `/api/visitors/list?status=&limit=&offset=` | Bearer | Paginated visitor list |
| POST | `/api/visitors/${passToken}/exit?gate=` | Bearer | Log visitor exit |
| POST | `/api/visitors/${passToken}/revoke` | Bearer | Revoke visitor pass |

### Attendance

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/attendance/monitor` | Bearer | On-site attendance list |
| POST | `/api/attendance/log` | Bearer | `multipart/form-data`, fields: `image` (JPEG), `location` (string) |
| POST | `/api/attendance/override?person_id=&reason=&location=` | Bearer | Supervisor override |

### Analytics & Operations

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/operations/stations` | Bearer | Station status |
| GET | `/api/operations/active-lots` | Bearer | Active lots |
| GET | `/api/operations/bottlenecks` | Bearer | Bottlenecks |
| GET | `/api/operations/live` | Bearer | Live operations snapshot |
| GET | `/api/analytics/throughput` | Bearer | Production throughput |
| GET | `/api/analytics/efficiency` | Bearer | Station efficiency |
| GET | `/api/analytics/quality` | Bearer | Quality metrics |
| GET | `/api/analytics/processing-times` | Bearer | Processing times |

### Staff & Inventory

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/api/staff/` | Bearer | All staff |
| GET | `/api/staff/?role=qc` | Bearer | QC staff only |
| GET | `/api/staff/attendance` | Bearer | Attendance records |
| GET | `/api/staff/locations` | Bearer | Staff locations |
| GET | `/api/staff/performance` | Bearer | Staff performance |
| GET | `/api/staff/shifts` | Bearer | Shift schedules |
| GET | `/api/inventory/finished-products` | Bearer | Finished product inventory |
| GET | `/api/inventory/items` | Bearer | Inventory items |
| GET | `/api/inventory/test-results` | Bearer | Test results |
| GET | `/api/inventory/ready-for-shipment` | Bearer | Ready for shipment |
| GET | `/api/inventory/pending-approvals` | Bearer | Pending inventory approvals |

### RFID

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| POST | `/api/rfid/link` | Bearer | JSON `RFIDLinkRequest` |
| GET | `/api/rfid/scan/${tagId}` | Bearer | Scan tag by ID |
| GET | `/api/rfid/latest-scan` | Bearer | Latest RFID scan |
| GET | `/api/rfid/tags` | Bearer | All RFID tags |
| PUT | `/api/rfid/tags/${tagId}` | Bearer | Update tag |

### Dashboard & Health

| Method | Endpoint | Auth | Payload / Notes |
|---|---|---|---|
| GET | `/dashboard/metrics` | Bearer | Dashboard metrics |
| GET | `/health/detailed` | Bearer | System health |
| GET | `/notifications/` | Bearer | Notifications |
| GET | `/dashboard/audit/logs` | Bearer | Audit logs |
| GET | `/admin-dashboard/overview` | Bearer | Admin overview |
| GET | `/admin-dashboard/pending-tasks?limit=N` | Bearer | Admin pending tasks |
| GET | `/admin-dashboard/recent-activity?hours=N` | Bearer | Recent activity |
| GET | `/admin-dashboard/operational-alerts` | Bearer | Operational alerts |

### WebSocket Connections

| URL Pattern | Purpose | Auth |
|---|---|---|
| `ws(s)://<API_BASE>/api/attendance/ws/attendance` | Live attendance events (`AttendanceWsEvent` JSON frames) | None (no WS auth header sent) |
| `ws(s)://<API_BASE>/ws/camera-detections` | Live camera detection events (`CameraDetectionEvent` JSON frames) | None |

`WS_BASE` is derived from `NEXT_PUBLIC_API_URL` by replacing `http(s)://` → `ws(s)://`.  
Both connections auto-reconnect after 5 s on close (`setTimeout(connect, 5000)`).

### Camera MJPEG Poll

```
GET ${API_BASE}/api/hardware/camera-stream/${cameraLocation}?key=${key}
```
Not a WebSocket. Polled via `<img src="..." />` with key refreshed every 2 s by `setInterval(() => setCameraFeedKey(k => k + 1), 2000)`. Used in `SecurityGuardDashboard.tsx` and `src/app/security-monitor/page.tsx`.

---

## 3. Routes / Pages

### App Router (`src/app/`)

| Route | File | Auth Guard | Notes |
|---|---|---|---|
| `/` | `src/app/page.tsx` | None declared | Root redirect |
| `/login` | `src/app/login/page.tsx` | None (public) | Username/password form + face recognition modal |
| `/dashboard` | `src/app/dashboard/page.tsx` | `DASHBOARD_ROLES` check (see §9) | Role-keyed dashboard switcher |
| `/lots` | `src/app/lots/page.tsx` | Auth context | Lot list |
| `/lots/create` | `src/app/lots/create/page.tsx` | Auth context | Create lot |
| `/weight-notes` | `src/app/weight-notes/page.tsx` | Auth context | Weight note list |
| `/weight-notes/approve` | `src/app/weight-notes/approve/page.tsx` | Auth context | QC approval of weight notes |
| `/ppc-forms/approve` | `src/app/ppc-forms/approve/page.tsx` | Auth context | PPC form approval |
| `/qc-forms/approve` | `src/app/qc-forms/approve/page.tsx` | Auth context | QC form approval |
| `/inventory` | `src/app/inventory/add/page.tsx` | Auth context | Inventory add |
| `/inventory/add` | `src/app/inventory/add/page.tsx` | Auth context | Add inventory item |
| `/onboarding/staff` | `src/app/onboarding/staff/page.tsx` | Role check in `useEffect` — authorised roles: `Super Admin, Admin, IT Staff, Production Lead, QC Lead, Staff Lead`; others → `router.push('/dashboard')` | Canonical staff onboarding form |
| `/gate-pass/generate` | `src/app/gate-pass/generate/page.tsx` | Auth context | Gate pass generation |
| `/gate-pass/visitors` | `src/app/gate-pass/visitors/page.tsx` | `AUTHORIZED_ROLES` check — see §9 | Visitor pass management (Register / Verify / Scan / Log tabs) |
| `/mobile-scan/[token]` | `src/app/mobile-scan/[token]/page.tsx` | **None** — token-auth only | Aadhaar QR scanner for mobile handoff |
| `/shift-scheduling` | `src/app/shift-scheduling/page.tsx` | Auth context | Interactive shift calendar |
| `/station-assignment` | `src/app/station-assignment/page.tsx` | Auth context | Station assignment UI |
| `/security-monitor` | `src/app/security-monitor/page.tsx` | Auth context — `if (!user) router.push('/login')` | Real-time security feed |
| `/staff/absences` | `src/app/staff/absences/page.tsx` | Auth context | Staff absence management |
| `/staff/access-control` | `src/app/staff/access-control/page.tsx` | Auth context | Access control management |
| `/testing/depuration` | `src/app/testing/depuration/page.tsx` | Auth context | Depuration form index |
| `/testing/depuration/extract` | `src/app/testing/depuration/extract/page.tsx` | Auth context | Sample extraction |
| `/testing/depuration/report` | `src/app/testing/depuration/report/page.tsx` | Auth context | Report generation |
| `/testing/depuration/test` | `src/app/testing/depuration/test/page.tsx` | Auth context | Depuration test entry |
| `/testing/microbiology` | `src/app/testing/microbiology/page.tsx` | Auth context | Microbiology index |
| `/testing/microbiology/extract` | `src/app/testing/microbiology/extract/page.tsx` | Auth context | Sample extraction |
| `/testing/microbiology/report` | `src/app/testing/microbiology/report/page.tsx` | Auth context | Report upload |
| `/testing/microbiology/test` | `src/app/testing/microbiology/test/page.tsx` | Auth context | Test entry |
| `/devices` | `src/app/devices/page.tsx` | Auth context | Device registry |
| `/devices/handover` | `src/app/devices/handover/page.tsx` | Auth context | RFID device handover |
| `/reports/upload` | `src/app/reports/upload/page.tsx` | Auth context | Report upload |
| `/error` | `src/app/error.tsx` | None | Global error boundary |
| `/not-found` | `src/app/not-found.tsx` | None | 404 page |

### Pages Router (`src/pages/`) — Legacy

| Route | File | Notes |
|---|---|---|
| `/onboarding/staff` | `src/pages/onboarding/staff.tsx` | Older staff onboarding — may conflict with app router |
| `/onboarding/supplier` | `src/pages/onboarding/supplier.tsx` | Supplier onboarding |
| `/onboarding/vendor` | `src/pages/onboarding/vendor.tsx` | Vendor onboarding |
| `/rfid/inventory` | `src/pages/rfid/inventory.tsx` | RFID inventory view |
| `/security/authentication` | `src/pages/security/authentication.tsx` | Security auth page |
| `/api/auth/…` | `src/pages/api/auth/` | Next.js API route for auth |

### Next.js Middleware (`src/middleware/auth.ts`)

The middleware file exists but its route matching is based on Supabase session validation using `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The production app uses `AuthContext` (JWT-based) for auth, not Supabase sessions, so this middleware is likely inactive or bypassed in production (see § 6 Gap F-03).

---

## 4. Auth & Permissions (Frontend)

### `AuthContext` (`src/context/AuthContext.tsx`)

**`User` type:**
```ts
interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'Super Admin' | 'Admin' | 'IT Staff' | 'Production Lead' | 'QC Lead' | 'Staff Lead' |
        'QC Staff' | 'Production Staff' | 'Maintenance Staff' | 'Security Guard' | 'Gate Staff';
  station?: string;
  is_active: boolean;
  last_login?: string;
  requires_password_change?: boolean;
  first_login?: boolean;
}
```

**Login flow:**
1. `login(username, password)` → `POST /auth/login` (JSON).
2. On 200: save `access_token` → `localStorage.clamflow_token`, save user object → `localStorage.clamflow_user`.
3. If `userData.requires_password_change` → return `{ requiresPasswordChange: true }` (renders `<PasswordChangeForm />`).
4. Else → `router.push('/dashboard')`.

**Face login flow:**
1. `faceLogin(faceAuthResult)` — accepts result from `FaceRecognitionLogin` component (which already called `/auth/face-login`).
2. Follows same localStorage + redirect logic as password login.

**`logout()`:** Clears both `localStorage` keys, sets state to null, redirects to `/login`.

**`requiresPasswordChange`:** Stored in React state. When true, login page renders `<PasswordChangeForm />` instead of the dashboard.

**`hasPermission(permission)`:** Checks `ROLE_PERMISSIONS[user.role]` map from `src/types/auth.ts`.

### `UserRole` type (`src/types/auth.ts`)
```ts
export type UserRole =
  | 'Super Admin' | 'Admin' | 'IT Staff' | 'Production Lead' | 'QC Lead'
  | 'Staff Lead' | 'QC Staff' | 'Production Staff' | 'Maintenance Staff'
  | 'Security Guard' | 'Gate Staff';
```

### Role Hierarchy (`src/types/auth.ts` `ROLE_HIERARCHY`)

| Role | Numeric Level |
|---|---|
| Super Admin | 100 |
| Admin | 10 |
| IT Staff | 7 |
| Production Lead | 6 |
| QC Lead | 6 |
| Staff Lead | 5 |
| QC Staff | 4 |
| Production Staff | 3 |
| Maintenance Staff | 2 |
| Security Guard | 2 |
| Gate Staff | 1 |

### `RoleBasedAccess` component core logic (`src/components/auth/RoleBasedAccess.tsx`)
```tsx
const hasAccess = requireAll
  ? allowedRoles.every(role => role === userRole)
  : allowedRoles.includes(userRole) || userRole === 'Super Admin';
// Super Admin bypasses all role checks.
```

---

## 5. Environment Variables

| Variable | Where Used | Default | Required? |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Every component and service — determines backend base URL | `https://clamflowbackend-production.up.railway.app` | Effectively YES — default is hardcoded |
| `NEXT_PUBLIC_SUPABASE_URL` | `src/middleware/auth.ts` only | — | Only if Supabase middleware is active |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/middleware/auth.ts` only | — | Only if Supabase middleware is active |

No secrets are embedded in the frontend bundle. All calls use `NEXT_PUBLIC_API_URL` which is the sole surface point.

---

## 6. Known Gaps / Frontend TODOs

| # | Severity | Description | Location |
|---|---|---|---|
| F-01 | HIGH | `StaffOnboarding.tsx` submits to `${API_BASE_URL}/staff/onboarding-requests` — missing `/api/` prefix; this endpoint does not appear in the backend API specification and will 404 in production | `src/components/forms/StaffOnboarding.tsx` ~line 395 |
| F-02 | HIGH | `SupplierOnboarding.tsx` calls `${API_BASE_URL}/aadhar/send-otp` and `/aadhar/verify-otp` — these endpoints are not declared in the backend; OTP verification is a dead stub | `src/components/forms/SupplierOnboarding.tsx` ~lines 220–270 |
| F-03 | MEDIUM | `src/middleware/auth.ts` uses Supabase for session validation (`NEXT_PUBLIC_SUPABASE_URL`), but the app uses JWT-based auth entirely via `AuthContext`. The middleware and the actual auth system are mismatched — middleware is likely non-functional | `src/middleware/auth.ts` |
| F-04 | MEDIUM | Two onboarding surfaces coexist for staff: `src/app/onboarding/staff/page.tsx` (app router, calls `/api/onboarding/staff`) and `src/pages/onboarding/staff.tsx` (pages router) plus `src/components/forms/StaffOnboarding.tsx` (calls `/staff/onboarding-requests`). These submit to different endpoints with different payloads | Multiple files |
| F-05 | MEDIUM | No offline-first sync for `SupplierOnboarding.tsx` face capture — if the user captures a face and the API call fails, the base64 image is only stored in React state and is lost on unmount | `src/components/forms/SupplierOnboarding.tsx` |
| F-06 | MEDIUM | `Sidebar.tsx` role filter uses lowercased+underscore strings (`'production_staff'`, `'gatekeeper'`) but `User.role` values are Title-Case-with-spaces (`'Production Staff'`). The transform `user.role.toLowerCase().replace(' ', '_')` only replaces the first space — multi-word roles with more than one space may not match correctly | `src/components/layout/Sidebar.tsx` |
| F-07 | LOW | `FaceCapture.tsx` always sends `location: 'main_gate'` hardcoded — cannot be configured by caller | `src/components/hardware/FaceCapture.tsx` line ~95 |
| F-08 | LOW | Mobile scan page `/mobile-scan/[token]` has no timeout UI — the session can expire server-side without the user seeing any feedback until the next submit attempt | `src/app/mobile-scan/[token]/page.tsx` |
| F-09 | LOW | `src/services/auth-service.ts` references `AuthService.biometricLogin()` posting to `/auth/biometric-login` — this endpoint does not appear in the backend spec. The real face-login endpoint is `/auth/face-login` | `src/services/auth-service.ts` |

---

## 7. Camera & Capture Components

All camera usage goes through `navigator.mediaDevices.getUserMedia`. No client-side face recognition models are used — the frontend captures a raw JPEG frame and sends it to the backend, which performs all face matching via AWS Rekognition.

---

### 7.1 `src/components/auth/FaceRecognitionLogin.tsx`

**Purpose:** Modal for face-based login on the login page.

**`getUserMedia` call:**
```ts
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'environment'   // rear camera
  }
});
```

**Capture:**
```ts
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
context.drawImage(video, 0, 0, canvas.width, canvas.height);
const imageData = canvas.toDataURL('image/jpeg', 0.9);
// Convert base64 to Blob:
const base64Response = await fetch(imageData);
const blob = await base64Response.blob();
const formData = new FormData();
formData.append('image', blob, 'face_capture.jpg');
```

**Sent to:** `POST ${API_BASE_URL}/auth/face-login` — `multipart/form-data`, no Authorization header.  
**Format:** JPEG blob in field `image`, filename `face_capture.jpg`.  
**On success:** result passed to `AuthContext.faceLogin()`.

---

### 7.2 `src/components/hardware/FaceCapture.tsx`

**Purpose:** General-purpose face capture component; used for attendance logging and face registration.

**`getUserMedia` call:**
```ts
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'environment'   // rear camera — supervisor points device at subject
  }
});
```

**Capture:**
```ts
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
context.drawImage(video, 0, 0, canvas.width, canvas.height);
const imageData = canvas.toDataURL('image/jpeg', 0.8);
const blob = await new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((b) => b ? resolve(b) : reject(...), 'image/jpeg', 0.8);
});
```

**Attendance mode (`mode === 'attendance'`):**  
```ts
const formData = new FormData();
formData.append('image', blob, 'capture.jpg');
formData.append('location', 'main_gate');  // hardcoded
const token = localStorage.getItem('clamflow_token');
await fetch(`${API_BASE_URL}/api/attendance/log`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```
Sent to: `POST /api/attendance/log` — `multipart/form-data`, fields: `image` (JPEG), `location` (`'main_gate'` hardcoded).

**Registration mode (`mode === 'registration'`):**  
Calls `onCapture(imageData)` — returns the base64 data URL to the parent component. No API call made from this component.

---

### 7.3 `src/app/onboarding/staff/page.tsx` — Face capture section

**Purpose:** Face photo capture during staff onboarding.

**`getUserMedia` call:**
```ts
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' }
});
```

**Capture:**
```ts
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
const imageData = canvas.toDataURL('image/jpeg', 0.85);
setCapturedImage(imageData);
setFormData(prev => ({ ...prev, face_image: imageData }));
```

**Sent to:** The `face_image` base64 data URL is embedded in the JSON body of the form submission to `POST /api/onboarding/staff`. Not sent separately. Format: full `data:image/jpeg;base64,...` data URL string in field `face_image`.

---

### 7.4 `src/components/forms/StaffOnboarding.tsx` — Face registration step

**Purpose:** Multi-step Staff onboarding wizard; face step is step 4 of 5.

**`getUserMedia` call:**
```ts
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: 640, height: 480, facingMode: 'environment' }
});
```

**Capture:**
```ts
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
context.drawImage(video, 0, 0, canvas.width, canvas.height);
const imageData = canvas.toDataURL('image/jpeg', 0.8);
setFaceImage(imageData);
setFormData(prev => ({
  ...prev,
  face_registration: {
    face_image: imageData,
    registered: true,
    registered_at: new Date().toISOString(),
    face_encoding_id: undefined
  }
}));
```

**Sent to:** `face_registration.face_image` is embedded in the full form payload submitted to `POST ${API_BASE_URL}/staff/onboarding-requests` (note: non-standard path — see § 6 Gap F-01).

---

### 7.5 `src/components/forms/SupplierOnboarding.tsx` — Face registration step

**Purpose:** Face photo during supplier/agent onboarding.

**`getUserMedia` call:**
```ts
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: 640, height: 480, facingMode: 'environment' }
});
```

**Capture:** Identical to StaffOnboarding (§7.4) — `canvas.toDataURL('image/jpeg', 0.8)` → stored in `formData.face_registration.face_image`.

**Sent to:** Included in the full supplier form payload. Delivery mechanism depends on whether the submission is online or offline-queued via `offlineSyncService`.

---

### 7.6 `src/app/gate-pass/visitors/page.tsx` — RegisterTab

**Purpose:** Face enrollment for new visitors at registration.

**`getUserMedia` call (via `useCameraCapture` hook within the file):**
```ts
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' },
});
```

**Capture (`captureJpeg()`):**
```ts
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
ctx.drawImage(video, 0, 0);
const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
return dataUrl.replace(/^data:image\/jpeg;base64,/, '');  // strip data URL prefix — raw base64
```

**Sent to:** `POST /api/visitors/register` as JSON field `face_image_b64: <raw base64 JPEG string>` (no `data:` prefix). This is enrolled server-side via AWS Rekognition.

---

### 7.7 `src/app/gate-pass/visitors/page.tsx` — VerifyTab

**Purpose:** Face-verify a returning visitor at the gate.

**`getUserMedia` call:** Same `useCameraCapture` hook, same constraints — `facingMode: 'environment'`, JPEG quality 0.85, raw base64 output.

**Sent to:**
```ts
await clamflowAPI.verifyVisitorFace({ face_image_b64: jpeg, gate });
// → POST /api/visitors/verify  JSON { face_image_b64: <raw base64>, gate }
```
Backend calls AWS Rekognition `SearchFacesByImage` against `clamflow-visitors` collection.

---

### 7.8 `src/app/mobile-scan/[token]/page.tsx` — Aadhaar QR scanner

**Purpose:** QR scanner page opened on a staff member's phone during onboarding (mobile handoff flow). No JWT required — access is controlled by the one-time `token` URL parameter.

**Camera access:** Uses the `Html5Qrcode` library (dynamically imported), **not** `getUserMedia` directly:
```ts
await qrScanner.start(
  { facingMode: 'environment' },
  {
    fps: 20,
    qrbox: (w, h) => {
      const size = Math.floor(Math.min(w, h) * 0.85);
      return { width: size, height: size };
    },
  },
  async (decodedText) => { await submitQRText(decodedText); },
  () => { /* per-frame failure — keep scanning */ }
);
```

**What is captured:** QR text decoded from the Aadhaar card QR code (not a photo).

**Sent to:** `POST ${API_BASE_URL}/api/onboarding/mobile-scan/${token}/submit` — no auth — JSON `{ qr_text: <decoded QR string> }`.

**Image file fallback:** Also accepts an `<input type="file">` upload; decodes QR client-side via `Html5Qrcode.scanFile()`, then calls the same submit endpoint.

---

### 7.9 `src/components/dashboards/admin/UserManagementPanel.tsx` — Face modal

**Purpose:** Admin can add a face registration for an existing user from the User Management panel.

**`getUserMedia` call:**
```ts
// (same pattern as StaffOnboarding.tsx § 7.4)
navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'environment' } })
```

**Capture:** `canvas.toDataURL('image/jpeg', 0.8)` → stored in component state `faceImage`.  
**Sent to:** Sent as part of user update or onboarding completion call (exact endpoint depends on which action triggered the modal — either `PUT /api/users/${userId}` or `POST /api/onboarding/complete/${personRecordId}`).

---

## 8. Onboarding & Edit UI Surfaces

### 8.1 `src/app/onboarding/staff/page.tsx` — **Canonical Staff Onboarding (App Router)**

**File:** `src/app/onboarding/staff/page.tsx`

**Access:** `useEffect` role check on mount:
```ts
const authorizedRoles = ['Super Admin', 'Admin', 'IT Staff', 'Production Lead', 'QC Lead', 'Staff Lead'];
if (!user?.role || !authorizedRoles.includes(user.role)) {
  alert('Access Denied: ...');
  router.push('/dashboard');
}
```

**Fields in `formData`:**
- `first_name` (text)
- `last_name` (text)
- `email` (text, optional)
- `address` (text)
- `contact_number` (text)
- `aadhar_number` (text — auto-filled if Aadhaar QR scanned)
- `face_image` (string — base64 JPEG dataURL, captured from camera or left empty)
- `designation` (select — options filtered by caller's role via `getDesignationOptions()`)
- `department` (text, optional)
- `start_date` (date)
- `initial_station` (text, optional — auto-filled `'Main Office'` if designation is `'IT Staff'`)
- `notes` (textarea, optional)
- `status` (always `'pending'`, not user-editable)

**Aadhaar input — 3 modes:**
1. **Manual:** user types the 12-digit Aadhaar number directly.
2. **Mobile scan:** creates session via `clamflowAPI.createMobileScan()` → `POST /api/onboarding/mobile-scan/create` → displays QR → polls `GET /api/onboarding/mobile-scan/${token}/result` every 2 s; on completion `applyAadhaarData()` fills `first_name`, `last_name`, `address`, `aadhar_number`.
3. **Image upload:** file `<input>` → client-side QR decode via `scanQRFromImageFile` / `parseAadhaarXML` in `src/lib/aadhaar-qr.ts`; falls back to `POST /api/onboarding/scan-aadhaar-image` (multipart, field `aadhaar_image`).

**Face capture:** `getUserMedia({ facingMode: 'environment' })` → `canvas.toDataURL('image/jpeg', 0.85)` → `formData.face_image`.

**Submit handler (`handleSubmit`):**
```ts
const submissionData = {
  first_name, last_name, email, address, contact_number,
  aadhar_number, face_image,   // face_image is full data: URL
  designation, department, start_date, initial_station, notes,
  aadhaar_qr_text,             // raw QR text if scanned
  requested_by: user.id,
  requested_by_name: user.full_name,
  requested_at: new Date().toISOString(),
  onboarding_status: 'incomplete',
  status: 'pending'
};
await clamflowAPI.post('/api/onboarding/staff', submissionData);
```

**Approval state:** Submission always goes to `status: 'pending'`. The response UI shows "sent to admin for approval." Admin must call `PUT /api/onboarding/${id}/approve` to complete.

---

### 8.2 `src/components/forms/StaffOnboarding.tsx` — **Multi-step Component**

**File:** `src/components/forms/StaffOnboarding.tsx`

**Access:** Wrapped in `<StaffOnboardingAccess>` at usage sites; internally checks `isAuthenticated && user`.

**Steps:** `basic` → `aadhar` → `bank` → `face` → `review`

**Fields:**
- `full_name`, `username` (text)
- `role` (select — values from `UserRole`, filtered by `department`)
- `department` (`'production' | 'qc' | 'security'`)
- `phone`, `email`, `emergency_contact` (text)
- `start_date`, `initial_station`, `skills`, `notes`
- `aadhar_details.aadhar_number` (12-digit text — attestation only, no OTP; `confirmAadhar()` sets `verified: true, verification_method: 'manual'`)
- `bank_details.bank_name`, `account_number`, `ifsc_code`, `account_holder_name`, `upi_id`
- `face_registration.face_image` (base64 JPEG, captured in step 4)

**Submit handler (`handleSubmit`):**
```ts
await fetch(`${API_BASE_URL}/staff/onboarding-requests`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(requestData),
});
```
On network failure → `offlineSyncService.queueOperation('staff_onboarding', '/staff/onboarding-requests', 'POST', requestData, user.id)`.

**Approval state:** `status: 'pending'` in payload. See § 6 Gap F-01 (endpoint path issue).

---

### 8.3 `src/components/forms/SupplierOnboarding.tsx` — **Supplier/Agent Onboarding**

**File:** `src/components/forms/SupplierOnboarding.tsx`

**Access:** Checked via `isAuthenticated`.  
**Approval controls** (approve/reject existing records) wrapped in `<AdminOnly>`.

**Supplier types:** `boat_owner | agent`

**Fields:**
- `type` (`'boat_owner' | 'agent'`)
- `first_name`, `last_name`, `address`, `contact_number`, `email`
- `boat_registration_number` (boat_owner only)
- `gst_number` (boat_owner only)
- `linked_boat_owner_id` (agent only — select existing boat owner)
- `aadhar_details.aadhar_number` — attempted OTP via `POST /aadhar/send-otp` + `POST /aadhar/verify-otp` (see § 6 Gap F-02 — these endpoints are non-existent in backend)
- `bank_details.bank_name`, `account_number`, `ifsc_code`, `account_holder_name`, `upi_id`
- `face_registration.face_image` (base64 JPEG 0.8 quality)
- `agent_declarations[]` (for boat owners — agent name, phone, relationship, authorized_activities, consent_given)

**Submit:** Uses `offlineSyncService.queueOperation()` — not a direct API call. The offline queue eventually calls the supplier onboarding endpoint (path not finalised in this component).

**Approval state:** `status: 'pending'` in payload; Admin must approve.

---

### 8.4 `src/components/dashboards/admin/UserManagementPanel.tsx` — **Admin User Management (Create/Edit)**

**File:** `src/components/dashboards/admin/UserManagementPanel.tsx`

**Access:** Rendered inside `AdminDashboard` / `SuperAdminDashboard` — only reached by Admin/Super Admin roles.

**Create user form fields:**
- `full_name` (text)
- `role` (select — from roles array: `IT Staff, Production Lead, QC Lead, Staff Lead, QC Staff, Production Staff, Maintenance Staff, Security Guard, Gate Staff`)
- `station` (text)
- `phone_number` (text — if provided, triggers WhatsApp welcome message)
- `password` (text — if empty, auto-generated as `Clam<random8chars>!`)

**Submit (create):**
```ts
const username = generateUsername(userData.role, userData.full_name);
// username = `${ROLE_PREFIX}_${firstName}` e.g. 'PS_John'
await fetch(`${API_BASE_URL}/api/users/`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...userData, username, password: generatedPassword }),
});
```

**Submit (edit):**
```ts
await fetch(`${API_BASE_URL}/api/users/${userId}`, {
  method: 'PUT',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(userData),
});
```

**Approval state:** **None — user is created immediately.** No pending state for Admin-created users.

**Also includes:** Inline Aadhaar scan modal (same 3 modes: manual, mobile, upload) and face registration modal for adding biometrics to an existing user.

---

### 8.5 Other Edit Surfaces (brief)

| Component / File | Records it edits | Endpoint called | Notes |
|---|---|---|---|
| `src/app/gate-pass/visitors/page.tsx` — RegisterTab | Creates new visitor | `POST /api/visitors/register` | No pending state — pass is issued immediately |
| `src/components/dashboards/admin/DeviceForm.tsx` | Creates/edits device registry entries | `POST /api/admin/devices/registry` or `PUT /api/admin/devices/${id}` | Accessible to Admin / IT Staff |
| `src/components/dashboards/admin/ShiftManagementPanel.tsx` | Shift definitions | `POST/PUT /api/shifts/shift-definitions` | Accessible to Admin+ |
| `src/components/dashboards/admin/StationManagementPanel.tsx` | Station definitions | `POST/PUT /api/stations/` | Accessible to Admin+ |
| `src/components/InteractiveStationAssignment.tsx` | Station assignments | `POST /api/stations/assignments/`, bulk | Visual drag-drop UI |
| `src/components/InteractiveShiftCalendar.tsx` | Shift assignments | `POST /api/shifts/shift-assignments` | Calendar UI |
| `src/components/auth/PasswordChangeForm.tsx` | User's own password | `POST /auth/change-password` | Shown when `requiresPasswordChange === true` |

---

## 9. Role-Gated UI Elements

### 9.1 `RoleBasedAccess` Convenience Components (`src/components/auth/RoleBasedAccess.tsx`)

All are wrappers around `RoleBasedAccess` which applies:
```tsx
allowedRoles.includes(userRole) || userRole === 'Super Admin'
// Super Admin always has access regardless of allowedRoles.
```

| Component | `allowedRoles` passed |
|---|---|
| `<AdminOnly>` | `['Super Admin', 'Admin']` |
| `<SuperAdminOnly>` | `['Super Admin']` |
| `<ProductionLeadAccess>` | `['Super Admin', 'Admin', 'Production Lead']` |
| `<QCLeadAccess>` | `['Super Admin', 'Admin', 'QC Lead']` |
| `<StaffLeadAccess>` | `['Super Admin', 'Admin', 'Staff Lead']` |
| `<LeadAccess>` | `['Super Admin', 'Admin', 'Production Lead', 'QC Lead', 'Staff Lead']` |
| `<QCStaffAccess>` | `['Super Admin', 'Admin', 'QC Lead', 'QC Staff']` |
| `<ProductionAccess>` | `['Super Admin', 'Admin', 'Production Lead', 'Production Staff']` |
| `<SecurityAccess>` | `['Super Admin', 'Admin', 'Staff Lead', 'Security Guard', 'Gate Staff']` |
| `<ITStaffAccess>` | `['Super Admin', 'Admin', 'IT Staff']` |

**Permission-based convenience components** (use `ROLE_PERMISSIONS` map from `src/types/auth.ts`):

| Component | `requiredPermissions` |
|---|---|
| `<StaffOnboardingAccess>` | `['STAFF_ONBOARD']` |
| `<WeightNoteApprovalAccess>` | `['WEIGHTNOTE_APPROVE']` |
| `<DeviceHandoverAccess>` | `['DEVICE_RFID_HANDOVER']` |
| `<ShiftSchedulingAccess staffType='production'>` | `['SHIFT_SCHEDULE_PRODUCTION', 'SHIFT_SCHEDULE_ALL']` |
| `<ShiftSchedulingAccess staffType='qc'>` | `['SHIFT_SCHEDULE_QC', 'SHIFT_SCHEDULE_ALL']` |
| `<StationAssignmentAccess staffType='production'>` | `['STATION_ASSIGN_PRODUCTION', 'STATION_ASSIGN_ALL']` |

---

### 9.2 `src/app/dashboard/page.tsx` — Dashboard role switch

```ts
const DASHBOARD_ROLES = [
  'Super Admin', 'Admin', 'IT Staff', 'Staff Lead',
  'Production Lead', 'QC Lead', 'QC Staff', 'Production Staff', 'Security Guard'
];
if (!DASHBOARD_ROLES.includes(user.role)) {
  setError(`Access denied. Role "${user.role}" does not have dashboard access.`);
}
```

Role-to-component mapping:
```tsx
switch (user.role) {
  case 'Super Admin':       return <SuperAdminDashboard currentUser={user} />;
  case 'Admin':             return <AdminDashboard currentUser={user} />;
  case 'IT Staff':          return <ITStaffDashboard currentUser={user} />;
  case 'Staff Lead':        return <StaffLeadDashboard currentUser={user} />;
  case 'Production Lead':   return <ProductionLeadDashboard />;
  case 'QC Lead':           return <QCLeadDashboard />;
  case 'QC Staff':          return <QCStaffDashboard currentUser={user} />;  // QCFlowDashboardNew
  case 'Production Staff':  return <ProductionStaffDashboard currentUser={user} />;
  case 'Security Guard':    return <SecurityGuardDashboard currentUser={user} />;
}
```

---

### 9.3 `src/app/gate-pass/visitors/page.tsx` — Page & tab access

```ts
const AUTHORIZED_ROLES = ['Super Admin', 'Admin', 'Staff Lead', 'Security Guard', 'Gate Staff'];
const authorized = AUTHORIZED_ROLES.includes(user.role as typeof AUTHORIZED_ROLES[number]);
if (!authorized) return <AccessDenied onBack={() => router.push('/dashboard')} />;
```

Visitor Log tab — only rendered for admin-level users:
```tsx
const isAdmin = ['Super Admin', 'Admin', 'Staff Lead'].includes(user.role);
// Tabs array:
...(isAdmin ? [{ key: 'log', label: 'Visitor Log', icon: '📋' }] : [])
// Tab content:
{tab === 'log' && isAdmin && <LogTab />}
```

---

### 9.4 `src/app/onboarding/staff/page.tsx` — Designation dropdown

Available designation options are filtered by the submitter's role:
```ts
switch (user?.role) {
  case 'Production Lead':  return [{ value: 'Production Staff', label: 'Production Staff' }];
  case 'QC Lead':          return [{ value: 'QC Staff', label: 'QC Staff' }];
  case 'Staff Lead':       return [{ value: 'Security Guard', label: 'Security Guard' }];
  case 'IT Staff':         return [
    { value: 'IT Staff' }, { value: 'Production Staff' }, { value: 'QC Staff' },
    { value: 'Security Guard' }, { value: 'Maintenance Staff' }, { value: 'Gate Staff' }
  ];
  case 'Super Admin':
  case 'Admin':            return [all roles including Admin];
  default:                 return [];
}
```

---

### 9.5 `src/components/layout/Sidebar.tsx` — Navigation filtering

```ts
const filteredItems = menuItems.filter(item =>
  item.roles.includes('all') ||
  (user?.role && item.roles.includes(user.role.toLowerCase().replace(' ', '_')))
);
```

Per-item role constraints:
```ts
{ href: '/dashboard',   roles: ['all'] }
{ href: '/weight-notes', roles: ['production_staff', 'gatekeeper'] }
{ href: '/lots',         roles: ['production_staff', 'production_lead'] }
{ href: '/washing',      roles: ['production_staff'] }
{ href: '/depuration',   roles: ['production_staff'] }
{ href: '/ppc',          roles: ['qc_staff', 'qc_lead'] }
{ href: '/fp',           roles: ['qc_staff', 'qc_lead'] }
{ href: '/inventory',    roles: ['all'] }
{ href: '/rfid',         roles: ['production_lead', 'qc_lead'] }
```

Note: Role strings in this filter use `toLowerCase().replace(' ', '_')` which only replaces the **first** space. See § 6 Gap F-06.

---

### 9.6 `src/app/security-monitor/page.tsx` — Auth guard

```ts
useEffect(() => {
  if (!isLoading && !user) router.push('/login');
}, [user, isLoading, router]);
```

No role restriction — any authenticated user who navigates to `/security-monitor` directly can view the page. The page link itself is only exposed to security-role dashboards.

---

### 9.7 `src/components/dashboards/SecurityGuardDashboard.tsx` — Detection card branches

Live camera detection feed renders different card variants based on `CameraDetectionEvent.subject_type`:
```tsx
switch (ev.subject_type) {
  case 'staff':           // green badge — no action needed
  case 'known_visitor':   // blue badge — show pass details
  case 'expired_visitor': // amber badge — prompt guard to renew
  case 'new_visitor':     // slate badge — link to /gate-pass/visitors
  case 'no_face':         // gray badge — reposition prompt
}
```

---

### 9.8 `src/middleware/auth.ts` — Route-level role table (declared but likely inactive — see § 6 Gap F-03)

```ts
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/dashboard':            ['*'],
  '/dashboard/admin':      ['admin'],
  '/dashboard/production': ['admin', 'plant_manager', 'production_lead'],
  '/dashboard/qc':         ['admin', 'plant_manager', 'qc_lead', 'qc_staff'],
  '/weight-notes':         ['admin', 'plant_manager', 'qc_lead', 'qc_staff', 'qa_technician'],
  '/settings':             ['admin', 'plant_manager'],
  '/users':                ['admin'],
  '/onboarding':           ['admin', 'plant_manager'],
  // ...
};
```

Role strings here (`'admin'`, `'plant_manager'`) do **not** match the canonical `UserRole` values (`'Admin'`, etc.) used in `AuthContext`. This mismatch renders the middleware non-functional for the current auth system.
