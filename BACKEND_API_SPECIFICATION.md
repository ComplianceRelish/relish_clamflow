# ClamFlow Backend API Specification
## Extracted from Frontend Source Code — Exhaustive Reference

**Generated:** 2026-02-27  
**Base URL:** `NEXT_PUBLIC_API_URL` env var, default `https://clamflowbackend-production.up.railway.app`

---

## CRITICAL IMPLEMENTATION NOTES

### 1. Snake-to-Camel Transform
The frontend's `ClamFlowAPI` class (in `src/lib/clamflow-api.ts`) applies `transformKeysToCamel()` to **every** response. This means:
- **Backend MUST return snake_case** JSON keys (standard Python/FastAPI convention)
- The frontend auto-converts `station_name` → `stationName`, `avg_wait_time` → `avgWaitTime`, etc.
- All "Expected Response Fields" below are shown in **camelCase** (what frontend code references), with the **snake_case backend equivalent** noted where important.

### 2. Pagination Unwrapping
The frontend auto-unwraps paginated responses. If the response is an object with a key named `items`, `finished_products`, `test_results`, or `data` that contains an array, the frontend extracts the array. The backend can return either:
- A bare array: `[{...}, {...}]`
- A wrapped object: `{ "items": [{...}, {...}], "total": 10, "page": 1 }` (the `items` array is extracted)

### 3. Array Endpoint Safety
The frontend enforces that certain endpoints return arrays. If a non-array is received, it falls back to `[]`. These endpoints are listed in `isArrayEndpoint()`.

### 4. Authentication
All requests (except login) include `Authorization: Bearer <token>` header.  
On 401 response, the frontend clears `localStorage` and redirects to `/login`.

### 5. Two API Clients
There are **two** API client implementations:
- **`ClamFlowAPI`** (`src/lib/clamflow-api.ts`) — Primary client, uses `fetch()`, applies snake→camel transform
- **`APIClient`** (`src/lib/api-client.ts`) — Secondary client, uses `axios`, does NOT apply snake→camel transform
- **`AuthService`** (`src/services/auth-service.ts`) — Uses the `APIClient` from `src/services/api.ts`

The primary dashboard hooks all use `ClamFlowAPI`. The `AuthContext` uses raw `fetch()` directly.

---

## 1. AUTHENTICATION & USER MANAGEMENT

### 1.1 Login
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /auth/login` |
| **Source** | `AuthContext.tsx` (primary), `ClamFlowAPI.login()`, `AuthService.login()` |
| **Request Body** | `{ "username": string, "password": string }` |
| **Note** | `AuthContext` sends `username`/`password`. `AuthService` sends `email`/`password` (different client, likely unused in production) |

**Expected Response (200 OK):**
```json
{
  "access_token": "string (JWT)",
  "user": {
    "id": "string (UUID)",
    "username": "string",
    "full_name": "string",
    "role": "Super Admin | Admin | Production Lead | QC Lead | Staff Lead | QC Staff | Production Staff | Security Guard",
    "station": "string | null",
    "is_active": true,
    "requires_password_change": false,
    "first_login": false
  }
}
```

**Error Response (non-200):**
```json
{
  "detail": "string (error message)"
}
```

**Frontend Behavior:**
- Stores `access_token` in `localStorage` as `clamflow_token`
- Stores `user` object in `localStorage` as `clamflow_user`
- If `requires_password_change` is true, redirects to password change flow instead of dashboard

---

### 1.2 Face/Biometric Login
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /auth/biometric-login` |
| **Source** | `AuthService.biometricLogin()` |
| **Request Body** | `{ "face_encoding": "string", "employee_id": "string (optional)" }` |

**Expected Response:** Same as login response (with `access_token`, `refresh_token`, `user`, `expires_in`)

**Note:** The `AuthContext.faceLogin()` does NOT call an endpoint — it receives the result from a `FaceRecognitionLogin` component that presumably calls the backend directly. The result shape expected:
```json
{
  "success": true,
  "access_token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "full_name": "string",
    "role": "string",
    "station": "string | null",
    "is_active": true,
    "requires_password_change": false,
    "first_login": false
  },
  "message": "string (optional)"
}
```

---

### 1.3 Change Password
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /auth/change-password` |
| **Source** | `AuthContext.changePassword()` |
| **Auth** | Bearer token required |
| **Request Body** | `{ "current_password": "string", "new_password": "string" }` |

**Expected Success Response (200 OK):** Any JSON (frontend only checks `response.ok`)

**Expected Error Response:**
```json
{
  "message": "string (error message)"
}
```

---

### 1.4 Token Refresh
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /auth/refresh` |
| **Source** | `AuthContext.refreshToken()`, `AuthService.refreshToken()` |
| **Auth** | Bearer token in header |

**AuthContext sends:** Empty body, current token in `Authorization` header  
**AuthService sends:** `{ "refresh_token": "string" }` from localStorage

**Expected Response:**
```json
{
  "access_token": "string (new JWT)"
}
```

---

### 1.5 Logout
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /auth/logout` |
| **Source** | `AuthService.logout()` |
| **Request Body** | `{ "refresh_token": "string" }` |

**Note:** `AuthContext.logout()` does NOT call the backend. It only clears localStorage.

---

### 1.6 Get Current User
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /user/profile` |
| **Source** | `ClamFlowAPI.getCurrentUser()` |
| **Response Type** | `User` |

**Expected Response (after camelCase transform):**
```json
{
  "id": "string",
  "username": "string",
  "fullName": "string",
  "role": "Super Admin | Admin | Production Lead | QC Lead | Staff Lead | QC Staff | Production Staff | Security Guard",
  "station": "string | null",
  "isActive": true,
  "lastLogin": "string (ISO date) | null",
  "createdAt": "string (ISO date) | null"
}
```

**Backend snake_case:** `full_name`, `is_active`, `last_login`, `created_at`

The `AuthService.getCurrentUser()` calls `GET /auth/me` instead (alternate client).

---

### 1.7 Get All Users
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/users/` |
| **Source** | `ClamFlowAPI.getAllUsers()` |
| **Response Type** | `User[]` |

---

### 1.8 Create User
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/users/` |
| **Source** | `ClamFlowAPI.createUser()` |
| **Request Body** | Partial `User` object |
| **Response Type** | `User` |

---

### 1.9 Update User
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/users/{userId}` |
| **Source** | `ClamFlowAPI.updateUser()` |
| **Request Body** | Partial `User` object |
| **Response Type** | `User` |

---

### 1.10 Delete User
| Property | Value |
|----------|-------|
| **Endpoint** | `DELETE /api/users/{userId}` |
| **Source** | `ClamFlowAPI.deleteUser()` |
| **Response Type** | `void` |

---

## 2. SUPER ADMIN

### 2.1 Get Admins
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /super-admin/admins` |
| **Fallback** | `GET /api/users/` |
| **Source** | `ClamFlowAPI.getAdmins()` |
| **Response Type** | `User[]` |

**Note:** Frontend first tries `/super-admin/admins`, if it fails falls back to `/api/users/`.

---

### 2.2 Create Admin
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /super-admin/create-admin` |
| **Source** | `ClamFlowAPI.createAdmin()` |
| **Request Body** | |

```json
{
  "username": "string",
  "full_name": "string",
  "email": "string (optional)",
  "password": "string",
  "role": "string",
  "station": "string",
  "contact_number": "string (optional)"
}
```

**Response Type:** `User`

---

### 2.3 Update Admin
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /super-admin/admins/{adminId}` |
| **Source** | `ClamFlowAPI.updateAdmin()` |
| **Request Body** | Partial `AdminFormData` |
| **Response Type** | `User` |

---

### 2.4 Delete Admin
| Property | Value |
|----------|-------|
| **Endpoint** | `DELETE /super-admin/admins/{adminId}` |
| **Source** | `ClamFlowAPI.deleteAdmin()` |
| **Response Type** | `void` |

---

### 2.5 API Monitoring
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /super-admin/api-monitoring` |
| **Source** | `ClamFlowAPI.getApiMonitoring()` |
| **Response Type** | `unknown` (shape not typed) |

---

## 3. DASHBOARD & SYSTEM HEALTH

### 3.1 Dashboard Metrics
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /dashboard/metrics` |
| **Source** | `ClamFlowAPI.getDashboardMetrics()` |
| **Response Type** | `DashboardMetrics` |

