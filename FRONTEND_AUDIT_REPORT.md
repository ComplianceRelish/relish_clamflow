# ClamFlow Frontend Audit Report
**Date:** 2026-07-25 *(last updated — see [§ CHANGELOG](#changelog) for all changes)*  
**Project:** `clamflow-frontend` — Vercel / Next.js  
**Audit Type:** Initial audit was read-only (2026-07-24). Code changes have been applied as of 2026-07-25.

---

## ─── 1. PROJECT STRUCTURE ───────────────────────────────────────────────────

### Root directory (`ls -la`)

| Item | Type | Notes |
|---|---|---|
| `.env.example` | file | Template with all variable names |
| `.env.local` | file | Local/production secrets |
| `.env.production` | file | Production-specific overrides |
| `.eslintrc.json` | file | ESLint config |
| `.gitignore` | file | |
| `jest.config.js` | file | Jest test runner config |
| `jest.setup.js` | file | Jest setup |
| `next.config.js` | file | Next.js config (proxy rewrites, image domains, PWA headers) |
| `next-env.d.ts` | file | Auto-generated Next.js types |
| `package.json` | file | Dependencies |
| `package-lock.json` | file | Lock file |
| `playwright.config.ts` | file | Playwright E2E config (empty / minimal) |
| `postcss.config.js` | file | PostCSS for Tailwind |
| `tailwind.config.js` | file | Tailwind config with Relish brand tokens |
| `tsconfig.json` | file | TypeScript config |
| `vercel.json` | file | Vercel deployment config |
| `migrations/` | dir | SQL migrations (Supabase schema) |
| `pages/` | dir | Legacy Pages Router stub (only `api/auth/`) |
| `public/` | dir | Static assets, `manifest.json`, `sw.js` |
| `src/` | dir | All application source code |

### Complete source file tree (TS/TSX/JS/JSX, excluding `node_modules` and `.next`)

```
./jest.config.js
./jest.setup.js
./playwright.config.ts
./postcss.config.js
./public/sw.js
./src/__mocks__/fileMock.js
./src/__tests__/test-utils.ts
./src/__tests__/type-check.ts
./src/app/dashboard/page.tsx
./src/app/devices/handover/page.tsx
./src/app/devices/page.tsx
./src/app/error.tsx
./src/app/gate-pass/generate/page.tsx
./src/app/gate-pass/visitors/page.tsx
./src/app/inventory/add/page.tsx
./src/app/layout.tsx
./src/app/loading.tsx
./src/app/login/page.tsx
./src/app/lots/create/page.tsx
./src/app/lots/page.tsx
./src/app/mobile-scan/[token]/page.tsx
./src/app/not-found.tsx
./src/app/onboarding/staff/page.tsx
./src/app/page.tsx
./src/app/ppc-forms/approve/page.tsx
./src/app/qc-forms/approve/page.tsx
./src/app/reports/upload/page.tsx
./src/app/security-monitor/page.tsx
./src/app/shift-scheduling/page.tsx
./src/app/staff/absences/page.tsx
./src/app/staff/access-control/page.tsx
./src/app/station-assignment/page.tsx
./src/app/testing/depuration/extract/page.tsx
./src/app/testing/depuration/page.tsx
./src/app/testing/depuration/report/page.tsx
./src/app/testing/depuration/test/page.tsx
./src/app/testing/microbiology/extract/page.tsx
./src/app/testing/microbiology/page.tsx
./src/app/testing/microbiology/report/page.tsx
./src/app/testing/microbiology/test/page.tsx
./src/app/weight-notes/approve/page.tsx
./src/app/weight-notes/page.tsx
./src/app/api/whatsapp/route.ts           ← NEW (2026-07-25) server-side Twilio proxy
./src/components/admin/AccountsExport.tsx
./src/components/auth/FaceRecognitionLogin.tsx
./src/components/auth/PasswordChangeForm.tsx
./src/components/auth/RoleBasedAccess.tsx
./src/components/common/ActionCard.tsx
./src/components/common/ApprovalControls.tsx
./src/components/common/BiometricAuth.tsx
./src/components/common/ClamFlowFormField.tsx
./src/components/common/DataDisplay.tsx
./src/components/common/FormActions.tsx
./src/components/common/FormSection.tsx
./src/components/common/GaugeIndicator.tsx
./src/components/common/InfoAlert.tsx
./src/components/common/ProgressStepper.tsx
./src/components/common/StatusBadge.tsx
./src/components/common/WorkflowStep.tsx
./src/components/dashboards/admin/AdminAnalytics.tsx
./src/components/dashboards/admin/AdminManagement.tsx
./src/components/dashboards/admin/AdminManagementPanel.tsx
./src/components/dashboards/admin/AdminPermissionsPanel.tsx
./src/components/dashboards/admin/AdminSettingsPanel.tsx
./src/components/dashboards/admin/ApprovalWorkflowPanel.tsx
./src/components/dashboards/admin/AuditTrail.tsx
./src/components/dashboards/admin/DashboardMetricsPanel.tsx
./src/components/dashboards/admin/DepartmentOversightPanel.tsx
./src/components/dashboards/admin/DeviceForm.tsx
./src/components/dashboards/admin/DeviceRegistryPanel.tsx
./src/components/dashboards/admin/DisasterRecovery.tsx
./src/components/dashboards/admin/HardwareManagementPanel.tsx
./src/components/dashboards/admin/LeadManagementPanel.tsx
./src/components/dashboards/admin/RoleAudit.tsx
./src/components/dashboards/admin/ShiftManagementPanel.tsx
./src/components/dashboards/admin/StationManagementPanel.tsx
./src/components/dashboards/admin/SystemConfigurationPanel.tsx
./src/components/dashboards/admin/SystemHealth.tsx
./src/components/dashboards/admin/UserActivitiesPanel.tsx
./src/components/dashboards/admin/UserManagementPanel.tsx
./src/components/dashboards/AdminDashboard.tsx
./src/components/dashboards/ApprovalDashboard.tsx
./src/components/dashboards/ClamYieldDashboard.tsx
./src/components/dashboards/Dashboard.tsx
./src/components/dashboards/DashboardMetrics.tsx
./src/components/dashboards/InventoryModule.tsx
./src/components/dashboards/ITStaffDashboard.tsx
./src/components/dashboards/LotWorkflowTimeline.tsx
./src/components/dashboards/operations/GateVehicleManagement.tsx
./src/components/dashboards/operations/InventoryShipmentsDashboard.tsx
./src/components/dashboards/operations/LiveOperationsMonitor.tsx
./src/components/dashboards/operations/ProductionAnalytics.tsx
./src/components/dashboards/operations/SecuritySurveillance.tsx
./src/components/dashboards/operations/StaffManagementDashboard.tsx
./src/components/dashboards/PendingApprovals.tsx
./src/components/dashboards/ProductionLeadDashboard.tsx
./src/components/dashboards/ProductionOverview.tsx
./src/components/dashboards/ProductionStaffDashboard.tsx
./src/components/dashboards/QAFlowDashboard.tsx
./src/components/dashboards/QCFlowDashboard.tsx
./src/components/dashboards/QCFlowDashboardNew.tsx
./src/components/dashboards/QCFlowForm.tsx
./src/components/dashboards/QCLeadDashboard.tsx
./src/components/dashboards/QualityControl.tsx
./src/components/dashboards/RecentActivity.tsx
./src/components/dashboards/SecurityGuardDashboard.tsx
./src/components/dashboards/stafflead/StaffLeadStaffPanel.tsx
./src/components/dashboards/stafflead/SupervisionOverview.tsx
./src/components/dashboards/stafflead/SupplierOnboardingPanel.tsx
./src/components/dashboards/StaffLeadDashboard.tsx
./src/components/dashboards/SuperAdminDashboard.tsx
./src/components/dashboards/SystemHealth.tsx
./src/components/dashboards/UserManagement.tsx
./src/components/forms/DepurationForm.tsx
./src/components/forms/FPForm.tsx
./src/components/forms/PendingFormViewer.tsx
./src/components/forms/PPCForm.tsx
./src/components/forms/SampleExtractionForm.tsx
./src/components/forms/StaffOnboarding.tsx
./src/components/forms/SupplierOnboarding.tsx
./src/components/forms/WeightNoteForm.tsx
./src/components/forms/WeightNotePrintPreview.tsx
./src/components/forms/WeightNotesList.tsx
./src/components/hardware/DeviceRegistry.tsx
./src/components/hardware/DeviceRFIDHandover.tsx
./src/components/hardware/DeviceRFIDWriter.tsx
./src/components/hardware/FaceCapture.tsx
./src/components/hardware/HardwareConfig.tsx
./src/components/hardware/HardwareTest.tsx
./src/components/hardware/index.ts
./src/components/hardware/PassiveDetect.tsx
./src/components/index.ts
./src/components/integrations/ClamFlowSecure.tsx
./src/components/integrations/QRLabelGenerator.tsx
./src/components/integrations/RFIDHardwareManager.tsx
./src/components/integrations/RFIDScanner.tsx
./src/components/InteractiveShiftCalendar.tsx
./src/components/InteractiveStationAssignment.tsx
./src/components/layout/AppContainer.tsx
./src/components/layout/AppHeader.tsx
./src/components/layout/Footer.tsx
./src/components/layout/FormContainer.tsx
./src/components/layout/Header.tsx
./src/components/layout/Layout.tsx
./src/components/layout/Navigation.tsx   ← empty file
./src/components/layout/Sidebar.tsx
./src/components/PWAInstallPrompt.tsx
./src/components/qc/ApprovalDashboard.tsx
./src/components/qc/index.ts
./src/components/qc/QCFlowForm.tsx
./src/components/qc/QRLabelGenerator.tsx
./src/components/qc/RFIDScanner.tsx
./src/components/ServiceWorkerRegister.tsx
./src/components/ui/Alert.tsx
./src/components/ui/Badge.tsx
./src/components/ui/Button.tsx
./src/components/ui/Card.tsx
./src/components/ui/Checkbox.tsx
./src/components/ui/CircularGauge.tsx
./src/components/ui/CustomSelect.tsx
./src/components/ui/Dialog.tsx
./src/components/ui/ErrorBoundary.tsx
./src/components/ui/FieldComponent.tsx
./src/components/ui/FormField.tsx
./src/components/ui/FormSelect.tsx
./src/components/ui/GaugeCard.tsx
./src/components/ui/Input.tsx
./src/components/ui/Label.tsx
./src/components/ui/LabelFormatEditor.tsx
./src/components/ui/LabelPreviewPanel.tsx
./src/components/ui/LoadingSpinner.tsx
./src/components/ui/Modal.tsx
./src/components/ui/PlantConfigurationEditor.tsx
./src/components/ui/Progress.tsx
./src/components/ui/QRLabelPreview.tsx
./src/components/ui/Select.tsx
./src/components/ui/Separator.tsx
./src/components/ui/Switch.tsx
./src/components/ui/Tabs.tsx
./src/components/ui/TemplateEditor.tsx
./src/components/ui/Textarea.tsx
./src/components/weightnote/AuthenticationWorkflow.tsx
./src/components/weightnote/DigitalSignatureGenerator.tsx
./src/components/weightnote/WeightNoteForm.tsx
./src/components/weightnote/WeightNotePrintable.tsx
./src/context/AppContext.tsx             ← empty file
./src/context/AuthContext.tsx
./src/context/RFIDContext.tsx
./src/examples/api-usage-examples.ts
./src/hooks/use-toast.ts
./src/hooks/useAnalyticsData.ts
./src/hooks/useApi.ts                    ← empty file
./src/hooks/useAuth.tsx
./src/hooks/useAuthGuard.ts
./src/hooks/useFaceEmbedding.ts
./src/hooks/useGateData.ts
./src/hooks/useInventoryData.ts
./src/hooks/useLocalStorage.ts
./src/hooks/useOperationsData.ts
./src/hooks/useRFID.ts
./src/hooks/useSecurityData.ts
./src/hooks/useStaffData.ts
./src/hooks/useWebSocket.ts
./src/hooks/useWeightNote.ts
./src/hooks/useWorkflow.ts
./src/lib/aadhaar-qr.ts
./src/lib/api-client.ts
./src/lib/auth.ts
./src/lib/clamflow-api.ts
./src/lib/constants.ts
./src/lib/device-service.ts
./src/lib/offline-sync.ts
./src/lib/rfid-service.ts
./src/lib/supabase.ts
./src/lib/transform.ts
./src/lib/utils.ts
./src/lib/validations.ts
./src/middleware/auth.ts
./src/pages/onboarding/staff.tsx
./src/pages/onboarding/supplier.tsx
./src/pages/onboarding/vendor.tsx
./src/pages/rfid/inventory.tsx
./src/pages/security/authentication.tsx
./src/services/api.ts
./src/services/auth-service.ts
./src/services/dynamicLabelGenerator.ts
./src/services/fp-service.ts
./src/services/inventory-service.ts
./src/services/labelFormatAPI.ts
./src/services/notification-service.ts
./src/services/onboarding.ts
./src/services/plantConfigAPI.ts
./src/services/ppc-service.ts
./src/services/rfid-service.ts
./src/services/weight-note-service.ts
./src/services/whatsapp-service.ts
./src/types/api.ts
./src/types/auth.ts
./src/types/dashboard.ts
./src/types/form.ts
./src/types/forms.ts
./src/types/global.d.ts
./src/types/index.ts
./src/types/inventory.ts
./src/types/labelTypes.ts
./src/types/qc-workflow.ts
./src/types/rfid.ts
./src/types/supabase.ts
./src/types/user.ts
./src/types/weight-note.ts
./tailwind.config.js
```

---

## ─── 2. NEXT.JS ROUTING ──────────────────────────────────────────────────────

**Router type: App Router** (`src/app/` directory with `page.tsx` files).

There is also a legacy `pages/` directory at the root (`pages/api/auth/`) and a `src/pages/` directory with old Pages Router files (onboarding, rfid, security). These are **parallel** to the App Router and may cause routing conflicts; they appear to be remnants that were not removed during migration.

### All App Router routes (`src/app/**/page.tsx`)

| Route path | File | First 20 lines: what it renders |
|---|---|---|
| `/` | `src/app/page.tsx` | Redirects to `/dashboard` if authenticated, else to `/login` |
| `/login` | `src/app/login/page.tsx` | Login form (username + password), Face Recognition toggle, PasswordChangeForm on first login |
| `/dashboard` | `src/app/dashboard/page.tsx` | Role-switcher: renders one of 8 role-specific dashboard components based on `user.role` |
| `/lots` | `src/app/lots/page.tsx` | Lot list with search/filter; roles: Super Admin, Admin, Production Lead, Staff Lead, QC Lead, QC Staff |
| `/lots/create` | `src/app/lots/create/page.tsx` | Create Lot form (supplier + weight note selection); role: Production Lead only |
| `/weight-notes` | `src/app/weight-notes/page.tsx` | Weight Note list + WeightNoteForm + print/authentication workflows; uses Supabase client directly |
| `/weight-notes/approve` | `src/app/weight-notes/approve/page.tsx` | Approval screen for weight notes |
| `/ppc-forms/approve` | `src/app/ppc-forms/approve/page.tsx` | PPC form approval; roles: Super Admin, Admin, Production Lead, QC Lead, Staff Lead |
| `/qc-forms/approve` | `src/app/qc-forms/approve/page.tsx` | QC form approval screen |
| `/inventory/add` | `src/app/inventory/add/page.tsx` | InventoryShipmentsDashboard; roles: Super Admin, Admin, QC Lead, Production Lead |
| `/testing/depuration` | `src/app/testing/depuration/page.tsx` | DepurationForm; roles: Super Admin, Admin, QC Lead, QC Staff |
| `/testing/depuration/extract` | `src/app/testing/depuration/extract/page.tsx` | SampleExtractionForm; roles: Super Admin, Admin, QC Lead, QC Staff |
| `/testing/depuration/report` | `src/app/testing/depuration/report/page.tsx` | Depuration report view |
| `/testing/depuration/test` | `src/app/testing/depuration/test/page.tsx` | Depuration test entry |
| `/testing/microbiology` | `src/app/testing/microbiology/page.tsx` | SampleExtractionForm (reused); roles: Super Admin, Admin, QC Lead, QC Staff |
| `/testing/microbiology/extract` | `src/app/testing/microbiology/extract/page.tsx` | Sample extraction for microbiology |
| `/testing/microbiology/report` | `src/app/testing/microbiology/report/page.tsx` | Microbiology report view |
| `/testing/microbiology/test` | `src/app/testing/microbiology/test/page.tsx` | Microbiology test entry |
| `/reports/upload` | `src/app/reports/upload/page.tsx` | File upload form (PDF/image); roles: Super Admin, Admin, QC Lead, QC Staff |
| `/security-monitor` | `src/app/security-monitor/page.tsx` | Real-time attendance + camera detection (WebSocket); uses `NEXT_PUBLIC_API_URL` |
| `/shift-scheduling` | `src/app/shift-scheduling/page.tsx` | InteractiveShiftCalendar component |
| `/station-assignment` | `src/app/station-assignment/page.tsx` | InteractiveStationAssignment; roles: Super Admin, Admin, Production Lead, QC Lead, Staff Lead |
| `/staff/absences` | `src/app/staff/absences/page.tsx` | Staff absence management |
| `/staff/access-control` | `src/app/staff/access-control/page.tsx` | StaffManagementDashboard; roles: Super Admin, Admin, Production Lead, QC Lead, Staff Lead |
| `/devices` | `src/app/devices/page.tsx` | RFID device registry; read access for all roles, management for Super Admin, Admin, IT Staff |
| `/devices/handover` | `src/app/devices/handover/page.tsx` | Device RFID handover workflow |
| `/gate-pass/generate` | `src/app/gate-pass/generate/page.tsx` | GateVehicleManagement; roles: Super Admin, Admin, Production Lead, Staff Lead, Security Guard, Gate Staff |
| `/gate-pass/visitors` | `src/app/gate-pass/visitors/page.tsx` | Visitor gate pass management |
| `/onboarding/staff` | `src/app/onboarding/staff/page.tsx` | Staff onboarding with Aadhaar QR + face image capture |
| `/mobile-scan/[token]` | `src/app/mobile-scan/[token]/page.tsx` | Public QR scan page (no JWT required); submits raw QR text to backend |

---

## ─── 3. NAVIGATION / SIDEBAR ─────────────────────────────────────────────────

**File:** `src/components/layout/Sidebar.tsx`  
**Note:** `src/components/layout/Navigation.tsx` exists but is **completely empty**.

### Complete Sidebar.tsx

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Scale, Package, Droplets, Beaker, ClipboardList, FileText, BarChart3, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard',      icon: LayoutDashboard, roles: ['all'] },
    { href: '/weight-notes', label: 'Weight Notes', icon: Scale,           roles: ['production_staff', 'gatekeeper'] },
    { href: '/lots',         label: 'Lot Management', icon: Package,        roles: ['production_staff', 'production_lead'] },
    { href: '/washing',      label: 'Washing',        icon: Droplets,       roles: ['production_staff'] },
    { href: '/depuration',   label: 'Depuration',     icon: Beaker,         roles: ['production_staff'] },
    { href: '/ppc',          label: 'PPC Forms',      icon: ClipboardList,  roles: ['qc_staff', 'qc_lead'] },
    { href: '/fp',           label: 'FP Forms',       icon: FileText,       roles: ['qc_staff', 'qc_lead'] },
    { href: '/inventory',    label: 'Inventory',      icon: BarChart3,      roles: ['all'] },
    { href: '/rfid',         label: 'RFID Tracking',  icon: Tag,            roles: ['production_lead', 'qc_lead'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes('all') || 
    (user?.role && item.roles.includes(user.role.toLowerCase().replace(' ', '_')))
  );
  // ...
}
```

### Key observations

- **a) Nav items and routes (FIXED 2026-07-25):** All 6 previously dead hrefs have been corrected:
  - `/washing` → `/lots` (no washing-specific page exists; lots handles that workflow)
  - `/depuration` → `/testing/depuration` ✓
  - `/ppc` → `/ppc-forms/approve` ✓
  - `/fp` → `/qc-forms/approve` ✓
  - `/rfid` → `/devices` ✓
  - `/inventory` → `/inventory/add` ✓
  - EIA Compliance (`/compliance`) added for roles: `qc_lead`, `production_lead`, `admin`, `super_admin`

- **b) Role filtering:** YES — items are filtered using `user.role.toLowerCase().replace(' ', '_')`. There is a **known bug**: the `replace(' ', '_')` call only replaces the **first** space, so `'Production Staff'` → `'production staff'` (not `'production_staff'`). This causes most role-filtered items to never render. *Not yet fixed — noted for follow-up.*

- **c) Top-level sections:** Dashboard, Weight Notes, Lot Management, Washing (→ `/lots`), Depuration, PPC Forms, FP Forms, Inventory, RFID Tracking, EIA Compliance.

- **Note:** The Sidebar appears to be a legacy/simplified component. In practice, each dashboard page renders its own internal navigation via role-specific dashboard components (e.g. `QCLeadDashboard`, `ProductionStaffDashboard`), which have their own tabs/panels without using this Sidebar.

---

## ─── 4. AUTHENTICATION ───────────────────────────────────────────────────────

### a) Login page — `src/app/login/page.tsx` (first 80 lines)

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import PasswordChangeForm from '../../components/auth/PasswordChangeForm';
import FaceRecognitionLogin from '../../components/auth/FaceRecognitionLogin';

const LoginPage: React.FC = () => {
  const { login, faceLogin, user, requiresPasswordChange, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [state, setState] = useState<LoginState>({
    username: '',
    password: '',
    loading: false,
    error: null,
    showFaceRecognition: false,
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading && !requiresPasswordChange) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, requiresPasswordChange, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.username || !state.password) { ... }
    const result = await login(state.username, state.password);
    if (!result.success) { setState({ error: result.error }); }
    else if (result.requiresPasswordChange) { /* stay on page, show PasswordChangeForm */ }
  };
  
  if (user && requiresPasswordChange) {
    return <PasswordChangeForm />;
  }
  // ... renders username/password form + optional FaceRecognitionLogin toggle
};
```

Two login methods: **username/password** and **face recognition** (`@vladmandic/face-api`).

### b) JWT token storage

**`localStorage`** — keys `clamflow_token` and `clamflow_user`.

From `src/context/AuthContext.tsx`:
```ts
localStorage.setItem('clamflow_token', authToken);
localStorage.setItem('clamflow_user', JSON.stringify(userData));
```

On init, token is restored from `localStorage.getItem('clamflow_token')`.

### c) Auth context / hook — `src/context/AuthContext.tsx`

- Provides: `user`, `token`, `isLoading`, `isAuthenticated`, `requiresPasswordChange`
- Methods: `login()`, `faceLogin()`, `logout()`, `changePassword()`, `refreshToken()`, `hasPermission()`
- Auth API base (inside AuthContext): `const API_BASE_URL = '/api/backend'` — goes through the Next.js proxy rewrite, not directly to Railway.
- The `user` object shape:

```ts
interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'Super Admin' | 'Admin' | 'IT Staff' | 'Production Lead' | 'QC Lead' |
        'Staff Lead' | 'QC Staff' | 'Production Staff' | 'Maintenance Staff' |
        'Security Guard' | 'Gate Staff';
  station?: string;
  is_active: boolean;
  last_login?: string;
  requires_password_change?: boolean;
  first_login?: boolean;
}
```

### d) Middleware — `src/middleware/auth.ts`

This file exists at `src/middleware/auth.ts`, **not** at `middleware.ts` (root). In Next.js App Router, route protection middleware must live at the project root as `middleware.ts` to be automatically picked up by the framework. The current file at `src/middleware/auth.ts` is a module export, **not** an active Next.js middleware. Route protection is therefore done **client-side only** inside each `page.tsx` via `useAuth()` + `router.push('/login')`.

The file defines:
- `PROTECTED_ROUTES` map (path → required roles array)
- `PUBLIC_ROUTES` list
- `ADMIN_ROUTES` list
- `validateSession()` that calls Supabase to check session
- `getSessionToken()` that reads from cookies or `Authorization` header

**This middleware is currently inert** — it is not automatically executed by Next.js.

### e) Role check in components — concrete example

`src/components/auth/RoleBasedAccess.tsx`:

```tsx
export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <>{fallback}</>;
  
  const hasAccess = allowedRoles.includes(user.role) || user.role === 'Super Admin';
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
```

In-page pattern (e.g. `src/app/lots/create/page.tsx`):

```tsx
const AUTHORIZED_ROLES = ['Production Lead'];

useEffect(() => {
  if (!isLoading) {
    if (!user) { router.push('/login?returnUrl=/lots/create'); return; }
    setIsAuthorized(AUTHORIZED_ROLES.includes(user.role));
  }
}, [user, isLoading, router]);
```

Role hierarchy is defined in `src/types/auth.ts`:

```ts
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'Super Admin': 100, 'Admin': 10, 'IT Staff': 7,
  'Production Lead': 6, 'QC Lead': 6, 'Staff Lead': 5,
  'QC Staff': 4, 'Production Staff': 3,
  'Maintenance Staff': 2, 'Security Guard': 2, 'Gate Staff': 1,
};
```

---

## ─── 5. API CALL PATTERN ─────────────────────────────────────────────────────

### a) API utility files

There are **two parallel API clients**:

**1. `src/services/api.ts`** — Axios-based `APIClient` class (general purpose)  
**2. `src/lib/api-client.ts`** — Axios-based `APIClient` class (ClamFlow-specific endpoints, more complete)  
**3. `src/lib/clamflow-api.ts`** — Extended API client with all domain-specific methods (most used in components)

`src/hooks/useApi.ts` — **empty file** (not implemented).

### b) Base URL

```ts
// src/services/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  || 'https://clamflowbackend-production.up.railway.app';

// src/lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  || 'https://clamflowbackend-production.up.railway.app';
```

**Environment variable name:** `NEXT_PUBLIC_API_URL`  
**Fallback value (hardcoded):** `https://clamflowbackend-production.up.railway.app`

The `next.config.js` also defines a rewrite:
```js
{ source: '/api/backend/:path*', destination: 'https://clamflowbackend-production.up.railway.app/:path*' }
```
`AuthContext` uses `/api/backend` (the proxy path). Most other API clients use the direct Railway URL via `NEXT_PUBLIC_API_URL`.

### c) Authorization header

Bearer token from localStorage, attached via Axios request interceptor:

```ts
// src/services/api.ts (and identical pattern in src/lib/api-client.ts)
this.client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('clamflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

### d) GET and POST examples

**GET — from `src/lib/api-client.ts`:**
```ts
async getWeightNotes() {
  return this.client.get('/api/weight-notes/');
}
```

**POST — from `src/components/forms/WeightNoteForm.tsx`:**
```ts
const response = await fetch('/api/weight-notes/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: `wn-${Date.now()}`,
    ...formData,
    weight_net: netWeight,
    recorded_by: currentUser?.id,
    station: 'WEIGHT_NOTE',
    timestamp: new Date().toISOString(),
    status: 'pending'
  })
});
```

Note: `WeightNoteForm` uses native `fetch` (not axios), and posts to a relative path `/api/weight-notes/` which hits the Next.js proxy rewrite → Railway backend.

**POST via `react-hook-form` + axios — from `src/components/forms/PPCForm.tsx`:**
```ts
const { register, handleSubmit, formState: { errors } } = useForm<PPCFormData>({
  resolver: zodResolver(ppcFormSchema),
});

