# main.py
from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from . import schemas, models, database
from .database import get_db, get_app

app = get_app()
models.Base.metadata.create_all(bind=database.engine)

# Role-based dependency injection
def get_current_user_role(x_user_role: Optional[str] = Header(None)):
    """Extract user role from request headers"""
    if not x_user_role:
        raise HTTPException(status_code=401, detail="User role not provided")
    return x_user_role

def require_role(allowed_roles: List[str]):
    """Decorator to enforce role-based access"""
    def role_dependency(user_role: str = Depends(get_current_user_role)):
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. Required roles: {allowed_roles}. Your role: {user_role}"
            )
        return user_role
    return role_dependency

# Weight Note Endpoints with Sequential Approval
@app.post("/form/weight-note", response_model=schemas.WeightNote)
def create_weight_note(
    form: schemas.WeightNoteCreate, 
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Production Staff"]))
):
    """Only Production Staff can submit Weight Notes"""
    weight_note = models.WeightNote(
        supplier_id=form.supplier_id,
        vehicle_number=form.vehicle_number,
        net_weight_kg=form.net_weight_kg,
        rm_station_staff_id=form.rm_staff_id,
        qc_staff_id=form.qc_staff_id,
        status="QC Pending"  # Sequential approval starts here
    )
    db.add(weight_note)
    db.commit()
    db.refresh(weight_note)
    return weight_note

@app.put("/form/weight-note/{form_id}/approve")
def approve_weight_note(
    form_id: str,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["QC Staff", "Production Lead"]))
):
    """Only QC Staff and Production Lead can approve Weight Notes"""
    weight_note = db.query(models.WeightNote).filter(models.WeightNote.id == form_id).first()
    if not weight_note:
        raise HTTPException(status_code=404, detail="Weight Note not found")
    
    if weight_note.status != "QC Pending":  # type: ignore
        raise HTTPException(status_code=400, detail="Weight Note is not pending QC approval")
    
    weight_note.status = "Approved"  # type: ignore
    db.commit()
    return {"message": "Weight Note approved successfully", "form_id": form_id}

@app.put("/form/weight-note/{form_id}/reject")
def reject_weight_note(
    form_id: str,
    remarks: str,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["QC Staff", "Production Lead"]))
):
    """Only QC Staff and Production Lead can reject Weight Notes"""
    weight_note = db.query(models.WeightNote).filter(models.WeightNote.id == form_id).first()
    if not weight_note:
        raise HTTPException(status_code=404, detail="Weight Note not found")
    
    if weight_note.status != "QC Pending":  # type: ignore
        raise HTTPException(status_code=400, detail="Weight Note is not pending QC approval")
    
    weight_note.status = "Rejected"  # type: ignore
    weight_note.remarks = remarks  # type: ignore
    db.commit()
    return {"message": "Weight Note rejected", "form_id": form_id, "remarks": remarks}

# PPC Form Endpoints with Sequential Approval
@app.post("/form/ppc", response_model=schemas.PPCForm)
def create_ppc_form(
    form: schemas.PPCFormCreate,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Production Staff"]))
):
    """Only Production Staff can submit PPC Forms"""
    ppc_form = models.PPCForm(
        lot_id=form.weight_note_id,  # Using weight_note_id as lot reference
        product_category=form.product_type,
        grade="Standard",  # Default grade
        weight_after_processing_kg=form.pack_size * form.estimated_bags,
        status="QC Pending"  # Sequential approval starts here
    )
    db.add(ppc_form)
    db.commit()
    db.refresh(ppc_form)
    return ppc_form

@app.put("/form/ppc/{form_id}/approve")
def approve_ppc_form(
    form_id: str,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["QC Staff", "Production Lead"]))
):
    """Only QC Staff and Production Lead can approve PPC Forms"""
    ppc_form = db.query(models.PPCForm).filter(models.PPCForm.id == form_id).first()
    if not ppc_form:
        raise HTTPException(status_code=404, detail="PPC Form not found")
    
    if ppc_form.status != "QC Pending":  # type: ignore
        raise HTTPException(status_code=400, detail="PPC Form is not pending QC approval")
    
    ppc_form.status = "Approved"  # type: ignore
    db.commit()
    return {"message": "PPC Form approved successfully", "form_id": form_id}

