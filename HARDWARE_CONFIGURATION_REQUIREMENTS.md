# ClamFlow Hardware Configuration Requirements

## Overview

This document defines the hardware device configuration requirements for the ClamFlow Processing Plant application. The Admin Dashboard includes a Hardware Management Panel that allows administrators to add, configure, and manage various hardware devices used throughout the clam processing workflow.

---

## 1. Device Types in ClamFlow

| Device Type | Purpose | Stations Used |
|-------------|---------|---------------|
| **RFID Reader** | Track clam lots, employee badges, supplier ID cards, container tracking | Gate, All Stations |
| **Industrial Scale** | Weight notes - measuring incoming/outgoing clam batches | Weight Station, FP Station |
| **Barcode/QR Scanner** | Lot tracking, container identification, label scanning | All Stations |
| **Temperature Sensor** | Depuration tank monitoring, cold storage temperature | Depuration, Storage |
| **pH Meter** | Water quality monitoring in depuration tanks | Depuration Station |
| **IP Camera** | QC inspection, security surveillance, face recognition | Security, QC, Gate |
| **Biometric Scanner** | Employee attendance (fingerprint/face recognition) | Gate, All Stations |
| **Label Printer** | Print lot labels, weight note receipts, QC reports | Weight, PPC, FP, QC |
| **Tablet/Terminal** | Station devices for data entry by operators | All Stations |
| **Environmental Sensor** | Humidity, air quality, ammonia levels | Processing Floor |
| **PLC Controller** | Automated conveyor, sorting equipment control | Production Line |
| **Network Gateway** | Bridge between legacy devices and network | Server Room |

---

## 2. Configuration Fields Required

### 2.1 Basic Device Information

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `device_name` | string | Yes | Human-readable device name (e.g., "Scale-WS-01") |
| `device_type` | enum | Yes | One of the device types listed above |
| `serial_number` | string | Yes | Manufacturer serial number |
| `manufacturer` | string | No | Device manufacturer (e.g., "Mettler Toledo", "Zebra") |
| `model` | string | No | Device model number |
| `station_location` | enum | Yes | Assigned station (Gate, Weight, PPC, Depuration, FP, QC, Storage) |
| `description` | string | No | Additional notes about the device |

### 2.2 Network/Connection Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `connection_type` | enum | Yes | USB, Serial/RS232, RS485, Ethernet, WiFi, Bluetooth, Modbus |
| `ip_address` | string | Conditional | Required for network devices |
| `subnet_mask` | string | Conditional | Network subnet (default: 255.255.255.0) |
| `gateway` | string | Conditional | Network gateway IP |
| `port` | number | Conditional | TCP/UDP port for network communication |
| `mac_address` | string | No | Device MAC address |
| `com_port` | string | Conditional | COM1, COM2, etc. for serial devices |
| `baud_rate` | enum | Conditional | 9600, 19200, 38400, 57600, 115200 for serial |
| `data_bits` | enum | Conditional | 7 or 8 for serial |
| `parity` | enum | Conditional | None, Even, Odd for serial |
| `stop_bits` | enum | Conditional | 1 or 2 for serial |
| `protocol` | enum | No | HTTP, HTTPS, MQTT, Modbus TCP, Modbus RTU, WebSocket |

### 2.3 Device-Specific Configuration

#### Scales
| Field | Type | Description |
|-------|------|-------------|
| `capacity_kg` | number | Maximum weight capacity |
| `precision_g` | number | Measurement precision in grams |
| `units` | enum | kg, lb, g |
| `tare_enabled` | boolean | Auto-tare functionality |
| `calibration_date` | date | Last calibration date |
| `calibration_due` | date | Next calibration due |
| `stable_reading_delay_ms` | number | Delay for stable reading |

#### RFID Readers
| Field | Type | Description |
|-------|------|-------------|
| `frequency` | enum | LF (125kHz), HF (13.56MHz), UHF (860-960MHz) |
| `power_level_dbm` | number | Transmission power |
| `read_range_m` | number | Maximum read range |
| `antenna_count` | number | Number of antennas |
| `multi_tag_reading` | boolean | Support for multiple tags |

