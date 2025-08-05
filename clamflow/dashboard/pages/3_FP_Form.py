# dashboard/pages/3_FP_Form.py
import streamlit as st
import pandas as pd
import qrcode
from io import BytesIO
from utils import require_role

# Enforce access - Only Production Staff can submit FP Forms
require_role(["Production Staff"])

st.image("c:\\Users\\user\\Desktop\\Designs\\Logo\\Relish-3D.png", width=100)
st.title("🧊 Form 3: FP Form (Finished Product)")

# Get current user role
current_role = st.session_state.get('role', '')

# Simulated data
if 'ppc_forms' in st.session_state:
    ppc_options = [f"{f['Form ID']} ({f['Product']})" for f in st.session_state.ppc_forms if f['Status'] == 'Approved']
else:
    ppc_options = []

fp_processes = ["Freezing", "Drying", "Pasteurized", "Fresh Chilled"]
pack_sizes = {
    "Freezing": [5, 10, 20],
    "Drying": [2, 5, 10],
    "Pasteurized": [5, 10],
    "Fresh Chilled": [5, 10]
}

# Only Production Staff can submit forms
if current_role == "Production Staff":
    with st.form("fp_form"):
        col1, col2 = st.columns(2)
        with col1:
            ppc_form = st.selectbox("PPC Form Input", ppc_options)
            fp_process = st.selectbox("FP Process", fp_processes)
            pack_size = st.selectbox("Pack Size (kg)", pack_sizes[fp_process])
            final_weight = st.number_input("Final Weight (kg)", min_value=0.0, value=9.8)
            
            # Number of packages/boxes to be packed
            num_packages = st.number_input("Number of Packages/Boxes", min_value=1, value=1, step=1)
            
        with col2:
            staff = st.text_input("FP Staff", value="Nia Williams")
            qc_staff = st.text_input("QC Staff (Biometric)", value="Jens Peterson")
            trays = st.text_area("Tray RFID Tags", value="TRAY-001")
            
            # Lot ID for traceability QR codes
            lot_id = st.text_input("Lot ID for Traceability", value=f"LOT-{pd.Timestamp.now().strftime('%Y%m%d')}-001")

        submitted = st.form_submit_button("🏷️ Submit & Generate Package Labels")

    if submitted:
        tray_list = [t.strip() for t in trays.splitlines() if t.strip()]
        form_id = f"FP-{int(st.session_state.get('fp_counter', 201))}"
        
        # Generate QR codes for each package during FP Form submission
        package_labels = []
        for i in range(int(num_packages)):
            package_id = f"{form_id}-PKG-{i+1:03d}"
            qr_url = f"https://clamflow.com/trace/{lot_id}/{package_id}"
            
            # Generate QR Code for this package
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(qr_url)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white")
            
            # Store QR as base64 for the package label
            buf = BytesIO()
            qr_img.save(buf, 'PNG')
            buf.seek(0)
            
            package_labels.append({
                "Package ID": package_id,
                "QR Code": buf,
                "Trace URL": qr_url
            })
        
        new_fp = {
            "Form ID": form_id,
            "PPC Form": ppc_form,
            "Process": fp_process,
            "Pack Size": pack_size,
            "Weight (kg)": final_weight,
            "Packages": int(num_packages),
            "Package Labels": package_labels,  # QR codes generated at packaging time
            "Lot ID": lot_id,
            "Trays": len(tray_list),
            "Staff": staff,
            "QC": qc_staff,
            "Status": "QC Pending",
            "Timestamp": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M")
        }
        
        if 'fp_forms' not in st.session_state:
            st.session_state.fp_forms = []
        st.session_state.fp_forms.append(new_fp)
        st.session_state.fp_counter = st.session_state.get('fp_counter', 201) + 1
        
        st.success("✅ FP Form Submitted! Package labels with QR codes generated!")
        
        # Display generated package labels immediately
        st.subheader("🏷️ Generated Package Labels")
        for i, label in enumerate(package_labels):
            with st.expander(f"Package Label {i+1}: {label['Package ID']}"):
                col1, col2, col3 = st.columns([1, 2, 1])
                
                with col1:
                    st.image("c:\\Users\\user\\Desktop\\Designs\\Logo\\Relish-3D.png", width=80)
                
                with col2:
                    st.markdown(f"""
                    **Relish Hao Hao Chi Foods**  
                    26/600 M O Ward, Alappuzha 688001  
                    **Package ID**: {label['Package ID']}  
                    **Lot ID**: {lot_id}  
                    **Product**: {ppc_form.split(' ')[0] if ppc_form else 'N/A'}  
                    **Process**: {fp_process}  
                    **Pack Size**: {pack_size} kg  
                    **Best Before**: {pd.Timestamp.now() + pd.Timedelta(days=365):%Y-%m-%d}
                    """)
                
                with col3:
                    label["QR Code"].seek(0)
                    st.image(label["QR Code"], caption=f"QR: {label['Package ID']}", width=120)
                    st.caption(f"Trace: {label['Trace URL']}")

