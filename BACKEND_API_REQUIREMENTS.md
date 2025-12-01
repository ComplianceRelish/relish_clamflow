# Backend API Requirements - ClamFlow Frontend

**Generated**: November 30, 2025  
**Status**: CRITICAL - Frontend components are broken without these endpoints  
**Priority**: HIGH - Blocking production deployment

---

## 🚨 CRITICAL ISSUE

**Frontend components are calling API methods that DO NOT EXIST in the backend.**

This document lists ALL API endpoints required by the frontend to function properly.

---

## 📊 FRONTEND ANALYSIS SUMMARY

### Components Analyzed: 17
### Total API Calls Found: 37
### Existing API Methods: 11 ✅
### Missing API Methods: 14 ❌

---

## ✅ EXISTING API METHODS (Already in clamflow-api.ts)

These methods exist and work:

1. ✅ `getDashboardMetrics()` → `GET /dashboard/metrics`
2. ✅ `getSystemHealth()` → `GET /health`
3. ✅ `getPendingApprovals()` → `GET /api/approval/pending`
4. ✅ `getAuditLogs()` → `GET /audit/logs`
5. ✅ `getAllUsers()` → `GET /api/users`
6. ✅ `createUser(userData)` → `POST /api/users`
7. ✅ `deleteUser(userId)` → `DELETE /api/users/{userId}`
8. ✅ `getAdmins()` → `GET /super-admin/admins`
9. ✅ `createAdmin(adminData)` → `POST /super-admin/create-admin`
10. ✅ `deleteAdmin(adminId)` → `DELETE /super-admin/admins/{adminId}`
11. ✅ `getWeightNotes()` → `GET /api/weight-notes`

---

## ❌ MISSING API METHODS (MUST BE ADDED)

### **Production Forms**

#### 1. `getPPCForms()`
**Used by**: QAFlowDashboard, ClamYieldDashboard, InventoryModule  
**Expected endpoint**: `GET /api/ppc-forms` or `GET /api/forms/ppc`  
**Purpose**: Retrieve all PPC (Pre-Processing Check) forms  
**Response format**:
```typescript
{
  "success": true,
  "data": [
    {
      "id": "string",
      "lot_id": "string",
      "form_number": "string",
      "status": "pending | in_progress | completed | rejected",
      "submitted_by": "string",
      "submitted_at": "ISO 8601",
      "approved_by": "string | null",
      "approved_at": "ISO 8601 | null",
      "data": { /* form-specific fields */ }
    }
  ]
}
```

#### 2. `getFPForms()`
**Used by**: QAFlowDashboard, ClamYieldDashboard, InventoryModule  
**Expected endpoint**: `GET /api/fp-forms` or `GET /api/forms/fp`  
**Purpose**: Retrieve all FP (Finished Product) forms  
**Response format**: Same as getPPCForms

#### 3. `getQCForms()`
**Used by**: QCFlowDashboard  
**Expected endpoint**: `GET /api/qc-forms` or `GET /api/forms/qc`  
**Purpose**: Retrieve all QC (Quality Control) inspection forms  
**Response format**: Same as getPPCForms

#### 4. `createQCForm(qcFormData)`
**Used by**: QCFlowForm  
**Expected endpoint**: `POST /api/qc-forms` or `POST /api/forms/qc`  
**Purpose**: Create new QC inspection form  
**Request body**:
```typescript
{
  "lot_id": "string",
  "inspector_id": "string",
  "inspection_date": "ISO 8601",
  "temperature": number,
  "sample_size": number,
  "inspection_results": { /* results data */ },
  "pass_fail_status": "passed | failed | conditional",
  "notes": "string"
}
```

#### 5. `getDepurationForms()`
**Used by**: QCFlowDashboard  
**Expected endpoint**: `GET /api/depuration-forms` or `GET /api/forms/depuration`  
**Purpose**: Retrieve depuration tank monitoring forms  
**Response format**: Same as getPPCForms

---

### **Lot Management**

#### 6. `getLots()`
**Used by**: QCFlowDashboard, QCFlowForm, ClamYieldDashboard, InventoryModule  
**Expected endpoint**: `GET /api/lots`  
**Purpose**: Retrieve all lots (batches) in the system  
**Response format**:
```typescript
{
  "success": true,
  "data": [
    {
      "id": "string",
      "lot_number": "string",
      "supplier_id": "string",
      "supplier_name": "string",
      "received_date": "ISO 8601",
      "total_weight": number,
      "current_stage": "Weight | PPC | FP | QC | Inventory",
      "status": "active | completed | rejected | in_storage",
      "created_by": "string",
      "created_at": "ISO 8601"
    }
  ]
}
```

