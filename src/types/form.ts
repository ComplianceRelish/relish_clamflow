// src/types/form.ts
export interface FormStatus {
  id: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  created_by: string;
  approved_by?: string;
  approval_date?: string;
  rejection_reason?: string;
}

export interface BaseFormData {
  lot_number: string;
  inspector_id: string;
  inspection_date: string;
  notes?: string;
}

export interface QualityCheck {
  parameter: string;
  value: number | string | boolean;
  acceptable: boolean;
  notes?: string;
}

export interface FormSubmissionResult {
  success: boolean;
  form_id?: string;
  errors?: string[];
  warnings?: string[];
}