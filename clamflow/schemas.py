# schemas.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class StaffBase(BaseModel):
    full_name: str
    role: str
    station: Optional[str] = None

class StaffCreate(StaffBase):
    biometric_template: Optional[str] = None

class Staff(StaffBase):
    id: uuid.UUID
    created_at: datetime
    status: str

    class Config:
        orm_mode = True

class SupplierBase(BaseModel):
    full_name: str
    type: str
    address: Optional[str] = None
    contact_number: Optional[str] = None
    aadhar_number: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None

class SupplierCreate(SupplierBase):
    bank_account_holder: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None

class Supplier(SupplierBase):
    id: uuid.UUID
    created_at: datetime
    status: str

    class Config:
        orm_mode = True

class WeightNoteBase(BaseModel):
    supplier_id: uuid.UUID
    vehicle_number: str
    net_weight_kg: float

class WeightNoteCreate(WeightNoteBase):
    rm_staff_id: uuid.UUID
    qc_staff_id: uuid.UUID

class WeightNote(WeightNoteBase):
    id: uuid.UUID
    qc_approved: bool
    qc_remarks: Optional[str] = None
    qc_approved_at: Optional[datetime] = None
    submitted_at: datetime
    status: str
    lot_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        orm_mode = True

class LotBase(BaseModel):
    lot_id: str
    weight_note_ids: List[uuid.UUID]

class LotCreate(LotBase):
    pass

class Lot(LotBase):
    id: uuid.UUID
    created_at: datetime
    created_by: uuid.UUID

    class Config:
        orm_mode = True

class PPCFormBase(BaseModel):
    lot_id: uuid.UUID
    product_category: str
    grade: str
    weight_after_processing_kg: float

class PPCFormCreate(PPCFormBase):
    weight_note_id: uuid.UUID
    product_type: str
    pack_size: float
    estimated_bags: int

class PPCForm(PPCFormBase):
    id: uuid.UUID
    qc_approved: bool
    qc_approved_at: Optional[datetime] = None
    supervisor_approved: bool
    supervisor_approved_at: Optional[datetime] = None
    submitted_at: datetime
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

class FPFormBase(BaseModel):
    ppc_form_id: uuid.UUID
    fp_process: str
    pack_size_kg: int
    final_weight_kg: float

class FPFormCreate(FPFormBase):
    process: str
    pack_size: float
    total_bags: int

class FPForm(FPFormBase):
    id: uuid.UUID
    qc_approved: bool
    qc_approved_at: Optional[datetime] = None
    supervisor_approved: bool
    supervisor_approved_at: Optional[datetime] = None
    submitted_at: datetime
    status: str
    inventory_ready: bool
    created_at: datetime

    class Config:
        orm_mode = True

class QCStepBase(BaseModel):
    lot_id: uuid.UUID
    step_number: int
    step_name: str
    passed: Optional[bool] = None
    remarks: Optional[str] = None

class QCStepCreate(QCStepBase):
    approved_by: uuid.UUID
    qc_biometric_token: str

class QCStep(QCStepBase):
    id: uuid.UUID
    approved_by: uuid.UUID
    approved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True

class QCDocumentBase(BaseModel):
    lot_id: uuid.UUID
    document_type: str
    file_path: str

class QCDocumentCreate(QCDocumentBase):
    uploaded_by: uuid.UUID
    qc_biometric_token: str

class QCDocument(QCDocumentBase):
    id: uuid.UUID
    uploaded_by: uuid.UUID
    uploaded_at: datetime
    verified: bool

    class Config:
        orm_mode = True

class RosterAssignmentBase(BaseModel):
    date: str
    shift_start: str
    shift_end: str
    station: str
    staff_id: uuid.UUID
    role: str

class RosterAssignmentCreate(RosterAssignmentBase):
    assigned_by: uuid.UUID

class RosterAssignment(RosterAssignmentBase):
    id: uuid.UUID
    assigned_by: uuid.UUID
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

class ConfigSettingBase(BaseModel):
    setting_type: str
    setting_key: Optional[str] = None
    setting_value: Optional[Dict[Any, Any]] = None

class ConfigSettingCreate(ConfigSettingBase):
    biometric_auth: str

class ConfigSetting(ConfigSettingBase):
    id: uuid.UUID
    version: int
    created_at: datetime
    updated_by: uuid.UUID
    status: str

    class Config:
        orm_mode = True

# ONBOARDING SCHEMAS - for approval workflow
class PendingStaffBase(BaseModel):
    full_name: str
    role: str
    station: Optional[str] = None
    contact_number: Optional[str] = None
    biometric_template: Optional[str] = None

class PendingStaffCreate(PendingStaffBase):
    submitted_by: uuid.UUID

class PendingStaff(PendingStaffBase):
    id: uuid.UUID
    submitted_by: uuid.UUID
    submitted_at: datetime
    status: str
    admin_remarks: Optional[str] = None
    reviewed_by: Optional[uuid.UUID] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class PendingSupplierBase(BaseModel):
    full_name: str
    type: str
    boat_reg_id: Optional[str] = None
    aadhar_number: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    bank_account_holder: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    contact_number: Optional[str] = None
    biometric_template: Optional[str] = None
    location_gps: Optional[str] = None

class PendingSupplierCreate(PendingSupplierBase):
    submitted_by: uuid.UUID

class PendingSupplier(PendingSupplierBase):
    id: uuid.UUID
    submitted_by: uuid.UUID
    submitted_at: datetime
    status: str
    admin_remarks: Optional[str] = None
    reviewed_by: Optional[uuid.UUID] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class PendingVendorBase(BaseModel):
    full_name: str
    firm_name: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    bank_account_holder: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    contact_number: Optional[str] = None
    category: Optional[str] = None

class PendingVendorCreate(PendingVendorBase):
    submitted_by: uuid.UUID

class PendingVendor(PendingVendorBase):
    id: uuid.UUID
    submitted_by: uuid.UUID
    submitted_at: datetime
    status: str
    admin_remarks: Optional[str] = None
    reviewed_by: Optional[uuid.UUID] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class VendorBase(BaseModel):
    full_name: str
    firm_name: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    bank_account_holder: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    contact_number: Optional[str] = None
    category: Optional[str] = None

class VendorCreate(VendorBase):
    added_by: uuid.UUID

class Vendor(VendorBase):
    id: uuid.UUID
    created_at: datetime
    added_by: uuid.UUID
    status: str

    class Config:
        orm_mode = True

# Approval/Rejection schemas
class EntityApprovalRequest(BaseModel):
    admin_remarks: Optional[str] = None

class EntityRejectionRequest(BaseModel):
    admin_remarks: str