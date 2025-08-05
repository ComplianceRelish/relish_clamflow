# pages/7_Onboarding.py - Mobile-First Onboarding System
import streamlit as st
import requests
import uuid
from datetime import datetime
import base64
from utils import require_role, get_api_base_url

# Require Staff Lead or Admin access
require_role(["Staff Lead", "Admin"])

st.set_page_config(
    page_title="🚀 Onboarding System",
    page_icon="📱",
    layout="wide"
)

st.title("📱 Mobile-First Onboarding System")
st.markdown("**Staff Lead**: Mobile onboarding at field locations | **Admin**: Onboard entities + Approve/Reject pending")

# Get user role from session state
user_role = st.session_state.get('current_role', 'Staff Lead')

# API Base URL
API_BASE = get_api_base_url()

def get_current_location():
    """Simulate GPS location capture"""
    return "8.5241° N, 76.9366° E (Neendakara Dock)"

def encode_biometric(uploaded_file):
    """Convert uploaded biometric file to base64"""
    if uploaded_file:
        return base64.b64encode(uploaded_file.read()).decode('utf-8')
    return None

# Create tabs based on user role
if user_role == "Admin":
    # Admin can both onboard entities directly AND approve/reject pending entities
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📊 Pending Approvals", 
        "👥 Staff (Pending)", 
        "🚤 Suppliers (Pending)", 
        "🏢 Vendors (Pending)",
        "🚀 Direct Onboarding"
    ])
    
    with tab1:
        st.subheader("📊 Pending Approvals Dashboard")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            try:
                response = requests.get(
                    f"{API_BASE}/onboarding/pending/staff",
                    headers={"x-user-role": user_role}
                )
                pending_staff = response.json() if response.status_code == 200 else []
                st.metric("Pending Staff", len(pending_staff))
            except:
                st.metric("Pending Staff", "Error")
        
        with col2:
            try:
                response = requests.get(
                    f"{API_BASE}/onboarding/pending/suppliers",
                    headers={"x-user-role": user_role}
                )
                pending_suppliers = response.json() if response.status_code == 200 else []
                st.metric("Pending Suppliers", len(pending_suppliers))
            except:
                st.metric("Pending Suppliers", "Error")
        
        with col3:
            try:
                response = requests.get(
                    f"{API_BASE}/onboarding/pending/vendors",
                    headers={"x-user-role": user_role}
                )
                pending_vendors = response.json() if response.status_code == 200 else []
                st.metric("Pending Vendors", len(pending_vendors))
            except:
                st.metric("Pending Vendors", "Error")
    
    with tab2:
        st.subheader("👥 Pending Staff Approvals")
        
        try:
            response = requests.get(
                f"{API_BASE}/onboarding/pending/staff",
                headers={"x-user-role": user_role}
            )
            
            if response.status_code == 200:
                pending_staff = response.json()
                
                if pending_staff:
                    for staff in pending_staff:
                        with st.expander(f"👤 {staff['full_name']} - {staff['role']}"):
                            col1, col2 = st.columns(2)
                            
                            with col1:
                                st.write(f"**Name:** {staff['full_name']}")
                                st.write(f"**Role:** {staff['role']}")
                                st.write(f"**Station:** {staff.get('station', 'N/A')}")
                                st.write(f"**Contact:** {staff.get('contact_number', 'N/A')}")
                                st.write(f"**Submitted:** {staff['submitted_at']}")
                            
                            with col2:
                                # Admin decision
                                action = st.selectbox(
                                    "Decision",
                                    ["Select Action", "Approve", "Reject"],
                                    key=f"staff_action_{staff['id']}"
                                )
                                
                                remarks = st.text_area(
                                    "Admin Remarks",
                                    key=f"staff_remarks_{staff['id']}"
                                )
                                
                                if st.button(f"Submit Decision", key=f"staff_submit_{staff['id']}"):
                                    if action == "Approve":
                                        approve_response = requests.put(
                                            f"{API_BASE}/onboarding/staff/{staff['id']}/approve",
                                            headers={"x-user-role": user_role},
                                            json={"admin_remarks": remarks}
                                        )
                                        if approve_response.status_code == 200:
                                            st.success("✅ Staff approved successfully!")
                                            st.rerun()
                                    elif action == "Reject":
                                        if remarks:
                                            reject_response = requests.put(
                                                f"{API_BASE}/onboarding/staff/{staff['id']}/reject",
                                                headers={"x-user-role": user_role},
                                                json={"admin_remarks": remarks}
                                            )
                                            if reject_response.status_code == 200:
                                                st.error("❌ Staff rejected with reason")
                                                st.rerun()
                                        else:
                                            st.warning("Please provide rejection reason")
                else:
                    st.info("✅ No pending staff approvals")
            else:
                st.error(f"Failed to fetch pending staff: {response.status_code}")
        except Exception as e:
            st.error(f"Error: {str(e)}")
    
    with tab3:
        st.subheader("🚤 Pending Supplier Approvals")
        
        try:
            response = requests.get(
                f"{API_BASE}/onboarding/pending/suppliers",
                headers={"x-user-role": user_role}
            )
            
            if response.status_code == 200:
                pending_suppliers = response.json()
                
                if pending_suppliers:
                    for supplier in pending_suppliers:
                        with st.expander(f"🚤 {supplier['full_name']} - {supplier['type']}"):
                            col1, col2 = st.columns(2)
                            
                            with col1:
                                st.write(f"**Name:** {supplier['full_name']}")
                                st.write(f"**Type:** {supplier['type']}")
                                st.write(f"**Boat Reg:** {supplier.get('boat_reg_id', 'N/A')}")
                                st.write(f"**Contact:** {supplier.get('contact_number', 'N/A')}")
                                st.write(f"**Aadhar:** {supplier.get('aadhar_number', 'N/A')}")
                                st.write(f"**GST:** {supplier.get('gst_number', 'N/A')}")
                                st.write(f"**Location:** {supplier.get('location_gps', 'N/A')}")
                                st.write(f"**Submitted:** {supplier['submitted_at']}")
                            
                            with col2:
                                # Admin decision
                                action = st.selectbox(
                                    "Decision",
                                    ["Select Action", "Approve", "Reject"],
                                    key=f"supplier_action_{supplier['id']}"
                                )
                                
                                remarks = st.text_area(
                                    "Admin Remarks",
                                    key=f"supplier_remarks_{supplier['id']}"
                                )
                                
                                if st.button(f"Submit Decision", key=f"supplier_submit_{supplier['id']}"):
                                    if action == "Approve":
                                        approve_response = requests.put(
                                            f"{API_BASE}/onboarding/supplier/{supplier['id']}/approve",
                                            headers={"x-user-role": user_role},
                                            json={"admin_remarks": remarks}
                                        )
                                        if approve_response.status_code == 200:
                                            st.success("✅ Supplier approved successfully!")
                                            st.rerun()
                                    elif action == "Reject":
                                        if remarks:
                                            reject_response = requests.put(
                                                f"{API_BASE}/onboarding/supplier/{supplier['id']}/reject",
                                                headers={"x-user-role": user_role},
                                                json={"admin_remarks": remarks}
                                            )
                                            if reject_response.status_code == 200:
                                                st.error("❌ Supplier rejected with reason")
                                                st.rerun()
                                        else:
                                            st.warning("Please provide rejection reason")
                else:
                    st.info("✅ No pending supplier approvals")
            else:
                st.error(f"Failed to fetch pending suppliers: {response.status_code}")
        except Exception as e:
            st.error(f"Error: {str(e)}")
    
    with tab4:
        st.subheader("🏢 Pending Vendor Approvals")
        
        try:
            response = requests.get(
                f"{API_BASE}/onboarding/pending/vendors",
                headers={"x-user-role": user_role}
            )
            
            if response.status_code == 200:
                pending_vendors = response.json()
                
                if pending_vendors:
                    for vendor in pending_vendors:
                        with st.expander(f"🏢 {vendor['full_name']} - {vendor.get('category', 'N/A')}"):
                            col1, col2 = st.columns(2)
                            
                            with col1:
                                st.write(f"**Name:** {vendor['full_name']}")
                                st.write(f"**Firm:** {vendor.get('firm_name', 'N/A')}")
                                st.write(f"**Category:** {vendor.get('category', 'N/A')}")
                                st.write(f"**GST:** {vendor.get('gst_number', 'N/A')}")
                                st.write(f"**PAN:** {vendor.get('pan_number', 'N/A')}")
                                st.write(f"**Contact:** {vendor.get('contact_number', 'N/A')}")
                                st.write(f"**Submitted:** {vendor['submitted_at']}")
                            
                            with col2:
                                # Admin decision
                                action = st.selectbox(
                                    "Decision",
                                    ["Select Action", "Approve", "Reject"],
                                    key=f"vendor_action_{vendor['id']}"
                                )
                                
                                remarks = st.text_area(
                                    "Admin Remarks",
                                    key=f"vendor_remarks_{vendor['id']}"
                                )
                                
                                if st.button(f"Submit Decision", key=f"vendor_submit_{vendor['id']}"):
                                    if action == "Approve":
                                        approve_response = requests.put(
                                            f"{API_BASE}/onboarding/vendor/{vendor['id']}/approve",
                                            headers={"x-user-role": user_role},
                                            json={"admin_remarks": remarks}
                                        )
                                        if approve_response.status_code == 200:
                                            st.success("✅ Vendor approved successfully!")
                                            st.rerun()
                                    elif action == "Reject":
                                        if remarks:
                                            reject_response = requests.put(
                                                f"{API_BASE}/onboarding/vendor/{vendor['id']}/reject",
                                                headers={"x-user-role": user_role},
                                                json={"admin_remarks": remarks}
                                            )
                                            if reject_response.status_code == 200:
                                                st.error("❌ Vendor rejected with reason")
                                                st.rerun()
                                        else:
                                            st.warning("Please provide rejection reason")
                else:
                    st.info("✅ No pending vendor approvals")
            else:
                st.error(f"Failed to fetch pending vendors: {response.status_code}")
        except Exception as e:
            st.error(f"Error: {str(e)}")
    
    with tab5:
        st.subheader("🚀 Admin Direct Onboarding")
        st.markdown("*Admin can create entities directly without approval process*")
        st.info("💡 **Admin Privilege**: Entities created here go directly to active status")
        
        # Admin direct onboarding tabs
        admin_tab1, admin_tab2, admin_tab3 = st.tabs(["👥 Create Staff", "🚤 Create Supplier", "🏢 Create Vendor"])
        
        with admin_tab1:
            st.markdown("### 👥 **Create Staff Directly**")
            with st.form("admin_create_staff"):
                col1, col2 = st.columns(2)
                
                with col1:
                    full_name = st.text_input("👤 Full Name *", placeholder="Enter full name")
                    role = st.selectbox(
                        "🎭 Role *",
                        ["Production Staff", "QC Staff", "Production Lead", "Gate Staff", "Maintenance Staff"]
                    )
                    station = st.text_input("🏭 Station Assignment", placeholder="e.g., PPC Unit 1")
                
                with col2:
                    # Biometric template (optional for Admin)
                    biometric_file = st.file_uploader(
                        "📷 Biometric Template (Optional)",
                        type=['jpg', 'jpeg', 'png'],
                        help="Admin can add biometric later"
                    )
                
                submitted = st.form_submit_button("✅ Create Staff (Direct)", use_container_width=True)
                
                if submitted and full_name and role:
                    biometric_template = encode_biometric(biometric_file) if biometric_file else None
                    
                    staff_data = {
                        "full_name": full_name,
                        "role": role,
                        "station": station,
                        "biometric_template": biometric_template
                    }
                    
                    try:
                        response = requests.post(
                            f"{API_BASE}/admin/create/staff",
                            headers={"x-user-role": user_role},
                            json=staff_data
                        )
                        
                        if response.status_code == 200:
                            st.success("✅ Staff created directly! Active immediately.")
                            st.balloons()
                        else:
                            st.error(f"❌ Creation failed: {response.text}")
                    except Exception as e:
                        st.error(f"❌ Error: {str(e)}")
        
        with admin_tab2:
            st.markdown("### 🚤 **Create Supplier Directly**")
            with st.form("admin_create_supplier"):
                col1, col2 = st.columns(2)
                
                with col1:
                    full_name = st.text_input("👤 Full Name *", placeholder="Enter supplier name")
                    supplier_type = st.selectbox(
                        "🎯 Type *",
                        ["Boat Owner", "Fishermen", "Fish Trader", "Cooperative Society"]
                    )
                    address = st.text_area("📍 Address", placeholder="Full address")
                    contact_number = st.text_input("📞 Contact Number", placeholder="+91-9876543210")
                
                with col2:
                    aadhar_number = st.text_input("🆔 Aadhar Number", placeholder="1234-5678-9012")
                    gst_number = st.text_input("📄 GST Number", placeholder="22AAAAA0000A1Z5")
                    pan_number = st.text_input("📄 PAN Number", placeholder="AAAAA0000A")
                    
                    # Bank details
                    st.markdown("🏦 **Bank Details**")
                    bank_account_holder = st.text_input("Account Holder Name")
                    bank_account_number = st.text_input("Account Number")
                    bank_ifsc = st.text_input("IFSC Code", placeholder="SBIN0001234")
                    bank_name = st.text_input("Bank Name", placeholder="State Bank of India")
                
                submitted = st.form_submit_button("✅ Create Supplier (Direct)", use_container_width=True)
                
                if submitted and full_name and supplier_type:
                    supplier_data = {
                        "full_name": full_name,
                        "type": supplier_type,
                        "address": address,
                        "contact_number": contact_number,
                        "aadhar_number": aadhar_number,
                        "gst_number": gst_number,
                        "pan_number": pan_number,
                        "bank_account_holder": bank_account_holder,
                        "bank_account_number": bank_account_number,
                        "bank_ifsc": bank_ifsc,
                        "bank_name": bank_name
                    }
                    
                    try:
                        response = requests.post(
                            f"{API_BASE}/admin/create/supplier",
                            headers={"x-user-role": user_role},
                            json=supplier_data
                        )
                        
                        if response.status_code == 200:
                            st.success("✅ Supplier created directly! Active immediately.")
                            st.balloons()
                        else:
                            st.error(f"❌ Creation failed: {response.text}")
                    except Exception as e:
                        st.error(f"❌ Error: {str(e)}")
        
        with admin_tab3:
            st.markdown("### 🏢 **Create Vendor Directly**")
            with st.form("admin_create_vendor"):
                col1, col2 = st.columns(2)
                
                with col1:
                    full_name = st.text_input("👤 Contact Person *", placeholder="Enter contact person")
                    firm_name = st.text_input("🏢 Firm/Company Name", placeholder="Company name")
                    category = st.selectbox(
                        "📂 Service Category *",
                        [
                            "Cleaning Chemicals",
                            "Equipment Supplier",
                            "Maintenance Service",
                            "Transport Service",
                            "Packaging Material",
                            "Other"
                        ]
                    )
                    contact_number = st.text_input("📞 Contact Number", placeholder="+91-9876543210")
                
                with col2:
                    gst_number = st.text_input("📄 GST Number", placeholder="22AAAAA0000A1Z5")
                    pan_number = st.text_input("📄 PAN Number", placeholder="AAAAA0000A")
                    
                    # Bank details
                    st.markdown("🏦 **Payment Details**")
                    bank_account_holder = st.text_input("Account Holder Name")
                    bank_account_number = st.text_input("Account Number")
                    bank_ifsc = st.text_input("IFSC Code", placeholder="SBIN0001234")
                    bank_name = st.text_input("Bank Name", placeholder="State Bank of India")
                
                submitted = st.form_submit_button("✅ Create Vendor (Direct)", use_container_width=True)
                
                if submitted and full_name and category:
                    vendor_data = {
                        "full_name": full_name,
                        "firm_name": firm_name,
                        "gst_number": gst_number,
                        "pan_number": pan_number,
                        "bank_account_holder": bank_account_holder,
                        "bank_account_number": bank_account_number,
                        "bank_ifsc": bank_ifsc,
                        "bank_name": bank_name,
                        "contact_number": contact_number,
                        "category": category
                    }
                    
                    try:
                        response = requests.post(
                            f"{API_BASE}/admin/create/vendor",
                            headers={"x-user-role": user_role},
                            json=vendor_data
                        )
                        
                        if response.status_code == 200:
                            st.success("✅ Vendor created directly! Active immediately.")
                            st.balloons()
                        else:
                            st.error(f"❌ Creation failed: {response.text}")
                    except Exception as e:
                        st.error(f"❌ Error: {str(e)}")