**Expected Response (camelCase after transform):**
```json
{
  "totalUsers": 0,
  "activeUsers": 0,
  "totalLots": 0,
  "pendingApprovals": 0,
  "systemHealth": "healthy | warning | critical",
  "lastUpdated": "string (ISO date)"
}
```

**Backend snake_case:** `total_users`, `active_users`, `total_lots`, `pending_approvals`, `system_health`, `last_updated`

---

### 3.2 System Health
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /health` |
| **Source** | `ClamFlowAPI.getSystemHealth()`, `APIClient.healthCheck()` |
| **Response Type** | `SystemHealthData` |

**Expected Response (camelCase after transform):**
```json
{
  "status": "healthy | warning | critical",
  "uptime": "string",
  "database": {
    "status": "connected | disconnected",
    "responseTime": 0
  },
  "services": {
    "authentication": true,
    "api": true,
    "database": true,
    "hardware": true
  }
}
```

**Backend snake_case:** `response_time` in database object

---

### 3.3 Notifications
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /notifications/` |
| **Source** | `ClamFlowAPI.getNotifications()` |
| **Response Type** | `Notification[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "type": "info | warning | error | approval_required",
  "title": "string",
  "message": "string",
  "priority": "low | medium | high",
  "createdAt": "string (ISO date)",
  "read": false
}
```

**Backend snake_case:** `created_at`

---

### 3.4 Audit Logs
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /audit/logs` |
| **Source** | `ClamFlowAPI.getAuditLogs()` |
| **Response Type** | `AuditLog[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "action": "string",
  "userId": "string",
  "username": "string",
  "fullName": "string",
  "role": "string",
  "timestamp": "string (ISO date)",
  "ipAddress": "string",
  "status": "string"
}
```

**Backend snake_case:** `user_id`, `full_name`, `ip_address`

---

## 4. OPERATIONS MONITOR
**Polling Interval:** 10 seconds (via `useOperationsData` hook)

### 4.1 Get Stations
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/operations/stations` |
| **Source** | `ClamFlowAPI.getStations()` |
| **Response Type** | `StationStatus[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "stationId": "string",
  "stationName": "string",
  "currentOperator": "string | null",
  "currentLot": "string | null",
  "status": "active | idle | maintenance",
  "efficiency": 0.0
}
```

**Backend snake_case:** `station_id`, `station_name`, `current_operator`, `current_lot`

---

### 4.2 Get Active Lots
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/operations/active-lots` |
| **Source** | `ClamFlowAPI.getActiveLots()` |
| **Response Type** | `ActiveLot[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "lotId": "string",
  "lotNumber": "string",
  "currentStation": "string",
  "status": "string",
  "entryTime": "string (ISO date)",
  "estimatedCompletion": "string (ISO date)",
  "progress": 0
}
```

**Backend snake_case:** `lot_id`, `lot_number`, `current_station`, `entry_time`, `estimated_completion`

---

### 4.3 Get Bottlenecks
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/operations/bottlenecks` |
| **Source** | `ClamFlowAPI.getBottlenecks()` |
| **Response Type** | `Bottleneck[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "stationName": "string",
  "queuedLots": 0,
  "avgWaitTime": 0,
  "severity": "low | medium | high",
  "recommendation": "string"
}
```

**Backend snake_case:** `station_name`, `queued_lots`, `avg_wait_time`

---

### 4.4 Live Operations (Combined)
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/operations/live` |
| **Source** | `ClamFlowAPI.getLiveOperations()` |
| **Response Type** | Combined object |

**Expected Response:**
```json
{
  "stations": [
    {
      "id": "string",
      "name": "string",
      "code": "string",
      "plantType": "string",
      "status": "string",
      "currentStaff": [{ "id": "string", "name": "string" }],
      "activeLot": { "lotNumber": "string", "product": "string" } | null
    }
  ],
  "activeLots": [
    {
      "lotNumber": "string",
      "status": "string",
      "currentStation": "string",
      "progressPercentage": 0
    }
  ],
  "bottlenecks": [
    {
      "station": "string",
      "queueCount": 0,
      "waitTimeMinutes": 0
    }
  ],
  "timestamp": "string (ISO date)"
}
```

**Backend snake_case:** `plant_type`, `current_staff`, `active_lot`, `lot_number`, `current_station`, `progress_percentage`, `queue_count`, `wait_time_minutes`

---

## 5. GATE & VEHICLE MANAGEMENT
**Polling Interval:** 30 seconds (via `useGateData` hook)

### 5.1 Get Vehicles
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/gate/vehicles` |
| **Source** | `ClamFlowAPI.getVehicles()` |
| **Response Type** | `VehicleLog[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "vehicleId": "string",
  "lotNumber": "string",
  "driverName": "string",
  "supplierName": "string",
  "entryTime": "string (ISO date)",
  "exitTime": "string (ISO date) | null",
  "status": "in_facility | departed",
  "rfidCount": 0,
  "weight": 0,
  "contactNumber": "string"
}
```

**Backend snake_case:** `vehicle_id`, `lot_number`, `driver_name`, `supplier_name`, `entry_time`, `exit_time`, `rfid_count`, `contact_number`

---

### 5.2 Get Active Vehicles/Deliveries
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/gate/active` |
| **Source** | `ClamFlowAPI.getActiveVehicles()` |
| **Response Type** | `ActiveDelivery[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "vehicleId": "string",
  "lotNumber": "string",
  "supplierName": "string",
  "entryTime": "string (ISO date)",
  "duration": "string",
  "rfidScanned": 0,
  "status": "string"
}
```

**Backend snake_case:** `vehicle_id`, `lot_number`, `supplier_name`, `entry_time`, `rfid_scanned`

---

### 5.3 Get Suppliers
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/gate/suppliers` |
| **Source** | `ClamFlowAPI.getSuppliers()`, `APIClient.getSuppliers()` |
| **Response Type** | `SupplierHistory[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "supplierId": "string",
  "supplierName": "string",
  "totalDeliveries": 0,
  "lastDelivery": "string (ISO date)",
  "avgWeight": 0,
  "contactNumber": "string"
}
```

**Backend snake_case:** `supplier_id`, `supplier_name`, `total_deliveries`, `last_delivery`, `avg_weight`, `contact_number`

---

### 5.4 Get Checkpoints
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/gate/checkpoints` |
| **Source** | `ClamFlowAPI.getCheckpoints()` |
| **Response Type** | `CheckpointHistory[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "checkpointId": "string",
  "vehicleId": "string",
  "checkpointType": "string",
  "timestamp": "string (ISO date)",
  "operator": "string",
  "notes": "string"
}
```

**Backend snake_case:** `checkpoint_id`, `vehicle_id`, `checkpoint_type`

---

### 5.5 Vehicle Entry
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/gate/vehicle-entry` |
| **Source** | `APIClient.recordGateEntry()` |
| **Request Body** | `{ "rfid_tags": ["string"], "timestamp": "string (optional)" }` |

---

### 5.6 Vehicle Exit
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/gate/vehicle-exit` |
| **Source** | `APIClient.recordGateExit()` |
| **Request Body** | `{ "rfid_tags": ["string"], "timestamp": "string (optional)" }` |

---

### 5.7 Inside Vehicles (Box Tally)
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/gate/inside-vehicles` |
| **Source** | `APIClient.getBoxTally()` |
| **Response Type** | Untyped |

---

### 5.8 Get Vendors
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/gate/vendors` |
| **Source** | `APIClient.getVendors()` |
| **Response Type** | Untyped |

---

## 6. SECURITY & SURVEILLANCE
**Polling Interval:** 15 seconds (via `useSecurityData` hook)

### 6.1 Get Security Cameras
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/security/cameras` |
| **Source** | `ClamFlowAPI.getSecurityCameras()` |
| **Response Type** | `Camera[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "cameraId": "string",
  "cameraName": "string",
  "location": "string",
  "status": "online | offline | unknown",
  "lastActivity": "string (ISO date) | null",
  "resolution": "string",
  "recordingEnabled": true,
  "firmwareVersion": "string"
}
```

