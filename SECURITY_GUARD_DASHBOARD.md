# SecurityGuardDashboard — Implementation Documentation

**File:** `src/components/dashboards/SecurityGuardDashboard.tsx`  
**Companion page:** `src/app/security-monitor/page.tsx`  
**Last updated:** May 25, 2026

---

## 1. Purpose

`SecurityGuardDashboard` is the primary React component rendered for users with the roles **Security Guard** and **Gate Staff**. It provides a unified interface for:

- Monitoring vehicle gate entries and exits
- Scanning and verifying RFID box tags at the main gate
- Viewing a real-time live attendance WebSocket feed
- Operating the camera detection panel (live stream + face detections)
- Logging supervisor override requests when staff fail to authenticate

---

## 2. Authorized Roles

| Role | Access |
|---|---|
| Security Guard | Full dashboard access |
| Gate Staff | Full dashboard access |

Role authorization is enforced upstream at the layout/routing level. This component receives the authenticated `User` object via props and renders without further role checking internally.

---

## 3. Component Props

```tsx
interface SecurityGuardDashboardProps {
  currentUser: User | null
}
```

| Prop | Type | Description |
|---|---|---|
| `currentUser` | `User \| null` | The authenticated user object from `AuthContext`. Used for the welcome greeting and to trigger initial data fetch. |

---

## 4. Local Interfaces

### `GateLogEntry`
Represents a vehicle gate pass record returned from `GET /api/vehicles/`.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique record ID |
| `vehicle_plate` | `string` | Vehicle registration / plate number |
| `driver_name` | `string` | Name of the driver |
| `purpose` | `string` | Reason for entry (e.g. Delivery) |
| `entry_time` | `string` | ISO timestamp of gate entry |
| `exit_time` | `string \| null` | ISO timestamp of gate exit, or null if still on-site |
| `status` | `'entered' \| 'exited' \| 'pending'` | Derived from presence of `entry_time`/`exit_time` |

### `RFIDScanEvent`
Represents a historical RFID scan event returned from `GET /api/rfid/tags`.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique event ID |
| `tag_id` | `string` | The RFID tag identifier |
| `scanned_at` | `string` | ISO timestamp of the scan |
| `location` | `string` | Where the scan occurred |
| `staff_name` | `string` | Name of associated staff member |
| `status` | `'valid' \| 'invalid' \| 'unknown'` | Tag validity at time of scan |

### `OverrideRequest`
Locally persisted record of a supervisor override request created by the guard.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Short alphanumeric ID (e.g. `1X7K2A`) generated via `Date.now().toString(36)` |
| `personName` | `string` | Name of the staff member who failed to authenticate |
| `personId` | `string` | Optional UUID / badge number (needed by supervisor to execute override) |
| `location` | `string` | Gate location where failure occurred |
| `reason` | `string` | Human-readable failure reason |
| `timestamp` | `string` | ISO timestamp the request was logged |
| `status` | `'pending' \| 'resolved'` | Guard-managed status flag |

---

## 5. State Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `activeView` | union (7 values) | `'overview'` | Controls which tab panel is visible |
| `gateLogs` | `GateLogEntry[]` | `[]` | Vehicle entry/exit records |
| `rfidScans` | `RFIDScanEvent[]` | `[]` | Historical RFID tag scan events |
| `loading` | `boolean` | `true` | Initial data fetch in progress |
| `attendanceFeed` | `AttendanceWsEvent[]` | `[]` | Live attendance events from WebSocket (capped at 50) |
| `wsRef` | `Ref<WebSocket>` | `null` | Reference to attendance WebSocket instance |
| `boxTallyCount` | `number \| null` | `null` | Count of RFID boxes currently on-site |
| `tagInput` | `string` | `''` | Tag lookup input field value |
| `tagResult` | `RFIDTagResponse \| null \| 'not-found'` | `null` | Result of a tag lookup scan |
| `tagLookupLoading` | `boolean` | `false` | Tag lookup API call in-flight |
| `gateTagList` | `string[]` | `[]` | Queue of RFID tags staged for entry/exit submission |
| `gateTagEntry` | `string` | `''` | Current tag ID being typed into the gate queue |
| `gateMode` | `'entry' \| 'exit'` | `'entry'` | Whether the box gate is logging entry or exit |
| `gateSubmitting` | `boolean` | `false` | Gate movement API call in-flight |
| `gateResult` | `{ ok: boolean; msg: string } \| null` | `null` | Result message from gate entry/exit submission |
| `cameraLocation` | `string` | `'docks'` | Active camera location for stream and detections |
| `cameraFeedKey` | `number` | `0` | Incremented every 2 s to force camera `<img>` reload |
| `cameraDetectionFeed` | `CameraDetectionEvent[]` | `[]` | Live face/visitor detection events (capped at 20) |
| `cameraWsRef` | `Ref<WebSocket>` | `null` | Reference to camera detections WebSocket instance |
| `onSiteNow` | `AttendanceMonitorEntry[]` | `[]` | Staff currently on-site from attendance monitor |
| `overrideRequests` | `OverrideRequest[]` | loaded from localStorage | Today's pending/resolved override requests |
| `overrideForm` | object | (see defaults) | Controlled form state for logging a new override request |
| `pendingOverrideCount` | `number` | derived | Count of requests with `status === 'pending'`; shown as badge on Override tab |

