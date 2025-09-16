// src/types/auth.ts
export type UserRole = 
  | "super_admin"
  | "admin"
  | "staff_lead"
  | "production_lead"
  | "qc_lead"
  | "production_staff"
  | "qc_staff"
  | "security_guard";

export interface User {
  id: string;
  full_name: string;
  username: string;
  role: UserRole;
  station?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  password_reset_required?: boolean;
  login_attempts?: number;
  face_embedding?: ArrayBuffer;
}

export interface AuthUser extends User {
  token: string;
  refresh_token?: string;
}

// Map display names for UI only
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  "super_admin": "Super Admin",
  "admin": "Admin",
  "staff_lead": "Staff Lead",
  "production_lead": "Production Lead",
  "qc_lead": "QC Lead",
  "production_staff": "Production Staff",
  "qc_staff": "QC Staff",
  "security_guard": "Security Guard"
};

// Reverse mapping for API → UI
export const getDisplayRole = (role: UserRole): string => {
  return ROLE_DISPLAY_NAMES[role];
};

// Forward mapping for UI → API
export const toApiRole = (displayRole: string): UserRole => {
  const mapping: Record<string, UserRole> = {
    "Super Admin": "super_admin",
    "Admin": "admin",
    "Staff Lead": "staff_lead",
    "Production Lead": "production_lead",
    "QC Lead": "qc_lead",
    "Production Staff": "production_staff",
    "QC Staff": "qc_staff",
    "Security Guard": "security_guard"
  };
  return mapping[displayRole as keyof typeof mapping] || "production_staff";
};