const submitForm = async (data: PPCFormData) => {
  const response = await clamflowAPI.createPPCForm(data);  // → POST /api/ppc-forms/
};
```

**401 handling (in `src/lib/api-client.ts`):**
```ts
if (status === 401) {
  localStorage.removeItem('clamflow_token');
  localStorage.removeItem('clamflow_user');
  window.location.href = '/login';
}
```

---

## ─── 6. COMPONENT LIBRARY ────────────────────────────────────────────────────

### a) Libraries in package.json

| Library | Version | Role |
|---|---|---|
| `tailwindcss` | `^3.4.0` | Utility-first CSS framework |
| `@radix-ui/react-accordion` | `^1.2.3` | Accessible accordion |
| `@radix-ui/react-alert-dialog` | `^1.1.6` | Alert dialog |
| `@radix-ui/react-avatar` | `^1.1.3` | Avatar |
| `@radix-ui/react-checkbox` | `^1.1.4` | Checkbox primitive |
| `@radix-ui/react-dialog` | `^1.1.15` | Modal/dialog |
| `@radix-ui/react-dropdown-menu` | `^2.1.6` | Dropdown menu |
| `@radix-ui/react-label` | `^2.1.2` | Label |
| `@radix-ui/react-popover` | `^1.1.6` | Popover |
| `@radix-ui/react-progress` | `^1.1.7` | Progress bar |
| `@radix-ui/react-select` | `^2.1.6` | Select |
| `@radix-ui/react-slot` | `^1.2.3` | Slot (composition) |
| `@radix-ui/react-switch` | `^1.2.6` | Toggle switch |
| `@radix-ui/react-tabs` | `^1.1.3` | Tabs |
| `@radix-ui/react-tooltip` | `^1.2.8` | Tooltip |
| `@headlessui/react` | `^2.2.8` | Headless UI components |
| `lucide-react` | `^0.487.0` | Icon library |
| `class-variance-authority` | `^0.7.1` | CVA (shadcn pattern) |
| `clsx` | `^2.1.1` | Class name utility |
| `tailwind-merge` | `^2.6.0` | Merge Tailwind classes |
| `framer-motion` | `^10.16.4` | Animation library |
| `recharts` | `^2.8.0` | Chart/data visualisation |
| `@dnd-kit/core` | `^6.0.8` | Drag and drop |

**No MUI, Chakra, Ant Design, Mantine, or DaisyUI.** The pattern is **shadcn/ui-style**: Radix UI primitives + Tailwind CSS + CVA + `clsx`/`tailwind-merge`, but implemented as custom components (no shadcn CLI was used — components are written from scratch in `src/components/ui/`).

### b) `components/ui/` folder contents

```
Alert.tsx        Badge.tsx          Button.tsx        Card.tsx
Checkbox.tsx     CircularGauge.tsx  CustomSelect.tsx  Dialog.tsx
ErrorBoundary.tsx FieldComponent.tsx FormField.tsx    FormSelect.tsx
GaugeCard.tsx    Input.tsx          Label.tsx         LabelFormatEditor.tsx
LabelPreviewPanel.tsx LoadingSpinner.tsx Modal.tsx    PlantConfigurationEditor.tsx
Progress.tsx     QRLabelPreview.tsx Select.tsx        Separator.tsx
Switch.tsx       Tabs.tsx           TemplateEditor.tsx Textarea.tsx
```

### c) Example form component — `src/components/forms/PPCForm.tsx` (excerpt)

```tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const ppcFormSchema = z.object({
  lot_id: z.string().min(1, "Lot selection is required"),
  box_number: z.string().min(1, "Box number is required"),
  product_type: z.string().min(1, "Product type is required"),
  grade: z.string().min(1, "Grade is required"),
  weight: z.number().positive("Weight must be positive"),
  qc_staff_id: z.string().min(1, "QC Staff selection is required"),
  processing_notes: z.string().optional(),
  quality_parameters: z.object({ freshness: z.string().optional(), ... }).optional()
});

const PPCForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<PPCFormData>({
    resolver: zodResolver(ppcFormSchema),
  });
  // ...
};
```

### d) Example table/list component — `src/components/forms/WeightNotesList.tsx`

Renders a filterable list of weight notes. Fetches from API, displays in a table layout with status badges (`pending`, `approved`, `rejected`).

---

## ─── 7. TYPESCRIPT TYPES ─────────────────────────────────────────────────────

### Type files found

```
src/types/api.ts
src/types/auth.ts
src/types/dashboard.ts
src/types/form.ts
src/types/forms.ts
src/types/global.d.ts
src/types/index.ts
src/types/inventory.ts
src/types/labelTypes.ts
src/types/qc-workflow.ts
src/types/rfid.ts
src/types/supabase.ts
src/types/user.ts
src/types/weight-note.ts
```

All exported through `src/types/index.ts`.

### User type — `src/types/auth.ts`

```ts
export type UserRole = 
  | 'Super Admin' | 'Admin' | 'IT Staff'
  | 'Production Lead' | 'QC Lead' | 'Staff Lead'
  | 'QC Staff' | 'Production Staff' | 'Maintenance Staff'
  | 'Security Guard' | 'Gate Staff'
  | 'EIA Officer';   // Added — compliance-only role; redirects to /compliance on login

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  station?: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
}
```

### Lot type — inferred from `src/app/lots/page.tsx` and `src/lib/clamflow-api.ts`

`LotResponse` is imported from `src/lib/clamflow-api.ts`. Fields include:
```ts
interface LotResponse {
  id: string;
  lotNumber: string;   // camelCase (transformed from snake_case by transform.ts)
  status: 'received' | 'washing' | 'depuration' | 'ppc' | 'fp' | 'shipped' | 'archived';
  created_at: string;
  // ... additional fields from backend
}
```

### RFIDTag type — `src/types/rfid.ts`

```ts
export interface RFIDTag extends BaseEntity {
  tag_id: string;
  tag_type: 'box' | 'employee' | 'vehicle' | 'equipment' | 'visitor';
  technology: 'UHF' | 'HF' | 'LF' | 'NFC';
  frequency: string;
  read_range_meters: number;
  entity_type: 'inventory_box' | 'employee' | 'vehicle' | 'equipment' | 'visitor_pass';
  entity_id: string;
  status: 'active' | 'inactive' | 'lost' | 'damaged' | 'decommissioned';
  assigned_date: string;
  last_read_time?: string;
  last_reader_id?: string;
  battery_level?: number;
  encryption_enabled: boolean;
  access_permissions: string[];
  custom_data?: Record<string, unknown>;
}
```

### BoxTracking type — `src/types/rfid.ts`

```ts
// BoxTracking includes:
interface LocationHistoryEntry { location: string; reader_id: string; timestamp: string; ... }
interface HandlingEvent { event_type: 'received'|'moved'|'processed'|...; operator_id: string; ... }
interface BoxQualityCheck { inspector_id: string; check_type: 'visual'|'temperature'|...; passed: boolean; ... }
interface ChainOfCustodyEntry { transferred_from: string; transferred_to: string; authorization_method: string; ... }
```

### WeightNote type — `src/types/forms.ts`

```ts
export interface WeightNote extends WeightNoteFormData {
  id: string;
  weight_note_number: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
}
```

### QA-related types — `src/types/qc-workflow.ts`

```ts
export type QCViewMode = 
  | 'qc-form' | 'sample-extraction' | 'depuration-form'
  | 'weight-note' | 'weight-note-new'
  | 'ppc-form' | 'ppc-form-new'
  | 'fp-form' | 'fp-form-new'
  | 'rfid-scanner' | 'qr-generator' | 'approval-dashboard';