---

### **Staff Management**

#### 7. `getStaff()`
**Used by**: QCFlowForm  
**Expected endpoint**: `GET /api/staff` or `GET /api/users?role=staff`  
**Purpose**: Retrieve all staff members (for assignment to forms)  
**Response format**:
```typescript
{
  "success": true,
  "data": [
    {
      "id": "string",
      "username": "string",
      "full_name": "string",
      "role": "QC Lead | QC Staff | Production Lead | etc",
      "station": "string",
      "is_active": boolean,
      "email": "string"
    }
  ]
}
```

---

### **Super Admin Dashboard - New Menu Items**

#### 8. `getStations()` or `getOperationsStations()`
**Used by**: LiveOperationsMonitor (NEW)  
**Expected endpoint**: `GET /api/operations/stations`  
**Purpose**: Real-time station status and operator assignments  
**Response format**:
```typescript
{
  "success": true,
  "data": [
    {
      "stationId": "string",
      "stationName": "Weight Station | PPC Station | FP Station",
      "currentOperator": "string | null",
      "currentLot": "string | null",
      "status": "active | idle | offline",
      "efficiency": number // 0-100%
    }
  ]
}
```

#### 9. `getActiveLots()`
**Used by**: LiveOperationsMonitor (NEW)  
**Expected endpoint**: `GET /api/operations/active-lots`  
**Purpose**: Lots currently in processing  
**Response format**:
```typescript
{
  "success": true,
  "data": [
    {
      "lotId": "string",
      "currentStage": "Weight | PPC | FP",
      "location": "string",
      "startTime": "ISO 8601",
      "estimatedCompletion": "ISO 8601",
      "supplier": "string"
    }
  ]
}
```

#### 10. `getBottlenecks()`
**Used by**: LiveOperationsMonitor (NEW)  
**Expected endpoint**: `GET /api/operations/bottlenecks`  
**Purpose**: Processing delays and alerts  
**Response format**:
```typescript
{
  "success": true,
  "data": [
    {
      "id": "string",
      "stationName": "string",
      "lotId": "string",
      "delayMinutes": number,
      "severity": "low | medium | high"
    }
  ]
}
```

#### 11. `getVehicles()` or `getGateVehicles()`
**Used by**: GateManagement (NEW - placeholder)  
**Expected endpoint**: `GET /api/gate/vehicles`  
**Purpose**: Vehicle entry/exit logs  
**Response format**:
```typescript
{
  "success": true,
  "data": [
    {
      "vehicleId": "string",
      "entryTime": "ISO 8601",
      "exitTime": "ISO 8601 | null",
      "driver": "string",
      "supplier": "string",
      "status": "in_facility | departed",
      "rfidTag": "string"
    }
  ]
}
```

#### 12. `getSecurityEvents()`
**Used by**: SecuritySurveillance (NEW - placeholder)  
**Expected endpoint**: `GET /api/security/events`  
**Purpose**: Security monitoring events  
**Response format**:
```typescript
{
  "success": true,
  "data": [
    {
      "timestamp": "ISO 8601",
      "cameraId": "string",
      "employeeId": "string | null",
      "confidence": number,
      "isAuthorized": boolean,
      "eventType": "face_detection | unauthorized_access | camera_offline"
    }
  ]
}
```

#### 13. `getProductionAnalytics()`
**Used by**: ProductionAnalytics (NEW - placeholder)  
**Expected endpoint**: `GET /api/analytics/production`  
**Purpose**: Throughput and efficiency metrics  
**Response format**:
```typescript
{
  "success": true,
  "data": {
    "throughput": {
      "today": number,
      "thisWeek": number,
      "thisMonth": number
    },
    "stationEfficiency": [
      {
        "stationName": "string",
        "efficiency": number,
        "lotsProcessed": number,
        "avgProcessingTime": number
      }
    ],
    "qualityMetrics": {
      "passRate": number,
      "failRate": number,
      "totalInspected": number
    }
  }
}
```

#### 14. `getStaffAttendance()`
**Used by**: StaffManagement (NEW - placeholder)  
**Expected endpoint**: `GET /api/staff/attendance`  
**Purpose**: Live attendance tracking  
**Response format**:
```typescript
{
  "success": true,
  "data": [
    {
      "userId": "string",
      "fullName": "string",
      "role": "string",
      "status": "checked_in | checked_out | on_break",
      "currentStation": "string | null",
      "shiftStart": "ISO 8601",
      "shiftEnd": "ISO 8601"
    }
  ]
}
```

