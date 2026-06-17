# Interactive Features Functionality Assessment

**Generated**: January 20, 2026  
**Last Updated**: June 18, 2026  
**Status**: ✅ **COMPLETE — RBAC Scoping + DnD Rebuild Deployed**  
**Latest Commit**: `2f7f7de` (pushed to `origin/main`, Vercel deployment triggered)

---

## 📊 Executive Summary

| Component | UI Quality | DnD (Desktop) | DnD (Mobile/Touch) | Backend Wired | RBAC Scoped | Plant Tabs |
|-----------|-----------|---------------|--------------------|--------------:|-------------|------------|
| InteractiveShiftCalendar | ✅ Rebuilt | ✅ Fixed | ✅ Fixed | ✅ Yes | ✅ **Jun 18** | ✅ **Jun 18** |
| InteractiveStationAssignment | ✅ Fixed | ✅ Fixed | ✅ Fixed | ✅ Yes | ✅ **Jun 18** | ✅ Existing |

---

## 🗓 Change History

| Date | Commit | Changes |
|------|--------|---------|
| Jan 22, 2026 | initial | Full backend wiring for shift & station APIs |
| Jun 18, 2026 (1st) | `d2f3e89` | Full rebuild of ShiftCalendar; DnD sensor fix on both components; 3-period grid; plant-worker-only filter; Staff Lead `STATION_ASSIGN_ALL` permission |
| Jun 18, 2026 (2nd) | `2f7f7de` | RBAC role-scope filtering; prominent full-width PPC/FP plant tab bar; Staff Lead added to shift-scheduling auth; currentUser prop plumbing |

---

## 🔐 RBAC Design — Role-Scoped Staff Visibility

Each Lead role sees **only their own staff category** in both the Shift Calendar and Station Assignment panels. Admin/Super Admin see all plant workers.

| Role | Sees in Shift Calendar | Sees in Station Assignment |
|------|----------------------|---------------------------|
| Staff Lead | Security Guards only | Security Guard panel only |
| Production Lead | Production Staff only | Production Staff panel only |
| QC Lead | QC Staff only | QC Staff panel only |
| Admin | All plant workers | All floor roles |
| Super Admin | All plant workers | All floor roles |

### Implementation

**Shift Calendar** (`src/components/InteractiveShiftCalendar.tsx`):
```typescript
const LEAD_SCOPE: Record<string, string[]> = {
  'Staff Lead':      ['security_guard'],
  'Production Lead': ['production_staff'],
  'QC Lead':         ['qc_staff'],
};
const getLeadScope = (role: string): string[] | null =>
  LEAD_SCOPE[role] ?? null;  // null = no restriction

// Applied in visibleStaff useMemo:
const rawRole = s.role.toLowerCase().replace(/\s+/g, '_');
if (scope && !scope.includes(rawRole)) return false;
```

**Station Assignment** (`src/components/InteractiveStationAssignment.tsx`):
```typescript
const LEAD_SCOPE_STATION: Record<string, string[]> = {
  'Staff Lead':      ['Security Guard'],
  'Production Lead': ['Production Staff'],
  'QC Lead':         ['QC Staff'],
};
const getLeadScopeForStation = (role: string): string[] | null =>
  LEAD_SCOPE_STATION[role] ?? null;

// Applied in STAFF_PANEL_GROUPS render:
if (scope && !group.roles.some(r => scope.includes(r))) return null;
```

---

## 🌿 PPC / FP Plant Separation

The two plants are **displayed as separate calendar/assignment views**, not a hidden toggle. Each has its own full context — shifts and stations are filtered per plant.

### Shift Calendar — Prominent Tab Bar (Jun 18, 2026)

Replaced the small header button pair with a **full-width tab bar** between the header and the calendar body:

```
┌────────────────────────────────────────────────────────────┐
│  🏭  PPC Plant                │  📦  FP Plant              │
│      Pre-Processing Calendar  │      Finished Products...  │
└────────────────────────────────────────────────────────────┘
```

