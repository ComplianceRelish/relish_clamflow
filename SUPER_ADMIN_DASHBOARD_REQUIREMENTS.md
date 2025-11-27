# Super Admin Dashboard - Backend Integration Requirements

## 🎯 Overview
This document outlines the backend files and endpoints needed to implement the new Super Admin Dashboard menu features.

---

## 📋 Menu Structure

### Current Structure (To Be Replaced)
- ❌ System Monitoring → Placeholder
- ❌ Security Center → Placeholder  
- ❌ Disaster Recovery → Placeholder

### New Structure (To Be Implemented)
1. ✅ **System Overview** (Keep as-is - already functional)
2. 🔴 **Live Operations Monitor** (NEW)
3. 🚛 **Gate & Vehicle Management** (NEW)
4. 📹 **Security & Surveillance** (NEW)
5. 👑 **Admin Management** (Keep as-is)

---

## 🔍 Backend Files Required for Analysis

### 1. Core Operations & Station Management
**Purpose**: Real-time operational visibility and workflow tracking

**Files Needed**:
- `routes/operations.py` or `station_routes.py`
- `models/station.py` or `station_operations.py`
- Any related workflow management files

**Endpoints Required**:
- ✓ Live station status (who's working where)
- ✓ Lot tracking through stages (Weight → PPC → FP → QC)
- ✓ Current lot locations
- ✓ Bottleneck detection and alerts
- ✓ Processing stage visualization data

---

### 2. Security & Surveillance
**Purpose**: Real-time security monitoring and incident tracking

**Files Needed**:
- `routes/security.py` or `biometric_routes.py`
- `models/security_events.py`
- Camera integration files (if separate)

**Endpoints Required**:
- ✓ Passive face detection events
- ✓ Security event stream (real-time)
- ✓ Unauthorized access attempts log
- ✓ Camera feed status monitoring
- ✓ Security alert notifications

---

### 3. Gate Control & Vehicle Management
**Purpose**: Entry/exit tracking and supplier management

**Files Needed**:
- `routes/gate_control.py` or `secure_routes.py`
- `models/vehicle_logs.py` or `gate_entries.py`
- Supplier tracking models

**Endpoints Required**:
- ✓ Vehicle entry/exit logs
- ✓ Supplier delivery tracking
- ✓ Security checkpoint logs
- ✓ Gate access control events
- ✓ Vehicle RFID tracking data

**Note**: RFID vehicle tracking and entry/exit logs may overlap - consolidate if they're the same endpoint.

---

### 4. Production Analytics
**Purpose**: Performance metrics and efficiency monitoring

**Files Needed**:
- `routes/analytics.py` or `dashboard_routes.py`
- `models/production_metrics.py`
- Quality control data models

**Endpoints Required**:
- ✓ Today's throughput metrics
- ✓ Efficiency by station
- ✓ Quality control pass/fail rates
- ✓ Processing time analytics
- ✓ Production bottleneck identification
- ✓ Hourly/daily production trends

---

### 5. Staff & Attendance Management
**Purpose**: Real-time staff tracking and performance monitoring

**Files Needed**:
- `routes/attendance.py` or `staff_routes.py`
- `models/attendance.py`
- Staff performance tracking models

**Endpoints Required**:
- ✓ Live attendance dashboard
- ✓ Staff location tracking (current station)
- ✓ Performance metrics by role
- ✓ Shift scheduling overview
- ✓ Staff check-in/check-out logs

---

### 6. Inventory & Finished Products
**Purpose**: Finished product management and shipment readiness

**Files Needed**:
- `routes/inventory.py` or `fp_routes.py`
- `models/inventory.py`
- Finished product models
- Test results models

**Endpoints Required**:
- ✓ Finished Product status
- ✓ Inventory items (packed products)
- ✓ Test results & microbiology data
- ✓ "Ready for Shipment" status tracking
- ✓ Pending approvals queue
- ✓ Product quality metrics

**Key Business Rules**:
- **Inventory** = Finished Product that has been packed
- **Ready for Shipment** = Product in inventory with uploaded test results
- Must track test result upload status

---

### 7. Main Routes/API Structure
**Purpose**: Understanding overall API architecture

**Files Needed**:
- `main.py` or `app.py` (FastAPI main file)
- `api/__init__.py` or `routes/__init__.py`
- Router registration files

**Information Required**:
- Complete list of registered routes
- API prefix structure
- Middleware configuration
- Authentication/authorization setup

---

## 🎨 Frontend Components to Be Built

### 1. Live Operations Monitor Component
```typescript
interface LiveOperationsData {
  stations: StationStatus[];
  activeLots: LotInProgress[];
  workflowStages: ProcessingStage[];
  bottlenecks: BottleneckAlert[];
  lastUpdated: string;
}

interface StationStatus {
  stationId: string;
  stationName: string;
  currentOperator: string | null;
  currentLot: string | null;
  status: 'active' | 'idle' | 'offline';
  efficiency: number;
}

interface LotInProgress {
  lotId: string;
  currentStage: 'Weight' | 'PPC' | 'FP' | 'QC' | 'Inventory';
  location: string;
  startTime: string;
  estimatedCompletion: string;
}
```

### 2. Gate & Vehicle Management Component
```typescript
interface GateControlData {
  vehicleLogs: VehicleEntry[];
  supplierDeliveries: SupplierDelivery[];
  checkpointEvents: SecurityCheckpoint[];
}

interface VehicleEntry {
  vehicleId: string;
  entryTime: string;
  exitTime: string | null;
  driver: string;
  supplier: string;
  status: 'in_facility' | 'departed';
}
```

### 3. Security & Surveillance Component
```typescript
interface SecurityData {
  cameraStatus: CameraFeed[];
  faceDetectionEvents: FaceDetectionEvent[];
  securityEvents: SecurityEvent[];
  unauthorizedAttempts: UnauthorizedAccess[];
}

interface FaceDetectionEvent {
  timestamp: string;
  cameraId: string;
  employeeId: string | null;
  confidence: number;
  isAuthorized: boolean;
}
```

### 4. Production Analytics Component
```typescript
interface ProductionAnalytics {
  throughput: ThroughputMetrics;
  stationEfficiency: StationEfficiency[];
  qualityMetrics: QCMetrics;
  processingTimes: ProcessingTimeData;
}
```

### 5. Staff Management Component
```typescript
interface StaffManagementData {
  attendance: AttendanceRecord[];
  liveLocations: StaffLocation[];
  performanceMetrics: PerformanceData[];
  shiftSchedule: ShiftData[];
}
```

### 6. Inventory & Compliance Component
```typescript
interface InventoryComplianceData {
  finishedProducts: FinishedProduct[];
  inventory: InventoryItem[];
  testResults: TestResult[];
  readyForShipment: ShipmentReadyItem[];
  pendingApprovals: ApprovalItem[];
}

interface InventoryItem {
  id: string;
  productId: string;
  status: 'packed' | 'tested' | 'ready_for_shipment';
  testResultUploaded: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}
```

---

## 🔄 Implementation Plan

### Phase 1: Backend Analysis
1. ✅ Review all backend files listed above
2. ✅ Document available endpoints and their response formats
3. ✅ Identify any missing endpoints that need to be created
4. ✅ Map backend data structures to frontend TypeScript interfaces

### Phase 2: Frontend API Integration
1. Create API service files for each module
2. Define TypeScript interfaces matching backend responses
3. Implement error handling and loading states
4. Add real-time data refresh mechanisms

### Phase 3: Component Development
1. Build Live Operations Monitor dashboard
2. Build Gate & Vehicle Management panel
3. Build Security & Surveillance center
4. Update Production Analytics (if needed)
5. Update Staff Management (if needed)
6. Build Inventory & Compliance dashboard

### Phase 4: Integration & Testing
1. Connect components to real backend APIs
2. Implement WebSocket connections for real-time updates
3. Test with production data
4. Performance optimization

---

## 📊 Data Refresh Requirements

### Real-time (WebSocket/Server-Sent Events)
- Live station status
- Security events
- Vehicle gate entries
- Face detection alerts

### Frequent Polling (Every 30 seconds)
- Lot locations
- Staff attendance
- Production metrics

### Standard Refresh (Every 5 minutes)
- Inventory status
- Test results
- Analytics data

---

## 🔐 Authentication & Permissions

All endpoints must:
- ✅ Require JWT authentication
- ✅ Verify Super Admin role
- ✅ Log access attempts
- ✅ Return appropriate error codes

---

## 📝 Notes

### Key Features to Implement:
1. **Live Operations**: Real-time visibility into who's working where and lot tracking
2. **Gate Control**: Vehicle and supplier tracking at entry/exit points
3. **Security**: Passive face detection, unauthorized access, camera status
4. **Analytics**: Production throughput, efficiency, QC rates
5. **Staff**: Attendance, location, performance metrics
6. **Inventory**: Finished products, test results, shipment readiness

### Items Marked as "Not Relevant":
- ❌ Certificate expiry warnings (removed from scope)
- ❌ Generic regulatory checklist (replaced with specific FP status)

### Items Consolidated:
- RFID-based vehicle tracking merged with Vehicle entry/exit logs (same data)

---

## ✅ Next Steps

1. **Commit & push current frontend changes**
2. **Open backend folder in VS Code**
3. **Analyze backend files listed above**
4. **Map available endpoints to frontend requirements**
5. **Implement new dashboard components**

---

**Document Version**: 1.0  
**Created**: November 28, 2025  
**Status**: Ready for Backend Analysis
