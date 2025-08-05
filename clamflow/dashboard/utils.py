# dashboard/utils.py
import streamlit as st

def require_role(allowed_roles):
    """Enforce role-based access at the page level"""
    current_role = st.session_state.get('role')
    if not current_role:
        st.warning("🔒 Please log in.")
        st.stop()
    if current_role not in allowed_roles:
        st.error("🚫 You don't have permission to view this page.")
        st.info(f"You are logged in as: **{current_role}**")
        st.page_link("main.py", label="← Go to Dashboard Home")
        st.stop()

def get_current_user_role():
    """Get the current user's role from session state"""
    return st.session_state.get('role', '')

def can_submit_forms(role):
    """Check if role can submit forms"""
    return role == "Production Staff"

def can_approve_forms(role):
    """Check if role can approve/reject forms"""
    return role in ["QC Staff", "Production Lead"]

def can_manage_inventory(role):
    """Check if role can manage inventory"""
    return role in ["Production Lead", "QC Staff"]

def can_generate_reports(role):
    """Check if role can generate reports"""
    return role in ["Production Lead", "Admin"]

def can_onboard_entities(role):
    """Check if role can onboard new staff/suppliers/vendors"""
    return role in ["Staff Lead", "Admin"]

def can_approve_onboarding(role):
    """Check if role can approve onboarding requests"""
    return role == "Admin"

def render_approval_section(forms, form_type, status_key="Status", id_key="Form ID"):
    """Render approval/rejection interface for QC Staff and Production Lead"""
    current_role = get_current_user_role()
    
    if not can_approve_forms(current_role):
        return
    
    st.subheader("⚖️ QC Approval Actions")
    pending_forms = [form for form in forms if form[status_key] == "QC Pending"]
    
    if pending_forms:
        for form in pending_forms:
            with st.expander(f"Review {form_type}: {form[id_key]}"):
                # Display form details
                col1, col2, col3 = st.columns(3)
                
                # Show key form information
                with col1:
                    for key, value in list(form.items())[:3]:
                        if key not in [status_key, 'Timestamp', 'Remarks']:
                            st.write(f"**{key}:** {value}")
                
                with col2:
                    for key, value in list(form.items())[3:6]:
                        if key not in [status_key, 'Timestamp', 'Remarks']:
                            st.write(f"**{key}:** {value}")
                
                with col3:
                    # Approval buttons
                    if st.button(f"✅ Approve", key=f"approve_{form_type}_{form[id_key]}"):
                        # Update status (in production: API call)
                        form[status_key] = 'Approved'
                        st.success(f"{form_type} {form[id_key]} approved!")
                        st.rerun()
                    
                    remarks = st.text_area(f"Rejection Remarks", 
                                         key=f"remarks_{form_type}_{form[id_key]}", 
                                         placeholder="Enter reason for rejection...")
                    
                    if st.button(f"❌ Reject", key=f"reject_{form_type}_{form[id_key]}") and remarks:
                        # Update status (in production: API call)
                        form[status_key] = 'Rejected'
                        form['Remarks'] = remarks
                        st.warning(f"{form_type} {form[id_key]} rejected: {remarks}")
                        st.rerun()
    else:
        st.info(f"No {form_type}s pending QC approval.")

def get_api_base_url():
    """Get the API base URL based on environment"""
    import os
    # Priority: 
    # 1. Environment variable (production)
    # 2. Vercel URL (cloud deployment) 
    # 3. Localhost (development)
    
    # Check for environment variable first (production)
    api_url = os.getenv('API_BASE_URL')
    if api_url:
        return api_url
    
    # Check if running on Vercel
    vercel_url = os.getenv('VERCEL_URL')
    if vercel_url:
        return f"https://{vercel_url}"
    
    # Default to localhost for development
    return "http://localhost:8000" 
    # 3. Localhost fallback (development only)
    
    if os.getenv('API_BASE_URL'):
        return os.getenv('API_BASE_URL')
    elif os.getenv('VERCEL_URL'):
        return f"https://{os.getenv('VERCEL_URL')}"
    elif os.getenv('ENVIRONMENT') == 'development':
        return 'http://localhost:8000'  # Development only
    else:
        # Default production URL
        return 'https://clamflow-cloud.vercel.app'
    
    api_base = get_api_base_url()
    return api_base

def get_db():
    """Simulated DB access via session state"""
    return st.session_state
