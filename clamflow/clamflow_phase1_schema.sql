-- clamflow_phase1_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    station TEXT,
    biometric_template TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES staff(id),
    status TEXT DEFAULT 'active'
);

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    type TEXT NOT NULL,
    address TEXT,
    contact_number TEXT,
    aadhar_number TEXT,
    gst_number TEXT,
    pan_number TEXT,
    bank_account_holder TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    bank_name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    added_by UUID REFERENCES staff(id),
    status TEXT DEFAULT 'active'
);

CREATE TABLE weight_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id),
    vehicle_number TEXT,
    net_weight_kg DECIMAL(10,2),
    rm_station_staff_id UUID REFERENCES staff(id),
    qc_staff_id UUID REFERENCES staff(id),
    qc_approved BOOLEAN DEFAULT FALSE,
    qc_remarks TEXT,
    qc_approved_at TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'pending_qc',
    lot_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id TEXT UNIQUE NOT NULL,
    weight_note_ids UUID[],
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES staff(id)
);

CREATE TABLE ppc_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id UUID REFERENCES lots(id),
    product_category TEXT,
    grade TEXT,
    weight_after_processing_kg DECIMAL(10,2),
    crate_rfid_tags TEXT[],
    ppc_station_staff_id UUID REFERENCES staff(id),
    qc_staff_id UUID REFERENCES staff(id),
    qc_approved BOOLEAN DEFAULT FALSE,
    qc_approved_at TIMESTAMP,
    supervisor_approved BOOLEAN DEFAULT FALSE,
    supervisor_approved_at TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'pending_qc',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fp_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ppc_form_id UUID REFERENCES ppc_forms(id),
    fp_process TEXT,
    pack_size_kg INT,
    final_weight_kg DECIMAL(10,2),
    tray_rfid_tags TEXT[],
    fp_station_staff_id UUID REFERENCES staff(id),
    qc_staff_id UUID REFERENCES staff(id),
    qc_approved BOOLEAN DEFAULT FALSE,
    qc_approved_at TIMESTAMP,
    supervisor_approved BOOLEAN DEFAULT FALSE,
    supervisor_approved_at TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'pending_qc',
    inventory_ready BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE qc_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id UUID,
    step_number INT NOT NULL,
    step_name TEXT NOT NULL,
    passed BOOLEAN,
    remarks TEXT,
    approved_by UUID REFERENCES staff(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(lot_id, step_number)
);

CREATE TABLE qc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id UUID,
    document_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES staff(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE roster_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    station TEXT NOT NULL,
    staff_id UUID REFERENCES staff(id),
    role TEXT NOT NULL,
    assigned_by UUID REFERENCES staff(id),
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, station)
);

CREATE TABLE config_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_type TEXT NOT NULL,
    setting_key TEXT,
    setting_value JSONB,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES staff(id),
    status TEXT DEFAULT 'active',
    biometric_auth TEXT NOT NULL,
    UNIQUE(setting_type, setting_key, version)
);