// Authentication and User Management Types

export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: UserRole
  department?: string
  plant_id?: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
  last_login?: string
  is_first_login: boolean
  profile_image?: string
  phone?: string
  employee_id?: string
}

export type UserRole = 
  | 'admin'
  | 'plant_manager'
  | 'production_lead'
  | 'staff_lead'
  | 'qc_lead'
  | 'qc_staff'
  | 'station_staff'
  | 'security_guard'
  | 'gate_control'
  | 'qa_technician'

export interface UserProfile extends User {
  permissions: Permission[]
  preferences: UserPreferences
  biometric_data?: BiometricData
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'approve'
  conditions?: Record<string, any>
}

export interface UserPreferences {
  language: 'en' | 'es' | 'fr'
  timezone: string
  notifications: NotificationSettings
  dashboard_layout?: string
  theme: 'light' | 'dark' | 'system'
}

export interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  quality_alerts: boolean
  system_alerts: boolean
  batch_updates: boolean
}

export interface BiometricData {
  fingerprint_hash?: string
  face_encoding?: string
  voice_print?: string
  enrolled_at: string
  last_verified?: string
}

// Authentication Requests/Responses
export interface LoginRequest {
  username: string
  password: string
  remember_me?: boolean
}

export interface LoginResponse {
  user: UserProfile
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: 'Bearer'
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface ResetPasswordRequest {
  email?: string
  username?: string
}

export interface ResetPasswordConfirmRequest {
  token: string
  new_password: string
  confirm_password: string
}

// Session and Token Types
export interface Session {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  created_at: string
  last_activity: string
  ip_address?: string
  user_agent?: string
  device_info?: DeviceInfo
}

export interface DeviceInfo {
  device_type: 'desktop' | 'mobile' | 'tablet'
  os: string
  browser: string
  location?: {
    latitude: number
    longitude: number
    accuracy?: number
  }
}

// Biometric Authentication
export interface BiometricAuthRequest {
  method: 'fingerprint' | 'facial' | 'iris'
  deviceId: string
  timestamp: string
  location: {
    latitude: number
    longitude: number
  }
  // Legacy fields for backward compatibility
  employee_id?: string
  biometric_type?: 'fingerprint' | 'face' | 'voice'
  biometric_data?: string
}

export interface BiometricAuthResponse {
  success: boolean
  user: UserProfile
  confidence_score: number
  timestamp: string
  session?: Session
}

// Role-Based Access Control
export interface RolePermissions {
  [key: string]: Permission[]
}

export interface AccessControlList {
  user_id: string
  resource: string
  permissions: string[]
  granted_by: string
  granted_at: string
  expires_at?: string
}

// Audit and Security
export interface AuthAuditLog {
  id: string
  user_id?: string
  action: 'login' | 'logout' | 'password_change' | 'permission_grant' | 'failed_login'
  timestamp: string
  ip_address?: string
  user_agent?: string
  success: boolean
  error_message?: string
  additional_data?: Record<string, any>
}

export interface SecurityEvent {
  id: string
  user_id: string
  type: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'UNAUTHORIZED_ACCESS' | 'SYSTEM_ALERT'
  method: 'fingerprint' | 'facial' | 'iris' | 'rfid' | 'manual'
  message: string
  reason?: string
  timestamp: string
  location: {
    latitude: number
    longitude: number
  }
  metadata?: Record<string, any>
  // Legacy fields for backward compatibility
  event_type?: 'suspicious_login' | 'multiple_failures' | 'unusual_activity' | 'data_breach'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  description?: string
  resolved?: boolean
  resolved_by?: string
  resolution_notes?: string
}

// Authentication Context Types
export interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  changePassword: (request: ChangePasswordRequest) => Promise<void>
  refreshToken: () => Promise<void>
  checkPermission: (resource: string, action: string) => boolean
  hasRole: (role: UserRole) => boolean
}

// Form Types
export interface LoginFormData {
  username: string
  password: string
  remember_me: boolean
}

export interface ProfileUpdateFormData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  preferences: UserPreferences
}

export interface PasswordChangeFormData {
  current_password: string
  new_password: string
  confirm_password: string
}

// Multi-Factor Authentication
export interface MFASetup {
  user_id: string
  method: 'totp' | 'sms' | 'email'
  secret?: string
  backup_codes: string[]
  enabled: boolean
  verified: boolean
}

export interface MFAVerifyRequest {
  user_id: string
  method: 'totp' | 'sms' | 'email'
  code: string
  remember_device?: boolean
}

export interface TrustedDevice {
  id: string
  user_id: string
  device_fingerprint: string
  device_name: string
  last_used: string
  trusted_until: string
}