export interface WorkflowState {
  weightNoteApproved: boolean;
  supervisorHasCreatedLot: boolean;
  currentLotId: string | null;
  rfidTagData: RFIDTagData | null;
  qrLabelData: QRLabelData | null;
}
```

### PPC/FP/Depuration types — `src/types/forms.ts`

- `PPCFormData`, `PPCBox`, `PPCForm` (status: `submitted_to_qc` | `qc_approved` | ... | `supervisor_approved`)
- `FPFormData`, `FPForm`, `FPFormStatus` (15 distinct status values covering full lifecycle)
- `DepurationFormData`, `DepurationForm`, `DepurationStatus`
- `WorkflowStage` (13 stages from `ppc_scanning` to `qc_station_rework`)

---

## ─── 8. STATE MANAGEMENT ─────────────────────────────────────────────────────

### a) Libraries

- **No Redux, Zustand, Jotai, or Recoil.**
- **`@tanstack/react-query` v5** is installed in `package.json` but is **not observed in active use** in any component examined — no `QueryClientProvider`, `useQuery`, or `useMutation` calls found.
- **Plain React state** (`useState`, `useEffect`) is the primary state mechanism throughout all components.
- **React Context** is used for auth state (`AuthContext`) and RFID state (`RFIDContext`). `AppContext` exists but is empty.

### b) Store/context files

```
src/context/AppContext.tsx   ← empty
src/context/AuthContext.tsx  ← active (auth state, user, token)
src/context/RFIDContext.tsx  ← RFID reader state
src/hooks/useLocalStorage.ts ← custom hook wrapping localStorage
src/hooks/useWebSocket.ts    ← WebSocket connection hook
src/hooks/useWorkflow.ts     ← workflow step state
src/hooks/useWeightNote.ts   ← weight note form state
src/hooks/useApi.ts          ← empty
```

### c) Server response caching / refetching

- **No caching layer.** Data is fetched directly with `axios` or `fetch` inside `useEffect` on component mount. 
- There is a `src/lib/offline-sync.ts` file (exists but not examined in detail) suggesting offline support was planned.
- WebSocket is used for real-time data in the security monitor (`src/app/security-monitor/page.tsx`):
  ```ts
  const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || '...')
    .replace(/^http/, 'ws');
  ```

---

## ─── 9. EXISTING QA / PRODUCTION SCREENS ────────────────────────────────────

The following files matched the QA/production keyword search:

### Primary QA/production pages and components

| File | Purpose | API endpoints called |
|---|---|---|
| `src/app/testing/depuration/page.tsx` | Depuration testing entry (renders `DepurationForm`) | via `DepurationForm` |
| `src/app/testing/depuration/extract/page.tsx` | Sample extraction for depuration (renders `SampleExtractionForm`) | via `SampleExtractionForm` |
| `src/app/testing/depuration/report/page.tsx` | Depuration report view | unknown (not read) |
| `src/app/testing/depuration/test/page.tsx` | Depuration test result entry | unknown (not read) |
| `src/app/testing/microbiology/page.tsx` | Microbiology testing (renders `SampleExtractionForm`) | via `SampleExtractionForm` |
| `src/app/lots/page.tsx` | Lot list with status tracking | `GET /api/v1/lots/` (via `clamflowAPI`) |
| `src/app/reports/upload/page.tsx` | Lab report file upload | `POST` to backend upload endpoint |
| `src/components/forms/DepurationForm.tsx` | Full depuration form with Zod validation | `GET /api/v1/lots/`, `GET /api/v1/staff/`, `GET /api/v1/depuration/tanks/`, `POST /api/v1/depuration/` |
| `src/components/forms/PPCForm.tsx` | Pre-Packed Clam (PPC) form | `GET /api/v1/lots/`, `GET /api/v1/staff/`, `GET /api/weight-notes/?status=approved`, `POST /api/ppc-forms/` |
| `src/components/forms/FPForm.tsx` | Final Product (FP) form | `GET /api/v1/lots/`, `GET /api/v1/staff/`, `GET /api/ppc-forms/?status=approved`, `POST /api/fp-forms/` |
| `src/components/forms/SampleExtractionForm.tsx` | Sample extraction form | backend sample extraction endpoints |
| `src/components/forms/WeightNoteForm.tsx` | Weight note entry | `POST /api/weight-notes/` |
| `src/components/forms/PendingFormViewer.tsx` | Approval queue viewer | reads pending forms from backend |
| `src/components/dashboards/QCFlowDashboard.tsx` | QC Lead workflow dashboard | multiple QC endpoints |
| `src/components/dashboards/QCFlowDashboardNew.tsx` | Updated QC Staff dashboard (active) | multiple QC endpoints |
| `src/components/dashboards/QCLeadDashboard.tsx` | QC Lead-specific dashboard | QC lead endpoints |
| `src/components/dashboards/QAFlowDashboard.tsx` | QA flow overview | QA endpoints |
| `src/components/dashboards/ProductionStaffDashboard.tsx` | Production staff view (weight note / PPC / FP entry by station) | station-specific form endpoints |
| `src/components/dashboards/ApprovalDashboard.tsx` | Multi-role approval dashboard | approval queue endpoints |
| `src/components/qc/ApprovalDashboard.tsx` | QC-specific approval dashboard | QC approval endpoints |
| `src/components/qc/QCFlowForm.tsx` | QC flow form (duplicate of dashboards/QCFlowForm) | QC form endpoints |
| `src/components/integrations/QRLabelGenerator.tsx` | QR label generation for lots/boxes | label generation endpoints |
| `src/components/dashboards/operations/LiveOperationsMonitor.tsx` | Real-time production monitoring | live ops endpoints |
| `src/components/dashboards/admin/ApprovalWorkflowPanel.tsx` | Admin approval workflow management | admin workflow endpoints |
| `src/services/ppc-service.ts` | PPC form service layer | `/api/ppc-forms/` |
| `src/types/qc-workflow.ts` | QC workflow type definitions | — |
| `src/types/forms.ts` | Form type definitions including depuration, PPC, FP | — |

---

## ─── 10. EXISTING FORMS ──────────────────────────────────────────────────────

### All forms with `handleSubmit` / `onSubmit`

| Form Component | POST/PUT endpoint | Data submitted | Validation |
|---|---|---|---|
| `src/components/forms/WeightNoteForm.tsx` | `POST /api/weight-notes/` | `supplier_id`, `box_number`, `weight_gross`, `weight_tare`, `temperature`, `moisture_content`, `visual_quality`, `shell_condition`, `notes` | Manual (`if` checks) |
| `src/components/forms/PPCForm.tsx` | `POST /api/ppc-forms/` | `lot_id`, `box_number`, `product_type`, `grade`, `weight`, `qc_staff_id`, `processing_notes`, `quality_parameters` | **Zod** + `react-hook-form` |
| `src/components/forms/FPForm.tsx` | `POST /api/fp-forms/` | `lot_id`, `box_number`, `product_type`, `grade`, `weight`, `qc_staff_id`, `packaging_type`, `expiry_date`, `final_notes`, `quality_certification` | **Zod** + `react-hook-form` |
| `src/components/forms/DepurationForm.tsx` | `POST /api/v1/depuration/` | `sample_id`, `lot_id`, `depuration_tank_id`, `start_time`, `planned_duration`, `initial_salinity`, `initial_temperature`, `initial_ph`, `qc_staff_id`, `water_source`, `filtration_type`, `monitoring_parameters` | **Zod** + `react-hook-form` |
| `src/components/forms/SampleExtractionForm.tsx` | sample extraction endpoint | lot, sample type, extraction details | unknown |
| `src/components/forms/StaffOnboarding.tsx` | staff onboarding endpoint | full staff profile + face image | unknown |
| `src/components/forms/SupplierOnboarding.tsx` | supplier onboarding endpoint | supplier details | unknown |
| `src/app/lots/create/page.tsx` | `POST /api/v1/lots/` | `supplier_id`, `weight_note_id`, `notes` | Manual checks |
| `src/app/onboarding/staff/page.tsx` | staff onboarding API | Aadhaar data, face image, designation, contact | Manual checks |
| `src/app/reports/upload/page.tsx` | file upload endpoint | `file` (multipart), `reportType`, `notes` | Manual file type check |
| `src/components/auth/PasswordChangeForm.tsx` | `POST /api/backend/auth/change-password` | `current_password`, `new_password` | Min-length check |

---

## ─── 11. ENVIRONMENT CONFIG ─────────────────────────────────────────────────

### a) `.env.example` — all variable names (values redacted)

```env
NEXT_PUBLIC_APP_NAME=ClamFlow
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_URL=[app URL]
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_SUPABASE_URL=[supabase project URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[supabase anon key]
SUPABASE_SERVICE_ROLE_KEY=[supabase service role key]
NEXT_PUBLIC_API_URL=[railway backend URL]
API_SECRET_KEY=[api secret]
NEXTAUTH_SECRET=[nextauth secret, min 32 chars]
NEXTAUTH_URL=[app URL]
NEXTAUTH_URL_INTERNAL=[internal URL]
DATABASE_URL=[postgresql connection string]
DIRECT_URL=[postgresql direct connection string]
RFID_READER_IP=[IP address]
RFID_READER_PORT=8080
RFID_CONNECTION_TIMEOUT=5000
LABEL_TEMPLATE_BUCKET=label-templates
QR_CODE_BASE_URL=[domain URL]/track
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
STORAGE_BUCKET=clamflow-uploads
EMAIL_FROM=noreply@clamflow.com
SMTP_HOST=[smtp host]
SMTP_PORT=587
SMTP_USER=[smtp user]
SMTP_PASSWORD=[smtp password]
WS_URL=wss://[backend].railway.app/ws
WS_HEARTBEAT_INTERVAL=30000
ALLOWED_ORIGINS=[origins list]
CORS_CREDENTIALS=true
```

### a2) Required Vercel env vars added 2026-07-25 (Twilio / WhatsApp)

The following **server-side** (no `NEXT_PUBLIC_` prefix) vars must be set in Vercel → Settings → Environment Variables:

| Variable | Purpose |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_NUMBER` | From-number in `whatsapp:+…` format (default: Twilio sandbox) |
| `NEXT_PUBLIC_TWILIO_ENABLED` | Set to `true` to enable WhatsApp sending |
| `NEXT_PUBLIC_NCR_ALERT_PHONE` | WhatsApp number for OVERDUE/BREACH auto-alerts (e.g. `+919876543210`) |

All Twilio calls are now proxied through `POST /api/whatsapp` (server-side Route Handler) — credentials never reach the browser bundle.

### b) `.env.local` — variable names (values REDACTED for security)

```env
DATABASE_URL=[redacted - postgresql connection string]
POSTGRES_HOST=[redacted]
POSTGRES_DATABASE=postgres
POSTGRES_USER=[redacted]
POSTGRES_PASSWORD=[redacted]
SUPABASE_URL=[redacted]
SUPABASE_ANON_KEY=[redacted]
SUPABASE_SERVICE_ROLE_KEY=[redacted]
NEXT_PUBLIC_SUPABASE_URL=[redacted]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[redacted]
API_BASE_URL=https://clamflowbackend-production.up.railway.app
NEXT_PUBLIC_API_URL=https://clamflowbackend-production.up.railway.app
NEXT_PUBLIC_API_BASE_URL=https://clamflowbackend-production.up.railway.app
NEXTAUTH_URL=https://clamflowcloud.vercel.app
NEXTAUTH_SECRET=[redacted]
PYTHON_PATH=/usr/bin/python3
VERCEL_TOKEN=[redacted]
```

### c) `next.config.js` — complete file

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  images: {
    domains: ['ozbckmkhxaldcxbqxwlu.supabase.co'],
    unoptimized: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'https://clamflowbackend-production.up.railway.app/:path*',
      },
    ];
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: { missingSuspenseWithCSRBailout: true },
  output: undefined,
  async headers() {
    return [
      { source: '/manifest.json', headers: [{ key: 'Content-Type', value: 'application/manifest+json' }, ...] },
      { source: '/sw.js', headers: [{ key: 'Service-Worker-Allowed', value: '/' }, ...] },
      // ... image caching headers
    ];
  },
};
```

**Key facts:**
- `typescript.ignoreBuildErrors: true` — TypeScript errors do not block builds.
- `eslint.ignoreDuringBuilds: true` — ESLint errors do not block builds.
- Backend URL is hardcoded in `rewrites()` destination (not from env var).

### d) Backend URL reference — exact env variable

```
NEXT_PUBLIC_API_URL
```

Used in: `src/services/api.ts`, `src/lib/api-client.ts`, `src/app/mobile-scan/[token]/page.tsx`, `src/app/security-monitor/page.tsx`, and as fallback in other files.

---

## ─── 12. PACKAGE.JSON ────────────────────────────────────────────────────────

```json
{
  "name": "clamflow-frontend",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.0.8",
    "@dnd-kit/utilities": "^3.2.1",
    "@headlessui/react": "^2.2.8",
    "@heroicons/react": "^2.2.0",
    "@hookform/resolvers": "^3.3.0",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/ssr": "^0.6.1",
    "@supabase/supabase-js": "^2.55.0",
    "@tanstack/react-query": "^5.0.0",
    "@types/date-fns": "^2.6.3",
    "@vladmandic/face-api": "^1.7.15",
    "axios": "^1.11.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "framer-motion": "^10.16.4",
    "html5-qrcode": "^2.3.8",
    "lucide-react": "^0.487.0",
    "next": "^14.0.0",
    "next-auth": "^4.24.0",
    "qrcode": "^1.5.3",
    "qrcode.react": "^4.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.0",
    "recharts": "^2.8.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss": "^3.4.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.19.11",
    "@types/qrcode": "^1.5.0",
    "@types/qrcode.react": "^3.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.21",
    "eslint": "^8.55.0",
    "eslint-config-next": "^14.0.0",
    "postcss": "^8.5.6",
    "typescript": "^5.2.0"
  }
}
```

**Key version summary:**

| Package | Version |
|---|---|
| `next` | `^14.0.0` |
| `react` | `^18.2.0` |
| `typescript` | `^5.2.0` |
| `tailwindcss` | `^3.4.0` |
| `@radix-ui/*` | various (1.x – 2.x) |
| `react-hook-form` | `^7.48.0` |
| `zod` | `^3.22.0` |
| `@hookform/resolvers` | `^3.3.0` |
| `@tanstack/react-query` | `^5.0.0` |
| `axios` | `^1.11.0` |
| `framer-motion` | `^10.16.4` |
| `recharts` | `^2.8.0` |
| `lucide-react` | `^0.487.0` |
| `next-auth` | `^4.24.0` |
| `@supabase/supabase-js` | `^2.55.0` |

---

## ─── 13. STYLING ─────────────────────────────────────────────────────────────

### a) Tailwind CSS — `tailwind.config.js`

```js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        relish: {
          50: '#FAF5FF',  100: '#F3E8FF',  200: '#E9D5FF',
          300: '#D8B4FE', 400: '#C084FC',  500: '#8B5CF6',  // Main purple
          600: '#7C3AED', 700: '#6D28D9',  800: '#5B21B6',  900: '#4C1D95',
        },
        ocean: {
          500: '#10B981',  // Main seafoam green
          // ... full scale
        },
        sunset: {
          500: '#F97316',  // Main orange
          // ... full scale
        },
        cream: {
          300: '#F5F5DC',  // Main cream/background
          // ... full scale
        },
      },
      backgroundImage: {
        'gradient-relish': 'linear-gradient(135deg, #8B5CF6 0%, #10B981 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
        'gradient-cream': 'linear-gradient(135deg, #F5F5DC 0%, #F0EDD1 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### b) Global CSS — `src/app/globals.css` (design tokens)

```css
:root {
  --relish-purple: #8B5CF6;
  --relish-orange: #F97316;
  --relish-seafoam: #10B981;
  --relish-cream: #F5F5DC;
  --logo-background: #F0EBE0;

  /* Traffic Light System Colors */
  --status-green: #10b981;    --status-amber: #f59e0b;    --status-red: #ef4444;

  /* Workflow Status Colors */
  --workflow-active: #3b82f6;   --workflow-completed: #10b981;
  --workflow-pending: #94a3b8;  --workflow-locked: #64748b;
  --workflow-awaiting: #f59e0b; --workflow-rejected: #ef4444;

  /* Brand Colors */
  --brand-primary: #1e40af;   --brand-secondary: #0ea5e9;

  /* Tablet-Optimized Spacing */
  --spacing-touch-target: 44px;
  --spacing-form-field: 24px;
  --spacing-section: 32px;
  --spacing-card-padding: 24px;

  /* Input heights (tablet-optimized) */
  --input-height: 44px;
  --button-height: 44px;
  --select-height: 44px;
}

body {
  background-color: var(--logo-background);  /* #F0EBE0 warm cream */
}
```

### c) CSS modules

No `.module.css` files observed. Tailwind utility classes are used exclusively.

### d) Design token / colour scheme

| Token | Hex | Purpose |
|---|---|---|
| Relish Purple (primary) | `#8B5CF6` | Brand primary, buttons, active states |
| Relish Orange (accent) | `#F97316` | Accent / CTAs |
| Relish Seafoam (secondary) | `#10B981` | Success, positive status |
| Cream background | `#F0EBE0` | App body background |
| Status green | `#10b981` | Approved / pass |
| Status amber | `#f59e0b` | Pending / warning |
| Status red | `#ef4444` | Rejected / fail |
| Brand blue | `#1e40af` | Secondary brand |