@app.put("/form/ppc/{form_id}/reject")
def reject_ppc_form(
    form_id: str,
    remarks: str,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["QC Staff", "Production Lead"]))
):
    """Only QC Staff and Production Lead can reject PPC Forms"""
    ppc_form = db.query(models.PPCForm).filter(models.PPCForm.id == form_id).first()
    if not ppc_form:
        raise HTTPException(status_code=404, detail="PPC Form not found")
    
    if ppc_form.status != "QC Pending":  # type: ignore
        raise HTTPException(status_code=400, detail="PPC Form is not pending QC approval")
    
    ppc_form.status = "Rejected"  # type: ignore
    ppc_form.remarks = remarks  # type: ignore
    db.commit()
    return {"message": "PPC Form rejected", "form_id": form_id, "remarks": remarks}

# FP Form Endpoints with Sequential Approval
@app.post("/form/fp", response_model=schemas.FPForm)
def create_fp_form(
    form: schemas.FPFormCreate,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Production Staff"]))
):
    """Only Production Staff can submit FP Forms"""
    fp_form = models.FPForm(
        ppc_form_id=form.ppc_form_id,
        fp_process=form.process,
        pack_size_kg=int(form.pack_size),
        final_weight_kg=form.pack_size * form.total_bags,
        status="QC Pending"  # Sequential approval starts here
    )
    db.add(fp_form)
    db.commit()
    db.refresh(fp_form)
    return fp_form

@app.put("/form/fp/{form_id}/approve")
def approve_fp_form(
    form_id: str,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["QC Staff", "Production Lead"]))
):
    """Only QC Staff and Production Lead can approve FP Forms"""
    fp_form = db.query(models.FPForm).filter(models.FPForm.id == form_id).first()
    if not fp_form:
        raise HTTPException(status_code=404, detail="FP Form not found")
    
    if fp_form.status != "QC Pending":  # type: ignore
        raise HTTPException(status_code=400, detail="FP Form is not pending QC approval")
    
    fp_form.status = "Approved"  # type: ignore
    db.commit()
    return {"message": "FP Form approved successfully", "form_id": form_id}

@app.put("/form/fp/{form_id}/reject")
def reject_fp_form(
    form_id: str,
    remarks: str,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["QC Staff", "Production Lead"]))
):
    """Only QC Staff and Production Lead can reject FP Forms"""
    fp_form = db.query(models.FPForm).filter(models.FPForm.id == form_id).first()
    if not fp_form:
        raise HTTPException(status_code=404, detail="FP Form not found")
    
    if fp_form.status != "QC Pending":  # type: ignore
        raise HTTPException(status_code=400, detail="FP Form is not pending QC approval")
    
    fp_form.status = "Rejected"  # type: ignore
    fp_form.remarks = remarks  # type: ignore
    db.commit()
    return {"message": "FP Form rejected", "form_id": form_id, "remarks": remarks}

# Production Lead Only Endpoints
@app.post("/lot/create")
def create_lot_from_weight_note(
    weight_note_id: str,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Production Lead"]))
):
    """Only Production Lead can create lots from approved Weight Notes"""
    weight_note = db.query(models.WeightNote).filter(models.WeightNote.id == weight_note_id).first()
    if not weight_note:
        raise HTTPException(status_code=404, detail="Weight Note not found")
    
    if weight_note.status != "Approved":  # type: ignore
        raise HTTPException(status_code=400, detail="Weight Note must be approved before creating lot")
    
    # Create lot logic here
    return {"message": "Lot created successfully", "weight_note_id": weight_note_id}

@app.post("/gatepass/generate")
def generate_gate_pass(
    ppc_form_id: str,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Production Lead"]))
):
    """Only Production Lead can generate gate passes from approved PPC Forms"""
    ppc_form = db.query(models.PPCForm).filter(models.PPCForm.id == ppc_form_id).first()
    if not ppc_form:
        raise HTTPException(status_code=404, detail="PPC Form not found")
    
    if ppc_form.status != "Approved":  # type: ignore
        raise HTTPException(status_code=400, detail="PPC Form must be approved before generating gate pass")
    
    # Generate gate pass logic here
    return {"message": "Gate pass generated successfully", "ppc_form_id": ppc_form_id}

@app.get("/inventory", response_model=List[schemas.FPForm])
def get_inventory(
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Production Lead", "QC Staff"]))
):
    """Only Production Lead and QC Staff can view inventory"""
    approved_fp_forms = db.query(models.FPForm).filter(models.FPForm.status == "Approved").all()
    return approved_fp_forms

