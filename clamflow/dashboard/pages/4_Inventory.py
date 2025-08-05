# dashboard/pages/4_Inventory.py
import streamlit as st
import pandas as pd
from utils import require_role

# Enforce access
require_role(["Production Lead", "QC Staff"])

st.image("c:\\Users\\user\\Desktop\\Designs\\Logo\\Relish-3D.png", width=100)
st.title("📦 Inventory Dashboard")

# Inventory consists of approved FP Forms that have been saved to inventory
if 'fp_forms' in st.session_state:
    inventory = [f for f in st.session_state.fp_forms if f['Status'] == 'In Inventory']
else:
    inventory = []

if inventory:
    st.subheader("📦 Current Inventory")
    
    # Display inventory overview (without QR codes in table)
    display_inventory = []
    for item in inventory:
        display_item = item.copy()
        if "Package Labels" in display_item:
            display_item["Package Labels"] = f"{len(display_item['Package Labels'])} labeled packages"
        display_inventory.append(display_item)
    
    df = pd.DataFrame(display_inventory)
    st.dataframe(df, use_container_width=True)

    # Package Label Viewer - Show pre-generated labels from FP Form
    st.subheader("🏷️ Package Labels (Generated during FP Processing)")
    selected_item = st.selectbox("Select Item to View Package Labels", 
                                [f"{item['Form ID']} - {item['Process']} ({item['Packages']} packages)" for item in inventory])
    
    if selected_item:
        selected_form_id = selected_item.split(' - ')[0]
        selected_item_full = next(item for item in inventory if item["Form ID"] == selected_form_id)
        
        if "Package Labels" in selected_item_full and selected_item_full["Package Labels"]:
            st.info(f"📋 Displaying {len(selected_item_full['Package Labels'])} package labels that were generated during FP processing")
            
            # Display all package labels for the selected item
            for i, package_label in enumerate(selected_item_full["Package Labels"]):
                with st.expander(f"Package {i+1}: {package_label['Package ID']}"):
                    col1, col2, col3 = st.columns([1, 2, 1])
                    
                    with col1:
                        st.image("c:\\Users\\user\\Desktop\\Designs\\Logo\\Relish-3D.png", width=80)
                    
                    with col2:
                        st.markdown(f"""
                        **Relish Hao Hao Chi Foods**  
                        26/600 M O Ward, Alappuzha 688001  
                        **Package ID**: {package_label['Package ID']}  
                        **Lot ID**: {selected_item_full['Lot ID']}  
                        **Product**: {selected_item_full['PPC Form'].split(' ')[0] if selected_item_full['PPC Form'] else 'N/A'}  
                        **Process**: {selected_item_full['Process']}  
                        **Pack Size**: {selected_item_full['Pack Size']} kg  
                        **Best Before**: {pd.Timestamp.now() + pd.Timedelta(days=365):%Y-%m-%d}
                        """)
                    
                    with col3:
                        package_label["QR Code"].seek(0)
                        st.image(package_label["QR Code"], caption=f"Traceability QR", width=120)
                        st.caption(f"Trace URL: {package_label['Trace URL']}")
        else:
            st.warning("No package labels found for this item. Labels should have been generated during FP processing.")

    # Inventory Statistics
    st.subheader("📊 Inventory Statistics")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        total_items = len(inventory)
        st.metric("Total Inventory Items", total_items)
    
    with col2:
        total_packages = sum(item.get('Packages', 0) for item in inventory)
        st.metric("Total Packages", total_packages)
    
    with col3:
        total_weight = sum(item.get('Weight (kg)', 0) for item in inventory)
        st.metric("Total Weight (kg)", f"{total_weight:.1f}")

else:
    st.info("📦 No items in inventory yet. Items will appear here after FP Forms are approved and saved to inventory.")
    st.markdown("""
    ### Inventory Process Flow:
    1. **Production Staff** submits FP Form with package details
    2. **QR codes are generated** automatically for each package during FP processing
    3. **QC Staff** approves the FP Form
    4. **Production Lead** saves approved FP Form to inventory
    5. **Inventory displays** the pre-labeled packages with their QR codes
    
    💡 **Note**: QR codes are generated during the packaging process (FP Form), not in inventory management.
    """)
