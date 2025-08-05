-- ClamFlow Onboarding System Database Schema
-- This creates the pending tables for Staff Lead onboarding workflow

-- Enable UUID extension (if using PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pending Staff Table (awaiting Admin approval)
CREATE TABLE IF NOT EXISTS pending_staff (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), -- SQLite UUID simulation
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    station TEXT,
    contact_number TEXT,
    biometric_template TEXT, -- Base64 encoded biometric data
    submitted_by TEXT, -- References staff.id (Staff Lead)
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_remarks TEXT,
    reviewed_by TEXT, -- References staff.id (Admin)
    reviewed_at DATETIME
);

-- Pending Suppliers Table (awaiting Admin approval)
CREATE TABLE IF NOT EXISTS pending_suppliers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    full_name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Boat Owner', 'Fishermen', etc.
    boat_reg_id TEXT,
    aadhar_number TEXT,
    gst_number TEXT,
    pan_number TEXT,
    bank_account_holder TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    bank_name TEXT,
    contact_number TEXT,
    biometric_template TEXT, -- Base64 encoded biometric data
    location_gps TEXT, -- GPS coordinates where onboarded
    submitted_by TEXT, -- References staff.id (Staff Lead)
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_remarks TEXT,
    reviewed_by TEXT, -- References staff.id (Admin)
    reviewed_at DATETIME
);

-- Pending Vendors Table (awaiting Admin approval)
CREATE TABLE IF NOT EXISTS pending_vendors (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    full_name TEXT NOT NULL,
    firm_name TEXT,
    gst_number TEXT,
    pan_number TEXT,
    bank_account_holder TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    bank_name TEXT,
    contact_number TEXT,
    category TEXT, -- Service category
    submitted_by TEXT, -- References staff.id (Staff Lead)
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_remarks TEXT,
    reviewed_by TEXT, -- References staff.id (Admin)
    reviewed_at DATETIME
);

-- Vendors Table (for approved vendors)
CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    full_name TEXT NOT NULL,
    firm_name TEXT,
    gst_number TEXT,
    pan_number TEXT,
    bank_account_holder TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    bank_name TEXT,
    contact_number TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    added_by TEXT, -- References staff.id (Admin)
    status TEXT DEFAULT 'active'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_staff_status ON pending_staff(status);
CREATE INDEX IF NOT EXISTS idx_pending_staff_submitted_by ON pending_staff(submitted_by);
CREATE INDEX IF NOT EXISTS idx_pending_suppliers_status ON pending_suppliers(status);
CREATE INDEX IF NOT EXISTS idx_pending_suppliers_submitted_by ON pending_suppliers(submitted_by);
CREATE INDEX IF NOT EXISTS idx_pending_vendors_status ON pending_vendors(status);
CREATE INDEX IF NOT EXISTS idx_pending_vendors_submitted_by ON pending_vendors(submitted_by);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);

-- Production Database - No Sample Data
-- Initialize with empty tables for production deployment

-- Comments and Documentation
/*
ONBOARDING WORKFLOW:

1. STAFF ONBOARDING:
   - Staff Lead opens mobile interface at PPC
   - Captures: Name, Role, Station, Contact, Biometric
   - Saves to pending_staff table with status='pending'
   - Admin receives notification
   - Admin approves -> moves to staff table
   - Admin rejects -> status='rejected' with reason

2. SUPPLIER ONBOARDING:
   - Staff Lead visits dock/beach with mobile device
   - Captures: Name, Type, Boat ID, Aadhar, Contact, Biometric, GPS
   - Saves to pending_suppliers table with status='pending'
   - Admin approves -> moves to suppliers table with ClamFlow ID
   - Admin rejects -> status='rejected' with reason

3. VENDOR ONBOARDING:
   - Staff Lead or Admin registers service providers
   - Captures: Name, Firm, GST/PAN, Bank details, Category
   - Saves to pending_vendors table with status='pending'
   - Admin approves -> moves to vendors table
   - Admin rejects -> status='rejected' with reason

SECURITY:
- Only Staff Lead can submit for approval
- Only Admin can approve/reject
- Biometric data encrypted as base64
- GPS location tracked for audit
- Complete audit trail maintained

MOBILE FEATURES:
- Camera integration for biometric capture
- GPS tagging for location tracking
- Offline mode with local storage
- Touch-optimized interface
*/