---

## 6. Backend API Endpoints

| Method | Endpoint | Used In | Notes |
|---|---|---|---|
| `GET` | `/api/vehicles/` | Mount | Up to 20 most recent vehicle gate logs |
| `GET` | `/api/rfid/tags` | Mount | Up to 20 most recent RFID scan events |
| `GET` | `/api/attendance/monitor` | Mount | Current on-site staff list |
| `GET` | `/api/gate/inside-vehicles` | Mount | Count of boxes currently inside gate |
| `GET` | `/api/rfid/scan/{tagId}` | Box Gate → Tag Lookup | Returns box metadata for a specific RFID tag |
| `POST` | `/api/gate/vehicle-entry` | Box Gate → Confirm Entry | Body: `{ rfid_tags: string[] }` |
| `POST` | `/api/gate/vehicle-exit` | Box Gate → Confirm Exit | Body: `{ rfid_tags: string[] }` |
| `WS` | `/api/attendance/ws/attendance` | Live Attendance tab | Real-time attendance events; auto-reconnects every 5 s |
| `WS` | `/ws/camera-detections` | Camera tab | Real-time face/visitor detections; auto-reconnects every 5 s |
| `GET` | `/api/camera/stream?location=` | Camera tab | MJPEG / snapshot stream; polled every 2 s via `<img>` key rotation. Valid `location` values: `docks`, `main_gate`, `processing` (hardcoded — update dropdown if backend adds new locations) |

> **Box Tally response ambiguity:** `GET /api/gate/inside-vehicles` does not have a stable canonical shape. The component defensively handles three variants: `data` as an array (uses `.length`), `data.count` as a number, and `data.total` as a number. The first non-null match wins. The canonical shape should be confirmed with the backend team and the fallback logic simplified once stabilised.

> **Note:** `POST /api/attendance/override` is **not** called by this component. The guard logs override requests locally; the actual override must be performed by a **Production Lead** or **Staff Lead** from their own dashboard.

---

## 7. Tabs

The tab bar is horizontally scrollable (`overflow-x-auto`) and renders 7 tabs. The Override tab has special styling: red background when active, red text + badge counter when inactive and pending requests exist.

### Tab 1 — Overview 🛡️

**State:** `activeView === 'overview'`

| Section | Description |
|---|---|
| Welcome card | Gradient banner with `currentUser.full_name` |
| Quick Stats (4 cards) | Vehicles On-Site · Gate Entries Today · Staff On-Site · Boxes On-Site |
| Quick Actions | Links to `/gate-pass/visitors`, `/gate-pass`, `/devices`, `/security-monitor` (opens in new tab) |
| On-Site Now | Scrollable list from `onSiteNow` state; shows name, role, location, method badge |
| Recent Gate Activity | Last 5 `gateLogs` entries with status badge |

### Tab 2 — Gate Logs 🚧

**State:** `activeView === 'gate-logs'`

Full table of all fetched `gateLogs`: Vehicle Plate, Driver, Purpose, Entry time, Exit time, Status.  
"Manage Gate Passes" button navigates to `/gate-pass`.

### Tab 3 — RFID Scans 📡

**State:** `activeView === 'rfid-scans'`

Scrollable list of `rfidScans`. Each row shows tag ID (monospace), location, staff name, validity badge (green/red/yellow), and scan timestamp.

### Tab 4 — Live Attendance 👁️

**State:** `activeView === 'attendance'`

Real-time event feed driven by the attendance WebSocket. Events prepend to the list (newest first), capped at 50 entries. Each event shows:
- Staff full name and role/location
- Method badge: **face** (blue) / **rfid** (green) / **override** (amber)
- Timestamp (locale time)