# ONBOARDING ENDPOINTS - Staff Lead & Admin Only
@app.post("/onboarding/staff", response_model=schemas.PendingStaff)
def submit_staff_for_approval(
    staff_data: schemas.PendingStaffCreate,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Staff Lead", "Admin"]))
):
    """Staff Lead or Admin can submit new staff for approval"""
    pending_staff = models.PendingStaff(**staff_data.dict())
    db.add(pending_staff)
    db.commit()
    db.refresh(pending_staff)
    return pending_staff

@app.post("/onboarding/supplier", response_model=schemas.PendingSupplier)
def submit_supplier_for_approval(
    supplier_data: schemas.PendingSupplierCreate,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Staff Lead", "Admin"]))
):
    """Staff Lead or Admin can submit new supplier for approval"""
    pending_supplier = models.PendingSupplier(**supplier_data.dict())
    db.add(pending_supplier)
    db.commit()
    db.refresh(pending_supplier)
    return pending_supplier

@app.post("/onboarding/vendor", response_model=schemas.PendingVendor)
def submit_vendor_for_approval(
    vendor_data: schemas.PendingVendorCreate,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Staff Lead", "Admin"]))
):
    """Staff Lead or Admin can submit new vendor for approval"""
    pending_vendor = models.PendingVendor(**vendor_data.dict())
    db.add(pending_vendor)
    db.commit()
    db.refresh(pending_vendor)
    return pending_vendor

# Admin Approval Endpoints
@app.get("/onboarding/pending/staff", response_model=List[schemas.PendingStaff])
def get_pending_staff(
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Admin"]))
):
    """Admin can view all pending staff approvals"""
    return db.query(models.PendingStaff).filter(models.PendingStaff.status == "pending").all()

@app.get("/onboarding/pending/suppliers", response_model=List[schemas.PendingSupplier])
def get_pending_suppliers(
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Admin"]))
):
    """Admin can view all pending supplier approvals"""
    return db.query(models.PendingSupplier).filter(models.PendingSupplier.status == "pending").all()

@app.get("/onboarding/pending/vendors", response_model=List[schemas.PendingVendor])
def get_pending_vendors(
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Admin"]))
):
    """Admin can view all pending vendor approvals"""
    return db.query(models.PendingVendor).filter(models.PendingVendor.status == "pending").all()

@app.put("/onboarding/staff/{pending_id}/approve")
def approve_staff(
    pending_id: str,
    approval_data: schemas.EntityApprovalRequest,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Admin"]))
):
    """Admin can approve pending staff"""
    from datetime import datetime
    import uuid
    
    pending_staff = db.query(models.PendingStaff).filter(models.PendingStaff.id == pending_id).first()
    if not pending_staff:
        raise HTTPException(status_code=404, detail="Pending staff not found")
    
    if pending_staff.status != "pending":  # type: ignore
        raise HTTPException(status_code=400, detail="Staff already processed")
    
    # Create new staff record
    new_staff = models.Staff(
        full_name=pending_staff.full_name,  # type: ignore
        role=pending_staff.role,  # type: ignore
        station=pending_staff.station,  # type: ignore
        biometric_template=pending_staff.biometric_template,  # type: ignore
        updated_by=uuid.uuid4()  # Admin ID would come from auth system
    )
    db.add(new_staff)
    
    # Update pending record
    pending_staff.status = "approved"  # type: ignore
    pending_staff.admin_remarks = approval_data.admin_remarks  # type: ignore
    pending_staff.reviewed_at = datetime.utcnow()  # type: ignore
    pending_staff.reviewed_by = uuid.uuid4()  # Admin ID  # type: ignore
    
    db.commit()
    return {"message": "Staff approved successfully", "staff_id": str(new_staff.id)}

