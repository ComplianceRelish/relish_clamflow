# ClamFlow Hardware Reference

**Merged from**: `ClamFlow_Hardware_Management_Assessment.md` + `HARDWARE_CONFIGURATION_REQUIREMENTS.md`  
**Assessment date**: September 16, 2025 | **Config spec date**: January 23, 2026  
**Last Updated**: June 18, 2026

---

## 1. Device Types

| Device Type | Purpose | Station(s) |
|-------------|---------|------------|
| RFID Reader | Track clam lots, employee badges, supplier ID, containers | Gate, All Stations |
| Industrial Scale | Weight notes — incoming/outgoing clam batches | Weight, FP Station |
| Barcode/QR Scanner | Lot tracking, container ID, label scanning | All Stations |
| Temperature Sensor | Depuration tanks, cold storage monitoring | Depuration, Storage |
| pH Meter | Water quality in depuration tanks | Depuration |
| IP Camera | QC inspection, security, face recognition | Security, QC, Gate |
| Biometric Scanner | Employee attendance (fingerprint/face) | Gate, All Stations |
| Label Printer | Lot labels, weight note receipts, QC reports | Weight, PPC, FP, QC |
| Tablet/Terminal | Station data entry devices | All Stations |
| Environmental Sensor | Humidity, air quality, ammonia levels | Processing Floor |
| PLC Controller | Conveyor, sorting equipment automation | Production Line |
| Network Gateway | Bridge legacy devices to network | Server Room |

---

## 2. Configuration Fields

### 2.1 Basic Info

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `device_name` | string | Yes | e.g. "Scale-WS-01" |
| `device_type` | enum | Yes | See device types above |
| `serial_number` | string | Yes | Manufacturer serial |
| `manufacturer` | string | No | e.g. "Mettler Toledo", "Zebra" |
| `model` | string | No | Device model number |
| `station_location` | enum | Yes | Gate, Weight, PPC, Depuration, FP, QC, Storage |
| `description` | string | No | Additional notes |

### 2.2 Network / Connection

| Field | Type | Condition |
|-------|------|-----------|
| `connection_type` | enum | USB / Serial / RS485 / Ethernet / WiFi / Bluetooth / Modbus |
| `ip_address` | string | Network devices |
| `port` | number | Network devices |
| `com_port` | string | Serial devices (COM1, COM2…) |
| `baud_rate` | enum | Serial (9600 / 19200 / 38400 / 57600 / 115200) |
| `data_bits` | enum | Serial (7 or 8) |
| `parity` | enum | Serial (None / Even / Odd) |
| `stop_bits` | enum | Serial (1 or 2) |
| `protocol` | enum | HTTP / HTTPS / MQTT / Modbus TCP / Modbus RTU / WebSocket |

### 2.3 Device-Specific Fields

**Scales**: `capacity_kg`, `precision_g`, `units`, `tare_enabled`, `calibration_date`, `calibration_due`, `stable_reading_delay_ms`  
**RFID**: `frequency` (LF/HF/UHF), `power_level_dbm`, `read_range_m`, `antenna_count`, `multi_tag_reading`  
**Sensors**: `min_threshold`, `max_threshold`, `sampling_interval_sec`, `alert_on_threshold`, `calibration_date`  
**Cameras**: `resolution` (720p/1080p/4K), `frame_rate`, `stream_url`, `recording_enabled`, `motion_detection`  
**Printers**: `paper_size` (4×6/4×3/A4/Custom), `print_density`, `label_format`, `auto_cut`

### 2.4 Operational Settings

| Field | Default | Notes |
|-------|---------|-------|
| `status` | — | online / offline / maintenance / error |
| `enabled` | true | Enable/disable device |
| `polling_interval_ms` | 1000 | How often to poll |
| `timeout_ms` | 5000 | Connection timeout |
| `retry_count` | 3 | Retry attempts on failure |
| `auto_reconnect` | — | Auto-reconnect on disconnect |

### 2.5 Maintenance

| Field | Required | Notes |
|-------|----------|-------|
| `installation_date` | Yes | When device was installed |
| `firmware_version` | No | Current firmware |
| `last_maintenance` | No | Last maintenance date |
| `next_maintenance` | No | Scheduled maintenance |
| `warranty_expiry` | No | Warranty end date |
| `maintenance_notes` | No | Maintenance history |

---

## 3. Access Control Architecture

### Two Access Models

| Category | Examples | Access Model | Station Binding |
|----------|----------|-------------|-----------------|
| **Data Entry Devices** | Tablets, PCs, Phones | RBAC only (user login controls access) | ❌ Not bound |
| **Production Devices** | Scales, RFID, Sensors, Printers | Device Registry + RBAC (device AND user must be authorized) | ✅ Station-bound |

**Data entry devices**: The USER is authenticated, not the device. Same tablet can be used by different staff across shifts and stations.

**Production devices**: Both device and user must be authorized. Prevents employees using personal/uncalibrated equipment — critical for food safety compliance.

### Production Device Validation Flow

```
User → Connect Scale → Browser reads serial/vendor IDs
     → POST /api/devices/validate
     → Backend checks: in registry? approved? assigned to this station? user role permitted?
     → APPROVED: enable + log | NOT_REGISTERED: block + alert admin | REVOKED: show error
```

### Browser APIs (No Drivers Required)

| Connection | Browser API | Use Case |
|-----------|-------------|----------|
| USB | WebUSB | Scales, printers, scanners |
| Serial/COM | WebSerial | Industrial scales, legacy devices |
| Bluetooth | Web Bluetooth | Portable scales, handheld scanners |
| WiFi/LAN | HTTP / WebSocket | IP cameras, network sensors, PLCs |
| RS485 | Via Gateway | Industrial PLCs, sensors |