else:
    st.info("🔒 Only Production Staff can submit FP Forms.")

# Display recent forms (all roles can view)
if 'fp_forms' in st.session_state:
    st.subheader("🧊 Recent FP Forms")
    # Display without the QR Code column for table view
    display_forms = []
    for form in st.session_state.fp_forms:
        display_form = form.copy()
        if "Package Labels" in display_form:
            display_form["Package Labels"] = f"{len(display_form['Package Labels'])} labels generated"
        display_forms.append(display_form)
    
    df = pd.DataFrame(display_forms)
    st.dataframe(df, use_container_width=True)

    # QC Staff and Production Lead can approve/reject
    if current_role in ["QC Staff", "Production Lead"]:
        st.subheader("⚖️ QC Approval Actions")
        pending_forms = [form for form in st.session_state.fp_forms if form["Status"] == "QC Pending"]
        
        if pending_forms:
            for form in pending_forms:
                with st.expander(f"Review FP Form: {form['Form ID']}"):
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.write(f"**PPC Form:** {form['PPC Form']}")
                        st.write(f"**Process:** {form['Process']}")
                        st.write(f"**Pack Size:** {form['Pack Size']} kg")
                        st.write(f"**Packages:** {form['Packages']}")
                    with col2:
                        st.write(f"**Weight:** {form['Weight (kg)']} kg")
                        st.write(f"**Lot ID:** {form['Lot ID']}")
                        st.write(f"**Trays:** {form['Trays']}")
                        st.write(f"**Staff:** {form['Staff']}")
                    with col3:
                        if st.button(f"✅ Approve", key=f"approve_fp_{form['Form ID']}"):
                            # Update status in session state
                            for j, stored_form in enumerate(st.session_state.fp_forms):
                                if stored_form['Form ID'] == form['Form ID']:
                                    st.session_state.fp_forms[j]['Status'] = 'Approved'
                                    break
                            st.success(f"FP Form {form['Form ID']} approved!")
                            st.rerun()
                        
                        remarks = st.text_area(f"Rejection Remarks", key=f"remarks_fp_{form['Form ID']}", placeholder="Enter reason for rejection...")
                        if st.button(f"❌ Reject", key=f"reject_fp_{form['Form ID']}") and remarks:
                            # Update status in session state
                            for j, stored_form in enumerate(st.session_state.fp_forms):
                                if stored_form['Form ID'] == form['Form ID']:
                                    st.session_state.fp_forms[j]['Status'] = 'Rejected'
                                    st.session_state.fp_forms[j]['Remarks'] = remarks
                                    break
                            st.warning(f"FP Form {form['Form ID']} rejected: {remarks}")
                            st.rerun()
        else:
            st.info("No FP Forms pending QC approval.")

    # Production Lead can save to inventory from approved forms
    if current_role == "Production Lead":
        st.subheader("📦 Save to Inventory")
        approved_forms = [form for form in st.session_state.fp_forms if form["Status"] == "Approved"]
        
        if approved_forms:
            for form in approved_forms:
                if st.button(f"Save to Inventory: {form['Form ID']}", key=f"inventory_{form['Form ID']}"):
                    # Update status to indicate saved to inventory
                    for j, stored_form in enumerate(st.session_state.fp_forms):
                        if stored_form['Form ID'] == form['Form ID']:
                            st.session_state.fp_forms[j]['Status'] = 'In Inventory'
                            break
                    st.success(f"FP Form {form['Form ID']} with {form['Packages']} labeled packages saved to inventory!")
                    st.rerun()
        else:
            st.info("No approved FP Forms available to save to inventory.")
else:
    st.info("No FP Forms submitted yet.")