@app.put("/onboarding/supplier/{pending_id}/approve")
def approve_supplier(
    pending_id: str,
    approval_data: schemas.EntityApprovalRequest,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Admin"]))
):
    """Admin can approve pending supplier"""
    from datetime import datetime
    import uuid
    
    pending_supplier = db.query(models.PendingSupplier).filter(models.PendingSupplier.id == pending_id).first()
    if not pending_supplier:
        raise HTTPException(status_code=404, detail="Pending supplier not found")
    
    if pending_supplier.status != "pending":  # type: ignore
        raise HTTPException(status_code=400, detail="Supplier already processed")
    
    # Create new supplier record
    new_supplier = models.Supplier(
        full_name=pending_supplier.full_name,  # type: ignore
        type=pending_supplier.type,  # type: ignore
        contact_number=pending_supplier.contact_number,  # type: ignore
        aadhar_number=pending_supplier.aadhar_number,  # type: ignore
        gst_number=pending_supplier.gst_number,  # type: ignore
        pan_number=pending_supplier.pan_number,  # type: ignore
        bank_account_holder=pending_supplier.bank_account_holder,  # type: ignore
        bank_account_number=pending_supplier.bank_account_number,  # type: ignore
        bank_ifsc=pending_supplier.bank_ifsc,  # type: ignore
        bank_name=pending_supplier.bank_name,  # type: ignore
        added_by=uuid.uuid4()  # Admin ID
    )
    db.add(new_supplier)
    
    # Update pending record
    pending_supplier.status = "approved"  # type: ignore
    pending_supplier.admin_remarks = approval_data.admin_remarks  # type: ignore
    pending_supplier.reviewed_at = datetime.utcnow()  # type: ignore
    pending_supplier.reviewed_by = uuid.uuid4()  # Admin ID  # type: ignore
    
    db.commit()
    return {"message": "Supplier approved successfully", "supplier_id": str(new_supplier.id)}

@app.put("/onboarding/vendor/{pending_id}/approve")
def approve_vendor(
    pending_id: str,
    approval_data: schemas.EntityApprovalRequest,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Admin"]))
):
    """Admin can approve pending vendor"""
    from datetime import datetime
    import uuid
    
    pending_vendor = db.query(models.PendingVendor).filter(models.PendingVendor.id == pending_id).first()
    if not pending_vendor:
        raise HTTPException(status_code=404, detail="Pending vendor not found")
    
    if pending_vendor.status != "pending":  # type: ignore
        raise HTTPException(status_code=400, detail="Vendor already processed")
    
    # Create new vendor record
    new_vendor = models.Vendor(
        full_name=pending_vendor.full_name,  # type: ignore
        firm_name=pending_vendor.firm_name,  # type: ignore
        gst_number=pending_vendor.gst_number,  # type: ignore
        pan_number=pending_vendor.pan_number,  # type: ignore
        bank_account_holder=pending_vendor.bank_account_holder,  # type: ignore
        bank_account_number=pending_vendor.bank_account_number,  # type: ignore
        bank_ifsc=pending_vendor.bank_ifsc,  # type: ignore
        bank_name=pending_vendor.bank_name,  # type: ignore
        contact_number=pending_vendor.contact_number,  # type: ignore
        category=pending_vendor.category,  # type: ignore
        added_by=uuid.uuid4()  # Admin ID
    )
    db.add(new_vendor)
    
    # Update pending record
    pending_vendor.status = "approved"  # type: ignore
    pending_vendor.admin_remarks = approval_data.admin_remarks  # type: ignore
    pending_vendor.reviewed_at = datetime.utcnow()  # type: ignore
    pending_vendor.reviewed_by = uuid.uuid4()  # Admin ID  # type: ignore
    
    db.commit()
    return {"message": "Vendor approved successfully", "vendor_id": str(new_vendor.id)}

# Rejection Endpoints
@app.put("/onboarding/staff/{pending_id}/reject")
def reject_staff(
    pending_id: str,
    rejection_data: schemas.EntityRejectionRequest,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Admin"]))
):
    """Admin can reject pending staff with reason"""
    from datetime import datetime
    import uuid
    
    pending_staff = db.query(models.PendingStaff).filter(models.PendingStaff.id == pending_id).first()
    if not pending_staff:
        raise HTTPException(status_code=404, detail="Pending staff not found")
    
    if pending_staff.status != "pending":  # type: ignore
        raise HTTPException(status_code=400, detail="Staff already processed")
    
    pending_staff.status = "rejected"  # type: ignore
    pending_staff.admin_remarks = rejection_data.admin_remarks  # type: ignore
    pending_staff.reviewed_at = datetime.utcnow()  # type: ignore
    pending_staff.reviewed_by = uuid.uuid4()  # Admin ID  # type: ignore
    
    db.commit()
    return {"message": "Staff rejected", "reason": rejection_data.admin_remarks}

