# dashboard/pages/6_Admin_Reports.py
import streamlit as st
import pandas as pd
from utils import require_role

# Enforce access
require_role(["Admin"])

st.title("📊 Admin & Accounts Reports")

# Attendance Report
st.subheader("👥 Attendance Records")
if 'attendance_log' not in st.session_state:
    st.session_state.attendance_log = [
        {"Staff": "Anna James", "Station": "PPC-Packer", "In-Time": "06:32", "Status": "Present"},
        {"Staff": "Jens Peterson", "Station": "QC-RM", "In-Time": "06:28", "Status": "Present"}
    ]
df_att = pd.DataFrame(st.session_state.attendance_log)
st.dataframe(df_att)

# Supplier Payments
st.subheader("💰 Raw Material Supplied (For Payment)")
if 'weight_notes' in st.session_state:
    df_sup = pd.DataFrame(st.session_state.weight_notes)
    df_sup['Rate (₹/kg)'] = 80
    df_sup['Total (₹)'] = df_sup['Weight (kg)'] * df_sup['Rate (₹/kg)']
    st.dataframe(df_sup[['Supplier', 'Weight (kg)', 'Rate (₹/kg)', 'Total (₹)', 'Status']])

# Vendor Usage
st.subheader("🔧 Vendor Services Utilized")
vendor_data = [
    {"Vendor": "SeaSupply Co.", "Service": "Cleaning Chemicals", "Date": "2025-05-24", "Amount": "₹12,000"},
    {"Vendor": "ColdChain Logistics", "Service": "Transport", "Date": "2025-05-24", "Amount": "₹8,500"}
]
st.dataframe(pd.DataFrame(vendor_data))

# Export Buttons
st.download_button("📥 Export All Reports (CSV)", "data:text/csv;charset=utf-8," + df_att.to_csv(index=False))
