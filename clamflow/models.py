# models.py
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from .database import Base

class Staff(Base):
    __tablename__ = "staff"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    station = Column(String)
    biometric_template = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    status = Column(String, default="active")

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    address = Column(Text)
    contact_number = Column(String)
    aadhar_number = Column(String)
    gst_number = Column(String)
    pan_number = Column(String)
    bank_account_holder = Column(String)
    bank_account_number = Column(String)
    bank_ifsc = Column(String)
    bank_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    added_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    status = Column(String, default="active")

class WeightNote(Base):
    __tablename__ = "weight_notes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"))
    vehicle_number = Column(String)
    net_weight_kg = Column(Float)
    rm_station_staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    qc_staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    qc_approved = Column(Boolean, default=False)
    qc_remarks = Column(Text)
    qc_approved_at = Column(DateTime)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="QC Pending")  # Sequential approval status
    remarks = Column(Text)  # For rejection remarks
    lot_id = Column(UUID(as_uuid=True), ForeignKey("lots.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class Lot(Base):
    __tablename__ = "lots"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lot_id = Column(String, unique=True, nullable=False)
    weight_note_ids = Column(JSON)  # Changed from ARRAY to JSON for SQLite compatibility
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))

class PPCForm(Base):
    __tablename__ = "ppc_forms"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lot_id = Column(UUID(as_uuid=True), ForeignKey("lots.id"))
    product_category = Column(String)
    grade = Column(String)
    weight_after_processing_kg = Column(Float)
    crate_rfid_tags = Column(JSON)  # Changed from ARRAY to JSON for SQLite compatibility
    ppc_station_staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    qc_staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    qc_approved = Column(Boolean, default=False)
    qc_approved_at = Column(DateTime)
    supervisor_approved = Column(Boolean, default=False)
    supervisor_approved_at = Column(DateTime)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="QC Pending")  # Sequential approval status
    remarks = Column(Text)  # For rejection remarks
    created_at = Column(DateTime, default=datetime.utcnow)

class FPForm(Base):
    __tablename__ = "fp_forms"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ppc_form_id = Column(UUID(as_uuid=True), ForeignKey("ppc_forms.id"))
    fp_process = Column(String)
    pack_size_kg = Column(Integer)
    final_weight_kg = Column(Float)
    tray_rfid_tags = Column(JSON)  # Changed from ARRAY to JSON for SQLite compatibility
    fp_station_staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    qc_staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    qc_approved = Column(Boolean, default=False)
    qc_approved_at = Column(DateTime)
    supervisor_approved = Column(Boolean, default=False)
    supervisor_approved_at = Column(DateTime)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="QC Pending")  # Sequential approval status
    remarks = Column(Text)  # For rejection remarks
    inventory_ready = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class QCStep(Base):
    __tablename__ = "qc_steps"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lot_id = Column(UUID(as_uuid=True))
    step_number = Column(Integer, nullable=False)
    step_name = Column(String, nullable=False)
    passed = Column(Boolean)
    remarks = Column(Text)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    approved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint('lot_id', 'step_number'),)

class QCDocument(Base):
    __tablename__ = "qc_documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lot_id = Column(UUID(as_uuid=True))
    document_type = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    verified = Column(Boolean, default=False)

class RosterAssignment(Base):
    __tablename__ = "roster_assignments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(String, nullable=False)
    shift_start = Column(String, nullable=False)
    shift_end = Column(String, nullable=False)
    station = Column(String, nullable=False)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"), nullable=False)
    role = Column(String, nullable=False)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    status = Column(String, default="confirmed")
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint('date', 'station'),)

class ConfigSetting(Base):
    __tablename__ = "config_settings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    setting_type = Column(String, nullable=False)
    setting_key = Column(String)
    setting_value = Column(JSON)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    status = Column(String, default="active")
    biometric_auth = Column(String, nullable=False)
    __table_args__ = (UniqueConstraint('setting_type', 'setting_key', 'version'),)

# ONBOARDING TABLES - for approval workflow
class PendingStaff(Base):
    __tablename__ = "pending_staff"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    station = Column(String)
    contact_number = Column(String)
    biometric_template = Column(Text)  # Base64 encoded biometric data
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")  # pending, approved, rejected
    admin_remarks = Column(Text)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    reviewed_at = Column(DateTime)

class PendingSupplier(Base):
    __tablename__ = "pending_suppliers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # Boat Owner, Fishermen, etc
    boat_reg_id = Column(String)
    aadhar_number = Column(String)
    gst_number = Column(String)
    pan_number = Column(String)
    bank_account_holder = Column(String)
    bank_account_number = Column(String)
    bank_ifsc = Column(String)
    bank_name = Column(String)
    contact_number = Column(String)
    biometric_template = Column(Text)  # Base64 encoded biometric data
    location_gps = Column(String)  # GPS coordinates where onboarded
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")  # pending, approved, rejected
    admin_remarks = Column(Text)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    reviewed_at = Column(DateTime)

class PendingVendor(Base):
    __tablename__ = "pending_vendors"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    firm_name = Column(String)
    gst_number = Column(String)
    pan_number = Column(String)
    bank_account_holder = Column(String)
    bank_account_number = Column(String)
    bank_ifsc = Column(String)
    bank_name = Column(String)
    contact_number = Column(String)
    category = Column(String)  # Service category
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")  # pending, approved, rejected
    admin_remarks = Column(Text)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    reviewed_at = Column(DateTime)

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    firm_name = Column(String)
    gst_number = Column(String)
    pan_number = Column(String)
    bank_account_holder = Column(String)
    bank_account_number = Column(String)
    bank_ifsc = Column(String)
    bank_name = Column(String)
    contact_number = Column(String)
    category = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    added_by = Column(UUID(as_uuid=True), ForeignKey("staff.id"))
    status = Column(String, default="active")