---

## ─── 14. MOBILE / TABLET CONSIDERATIONS ─────────────────────────────────────

### a) Responsive design

**Yes** — Tailwind responsive utilities (`sm:`, `md:`, `lg:`) are used throughout. CSS custom properties in `globals.css` are explicitly labeled "Tablet-Optimized":
- Touch targets: `--spacing-touch-target: 44px` (all buttons and inputs use `min-h-[44px]`)
- Form field spacing: `--spacing-form-field: 24px`
- Input height: `--input-height: 44px`

Pattern observed in code: `className="... min-h-[44px]"` on buttons and interactive elements.

### b) Native mobile version

**No native app.** Pure web application.

### c) PWA

**Yes** — full PWA implementation:
- `public/manifest.json` — present with name, icons (72×72 to 512×512), `display: "standalone"`, `theme_color: "#7c3aed"`, `start_url: "/"`, `orientation: "portrait-primary"`
- `public/sw.js` — service worker present
- `src/components/ServiceWorkerRegister.tsx` — registers the service worker
- `src/components/PWAInstallPrompt.tsx` — shows install prompt to users
- `next.config.js` — sets `Service-Worker-Allowed: /` and `Cache-Control` headers for `sw.js` and `manifest.json`

### d) Tablet-specific layouts

The app is explicitly designed for **tablet use** (industrial floor tablet environment):
- 44px minimum touch targets on all interactive elements
- Large form fields (`--input-height: 44px`)
- Prominent status indicators (Traffic Light system: green/amber/red)
- `orientation: "portrait-primary"` in manifest suggests portrait tablet use
- `src/components/InteractiveShiftCalendar.tsx` and `src/components/InteractiveStationAssignment.tsx` are named "Interactive" components suggesting touch-first design

---

## ══════════════════════════════════════════════════════════════════════════════
## SUMMARY
## ══════════════════════════════════════════════════════════════════════════════

**ROUTER TYPE:** App Router (`src/app/` with `page.tsx` files)

**CONFIRMED ROUTES:**
- `/` — root redirect
- `/login` — username/password + face recognition login
- `/dashboard` — role-dispatched dashboard hub
- `/lots` — lot list
- `/lots/create` — create lot (Production Lead only)
- `/weight-notes` — weight note entry + list
- `/weight-notes/approve` — weight note approval
- `/ppc-forms/approve` — PPC form approval
- `/qc-forms/approve` — QC form approval
- `/inventory/add` — inventory / shipments
- `/testing/depuration` — depuration form entry
- `/testing/depuration/extract` — depuration sample extraction
- `/testing/depuration/report` — depuration report
- `/testing/depuration/test` — depuration test entry
- `/testing/microbiology` — microbiology testing
- `/testing/microbiology/extract` — microbiology sample extraction
- `/testing/microbiology/report` — microbiology report
- `/testing/microbiology/test` — microbiology test entry
- `/reports/upload` — lab report upload
- `/security-monitor` — real-time security/attendance (WebSocket)
- `/shift-scheduling` — interactive shift calendar
- `/station-assignment` — interactive station assignment
- `/staff/absences` — staff absence management
- `/staff/access-control` — staff management dashboard
- `/devices` — RFID device registry
- `/devices/handover` — device RFID handover
- `/gate-pass/generate` — gate/vehicle management
- `/gate-pass/visitors` — visitor management
- `/onboarding/staff` — staff onboarding (Aadhaar + face)
- `/mobile-scan/[token]` — public QR scan (no auth required)

**CONFIRMED API BASE URL:**  
Variable: `NEXT_PUBLIC_API_URL`  
Pattern: `https://clamflowbackend-production.up.railway.app`  
Also accessed via Next.js rewrite proxy at `/api/backend/*`

**CONFIRMED COMPONENT LIBRARY:**  
Radix UI (multiple primitives, ~15 packages) + Tailwind CSS `^3.4.0` + shadcn/ui-style custom components (no shadcn CLI). Also: `@headlessui/react ^2.2.8`, `lucide-react ^0.487.0`, `framer-motion ^10.16.4`, `recharts ^2.8.0`.

**CONFIRMED FORM LIBRARY:**  
`react-hook-form ^7.48.0` + `zod ^3.22.0` + `@hookform/resolvers ^3.3.0`  
(Used in PPCForm, FPForm, DepurationForm. WeightNoteForm uses plain `useState` + manual validation.)

**CONFIRMED DATA FETCHING:**  
`axios ^1.11.0` (primary, via two parallel API client classes) + native `fetch` (used in WeightNoteForm and AuthContext login).  
`@tanstack/react-query ^5.0.0` is **installed but not actively used** in any component examined.

**CONFIRMED AUTH STORAGE:**  
`localStorage` — keys: `clamflow_token` (JWT), `clamflow_user` (JSON-serialised user object)

**EXISTING QA/PRODUCTION SCREENS:**
- Weight Note entry (`/weight-notes`, `WeightNoteForm`)
- Weight Note approval (`/weight-notes/approve`)
- PPC Form entry (`ProductionStaffDashboard` → PPC station)
- PPC Form approval (`/ppc-forms/approve`, `PendingFormViewer`)
- FP Form entry (`ProductionStaffDashboard` → FP station)
- FP Form approval (`/qc-forms/approve`)
- Depuration form (`/testing/depuration`, `DepurationForm`)
- Depuration sample extraction (`/testing/depuration/extract`, `SampleExtractionForm`)
- Depuration report (`/testing/depuration/report`)
- Depuration test entry (`/testing/depuration/test`)
- Microbiology testing (`/testing/microbiology`)
- Microbiology sample extraction (`/testing/microbiology/extract`)
- Microbiology report + test entry pages
- Lot management + lot creation (`/lots`, `/lots/create`)
- QC Flow Dashboards (`QCFlowDashboard`, `QCFlowDashboardNew`, `QCLeadDashboard`, `QAFlowDashboard`)
- Approval Dashboard (`ApprovalDashboard`, `PendingApprovals`)
- Lab report upload (`/reports/upload`)
- Live Operations Monitor (`operations/LiveOperationsMonitor`)
- Production Analytics (`operations/ProductionAnalytics`)
- QR Label Generator (`integrations/QRLabelGenerator`)

**MISSING / UNKNOWN:**
- ~~`/washing` route — referenced in Sidebar but **no `page.tsx` exists**~~ → **FIXED** (mapped to `/lots`)
- ~~`/depuration` route — no page~~ → **FIXED** (mapped to `/testing/depuration`)
- ~~`/ppc` route — no page~~ → **FIXED** (mapped to `/ppc-forms/approve`)
- ~~`/fp` route — no page~~ → **FIXED** (mapped to `/qc-forms/approve`)
- ~~`/rfid` route — no page~~ → **FIXED** (mapped to `/devices`)
- ~~`/inventory` route — no direct page~~ → **FIXED** (mapped to `/inventory/add`)
- `/washing` — no dedicated page exists; Sidebar link now points to `/lots`. A standalone washing workflow page may be needed in future.
- `src/middleware/auth.ts` — exists but is **not an active Next.js middleware** (wrong location; no root `middleware.ts`)
- `src/context/AppContext.tsx` — exists but is **empty**
- `src/hooks/useApi.ts` — exists but is **empty**
- `src/components/layout/Navigation.tsx` — exists but is **empty**
- `@tanstack/react-query` — installed but **not actively used** in components examined
- `next-auth` — installed but its relationship with the custom `AuthContext` JWT system is unclear; both appear to be present simultaneously
- `src/pages/` (root) and `src/pages/` (under `src/`) — legacy Pages Router files (onboarding, rfid, security) coexist with the App Router; their routing behaviour in production is unknown
- Internal content of `src/types/form.ts`, `src/types/dashboard.ts`, `src/types/user.ts`, `src/types/supabase.ts` — not read
- Content of `src/hooks/useWeightNote.ts`, `useWorkflow.ts`, `useWebSocket.ts` — not read in detail
- `src/lib/offline-sync.ts` — not read (offline sync strategy unknown)
- `src/app/testing/depuration/report/page.tsx` and `test/page.tsx` — first 20 lines not read
- Exact API endpoints called by `SampleExtractionForm.tsx` — not confirmed (file not read completely)
- Exact content of `src/services/ppc-service.ts`, `fp-service.ts`, `weight-note-service.ts` — not read

---

## ══════════════════════════════════════════════════════════════════════════════
## PRIORITY QUERY SUPPLEMENT (2026-07-24)
## ══════════════════════════════════════════════════════════════════════════════

---

## ─── Q1. src/components/layout/Sidebar.tsx — COMPLETE ───────────────────────

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Scale, Package, Droplets,
  Beaker, ClipboardList, FileText, BarChart3, Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    { href: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard, roles: ['all'] },
    { href: '/weight-notes', label: 'Weight Notes',  icon: Scale,           roles: ['production_staff', 'gatekeeper'] },
    { href: '/lots',         label: 'Lot Management',icon: Package,         roles: ['production_staff', 'production_lead'] },
    { href: '/washing',      label: 'Washing',       icon: Droplets,        roles: ['production_staff'] },
    { href: '/depuration',   label: 'Depuration',    icon: Beaker,          roles: ['production_staff'] },
    { href: '/ppc',          label: 'PPC Forms',     icon: ClipboardList,   roles: ['qc_staff', 'qc_lead'] },
    { href: '/fp',           label: 'FP Forms',      icon: FileText,        roles: ['qc_staff', 'qc_lead'] },
    { href: '/inventory',    label: 'Inventory',     icon: BarChart3,       roles: ['all'] },
    { href: '/rfid',         label: 'RFID Tracking', icon: Tag,             roles: ['production_lead', 'qc_lead'] },
  ];

  const filteredItems = menuItems.filter(item =>
    item.roles.includes('all') ||
    (user?.role && item.roles.includes(user.role.toLowerCase().replace(' ', '_')))
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm h-[calc(100vh-4rem)]">
      <nav className="p-3">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors min-h-[44px] ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
```

**This is the complete file — 55 lines total.**

Key issues confirmed:
- `replace(' ', '_')` only replaces the **first space** in role strings. `'Production Staff'` → `'production staff'` ≠ `'production_staff'`. All role-filtered items silently hide.
- Five `href` links (`/washing`, `/depuration`, `/ppc`, `/fp`, `/rfid`) have **no corresponding `page.tsx`** anywhere in `src/app/`.
- This Sidebar component is rendered by `src/components/layout/Layout.tsx` but it is **not** used by any of the role-specific dashboard components; those embed their own internal tab navigation.

---

## ─── Q2. src/context/AuthContext.tsx — COMPLETE ─────────────────────────────

```tsx
// src/context/AuthContext.tsx - Production-Ready & Lint-Free Version
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'Super Admin' | 'Admin' | 'IT Staff' | 'Production Lead' | 'QC Lead' |
        'Staff Lead' | 'QC Staff' | 'Production Staff' | 'Maintenance Staff' |
        'Security Guard' | 'Gate Staff';
  station?: string;
  is_active: boolean;
  last_login?: string;
  requires_password_change?: boolean;
  first_login?: boolean;
}

interface FaceLoginResult {
  success: boolean;
  access_token: string;
  user: {
    id: string; username: string; full_name: string; role: string;
    station?: string; is_active: boolean;
    requires_password_change?: boolean; first_login?: boolean;
  };
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;
  login: (username: string, password: string) =>
    Promise<{ success: boolean; error?: string; requiresPasswordChange?: boolean }>;
  faceLogin: (faceAuthResult: FaceLoginResult) =>
    Promise<{ success: boolean; error?: string; requiresPasswordChange?: boolean }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) =>
    Promise<{ success: boolean; error?: string }>;
  refreshToken: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// All auth calls go through the Next.js rewrite proxy to avoid CORS
const API_BASE_URL = '/api/backend';

// ── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]     = useState<User | null>(null);
  const [token, setToken]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const router = useRouter();

  // Init from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('clamflow_token');
      const storedUser  = localStorage.getItem('clamflow_user');
      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        setRequiresPasswordChange(userData.requires_password_change || false);
      }
    } catch {
      localStorage.removeItem('clamflow_token');
      localStorage.removeItem('clamflow_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── login() ───────────────────────────────────────────────────────────────
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (response.ok) {
        const data = await response.json();
        const authToken  = data.access_token;
        const userData: User = {
          id: data.user.id, username: data.user.username,
          full_name: data.user.full_name, role: data.user.role,
          station: data.user.station, is_active: data.user.is_active,
          last_login: new Date().toISOString(),
          requires_password_change: data.user.requires_password_change || false,
          first_login: data.user.first_login || false,
        };
        // Save to localStorage first, then set state
        localStorage.setItem('clamflow_token', authToken);
        localStorage.setItem('clamflow_user', JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
        setRequiresPasswordChange(userData.requires_password_change || false);

        if (userData.requires_password_change) {
          return { success: true, requiresPasswordChange: true };
        }
        await new Promise(r => setTimeout(r, 200)); // state propagation delay
        router.push('/dashboard');
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.detail || 'Invalid credentials' };
      }
    } catch {
      return { success: false, error: 'Authentication service unavailable.' };
    } finally {
      setIsLoading(false);
    }
  };

  // ── faceLogin() ───────────────────────────────────────────────────────────
  // Receives a pre-validated FaceLoginResult from FaceRecognitionLogin component
  const faceLogin = async (faceAuthResult: FaceLoginResult) => {
    try {
      setIsLoading(true);
      if (!faceAuthResult.success) {
        return { success: false, error: faceAuthResult.message || 'Face auth failed' };
      }
      const authToken = faceAuthResult.access_token;
      const userData: User = {
        id: faceAuthResult.user.id, username: faceAuthResult.user.username,
        full_name: faceAuthResult.user.full_name,
        role: faceAuthResult.user.role as User['role'],
        station: faceAuthResult.user.station,
        is_active: faceAuthResult.user.is_active,
        last_login: new Date().toISOString(),
        requires_password_change: faceAuthResult.user.requires_password_change || false,
        first_login: faceAuthResult.user.first_login || false,
      };
      localStorage.setItem('clamflow_token', authToken);
      localStorage.setItem('clamflow_user', JSON.stringify(userData));
      setToken(authToken); setUser(userData);
      setRequiresPasswordChange(userData.requires_password_change || false);
      if (userData.requires_password_change) return { success: true, requiresPasswordChange: true };
      await new Promise(r => setTimeout(r, 200));
      router.push('/dashboard');
      return { success: true };
    } catch {
      return { success: false, error: 'Face login failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  // ── changePassword() ─────────────────────────────────────────────────────
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return { success: false, error: 'No user logged in' };
    // Client-side validation
    if (newPassword.length < 8)
      return { success: false, error: 'Password must be at least 8 characters' };
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword))
      return { success: false, error: 'Password must contain uppercase, lowercase, number, and special character' };

    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    if (response.ok) {
      const updated = { ...user, requires_password_change: false, first_login: false };
      setUser(updated); setRequiresPasswordChange(false);
      localStorage.setItem('clamflow_user', JSON.stringify(updated));
      await new Promise(r => setTimeout(r, 100));
      router.push('/dashboard');
      return { success: true };
    }
    const err = await response.json();
    return { success: false, error: err.message || 'Failed to change password' };
  };

  // ── logout() ─────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null); setToken(null); setRequiresPasswordChange(false);
    localStorage.removeItem('clamflow_token');
    localStorage.removeItem('clamflow_user');
    router.push('/login');
  };

  // ── refreshToken() ───────────────────────────────────────────────────────
  const refreshToken = async (): Promise<boolean> => {
    if (!token) return false;
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) { logout(); return false; }
    const data = await response.json();
    setToken(data.access_token);
    localStorage.setItem('clamflow_token', data.access_token);
    return true;
  };

  // ── hasPermission() ──────────────────────────────────────────────────────
  // Only covers RFID-specific permissions — not a general permission system
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const map: Record<string, string[]> = {
      'RFID_READ':          ['Super Admin','Admin','Production Lead','QC Lead','Staff Lead','QC Staff','Production Staff','Security Guard'],
      'RFID_SCAN':          ['Super Admin','Admin','QC Lead','QC Staff'],
      'RFID_BATCH_SCAN':    ['Super Admin','Admin','QC Lead'],
      'RFID_CONTINUOUS_SCAN': ['Super Admin','Admin'],
    };
    return map[permission]?.includes(user.role) || false;
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, requiresPasswordChange,
      isAuthenticated: !!user && !!token,
      login, faceLogin, logout, changePassword, refreshToken, hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export default AuthContext;
```

**File is ~370 lines. Shown above in condensed-but-complete form — all logic is preserved.**

Key facts confirmed:
- Auth API endpoint: `POST /api/backend/auth/login` (via Next.js rewrite proxy → Railway)
- Password change: `POST /api/backend/auth/change-password`
- Token refresh: `POST /api/backend/auth/refresh`
- Storage: `localStorage` keys `clamflow_token` + `clamflow_user`
- `hasPermission()` only maps 4 RFID permissions — it is **not** a full permission system
- No token expiry check on page load — stale/expired tokens are only evicted on a 401 response
- `next-auth` / `SessionProvider` / `getServerSession` / `useSession` are **never called** in this file or anywhere in `src/`

---

## ─── Q3. src/lib/clamflow-api.ts — COMPLETE (structure summary) ─────────────

The file is **~1850 lines**. Full content was read across 6 pages. Summary of all sections:

### File structure

```
Line 1–80     Imports + shared interfaces (ApiResponse, LoginResponse, ApprovalItem,
               Notification, AuditLog)
Line 81        API_BASE_URL constant (NEXT_PUBLIC_API_URL || Railway fallback)
Line 82–160    Station/Shift API interfaces (StationDefinition, StationAssignment,
               ShiftDefinition, ShiftAssignment, StaffForScheduler)
Line 161–250   Form interfaces (WeightNoteFormData, PPCFormData, FPFormData, AdminFormData)
Line 251–400   Visitor pass interfaces (VisitorCategory, VisitorSubjectType,
               VisitorPassResponse, IdentifyPersonResponse, etc.)
Line 401–430   WebSocket event types (CameraDetectionEvent, AttendanceWsEvent)
Line 431–465   Aadhaar interfaces (AadhaarParsedResult, MobileScanCreateResponse, etc.)
Line 466–462   preprocessImageForUpload() — EXIF-aware image resize helper (canvas-based)
Line 463–1840  ClamFlowAPI class:
                 constructor() — reads token from localStorage
                 getHeaders() — adds Bearer token
                 request<T>() — core fetch wrapper with:
                   - 401 → handleUnauthorized() (clears localStorage, redirects /login)
                   - 403 → throws with status=403
                   - 409 → throws with status=409
                   - 422 → parses FastAPI validation errors
                   - transformKeysToCamel() on all responses
                   - pagination unwrapping (items, data, finishedProducts keys)
                   - isArrayEndpoint() guard
                 get/post/put/delete wrappers
                 login(), getCurrentUser(), getAllUsers(), createUser(), updateUser(), deleteUser()
                 getWeightNotes(), createWeightNote(), approveWeightNote()
                 getDashboardMetrics(), getSystemHealth(), getNotifications(), getAuditLogs()
                 getPendingApprovals(), approveForm(), rejectForm()
                 getAdmins(), createAdmin(), updateAdmin(), deleteAdmin()
                 getStations(), getActiveLots(), getBottlenecks()
                 Workflow API: getWorkflowStatus(), initializeWorkflow(), startWorkflowStep(),
                   completeWorkflowStep(), failWorkflowStep(), retryWorkflowStep()
                 Admin Dashboard: getAdminOverview(), getAdminPendingTasks(),
                   getAdminRecentActivity(), getAdminOperationalAlerts()
                 getLiveOperations()
                 Station CRUD + bulkCreateStationAssignments(), clearAssignmentsForDate()
                 Shift CRUD (definitions + assignments), getStaffForScheduler()
                 Gate: getVehicles(), recordGateEntry(), recordGateExit(), getBoxTally()
                 Security: getCameras(), getSecurityEvents(), getFaceDetectionEvents()
                 Production Analytics: getThroughput(), getEfficiencyMetrics(), etc.
                 Staff: getStaffAttendance(), getStaffLocations(), getShiftSchedules()
                 Inventory: getFinishedProducts(), getInventoryItems(), getReadyForShipment()
                 QC Workflow: getPPCForms(), createPPCForm(), getFPForms(), createFPForm(),
                   getQCForms(), approveQCForm(), rejectQCForm(), productionLeadApprovePPC(),
                   qcLeadApproveFP(), getDepurationForms(), extractSample(),
                   submitDepurationForm(), approveDepuration()
                 Lots: getLots(), createLot(), getLot(), updateLotStatus()
                 Staff: getStaff(), getQCStaff()
                 Onboarding: submitStaffOnboarding(), submitSupplierOnboarding(),
                   submitVendorOnboarding(), approveOnboarding(), rejectOnboarding(),
                   getPendingOnboarding()
                 Aadhaar: createMobileScan(), getMobileScanResult(), scanAadhaarImage(),
                   completeOnboarding() — all use raw fetch() with FormData, not JSON
                 RFID: linkRFIDTag(), scanRFIDTag(), getRFIDTags(), updateRFIDTag()
                 QR Labels: generateQRLabel()
                 Visitors: registerVisitor(), identifyPerson(), verifyVisitorFace(),
                   scanVisitorPass(), listVisitors(), logVisitorExit(), revokeVisitorPass()
                 Attendance: getAttendanceMonitor(), supervisorOverride()
Line 1600–1840 Interfaces continued (QCFormResponse, QCMetricsResponse, LotResponse,
               CreateLotRequest, StaffMember, onboarding requests, RFIDLinkRequest,
               QRLabelRequest, QRLabelResponse)
Line 1755–1840 Module-level helpers:
               hasPermission(), canAccessModule(), canApproveForm()
               staffStationCache (in-memory Map, 5-min TTL)
               fetchStaffAssignedStations(), getQCStaffAssignedStations(),
               canQCStaffApproveStation(), canQCStaffApproveStationAsync(),
               clearStationAssignmentCache(), preloadStaffStationAssignments()
Line 1848      export const clamflowAPI = new ClamFlowAPI()
               export default clamflowAPI
```

### Critical design notes
- Uses **native `fetch`** (not axios) inside `ClamFlowAPI.request<T>()`
- Reads token from `localStorage` in constructor — **token is snapshot at construction time**, not live. If token changes after import, `clamflowAPI.setToken(newToken)` must be called manually.
- **All responses** go through `transformKeysToCamel()` — backend `snake_case` → frontend `camelCase`
- File upload endpoints (`scanAadhaarImage`, `completeOnboarding`) bypass `request<T>()` and call `fetch()` directly with `FormData`

---

## ─── Q4. src/services/notification-service.ts ────────────────────────────────

**File is empty.** Zero bytes of content.

---

## ─── Q4. src/services/whatsapp-service.ts — COMPLETE ───────────────────────

```ts
// src/services/whatsapp-service.ts
// WhatsApp Welcome Message Service using Twilio

class WhatsAppService {
  private readonly accountSid: string;     // process.env.TWILIO_ACCOUNT_SID
  private readonly authToken: string;      // process.env.TWILIO_AUTH_TOKEN
  private readonly whatsappNumber: string; // process.env.TWILIO_WHATSAPP_NUMBER
  private readonly enabled: boolean;       // NEXT_PUBLIC_TWILIO_ENABLED === 'true'

  // Sends welcome message on new user creation (contains credentials in plaintext)
  async sendWelcomeMessage(userCredentials: UserCredentials): Promise<WhatsAppMessageResponse>
  // Sends password reset notification (contains new password in plaintext)
  async sendPasswordResetNotification(fullName, username, newPassword, phoneNumber)
  private generateWelcomeMessage(...)  // Returns message with username+password in body
  private formatPhoneNumber(phone)     // Adds +91 (India) country code if 10 digits
}

export const whatsappService = new WhatsAppService();
export const sendWelcomeMessage = (creds) => whatsappService.sendWelcomeMessage(creds);
export const sendPasswordResetNotification = (...) => whatsappService.sendPasswordResetNotification(...);
```

**Environment variables required (all server-side, not NEXT_PUBLIC_):**
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER` (default: `whatsapp:+14155238886` — Twilio sandbox number)
- `NEXT_PUBLIC_TWILIO_ENABLED` — must be `'true'` to activate

**Security note:** The WhatsApp message template transmits the plaintext password and username in the message body. This is consistent with first-login credential delivery but the `sendPasswordResetNotification()` method also sends the new plaintext password, which is a security risk for reset flows.

None of these variables are present in `.env.local` or `.env.example`. The service is **disabled by default** (`enabled = false` when `NEXT_PUBLIC_TWILIO_ENABLED` is not set).

---

## ─── Q5. find middleware.ts / middleware.js — RESULT ────────────────────────

```
Command: find . -name "middleware.ts" -o -name "middleware.js" | grep -v node_modules
Result: (no output — exit code 1)
```

**No `middleware.ts` or `middleware.js` file exists anywhere in the project**, at any depth.

`src/middleware/auth.ts` is named `auth.ts`, not `middleware.ts`, so it does **not** activate as Next.js middleware. The previously noted finding is confirmed: **there is zero active Next.js middleware in this project**. All route protection is client-side only.

---

## ─── Q6. SessionProvider / getServerSession / useSession — GREP RESULT ──────

```
Command: grep -rn "SessionProvider|getServerSession|useSession" src/ --include="*.tsx" --include="*.ts"
Result: (no output)
```

**Zero matches.** `next-auth` (`^4.24.0`) is listed in `package.json` but is **completely unused** in all of `src/`. No `SessionProvider` wrapper, no `getServerSession` calls, no `useSession` hook anywhere. The installed `next-auth` package is dead code.

---

## ─── Q7. src/lib/supabase.ts — COMPLETE ─────────────────────────────────────

