# dashboard/pages/0_Pending_Tasks.py
import streamlit as st
import pandas as pd
from utils import require_role, get_current_user_role, can_approve_forms
from datetime import datetime

# Allow all logged-in roles to see their pending tasks
require_role(["Production Staff", "QC Staff", "Production Lead", "Admin"])

st.title("📋 Your Pending Tasks")

role = get_current_user_role()

# Initialize session state data if not exists
if 'weight_notes' not in st.session_state:
    st.session_state.weight_notes = []
if 'ppc_forms' not in st.session_state:
    st.session_state.ppc_forms = []
if 'fp_forms' not in st.session_state:
    st.session_state.fp_forms = []

# --- Production Staff ---
if role == "Production Staff":
    st.subheader("🔧 Forms Requiring Your Action")
    
    # Rejected Weight Notes needing rectification
    rejected_weight_notes = [f for f in st.session_state.weight_notes if f.get("Status") == "Rejected"]
    if rejected_weight_notes:
        st.error("❌ **Rejected Weight Notes - Need Rectification**")
        for f in rejected_weight_notes:
            with st.expander(f"🔄 Weight Note {f['Form ID']} - REJECTED"):
                st.write(f"**Supplier**: {f['Supplier']}")
                st.write(f"**Vehicle**: {f['Vehicle']}")
                st.write(f"**Weight**: {f['Weight (kg)']} kg")
                st.write(f"**Rejection Reason**: {f.get('Remarks', 'No reason provided')}")
                st.write(f"**Rejected By**: {f.get('QC Action', 'Unknown')}")
                
                if st.button(f"🔄 Resubmit {f['Form ID']}", key=f"resubmit_wn_{f['Form ID']}"):
                    st.session_state.editing_form = f["Form ID"]
                    st.switch_page("pages/1_Weight_Note.py")
    
    # Rejected PPC Forms
    rejected_ppc_forms = [f for f in st.session_state.ppc_forms if f.get("Status") == "Rejected"]
    if rejected_ppc_forms:
        st.error("❌ **Rejected PPC Forms - Need Rectification**")
        for f in rejected_ppc_forms:
            with st.expander(f"🔄 PPC Form {f['Form ID']} - REJECTED"):
                st.write(f"**Product**: {f['Product']}")
                st.write(f"**Pack Size**: {f['Pack Size']} kg")
                st.write(f"**Rejection Reason**: {f.get('Remarks', 'No reason provided')}")
                
                if st.button(f"🔄 Resubmit {f['Form ID']}", key=f"resubmit_ppc_{f['Form ID']}"):
                    st.session_state.editing_form = f["Form ID"]
                    st.switch_page("pages/2_PPC_Form.py")

    # Rejected FP Forms
    rejected_fp_forms = [f for f in st.session_state.fp_forms if f.get("Status") == "Rejected"]
    if rejected_fp_forms:
        st.error("❌ **Rejected FP Forms - Need Rectification**")
        for f in rejected_fp_forms:
            with st.expander(f"🔄 FP Form {f['Form ID']} - REJECTED"):
                st.write(f"**Process**: {f['Process']}")
                st.write(f"**Pack Size**: {f['Pack Size']} kg")
                st.write(f"**Rejection Reason**: {f.get('Remarks', 'No reason provided')}")
                
                if st.button(f"🔄 Resubmit {f['Form ID']}", key=f"resubmit_fp_{f['Form ID']}"):
                    st.session_state.editing_form = f["Form ID"]
                    st.switch_page("pages/3_FP_Form.py")

    # Show message if no pending tasks
    if not (rejected_weight_notes or rejected_ppc_forms or rejected_fp_forms):
        st.success("✅ **No pending tasks!** All your forms are approved or pending review.")

