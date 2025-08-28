// Authentication Types - Enhanced for ClamFlow Backend Integration

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'Super Admin' | 'Admin' | 'Production Lead' | 'QC Lead' | 'Staff Lead' | 'QC Staff' | 'Production Staff' | 'Security Guard';
  station?: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  password_reset_required?: boolean;
  login_attempts?: number;
}

// Legacy compatibility - export User as UserProfile
export type UserProfile = User;

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithFace: (imageFile: File) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

// Role types
export type UserRole = User['role'];

// Role-based permissions
export interface RolePermissions {
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canViewAuditLogs: boolean;
  canManageSystem: boolean;
  canApproveOnboarding: boolean;
  canAccessReports: boolean;
  canManageHardware: boolean;
}

// Module access levels
export type ModuleAccess = 
  | 'super_admin'
  | 'admin_panel' 
  | 'production_forms'
  | 'quality_control'
  | 'hr_management'
  | 'gate_control'
  | 'reports'
  | 'hardware_management';

export const DEFAULT_ROLE_PERMISSIONS: Record<User['role'], RolePermissions> = {
  'Super Admin': {
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewAuditLogs: true,
    canManageSystem: true,
    canApproveOnboarding: true,
    canAccessReports: true,
    canManageHardware: true,
  },
  'Admin': {
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: false,
    canViewAuditLogs: true,
    canManageSystem: false,
    canApproveOnboarding: true,
    canAccessReports: true,
    canManageHardware: true,
  },
  'Production Lead': {
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAuditLogs: false,
    canManageSystem: false,
    canApproveOnboarding: false,
    canAccessReports: true,
    canManageHardware: false,
  },
  'QC Lead': {
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAuditLogs: false,
    canManageSystem: false,
    canApproveOnboarding: false,
    canAccessReports: true,
    canManageHardware: false,
  },
  'Staff Lead': {
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAuditLogs: false,
    canManageSystem: false,
    canApproveOnboarding: true,
    canAccessReports: true,
    canManageHardware: false,
  },
  'QC Staff': {
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAuditLogs: false,
    canManageSystem: false,
    canApproveOnboarding: false,
    canAccessReports: false,
    canManageHardware: false,
  },
  'Production Staff': {
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAuditLogs: false,
    canManageSystem: false,
    canApproveOnboarding: false,
    canAccessReports: false,
    canManageHardware: false,
  },
  'Security Guard': {
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAuditLogs: false,
    canManageSystem: false,
    canApproveOnboarding: false,
    canAccessReports: false,
    canManageHardware: false,
  },
};