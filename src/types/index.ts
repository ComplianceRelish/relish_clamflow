// Central type exports for ClamFlow Frontend
export * from './auth';
export * from './api';
// Export forms but exclude types that are duplicated in qc-workflow
export { 
  type WeightNoteFormData,
  type WeightNote,
  type PPCFormData,
  type PPCForm,
  type FPFormData,
  type FPForm,
  type DepurationFormData,
  type DepurationForm,
  type DepurationStatus,
  type QCFormSubmissionStatus,
  type FormSubmissionResult,
  type BaseFormResponse
} from './forms';
export * from './inventory';
// Note: qc-workflow has some overlapping types - explicitly select what we need
export { 
  type WorkflowStep, 
  type QCViewMode, 
  type WorkflowState, 
  type FormAction,
  type WeightNoteData,
  type RFIDTagData,
  type QRLabelData,
  WORKFLOW_STEPS,
  QC_STAFF_OPTIONS
} from './qc-workflow';
// Note: rfid has RFIDScanResult which may conflict - explicitly select
export { type RFIDReaderStatus, type RFIDTag } from './rfid';

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