**Backend snake_case:** `camera_id`, `camera_name`, `last_activity`, `recording_enabled`, `firmware_version`

---

### 6.2 Get Security Events
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/security/events` |
| **Source** | `ClamFlowAPI.getSecurityEvents()` |
| **Response Type** | `SecurityEvent[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "eventId": "string",
  "eventType": "string",
  "location": "string",
  "timestamp": "string (ISO date)",
  "severity": "low | medium | high",
  "description": "string",
  "resolvedAt": "string (ISO date) | null"
}
```

**Backend snake_case:** `event_id`, `event_type`, `resolved_at`

---

### 6.3 Get Face Detection Events
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/security/face-detection` |
| **Source** | `ClamFlowAPI.getFaceDetectionEvents()` |
| **Response Type** | `FaceDetectionEvent[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "eventId": "string",
  "personId": "string",
  "personName": "string",
  "location": "string",
  "timestamp": "string (ISO date)",
  "confidence": 0.0,
  "eventType": "check-in | check-out",
  "method": "string"
}
```

**Backend snake_case:** `event_id`, `person_id`, `person_name`, `event_type`

---

### 6.4 Get Unauthorized Access Events
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/security/unauthorized` |
| **Source** | `ClamFlowAPI.getUnauthorizedAccess()` |
| **Response Type** | `UnauthorizedAccess[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "eventId": "string",
  "location": "string",
  "timestamp": "string (ISO date)",
  "attemptType": "string",
  "cameraId": "string | null",
  "resolved": false
}
```

**Backend snake_case:** `event_id`, `attempt_type`, `camera_id`

---

## 7. PRODUCTION ANALYTICS
**Polling Interval:** 60 seconds (via `useAnalyticsData` hook)

### 7.1 Production Throughput
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/analytics/throughput` |
| **Source** | `ClamFlowAPI.getProductionThroughput()` |
| **Response Type** | `ThroughputData` (single object, NOT array) |

**Expected Response (camelCase after transform):**
```json
{
  "daily": [{ "date": "string", "count": 0, "weight": 0 }],
  "weekly": [{ "week": "string", "count": 0, "weight": 0 }],
  "monthly": [{ "month": "string", "count": 0, "weight": 0 }]
}
```

---

### 7.2 Station Efficiency
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/analytics/efficiency` |
| **Source** | `ClamFlowAPI.getEfficiencyMetrics()` |
| **Response Type** | `StationEfficiency[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "stationName": "string",
  "efficiency": 0.0,
  "lotsProcessed": 0,
  "avgProcessingTime": 0
}
```

**Backend snake_case:** `station_name`, `lots_processed`, `avg_processing_time`

---

### 7.3 Quality Metrics
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/analytics/quality` |
| **Source** | `ClamFlowAPI.getQualityMetrics()` |
| **Response Type** | `QualityMetrics` (single object, NOT array) |

**Expected Response (camelCase after transform):**
```json
{
  "passRate": 0.0,
  "failRate": 0.0,
  "avgScore": 0.0,
  "byStation": [
    {
      "station": "string",
      "passRate": 0.0,
      "failRate": 0.0,
      "totalTests": 0
    }
  ]
}
```

**Backend snake_case:** `pass_rate`, `fail_rate`, `avg_score`, `by_station`, `total_tests`

---

### 7.4 Processing Times
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/analytics/processing-times` |
| **Source** | `ClamFlowAPI.getProcessingTimes()` |
| **Response Type** | `ProcessingTime[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "stage": "string",
  "avgTime": 0,
  "minTime": 0,
  "maxTime": 0,
  "samples": 0
}
```

**Backend snake_case:** `avg_time`, `min_time`, `max_time`

---

## 8. STAFF MANAGEMENT
**Polling Interval:** 30 seconds (via `useStaffData` hook)

### 8.1 Staff Attendance
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/staff/attendance` |
| **Source** | `ClamFlowAPI.getStaffAttendance()` |
| **Response Type** | `AttendanceRecord[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "userId": "string",
  "fullName": "string",
  "role": "string",
  "status": "checked_in | checked_out",
  "checkInTime": "string (ISO date) | null",
  "location": "string",
  "shiftType": "string",
  "method": "string"
}
```

**Backend snake_case:** `user_id`, `full_name`, `check_in_time`, `shift_type`

---

### 8.2 Staff Locations
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/staff/locations` |
| **Source** | `ClamFlowAPI.getStaffLocations()` |
| **Response Type** | `StaffLocation[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "location": "string",
  "staffCount": 0,
  "staffMembers": [
    {
      "userId": "string",
      "fullName": "string",
      "role": "string"
    }
  ]
}
```

**Backend snake_case:** `staff_count`, `staff_members`, `user_id`, `full_name`

---

### 8.3 Staff Performance
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/staff/performance` |
| **Source** | `ClamFlowAPI.getStaffPerformance()` |
| **Response Type** | `StaffPerformance[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "userId": "string",
  "fullName": "string",
  "role": "string",
  "lotsProcessed": 0,
  "avgProcessingTime": 0,
  "qualityScore": 0.0,
  "efficiency": 0.0
}
```

**Backend snake_case:** `user_id`, `full_name`, `lots_processed`, `avg_processing_time`, `quality_score`

---

### 8.4 Shift Schedules
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/staff/shifts` |
| **Source** | `ClamFlowAPI.getShiftSchedules()` |
| **Response Type** | `ShiftSchedule[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "shiftId": "string",
  "shiftName": "string",
  "startTime": "string",
  "endTime": "string",
  "assignedStaff": 0,
  "station": "string"
}
```

**Backend snake_case:** `shift_id`, `shift_name`, `start_time`, `end_time`, `assigned_staff`

---

### 8.5 Get Staff List
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/staff/` |
| **Source** | `ClamFlowAPI.getStaff()`, `APIClient.getStaff()` |
| **Response Type** | `StaffMember[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "fullName": "string",
  "employeeId": "string",
  "role": "string",
  "department": "string (optional)",
  "stationAssignments": ["string"] | null,
  "isActive": true
}
```

**Backend snake_case:** `full_name`, `employee_id`, `station_assignments`, `is_active`

---

### 8.6 Get QC Staff
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/staff/?role=qc` |
| **Source** | `ClamFlowAPI.getQCStaff()` |
| **Response Type** | `StaffMember[]` |

---

### 8.7 Record Attendance
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/attendance/` |
| **Source** | `APIClient.recordAttendance()` |
| **Request Body** | `{ "employee_id": "string", "method": "face | qr", "timestamp": "string (optional)" }` |

---

## 9. INVENTORY & SHIPMENTS
**Polling Interval:** 45 seconds (via `useInventoryData` hook)

### 9.1 Get Finished Products
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/inventory/finished-products` |
| **Source** | `ClamFlowAPI.getFinishedProducts()` |
| **Response Type** | `FinishedProduct[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "productId": "string",
  "lotNumber": "string",
  "species": "string",
  "supplierName": "string",
  "totalBoxes": 0,
  "totalWeight": 0,
  "status": "packed | tested | ready_for_shipment",
  "approvalStatus": "pending | qc_approved | approved",
  "testResultUploaded": false,
  "createdAt": "string (ISO date)"
}
```

**Backend snake_case:** `product_id`, `lot_number`, `supplier_name`, `total_boxes`, `total_weight`, `approval_status`, `test_result_uploaded`, `created_at`

---

### 9.2 Get Inventory Items
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/inventory/items` |
| **Source** | `ClamFlowAPI.getInventoryItems()`, `APIClient.getInventory()` |
| **Response Type** | `InventoryItem[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "itemId": "string",
  "lotNumber": "string",
  "species": "string",
  "quantity": 0,
  "weight": 0,
  "location": "string",
  "status": "string",
  "lastUpdated": "string (ISO date)"
}
```

**Backend snake_case:** `item_id`, `lot_number`, `last_updated`

---

