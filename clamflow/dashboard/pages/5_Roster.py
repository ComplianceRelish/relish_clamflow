# dashboard/pages/5_Roster.py
import streamlit as st
import pandas as pd
from datetime import datetime, time
from utils import require_role

# Enforce access
require_role(["Production Lead", "Admin"])

st.title("📅 Roster & Station Assignments")

staff_list = ["Anna James", "Tomás López", "Nia Williams", "Jens Peterson", "Maya Chen"]
stations = ["RM Station", "PPC-Packer", "FP-Freeze", "QC-RM", "QC-PPC", "QC-FP"]

if 'roster' not in st.session_state:
    st.session_state.roster = []

with st.form("roster_form"):
    date = st.date_input("Date", value=datetime.now().date())
    shift_start = st.time_input("Shift Start", value=time(6, 0))
    shift_end = st.time_input("Shift End", value=time(14, 0))

    st.subheader("Assign Staff")
    assignments = []
    for station in stations:
        assigned = st.selectbox(f"{station}", [""] + staff_list, key=station)
        if assigned:
            assignments.append({"Station": station, "Staff": assigned})

    submitted = st.form_submit_button("Save Roster")

if submitted:
    for a in assignments:
        record = {
            "Date": date,
            "Shift": f"{shift_start} – {shift_end}",
            "Station": a["Station"],
            "Staff": a["Staff"],
            "Assigned By": st.session_state.get('role', 'Admin')
        }
        st.session_state.roster.append(record)
    st.success("✅ Roster Saved!")

if st.session_state.roster:
    st.subheader("📋 Current Roster")
    df = pd.DataFrame(st.session_state.roster)
    st.dataframe(df, use_container_width=True)