---

## 🔧 IMPLEMENTATION PRIORITY

### **Priority 1: FIX BROKEN COMPONENTS (IMMEDIATE)**
These are causing TypeScript errors and breaking existing features:

1. ❌ `getPPCForms()` - Used by 3 components
2. ❌ `getFPForms()` - Used by 3 components
3. ❌ `getLots()` - Used by 4 components
4. ❌ `getStaff()` - Used by 1 component
5. ❌ `getQCForms()` - Used by 1 component
6. ❌ `createQCForm()` - Used by 1 component
7. ❌ `getDepurationForms()` - Used by 1 component

### **Priority 2: NEW DASHBOARD FEATURES (SECONDARY)**
These are for new Super Admin Dashboard menu items (currently placeholders):

8. ❌ `getStations()` - Live Operations Monitor
9. ❌ `getActiveLots()` - Live Operations Monitor
10. ❌ `getBottlenecks()` - Live Operations Monitor
11. ❌ `getVehicles()` - Gate Management
12. ❌ `getSecurityEvents()` - Security Surveillance
13. ❌ `getProductionAnalytics()` - Production Analytics
14. ❌ `getStaffAttendance()` - Staff Management

---

## 🐛 KNOWN ISSUES

### **Issue 1: System Overview Shows 0 Active Admins**
**Component**: SuperAdminDashboard - System Overview  
**Problem**: `/dashboard/metrics` endpoint returns 0 for `totalUsers` and `activeUsers`  
**Fix Needed**: Backend should count admins from `user_profiles` table where `role IN ('Admin', 'Super Admin')`

### **Issue 2: Live Operations Shows Incorrect Workflow**
**Component**: LiveOperationsMonitor  
**Problem**: Shows "QC Station" as a separate processing station  
**Reality**: QC/QA oversees the entire workflow, not a separate station  
**Correct workflow**: `Weight Station → PPC Station → FP Station → Inventory`  
**Fix Needed**: Update backend to reflect actual 3-station workflow

---

## 📝 BACKEND TASKS

### **Step 1: Verify Existing Endpoints**
Check if these exist in Railway backend:
- [ ] `/dashboard/metrics` - Does it count admins correctly?
- [ ] `/api/ppc-forms` or equivalent
- [ ] `/api/fp-forms` or equivalent
- [ ] `/api/qc-forms` or equivalent
- [ ] `/api/lots` or equivalent
- [ ] `/api/staff` or `/api/users` with role filtering

### **Step 2: Create Missing Endpoints**
Add these to FastAPI backend:
- [ ] PPC forms CRUD
- [ ] FP forms CRUD
- [ ] QC forms CRUD
- [ ] Depuration forms CRUD
- [ ] Lots management
- [ ] Staff listing
- [ ] Operations monitoring
- [ ] Analytics endpoints

### **Step 3: Fix Dashboard Metrics**
Update `/dashboard/metrics` to return:
```python
{
    "totalUsers": count_admins_all(),
    "activeUsers": count_admins_active(),
    "totalLots": count_lots_active(),
    "pendingApprovals": count_pending_approvals(),
    "systemHealth": "healthy",
    "lastUpdated": datetime.now().isoformat()
}
```

---

## 🎯 SUCCESS CRITERIA

Dashboard is complete when:
- ✅ All 14 missing API methods added to `clamflow-api.ts`
- ✅ All backend endpoints return proper response formats
- ✅ No TypeScript errors in any component
- ✅ System Overview shows actual admin counts
- ✅ All QA/QC forms load correctly
- ✅ Live Operations displays real-time data
- ✅ Zero "mock data" warnings in production

---

## 📞 NEXT STEPS

1. **Review this document** - Ensure all requirements are understood
2. **Open backend folder** - Analyze existing routes
3. **Identify gaps** - Which endpoints exist vs missing
4. **Implement missing endpoints** - Add to Railway backend
5. **Update frontend** - Add API methods to `clamflow-api.ts`
6. **Test & Deploy** - Verify all features work end-to-end

---

**Document Owner**: Frontend Team  
**Backend Implementation**: Backend Team  
**Target Completion**: December 2025  
**Status**: AWAITING BACKEND ANALYSIS