### 9.3 Get Test Results
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/inventory/test-results` |
| **Source** | `ClamFlowAPI.getTestResults()` |
| **Response Type** | `TestResult[]` |
| **Array Enforced** | Yes |

**Expected Response per item (camelCase after transform):**
```json
{
  "testId": "string",
  "lotNumber": "string",
  "species": "string",
  "testType": "string",
  "result": "pass | fail | pending",
  "testedBy": "string",
  "testedAt": "string (ISO date)",
  "notes": "string"
}
```

**Backend snake_case:** `test_id`, `lot_number`, `test_type`, `tested_by`, `tested_at`

---

### 9.4 Get Ready for Shipment
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/inventory/ready-for-shipment` |
| **Source** | `ClamFlowAPI.getReadyForShipment()` |
| **Response Type** | `ReadyForShipment[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "shipmentId": "string",
  "lotNumber": "string",
  "species": "string",
  "totalBoxes": 0,
  "totalWeight": 0,
  "approvedAt": "string (ISO date)",
  "destination": "string"
}
```

**Backend snake_case:** `shipment_id`, `lot_number`, `total_boxes`, `total_weight`, `approved_at`

---

### 9.5 Get Pending Inventory Approvals
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/inventory/pending-approvals` |
| **Source** | `ClamFlowAPI.getPendingInventoryApprovals()` |
| **Response Type** | `PendingApproval[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "approvalId": "string",
  "lotNumber": "string",
  "species": "string",
  "submittedBy": "string",
  "submittedAt": "string (ISO date)",
  "approvalStage": "qc | supervisor",
  "urgency": "low | medium | high"
}
```

**Backend snake_case:** `approval_id`, `lot_number`, `submitted_by`, `submitted_at`, `approval_stage`

---

## 10. WEIGHT NOTES (Forms)

### 10.1 Get Weight Notes
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /weight-notes/` |
| **Source** | `ClamFlowAPI.getWeightNotes()` |
| **Alt Endpoint** | `GET /api/weight-notes/` (via `APIClient`) |
| **Response Type** | `WeightNoteFormData[]` |

**Expected Response per item (camelCase after transform, from ClamFlowAPI):**
```json
{
  "id": "string",
  "lotId": "string",
  "supplierId": "string",
  "boxNumber": "string",
  "weight": 0,
  "grossWeight": 0,
  "tareWeight": 0,
  "netWeight": 0,
  "temperature": 0,
  "visualQuality": "string",
  "shellCondition": "string",
  "notes": "string",
  "status": "string",
  "qcStaffName": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)",
  "createdBy": "string"
}
```

**Backend snake_case:** `lot_id`, `supplier_id`, `box_number`, `gross_weight`, `tare_weight`, `net_weight`, `visual_quality`, `shell_condition`, `qc_staff_name`, `created_at`, `updated_at`, `created_by`

---

### 10.2 Create Weight Note
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /weight-notes/` |
| **Source** | `ClamFlowAPI.createWeightNote()` |
| **Alt Endpoint** | `POST /api/weight-notes/` (via `APIClient`) |
| **Request Body** | WeightNoteFormData (full) or `{ "lot_id": "", "supplier_id": "", "box_number": "", "weight": 0 }` (APIClient) |

---

### 10.3 Approve Weight Note
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /weight-notes/{noteId}` |
| **Source** | `ClamFlowAPI.approveWeightNote()` |
| **Alt Endpoint** | `PUT /api/weight-notes/{id}` (via `APIClient`) |

---

## 11. PPC FORMS

### 11.1 Get PPC Forms
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/ppc-forms/` |
| **Source** | `ClamFlowAPI.getPPCForms()` |
| **Response Type** | `PPCFormData[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "lotId": "string",
  "boxNumber": "string",
  "productType": "string",
  "grade": "string",
  "weight": 0,
  "status": "string",
  "qcStaffName": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)",
  "createdBy": "string"
}
```

---

### 11.2 Create PPC Form
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/ppc-forms/` |
| **Source** | `ClamFlowAPI.createPPCForm()`, `APIClient.createPPCForm()` |
| **Request Body (ClamFlowAPI)** | Partial `PPCFormData` |
| **Request Body (APIClient)** | `{ "lot_id": "", "product_grade": "", "quality_notes": "" }` |

---

### 11.3 Get Single PPC Form
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/ppc-forms/{id}` |
| **Source** | `ClamFlowAPI.getPPCForm()` |

---

### 11.4 Update PPC Form
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/ppc-forms/{id}` |
| **Source** | `ClamFlowAPI.updatePPCForm()`, `APIClient.approvePPCForm()` |

---

### 11.5 Add PPC Box
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/ppc-forms/{formId}/boxes` |
| **Source** | `ClamFlowAPI.addPPCBox()` |

---

### 11.6 Submit PPC Form for QC
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/ppc-forms/{formId}/submit` |
| **Source** | `ClamFlowAPI.submitPPCFormForQC()` |

---

## 12. FP FORMS

### 12.1 Get FP Forms
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/fp-forms/` |
| **Source** | `ClamFlowAPI.getFPForms()` |
| **Response Type** | `FPFormData[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "lotId": "string",
  "boxNumber": "string",
  "rfidTag": "string",
  "productType": "string",
  "grade": "string",
  "weight": 0,
  "status": "string",
  "qcStaffName": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)",
  "createdBy": "string"
}
```

---

### 12.2 Create FP Form
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/fp-forms/` |
| **Source** | `ClamFlowAPI.createFPForm()`, `APIClient.createFPForm()` |
| **Request Body (APIClient)** | `{ "lot_id": "", "final_weight": 0, "packaging_details": "" }` |

---

### 12.3 Get Single FP Form
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/fp-forms/{id}` |
| **Source** | `ClamFlowAPI.getFPForm()` |

---

### 12.4 Update FP Form
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/fp-forms/{id}` |
| **Source** | `ClamFlowAPI.updateFPForm()`, `APIClient.approveFPForm()` |

---

### 12.5 Add FP Box
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/fp-forms/{formId}/boxes` |
| **Source** | `ClamFlowAPI.addFPBox()` |

---

### 12.6 Submit FP Form for QC
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/fp-forms/{formId}/submit` |
| **Source** | `ClamFlowAPI.submitFPFormForQC()` |

---

### 12.7 Generate QR Label
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/fp-forms/generate-qr-label` |
| **Source** | `ClamFlowAPI.generateQRLabel()` |
| **Request Body** | |

```json
{
  "lotId": "string",
  "boxNumber": "string",
  "productType": "string",
  "grade": "string",
  "weight": 0,
  "rfidTagId": "string (optional)",
  "staffId": "string",
  "originalBoxNumber": "string (optional)"
}
```

**Expected Response (camelCase after transform):**
```json
{
  "id": "string",
  "qrCodeData": "string",
  "qrCodeImage": "string (Base64)",
  "labelData": {
    "lotNumber": "string",
    "boxNumber": "string",
    "productType": "string",
    "grade": "string",
    "weight": 0,
    "packDate": "string",
    "expiryDate": "string",
    "traceabilityCode": "string"
  },
  "generatedAt": "string (ISO date)",
  "generatedBy": "string"
}
```

---

## 13. QC WORKFLOW

### 13.1 Get QC Forms
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/qc/forms` |
| **Query Params** | `?status=string&form_type=string` (both optional) |
| **Source** | `ClamFlowAPI.getQCForms()` |
| **Response Type** | `QCFormResponse[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "formType": "weight_note | ppc_form | fp_form | depuration_form",
  "status": "pending | qc_approved | qc_rejected | production_lead_approved | qc_lead_approved",
  "lotNumber": "string | null",
  "lotId": "string | null",
  "createdAt": "string (ISO date)",
  "submittedAt": "string (ISO date) | null",
  "submittedBy": "string | null",
  "stationId": "string | null",
  "formData": {}
}
```

**Backend snake_case:** `form_type`, `lot_number`, `lot_id`, `created_at`, `submitted_at`, `submitted_by`, `station_id`, `form_data`

---

### 13.2 Get QC Metrics
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/qc/metrics` |
| **Source** | `ClamFlowAPI.getQCMetrics()` |
| **Response Type** | `QCMetricsResponse` |

**Expected Response (camelCase after transform):**
```json
{
  "pending": 0,
  "approved": 0,
  "rejected": 0,
  "byFormType": {
    "weightNotes": { "pending": 0, "approved": 0, "rejected": 0 },
    "ppcForms": { "pending": 0, "approved": 0, "rejected": 0 },
    "fpForms": { "pending": 0, "approved": 0, "rejected": 0 },
    "depurationForms": { "pending": 0, "approved": 0, "rejected": 0 }
  }
}
```

**Note:** The interface defines `byFormType` keys as `weight_notes`, `ppc_forms`, etc. but after transform they'll become `weightNotes`, `ppcForms`, etc. The backend should use snake_case: `by_form_type.weight_notes`, etc.

---

### 13.3 Get Pending QC Forms
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/forms/pending` |
| **Source** | `ClamFlowAPI.getPendingQCForms()` |
| **Response Type** | `QCFormResponse[]` |