Shows a "Live" indicator badge in the panel header.

### Tab 5 — Box Gate 📦

**State:** `activeView === 'box-gate'`

Two sub-sections:

**Tag Lookup**
- Input field (keyboard Enter or "Look Up" button) → calls `scanRFIDTag(tagId)` → `GET /api/rfid/scan/{tagId}`
- On success: displays box number, lot ID, product type, grade, weight, and status
- On 404: shows "Tag not found" error message

**Log Box Movement**
- Entry / Exit toggle button
- Multi-tag queue: type or scan tag IDs one at a time, press Enter to add to list
- Tagged chips displayed with individual remove buttons
- "Confirm Entry" / "Confirm Exit" calls `recordGateEntry(tags)` or `recordGateExit(tags)`
- On success: clears queue, refreshes box tally count
- On error: displays error message inline

### Tab 6 — Camera 📹

**State:** `activeView === 'camera'`

**Left side — Live Stream**
- `<img>` tag pointed at `GET /api/camera/stream?location={cameraLocation}`
- `cameraFeedKey` incremented every 2 s (only when this tab is active) to force browser re-fetch
- Transparent fallback text shown if `onError` fires

**Right side — Detection Feed**
- Driven by camera detections WebSocket (`/ws/camera-detections`)
- Up to 20 most recent events, newest first
- Staff detections: green badge, name, role, location
- Visitor detections: blue badge, name, pass expiry (green if valid, red if expired)
- Confidence percentage displayed per event

Location selector updates both the stream URL and labels. **Hardcoded values:**

| Label | `location` param value |
|---|---|
| Docks | `docks` |
| Main Gate | `main_gate` |
| Processing | `processing` |

> If the backend adds a new camera location, both the `<select>` options in this tab and the equivalent selector in `security-monitor/page.tsx` must be updated manually.

### Tab 7 — Override 🚨

**State:** `activeView === 'override'`

**Purpose:** When a staff member cannot clock in via face recognition or RFID (attendance returns HTTP 401), the Security Guard logs a formal override request here to notify a supervisor.

**Sections:**

| Section | Description |
|---|---|
| Instructions banner | Amber warning explaining the workflow and which roles must act |
| Log New Override Request form | Staff Name (required), Staff ID (optional but needed by supervisor), Location dropdown, Reason text field |
| Submit button | Disabled until name is filled; creates `OverrideRequest` with short auto-generated ID |
| Today's Requests queue | All requests logged today, with pending highlighted in red |
| Mark Resolved button | Guard marks a request resolved once the supervisor has completed the override |
| Clear all button | Wipes the list and localStorage entry for today |

**Why no backend call?** The backend endpoint `POST /api/attendance/override` requires `Production Lead` or `Staff Lead` role — the Security Guard's JWT token will receive a 403. Override requests are persisted **client-side only** (localStorage) and the supervisor is notified in-person or via the physical terminal.

---

## 8. WebSocket Connections

Two WebSocket connections are opened on component mount and run for the lifetime of the component:

### Attendance WebSocket

```
URL: wss://<API_BASE>/api/attendance/ws/attendance
Ref: wsRef
```

- Opens immediately on mount via `connectAttendanceWS()` (memoised with `useCallback`)
- Each message: JSON-parsed as `AttendanceWsEvent`, prepended to `attendanceFeed` (capped at 50)
- On close: auto-reconnects after 5 seconds
- Cleaned up (`.close()`) on component unmount

### Camera WebSocket

```
URL: wss://<API_BASE>/ws/camera-detections
Ref: cameraWsRef
```

- Opens immediately on mount via `connectCameraWS()` (memoised with `useCallback`)
- Each message: JSON-parsed as `CameraDetectionEvent`, prepended to `cameraDetectionFeed` (capped at 20)
- Also increments `cameraFeedKey` to trigger a fresh camera image fetch
- On close: auto-reconnects after 5 seconds
- Cleaned up on unmount

### `WS_BASE` Derivation

```ts
const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://...')
  .replace(/^http/, 'ws')   // https → wss, http → ws
  .replace(/\/$/, '')        // strip trailing slash
```

---

## 9. localStorage Persistence (Override Requests)

Override requests are persisted to `localStorage` using a date-keyed entry so the queue survives page refreshes within a shift and auto-clears the next calendar day.