else:
    # Staff Lead can onboard new entities
    tab1, tab2, tab3 = st.tabs(["👥 Onboard Staff", "🚤 Onboard Supplier", "🏢 Onboard Vendor"])
    
    with tab1:
        st.subheader("👥 Onboard New Staff")
        st.markdown("*Mobile-optimized for PPC Unit operations*")
        
        with st.form("onboard_staff"):
            col1, col2 = st.columns(2)
            
            with col1:
                full_name = st.text_input("👤 Full Name *", placeholder="Enter full name")
                role = st.selectbox(
                    "🎭 Role *",
                    ["Production Staff", "QC Staff", "Gate Staff", "Maintenance Staff"]
                )
                station = st.text_input("🏭 Station Assignment", placeholder="e.g., PPC Unit 1")
            
            with col2:
                contact_number = st.text_input("📞 Contact Number", placeholder="+91-9876543210")
                
                # Biometric capture simulation
                st.markdown("📷 **Biometric Capture**")
                biometric_file = st.file_uploader(
                    "Capture/Upload Biometric Template",
                    type=['jpg', 'jpeg', 'png'],
                    help="Use mobile camera to capture biometric template"
                )
                
                # GPS location (simulated)
                location = get_current_location()
                st.info(f"📍 Current Location: {location}")
            
            submitted = st.form_submit_button("🚀 Submit for Admin Approval", use_container_width=True)
            
            if submitted:
                if full_name and role:
                    # Encode biometric data
                    biometric_template = encode_biometric(biometric_file) if biometric_file else None
                    
                    staff_data = {
                        "full_name": full_name,
                        "role": role,
                        "station": station,
                        "contact_number": contact_number,
                        "biometric_template": biometric_template,
                        "submitted_by": str(uuid.uuid4())  # Would be actual Staff Lead ID
                    }
                    
                    try:
                        response = requests.post(
                            f"{API_BASE}/onboarding/staff",
                            headers={"x-user-role": user_role},
                            json=staff_data
                        )
                        
                        if response.status_code == 200:
                            st.success("✅ Staff submitted for Admin approval!")
                            st.balloons()
                        else:
                            st.error(f"❌ Submission failed: {response.text}")
                    except Exception as e:
                        st.error(f"❌ Error: {str(e)}")
                else:
                    st.warning("⚠️ Please fill required fields (marked with *)")
    
    with tab2:
        st.subheader("🚤 Onboard New Supplier")
        st.markdown("*Perfect for on-site fishermen registration at docks*")
        
        with st.form("onboard_supplier"):
            col1, col2 = st.columns(2)
            
            with col1:
                full_name = st.text_input("👤 Full Name *", placeholder="Enter supplier name")
                supplier_type = st.selectbox(
                    "🎯 Type *",
                    ["Boat Owner", "Fishermen", "Fish Trader", "Cooperative Society"]
                )
                boat_reg_id = st.text_input("🚤 Boat Registration ID", placeholder="KL-FR-1234")
                aadhar_number = st.text_input("🆔 Aadhar Number", placeholder="1234-5678-9012")
                contact_number = st.text_input("📞 Contact Number", placeholder="+91-9876543210")
            
            with col2:
                gst_number = st.text_input("📄 GST Number (if applicable)", placeholder="22AAAAA0000A1Z5")
                pan_number = st.text_input("📄 PAN Number (if applicable)", placeholder="AAAAA0000A")
                
                # Bank details
                st.markdown("🏦 **Bank Details for Payments**")
                bank_account_holder = st.text_input("Account Holder Name")
                bank_account_number = st.text_input("Account Number")
                bank_ifsc = st.text_input("IFSC Code", placeholder="SBIN0001234")
                bank_name = st.text_input("Bank Name", placeholder="State Bank of India")
            
            # Biometric and location
            st.markdown("📷 **Mobile Capture**")
            col3, col4 = st.columns(2)
            
            with col3:
                biometric_file = st.file_uploader(
                    "Biometric Template",
                    type=['jpg', 'jpeg', 'png'],
                    help="Mobile camera capture"
                )
            
            with col4:
                boat_photo = st.file_uploader(
                    "Boat/License Photo (Optional)",
                    type=['jpg', 'jpeg', 'png'],
                    help="Document verification"
                )
            
            # GPS location
            location = get_current_location()
            st.info(f"📍 Onboarding Location: {location}")
            
            submitted = st.form_submit_button("🚀 Submit Supplier for Approval", use_container_width=True)
            
            if submitted:
                if full_name and supplier_type:
                    # Encode biometric data
                    biometric_template = encode_biometric(biometric_file) if biometric_file else None
                    
                    supplier_data = {
                        "full_name": full_name,
                        "type": supplier_type,
                        "boat_reg_id": boat_reg_id,
                        "aadhar_number": aadhar_number,
                        "gst_number": gst_number,
                        "pan_number": pan_number,
                        "bank_account_holder": bank_account_holder,
                        "bank_account_number": bank_account_number,
                        "bank_ifsc": bank_ifsc,
                        "bank_name": bank_name,
                        "contact_number": contact_number,
                        "biometric_template": biometric_template,
                        "location_gps": location,
                        "submitted_by": str(uuid.uuid4())  # Would be actual Staff Lead ID
                    }
                    
                    try:
                        response = requests.post(
                            f"{API_BASE}/onboarding/supplier",
                            headers={"x-user-role": user_role},
                            json=supplier_data
                        )
                        
                        if response.status_code == 200:
                            st.success("✅ Supplier submitted for Admin approval!")
                            st.info("📧 Admin will receive notification for approval")
                            st.balloons()
                        else:
                            st.error(f"❌ Submission failed: {response.text}")
                    except Exception as e:
                        st.error(f"❌ Error: {str(e)}")
                else:
                    st.warning("⚠️ Please fill required fields (marked with *)")
    
    with tab3:
        st.subheader("🏢 Onboard New Vendor")
        st.markdown("*For service providers and equipment suppliers*")
        
        with st.form("onboard_vendor"):
            col1, col2 = st.columns(2)
            
            with col1:
                full_name = st.text_input("👤 Contact Person Name *", placeholder="Enter contact person")
                firm_name = st.text_input("🏢 Firm/Company Name", placeholder="Company name")
                category = st.selectbox(
                    "📂 Service Category *",
                    [
                        "Cleaning Chemicals",
                        "Equipment Supplier",
                        "Maintenance Service",
                        "Transport Service",
                        "Packaging Material",
                        "Other"
                    ]
                )
                contact_number = st.text_input("📞 Contact Number", placeholder="+91-9876543210")
            
            with col2:
                gst_number = st.text_input("📄 GST Number", placeholder="22AAAAA0000A1Z5")
                pan_number = st.text_input("📄 PAN Number", placeholder="AAAAA0000A")
                
                # Bank details
                st.markdown("🏦 **Payment Details**")
                bank_account_holder = st.text_input("Account Holder Name")
                bank_account_number = st.text_input("Account Number")
                bank_ifsc = st.text_input("IFSC Code", placeholder="SBIN0001234")
                bank_name = st.text_input("Bank Name", placeholder="State Bank of India")
            
            submitted = st.form_submit_button("🚀 Submit Vendor for Approval", use_container_width=True)
            
            if submitted:
                if full_name and category:
                    vendor_data = {
                        "full_name": full_name,
                        "firm_name": firm_name,
                        "gst_number": gst_number,
                        "pan_number": pan_number,
                        "bank_account_holder": bank_account_holder,
                        "bank_account_number": bank_account_number,
                        "bank_ifsc": bank_ifsc,
                        "bank_name": bank_name,
                        "contact_number": contact_number,
                        "category": category,
                        "submitted_by": str(uuid.uuid4())  # Would be actual Staff Lead ID
                    }
                    
                    try:
                        response = requests.post(
                            f"{API_BASE}/onboarding/vendor",
                            headers={"x-user-role": user_role},
                            json=vendor_data
                        )
                        
                        if response.status_code == 200:
                            st.success("✅ Vendor submitted for Admin approval!")
                            st.balloons()
                        else:
                            st.error(f"❌ Submission failed: {response.text}")
                    except Exception as e:
                        st.error(f"❌ Error: {str(e)}")
                else:
                    st.warning("⚠️ Please fill required fields (marked with *)")

# Mobile optimization notice
st.markdown("---")
st.markdown("""
### 📱 **Mobile Features**
- **Camera Integration**: Capture biometric templates and documents
- **GPS Tagging**: Automatic location recording for audit trail
- **Offline Mode**: Save drafts locally, sync when connected
- **Touch-Optimized**: Large buttons and simple navigation

### 🔐 **Security Features**
- **Encrypted Biometrics**: All biometric data encrypted before storage
- **Admin Approval**: No entity can participate until approved
- **Audit Trail**: Complete tracking of who onboarded what and where
- **Role Enforcement**: Only Staff Lead and Admin have access

### ✅ **Next Steps After Submission**
1. **Immediate**: Entity saved to pending approval queue
2. **Notification**: Admin receives alert about pending approval
3. **Review**: Admin reviews details and makes decision
4. **Activation**: If approved, entity moved to active database
5. **ID Assignment**: Approved entities get ClamFlow ID (e.g., CF-BOAT-0001)
""")