---

### 13.4 Approve QC Form
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/forms/{formId}/approve` |
| **Source** | `ClamFlowAPI.approveQCForm()` |
| **Request Body** | `{ "observations": "string (optional)" }` |

**Expected Response (camelCase after transform):**
```json
{
  "success": true,
  "formId": "string",
  "newStatus": "string",
  "approvedBy": "string",
  "approvedAt": "string (ISO date)",
  "message": "string (optional)"
}
```

---

### 13.5 Reject QC Form
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/forms/{formId}/reject` |
| **Source** | `ClamFlowAPI.rejectQCForm()` |
| **Request Body** | `{ "rejection_reason": "string" }` |

---

### 13.6 Production Lead Approve PPC
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/forms/{formId}/production-lead-approve` |
| **Source** | `ClamFlowAPI.productionLeadApprovePPC()` |
| **Request Body** | `{ "observations": "string (optional)" }` |

---

### 13.7 QC Lead Approve FP
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/forms/{formId}/qc-lead-approve` |
| **Source** | `ClamFlowAPI.qcLeadApproveFP()` |
| **Request Body** | `{ "observations": "string (optional)" }` |

---

## 14. APPROVAL WORKFLOW (General)

### 14.1 Get Pending Approvals
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/approval/pending` |
| **Source** | `ClamFlowAPI.getPendingApprovals()` |
| **Response Type** | `ApprovalItem[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "formType": "weight_note | ppc_form | fp_form | qc_form | depuration_form",
  "formId": "string",
  "submittedBy": "string",
  "submittedAt": "string (ISO date)",
  "status": "pending | approved | rejected",
  "priority": "low | medium | high"
}
```

**Backend snake_case:** `form_type`, `form_id`, `submitted_by`, `submitted_at`

---

### 14.2 Approve Form (General)
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/approval/{formId}/approve` |
| **Source** | `ClamFlowAPI.approveForm()` |
| **Request Body** | `{ "form_type": "string" }` |

---

### 14.3 Reject Form (General)
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/approval/{formId}/reject` |
| **Source** | `ClamFlowAPI.rejectForm()` |
| **Request Body** | `{ "rejection_reason": "string (optional)" }` |

---

## 15. DEPURATION

### 15.1 Get Depuration Forms
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/v1/depuration/forms` |
| **Source** | `ClamFlowAPI.getDepurationForms()` |
| **Response Type** | `DepurationFormResponse[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "sampleId": "string",
  "lotId": "string",
  "depurationTankId": "string",
  "startTime": "string (ISO date)",
  "plannedDuration": 0,
  "status": "pending | in_progress | completed | approved | rejected",
  "qcStaffId": "string",
  "qcStaffName": "string (optional)",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

**Backend snake_case:** `sample_id`, `lot_id`, `depuration_tank_id`, `start_time`, `planned_duration`, `qc_staff_id`, `qc_staff_name`, `created_at`, `updated_at`

---

### 15.2 Extract Sample
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/v1/depuration/sample` |
| **Source** | `ClamFlowAPI.extractSample()` |
| **Request Body** | |

```json
{
  "lotId": "string",
  "sampleType": "string",
  "extractionPoint": "string",
  "sampleSize": 0,
  "containerType": "string",
  "preservationMethod": "string",
  "qcStaffId": "string",
  "extractionTime": "string (ISO date)",
  "storageTemperature": 0,
  "testingRequirements": {
    "microbiological": true,
    "chemical": true,
    "physical": true,
    "nutritional": true,
    "heavyMetals": true,
    "pesticides": true
  },
  "notes": "string (optional)"
}
```

**Note:** This request body uses camelCase keys as defined in the TypeScript interface. The backend should accept snake_case equivalents (`lot_id`, `sample_type`, `extraction_point`, `sample_size`, `container_type`, `preservation_method`, `qc_staff_id`, `extraction_time`, `storage_temperature`, `testing_requirements`, `heavy_metals`).

---

### 15.3 Submit Depuration Form
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/v1/depuration/form` |
| **Source** | `ClamFlowAPI.submitDepurationForm()` |
| **Request Body** | Untyped (`unknown`) |

---

### 15.4 Approve Depuration
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/v1/depuration/{depurationId}/approve` |
| **Source** | `ClamFlowAPI.approveDepuration()` |

---

### 15.5 Create Sample Extraction (APIClient)
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/v1/depuration/` |
| **Source** | `APIClient.createSampleExtraction()` |
| **Request Body** | `{ "lot_id": "", "tank_location": "", "sample_type": "", "extracted_by": "" }` |

---

### 15.6 Submit Depuration Result (QC Lead)
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /qc-lead/depuration-result` |
| **Source** | `APIClient.submitDepurationResult()` |
| **Request Body** | `{ "lot_id": "", "test_results": {}, "approved": true }` |

---

### 15.7 Approve Microbiology (QC Lead)
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /qc-lead/lots/{lotId}/approve-microbiology` |
| **Source** | `APIClient.approveMicrobiology()` |

---

## 16. LOT MANAGEMENT

### 16.1 Get Lots
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/v1/lots/` |
| **Source** | `ClamFlowAPI.getLots()` |
| **Response Type** | `LotResponse[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "lotNumber": "string",
  "supplierId": "string",
  "supplierName": "string (optional)",
  "status": "received | washing | depuration | ppc | fp | shipped | archived",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)",
  "createdBy": "string (optional)",
  "weightNoteId": "string (optional)"
}
```

**Backend snake_case:** `lot_number`, `supplier_id`, `supplier_name`, `created_at`, `updated_at`, `created_by`, `weight_note_id`

---

### 16.2 Create Lot
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/v1/lots/` |
| **Source** | `ClamFlowAPI.createLot()` |
| **Request Body** | `{ "supplierId": "string", "weightNoteId": "string", "notes": "string (optional)" }` |

**Note:** Request body is typed with camelCase in TS. Backend should accept snake_case: `supplier_id`, `weight_note_id`.

---

### 16.3 Get Single Lot
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/v1/lots/{lotId}` |
| **Source** | `ClamFlowAPI.getLot()`, `APIClient.getLotDetails()` |
| **Response Type** | `LotResponse` |

---

### 16.4 Update Lot Status
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/v1/lots/{lotId}` |
| **Source** | `ClamFlowAPI.updateLotStatus()` |
| **Request Body** | `{ "status": "string" }` |

---

## 17. STATION DEFINITIONS & ASSIGNMENTS

### 17.1 Get Station Definitions
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/stations/` |
| **Query Params** | `?plant_type=PPC|FP&status=string` (both optional) |
| **Source** | `ClamFlowAPI.getStationDefinitions()` |
| **Response Type** | `StationDefinition[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "name": "string",
  "code": "string",
  "plantType": "PPC | FP",
  "stationType": "string",
  "capacity": 0,
  "status": "operational | maintenance | offline",
  "location": "string | null",
  "stationOrder": 0,
  "description": "string | null",
  "requiredSkills": "string | null",
  "isActive": true,
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

**Backend snake_case:** `plant_type`, `station_type`, `station_order`, `required_skills`, `is_active`, `created_at`, `updated_at`

---

### 17.2 Get Stations with Assignments
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/stations/with-assignments` |
| **Query Params** | `?date=YYYY-MM-DD&plant_type=PPC|FP` (date required) |
| **Source** | `ClamFlowAPI.getStationsWithAssignments()` |
| **Response Type** | `StationWithAssignments[]` |

**Expected Response per item:** Same as `StationDefinition` plus:
```json
{
  "assignments": [
    {
      "id": "string",
      "staffId": "string",
      "staffName": "string",
      "assignedDate": "string",
      "startTime": "string | null",
      "endTime": "string | null",
      "status": "string"
    }
  ]
}
```

