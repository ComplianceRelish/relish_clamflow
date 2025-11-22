// Central type exports for ClamFlow Frontend
export * from './auth';
export * from './api';
export * from './forms';
export * from './inventory';
export * from './rfid';

// Base entity interface used across all modules
export interface BaseEntity {
  id: string;
  created_at: string;
  // ✅ REMOVED: updated_at - NOT in Supabase schema
}

// User role type definition - EXACT schema values
export type UserRole = 'Super Admin' | 'Admin' | 'Production Lead' | 'QC Lead' | 'Staff Lead' | 'QC Staff' | 'Production Staff' | 'Security Guard';

export interface BiometricAuthRequest {
  type: 'fingerprint' | 'facial' | 'iris';
  deviceId: string;
  userId?: string;
  timeout?: number;
}

export interface BiometricAuthResponse {
  success: boolean;
  userId?: string;
  confidence: number;
  timestamp: string;
  deviceId: string;
  error?: string;
}

export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'access_denied' | 'hardware_failure' | 'security_breach';
  userId?: string;
  deviceId?: string;
  timestamp: string;
  details: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Legacy compatibility
export type { User as UserProfile } from './auth';