---

## 4. Backend API Requirements

### Device CRUD
```
GET    /api/admin/hardware/devices          - List all devices
GET    /api/admin/hardware/devices/:id      - Get device by ID
POST   /api/admin/hardware/devices          - Create device
PUT    /api/admin/hardware/devices/:id      - Update device
DELETE /api/admin/hardware/devices/:id      - Delete device
```

### Device Operations
```
POST   /api/admin/hardware/devices/:id/test      - Test connection
POST   /api/admin/hardware/devices/:id/reboot    - Reboot device
POST   /api/admin/hardware/devices/:id/calibrate - Trigger calibration
GET    /api/admin/hardware/devices/:id/status    - Real-time status
GET    /api/admin/hardware/devices/:id/logs      - Device logs
GET    /api/admin/hardware/stats                 - System overview stats
GET    /api/admin/hardware/health                - All device health
```

### Device Validation (during connection)
```
POST   /api/devices/validate    - Check registry + RBAC before enabling device
```

### Create Device — Request Body Example
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
  "capacity_kg": 500,
  "precision_g": 10,
  "units": "kg",
  "enabled": true,
  "installation_date": "2024-01-15"
}
```

---

## 5. Database Schema

```sql
CREATE TABLE registered_devices (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_name       VARCHAR(100) NOT NULL,
    device_type       VARCHAR(50) NOT NULL,
    serial_number     VARCHAR(100) UNIQUE NOT NULL,
    vendor_id         VARCHAR(10),          -- WebUSB matching
    product_id        VARCHAR(10),
    manufacturer      VARCHAR(100),
    model             VARCHAR(100),
    station_id        UUID REFERENCES stations(id),
    station_location  VARCHAR(100),
    status            VARCHAR(20) DEFAULT 'pending',  -- pending/approved/revoked/maintenance
    is_active         BOOLEAN DEFAULT true,
    allowed_roles     TEXT[] DEFAULT ARRAY['Admin'],
    registered_by     UUID REFERENCES users(id),
    registered_at     TIMESTAMP DEFAULT NOW(),
    approved_by       UUID REFERENCES users(id),
    approved_at       TIMESTAMP,
    last_connected_at TIMESTAMP,
    last_connected_by UUID REFERENCES users(id),
    connection_count  INTEGER DEFAULT 0,
    configuration     JSONB DEFAULT '{}',
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_devices_serial ON registered_devices(serial_number);
CREATE INDEX idx_devices_vendor_product ON registered_devices(vendor_id, product_id);
CREATE INDEX idx_devices_station ON registered_devices(station_id);

CREATE TABLE device_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(50) NOT NULL,  -- connected/disconnected/reading/error/config_changed
    event_timestamp TIMESTAMP DEFAULT NOW(),
    device_id       UUID REFERENCES registered_devices(id),
    device_serial   VARCHAR(100),
    device_type     VARCHAR(50),
    user_id         UUID REFERENCES users(id),
    username        VARCHAR(100),
    user_role       VARCHAR(50),
    station_id      UUID,
    station_name    VARCHAR(100),
    ip_address      INET,
    reading_value   DECIMAL,
    reading_unit    VARCHAR(20),
    lot_id          VARCHAR(100),
    event_data      JSONB,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 6. Frontend Component Status

| Component | Location | Status |
|-----------|----------|--------|
| `HardwareManagementPanel.tsx` | `src/components/dashboards/admin/` | ✅ Exists (769 lines) |
| `HardwareConfig.tsx` | `src/components/hardware/` | ✅ Exists |
| `DeviceRegistry.tsx` | `src/components/hardware/` | ✅ Exists |
| `FaceCapture.tsx` | `src/components/hardware/` | ✅ Exists |
| `PassiveDetect.tsx` | `src/components/hardware/` | ✅ Exists |
| `HardwareTest.tsx` | `src/components/hardware/` | ✅ Exists |
| `ClamFlowSecure.tsx` | `src/components/integrations/` | ✅ Exists (404 lines) |
| `RFIDScanner.tsx` | `src/components/integrations/` | ✅ Exists (450+ lines) |
| `RFIDHardwareManager.tsx` | `src/components/integrations/` | ✅ Exists (500+ lines) |
| `QRLabelGenerator.tsx` | `src/components/integrations/` | ✅ Exists |
| `DeviceForm.tsx` — device-type-specific fields | — | 🆕 Needs update |
| WebUSB/WebSerial service layer | — | 🆕 To create |
| Audit Log UI | — | 🆕 To create |
| Backend Endpoints | — | ❌ Return 404/500 currently |

---

## 7. Admin Controls

| Feature | API Endpoint |
|---------|-------------|
| Register device (pre-register by serial #) | `POST /api/admin/devices` |
| Approve pending device | `PUT /api/admin/devices/:id/approve` |
| Revoke device access | `PUT /api/admin/devices/:id/revoke` |
| Assign to station | `PUT /api/admin/devices/:id/assign` |
| Set role permissions | `PUT /api/admin/devices/:id/permissions` |
| View connection history | `GET /api/admin/devices/:id/usage` |
| Full audit trail | `GET /api/admin/devices/:id/audit` |
| Alert settings | `PUT /api/admin/devices/alerts` |

---

## 8. Next Steps (Pending)

**Frontend team:**
- Create WebUSB/WebSerial service with device validation against backend
- Create Device Registry UI for Admin
- Update HardwareManagementPanel with device-type-specific config fields
- Build Audit Log UI

**Backend team:**
- Implement `registered_devices` table and CRUD endpoints
- Implement `POST /api/devices/validate` endpoint
- Implement device audit logging

---

*Document consolidated June 18, 2026*