```ts
// frontend/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Auth helpers
export const signInWithEmail  = async (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = async () =>
  supabase.auth.signOut()

export const getCurrentUser = async () =>
  supabase.auth.getUser()

// Used by weight-note page
export const getSession = async () =>
  supabase.auth.getSession()

export default supabase
```

**This is the complete file — ~42 lines.**

### What this tells us about Supabase Storage uploads

**Supabase Storage is NOT directly called from any frontend file examined.** The client here only configures `auth` and `realtime`. There are no calls to `supabase.storage.from(...)` or any bucket operations visible in the codebase.

Supabase Storage upload capability summary:

| Capability | Available? | Notes |
|---|---|---|
| Supabase client configured | ✅ | `createClient` with typed `Database` generic |
| Supabase anon key available | ✅ | `NEXT_PUBLIC_SUPABASE_ANON_KEY` in env |
| Storage bucket operations | ❌ Not used | No `supabase.storage.from()` calls found |
| Auth session for RLS | ⚠️ Partial | `getSession()` exists but app uses custom JWT, not Supabase Auth |
| File upload pattern | ❌ Not established | Current file uploads (`/reports/upload`) POST to the Railway backend via `fetch()` |

**For evidence/document uploads**, the existing pattern in `src/app/reports/upload/page.tsx` POSTs a `FormData` multipart body directly to the Railway backend API. If Supabase Storage is needed instead, the pattern would be:

```ts
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload(`path/${filename}`, file, { upsert: false });
const publicUrl = supabase.storage.from('bucket-name').getPublicUrl(data.path);
```

However, **because the frontend uses its own JWT (not Supabase Auth), Supabase RLS policies cannot identify the uploading user** — uploads would need to use the `anon` role or a service role, or the backend must act as the storage proxy.

---

## ─── SUPPLEMENT SUMMARY ─────────────────────────────────────────────────────

| Item | Finding |
|---|---|
| Sidebar.tsx | 55 lines, complete. Role-filter bug confirmed (single `replace`). 5 dead links. Not used by role dashboards. |
| AuthContext.tsx | ~370 lines, complete. localStorage-based JWT, no token expiry check, `hasPermission()` covers 4 RFID permissions only. All auth via `/api/backend` proxy. |
| clamflow-api.ts | ~1850 lines. Native `fetch` (not axios). Token snapshot at construction. All responses camelCase-transformed. 60+ methods covering every module. |
| notification-service.ts | **Empty file.** |
| whatsapp-service.ts | Twilio WhatsApp welcome/reset message sender. Disabled by default. Sends plaintext password in messages. Not connected to any env variable in current `.env.local`. |
| `middleware.ts` anywhere | **Does not exist** at any path. No active Next.js middleware. |
| `SessionProvider` / `useSession` / `getServerSession` | **Zero usages** in `src/`. `next-auth` is dead code. |
| supabase.ts | 42 lines. Configures auth + realtime only. No Storage bucket calls anywhere in codebase. Uploads currently go to Railway backend via `fetch(FormData)`. Supabase Storage could be added but RLS would require service-role or backend proxy due to custom JWT auth. |

---

## ══════════════════════════════════════════════════════════════════════════════
## EIA COMPLIANCE MODULE — IMPLEMENTATION LOG (2026-07-25)
## ══════════════════════════════════════════════════════════════════════════════

All changes below were applied in a single session. Zero files were deleted. All lint checks passed after implementation.

---

### STEP 1 — Sidebar.tsx bug fix + EIA Compliance nav item

**File:** `src/components/layout/Sidebar.tsx`

**1A — Regex fix (role filter bug):**

| Before | After |
|---|---|
| `user.role.toLowerCase().replace(' ', '_')` | `user.role.toLowerCase().replace(/ /g, '_')` |

Without the `/g` flag, `String.replace()` only replaces the **first** occurrence. Roles with two words (e.g. `'Production Staff'`) were transformed to `'production staff'` rather than `'production_staff'`, causing all role-filtered nav items to silently disappear. The `/g` (global) flag ensures every space is replaced, fixing role-based filtering for all multi-word roles system-wide.

**1B — New nav item added to `menuItems`:**

```ts
{ href: '/compliance', label: 'EIA Compliance', icon: ShieldCheck,
  roles: ['qc_lead', 'production_lead', 'admin', 'super_admin'] },
```

`ShieldCheck` was added to the existing `lucide-react` import line.

**1C — EIA Officer sidebar suppression:**

```tsx
if (user?.role === 'EIA Officer') return null;
```

Added immediately before the `return (<aside …>` statement. EIA Officers are served a dedicated minimal layout inside the compliance module (see Step 6) and must not see the standard ClamFlow sidebar.

---

### STEP 2 — `'EIA Officer'` added to all role type definitions

Three files updated:

**`src/context/AuthContext.tsx` — local `User` interface `role` union:**

```ts
// Before (11 roles):
role: 'Super Admin' | 'Admin' | 'IT Staff' | 'Production Lead' | 'QC Lead' |
      'Staff Lead' | 'QC Staff' | 'Production Staff' | 'Maintenance Staff' |
      'Security Guard' | 'Gate Staff';

// After (12 roles):
role: 'Super Admin' | 'Admin' | 'IT Staff' | 'Production Lead' | 'QC Lead' |
      'Staff Lead' | 'QC Staff' | 'Production Staff' | 'Maintenance Staff' |
      'Security Guard' | 'Gate Staff' | 'EIA Officer';
```

Note: `AuthContext.tsx` has its own local `User` interface separate from `src/types/auth.ts`. Both must be kept in sync.

**`src/types/auth.ts` — `UserRole` union, `ROLE_DISPLAY_NAMES`, `ROLE_HIERARCHY`:**

```ts
// UserRole — added:
| 'EIA Officer'

// ROLE_DISPLAY_NAMES — added:
'EIA Officer': 'EIA Officer',

// ROLE_HIERARCHY — added:
'EIA Officer': 1,
```

Hierarchy level `1` (same as `Gate Staff`) — read-only external auditor access.

**`src/types/index.ts` — re-exported `UserRole` literal updated** to include `'EIA Officer'`.

---

### STEP 3 — Dashboard redirect for EIA Officer

**File:** `src/app/dashboard/page.tsx`

Two changes:

**3A — Added `'EIA Officer'` to `DASHBOARD_ROLES`:**

```ts
// Before:
const DASHBOARD_ROLES = ['Super Admin', 'Admin', 'IT Staff', 'Staff Lead',
  'Production Lead', 'QC Lead', 'QC Staff', 'Production Staff', 'Security Guard'];

// After:
const DASHBOARD_ROLES = ['Super Admin', 'Admin', 'IT Staff', 'Staff Lead',
  'Production Lead', 'QC Lead', 'QC Staff', 'Production Staff', 'Security Guard',
  'EIA Officer'];
```

Without this addition the existing `DASHBOARD_ROLES` check would set an "Access denied" error before the redirect could fire.

**3B — Early redirect inserted after the `DASHBOARD_ROLES` check:**

```ts
if (user.role === 'EIA Officer') {
  router.replace('/compliance');
  return;
}
```

`router.replace` (not `push`) is used so the dashboard is not added to browser history — EIA Officers pressing Back from the compliance module will return to the previous page, not loop back to dashboard.

---

### STEP 4 — 16 new methods added to `ClamFlowAPI` class

**File:** `src/lib/clamflow-api.ts`  
**Insertion point:** end of `ClamFlowAPI` class body, immediately before the closing `}`  
**Pattern used:** `this.get<T>()`, `this.post<T>()`, and `this.request<T>(endpoint, { method: 'PATCH' })` — all consistent with existing methods. All responses auto-camelCased by `transformKeysToCamel()` inside `request<T>()`.

> **Note on `getPPCForm` and `getFPForm`:** These already existed in the class (lines 1152 and 1177 respectively, returning typed `ApiResponse<PPCFormData>` and `ApiResponse<FPFormData>`). The new compliance page uses the existing methods directly. Only the genuinely new methods listed below were added.

| Method | HTTP | Endpoint | Description |
|---|---|---|---|
| `submitEIAComment(data)` | POST | `/api/compliance/comments` | EIA Officer creates comment → auto-raises `DRAFT_NCR` |
| `getCommentsForRecord(recordType, recordId)` | GET | `/api/compliance/comments?record_type=…&record_id=…` | Fetch all EIA comments on a production record |
| `listNCRs(ncrStatus?)` | GET | `/api/compliance/ncr[?ncr_status=…]` | List all NCRs, optionally filtered by status |
| `getNCR(ncrId)` | GET | `/api/compliance/ncr/:id` | Single NCR detail |
| `classifyNCR(ncrId, data)` | PATCH | `/api/compliance/ncr/:id/classify` | QC Lead classifies `DRAFT_NCR` → `CONFIRMED_NCR` or `CLARIFICATION` |
| `dispatchCorrectiveAction(ncrId, data)` | PATCH | `/api/compliance/ncr/:id/dispatch` | QC Lead assigns corrective action to a staff member |
| `submitEvidenceUrl(ncrId, evidenceUrl)` | PATCH | `/api/compliance/ncr/:id/submit-evidence` | Submit evidence by URL |
| `uploadEvidenceFile(ncrId, file)` | POST (FormData) | `/api/compliance/ncr/:id/upload-evidence` | Upload evidence file. **Bypasses `request<T>()`** — uses raw `fetch(FormData)` with manual `Authorization` header, identical to `scanAadhaarImage()` and `completeOnboarding()` patterns already in the file |
| `closeNCR(ncrId)` | PATCH | `/api/compliance/ncr/:id/close` | QC Lead verifies evidence and closes NCR → `RESOLVED` |
| `getMyNotifications(unreadOnly?)` | GET | `/api/compliance/notifications[?unread_only=true]` | Fetch notifications for the logged-in user |
| `markNotificationRead(notifId)` | PATCH | `/api/compliance/notifications/:id/read` | Mark single notification as read |
| `markAllNotificationsRead()` | PATCH | `/api/compliance/notifications/read-all` | Mark all notifications read |
| `getWeightNote(noteId)` | GET | `/api/weight-notes/:id` | Single weight note by ID |
| `getDepurationForm(formId)` | GET | `/api/v1/depuration/form/:id` | Single depuration form by ID |
| `getUsersList()` | GET | `/api/users/` | All users (used by Dispatch form to populate assignee dropdown) |

---

### STEP 5 — New type file: `src/types/compliance.ts`

**File created:** `src/types/compliance.ts`  
**Exported from:** `src/types/index.ts` via `export * from './compliance';`

Types defined:

| Type | Kind | Description |
|---|---|---|
| `NCRStatus` | `type` (union) | 8 status values: `DRAFT_NCR`, `CONFIRMED_NCR`, `ACTION_DISPATCHED`, `EVIDENCE_SUBMITTED`, `RESOLVED`, `OVERDUE`, `BREACH`, `CLARIFICATION` |
| `NCRSeverity` | `type` (union) | `MINOR` \| `MAJOR` \| `CRITICAL` |
| `NCRSummary` | `interface` | Embedded in comments — id, ncrNumber, status, severity, deadlines, hoursRemaining |
| `ComplianceComment` | `interface` | EIA Officer comment record, includes optional nested `ncr?: NCRSummary` |
| `NCRRecord` | `interface extends NCRSummary` | Full NCR with all lifecycle fields (classify, dispatch, evidence, escalation timestamps) |
| `AppNotification` | `interface` | In-app notification — id, title, body, category (`NCR`\|`OVERDUE`\|`BREACH`\|`RESOLVED`), isRead, createdAt |

---

### STEP 6 — Three new compliance pages created

#### `src/app/compliance/layout.tsx`

Role guard for the entire `/compliance` subtree. Allowed roles: `['EIA Officer', 'QC Lead', 'Production Lead', 'Admin', 'Super Admin']`.

- Unauthenticated users → redirect `/login`
- Users with no compliance access → redirect `/dashboard`
- **EIA Officer** → renders a dedicated minimal chrome: sticky header with app name, facility name (RHHF · Panavally), user full name, and a Logout button. No ClamFlow sidebar.
- All other allowed roles → `<>{children}</>` (their normal layout wraps this transparently)

#### `src/app/compliance/page.tsx`

Two-tab interface:

**Tab 1 — Production Records** (visible to all allowed roles)
- Lists lots from `clamflowAPI.getLots()` in a scrollable card list
- Each lot row shows `lotNumber`, species, arrival date, status badge
- Clicking a row navigates to `/compliance/record/lots/:id`

**Tab 2 — NCR Register** (hidden from EIA Officers; visible to QC Lead / Admin / Super Admin)
- Fetches from `clamflowAPI.listNCRs()`
- Table sorted by priority: `BREACH → OVERDUE → DRAFT_NCR → CONFIRMED_NCR → ACTION_DISPATCHED → EVIDENCE_SUBMITTED → CLARIFICATION → RESOLVED`
- Urgent count badge on tab label for `BREACH`, `OVERDUE`, `DRAFT_NCR`
- Columns: NCR Number (monospace purple), Record type, Severity chip, `StatusBadge`, Raised date
- Clicking a row navigates to the source record detail page

**`StatusBadge` component (inline):**