**Key format:** `clamflow_overrides_YYYY-MM-DD`  
**Value:** JSON array of `OverrideRequest[]`

### Initialisation (lazy `useState`)

```ts
const loadOverrideRequests = (): OverrideRequest[] => {
  if (typeof window === 'undefined') return []          // SSR safety
  const today = new Date().toISOString().slice(0, 10)
  const stored = localStorage.getItem(`clamflow_overrides_${today}`)
  if (!stored) return []
  try { return JSON.parse(stored) as OverrideRequest[] } catch { return [] }
}

const [overrideRequests, setOverrideRequests] = useState<OverrideRequest[]>(loadOverrideRequests)
```

The lazy initialiser runs once on first render — no separate `useEffect` needed for loading.

### Persistence

```ts
useEffect(() => {
  const today = new Date().toISOString().slice(0, 10)
  localStorage.setItem(`clamflow_overrides_${today}`, JSON.stringify(overrideRequests))
}, [overrideRequests])
```

Runs whenever the array changes (new request logged, status changed, or cleared).

> **Stale key accumulation:** Old date-keyed entries (e.g. `clamflow_overrides_2026-05-24`) are never removed. They accumulate in `localStorage` indefinitely — one small JSON array per calendar day the guard logged a request. For a typical facility this is negligible (< 5 KB/month), but a sweep on mount could be added if needed:
> ```ts
> // Optional: remove keys older than today on mount
> Object.keys(localStorage)
>   .filter(k => k.startsWith('clamflow_overrides_') && k < `clamflow_overrides_${today}`)
>   .forEach(k => localStorage.removeItem(k))
> ```
> This is not currently implemented.

---

## 10. Derived Values

Computed during render (not stored in state):

```ts
const vehiclesOnSite = gateLogs.filter(g => g.status === 'entered').length
const pendingOverrideCount = overrideRequests.filter(r => r.status === 'pending').length
```

`pendingOverrideCount` drives the red badge on the Override tab.

---

## 11. Environment Variables

| Variable | Used For |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for REST (`API_BASE`) and WebSocket (`WS_BASE`) connections. Falls back to `https://clamflowbackend-production.up.railway.app` |

---

## 12. Imported Types & API Methods

From `src/lib/clamflow-api.ts`:

| Symbol | Kind | Description |
|---|---|---|
| `clamflowAPI` | default export (class instance) | Central API client with Bearer token auth |
| `AttendanceWsEvent` | interface | `{ full_name, role, location, method, timestamp }` — WebSocket attendance event |
| `AttendanceMonitorEntry` | interface | `{ person_id, full_name, role, location, last_seen_method }` — on-site monitor entry |
| `CameraDetectionEvent` | interface | See full shape below — camera detection event from `/ws/camera-detections` |

**`CameraDetectionEvent` full shape:**

```ts
interface CameraDetectionEvent {
  detected:     boolean
  subject_type: 'staff' | 'visitor'
  confidence:   number                  // 0–1 float; rendered as Math.round(n * 100)%
  location:     string
  timestamp:    string                  // ISO
  person?: {
    id:        string
    full_name: string
    role:      string
  }
  visitor?: {
    id:          string
    name:        string
    pass_token:  string
    valid_until: string                 // ISO — compared to new Date() for green/red expiry colour
  }
}
```

`person` is populated when `subject_type === 'staff'`; `visitor` is populated when `subject_type === 'visitor'`. Both are optional — the UI guards with `ev.person &&` / `ev.visitor &&` before rendering nested fields. `visitor.valid_until` is the sole field driving the pass expiry colour (green = future, red = past).
| `RFIDTagResponse` | interface | `{ boxNumber, lotId, productType, grade, weight, status }` — RFID tag metadata |

API methods called:

| Method | Endpoint |
|---|---|
| `clamflowAPI.getVehicles()` | `GET /api/vehicles/` |
| `clamflowAPI.getRFIDTags()` | `GET /api/rfid/tags` |
| `clamflowAPI.getAttendanceMonitor()` | `GET /api/attendance/monitor` |
| `clamflowAPI.getBoxTally()` | `GET /api/gate/inside-vehicles` |
| `clamflowAPI.scanRFIDTag(tagId)` | `GET /api/rfid/scan/{tagId}` |
| `clamflowAPI.recordGateEntry(tags)` | `POST /api/gate/vehicle-entry` |
| `clamflowAPI.recordGateExit(tags)` | `POST /api/gate/vehicle-exit` |

---

## 13. Companion: Security Monitor Display Page

