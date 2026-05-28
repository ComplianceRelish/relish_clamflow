# ClamFlow — Backend & Frontend Fixes Required

> Analysis based on: `api/onboarding/routes.py`, `models.py`, `utils/aws_rekognition.py`,
> `utils/mobile_scan_session.py`, `api/onboarding/schemas.py`, `src/lib/clamflow-api.ts`,
> `src/lib/aadhaar-qr.ts`, `src/app/mobile-scan/[token]/page.tsx`,
> `src/components/dashboards/admin/ApprovalWorkflowPanel.tsx`

---

## Status Summary

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 1 | 🔴 Fatal | `models.py` / `routes.py` | `OnboardingPending` model columns don't match route usage — every submission crashes |
| 2 | 🔴 Fatal | `routes.py` L144 | `uuid.uuid4()` references an aliased import — `NameError` on every approval |
| 3 | 🔴 Breaking | `routes.py` `/complete/{id}` | `aadhaar_qr_text` not declared as `Form()` — always `None` despite being sent |
| 4 | 🔴 Breaking | `routes.py` imports | `Form` not imported from `fastapi` — compile-time error once fix #3 is applied |
| 5 | 🔴 Breaking | `routes.py` Aadhaar endpoints | Returns `"parsed"` key; frontend expects `"parsed_result"` → always `undefined` |
| 6 | 🔴 Breaking | `routes.py` Aadhaar parse output | Returns `last4_uid`; frontend `AadhaarParsedResult` expects `uid` |
| 7 | 🔴 Breaking | `mobile-scan/[token]/page.tsx` | **FIXED** ✅ Frontend sent `qr_text`; backend requires `qr_data` — caused 422 on every mobile submission |
| 8 | 🟡 Silent | `clamflow-api.ts` `approveOnboarding()` | Sends no body; route requires `status` (non-optional) — silent 422 |
| 9 | 🟡 Arch gap | `ApprovalWorkflowPanel.tsx` | Admin approval never calls `completeOnboarding()` → AWS Rekognition never triggered |
| 10 | ✅ Verified OK | `routes.py` `/scan-aadhaar-image` | Accepts **any** multipart field name — `aadhaar_image` from frontend is fine |
| 11 | ✅ Verified OK | `mobile_scan_session.py` `.to_status_dict()` | Returns `parsed_result` → camelCase transform → `parsedResult` — matches frontend interface |
| 12 | ✅ Verified OK | `utils/aws_rekognition.py` | All functions fully implemented and production-ready |
| 13 | ✅ Verified OK | `models.py` `UserProfile` | Has `rekognition_face_id` and `face_registered_at` columns |

---

## Bug 1 — `OnboardingPending` Model/Route Schema Mismatch (Fatal — Backend)

**`models.py` has:**
```python
class OnboardingPending(Base):
    person_id       = Column(PG_UUID, ForeignKey(...), nullable=False)  # required
    staff_id        = Column(String(100), nullable=False)               # required
    onboarding_type = Column(String(50), nullable=False)                # required
    face_image_path, face_embedding, system_account_created, rfid_assigned ...
    initiated_at, completed_at, failed_at
```

**`routes.py` creates and reads:**
```python
new_request = OnboardingPending(
    entity_type=request.entity_type,   # ← Column does not exist
    data=request.data,                 # ← Column does not exist
    submitted_by=current_user["id"]    # ← Column does not exist
)
# Also accesses:
request.reviewed_by     # ← Column does not exist
request.reviewed_at     # ← Column does not exist
request.remarks         # ← Column does not exist
request.approval_checklist  # ← Column does not exist
```

Every `POST /api/onboarding/` and `PUT /api/onboarding/{id}/approve` will raise
`AttributeError` or `sqlalchemy.exc.InvalidRequestError`.

**Fix — replace `OnboardingPending` in `models.py`:**

```python
class OnboardingPending(Base):
    __tablename__ = "onboarding_pending"
    __table_args__ = {'extend_existing': True}

    id                 = Column(PG_UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    entity_type        = Column(String(20), nullable=False)   # 'staff', 'supplier', 'vendor'
    data               = Column(JSONB, nullable=False)
    status             = Column(String(30), default="pending") # pending, approved, rejected
    submitted_by       = Column(PG_UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=False)
    submitted_at       = Column(DateTime, default=datetime.utcnow)
    reviewed_by        = Column(PG_UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=True)
    reviewed_at        = Column(DateTime, nullable=True)
    remarks            = Column(Text, nullable=True)
    approval_checklist = Column(JSONB, nullable=True)
    created_at         = Column(DateTime, default=datetime.utcnow)
    updated_at         = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

> **Action required:** Drop and recreate the `onboarding_pending` table via an Alembic migration.

---

## Bug 2 — `uuid` NameError on Every Approval (Fatal — Backend)

**`routes.py` top:**
```python
import uuid as uuid_module   # aliased away
```

**`routes.py` inside `approve_onboarding_request`:**
```python
user_profile = UserProfile(
    id=uuid.uuid4(),   # ← NameError: name 'uuid' is not defined
    ...
)
```

**Fix (pick one):**
```python
# Option A — restore the standard import:
import uuid