- Active tab: blue background (#eff6ff), blue bottom border (#2563eb), blue label
- Inactive tab: white background, grey label
- Fully responsive — works on narrow mobile screens
- Staff panel header updates to show scope label ("Security Guards", "Production Staff", etc.)

---

## 🖱 Drag & Drop Architecture

### DnD Sensors (both components)

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
);
```

- **PointerSensor**: 8 px movement threshold — prevents accidental drag on tap
- **TouchSensor**: 200 ms delay + 8 px tolerance — works on mobile without conflicting with scroll

### Single DndContext (critical fix)

`DndContext` wraps the **entire layout** (staff sidebar + grid/floor), ensuring draggables and droppables share the same context. The previous breakage was caused by separate contexts.

### DragOverlay (real ghost card)

Both components render a visible ghost card that follows the cursor/finger during drag:
```tsx
<DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
  {activeStaff && (
    <div style={{ transform: 'rotate(1.5deg)', boxShadow: '0 20px 40px rgba(0,0,0,0.22)', ... }}>
      <StaffCardView staff={activeStaff} scheduled={false} />
    </div>
  )}
</DragOverlay>
```

---

## 1. InteractiveShiftCalendar.tsx

**Location**: `src/components/InteractiveShiftCalendar.tsx`  
**Used By**: `src/app/shift-scheduling/page.tsx`  
**Authorized Roles**: Production Lead, QC Lead, **Staff Lead** (added Jun 18), Admin, Super Admin

### Shift Grid Design

3 named shift periods per day replace the previous hourly micro-slots:

| Period | Hours | Colour |
|--------|-------|--------|
| Day | 06:00 – 14:00 | Blue (#eff6ff) |
| Swing | 14:00 – 22:00 | Amber (#fffbeb) |
| Night | 22:00 – 06:00 | Indigo (#eef2ff) |

Drop target encodes the period — dropping into the Night row creates a Night shift assignment.

### Plant Worker Filter

```typescript
const PLANT_WORKER_ROLES = new Set([
  'production_staff', 'production_lead',
  'qc_staff', 'qc_lead',
  'maintenance_staff', 'security_guard',
]);
const isPlantWorker = (role: string): boolean =>
  PLANT_WORKER_ROLES.has(role.toLowerCase().replace(/\s+/g, '_'));