**File:** `src/app/security-monitor/page.tsx`  
**URL:** `/security-monitor`

A standalone fullscreen page designed to run on a **dedicated wall/desk monitor** at the gate. It shows the Live Attendance Feed and Camera Detection panel simultaneously in a dark theme without any app navigation.

| Feature | Detail |
|---|---|
| Auth | Protected — redirects to `/login` if no session |
| Layout | Full viewport, dark (`bg-gray-950`), no sidebar or nav |
| Left panel | Live Attendance Feed (WebSocket, same as Tab 4 above) |
| Right panel | Camera stream (polled every 2 s) + detection events (WebSocket) |
| Header | ClamFlow branding, live on-site staff count, live clock (1 s tick), camera location selector, "← Dashboard" link |
| WebSocket status | Per-panel indicator: Live (green) / Reconnecting (yellow) / Connecting (gray) |
| Auto-reconnect | Both WebSockets reconnect every 5 s on close |
| Launch point | Quick Actions card "🖥️ Security Monitor" on the Dashboard Overview tab; opens in a new browser tab |

---

## 14. Supervisor Override Workflow

```
Staff fails face + RFID at gate
        │
        ▼
Security Guard opens Override 🚨 tab
        │
        ▼
Guard enters: Staff Name + Staff ID (UUID) + Location + Reason
        │
        ▼
Clicks "🚨 Log Override Request"
        │
        ▼
Request saved to localStorage with status = 'pending'
Badge counter appears on Override tab
        │
        ▼
Guard physically contacts Production Lead / Staff Lead / Admin
        │
        ▼
Supervisor logs in to their own dashboard
Supervisor calls POST /api/attendance/override?person_id=<ID>&reason=&location=
        │
        ▼
Guard clicks "Mark Resolved" on the request
Status updated to 'resolved' in localStorage
```

> **Security note:** The Security Guard role does **not** have permission to call `POST /api/attendance/override`. The backend enforces this via JWT role check and will return HTTP 403. Only `Production Lead` and `Staff Lead` tokens are accepted by that endpoint.

---

## 15. File Dependencies

```
SecurityGuardDashboard.tsx
├── src/types/auth.ts              → User type, role definitions
├── src/lib/clamflow-api.ts        → API client + all interface types
└── (no child components)          → Self-contained, all UI inline

src/app/security-monitor/page.tsx
├── src/context/AuthContext.tsx    → useAuth() hook
└── src/lib/clamflow-api.ts        → API client + interface types
```

---

## 16. Change History

| Date | Change |
|---|---|
| May 2026 | Initial implementation — 6 tabs (Overview, Gate Logs, RFID Scans, Live Attendance, Box Gate, Camera) |
| May 2026 | Added Supervisor Override tab (7th tab) with localStorage persistence and badge counter |
| May 2026 | Tab bar made horizontally scrollable for mobile compatibility |
| May 2026 | Added `src/app/security-monitor/page.tsx` standalone display page |
| May 2026 | Added "🖥️ Security Monitor" link to Quick Actions in Overview tab |

---

## 17. Planned / Pending

| Item | Status | Notes |
|---|---|---|
| **Visitor Pass tab inside dashboard** | Not yet implemented | Currently a Quick Actions link to `/gate-pass/visitors`. A dedicated tab (Tab 8) inside this component is planned so guards can register and verify visitors without leaving the dashboard. Blocked on UX decision: whether to embed the full visitor flow inline or keep it as a separate route. |
| **Backend notification channel for overrides** | Not yet implemented | No `POST /notifications/` endpoint exists on the backend. Override requests are currently localStorage-only and require in-person supervisor notification. Once the backend adds a broadcast/notify endpoint, `supervisorOverride()` or a new `notifySupervisor()` call should be wired to the Override tab submit button. |
| **Box Tally response shape stabilisation** | Pending backend confirmation | Three defensive response shapes handled (array, `data.count`, `data.total`). Should be simplified to one canonical shape once confirmed with backend team. |
| **localStorage stale key sweep** | Low priority | Old `clamflow_overrides_YYYY-MM-DD` entries accumulate indefinitely. A mount-time sweep (see Section 9) can be added if storage usage becomes a concern. |
| **Camera location values from API** | Low priority | Location values (`docks`, `main_gate`, `processing`) are hardcoded. If the backend exposes a `GET /api/camera/locations` endpoint in future, the dropdown should be driven dynamically rather than maintained manually in two places. |