#### Temperature/pH Sensors
| Field | Type | Description |
|-------|------|-------------|
| `min_threshold` | number | Minimum acceptable value |
| `max_threshold` | number | Maximum acceptable value |
| `sampling_interval_sec` | number | How often to read |
| `alert_on_threshold` | boolean | Trigger alert on breach |
| `calibration_date` | date | Last calibration |

#### Cameras
| Field | Type | Description |
|-------|------|-------------|
| `resolution` | enum | 720p, 1080p, 4K |
| `frame_rate` | number | FPS |
| `stream_url` | string | RTSP/HTTP stream URL |
| `recording_enabled` | boolean | Enable recording |
| `motion_detection` | boolean | Motion detection enabled |

#### Printers
| Field | Type | Description |
|-------|------|-------------|
| `paper_size` | enum | 4x6, 4x3, A4, Custom |
| `print_density` | number | DPI setting |
| `label_format` | string | ZPL/EPL template reference |
| `auto_cut` | boolean | Auto-cut after print |

### 2.4 Operational Settings

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum | Yes | online, offline, maintenance, error |
| `enabled` | boolean | Yes | Device enabled/disabled |
| `polling_interval_ms` | number | No | How often to poll device (default: 1000) |
| `timeout_ms` | number | No | Connection timeout (default: 5000) |
| `retry_count` | number | No | Retry attempts on failure (default: 3) |
| `auto_reconnect` | boolean | No | Auto-reconnect on disconnect |

### 2.5 Maintenance Information

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `installation_date` | date | Yes | When device was installed |
| `firmware_version` | string | No | Current firmware |
| `last_maintenance` | date | No | Last maintenance date |
| `next_maintenance` | date | No | Scheduled maintenance |
| `warranty_expiry` | date | No | Warranty end date |
| `maintenance_notes` | string | No | Maintenance history/notes |

### 2.6 Integration Settings

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `linked_station_id` | uuid | No | Associated station in system |
| `linked_process` | enum | No | weight_note, ppc, fp, qc, depuration, gate |
| `api_endpoint` | string | No | Custom API endpoint if device has REST API |
| `api_key` | string | No | API authentication key |
| `webhook_url` | string | No | Webhook for device events |

---

## 3. Device Drivers

### 3.1 Do We Need Device Drivers?

**Yes, device drivers may be required depending on the connection type:**

| Connection Type | Driver Required? | Where Installed? |
|-----------------|------------------|------------------|
| **USB** | Yes | On the computer/server connecting to device |
| **Serial/RS232** | Usually No | USB-to-Serial adapters need drivers on host |
| **Ethernet/WiFi** | No | Device communicates via network protocols |
| **Bluetooth** | Yes | On the connecting computer |
| **Modbus** | No | Software protocol, no driver needed |

### 3.2 Driver Installation Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    DRIVER INSTALLATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. IDENTIFY DEVICE                                          │
│     └── Check device type, manufacturer, model               │
│                                                              │
│  2. DOWNLOAD DRIVER                                          │
│     └── From manufacturer website or Windows Update          │
│         • Mettler Toledo: mt.com/drivers                     │
│         • Zebra: zebra.com/drivers                          │
│         • Honeywell: honeywellaidc.com/support              │
│                                                              │
│  3. INSTALL ON HOST MACHINE                                  │
│     └── The server/computer that connects to the device     │
│         • NOT installed in ClamFlow app itself              │
│         • Requires admin privileges on host OS              │
│                                                              │
│  4. CONFIGURE IN CLAMFLOW                                    │
│     └── Add device in Hardware Management Panel              │
│         • Select connection type                             │
│         • Enter COM port or IP address                       │
│         • Test connection                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 ClamFlow's Role

ClamFlow does **NOT** install device drivers. ClamFlow communicates with devices through:

1. **Serial/COM Ports** - Reading data from COM ports (driver must be pre-installed)
2. **Network APIs** - HTTP/HTTPS REST calls to device endpoints
3. **WebSocket** - Real-time data streaming from network devices
4. **MQTT** - IoT message broker for sensor data
5. **Modbus TCP/RTU** - Industrial protocol for PLCs and sensors

### 3.4 Admin Instructions for Driver Installation

**The Admin must:**

1. **Obtain drivers** from the device manufacturer's website
2. **Install drivers** on the Windows server/computer connected to the device
3. **Note the COM port** or verify IP address after installation
4. **Configure the device** in ClamFlow Hardware Management Panel
5. **Test the connection** using the "Test Connection" button