# --- QC Staff ---
elif role == "QC Staff":
    st.subheader("🔍 Forms Awaiting Your Approval")
    
    # Weight Notes pending QC approval
    pending_weight_notes = [f for f in st.session_state.weight_notes if f.get("Status") == "QC Pending"]
    if pending_weight_notes:
        st.info("⏳ **Weight Notes Awaiting QC Approval**")
        for f in pending_weight_notes:
            with st.expander(f"📝 Weight Note {f['Form ID']} - QC Review"):
                st.write(f"**Supplier**: {f['Supplier']}")
                st.write(f"**Vehicle**: {f['Vehicle']}")
                st.write(f"**Weight**: {f['Weight (kg)']} kg")
                st.write(f"**Submitted By**: {f['Staff']}")
                st.write(f"**Timestamp**: {f['Timestamp']}")
                
                col1, col2 = st.columns(2)
                with col1:
                    if st.button(f"✅ Approve {f['Form ID']}", key=f"qc_approve_wn_{f['Form ID']}"):
                        f["Status"] = "Approved"
                        f["QC Action"] = f"Approved by {role}"
                        f["QC Timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                        st.success(f"✅ {f['Form ID']} Approved")
                        st.rerun()
                
                with col2:
                    with st.popover(f"❌ Reject {f['Form ID']}"):
                        reason = st.text_area("Reason for Rejection", height=100, key=f"qc_reason_wn_{f['Form ID']}")
                        if st.button("Submit Rejection", key=f"qc_submit_reject_wn_{f['Form ID']}"):
                            if reason.strip():
                                f["Status"] = "Rejected"
                                f["Remarks"] = reason
                                f["QC Action"] = f"Rejected by {role}"
                                f["QC Timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                                st.success("❌ Rejection Submitted")
                                st.rerun()
                            else:
                                st.warning("Please enter a reason for rejection.")
    
    # Show message if no pending QC tasks
    if not pending_weight_notes:
        st.success("✅ **No forms pending QC approval!**")

# --- Production Lead ---
elif role == "Production Lead":
    st.subheader("👔 Production Lead Actions")
    
    # PPC Forms pending Production Lead approval (after QC approval)
    pending_ppc = [f for f in st.session_state.ppc_forms if f.get("Status") == "QC Approved"]
    if pending_ppc:
        st.warning("📊 **PPC Forms Awaiting Production Lead Approval**")
        for f in pending_ppc:
            with st.expander(f"📊 PPC Form {f['Form ID']} - Production Lead Review"):
                st.write(f"**Product**: {f['Product']}")
                st.write(f"**Pack Size**: {f['Pack Size']} kg")
                st.write(f"**Estimated Bags**: {f['Estimated Bags']}")
                st.write(f"**QC Status**: {f.get('QC Action', 'QC Approved')}")
                
                col1, col2 = st.columns(2)
                with col1:
                    if st.button(f"✅ Final Approve {f['Form ID']}", key=f"lead_approve_ppc_{f['Form ID']}"):
                        f["Status"] = "Approved"
                        f["Lead Action"] = f"Approved by {role}"
                        f["Lead Timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                        st.success(f"✅ {f['Form ID']} Final Approval Complete")
                        st.rerun()
                
                with col2:
                    with st.popover(f"❌ Reject {f['Form ID']}"):
                        reason = st.text_area("Reason for Rejection", height=100, key=f"lead_reason_ppc_{f['Form ID']}")
                        if st.button("Submit Rejection", key=f"lead_submit_reject_ppc_{f['Form ID']}"):
                            if reason.strip():
                                f["Status"] = "Rejected"
                                f["Remarks"] = reason
                                f["Lead Action"] = f"Rejected by {role}"
                                f["Lead Timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                                st.success("❌ Rejection Submitted")
                                st.rerun()
                            else:
                                st.warning("Please enter a reason for rejection.")

    # FP Forms pending Production Lead approval
    pending_fp = [f for f in st.session_state.fp_forms if f.get("Status") == "QC Approved"]
    if pending_fp:
        st.warning("🧊 **FP Forms Awaiting Production Lead Approval**")
        for f in pending_fp:
            with st.expander(f"🧊 FP Form {f['Form ID']} - Production Lead Review"):
                st.write(f"**Process**: {f['Process']}")
                st.write(f"**Pack Size**: {f['Pack Size']} kg")
                st.write(f"**Total Bags**: {f['Total Bags']}")
                st.write(f"**QC Status**: {f.get('QC Action', 'QC Approved')}")
                
                col1, col2 = st.columns(2)
                with col1:
                    if st.button(f"✅ Final Approve {f['Form ID']}", key=f"lead_approve_fp_{f['Form ID']}"):
                        f["Status"] = "Approved"
                        f["Lead Action"] = f"Approved by {role}"
                        f["Lead Timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                        st.success(f"✅ {f['Form ID']} Final Approval Complete")
                        st.rerun()
                
                with col2:
                    with st.popover(f"❌ Reject {f['Form ID']}"):
                        reason = st.text_area("Reason for Rejection", height=100, key=f"lead_reason_fp_{f['Form ID']}")
                        if st.button("Submit Rejection", key=f"lead_submit_reject_fp_{f['Form ID']}"):
                            if reason.strip():
                                f["Status"] = "Rejected"
                                f["Remarks"] = reason
                                f["Lead Action"] = f"Rejected by {role}"
                                f["Lead Timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                                st.success("❌ Rejection Submitted")
                                st.rerun()
                            else:
                                st.warning("Please enter a reason for rejection.")

    # Approved forms for lot creation
    approved_weight_notes = [f for f in st.session_state.weight_notes if f.get("Status") == "Approved"]
    if approved_weight_notes:
        st.success("🏭 **Approved Weight Notes - Ready for Lot Creation**")
        for f in approved_weight_notes[:3]:  # Show first 3
            st.info(f"Weight Note {f['Form ID']} - {f['Weight (kg)']} kg - Ready for lot creation")

    # Show message if no pending Production Lead tasks
    if not (pending_ppc or pending_fp):
        st.success("✅ **No forms pending Production Lead approval!**")

# --- Admin ---
elif role == "Admin":
    st.subheader("🔧 System Overview & Pending Approvals")
    
    # Summary statistics for forms
    total_weight_notes = len(st.session_state.weight_notes)
    total_ppc_forms = len(st.session_state.ppc_forms)
    total_fp_forms = len(st.session_state.fp_forms)
    
    st.markdown("### 📊 **Form Statistics**")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Weight Notes", total_weight_notes)
    with col2:
        st.metric("PPC Forms", total_ppc_forms)
    with col3:
        st.metric("FP Forms", total_fp_forms)
    
    # Onboarding Pending Approvals
    st.markdown("### 👥 **Pending Onboarding Approvals**")
    
    # Initialize onboarding data if not exists
    if 'pending_staff' not in st.session_state:
        st.session_state.pending_staff = []
    if 'pending_suppliers' not in st.session_state:
        st.session_state.pending_suppliers = []
    if 'pending_vendors' not in st.session_state:
        st.session_state.pending_vendors = []
    
    # Metrics for pending onboarding
    col4, col5, col6 = st.columns(3)
    with col4:
        pending_staff_count = len([s for s in st.session_state.pending_staff if s.get('status') == 'pending'])
        st.metric("Pending Staff", pending_staff_count, delta=pending_staff_count if pending_staff_count > 0 else None)
    with col5:
        pending_suppliers_count = len([s for s in st.session_state.pending_suppliers if s.get('status') == 'pending'])
        st.metric("Pending Suppliers", pending_suppliers_count, delta=pending_suppliers_count if pending_suppliers_count > 0 else None)
    with col6:
        pending_vendors_count = len([s for s in st.session_state.pending_vendors if s.get('status') == 'pending'])
        st.metric("Pending Vendors", pending_vendors_count, delta=pending_vendors_count if pending_vendors_count > 0 else None)
    
    # Alert if any pending approvals
    total_pending = pending_staff_count + pending_suppliers_count + pending_vendors_count
    if total_pending > 0:
        st.warning(f"⚠️ **{total_pending} entities pending your approval** - Visit 📱 Onboarding page to review")
        
        if st.button("🚀 Go to Onboarding Approvals", use_container_width=True):
            st.switch_page("pages/7_Onboarding.py")
    else:
        st.success("✅ **No pending onboarding approvals**")
    
    st.info("📊 **System Status**: All workflows operational")

st.divider()

# Quick navigation
st.subheader("🧭 Quick Navigation")
col1, col2, col3 = st.columns(3)

with col1:
    if st.button("📋 Weight Note Form"):
        st.switch_page("pages/1_Weight_Note.py")

with col2:
    if st.button("📊 PPC Form"):
        st.switch_page("pages/2_PPC_Form.py")

with col3:
    if st.button("🧊 FP Form"):
        st.switch_page("pages/3_FP_Form.py")