# Option B — use the alias:
id=uuid_module.uuid4(),
```

---

## Bug 3 — `aadhaar_qr_text` Never Read from Multipart Form (Breaking — Backend)

**`routes.py` `complete_onboarding` signature:**
```python
def complete_onboarding(
    person_record_id: UUID,
    face_image:       Optional[UploadFile] = File(None),
    aadhaar_image:    Optional[UploadFile] = File(None),
    aadhaar_qr_text:  Optional[str] = None,   # ← treated as query param, not form field
```

In FastAPI, once any parameter uses `UploadFile` / `File()`, all other fields in the
same endpoint must be declared as `Form(...)` to be read from the multipart body.
Without it, `aadhaar_qr_text` is always `None`.

**Fix:**
```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, ...

def complete_onboarding(
    person_record_id: UUID,
    face_image:      Optional[UploadFile] = File(None),
    aadhaar_image:   Optional[UploadFile] = File(None),
    aadhaar_qr_text: Optional[str]        = Form(None),   # ← add Form()
```

`Form` also needs to be added to the `fastapi` import (Bug 4 — same line).

---

## Bug 5 — Aadhaar Endpoints Return Wrong Key `"parsed"` (Breaking — Backend)

**All three Aadhaar endpoints** (`scan-aadhaar-image`, `parse-aadhaar-qr`, `verify-aadhaar`)
return:
```json
{ "success": true, "parsed": { "name": "...", ... } }
```

After `transformKeysToCamel()` on the frontend, `"parsed"` stays `"parsed"` (single word —
no underscore, no change). The frontend `ScanAadhaarImageResponse` interface expects
`parsedResult`, which is never populated. Every Aadhaar image scan shows as failed
even when the backend succeeds.

**Fix — rename the key to `parsed_result` in all three endpoints:**

```python
# scan-aadhaar-image
return {
    "success": True,
    "qr_data": qr_data,
    "parsed_result": parsed,       # ← was "parsed"
    "message": "Aadhaar QR extracted from image successfully"
}

# parse-aadhaar-qr
return {
    "success": True,
    "parsed_result": result,       # ← was "parsed"
    "message": "..."
}

# verify-aadhaar / verify_and_save_aadhaar
return {
    "success": True,
    "parsed_result": parsed,       # ← was "parsed"
    ...
}
```

`"parsed_result"` → `transformKeysToCamel()` → `"parsedResult"` ✅

---

## Bug 6 — Parsed Aadhaar Dict Has `last4_uid`, Frontend Expects `uid` (Breaking — Backend)

`parse_aadhaar_qr()` returns `last4_uid` (last 4 digits of UID).
The frontend interface `AadhaarParsedResult` expects `uid`.
Additionally, `rawText` is expected by the frontend but is not present in the parsed dict.

**Fix — add a mapping helper used by all three Aadhaar endpoints in `routes.py`:**

```python
def _to_aadhaar_result(parsed: dict, raw_qr: str) -> dict:
    """Map parse_aadhaar_qr() output to the AadhaarParsedResult contract."""
    return {
        "uid":      parsed.get("last4_uid"),   # frontend expects "uid"
        "name":     parsed.get("name"),
        "dob":      parsed.get("dob"),
        "gender":   parsed.get("gender"),
        "address":  parsed.get("address"),
        "pincode":  parsed.get("pincode"),
        "state":    parsed.get("state"),
        "district": parsed.get("district"),
        "raw_text": raw_qr,                    # camelCase → rawText on frontend
    }
```

Use it in every endpoint:
```python
return {
    "success": True,
    "parsed_result": _to_aadhaar_result(parsed, qr_data),
    "message": "..."
}
```

Also apply when storing `parsed_result` on the mobile scan session object in
`mobile_scan_session.py` so that `to_status_dict()` returns the mapped structure.

---

## Bug 7 — `qr_text` vs `qr_data` Field Name ✅ FIXED (Frontend)

**Was in `src/app/mobile-scan/[token]/page.tsx`:**
```typescript
body: JSON.stringify({ qr_text: rawText }),   // ← caused 422 on every mobile submission
```

**Fixed to:**
```typescript
body: JSON.stringify({ qr_data: rawText }),   // ← matches MobileScanSubmitRequest.qr_data
```

---

## Bug 8 — `approveOnboarding()` Sends No Body (Silent 422 — Frontend)

**`src/lib/clamflow-api.ts`:**
```typescript
async approveOnboarding(id: string) {
    return this.put(`/api/onboarding/${id}/approve`);   // ← no body
}
```

**`routes.py` `approve_onboarding_request`:**
```python
def approve_onboarding_request(
    request_id: UUID,
    update: OnboardingUpdate,   # ← required Pydantic body; status: str has no default
    ...
):
```

Pydantic will reject an empty body with `422 Unprocessable Entity`.

**Fix:**
```typescript
async approveOnboarding(id: string, remarks?: string) {
    return this.put(`/api/onboarding/${id}/approve`, {
        status: 'approved',
        remarks: remarks ?? ''
    });
}
```

---

## Bug 9 — AWS Rekognition Never Triggered After Admin Approval (Architecture Gap — Frontend + Backend)

### What exists and works

- `utils/aws_rekognition.py` — `detect_faces()`, `index_face()`, `search_face()`, `identify_person()`, `delete_face()` are all fully implemented ✅
- `POST /api/onboarding/complete/{person_record_id}` in `routes.py` — correctly calls `detect_faces` (quality check) then `index_face`, then saves `rekognition_face_id` + `face_registered_at` to `UserProfile` ✅
- `clamflowAPI.completeOnboarding()` in `clamflow-api.ts` — correct multipart implementation, field names match backend ✅
- `UserProfile` model has `rekognition_face_id` and `face_registered_at` columns ✅

### What is missing

`ApprovalWorkflowPanel.tsx` `handleApprove()` calls `approveForm()` which routes to the
**generic** `/api/approval/{id}/approve` endpoint — not the onboarding-specific endpoint.
`completeOnboarding()` is never called from any component after approval.
Staff face photos are stored in `OnboardingPending.data` (JSONB) during submission but
are never passed to the Rekognition `index_face` call.

### Fix — call `completeOnboarding()` after a successful `approveOnboarding()`:

```typescript
const approvalRes = await clamflowAPI.approveOnboarding(onboardingId, remarks);

if (approvalRes.success && approvalRes.data?.person_record_id) {
    // Reconstruct face image File from the stored base64 in the onboarding record
    const faceBase64 = (onboardingRecord.data as any).face_image;
    if (faceBase64) {
        const byteArray = Uint8Array.from(
            atob(faceBase64.split(',')[1]),
            c => c.charCodeAt(0)
        );
        const faceFile = new File(
            [new Blob([byteArray], { type: 'image/jpeg' })],
            'face.jpg',
            { type: 'image/jpeg' }
        );
        await clamflowAPI.completeOnboarding(
            approvalRes.data.person_record_id,
            faceFile,
            undefined,
            (onboardingRecord.data as any).aadhaar_qr_text ?? undefined
        );
    }
}
```

Also add `'staff_onboarding'` to the `ApprovalItem.form_type` union so pending onboarding
requests are visible in the admin panel:
```typescript
form_type: 'weight_note' | 'ppc_form' | 'fp_form' | 'qc_form' | 'depuration_form' | 'staff_onboarding';
```

---

## Verified Correct ✅

| Item | Detail |
|------|--------|
| `scan-aadhaar-image` field name | Backend iterates all form fields; `aadhaar_image` key from frontend is accepted |
| `to_status_dict()` key mapping | Returns `parsed_result` → `transformKeysToCamel()` → `parsedResult` — matches `MobileScanResultResponse` |
| `preprocessImageForUpload()` EXIF | Handled client-side only; backend doesn't need change |
| `aws_rekognition.py` all functions | Fully implemented, production-ready; no changes needed |
| `complete_onboarding` Aadhaar + face logic | Best-effort partial success handled cleanly |
| `UserProfile` Rekognition columns | `rekognition_face_id` + `face_registered_at` already in `models.py` |
| Mobile scan session / QR generation | Returns both `session_token` and `token`; frontend handles both ✅ |
| `html5-qrcode` TypeScript errors | **FIXED** ✅ `formatsToSupport` moved to constructor; `clear()` return type corrected; `scanFile` called as instance method |

---

## Recommended Fix Order

| Priority | File | Action | Status |
|----------|------|--------|--------|
| 1 | `models.py` | Replace `OnboardingPending` class with correct columns | ✅ Done — commit `cc2e5e0` |
| 2 | Alembic / Supabase | Generate + run migration to recreate `onboarding_pending` table | ✅ Done — SQL run in Supabase dashboard; migration file `b2c3d4e5f6a7` committed |
| 3 | `routes.py` imports | Fix `import uuid` alias + add `Form` to fastapi imports | ✅ Done — commit `cc2e5e0` |
| 4 | `routes.py` `/complete` | Change `= None` → `= Form(None)` for `aadhaar_qr_text` | ✅ Done — commit `cc2e5e0` |
| 5 | `routes.py` all Aadhaar endpoints | Add `_to_aadhaar_result()` helper; rename `"parsed"` → `"parsed_result"` | ✅ Done — commit `cc2e5e0` |
| 6 | `clamflow-api.ts` | Add body `{ status: 'approved', remarks }` to `approveOnboarding()` | ✅ Done — `remarks?` param + body added |
| 7 | `ApprovalWorkflowPanel.tsx` | Add `staff_onboarding` to `form_type` union + call `completeOnboarding()` after approval | ✅ Done — `data?` field on `ApprovalItem`; `handleApprove` branches on `staff_onboarding` |

---

## Backend Changes Made (commit `cc2e5e0` — 2026-05-28)

### `models.py`
- Replaced `OnboardingPending` model — old columns (`person_id`, `staff_id`, `onboarding_type`, `face_image_path`, `face_embedding`, `system_account_created`, `rfid_assigned`, `notes`, `initiated_at`, `completed_at`, `failed_at`, `failure_reason`, `assigned_to`, `processed_by`) removed
- New columns: `entity_type`, `data` (JSONB), `status`, `submitted_by` (FK → `user_profiles`), `submitted_at`, `reviewed_by` (FK → `user_profiles`), `reviewed_at`, `remarks`, `approval_checklist` (JSONB), `created_at`, `updated_at`
- DB table recreated via SQL in Supabase dashboard (migration `b2c3d4e5f6a7`)

### `api/onboarding/routes.py`
- **Bug 2** fixed: `uuid.uuid4()` → `uuid_module.uuid4()` (import was aliased; was causing `NameError` on every approval)
- **Bug 3+4** fixed: `aadhaar_qr_text` parameter changed from `= None` to `= Form(None)`; `Form` added to `fastapi` import line
- **Bug 5+6** fixed: Added `_to_aadhaar_result(parsed, raw_qr)` helper that maps `last4_uid` → `uid` and injects `raw_text`. All four Aadhaar endpoints (`scan-aadhaar-image`, `parse-aadhaar-qr`, `verify-aadhaar`, `mobile-scan/{token}/submit`) now return `"parsed_result"` instead of `"parsed"` → camelCase transform produces `parsedResult` as the frontend `ScanAadhaarImageResponse` interface expects

---

## Frontend TODO (open `clamflow-frontend` folder)

> All frontend fixes are now complete. See commit history for details.

### Bug 8 — ✅ FIXED `src/lib/clamflow-api.ts`
**File:** `src/lib/clamflow-api.ts`
**Function:** `approveOnboarding()`

```typescript
// CURRENT (broken — sends no body → 422)
async approveOnboarding(id: string) {
    return this.put(`/api/onboarding/${id}/approve`);
}

// FIX
async approveOnboarding(id: string, remarks?: string) {
    return this.put(`/api/onboarding/${id}/approve`, {
        status: 'approved',
        remarks: remarks ?? ''
    });
}
```

### Bug 9 — ✅ FIXED `src/components/dashboards/admin/ApprovalWorkflowPanel.tsx`
**File:** `src/components/dashboards/admin/ApprovalWorkflowPanel.tsx`

Two changes needed:
1. Add `'staff_onboarding'` to the `form_type` union so pending onboarding requests appear in the admin panel:
```typescript
form_type: 'weight_note' | 'ppc_form' | 'fp_form' | 'qc_form' | 'depuration_form' | 'staff_onboarding';
```

2. After `approveOnboarding()` succeeds, call `completeOnboarding()` to trigger AWS Rekognition face indexing:
```typescript
const approvalRes = await clamflowAPI.approveOnboarding(onboardingId, remarks);

if (approvalRes.success && approvalRes.data?.person_record_id) {
    const faceBase64 = (onboardingRecord.data as any).face_image;
    if (faceBase64) {
        const byteArray = Uint8Array.from(
            atob(faceBase64.split(',')[1]),
            c => c.charCodeAt(0)
        );
        const faceFile = new File(
            [new Blob([byteArray], { type: 'image/jpeg' })],
            'face.jpg',
            { type: 'image/jpeg' }
        );
        await clamflowAPI.completeOnboarding(
            approvalRes.data.person_record_id,
            faceFile,
            undefined,
            (onboardingRecord.data as any).aadhaar_qr_text ?? undefined
        );
    }
}
```