---

## 4. Backend API Requirements

The Backend must implement the following endpoints:

### 4.1 Hardware Device CRUD

```
GET    /api/admin/hardware/devices          - List all devices
GET    /api/admin/hardware/devices/:id      - Get device by ID
POST   /api/admin/hardware/devices          - Create new device
PUT    /api/admin/hardware/devices/:id      - Update device
DELETE /api/admin/hardware/devices/:id      - Delete device
```

### 4.2 Device Operations

```
POST   /api/admin/hardware/devices/:id/test       - Test connection
POST   /api/admin/hardware/devices/:id/reboot     - Reboot device
POST   /api/admin/hardware/devices/:id/calibrate  - Trigger calibration
GET    /api/admin/hardware/devices/:id/status     - Get real-time status
GET    /api/admin/hardware/devices/:id/logs       - Get device logs
```

### 4.3 Hardware Statistics

```
GET    /api/admin/hardware/stats            - Get hardware overview stats
GET    /api/admin/hardware/health           - Get health of all devices
```

### 4.4 Request/Response Examples

**Create Device Request:**
```json
{
  "device_name": "Scale-WS-01",
  "device_type": "scale",
  "serial_number": "MT-2024-001234",
  "manufacturer": "Mettler Toledo",
  "model": "IND570",
  "station_location": "weight_station",
  "connection_type": "serial",
  "com_port": "COM3",
  "baud_rate": 9600,
  "data_bits": 8,
  "parity": "none",
  "stop_bits": 1,
  "capacity_kg": 500,
  "precision_g": 10,
  "units": "kg",
  "polling_interval_ms": 500,
  "timeout_ms": 3000,
  "enabled": true,
  "installation_date": "2024-01-15"
}
```

**Device Response:**
```json
{
  "id": "uuid-here",
  "device_name": "Scale-WS-01",
  "device_type": "scale",
  "status": "online",
  "last_reading": {
    "value": 125.5,
    "unit": "kg",
    "timestamp": "2024-01-23T10:30:00Z"
  },
  "health_metrics": {
    "uptime_percentage": 99.5,
    "last_error": null,
    "connection_quality": "excellent"
  }
}
```

---

## 5. Frontend Component Structure

```
src/components/dashboards/admin/
├── HardwareManagementPanel.tsx    # Main panel with device list
├── DeviceForm.tsx                 # Add/Edit device form
├── DeviceDetails.tsx              # Device detail view
├── DeviceTestConnection.tsx       # Connection testing modal
└── DeviceTypeConfigs/
    ├── ScaleConfig.tsx            # Scale-specific fields
    ├── RFIDConfig.tsx             # RFID-specific fields
    ├── SensorConfig.tsx           # Sensor-specific fields
    ├── PrinterConfig.tsx          # Printer-specific fields
    └── CameraConfig.tsx           # Camera-specific fields
```

---

## 6. Device Access Control & Security Architecture

### 6.1 Device Categories

ClamFlow uses **two distinct access control models** based on device category:

| Category | Examples | Access Control | Station Binding | Registration |
|----------|----------|----------------|-----------------|--------------|
| **Data Entry Devices** | Tablets, PCs, Mobile Phones | **RBAC only** | ❌ Not bound - can use at any station | Optional (for asset tracking) |
| **Production Devices** | Scales, RFID Readers, Sensors, Printers | Device Registry + RBAC | ✅ Station-bound | **Required** |

### 6.2 Data Entry Devices (Tablets, PCs, Phones)

**Philosophy:** The USER is authenticated, not the device. RBAC controls what the user can do.

**Why this approach:**
- Tablets/phones are used by multiple staff across different stations
- Staff may move between stations during a shift
- User login already provides identity and role
- Over-registering data entry devices creates unnecessary friction

