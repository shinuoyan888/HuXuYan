import streamlit as st
import pandas as pd
import numpy as np
import folium
from streamlit_folium import st_folium
import time

# ---------------------------------------------------------
# 1. Page Configuration
# ---------------------------------------------------------
st.set_page_config(
    page_title="Best Bike Paths (BBP)",
    page_icon="🚲",
    layout="wide"
)

# ---------------------------------------------------------
# 2. Sidebar Controls
# ---------------------------------------------------------
st.sidebar.title("🚲 BBP Control Panel")
st.sidebar.info("Best Bike Paths System\nRoad Defect Detection (RDD)")

# Mode Selection
app_mode = st.sidebar.selectbox(
    "Select Function",
    ["Home", "Live Map & Routing", "Sensor Data Simulation"]
)

# Simulation Settings
st.sidebar.markdown("---")
st.sidebar.subheader("Simulation Settings")
sensitivity = st.sidebar.slider("Sensor Sensitivity", 1, 10, 5)

# ---------------------------------------------------------
# 3. Helper Functions
# ---------------------------------------------------------
def get_sensor_data():
    """Simulate accelerometer data (X, Y, Z) for the phone sensor."""
    # Simulate normal road vibration (low noise)
    x = np.random.normal(0, 0.1, 100)
    y = np.random.normal(0, 0.1, 100)
    z = np.random.normal(1, 0.1, 100) # Gravity ~1g
    
    # Randomly insert "Pothole" data (vibration peaks)
    if np.random.random() > 0.7:
        z[50:55] += np.random.normal(2, 0.5, 5) # Simulate a bump
        
    return pd.DataFrame({"Time": range(100), "Acc_X": x, "Acc_Y": y, "Acc_Z": z})

# ---------------------------------------------------------
# 4. Main Page Logic
# ---------------------------------------------------------

# === Home Page ===
if app_mode == "Home":
    st.title("🚲 Welcome to Best Bike Paths (BBP)")
    st.markdown("""
    ### Project Overview
    This application helps cyclists find the safest and smoothest routes.
    
    **Key Features:**
    * **Automatic Mode**: Detects road defects (potholes) using mobile sensors.
    * **Live Map**: Visualizes safe paths and reported hazards.
    * **Data Analysis**: Analyzes road quality data.
    
    *Developed for Assignment RDD.*
    """)
    # Display a relevant image
    st.image("https://images.unsplash.com/photo-1541625602330-2277a4c46182?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80", caption="Safe Cycling", use_column_width=True)

# === Live Map & Routing Mode ===
elif app_mode == "Live Map & Routing":
    st.title("🗺️ Live Navigation & Pothole Map")
    
    col1, col2 = st.columns([3, 1])
    
    with col1:
        # Create map, centered on Milan (Project Location)
        m = folium.Map(location=[45.4642, 9.1900], zoom_start=13)
        
        # Simulate some Pothole Markers (Red)
        potholes = [
            [45.4650, 9.1905, "Severe Pothole"],
            [45.4620, 9.1880, "Bumpy Road"],
            [45.4700, 9.1950, "Construction Work"]
        ]
        
        for lat, lon, desc in potholes:
            folium.Marker(
                [lat, lon],
                popup=desc,
                icon=folium.Icon(color="red", icon="exclamation-sign")
            ).add_to(m)
            
        # Simulate a Safe Route (Green Line)
        route_coords = [
            [45.4642, 9.1900],
            [45.4660, 9.1920],
            [45.4680, 9.1910],
            [45.4700, 9.1950]
        ]
        folium.PolyLine(route_coords, color="green", weight=5, opacity=0.8, tooltip="Safe Route").add_to(m)

        # Display the map in Streamlit
        st_folium(m, width=800, height=500)
        
    with col2:
        st.subheader("Route Info")
        st.success("✅ Safe Route Found")
        st.metric(label="Distance", value="3.2 km")
        st.metric(label="Est. Time", value="12 mins")
        st.warning(f"⚠️ {len(potholes)} Hazards Detected nearby")

# === Sensor Simulation Mode ===
elif app_mode == "Sensor Data Simulation":
    st.title("📱 Accelerometer Sensor Simulation")
    st.write("Simulating phone sensor data to detect road quality (Automatic Mode).")
    
    if st.button("Start Recording Ride"):
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        chart_placeholder = st.empty()
        
        # Simulate live data stream loop
        for i in range(100):
            # Generate new dummy data
            data = get_sensor_data()
            
            # Check for Potholes (Threshold detection)
            max_z = data["Acc_Z"].max()
            if max_z > (1.0 + (sensitivity/10.0)): 
                status_text.error(f"⚠️ POTHOLE DETECTED! (Impact: {max_z:.2f}g)")
            else:
                status_text.success("Road Condition: Smooth")
            
            # Update the chart dynamically
            chart_placeholder.line_chart(data[["Acc_X", "Acc_Y", "Acc_Z"]])
            
            time.sleep(0.05)
            progress_bar.progress(i + 1)
            
        st.button("Stop Recording")

# ---------------------------------------------------------
# Footer
# ---------------------------------------------------------
st.markdown("---")
st.caption("© 2026 Best Bike Paths Team. Deployed via Streamlit Community Cloud.")
