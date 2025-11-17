// src/types/auth.ts - Fixed Type Definitions

// ✅ FIXED: UserRole now matches AuthContext format (Title Case with spaces)
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
  requires_password_change?: boolean;
  first_login?: boolean;
  plant_id?: string;
  department?: string;
  permissions?: string[];
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
  'Security Guard': 'Security Guard'
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
  'Security Guard': 2
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

// Permission Types
export type Permission = 
  | 'RFID_READ'
  | 'RFID_SCAN'
  | 'RFID_BATCH_SCAN'
  | 'RFID_CONTINUOUS_SCAN'
  | 'USER_CREATE'
  | 'USER_EDIT'
  | 'USER_DELETE'
  | 'FORM_APPROVE'
  | 'FORM_REJECT'
  | 'SYSTEM_SETTINGS'
  | 'VIEW_REPORTS'
  | 'EXPORT_DATA';

// Role Permissions Map
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'Super Admin': [
    'RFID_READ',
    'RFID_SCAN',
    'RFID_BATCH_SCAN',
    'RFID_CONTINUOUS_SCAN',
    'USER_CREATE',
    'USER_EDIT',
    'USER_DELETE',
    'FORM_APPROVE',
    'FORM_REJECT',
    'SYSTEM_SETTINGS',
    'VIEW_REPORTS',
    'EXPORT_DATA'
  ],
  'Admin': [
    'RFID_READ',
    'RFID_SCAN',
    'RFID_BATCH_SCAN',
    'USER_CREATE',
    'USER_EDIT',
    'FORM_APPROVE',
    'FORM_REJECT',
    'SYSTEM_SETTINGS',
    'VIEW_REPORTS',
    'EXPORT_DATA'
  ],
  'Production Lead': [
    'RFID_READ',
    'RFID_SCAN',
    'VIEW_REPORTS',
    'EXPORT_DATA'
  ],
  'QC Lead': [
    'RFID_READ',
    'RFID_SCAN',
    'RFID_BATCH_SCAN',
    'FORM_APPROVE',
    'FORM_REJECT',
    'VIEW_REPORTS',
    'EXPORT_DATA'
  ],
  'Staff Lead': [
    'RFID_READ',
    'VIEW_REPORTS'
  ],
  'QC Staff': [
    'RFID_READ',
    'RFID_SCAN',
    'VIEW_REPORTS'
  ],
  'Production Staff': [
    'RFID_READ',
    'VIEW_REPORTS'
  ],
  'Security Guard': [
    'RFID_READ'
  ]
};

// Check if user has specific permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

// ✅ ADD THIS - Convert role format (not needed since already in correct format)
export function toApiRole(role: UserRole): UserRole {
  // Role is already in correct Title Case format
  return role;
}