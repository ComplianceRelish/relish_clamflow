# dashboard/pages/1_Weight_Note.py
import streamlit as st
import pandas as pd
from datetime import datetime
from utils import require_role

# Enforce access - Only Production Staff can submit Weight Notes
require_role(["Production Staff"])

st.image("c:\\Users\\user\\Desktop\\Designs\\Logo\\Relish-3D.png", width=100)
st.title("📋 Form 1: Weight Note (RM Receive)")

# Get current user role
current_role = st.session_state.get('role', '')

# Check if we're editing a rejected form
editing_form_id = st.session_state.get('editing_form', None)
editing_form_data = None

if editing_form_id:
    # Find the rejected form data
    if 'weight_notes' in st.session_state:
        for form in st.session_state.weight_notes:
            if form.get('Form ID') == editing_form_id and form.get('Status') == 'Rejected':
                editing_form_data = form
                break
    
    if editing_form_data:
        st.warning(f"🔄 **Resubmitting Rejected Form: {editing_form_id}**")
        st.error(f"**Previous Rejection Reason**: {editing_form_data.get('Remarks', 'No reason provided')}")
        st.info("Please correct the issues and resubmit the form.")
    else:
        # Clear editing state if form not found
        del st.session_state.editing_form
        st.rerun()

# Simulated data
suppliers = ["Boat A-001", "Boat B-002", "Agent: SeaSupply Co."]
vehicles = ["TN-1234", "KL-5678", "AP-9012"]

# Pre-fill form with previous data if editing
default_supplier = editing_form_data.get('Supplier', suppliers[0]) if editing_form_data else suppliers[0]
default_vehicle = editing_form_data.get('Vehicle', vehicles[0]) if editing_form_data else vehicles[0]
default_weight = editing_form_data.get('Weight (kg)', 1200.0) if editing_form_data else 1200.0
default_rm_staff = editing_form_data.get('Staff', "Anna James") if editing_form_data else "Anna James"
default_qc_staff = "Jens Peterson"

# Only Production Staff can submit forms
if current_role == "Production Staff":
    with st.form("weight_note_form"):
        col1, col2 = st.columns(2)
        with col1:
            supplier_idx = suppliers.index(default_supplier) if default_supplier in suppliers else 0
            supplier = st.selectbox("Supplier", suppliers, index=supplier_idx)
            vehicle_idx = vehicles.index(default_vehicle) if default_vehicle in vehicles else 0
            vehicle = st.selectbox("Vehicle Number", vehicles, index=vehicle_idx)
            net_weight = st.number_input("Net Weight (kg)", min_value=0.0, value=default_weight)
        with col2:
            rm_staff = st.text_input("RM Staff (Biometric Auth)", value=default_rm_staff)
            qc_staff = st.text_input("QC Staff (Biometric Auth)", value=default_qc_staff)

        submitted = st.form_submit_button("🔄 Resubmit Form" if editing_form_data else "Submit Form")

    if submitted:
        if editing_form_data:
            # Update the existing rejected form
            editing_form_data.update({
                "Supplier": supplier,
                "Vehicle": vehicle,
                "Weight (kg)": net_weight,
                "Staff": rm_staff,
                "QC": qc_staff,
                "Status": "QC Pending",
                "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "Remarks": "",  # Clear previous rejection reason
                "QC Action": ""  # Clear previous QC action
            })
            st.success(f"✅ Weight Note {editing_form_id} Resubmitted! Awaiting QC Approval")
            # Clear editing state
            del st.session_state.editing_form
        else:
            # Create new form
            new_entry = {
                "Form ID": f"WN-{int(datetime.now().timestamp())}",
                "Supplier": supplier,
                "Vehicle": vehicle,
                "Weight (kg)": net_weight,
                "Staff": rm_staff,
                "QC": qc_staff,
                "Status": "QC Pending",
                "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M")
            }
            # Store in session (in production: save to DB)
            if 'weight_notes' not in st.session_state:
                st.session_state.weight_notes = []
            st.session_state.weight_notes.append(new_entry)
            st.success("✅ Weight Note Submitted! Awaiting QC Approval")

else:
    st.info("🔒 Only Production Staff can submit Weight Notes.")

# Display recent entries (all roles can view)
if 'weight_notes' in st.session_state:
    st.subheader("📦 Recent Weight Notes")
    df = pd.DataFrame(st.session_state.weight_notes)
    st.dataframe(df, use_container_width=True)

    # QC Staff and Production Lead can approve/reject
    if current_role in ["QC Staff", "Production Lead"]:
        st.subheader("⚖️ QC Approval Actions")
        pending_notes = [note for note in st.session_state.weight_notes if note["Status"] == "QC Pending"]
        
        if pending_notes:
            for i, note in enumerate(pending_notes):
                with st.expander(f"Review Weight Note: {note['Form ID']}"):
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.write(f"**Supplier:** {note['Supplier']}")
                        st.write(f"**Vehicle:** {note['Vehicle']}")
                        st.write(f"**Weight:** {note['Weight (kg)']} kg")
                    with col2:
                        st.write(f"**Staff:** {note['Staff']}")
                        st.write(f"**QC:** {note['QC']}")
                        st.write(f"**Status:** {note['Status']}")
                    with col3:
                        if st.button(f"✅ Approve", key=f"approve_{note['Form ID']}"):
                            # Update status in session state
                            for j, stored_note in enumerate(st.session_state.weight_notes):
                                if stored_note['Form ID'] == note['Form ID']:
                                    st.session_state.weight_notes[j]['Status'] = 'Approved'
                                    break
                            st.success(f"Weight Note {note['Form ID']} approved!")
                            st.rerun()
                        
                        remarks = st.text_area(f"Rejection Remarks", key=f"remarks_{note['Form ID']}", placeholder="Enter reason for rejection...")
                        if st.button(f"❌ Reject", key=f"reject_{note['Form ID']}") and remarks:
                            # Update status in session state
                            for j, stored_note in enumerate(st.session_state.weight_notes):
                                if stored_note['Form ID'] == note['Form ID']:
                                    st.session_state.weight_notes[j]['Status'] = 'Rejected'
                                    st.session_state.weight_notes[j]['Remarks'] = remarks
                                    break
                            st.warning(f"Weight Note {note['Form ID']} rejected: {remarks}")
                            st.rerun()
        else:
            st.info("No Weight Notes pending QC approval.")
else:
    st.info("No Weight Notes submitted yet.")