**Access Control Flow:**
```
┌──────────────────────────────────────────────────────────────────┐
│              DATA ENTRY DEVICE ACCESS FLOW                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   User opens ClamFlow on Tablet/Phone/PC                         │
│              │                                                    │
│              ▼                                                    │
│   ┌─────────────────────┐                                        │
│   │   Login Screen      │                                        │
│   │   Username/Password │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                    │
│              ▼                                                    │
│   ┌─────────────────────┐    ┌────────────────────────────────┐  │
│   │  Backend validates  │───▶│  Returns: user role, station   │  │
│   │  credentials        │    │  permissions, allowed features │  │
│   └──────────┬──────────┘    └────────────────────────────────┘  │
│              │                                                    │
│              ▼                                                    │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                    RBAC CONTROLS                         │    │
│   │                                                          │    │
│   │  • Which stations user can access                        │    │
│   │  • Which forms user can view/create/approve              │    │
│   │  • Which production devices user can connect             │    │
│   │  • Which reports user can generate                       │    │
│   │                                                          │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│   📱 Same tablet can be used by:                                 │
│      • Morning shift: John (Production Staff) → Weight Station   │
│      • Afternoon shift: Jane (QC Staff) → QC Station             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Optional Device Registration:**
Data entry devices CAN be registered for:
- Asset tracking (which tablets does company own)
- Device inventory management
- MDM (Mobile Device Management) integration
- Loss/theft tracking

But registration is **NOT required for ClamFlow access**.

### 6.3 Production Devices (Scales, RFID, Sensors)

**Philosophy:** Both DEVICE and USER must be authorized. Prevents unauthorized hardware.

**Why this approach:**
- Prevents employees bringing personal scales (fraud risk)
- Ensures calibrated/approved equipment is used
- Creates audit trail linking readings to specific devices
- Compliance requirement for food processing

**Security Model:**
```
┌──────────────────────────────────────────────────────────────────┐
│           PRODUCTION DEVICE ACCESS FLOW                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User logged into ClamFlow + Clicks "Connect Scale"             │
│              │                                                    │
│              ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Browser prompts: "ClamFlow wants to connect to a device"│     │
│  │  User selects device from list                           │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           │                                       │
│              ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  1. Read device identifiers (serial#, vendor ID)         │     │
│  │  2. Send to backend: /api/devices/validate               │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           │                                       │
│              ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Backend checks:                                          │     │
│  │  ✓ Is device in registry?                                │     │
│  │  ✓ Is device status = approved?                          │     │
│  │  ✓ Is device assigned to THIS station?                   │     │
│  │  ✓ Does user's ROLE have permission for this device type?│     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           │                                       │
│       ┌───────────────────┼───────────────────┐                   │
│       ▼                   ▼                   ▼                   │
│   APPROVED            NOT REGISTERED      NO PERMISSION           │
│   Enable device       Block + Alert       Show error              │
│   Log connection      Admin               "Contact Admin"         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 Connection Types & Browser APIs

| Connection Type | Browser API | Use Case | Driver Required? |
|-----------------|-------------|----------|------------------|
| **USB** | WebUSB | Scales, printers, scanners | No |
| **Serial/RS232** | WebSerial | Industrial scales, legacy devices | No |
| **Bluetooth** | Web Bluetooth | Portable scales, handheld scanners | No |
| **WiFi/Ethernet** | HTTP/WebSocket | IP cameras, network sensors, PLCs | No |
| **RS485/Modbus** | Via Gateway | Industrial sensors, PLCs | Gateway needed |

### 6.5 Network Device Integration (WiFi/Ethernet)

Network devices don't connect through browser APIs. They're accessed via their IP address:

```typescript
// Network device connection - different from USB/Serial
interface NetworkDeviceConfig {
  ip_address: string;
  port: number;
  protocol: 'http' | 'https' | 'websocket' | 'mqtt' | 'modbus_tcp';
  auth?: {
    username?: string;
    password?: string;
    api_key?: string;
  };
}

// Example: IP Camera stream
const cameraUrl = `http://${device.ip_address}/stream`;

// Example: Temperature sensor reading via HTTP
const reading = await fetch(`http://${device.ip_address}/api/temperature`);

// Example: MQTT sensor subscription
mqttClient.subscribe(`sensors/${device.id}/readings`);
```

```sql
CREATE TABLE registered_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Device Identity
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    vendor_id VARCHAR(10),           -- USB Vendor ID for WebUSB matching
    product_id VARCHAR(10),          -- USB Product ID
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    
    -- Assignment
    station_id UUID REFERENCES stations(id),
    station_location VARCHAR(100),
    
    -- Access Control
    status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, revoked, maintenance
    is_active BOOLEAN DEFAULT true,
    allowed_roles TEXT[] DEFAULT ARRAY['Admin'],
    
    -- Registration
    registered_by UUID REFERENCES users(id),
    registered_at TIMESTAMP DEFAULT NOW(),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Usage Tracking
    last_connected_at TIMESTAMP,
    last_connected_by UUID REFERENCES users(id),
    connection_count INTEGER DEFAULT 0,
    
    -- Configuration (JSONB for device-specific settings)
    configuration JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for quick lookup during device connection
CREATE INDEX idx_devices_serial ON registered_devices(serial_number);
CREATE INDEX idx_devices_vendor_product ON registered_devices(vendor_id, product_id);
CREATE INDEX idx_devices_station ON registered_devices(station_id);
```

### 6.4 Device Connection Validation Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    DEVICE CONNECTION VALIDATION FLOW                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────┐     ┌──────────────────┐     ┌───────────────────────┐  │
│  │   DEVICE    │     │    BROWSER       │     │      BACKEND          │  │
│  │  (Hardware) │     │  (ClamFlow App)  │     │    (API Server)       │  │
│  └──────┬──────┘     └────────┬─────────┘     └───────────┬───────────┘  │
│         │                     │                           │               │
│         │  1. Connect USB/    │                           │               │
│         │     Serial          │                           │               │
│         ├────────────────────▶│                           │               │
│         │                     │                           │               │
│         │                     │  2. Read Device Info      │               │
│         │                     │     (Serial#, VendorID)   │               │
│         │                     │◀──────────────────────────│               │
│         │                     │                           │               │
│         │                     │  3. POST /api/devices/    │               │
│         │                     │     validate              │               │
│         │                     ├──────────────────────────▶│               │
│         │                     │                           │               │
│         │                     │                           │  4. Check     │
│         │                     │                           │     Registry  │
│         │                     │                           │     + RBAC    │
│         │                     │                           │               │
│         │                     │  5. Response:             │               │
│         │                     │     {status, permissions} │               │
│         │                     │◀──────────────────────────│               │
│         │                     │                           │               │
│         │                     │  6a. IF approved:         │               │
│         │                     │      Enable device        │               │
│         │                     │      Log connection       │               │
│         │                     │                           │               │
│         │                     │  6b. IF not_registered:   │               │
│         │                     │      Block device         │               │
│         │                     │      Alert Admin          │               │
│         │                     │                           │               │
│         │                     │  6c. IF revoked:          │               │
│         │                     │      Show error           │               │
│         │                     │      Disconnect           │               │
│         │                     │                           │               │
└─────────┴─────────────────────┴───────────────────────────┴───────────────┘
```

### 6.5 Device Usage Audit Log

Every device interaction is logged:

```sql
CREATE TABLE device_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Info
    event_type VARCHAR(50) NOT NULL,  -- connected, disconnected, reading, error, config_changed
    event_timestamp TIMESTAMP DEFAULT NOW(),
    
    -- Device Info
    device_id UUID REFERENCES registered_devices(id),
    device_serial VARCHAR(100),
    device_type VARCHAR(50),
    
    -- User Info
    user_id UUID REFERENCES users(id),
    username VARCHAR(100),
    user_role VARCHAR(50),
    
    -- Location Info
    station_id UUID,
    station_name VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    
    -- Event Data
    event_data JSONB,  -- Contains reading values, errors, etc.
    
    -- For readings
    reading_value DECIMAL,
    reading_unit VARCHAR(20),
    lot_id VARCHAR(100),
    
    -- Indexing
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_device ON device_audit_log(device_id, event_timestamp);
CREATE INDEX idx_audit_user ON device_audit_log(user_id, event_timestamp);
CREATE INDEX idx_audit_station ON device_audit_log(station_id, event_timestamp);
CREATE INDEX idx_audit_type ON device_audit_log(event_type, event_timestamp);
```

### 6.6 Audit Log Entry Examples

**Device Connected:**
```json
{
    "event_type": "connected",
    "device_serial": "MT-001234",
    "device_type": "scale",
    "user_id": "user-123",
    "username": "john.operator",
    "user_role": "Production Staff",
    "station_name": "Weight Station 1",
    "ip_address": "192.168.1.50",
    "event_data": {
        "connection_method": "WebSerial",
        "browser": "Chrome 120",
        "validation_result": "approved"
    }
}
```

**Weight Reading Recorded:**
```json
{
    "event_type": "reading",
    "device_serial": "MT-001234",
    "device_type": "scale",
    "user_id": "user-123",
    "username": "john.operator",
    "station_name": "Weight Station 1",
    "reading_value": 125.50,
    "reading_unit": "kg",
    "lot_id": "LOT-2026-001234",
    "event_data": {
        "weight_note_id": "wn-uuid",
        "supplier_id": "supplier-uuid",
        "tare_weight": 2.5,
        "gross_weight": 128.0,
        "net_weight": 125.5
    }
}
```

**Unauthorized Device Detected:**
```json
{
    "event_type": "unauthorized_attempt",
    "device_serial": "UNKNOWN-123",
    "device_type": "scale",
    "user_id": "user-456",
    "username": "jane.staff",
    "station_name": "Weight Station 1",
    "event_data": {
        "vendor_id": "0x1234",
        "product_id": "0x5678",
        "action_taken": "blocked",
        "admin_notified": true
    }
}
```

### 6.7 Admin Controls

| Feature | Description | API Endpoint |
|---------|-------------|--------------|
| **Register Device** | Pre-register device by serial number | `POST /api/admin/devices` |
| **Approve Device** | Approve pending device registration | `PUT /api/admin/devices/:id/approve` |
| **Revoke Access** | Disable device immediately | `PUT /api/admin/devices/:id/revoke` |
| **Assign Station** | Bind device to station(s) | `PUT /api/admin/devices/:id/assign` |
| **Set Permissions** | Define which roles can use device | `PUT /api/admin/devices/:id/permissions` |
| **View Usage** | See device connection history | `GET /api/admin/devices/:id/usage` |
| **View Audit Log** | Full audit trail | `GET /api/admin/devices/:id/audit` |
| **Alert Settings** | Configure alerts for unauthorized attempts | `PUT /api/admin/devices/alerts` |

### 6.8 WebUSB/WebSerial Browser API

ClamFlow uses modern browser APIs for driverless device access:

**WebUSB** - For USB devices (scales, scanners, printers)
```javascript
// Request device access
const device = await navigator.usb.requestDevice({
    filters: [{ vendorId: 0x1234 }]
});

// Get device identifiers for validation
const serialNumber = device.serialNumber;
const vendorId = device.vendorId;
const productId = device.productId;
```

**WebSerial** - For serial/COM port devices
```javascript
// Request serial port access
const port = await navigator.serial.requestPort();
const info = port.getInfo();

// Get port identifiers
const vendorId = info.usbVendorId;
const productId = info.usbProductId;
```

### 6.9 Security Considerations

| Risk | Mitigation |
|------|------------|
| Unauthorized device connection | Whitelist validation before enabling |
| Device spoofing | Cross-reference serial + vendor + product IDs |
| Data tampering | All readings signed with device + user + timestamp |
| Session hijacking | Device must be re-validated on each session |
| Offline attacks | Devices only work when backend reachable |

---

## 7. Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| HardwareManagementPanel.tsx | ✅ Exists | Needs proper field configuration |
| DeviceForm.tsx | ✅ Exists | Needs device-specific fields |
| DeviceRegistry.tsx | 🆕 To Create | Admin UI for device whitelist |
| WebUSB/WebSerial Service | 🆕 To Create | Browser device access layer |
| Backend Endpoints | ❌ Not Implemented | Returns 404/500 errors |
| Device Type Configs | ❌ Not Implemented | Need to create |
| Connection Testing | ❌ Not Implemented | Need backend support |
| Audit Log UI | ❌ Not Implemented | Need to create |

---

## 8. Next Steps

1. **Frontend Team**: 
   - Create WebUSB/WebSerial service with device validation
   - Create Device Registry UI for Admin
   - Update HardwareManagementPanel with proper fields

2. **Backend Team**: 
   - Implement device registry table and CRUD endpoints
   - Implement device validation endpoint
   - Implement audit logging

3. **DevOps**: 
   - Document supported device vendor/product IDs
   - Create device compatibility matrix

4. **QA**: 
   - Test with physical devices
   - Verify audit logging completeness

---

*Document Version: 2.0*  
*Last Updated: January 23, 2026*  
*Author: ClamFlow Development Team*