@app.put("/onboarding/supplier/{pending_id}/reject")
def reject_supplier(
    pending_id: str,
    rejection_data: schemas.EntityRejectionRequest,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Admin"]))
):
    """Admin can reject pending supplier with reason"""
    from datetime import datetime
    import uuid
    
    pending_supplier = db.query(models.PendingSupplier).filter(models.PendingSupplier.id == pending_id).first()
    if not pending_supplier:
        raise HTTPException(status_code=404, detail="Pending supplier not found")
    
    if pending_supplier.status != "pending":  # type: ignore
        raise HTTPException(status_code=400, detail="Supplier already processed")
    
    pending_supplier.status = "rejected"  # type: ignore
    pending_supplier.admin_remarks = rejection_data.admin_remarks  # type: ignore
    pending_supplier.reviewed_at = datetime.utcnow()  # type: ignore
    pending_supplier.reviewed_by = uuid.uuid4()  # Admin ID  # type: ignore
    
    db.commit()
    return {"message": "Supplier rejected", "reason": rejection_data.admin_remarks}

@app.put("/onboarding/vendor/{pending_id}/reject")
def reject_vendor(
    pending_id: str,
    rejection_data: schemas.EntityRejectionRequest,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Admin"]))
):
    """Admin can reject pending vendor with reason"""
    from datetime import datetime
    import uuid
    
    pending_vendor = db.query(models.PendingVendor).filter(models.PendingVendor.id == pending_id).first()
    if not pending_vendor:
        raise HTTPException(status_code=404, detail="Pending vendor not found")
    
    if pending_vendor.status != "pending":  # type: ignore
        raise HTTPException(status_code=400, detail="Vendor already processed")
    
    pending_vendor.status = "rejected"  # type: ignore
    pending_vendor.admin_remarks = rejection_data.admin_remarks  # type: ignore
    pending_vendor.reviewed_at = datetime.utcnow()  # type: ignore
    pending_vendor.reviewed_by = uuid.uuid4()  # Admin ID  # type: ignore
    
    db.commit()
    return {"message": "Vendor rejected", "reason": rejection_data.admin_remarks}

# ADMIN DIRECT CREATION ENDPOINTS (Skip approval process)
@app.post("/admin/create/staff", response_model=schemas.Staff)
def admin_create_staff_directly(
    staff_data: schemas.StaffCreate,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Admin"]))
):
    """Admin can create staff directly without approval process"""
    import uuid
    
    new_staff = models.Staff(
        full_name=staff_data.full_name,
        role=staff_data.role,
        station=staff_data.station,
        biometric_template=staff_data.biometric_template,
        updated_by=uuid.uuid4()  # Admin ID
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff

@app.post("/admin/create/supplier", response_model=schemas.Supplier)
def admin_create_supplier_directly(
    supplier_data: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Admin"]))
):
    """Admin can create supplier directly without approval process"""
    import uuid
    
    new_supplier = models.Supplier(
        full_name=supplier_data.full_name,
        type=supplier_data.type,
        address=supplier_data.address,
        contact_number=supplier_data.contact_number,
        aadhar_number=supplier_data.aadhar_number,
        gst_number=supplier_data.gst_number,
        pan_number=supplier_data.pan_number,
        bank_account_holder=supplier_data.bank_account_holder,
        bank_account_number=supplier_data.bank_account_number,
        bank_ifsc=supplier_data.bank_ifsc,
        bank_name=supplier_data.bank_name,
        added_by=uuid.uuid4()  # Admin ID
    )
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    return new_supplier

@app.post("/admin/create/vendor", response_model=schemas.Vendor)
def admin_create_vendor_directly(
    vendor_data: schemas.VendorCreate,
    db: Session = Depends(get_db),
    user_role: str = Depends(require_role(["Admin"]))
):
    """Admin can create vendor directly without approval process"""
    import uuid
    
    new_vendor = models.Vendor(
        full_name=vendor_data.full_name,
        firm_name=vendor_data.firm_name,
        gst_number=vendor_data.gst_number,
        pan_number=vendor_data.pan_number,
        bank_account_holder=vendor_data.bank_account_holder,
        bank_account_number=vendor_data.bank_account_number,
        bank_ifsc=vendor_data.bank_ifsc,
        bank_name=vendor_data.bank_name,
        contact_number=vendor_data.contact_number,
        category=vendor_data.category,
        added_by=uuid.uuid4()  # Admin ID
    )
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor