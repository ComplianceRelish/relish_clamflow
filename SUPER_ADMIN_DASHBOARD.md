# Super Admin Dashboard — Reference Document

**Merged from**: `SUPER_ADMIN_DASHBOARD_REQUIREMENTS.md` + `SUPER_ADMIN_DASHBOARD_IMPLEMENTATION_PLAN.md`  
**Last Updated**: June 18, 2026  
**Original Dates**: November 28–29, 2025

---

## 📊 Implementation Status

| Dashboard Section | Component | Frontend | Backend |
|-------------------|-----------|----------|---------|
| System Overview | Existing | ✅ Done | ✅ Done |
| Admin Management | `AdminManagementPanel.tsx` | ✅ Done | ✅ Done (`/super-admin/admins`) |
| Live Operations Monitor | `LiveOperationsMonitor.tsx` | ⚠️ UI only (mock data) | ❌ Endpoints needed |
| Gate & Vehicle Control | — | ❌ Placeholder | ❌ Endpoints needed |
| Security & Surveillance | — | ❌ Placeholder | ❌ Endpoints needed |
| Production Analytics | — | ❌ Placeholder | ❌ Endpoints needed |
| Staff Management | — | ❌ Placeholder | ❌ Endpoints needed |
| Inventory & Shipments | — | ❌ Placeholder | ❌ Endpoints needed |

---

## ✅ Completed Work (November 29, 2025)

### Dashboard Navigation Menu
- Removed: System Monitoring, Security Center, Disaster Recovery
- Added: Live Operations, Gate & Vehicles, Security & Surveillance, Production Analytics, Staff Management, Inventory & Shipments
- Updated `SuperAdminDashboard.tsx` with new menu items and routing

### Live Operations Monitor (`LiveOperationsMonitor.tsx`)
- ✅ Station status grid, active lots table, processing flow visualization
- ✅ Bottleneck alert system, auto-refresh every 10 seconds
- ⚠️ **Still using mock data** — needs backend API connection

### Admin Management Panel
- ✅ Fixed double-wrapped API response issue
- ✅ Connected to `/super-admin/admins` endpoint

### Files Modified So Far
- **Created**: `src/components/dashboards/operations/LiveOperationsMonitor.tsx`
- **Modified**: `src/components/dashboards/SuperAdminDashboard.tsx`
- **Modified**: `src/components/dashboards/admin/AdminManagementPanel.tsx`
- **Needs update**: `src/lib/clamflow-api.ts` (add all new endpoint methods)

---

## 🔌 Backend Endpoints Required (Pending)

### 1. Live Operations Monitor — 10-second polling
```
GET /api/operations/stations      - Station status + operator info
GET /api/operations/active-lots   - Lots currently in processing
GET /api/operations/bottlenecks   - Processing delays and alerts
GET /api/operations/live          - Combined stations + lots + bottlenecks
```

**Station status shape:**
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

### 2. Gate & Vehicle Management — 30-second polling
```
GET  /api/gate/vehicles        - Vehicle entry/exit logs
GET  /api/gate/active          - Currently on-premise vehicles
GET  /api/gate/suppliers       - Supplier delivery tracking
GET  /api/gate/checkpoints     - Security checkpoint logs
POST /api/gate/vehicle-entry   - Log vehicle entry
POST /api/gate/vehicle-exit    - Log vehicle exit
```

### 3. Security & Surveillance — 15-second polling
```
GET /api/security/cameras         - Camera status monitoring
GET /api/security/face-detection  - Face detection events
GET /api/security/events          - Security event stream
GET /api/security/unauthorized    - Unauthorized access attempts
```

### 4. Production Analytics — 60-second polling
```
GET /api/analytics/throughput       - Today's production metrics
GET /api/analytics/efficiency       - Efficiency by station
GET /api/analytics/quality          - QC pass/fail rates
GET /api/analytics/processing-times - Average processing times
```

### 5. Staff Management — 30-second polling
```
GET /api/staff/attendance   - Live attendance dashboard
GET /api/staff/locations    - Staff current station locations
GET /api/staff/performance  - Performance metrics by role
GET /api/staff/shifts       - Current shift schedule
```

### 6. Inventory & Shipments — 45-second polling
```
GET /api/inventory/finished-products   - Finished product status
GET /api/inventory/items               - Packed products in storage
GET /api/inventory/test-results        - Microbiology testing status
GET /api/inventory/ready-for-shipment  - Products cleared for dispatch
GET /api/inventory/pending-approvals   - Items awaiting QC Lead approval
```

---

## 🏷 TypeScript Interfaces

```typescript
// Live Operations
interface StationStatus {
  stationId: string;
  stationName: string;
  currentOperator: string | null;
  currentLot: string | null;
  status: 'active' | 'idle' | 'offline';
  efficiency: number;
}
interface ActiveLot {
  lotId: string;
  lotNumber: string;
  currentStage: 'Weight' | 'PPC' | 'FP' | 'QC' | 'Inventory';
  location: string;
  startTime: string;
  estimatedCompletion: string;
  progress: number;
}

// Gate & Vehicles
interface VehicleEntry {
  vehicleId: string;
  entryTime: string;
  exitTime: string | null;
  driver: string;
  supplier: string;
  status: 'in_facility' | 'departed';
  rfidTag: string;
}

// Security
interface FaceDetectionEvent {
  timestamp: string;
  cameraId: string;
  employeeId: string | null;
  confidence: number;
  isAuthorized: boolean;
  eventType: 'face_detection' | 'unauthorized_access' | 'camera_offline';
}

// Analytics
interface QualityMetrics {
  passRate: number;
  failRate: number;
  avgScore: number;
  byStation: { stationName: string; passRate: number }[];
}

// Inventory
interface InventoryItem {
  id: string;
  productId: string;
  lotId: string;
  status: 'packed' | 'tested' | 'ready_for_shipment';
  testResultUploaded: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  quantity: number;
  destination: string;
}
```

---

## 🛠 Frontend Components Still To Build

| Component | File | Priority |
|-----------|------|----------|
| Connect LiveOperationsMonitor to backend | `LiveOperationsMonitor.tsx` | 1 |
| Gate & Vehicle Management | `GateVehicleManagement.tsx` | 2 |
| Security & Surveillance | `SecuritySurveillance.tsx` | 3 |
| Production Analytics | `ProductionAnalytics.tsx` | 4 |
| Staff Management | `StaffManagement.tsx` | 5 |
| Inventory & Shipments | `InventoryShipments.tsx` | 6 |

All components must:
- Fetch from real backend (no mock data)
- Show loading skeleton during API calls
- Handle error states gracefully
- Auto-refresh at the intervals noted above
- Be responsive (mobile/tablet support)

---

## 🔐 Authentication Requirements

All endpoints require:
- JWT Bearer token
- `Super Admin` role verified
- Standard error format: `{ "success": false, "error": "message" }`

Backend CORS must allow: `https://clamflowcloud.vercel.app` and `http://localhost:3001`

---

## ✅ Success Criteria

- [ ] All 6 new menu items have functional components (real data, no mocks)
- [ ] Auto-refresh works without errors
- [ ] Error states handled gracefully
- [ ] Loading states shown during API calls
- [ ] Responsive design on mobile/tablet
- [ ] Vercel production deployment successful

---

*Document version: consolidated June 18, 2026*