**Backend snake_case in assignments:** `staff_id`, `staff_name`, `assigned_date`, `start_time`, `end_time`

---

### 17.3 Get Single Station
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/stations/{stationId}` |
| **Source** | `ClamFlowAPI.getStation()` |
| **Response Type** | `StationDefinition` |

---

### 17.4 Create Station
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/stations/` |
| **Source** | `ClamFlowAPI.createStation()` |
| **Request Body** | Partial `StationDefinition` |

---

### 17.5 Update Station
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/stations/{stationId}` |
| **Source** | `ClamFlowAPI.updateStation()` |

---

### 17.6 Delete Station
| Property | Value |
|----------|-------|
| **Endpoint** | `DELETE /api/stations/{stationId}` |
| **Source** | `ClamFlowAPI.deleteStation()` |

---

### 17.7 Get Station Assignments
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/stations/assignments/` |
| **Query Params** | `?station_id=&staff_id=&date=&start_date=&end_date=&status=active|completed|cancelled` |
| **Source** | `ClamFlowAPI.getStationAssignments()` |
| **Response Type** | `StationAssignment[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "stationId": "string",
  "staffId": "string",
  "shiftAssignmentId": "string | null",
  "assignedDate": "string",
  "startTime": "string | null",
  "endTime": "string | null",
  "status": "active | completed | cancelled",
  "notes": "string | null",
  "assignedBy": "string | null",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

**Backend snake_case:** `station_id`, `staff_id`, `shift_assignment_id`, `assigned_date`, `start_time`, `end_time`, `assigned_by`, `created_at`, `updated_at`

---

### 17.8 Get Single Station Assignment
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/stations/assignments/{assignmentId}` |
| **Source** | `ClamFlowAPI.getStationAssignment()` |

---

### 17.9 Create Station Assignment
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/stations/assignments/` |
| **Source** | `ClamFlowAPI.createStationAssignment()` |
| **Request Body** | |

```json
{
  "station_id": "string",
  "staff_id": "string",
  "assigned_date": "string (YYYY-MM-DD)",
  "start_time": "string (optional)",
  "end_time": "string (optional)",
  "shift_assignment_id": "string (optional)",
  "notes": "string (optional)"
}
```

---

### 17.10 Update Station Assignment
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/stations/assignments/{assignmentId}` |
| **Source** | `ClamFlowAPI.updateStationAssignment()` |

---

### 17.11 Delete Station Assignment
| Property | Value |
|----------|-------|
| **Endpoint** | `DELETE /api/stations/assignments/{assignmentId}` |
| **Source** | `ClamFlowAPI.deleteStationAssignment()` |

---

### 17.12 Bulk Create Station Assignments
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/stations/assignments/bulk` |
| **Source** | `ClamFlowAPI.bulkCreateStationAssignments()` |
| **Request Body** | |

```json
{
  "date": "string (YYYY-MM-DD)",
  "assignments": [
    {
      "station_id": "string",
      "staff_id": "string",
      "start_time": "string (optional)",
      "end_time": "string (optional)",
      "notes": "string (optional)"
    }
  ]
}
```

**Expected Response:**
```json
{
  "created": 0,
  "updated": 0,
  "assignments": [ /* StationAssignment[] */ ]
}
```

---

### 17.13 Clear Assignments for Date
| Property | Value |
|----------|-------|
| **Endpoint** | `DELETE /api/stations/assignments/by-date/{date}` |
| **Source** | `ClamFlowAPI.clearAssignmentsForDate()` |
| **URL Param** | `date` = YYYY-MM-DD |

---

## 18. SHIFT DEFINITIONS & ASSIGNMENTS

### 18.1 Get Shift Definitions
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/shifts/shift-definitions` |
| **Source** | `ClamFlowAPI.getShiftDefinitions()` |
| **Response Type** | `ShiftDefinition[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "name": "string",
  "code": "string",
  "startTime": "string",
  "endTime": "string",
  "breakDurationMinutes": 0,
  "color": "string",
  "isActive": true,
  "appliesToPlants": ["PPC", "FP"],
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

**Backend snake_case:** `start_time`, `end_time`, `break_duration_minutes`, `is_active`, `applies_to_plants`, `created_at`, `updated_at`

---

### 18.2 Get Single Shift Definition
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/shifts/shift-definitions/{definitionId}` |
| **Source** | `ClamFlowAPI.getShiftDefinition()` |

---

### 18.3 Create Shift Definition
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/shifts/shift-definitions` |
| **Source** | `ClamFlowAPI.createShiftDefinition()` |
| **Request Body** | |

```json
{
  "name": "string",
  "code": "string",
  "start_time": "string",
  "end_time": "string",
  "break_duration_minutes": 0,
  "color": "string (optional)",
  "applies_to_plants": ["PPC", "FP"]
}
```

---

### 18.4 Update Shift Definition
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/shifts/shift-definitions/{definitionId}` |
| **Source** | `ClamFlowAPI.updateShiftDefinition()` |

---

### 18.5 Delete Shift Definition
| Property | Value |
|----------|-------|
| **Endpoint** | `DELETE /api/shifts/shift-definitions/{definitionId}` |
| **Source** | `ClamFlowAPI.deleteShiftDefinition()` |

---

