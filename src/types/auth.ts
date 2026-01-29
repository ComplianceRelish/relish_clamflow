// src/types/auth.ts - Fixed Type Definitions

// ✅ FIXED: UserRole now matches Supabase schema format (Title Case with spaces)
export type UserRole = 
  | 'Super Admin'
  | 'Admin'
  | 'Production Lead'
  | 'QC Lead'
  | 'Staff Lead'
  | 'QC Staff'
  | 'Production Staff'
  | 'Security Guard';

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  station?: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  // ✅ REMOVED: requires_password_change, first_login, plant_id, department, permissions
  // These are not in Supabase user_profiles schema
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;
  login: (username: string, password: string) => Promise<{
    success: boolean;
    error?: string;
    requiresPasswordChange?: boolean;
  }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  refreshToken: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
}

// Role Display Names (for UI)
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  'Super Admin': 'Super Admin',
  'Admin': 'Administrator',
  'Production Lead': 'Production Lead',
  'QC Lead': 'QC Lead',
  'Staff Lead': 'Staff Lead',
  'QC Staff': 'QC Staff',
  'Production Staff': 'Production Staff',
  'Security Guard': 'Security Guard',
};

// Role Hierarchy (for permission checking)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'Super Admin': 100,
  'Admin': 10,
  'Production Lead': 6,
  'QC Lead': 6,
  'Staff Lead': 5,
  'QC Staff': 4,
  'Production Staff': 3,
  'Security Guard': 2,
};

// Helper function to check if user has required role level
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

// Helper function to check if user has specific role
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  // Super Admin always has access
  if (userRole === 'Super Admin') return true;
  // Check if user's role is in allowed roles
  return allowedRoles.includes(userRole);
}

// Login Response Type
export interface LoginResponse {
  success: boolean;
  access_token?: string;
  user?: User;
  error?: string;
  requiresPasswordChange?: boolean;
}

// ============================================
// PERMISSION TYPES - Granular Permission System
// ============================================
export type Permission = 
  // RFID & Hardware
  | 'RFID_READ'
  | 'RFID_SCAN'
  | 'RFID_BATCH_SCAN'
  | 'RFID_CONTINUOUS_SCAN'
  | 'DEVICE_RFID_HANDOVER'      // Link RFID device to station staff
  
  // User & Staff Management
  | 'USER_VIEW'
  | 'USER_CREATE'
  | 'USER_EDIT'
  | 'USER_DELETE'
  | 'USER_APPROVE_ONBOARDING'   // Admin approval for new staff
  | 'STAFF_ONBOARD'             // Initiate staff onboarding (requires Admin approval)
  | 'STAFF_MANAGE_ABSENCE'      // Manage staff absences
  | 'STAFF_ACCESS_CONTROL'      // Control staff access permissions
  
  // Shift & Station Management
  | 'SHIFT_VIEW'
  | 'SHIFT_SCHEDULE_PRODUCTION' // Schedule Production Staff shifts
  | 'SHIFT_SCHEDULE_QC'         // Schedule QC Staff shifts
  | 'SHIFT_SCHEDULE_ALL'        // Schedule all staff shifts
  | 'STATION_ASSIGN_PRODUCTION' // Assign Production Staff to stations
  | 'STATION_ASSIGN_QC'         // Assign QC Staff to stations
  | 'STATION_ASSIGN_ALL'        // Assign any staff to stations
  
  // Lot & Inventory Management
  | 'LOT_VIEW'
  | 'LOT_CREATE'                // Create new lots
  | 'INVENTORY_VIEW'
  | 'INVENTORY_MANAGE'          // Manage inventory (add FP to inventory)
  
  // Form Approvals - Weight Notes & RM
  | 'WEIGHTNOTE_VIEW'
  | 'WEIGHTNOTE_CREATE'
  | 'WEIGHTNOTE_APPROVE'        // Approve Weight Notes (RM Station Forms)
  
  // Form Approvals - PPC Forms
  | 'PPC_FORM_VIEW'
  | 'PPC_FORM_CREATE'
  | 'PPC_FORM_SUBMIT'
  | 'PPC_FORM_APPROVE'          // Production Lead approves PPC → Gate Pass
  
  // Form Approvals - FP Forms
  | 'FP_FORM_VIEW'
  | 'FP_FORM_CREATE'
  | 'FP_FORM_SUBMIT'
  | 'FP_FORM_APPROVE'           // QC Lead approves FP Forms
  
  // Form Approvals - QC Forms (All types)
  | 'QC_FORM_VIEW'
  | 'QC_FORM_CREATE'
  | 'QC_FORM_SUBMIT'
  | 'QC_FORM_APPROVE'           // QC Lead approves ALL QC form submissions
  
  // Depuration & Testing
  | 'DEPURATION_SAMPLE_EXTRACT' // Extract depuration samples
  | 'DEPURATION_TEST'           // Test depuration samples
  | 'DEPURATION_REPORT_GENERATE'// Generate & upload depuration reports
  
  // Microbiology & FP Testing
  | 'FP_SAMPLE_EXTRACT'         // Extract FP samples (lot-wise)
  | 'MICROBIOLOGY_TEST'         // Test FP samples
  | 'MICROBIOLOGY_REPORT_UPLOAD'// Upload Microbiology Report (moves FP to Inventory)
  
  // Gate Pass & Security
  | 'GATE_PASS_VIEW'
  | 'GATE_PASS_GENERATE'        // Generate Gate Pass after PPC approval
  | 'GATE_PASS_VERIFY'          // Verify Gate Pass (Security)
  
  // Reports & Analytics
  | 'VIEW_REPORTS'
  | 'VIEW_PRODUCTION_REPORTS'
  | 'VIEW_QC_REPORTS'
  | 'EXPORT_DATA'
  
  // System & Admin
  | 'SYSTEM_SETTINGS'
  | 'AUDIT_VIEW'
  | 'NOTIFICATIONS_MANAGE';