```

Admin, IT Staff, Gate Staff, and other non-plant roles are excluded.

### Mobile Support

- Desktop: staff sidebar on the left, calendar grid on the right
- Mobile (≤768 px): sidebar hidden, "👷 Staff" button opens a **bottom drawer** (framer-motion spring animation)
- Full PWA-compatible touch drag via TouchSensor

### Props

```typescript
interface ShiftCalendarProps {
  currentUser?: { role: string; department: string } | null;
  onShiftUpdate?: (shift: ShiftBlock) => void;
  onConflictDetected?: (conflicts: ConflictInfo[]) => void;
}
```

### Backend Wiring

| Action | API Call |
|--------|----------|
| Load staff | `clamflowAPI.getStaffForScheduler()` with fallback to `getStaff()` |
| Load shift definitions | `clamflowAPI.getShiftDefinitions()` |
| Load existing week shifts | `clamflowAPI.getShiftAssignments({ start_date, end_date, plant })` |
| Drag-drop save | `clamflowAPI.createShiftAssignment({ staff_id, shift_definition_id, date, plant })` |
| Delete shift block | `clamflowAPI.deleteShiftAssignment(id)` with optimistic rollback |

---

## 2. InteractiveStationAssignment.tsx

**Location**: `src/components/InteractiveStationAssignment.tsx`  
**Used By**: `src/app/station-assignment/page.tsx`  
**Authorized Roles**: Production Lead, QC Lead, Staff Lead, Admin, Super Admin

### Props (added Jun 18, 2026)

```typescript
interface StationAssignmentProps {
  currentUser?: { role: string } | null;
}
export const InteractiveStationAssignment: React.FC<StationAssignmentProps> = ({ currentUser }) => {
```

The page passes: `<InteractiveStationAssignment currentUser={user ? { role: user.role } : null} />`

### Staff Panel Groups

```typescript
const STAFF_PANEL_GROUPS = [
  { label: 'Production Lead', roles: ['Production Lead'] },
  { label: 'QC Lead',         roles: ['QC Lead'] },
  { label: 'Production Staff', roles: ['Production Staff'] },
  { label: 'QC Staff',        roles: ['QC Staff'] },
  { label: 'Security',        roles: ['Security Guard'] },
];
```

Filtered by `currentUser.role` via `LEAD_SCOPE_STATION` — each Lead sees only their category.

### Backend Wiring

| Action | API Call |
|--------|----------|
| Load stations + assignments | `clamflowAPI.getStationsWithAssignments(selectedDate, selectedPlant)` |
| Drag-drop assign | `clamflowAPI.createStationAssignment({ station_id, staff_id, assigned_date, ... })` |
| Remove assignment | `clamflowAPI.deleteStationAssignment(assignmentId)` with optimistic rollback |

---

## 3. API Client Methods (clamflow-api.ts)

### Shift Management
```typescript
getShiftDefinitions()
getShiftAssignments(params)         // params: { start_date, end_date, plant }
createShiftAssignment(data)
updateShiftAssignment(id, data)
deleteShiftAssignment(id)
getStaffForScheduler()
```

### Station Management
```typescript
getStationDefinitions(plantType?, status?)
getStationsWithAssignments(date, plantType)
createStationAssignment(data)
updateStationAssignment(id, data)
deleteStationAssignment(id)
bulkCreateStationAssignments(data)
```

---

## 4. Route Pages

### `src/app/shift-scheduling/page.tsx`
- **Authorized roles**: `['Production Lead', 'QC Lead', 'Staff Lead', 'Admin', 'Super Admin']`
- Passes `currentUser = { role, department }` to `<InteractiveShiftCalendar />`

### `src/app/station-assignment/page.tsx`
- **Authorized roles**: `['Production Lead', 'QC Lead', 'Staff Lead', 'Admin', 'Super Admin']`
- Passes `currentUser = { role }` to `<InteractiveStationAssignment />`
- Both pages: loading spinner during auth, access-denied UI with redirect, unauthenticated → `/login`

---

## 5. Permissions (src/types/auth.ts)

Staff Lead permissions include:
```
RFID_READ, USER_VIEW, SHIFT_VIEW, SHIFT_SCHEDULE_ALL, STATION_ASSIGN_ALL,
STAFF_MANAGE_ABSENCE, VIEW_REPORTS, GATE_PASS_VIEW, VISITOR_PASS_*
```

`STATION_ASSIGN_ALL` was added to Staff Lead in commit `d2f3e89` (Jun 18, 2026).

---

## 6. Backend API Endpoints

### Shift APIs (`app/routers/shifts.py`)

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/shift-definitions` | GET/POST | List / create shift types | Admin+ |
| `/shift-definitions/{id}` | PUT/DELETE | Update / delete shift type | Admin+ |
| `/shifts` | GET/POST | List / create assignments | Leadership |
| `/shifts/{id}` | GET/PUT/DELETE | Single assignment CRUD | Leadership |
| `/staff/scheduler-list` | GET | Staff list for scheduler UI | Leadership |

### Station APIs (`app/routers/stations.py`)

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/api/stations` | GET/POST | List / create stations | Leadership / Admin |
| `/api/stations/{id}` | GET/PUT/DELETE | Single station CRUD | Leadership / Admin |
| `/api/stations/with-assignments` | GET | Stations + staff (drag-drop) | Leadership |
| `/api/stations/assignments/` | GET/POST | List / create assignments | Leadership |
| `/api/stations/assignments/{id}` | GET/PUT/DELETE | Single assignment CRUD | Leadership |
| `/api/stations/assignments/bulk` | POST | Bulk create | Leadership |

**Leadership Roles** (backend): Super Admin, Admin, Production Lead, QC Lead, Staff Lead

---

## 7. File Reference

| File | Purpose | Status |
|------|---------|--------|
| `src/components/InteractiveShiftCalendar.tsx` | Shift scheduling drag-drop UI | ✅ Rebuilt + RBAC scoped |
| `src/components/InteractiveStationAssignment.tsx` | Station assignment drag-drop UI | ✅ Fixed + RBAC scoped |
| `src/app/shift-scheduling/page.tsx` | Route page — shift calendar | ✅ Staff Lead added Jun 18 |
| `src/app/station-assignment/page.tsx` | Route page — station assignment | ✅ currentUser passed Jun 18 |
| `src/lib/clamflow-api.ts` | Backend API client | ✅ All methods present |
| `src/types/auth.ts` | UserRole types, permissions map | ✅ STATION_ASSIGN_ALL for Staff Lead |

---

## 8. Implementation Checklist

### ✅ DnD Infrastructure
- [x] Single `DndContext` wrapping entire layout (sidebar + grid)
- [x] `PointerSensor` (8 px distance) — desktop
- [x] `TouchSensor` (200 ms delay, 8 px tolerance) — mobile/PWA
- [x] Real `DragOverlay` ghost card on both components
- [x] 3-period shift grid (Day / Swing / Night replacing hourly micro-slots)

### ✅ Staff Filtering
- [x] `PLANT_WORKER_ROLES` Set — excludes Admin, IT, Gate Staff
- [x] `isPlantWorker()` filter applied at fetch time
- [x] `LEAD_SCOPE` + `getLeadScope()` in ShiftCalendar
- [x] `LEAD_SCOPE_STATION` + `getLeadScopeForStation()` in StationAssignment
- [x] Scope applied to `visibleStaff` memo (ShiftCalendar)
- [x] Scope applied to `STAFF_PANEL_GROUPS` render (StationAssignment)

### ✅ Plant Separation
- [x] PPC and FP are distinct calendar/floor views
- [x] Full-width prominent plant tab bar (ShiftCalendar)
- [x] Staff panel header shows role-scoped label
- [x] Assignments filtered by `selectedPlant` in both components

### ✅ Role-Based Access
- [x] Staff Lead in `shift-scheduling/page.tsx` authorized roles
- [x] Staff Lead in `station-assignment/page.tsx` authorized roles
- [x] `STATION_ASSIGN_ALL` permission for Staff Lead in `auth.ts`
- [x] `currentUser` prop passed from both route pages to components

### ✅ Backend Wiring
- [x] Shift assignments: load, create, delete
- [x] Station assignments: load, create, delete
- [x] Optimistic updates + rollback on API failure

### ✅ Mobile / PWA
- [x] Mobile bottom drawer for staff panel (ShiftCalendar)
- [x] Touch-safe drag sensors on both components
- [x] Responsive layout (sidebar hidden at ≤768 px)

---

## 9. Testing Checklist

| Test | URL | Steps |
|------|-----|-------|
| Staff Lead — Security only | `/shift-scheduling` | Log in as Staff Lead → staff panel shows only Security Guards |
| Production Lead — Prod Staff only | `/shift-scheduling` | Log in as Production Lead → staff panel shows only Production Staff |
| QC Lead — QC Staff only | `/shift-scheduling` | Log in as QC Lead → staff panel shows only QC Staff |
| Admin — all staff | `/shift-scheduling` | Log in as Admin → all plant workers visible |
| PPC calendar | `/shift-scheduling` | Click PPC tab → week grid shows PPC plant; subtitle "Pre-Processing Calendar" |
| FP calendar | `/shift-scheduling` | Click FP tab → week grid shows FP plant; subtitle "Finished Products Calendar" |
| Mobile drag | `/shift-scheduling` | On phone: press-hold staff card 200 ms → drag onto shift cell |
| Station RBAC | `/station-assignment` | Log in as Production Lead → only "Production Staff" group visible in panel |
| Station drag | `/station-assignment` | Drag staff card from panel onto station drop zone → assignment persists on reload |
| Security Guard assignment | `/station-assignment` | Log in as Staff Lead → drag security guard to station → persists |

---

*Updated June 18, 2026 — reflects commit `2f7f7de` on `ComplianceRelish/relish_clamflow` `main`.*
