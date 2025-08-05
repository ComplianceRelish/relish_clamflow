# dashboard/pages/2_PPC_Form.py
import streamlit as st
import pandas as pd
from utils import require_role

# Enforce access - Only Production Staff can submit PPC Forms
require_role(["Production Staff"])

st.image("c:\\Users\\user\\Desktop\\Designs\\Logo\\Relish-3D.png", width=100)
st.title("📦 Form 2: PPC Form (Processed Product)")

# Get current user role
current_role = st.session_state.get('role', '')

# Simulated data
lots = [f"LOT-PPC-20250525-{i:03d}" for i in range(1, 6)]
product_categories = ["Whole Clam", "Clam Meat"]
grades = {
    "Whole Clam": ["100/300", "300/500", "500/1000"],
    "Clam Meat": ["1000/3000", "3000/5000", "5000/8000"]
}

# Only Production Staff can submit forms
if current_role == "Production Staff":
    with st.form("ppc_form"):
        col1, col2 = st.columns(2)
        with col1:
            lot_id = st.selectbox("Select Lot", lots)
            category = st.radio("Product Category", product_categories)
            grade = st.selectbox("Grade", grades[category])
            weight = st.number_input("Weight After Processing (kg)", min_value=0.0, value=1100.0)
        with col2:
            staff = st.text_input("PPC Staff", value="Tomás López")
            qc_staff = st.text_input("QC Staff (Biometric)", value="Maya Chen")
            crates = st.text_area("RFID Crate Tags (one per line)", value="TAG-001\nTAG-002")

        submitted = st.form_submit_button("Submit")

    if submitted:
        crates_list = [tag.strip() for tag in crates.splitlines() if tag.strip()]
        new_form = {
            "Form ID": f"PPC-{int(st.session_state.get('ppc_counter', 101))}",
            "Lot ID": lot_id,
            "Product": f"{category} - {grade}",
            "Weight (kg)": weight,
            "Crates": len(crates_list),
            "Staff": staff,
            "QC": qc_staff,
            "Status": "QC Pending",
            "Timestamp": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M")
        }
        if 'ppc_forms' not in st.session_state:
            st.session_state.ppc_forms = []
        st.session_state.ppc_forms.append(new_form)
        st.session_state.ppc_counter = st.session_state.get('ppc_counter', 101) + 1
        st.success("✅ PPC Form Submitted! Awaiting QC Approval")

else:
    st.info("🔒 Only Production Staff can submit PPC Forms.")

# Display recent forms (all roles can view)
if 'ppc_forms' in st.session_state:
    st.subheader("📦 Recent PPC Forms")
    df = pd.DataFrame(st.session_state.ppc_forms)
    st.dataframe(df, use_container_width=True)

    # QC Staff and Production Lead can approve/reject
    if current_role in ["QC Staff", "Production Lead"]:
        st.subheader("⚖️ QC Approval Actions")
        pending_forms = [form for form in st.session_state.ppc_forms if form["Status"] == "QC Pending"]
        
        if pending_forms:
            for form in pending_forms:
                with st.expander(f"Review PPC Form: {form['Form ID']}"):
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.write(f"**Lot ID:** {form['Lot ID']}")
                        st.write(f"**Product:** {form['Product']}")
                        st.write(f"**Weight:** {form['Weight (kg)']} kg")
                    with col2:
                        st.write(f"**Crates:** {form['Crates']}")
                        st.write(f"**Staff:** {form['Staff']}")
                        st.write(f"**QC:** {form['QC']}")
                    with col3:
                        if st.button(f"✅ Approve", key=f"approve_ppc_{form['Form ID']}"):
                            # Update status in session state
                            for j, stored_form in enumerate(st.session_state.ppc_forms):
                                if stored_form['Form ID'] == form['Form ID']:
                                    st.session_state.ppc_forms[j]['Status'] = 'Approved'
                                    break
                            st.success(f"PPC Form {form['Form ID']} approved!")
                            st.rerun()
                        
                        remarks = st.text_area(f"Rejection Remarks", key=f"remarks_ppc_{form['Form ID']}", placeholder="Enter reason for rejection...")
                        if st.button(f"❌ Reject", key=f"reject_ppc_{form['Form ID']}") and remarks:
                            # Update status in session state
                            for j, stored_form in enumerate(st.session_state.ppc_forms):
                                if stored_form['Form ID'] == form['Form ID']:
                                    st.session_state.ppc_forms[j]['Status'] = 'Rejected'
                                    st.session_state.ppc_forms[j]['Remarks'] = remarks
                                    break
                            st.warning(f"PPC Form {form['Form ID']} rejected: {remarks}")
                            st.rerun()
        else:
            st.info("No PPC Forms pending QC approval.")

    # Production Lead can generate gate passes from approved forms
    if current_role == "Production Lead":
        st.subheader("🎫 Generate Gate Pass")
        approved_forms = [form for form in st.session_state.ppc_forms if form["Status"] == "Approved"]
        
        if approved_forms:
            for form in approved_forms:
                if st.button(f"Generate Gate Pass for {form['Form ID']}", key=f"gatepass_{form['Form ID']}"):
                    st.success(f"Gate Pass generated for PPC Form {form['Form ID']}!")
        else:
            st.info("No approved PPC Forms available for gate pass generation.")
else:
    st.info("No PPC Forms submitted yet.")

if 'ppc_forms' in st.session_state:
    st.subheader("📋 PPC Forms Submitted")
    df = pd.DataFrame(st.session_state.ppc_forms)
    st.dataframe(df, use_container_width=True)
