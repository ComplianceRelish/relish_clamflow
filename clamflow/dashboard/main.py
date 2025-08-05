# dashboard/main.py
import streamlit as st
from utils import require_role

st.set_page_config(
    page_title="ClamFlow MVP",
    page_icon="🐚",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.sidebar.image("c:\\Users\\user\\Desktop\\Designs\\Logo\\Relish-3D.png", width=120)
st.sidebar.title("ClamFlow MVP")
st.sidebar.markdown("### Navigation")

# Only show navigation if logged in
if 'role' not in st.session_state:
    # Login form
    with st.sidebar:
        st.subheader("🔐 Login")
        role = st.selectbox("Select Role", [
            "Production Lead", 
            "QC Staff", 
            "Production Staff", 
            "Admin", 
            "Staff Lead"
        ])
        if st.button("Login"):
            st.session_state.role = role
            st.rerun()
else:
    # Enforce role on dashboard home
    require_role(["Production Lead", "QC Staff", "Production Staff", "Admin", "Staff Lead"])
    # Show sidebar nav
    st.sidebar.success(f"🟢 {st.session_state.role}")
    if st.sidebar.button("Logout"):
        del st.session_state.role
        st.rerun()

    # Page mapping by role
    pages = {
        "Production Lead": [
            "0_Pending_Tasks",
            "1_Weight_Note",
            "2_PPC_Form",
            "3_FP_Form",
            "4_Inventory",
            "5_Roster"
        ],
        "QC Staff": [
            "0_Pending_Tasks",
            "1_Weight_Note",
            "2_PPC_Form",
            "3_FP_Form",
            "4_Inventory"
        ],
        "Production Staff": [
            "0_Pending_Tasks",
            "1_Weight_Note",
            "2_PPC_Form",
            "3_FP_Form"
        ],
        "Staff Lead": [
            "0_Pending_Tasks",
            "7_Onboarding"
        ],
        "Admin": [
            "0_Pending_Tasks",
            "5_Roster",
            "6_Admin_Reports",
            "7_Onboarding"
        ]
    }

    # Show only allowed pages
    allowed_pages = pages.get(st.session_state.role, [])
    for page in allowed_pages:
        st.sidebar.page_link(f"pages/{page}.py", label=page.replace("_", " ").title())

# Main content area
if 'role' not in st.session_state:
    st.title("🐚 Welcome to ClamFlow MVP")
    st.markdown("""
    ### Production Workflow Management System
    
    **Please select your role from the sidebar to get started:**
    
    - **Production Lead**: Full access to all forms and operations
    - **QC Staff**: Quality control and inventory management
    - **Production Staff**: Form submissions and basic operations
    - **Admin**: Reports, roster management, and system administration
    
    This MVP dashboard provides complete traceability from raw material receipt to finished product shipping.
    """)
else:
    st.title(f"🐚 ClamFlow Dashboard - {st.session_state.role}")
    
    # Initialize session state data if not exists
    if 'weight_notes' not in st.session_state:
        st.session_state.weight_notes = []
    if 'ppc_forms' not in st.session_state:
        st.session_state.ppc_forms = []
    if 'fp_forms' not in st.session_state:
        st.session_state.fp_forms = []
    
    # Show role-specific pending tasks summary
    role = st.session_state.role
    
    st.subheader("📊 Your Task Summary")
    col1, col2, col3, col4 = st.columns(4)
    
    if role == "Production Staff":
        rejected_count = len([f for f in st.session_state.weight_notes if f.get("Status") == "Rejected"]) + \
                        len([f for f in st.session_state.ppc_forms if f.get("Status") == "Rejected"]) + \
                        len([f for f in st.session_state.fp_forms if f.get("Status") == "Rejected"])
        
        with col1:
            st.metric("🔄 Forms to Resubmit", rejected_count, delta=None if rejected_count == 0 else "⚠️")
        with col2:
            st.metric("📋 Total Submitted", len(st.session_state.weight_notes))
        with col3:
            approved_count = len([f for f in st.session_state.weight_notes if f.get("Status") == "Approved"])
            st.metric("✅ Approved Forms", approved_count)
        
        if rejected_count > 0:
            st.warning(f"⚠️ You have {rejected_count} rejected forms that need resubmission!")
            if st.button("🔄 View Rejected Forms"):
                st.switch_page("pages/0_Pending_Tasks.py")
    
    elif role == "QC Staff":
        pending_qc = len([f for f in st.session_state.weight_notes if f.get("Status") == "QC Pending"])
        
        with col1:
            st.metric("⏳ Pending QC Review", pending_qc, delta=None if pending_qc == 0 else "⚠️")
        with col2:
            approved_qc = len([f for f in st.session_state.weight_notes if f.get("Status") == "Approved"])
            st.metric("✅ QC Approved", approved_qc)
        
        if pending_qc > 0:
            st.info(f"🔍 You have {pending_qc} forms awaiting QC approval!")
            if st.button("⏳ Review Pending Forms"):
                st.switch_page("pages/0_Pending_Tasks.py")
    
    elif role == "Production Lead":
        pending_lead = len([f for f in st.session_state.ppc_forms if f.get("Status") == "QC Approved"]) + \
                      len([f for f in st.session_state.fp_forms if f.get("Status") == "QC Approved"])
        approved_for_lots = len([f for f in st.session_state.weight_notes if f.get("Status") == "Approved"])
        
        with col1:
            st.metric("👔 Awaiting Final Approval", pending_lead, delta=None if pending_lead == 0 else "⚠️")
        with col2:
            st.metric("🏭 Ready for Lots", approved_for_lots)
        with col3:
            total_inventory = len([f for f in st.session_state.fp_forms if f.get("Status") == "Approved"])
            st.metric("📦 In Inventory", total_inventory)
        
        if pending_lead > 0:
            st.warning(f"👔 You have {pending_lead} forms awaiting your final approval!")
            if st.button("👔 Review for Final Approval"):
                st.switch_page("pages/0_Pending_Tasks.py")
    
    elif role == "Staff Lead":
        # Initialize onboarding data if not exists
        if 'pending_staff' not in st.session_state:
            st.session_state.pending_staff = []
        if 'pending_suppliers' not in st.session_state:
            st.session_state.pending_suppliers = []
        
        submitted_today = len([s for s in st.session_state.pending_staff if s.get('status') == 'pending']) + \
                         len([s for s in st.session_state.pending_suppliers if s.get('status') == 'pending'])
        
        with col1:
            st.metric("📱 Submitted Today", submitted_today)
        with col2:
            approved_total = len([s for s in st.session_state.pending_staff if s.get('status') == 'approved']) + \
                           len([s for s in st.session_state.pending_suppliers if s.get('status') == 'approved'])
            st.metric("✅ Total Approved", approved_total)
        
        if submitted_today > 0:
            st.info(f"📱 You've submitted {submitted_today} entities for Admin approval today!")
        
        st.success("📱 **Staff Lead Mobile Operations**: Use onboarding page for field work")
        if st.button("📱 Open Mobile Onboarding"):
            st.switch_page("pages/7_Onboarding.py")
    
    elif role == "Admin":
        # Initialize onboarding data if not exists
        if 'pending_staff' not in st.session_state:
            st.session_state.pending_staff = []
        if 'pending_suppliers' not in st.session_state:
            st.session_state.pending_suppliers = []
        if 'pending_vendors' not in st.session_state:
            st.session_state.pending_vendors = []
        
        total_pending = len([s for s in st.session_state.pending_staff if s.get('status') == 'pending']) + \
                       len([s for s in st.session_state.pending_suppliers if s.get('status') == 'pending']) + \
                       len([s for s in st.session_state.pending_vendors if s.get('status') == 'pending'])
        
        total_entities = len(st.session_state.pending_staff) + len(st.session_state.pending_suppliers) + \
                        len(st.session_state.pending_vendors)
        
        with col1:
            st.metric("⏳ Pending Approvals", total_pending, delta=None if total_pending == 0 else "⚠️")
        with col2:
            st.metric("👥 Total Entities", total_entities)
        
        if total_pending > 0:
            st.warning(f"⚠️ You have {total_pending} entities awaiting approval!")
            if st.button("⚠️ Review Pending Approvals"):
                st.switch_page("pages/7_Onboarding.py")
        else:
            st.success("✅ **All onboarding approvals up to date!**")
    
    st.divider()
    
    st.markdown(f"""
    ### Welcome, {st.session_state.role}!
    
    **Your Available Pages:**
    """)
    
    # Show available pages as cards
    cols = st.columns(3)
    page_descriptions = {
        "0_Pending_Tasks": "🔔 View all pending tasks and approvals",
        "1_Weight_Note": "📋 Record raw material receipts",
        "2_PPC_Form": "📦 Process product center operations", 
        "3_FP_Form": "🧊 Finished product processing",
        "4_Inventory": "📦 View inventory and generate labels",
        "5_Roster": "📅 Manage staff assignments",
        "6_Admin_Reports": "📊 Financial and operational reports",
        "7_Onboarding": "📱 Mobile onboarding system for staff/suppliers"
    }
    
    allowed_pages = pages.get(st.session_state.role, [])
    for i, page in enumerate(allowed_pages):
        with cols[i % 3]:
            st.info(f"**{page.replace('_', ' ').title()}**\n\n{page_descriptions.get(page, 'Available for your role')}")
    
    st.markdown("---")
    st.markdown("**Select a page from the sidebar to get started!**")