| Status | Colour | Behaviour |
|---|---|---|
| `DRAFT_NCR` | Amber | Static |
| `CONFIRMED_NCR` | Orange | Static |
| `ACTION_DISPATCHED` | Blue | Static |
| `EVIDENCE_SUBMITTED` | Purple | Static |
| `RESOLVED` | Green | Static |
| `OVERDUE` | Red | `animate-pulse` |
| `BREACH` | Dark Red, bold | `animate-pulse` |
| `CLARIFICATION` | Grey | Static |

#### `src/app/compliance/record/[record_type]/[record_id]/page.tsx`

Dynamic route. `record_type` values: `lots`, `weight_notes`, `ppc_forms`, `fp_forms`, `depuration_forms`.

**Record loading dispatch:**

```ts
if (record_type === 'lots')              → clamflowAPI.getLot(id)
if (record_type === 'weight_notes')      → clamflowAPI.getWeightNote(id)
if (record_type === 'ppc_forms')         → clamflowAPI.getPPCForm(id)
if (record_type === 'fp_forms')          → clamflowAPI.getFPForm(id)
if (record_type === 'depuration_forms')  → clamflowAPI.getDepurationForm(id)
```

**Layout:** 5-column grid — record detail (3 cols) + comment/NCR panel (2 cols).

**Record detail panel:** Read-only `<dl>` rendering all top-level fields from the API response. Fields `id`, `createdBy`, `updatedAt` are excluded. Booleans rendered as `✓ Yes` / `✗ No`. Objects rendered as formatted `<pre>` JSON.

**Comment thread:** Scrollable list of `ComplianceComment` objects with author, timestamp, status chip, and comment text.

**EIA Officer comment submission:** Textarea + Submit button (visible only when `user.role === 'EIA Officer'`). Warning note: "⚠ Submitting creates a draft NCR. QC Lead must classify within 24 hours." Calls `clamflowAPI.submitEIAComment()`.

**`NCRPanel` sub-component:** Rendered when `comments[0].ncr` exists. Shows:
- NCR number (monospace)
- OVERDUE / BREACH alert banner (red, shown when status is either)
- `StatusBadge` + hours remaining counter (amber if >6h, red + bold if <6h)
- Action buttons gated by role and current NCR status:

| Button | Visible when | Role | Calls |
|---|---|---|---|
| Classify NCR | `status === 'DRAFT_NCR'` | QC Lead / Admin / Super Admin | `ClassifyForm` inline form |
| Dispatch Corrective Action | `status === 'CONFIRMED_NCR'` | QC Lead / Admin / Super Admin | `DispatchForm` inline form |
| Submit Evidence | `status === 'ACTION_DISPATCHED'` | Any allowed role | `EvidenceForm` inline form |
| Verify & Close NCR | `status === 'EVIDENCE_SUBMITTED'` | QC Lead / Admin / Super Admin | `clamflowAPI.closeNCR()` |

**Inline sub-forms:**

- **`ClassifyForm`:** Select decision (`CONFIRMED_NCR` / `CLARIFICATION`), severity dropdown (if confirmed), notes textarea. Calls `clamflowAPI.classifyNCR()`.
- **`DispatchForm`:** Staff member select (populated from `clamflowAPI.getUsersList()`), corrective instruction textarea, `datetime-local` due date. Calls `clamflowAPI.dispatchCorrectiveAction()`.
- **`EvidenceForm`:** File upload (`accept=".pdf,.jpg,.jpeg,.png,.webp"`) OR URL paste. File path calls `clamflowAPI.uploadEvidenceFile()` then `clamflowAPI.submitEvidenceUrl()` with the returned URL.

All interactive elements use `min-h-[44px]` touch targets.

---

### STEP 7 — `sendNCRAlert()` added to `WhatsAppService`

**File:** `src/services/whatsapp-service.ts`

Two new methods added inside the `WhatsAppService` class:

**`sendNCRAlert(params)`** — public method:

```ts
async sendNCRAlert(params: {
  recipientPhone: string;
  recipientName: string;
  ncrNumber: string;
  alertType: 'NEW_NCR' | 'OVERDUE' | 'BREACH';
  hoursRemaining?: number;
  recordType: string;
}): Promise<WhatsAppMessageResponse>
```

Three message templates:

| `alertType` | Message summary |
|---|---|
| `NEW_NCR` | "New EIA Comment — {ncrNumber}. Classify within 24 hours." |
| `OVERDUE` | "⚠ OVERDUE NCR: {ncrNumber}. QC Lead has NOT classified within 24 hours. Immediate action required." |
| `BREACH` | "🚨 BREACH NCR: {ncrNumber}. Corrective action NOT dispatched within 48 hours. Escalated to Admin." |

Returns early with `{ success: false, message: 'WhatsApp disabled' }` when `this.enabled === false` (default behaviour — no Twilio keys configured).

**`sendMessage(to, body)` — private helper:**

Extracted send logic so both `sendNCRAlert` and existing send flows share one Twilio REST implementation. Uses `btoa()` (browser-compatible, matches service worker environment) rather than `Buffer.from()` which is Node.js-only.

> **Security note (pre-existing, unchanged):** `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are read from `process.env` into class properties and the Twilio REST call is made client-side. In production, this should be moved to a Next.js API route to prevent credential exposure in the browser bundle. Flagged for a future sprint.

---

### STEP 8 — Notification bell added to `AppHeader.tsx`

**File:** `src/components/layout/AppHeader.tsx`

New imports added:
```ts
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import clamflowAPI from '../../lib/clamflow-api';
```

New state inside component:
```ts
const [unreadCount, setUnreadCount] = useState(0);
const [notifications, setNotifications] = useState<any[]>([]);
const [showNotifs, setShowNotifs] = useState(false);
```

Polling effect:
```ts
useEffect(() => {
  const load = async () => {
    const res = await clamflowAPI.getMyNotifications(true);
    const list = Array.isArray(res) ? res : [];
    setUnreadCount(list.length);
    setNotifications(list.slice(0, 10));
  };
  load();
  const interval = setInterval(load, 60000);  // poll every 60 seconds
  return () => clearInterval(interval);
}, []);
```

Bell icon with unread badge:
- Badge shows count up to 9, then `9+`
- Badge only renders when `unreadCount > 0`
- Dropdown renders on click (toggles `showNotifs`)

Notification dropdown (width `w-80`, `max-h-96`, scrollable):
- Header row: "Notifications" label + "Mark all read" button (calls `markAllNotificationsRead()`, closes panel)
- Empty state: "No new notifications."
- Notification row: category-coloured title (BREACH → red, OVERDUE → amber, RESOLVED → green), body (2-line clamp), relative timestamp (`en-IN` locale)
- Clicking a row: calls `markNotificationRead(n.id)`, closes panel, navigates to `/compliance` if `n.referenceId` is set

All interactive elements maintain `min-h-[44px] min-w-[44px]` touch targets.

---

### STEP 9 — Environment variables required (Twilio / WhatsApp)

The following variables must be added to `.env.local` and to Vercel project settings (Settings → Environment Variables) before WhatsApp NCR alerts are active:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
NEXT_PUBLIC_TWILIO_ENABLED=true
```

Without these, `WhatsAppService.enabled === false` and all `sendNCRAlert()` calls return `{ success: false, message: 'WhatsApp disabled' }` immediately — no Twilio API calls are made.

`TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are **not** prefixed with `NEXT_PUBLIC_` and are therefore server-side only in Next.js — they are not bundled into the client JS. However, `whatsapp-service.ts` currently runs in the browser (it calls Twilio REST directly from the client). For production, the Twilio REST call should be moved to a Next.js API route so credentials remain server-side only. Deferred to a future sprint.

---

### EIA COMPLIANCE MODULE — FILES CHANGED / CREATED SUMMARY

| File | Change type | Description |
|---|---|---|
| `src/components/layout/Sidebar.tsx` | Modified | Regex fix (`/g` flag), `ShieldCheck` import, compliance nav item, EIA Officer `return null` guard |
| `src/context/AuthContext.tsx` | Modified | `'EIA Officer'` added to local `User.role` union |
| `src/types/auth.ts` | Modified | `'EIA Officer'` added to `UserRole`, `ROLE_DISPLAY_NAMES`, `ROLE_HIERARCHY` (level 1) |
| `src/types/index.ts` | Modified | `UserRole` re-export updated; `export * from './compliance'` added |
| `src/app/dashboard/page.tsx` | Modified | `'EIA Officer'` added to `DASHBOARD_ROLES`; early `router.replace('/compliance')` redirect |
| `src/lib/clamflow-api.ts` | Modified | 15 new methods added to `ClamFlowAPI` class (compliance, notifications, getWeightNote, getDepurationForm, getUsersList) |
| `src/types/compliance.ts` | **Created** | `NCRStatus`, `NCRSeverity`, `NCRSummary`, `ComplianceComment`, `NCRRecord`, `AppNotification` |
| `src/app/compliance/layout.tsx` | **Created** | Role guard + EIA Officer minimal layout chrome |
| `src/app/compliance/page.tsx` | **Created** | Lot register + NCR register with priority sort and status badges |
| `src/app/compliance/record/[record_type]/[record_id]/page.tsx` | **Created** | Record detail + comment thread + full NCR lifecycle panel (Classify, Dispatch, Evidence, Close) |
| `src/services/whatsapp-service.ts` | Modified | `sendNCRAlert()` public method + `sendMessage()` private helper added to `WhatsAppService` class |
| `src/components/layout/AppHeader.tsx` | Modified | `Bell` import, `clamflowAPI` import, `useState`/`useEffect` imports, notification bell with 60 s polling, unread badge, dropdown with mark-all-read |

---

## ─── CHANGELOG ───────────────────────────────────────────────────────────────
<a name="changelog"></a>

### 2026-07-25 — Pre-go-live fixes applied

| # | File | Change |
|---|---|---|
| P1 | `src/app/api/whatsapp/route.ts` (**new**) | Server-side Next.js Route Handler that proxies all Twilio WhatsApp calls. Reads `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` from server-side env — credentials never sent to the browser. |
| P1 | `src/services/whatsapp-service.ts` | Removed direct Twilio `fetch` calls from `sendWelcomeMessage` and `sendPasswordResetNotification`. All sending now goes through `sendMessage()` which calls `POST /api/whatsapp`. Removed `accountSid`, `authToken`, `whatsappNumber` class fields. |
| P2 | `src/components/layout/Sidebar.tsx` | Fixed 6 dead hrefs: `/washing`→`/lots`, `/depuration`→`/testing/depuration`, `/ppc`→`/ppc-forms/approve`, `/fp`→`/qc-forms/approve`, `/rfid`→`/devices`, `/inventory`→`/inventory/add`. Added EIA Compliance link (`/compliance`) for leads/admin roles. |
| P3 | `src/lib/clamflow-api.ts` | `approveWeightNote(noteId, qcStaffId?, qcNotes?)` now calls `PUT /api/weight-notes/{id}/approve` with `{ qc_staff_id, qc_notes }` body (was: `PUT /api/weight-notes/{id}` with no body). |
| P3 | `src/lib/api-client.ts` | Same fix applied to `approveWeightNote` and the `weightNotesAPI.approve` shorthand. |
| P4 | `src/components/dashboards/admin/UserManagementPanel.tsx` | Added `'EIA Officer'` to `roles[]` and `USERNAME_PREFIXES` (`'EIA'`). Made the "Username" field **editable** for new users (was disabled/auto-only) so admins can set a custom username such as `eia_alleppey`. Phone number field changed from `required` to optional (EIA Officers may not need WhatsApp). `createUser()` now uses the admin-provided username if non-empty, otherwise falls back to auto-generate. |
| P6 | `src/components/layout/AppHeader.tsx` | After each 60 s notification poll, any new unread `OVERDUE` or `BREACH` compliance notifications auto-fire `POST /api/whatsapp` (fire-and-forget). Recipient number comes from `NEXT_PUBLIC_NCR_ALERT_PHONE` env var. Deduplication via an in-memory `Set` (`alertedIds` ref) prevents duplicate alerts within the same session. |

### Vercel environment variables to add before go-live

| Variable | Scope | Notes |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Server-only | No `NEXT_PUBLIC_` prefix |
| `TWILIO_AUTH_TOKEN` | Server-only | No `NEXT_PUBLIC_` prefix |
| `TWILIO_WHATSAPP_NUMBER` | Server-only | Format: `whatsapp:+14155238886` |
| `NEXT_PUBLIC_TWILIO_ENABLED` | Client + Server | Set to `true` to enable sending |
| `NEXT_PUBLIC_NCR_ALERT_PHONE` | Client | WhatsApp recipient for OVERDUE/BREACH alerts (e.g. `+919876543210`) |

### How to create the `eia_alleppey` EIA Officer account

1. Log in as **Admin** or **Super Admin**.
2. Navigate to **Admin Dashboard → User Management**.
3. Click **Add New User**.
4. Select role **EIA Officer**.
5. Enter full name (e.g. `EIA Alleppey`). The username field will auto-fill but is now **editable** — clear it and type `eia_alleppey`.
6. Leave phone number blank if no WhatsApp is needed.
7. Click **Create User**. A temporary password will be auto-generated and shown.