// ============================================
// ROLE PERMISSIONS MAP - Comprehensive Role Definitions
// ============================================
// Lead Roles (Production Lead, QC Lead, Staff Lead) are THE CONTROLLERS
// ============================================

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // ============================================
  // SUPER ADMIN - Full System Access
  // ============================================
  'Super Admin': [
    // All RFID & Hardware
    'RFID_READ', 'RFID_SCAN', 'RFID_BATCH_SCAN', 'RFID_CONTINUOUS_SCAN', 'DEVICE_RFID_HANDOVER',
    // All User Management
    'USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE', 'USER_APPROVE_ONBOARDING',
    'STAFF_ONBOARD', 'STAFF_MANAGE_ABSENCE', 'STAFF_ACCESS_CONTROL',
    // All Shift & Station
    'SHIFT_VIEW', 'SHIFT_SCHEDULE_PRODUCTION', 'SHIFT_SCHEDULE_QC', 'SHIFT_SCHEDULE_ALL',
    'STATION_ASSIGN_PRODUCTION', 'STATION_ASSIGN_QC', 'STATION_ASSIGN_ALL',
    // All Lot & Inventory
    'LOT_VIEW', 'LOT_CREATE', 'INVENTORY_VIEW', 'INVENTORY_MANAGE',
    // All Form Approvals
    'WEIGHTNOTE_VIEW', 'WEIGHTNOTE_CREATE', 'WEIGHTNOTE_APPROVE',
    'PPC_FORM_VIEW', 'PPC_FORM_CREATE', 'PPC_FORM_SUBMIT', 'PPC_FORM_APPROVE',
    'FP_FORM_VIEW', 'FP_FORM_CREATE', 'FP_FORM_SUBMIT', 'FP_FORM_APPROVE',
    'QC_FORM_VIEW', 'QC_FORM_CREATE', 'QC_FORM_SUBMIT', 'QC_FORM_APPROVE',
    // All Testing & Reports
    'DEPURATION_SAMPLE_EXTRACT', 'DEPURATION_TEST', 'DEPURATION_REPORT_GENERATE',
    'FP_SAMPLE_EXTRACT', 'MICROBIOLOGY_TEST', 'MICROBIOLOGY_REPORT_UPLOAD',
    // All Gate Pass
    'GATE_PASS_VIEW', 'GATE_PASS_GENERATE', 'GATE_PASS_VERIFY',
    // All Reports & System
    'VIEW_REPORTS', 'VIEW_PRODUCTION_REPORTS', 'VIEW_QC_REPORTS', 'EXPORT_DATA',
    'SYSTEM_SETTINGS', 'AUDIT_VIEW', 'NOTIFICATIONS_MANAGE',
  ],

  // ============================================
  // ADMIN - System Administration (with approval authority)
  // ============================================
  'Admin': [
    'RFID_READ', 'RFID_SCAN', 'RFID_BATCH_SCAN', 'DEVICE_RFID_HANDOVER',
    'USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_APPROVE_ONBOARDING',
    'STAFF_MANAGE_ABSENCE', 'STAFF_ACCESS_CONTROL',
    'SHIFT_VIEW', 'SHIFT_SCHEDULE_ALL', 'STATION_ASSIGN_ALL',
    'LOT_VIEW', 'LOT_CREATE', 'INVENTORY_VIEW', 'INVENTORY_MANAGE',
    'WEIGHTNOTE_VIEW', 'WEIGHTNOTE_APPROVE',
    'PPC_FORM_VIEW', 'PPC_FORM_APPROVE',
    'FP_FORM_VIEW', 'FP_FORM_APPROVE',
    'QC_FORM_VIEW', 'QC_FORM_APPROVE',
    'GATE_PASS_VIEW', 'GATE_PASS_GENERATE',
    'VIEW_REPORTS', 'VIEW_PRODUCTION_REPORTS', 'VIEW_QC_REPORTS', 'EXPORT_DATA',
    'SYSTEM_SETTINGS', 'AUDIT_VIEW', 'NOTIFICATIONS_MANAGE',
  ],

  // ============================================
  // PRODUCTION LEAD - Production Unit Controller
  // ============================================
  // Responsibilities:
  // 1. Staff Onboarding (with Admin approval) - ALL ClamFlow Staff
  // 2. Shift Scheduling for Production Staff
  // 3. Station Assignment & Device RFID Handover
  // 4. Staff Management (Absence, Access Control)
  // 5. Approve Weight Notes (RM Station Forms) & Create Lots
  // 6. Approve PPC Form & Generate Gate Pass
  // 7. Production Monitoring & Reports
  // ============================================
  'Production Lead': [
    // RFID & Hardware
    'RFID_READ', 'RFID_SCAN', 'RFID_BATCH_SCAN', 'DEVICE_RFID_HANDOVER',
    
    // Staff Onboarding & Management (ALL Staff - requires Admin approval)
    'STAFF_ONBOARD',              // Initiate onboarding for Production, QC & Security staff
    'STAFF_MANAGE_ABSENCE',       // Manage absences for production staff
    'STAFF_ACCESS_CONTROL',       // Control access for production staff
    
    // Shift Scheduling (Production Staff only)
    'SHIFT_VIEW',
    'SHIFT_SCHEDULE_PRODUCTION',  // Schedule Production Staff shifts
    
    // Station Assignment (Production Staff only)
    'STATION_ASSIGN_PRODUCTION',  // Assign Production Staff to stations
    
    // Lot Management
    'LOT_VIEW',
    'LOT_CREATE',                 // Create lots from approved Weight Notes
    
    // Weight Note Approval
    'WEIGHTNOTE_VIEW',
    'WEIGHTNOTE_APPROVE',         // Approve RM Station Forms (Weight Notes)
    
    // PPC Form Approval & Gate Pass
    'PPC_FORM_VIEW',
    'PPC_FORM_APPROVE',           // Approve PPC Forms after QC Staff approval
    'GATE_PASS_VIEW',
    'GATE_PASS_GENERATE',         // Generate Gate Pass after PPC approval
    
    // View QC Forms (read-only for oversight)
    'QC_FORM_VIEW',
    'FP_FORM_VIEW',
    
    // Inventory View (read-only - notified when FP moves to inventory)
    'INVENTORY_VIEW',
    
    // Reports & Monitoring
    'VIEW_REPORTS',
    'VIEW_PRODUCTION_REPORTS',
    'EXPORT_DATA',
  ],

  // ============================================
  // QC LEAD (QA - Quality Assurance) - QC Unit Controller
  // ============================================
  // Responsibilities:
  // 1. Shift Scheduling & Station Assignment for QC Staff
  // 2. Approve ALL QC Form Submissions
  // 3. Extract Depuration Samples (or designate QC Staff), Test & Generate Report
  // 4. Extract FP Samples (Lot-wise), Test & Upload Microbiology Report
  //    → This moves FP to Inventory with notifications to Production Lead, Admin, Super Admin
  // ============================================
  'QC Lead': [
    // RFID & Hardware
    'RFID_READ', 'RFID_SCAN', 'RFID_BATCH_SCAN',
    
    // Shift Scheduling (QC Staff only)
    'SHIFT_VIEW',
    'SHIFT_SCHEDULE_QC',          // Schedule QC Staff shifts
    
    // Station Assignment (QC Staff only)
    'STATION_ASSIGN_QC',          // Assign QC Staff to stations
    
    // ALL QC Form Approvals
    'QC_FORM_VIEW',
    'QC_FORM_APPROVE',            // Approve ALL QC form submissions
    'FP_FORM_VIEW',
    'FP_FORM_APPROVE',            // Approve FP Forms
    'PPC_FORM_VIEW',              // View PPC Forms (first-level QC approval)
    
    // Weight Note View (for QC reference)
    'WEIGHTNOTE_VIEW',
    
    // Depuration Testing & Reports
    'DEPURATION_SAMPLE_EXTRACT',  // Extract or designate QC Staff to extract
    'DEPURATION_TEST',            // Test depuration samples
    'DEPURATION_REPORT_GENERATE', // Generate & upload depuration reports
    
    // Microbiology Testing & Reports
    'FP_SAMPLE_EXTRACT',          // Extract FP samples (lot-wise)
    'MICROBIOLOGY_TEST',          // Test FP samples
    'MICROBIOLOGY_REPORT_UPLOAD', // Upload report → moves FP to Inventory
    
    // Inventory Management (FP → Inventory with notifications)
    'INVENTORY_VIEW',
    'INVENTORY_MANAGE',           // Add tested FP to inventory
    
    // Lot View (for lot-wise testing)
    'LOT_VIEW',
    
    // Reports & Monitoring
    'VIEW_REPORTS',
    'VIEW_QC_REPORTS',
    'EXPORT_DATA',
    
    // Notifications
    'NOTIFICATIONS_MANAGE',       // Send notifications to Production Lead, Admin, Super Admin
  ],

  // ============================================
  // STAFF LEAD - Non-Production/QC Staff Controller
  // ============================================
  // Manages staff functions OUTSIDE Production & QC areas
  // (Attendance, general staff coordination, security staff)
  // ============================================
  'Staff Lead': [
    'RFID_READ',
    'USER_VIEW',
    'SHIFT_VIEW',
    'SHIFT_SCHEDULE_ALL',         // Can schedule security and general staff
    'STAFF_MANAGE_ABSENCE',       // Manage absences for non-production/QC staff
    'VIEW_REPORTS',
    'GATE_PASS_VIEW',             // View gate passes for coordination
  ],

  // ============================================
  // QC STAFF - Quality Control Worker
  // ============================================
  'QC Staff': [
    'RFID_READ', 'RFID_SCAN',
    'SHIFT_VIEW',
    
    // QC Form Operations
    'QC_FORM_VIEW',
    'QC_FORM_CREATE',
    'QC_FORM_SUBMIT',             // Submit for QC Lead approval
    
    // FP Form Operations
    'FP_FORM_VIEW',
    'FP_FORM_CREATE',
    'FP_FORM_SUBMIT',
    
    // Weight Note Operations
    'WEIGHTNOTE_VIEW',
    'WEIGHTNOTE_CREATE',          // Create weight notes at RM stations
    
    // Depuration (when designated by QC Lead)
    'DEPURATION_SAMPLE_EXTRACT',  // Extract samples when designated
    
    // View Only
    'LOT_VIEW',
    'VIEW_REPORTS',
  ],

  // ============================================
  // PRODUCTION STAFF - Production Worker
  // ============================================
  'Production Staff': [
    'RFID_READ',
    'SHIFT_VIEW',
    
    // PPC Form Operations
    'PPC_FORM_VIEW',
    'PPC_FORM_CREATE',
    'PPC_FORM_SUBMIT',            // Submit for QC Staff → Production Lead approval
    
    // FP Form Operations
    'FP_FORM_VIEW',
    'FP_FORM_CREATE',
    'FP_FORM_SUBMIT',
    
    // View Only
    'LOT_VIEW',
    'WEIGHTNOTE_VIEW',
    'VIEW_REPORTS',
  ],

  // ============================================
  // SECURITY GUARD - Gate & Access Control
  // ============================================
  'Security Guard': [
    'RFID_READ',
    'GATE_PASS_VIEW',
    'GATE_PASS_VERIFY',           // Verify gate passes at checkpoints
    'SHIFT_VIEW',
  ],
};

// Check if user has specific permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

// ✅ REMOVED: toApiRole function - not needed since role is already in correct format