### 18.6 Get Shift Assignments
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/shifts/shift-assignments` |
| **Query Params** | `?staff_id=&shift_definition_id=&start_date=&end_date=&plant=PPC|FP` |
| **Source** | `ClamFlowAPI.getShiftAssignments()` |
| **Response Type** | `ShiftAssignment[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "staffId": "string",
  "shiftDefinitionId": "string",
  "date": "string (YYYY-MM-DD)",
  "plant": "PPC | FP",
  "status": "scheduled | completed | cancelled | no_show",
  "notes": "string | null",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

**Backend snake_case:** `staff_id`, `shift_definition_id`, `created_at`, `updated_at`

---

### 18.7 Get Single Shift Assignment
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/shifts/shift-assignments/{assignmentId}` |
| **Source** | `ClamFlowAPI.getShiftAssignment()` |

---

### 18.8 Create Shift Assignment
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/shifts/shift-assignments` |
| **Source** | `ClamFlowAPI.createShiftAssignment()` |
| **Request Body** | |

```json
{
  "staff_id": "string",
  "shift_definition_id": "string",
  "date": "string (YYYY-MM-DD)",
  "plant": "PPC | FP",
  "notes": "string (optional)"
}
```

---

### 18.9 Update Shift Assignment
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/shifts/shift-assignments/{assignmentId}` |
| **Source** | `ClamFlowAPI.updateShiftAssignment()` |

---

### 18.10 Delete Shift Assignment
| Property | Value |
|----------|-------|
| **Endpoint** | `DELETE /api/shifts/shift-assignments/{assignmentId}` |
| **Source** | `ClamFlowAPI.deleteShiftAssignment()` |

---

### 18.11 Get Staff for Scheduler
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/shifts/staff-for-scheduler` |
| **Source** | `ClamFlowAPI.getStaffForScheduler()` |
| **Response Type** | `StaffForScheduler[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "fullName": "string",
  "employeeId": "string",
  "department": "string",
  "plant": "string",
  "isActive": true
}
```

**Backend snake_case:** `full_name`, `employee_id`, `is_active`

---

## 19. ONBOARDING

### 19.1 Submit Staff Onboarding
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/onboarding/staff` |
| **Source** | `ClamFlowAPI.submitStaffOnboarding()`, `APIClient.submitStaffOnboarding()` |
| **Request Body** | |

```json
{
  "full_name": "string",
  "email": "string",
  "role": "string",
  "department": "string (optional)",
  "phone": "string (optional)"
}
```

---

### 19.2 Submit Supplier Onboarding
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/onboarding/supplier` |
| **Source** | `ClamFlowAPI.submitSupplierOnboarding()`, `APIClient.submitSupplierOnboarding()` |
| **Request Body** | |

```json
{
  "name": "string",
  "contact_info": {
    "phone": "string",
    "email": "string",
    "address": "string"
  },
  "boat_details": {
    "boat_name": "string",
    "registration_number": "string",
    "capacity_kg": 0
  }
}
```

---

### 19.3 Submit Vendor Onboarding
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/onboarding/vendor` |
| **Source** | `ClamFlowAPI.submitVendorOnboarding()`, `APIClient.submitVendorOnboarding()` |
| **Request Body** | |

```json
{
  "firm_name": "string",
  "category": "string",
  "contact_details": {
    "phone": "string",
    "email": "string",
    "address": "string"
  }
}
```

---

### 19.4 Generic Onboarding Submit
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/onboarding/{entityType}` |
| **Source** | `ClamFlowAPI.submitOnboarding()` |
| **URL Param** | `entityType` = `staff | supplier | vendor` |

---

### 19.5 Approve Onboarding
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/onboarding/{id}/approve` |
| **Source** | `ClamFlowAPI.approveOnboarding()`, `APIClient.approveOnboarding()` |

---

### 19.6 Reject Onboarding
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/onboarding/{id}/reject` |
| **Source** | `ClamFlowAPI.rejectOnboarding()`, `APIClient.rejectOnboarding()` |
| **Request Body** | `{ "reason": "string (optional)" }` |

---

### 19.7 Get Pending Onboarding
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/onboarding/pending` |
| **Source** | `ClamFlowAPI.getPendingOnboarding()` |
| **Response Type** | `OnboardingResponse[]` |

**Expected Response per item (camelCase after transform):**
```json
{
  "id": "string",
  "entityType": "staff | supplier | vendor",
  "status": "pending | approved | rejected",
  "data": {},
  "submittedBy": "string",
  "submittedAt": "string (ISO date)",
  "approvedBy": "string (optional)",
  "approvedAt": "string (optional)",
  "rejectedBy": "string (optional)",
  "rejectedAt": "string (optional)",
  "rejectionReason": "string (optional)"
}
```

**Backend snake_case:** `entity_type`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `rejection_reason`

---

## 20. RFID OPERATIONS

### 20.1 Link RFID Tag
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/rfid/link` |
| **Source** | `ClamFlowAPI.linkRFIDTag()` |
| **Request Body** | |

```json
{
  "tagId": "string",
  "boxNumber": "string",
  "lotId": "string",
  "productType": "string",
  "grade": "string",
  "weight": 0,
  "staffId": "string"
}
```

**Backend snake_case:** `tag_id`, `box_number`, `lot_id`, `product_type`, `staff_id`

---

### 20.2 Scan RFID Tag
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/rfid/scan/{tagId}` |
| **Source** | `ClamFlowAPI.scanRFIDTag()` |
| **Response Type** | `RFIDTagResponse` |

**Expected Response (camelCase after transform):**
```json
{
  "id": "string",
  "tagId": "string",
  "boxNumber": "string",
  "lotId": "string",
  "productType": "string",
  "grade": "string",
  "weight": 0,
  "linkedAt": "string (ISO date)",
  "linkedBy": "string",
  "status": "active | inactive | transferred"
}
```

---

### 20.3 Get RFID Tags
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/rfid/tags` |
| **Source** | `ClamFlowAPI.getRFIDTags()` |
| **Response Type** | `RFIDTagResponse[]` |

---

### 20.4 Update RFID Tag
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /api/rfid/tags/{tagId}` |
| **Source** | `ClamFlowAPI.updateRFIDTag()` |

---

## APPENDIX A: COMPLETE ENDPOINT INDEX

| # | Method | Endpoint | Source |
|---|--------|----------|--------|
| 1 | POST | `/auth/login` | AuthContext, ClamFlowAPI |
| 2 | POST | `/auth/biometric-login` | AuthService |
| 3 | POST | `/auth/change-password` | AuthContext |
| 4 | POST | `/auth/refresh` | AuthContext, AuthService |
| 5 | POST | `/auth/logout` | AuthService |
| 6 | GET | `/auth/me` | AuthService |
| 7 | GET | `/user/profile` | ClamFlowAPI |
| 8 | GET | `/health` | ClamFlowAPI, APIClient |
| 9 | GET | `/api/users/` | ClamFlowAPI |
| 10 | POST | `/api/users/` | ClamFlowAPI |
| 11 | PUT | `/api/users/{userId}` | ClamFlowAPI |
| 12 | DELETE | `/api/users/{userId}` | ClamFlowAPI |
| 13 | GET | `/super-admin/admins` | ClamFlowAPI |
| 14 | POST | `/super-admin/create-admin` | ClamFlowAPI |
| 15 | PUT | `/super-admin/admins/{adminId}` | ClamFlowAPI |
| 16 | DELETE | `/super-admin/admins/{adminId}` | ClamFlowAPI |
| 17 | GET | `/super-admin/api-monitoring` | ClamFlowAPI |
| 18 | GET | `/dashboard/metrics` | ClamFlowAPI |
| 19 | GET | `/notifications/` | ClamFlowAPI |
| 20 | GET | `/audit/logs` | ClamFlowAPI |
| 21 | GET | `/api/operations/stations` | ClamFlowAPI |
| 22 | GET | `/api/operations/active-lots` | ClamFlowAPI |
| 23 | GET | `/api/operations/bottlenecks` | ClamFlowAPI |
| 24 | GET | `/api/operations/live` | ClamFlowAPI |
| 25 | GET | `/api/gate/vehicles` | ClamFlowAPI |
| 26 | GET | `/api/gate/active` | ClamFlowAPI |
| 27 | GET | `/api/gate/suppliers` | ClamFlowAPI, APIClient |
| 28 | GET | `/api/gate/checkpoints` | ClamFlowAPI |
| 29 | POST | `/api/gate/vehicle-entry` | APIClient |
| 30 | POST | `/api/gate/vehicle-exit` | APIClient |
| 31 | GET | `/api/gate/inside-vehicles` | APIClient |
| 32 | GET | `/api/gate/vendors` | APIClient |
| 33 | GET | `/api/security/cameras` | ClamFlowAPI |
| 34 | GET | `/api/security/events` | ClamFlowAPI |
| 35 | GET | `/api/security/face-detection` | ClamFlowAPI |
| 36 | GET | `/api/security/unauthorized` | ClamFlowAPI |
| 37 | GET | `/api/analytics/throughput` | ClamFlowAPI |
| 38 | GET | `/api/analytics/efficiency` | ClamFlowAPI |
| 39 | GET | `/api/analytics/quality` | ClamFlowAPI |
| 40 | GET | `/api/analytics/processing-times` | ClamFlowAPI |
| 41 | GET | `/api/staff/attendance` | ClamFlowAPI |
| 42 | GET | `/api/staff/locations` | ClamFlowAPI |
| 43 | GET | `/api/staff/performance` | ClamFlowAPI |
| 44 | GET | `/api/staff/shifts` | ClamFlowAPI |
| 45 | GET | `/api/staff/` | ClamFlowAPI, APIClient |
| 46 | GET | `/api/staff/?role=qc` | ClamFlowAPI |
| 47 | POST | `/api/attendance/` | APIClient |
| 48 | GET | `/api/inventory/finished-products` | ClamFlowAPI |
| 49 | GET | `/api/inventory/items` | ClamFlowAPI, APIClient |
| 50 | GET | `/api/inventory/test-results` | ClamFlowAPI |
| 51 | GET | `/api/inventory/ready-for-shipment` | ClamFlowAPI |
| 52 | GET | `/api/inventory/pending-approvals` | ClamFlowAPI |
| 53 | GET | `/weight-notes/` | ClamFlowAPI |
| 54 | POST | `/weight-notes/` | ClamFlowAPI |
| 55 | PUT | `/weight-notes/{noteId}` | ClamFlowAPI |
| 56 | GET | `/api/weight-notes/` | APIClient |
| 57 | POST | `/api/weight-notes/` | APIClient |
| 58 | PUT | `/api/weight-notes/{id}` | APIClient |
| 59 | GET | `/api/ppc-forms/` | ClamFlowAPI |
| 60 | POST | `/api/ppc-forms/` | ClamFlowAPI, APIClient |
| 61 | GET | `/api/ppc-forms/{id}` | ClamFlowAPI |
| 62 | PUT | `/api/ppc-forms/{id}` | ClamFlowAPI, APIClient |
| 63 | POST | `/api/ppc-forms/{formId}/boxes` | ClamFlowAPI |
| 64 | PUT | `/api/ppc-forms/{formId}/submit` | ClamFlowAPI |
| 65 | GET | `/api/fp-forms/` | ClamFlowAPI |
| 66 | POST | `/api/fp-forms/` | ClamFlowAPI, APIClient |
| 67 | GET | `/api/fp-forms/{id}` | ClamFlowAPI |
| 68 | PUT | `/api/fp-forms/{id}` | ClamFlowAPI, APIClient |
| 69 | POST | `/api/fp-forms/{formId}/boxes` | ClamFlowAPI |
| 70 | PUT | `/api/fp-forms/{formId}/submit` | ClamFlowAPI |
| 71 | POST | `/api/fp-forms/generate-qr-label` | ClamFlowAPI |
| 72 | GET | `/api/qc/forms` | ClamFlowAPI |
| 73 | GET | `/api/qc/metrics` | ClamFlowAPI |
| 74 | GET | `/api/forms/pending` | ClamFlowAPI |
| 75 | PUT | `/api/forms/{formId}/approve` | ClamFlowAPI |
| 76 | PUT | `/api/forms/{formId}/reject` | ClamFlowAPI |
| 77 | PUT | `/api/forms/{formId}/production-lead-approve` | ClamFlowAPI |
| 78 | PUT | `/api/forms/{formId}/qc-lead-approve` | ClamFlowAPI |
| 79 | GET | `/api/approval/pending` | ClamFlowAPI |
| 80 | PUT | `/api/approval/{formId}/approve` | ClamFlowAPI |
| 81 | PUT | `/api/approval/{formId}/reject` | ClamFlowAPI |
| 82 | GET | `/api/v1/depuration/forms` | ClamFlowAPI |
| 83 | POST | `/api/v1/depuration/sample` | ClamFlowAPI |
| 84 | POST | `/api/v1/depuration/form` | ClamFlowAPI |
| 85 | PUT | `/api/v1/depuration/{depurationId}/approve` | ClamFlowAPI |
| 86 | POST | `/api/v1/depuration/` | APIClient |
| 87 | POST | `/qc-lead/depuration-result` | APIClient |
| 88 | PUT | `/qc-lead/lots/{lotId}/approve-microbiology` | APIClient |
| 89 | GET | `/api/v1/lots/` | ClamFlowAPI |
| 90 | POST | `/api/v1/lots/` | ClamFlowAPI |
| 91 | GET | `/api/v1/lots/{lotId}` | ClamFlowAPI, APIClient |
| 92 | PUT | `/api/v1/lots/{lotId}` | ClamFlowAPI |
| 93 | GET | `/api/stations/` | ClamFlowAPI |
| 94 | GET | `/api/stations/with-assignments` | ClamFlowAPI |
| 95 | GET | `/api/stations/{stationId}` | ClamFlowAPI |
| 96 | POST | `/api/stations/` | ClamFlowAPI |
| 97 | PUT | `/api/stations/{stationId}` | ClamFlowAPI |
| 98 | DELETE | `/api/stations/{stationId}` | ClamFlowAPI |
| 99 | GET | `/api/stations/assignments/` | ClamFlowAPI |
| 100 | GET | `/api/stations/assignments/{assignmentId}` | ClamFlowAPI |
| 101 | POST | `/api/stations/assignments/` | ClamFlowAPI |
| 102 | PUT | `/api/stations/assignments/{assignmentId}` | ClamFlowAPI |
| 103 | DELETE | `/api/stations/assignments/{assignmentId}` | ClamFlowAPI |
| 104 | POST | `/api/stations/assignments/bulk` | ClamFlowAPI |
| 105 | DELETE | `/api/stations/assignments/by-date/{date}` | ClamFlowAPI |
| 106 | GET | `/api/shifts/shift-definitions` | ClamFlowAPI |
| 107 | GET | `/api/shifts/shift-definitions/{definitionId}` | ClamFlowAPI |
| 108 | POST | `/api/shifts/shift-definitions` | ClamFlowAPI |
| 109 | PUT | `/api/shifts/shift-definitions/{definitionId}` | ClamFlowAPI |
| 110 | DELETE | `/api/shifts/shift-definitions/{definitionId}` | ClamFlowAPI |
| 111 | GET | `/api/shifts/shift-assignments` | ClamFlowAPI |
| 112 | GET | `/api/shifts/shift-assignments/{assignmentId}` | ClamFlowAPI |
| 113 | POST | `/api/shifts/shift-assignments` | ClamFlowAPI |
| 114 | PUT | `/api/shifts/shift-assignments/{assignmentId}` | ClamFlowAPI |
| 115 | DELETE | `/api/shifts/shift-assignments/{assignmentId}` | ClamFlowAPI |
| 116 | GET | `/api/shifts/staff-for-scheduler` | ClamFlowAPI |
| 117 | POST | `/api/onboarding/staff` | ClamFlowAPI, APIClient |
| 118 | POST | `/api/onboarding/supplier` | ClamFlowAPI, APIClient |
| 119 | POST | `/api/onboarding/vendor` | ClamFlowAPI, APIClient |
| 120 | POST | `/api/onboarding/{entityType}` | ClamFlowAPI |
| 121 | PUT | `/api/onboarding/{id}/approve` | ClamFlowAPI, APIClient |
| 122 | PUT | `/api/onboarding/{id}/reject` | ClamFlowAPI, APIClient |
| 123 | GET | `/api/onboarding/pending` | ClamFlowAPI |
| 124 | POST | `/api/rfid/link` | ClamFlowAPI |
| 125 | GET | `/api/rfid/scan/{tagId}` | ClamFlowAPI |
| 126 | GET | `/api/rfid/tags` | ClamFlowAPI |
| 127 | PUT | `/api/rfid/tags/{tagId}` | ClamFlowAPI |

---

## APPENDIX B: POLLING INTERVALS BY HOOK

| Hook | Endpoints Polled | Interval |
|------|-----------------|----------|
| `useOperationsData` | `/api/operations/stations`, `/api/operations/active-lots`, `/api/operations/bottlenecks` | **10 seconds** |
| `useSecurityData` | `/api/security/cameras`, `/api/security/face-detection`, `/api/security/events` | **15 seconds** |
| `useGateData` | `/api/gate/vehicles`, `/api/gate/active`, `/api/gate/suppliers` | **30 seconds** |
| `useStaffData` | `/api/staff/attendance`, `/api/staff/locations`, `/api/staff/performance`, `/api/staff/shifts` | **30 seconds** |
| `useInventoryData` | `/api/inventory/finished-products`, `/api/inventory/items`, `/api/inventory/test-results`, `/api/inventory/ready-for-shipment`, `/api/inventory/pending-approvals` | **45 seconds** |
| `useAnalyticsData` | `/api/analytics/throughput`, `/api/analytics/efficiency`, `/api/analytics/quality`, `/api/analytics/processing-times` | **60 seconds** |

---

## APPENDIX C: USER ROLES (Exactly as frontend expects)

The backend must return these exact role strings (Title Case with spaces):

| Role | Hierarchy Level |
|------|----------------|
| `Super Admin` | 100 |
| `Admin` | 10 |
| `Production Lead` | 6 |
| `QC Lead` | 6 |
| `Staff Lead` | 5 |
| `QC Staff` | 4 |
| `Production Staff` | 3 |
| `Security Guard` | 2 |

---

## APPENDIX D: WEIGHT NOTE ENDPOINT CONFLICT

**Important:** There is a discrepancy between the two API clients:
- `ClamFlowAPI` calls `/weight-notes/` (no `/api` prefix)
- `APIClient` calls `/api/weight-notes/`

The backend should support **both** paths, or the frontend should be unified. Note this also affects PUT for approval.

---

## APPENDIX E: AUTH ENDPOINT VARIANTS

| Context | Login Endpoint | Request Fields | User Response Fields |
|---------|---------------|----------------|---------------------|
| `AuthContext.tsx` (primary) | `POST /auth/login` | `username`, `password` | `id`, `username`, `full_name`, `role`, `station`, `is_active`, `requires_password_change`, `first_login` |
| `AuthService` (secondary) | `POST /auth/login` | `email`, `password` | `id`, `email`, `first_name`, `last_name`, `role`, `department`, `is_active`, `permissions`, `last_login` |

The **AuthContext** is the actively used login flow. AuthService appears to be an alternate/unused implementation with different field expectations.
