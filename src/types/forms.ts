// Form Types and Validation Schemas
import { z } from 'zod'

// Weight Note Form Types
export interface WeightNoteFormData {
  lot_id: string
  supplier_id: string
  box_number: string
  weight: number
  qc_staff_id: string
  notes?: string
  temperature?: number
  moisture_content?: number
}

export interface WeightNote extends WeightNoteFormData {
  id: string
  weight_note_number: string
  created_at: string
  updated_at: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
}

// PPC Form Types
export interface PPCFormData {
  lot_id: string
  station_staff_id: string
  boxes: PPCBox[]
  total_boxes: number
  total_weight: number
  quality_notes?: string
  processing_method?: string
  operator_signature?: string
}

export interface PPCBox {
  box_number: string
  product_type: 'whole_clam' | 'clam_meat' | 'clam_shell'
  grade: 'A' | 'B' | 'C'
  weight: number
  temperature?: number
  batch_id?: string
}

export interface PPCForm extends PPCFormData {
  id: string
  ppc_form_number: string
  created_at: string
  updated_at: string
  status: 'submitted_to_qc' | 'qc_approved' | 'qc_rejected' | 'submitted_to_supervisor' | 'supervisor_approved' | 'supervisor_rejected'
  qc_approved_by?: string
  qc_approved_at?: string
  supervisor_approved_by?: string
  supervisor_approved_at?: string
  rejection_reason?: string
}

// FP Form Types
export interface FPFormData {
  lot_id: string
  station_staff_id: string
  final_boxes: FPBox[]
  total_boxes: number
  total_weight: number
  processing_method: string
  temperature: number
  duration_minutes: number
  operator_signature?: string
}

export interface FPBox {
  final_box_number: string
  original_box_numbers: string[]
  product_type: 'whole_clam' | 'clam_meat' | 'processed_clam'
  grade: 'A' | 'B' | 'C'
  weight: number
  processing_date: string
  expiry_date: string
}

export interface FPForm extends FPFormData {
  id: string
  fp_form_number: string
  created_at: string
  updated_at: string
  status: 'submitted_to_qc' | 'qc_approved' | 'qc_rejected' | 'submitted_to_supervisor' | 'supervisor_approved' | 'supervisor_rejected'
  qc_approved_by?: string
  qc_approved_at?: string
  supervisor_approved_by?: string
  supervisor_approved_at?: string
  rejection_reason?: string
}

// Sample Extraction Form Types
export interface SampleExtractionFormData {
  lot_id: string
  tank_location: string
  sample_type: 'water' | 'clam' | 'sediment'
  extracted_by: string
  extraction_method: string
  sample_volume: number
  extraction_notes?: string
  collection_datetime: string
}

export interface SampleExtraction extends SampleExtractionFormData {
  id: string
  sample_number: string
  created_at: string
  updated_at: string
  status: 'collected' | 'testing' | 'completed' | 'failed'
  test_results?: SampleTestResult[]
}

export interface SampleTestResult {
  test_type: string
  result_value: number
  unit: string
  acceptable_range: {
    min: number
    max: number
  }
  passed: boolean
  tested_by: string
  tested_at: string
}

// Depuration Form Types
export interface DepurationFormData {
  lot_id: string
  tank_id: string
  start_datetime: string
  end_datetime: string
  water_quality_metrics: WaterQualityMetrics
  technician_id: string
  notes?: string
}

export interface WaterQualityMetrics {
  temperature: number
  salinity: number
  ph_level: number
  dissolved_oxygen: number
  turbidity: number
  bacterial_count?: number
}

export interface DepurationForm extends DepurationFormData {
  id: string
  depuration_number: string
  created_at: string
  updated_at: string
  status: 'in_progress' | 'completed' | 'failed' | 'aborted'
  duration_hours: number
  completion_notes?: string
  approved_by?: string
  approved_at?: string
}

// Onboarding Forms
export interface StaffOnboardingFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  employee_id: string
  role: string
  department: string
  start_date: string
  emergency_contact: EmergencyContact
  documents: OnboardingDocument[]
}

export interface SupplierOnboardingFormData {
  company_name: string
  contact_person: string
  email: string
  phone: string
  address: string
  license_numbers: string[]
  certifications: string[]
  boat_details?: BoatDetails
  banking_info: BankingInfo
}

export interface VendorOnboardingFormData {
  firm_name: string
  category: 'equipment' | 'packaging' | 'chemicals' | 'services'
  contact_person: string
  email: string
  phone: string
  address: string
  gst_number?: string
  pan_number?: string
  certifications: string[]
  services_offered: string[]
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

export interface BoatDetails {
  vessel_name: string
  registration_number: string
  capacity: number
  captain_name: string
  captain_license: string
}

export interface BankingInfo {
  bank_name: string
  account_number: string
  ifsc_code: string
  account_holder_name: string
}

export interface OnboardingDocument {
  type: 'id_proof' | 'address_proof' | 'qualification' | 'medical_certificate' | 'other'
  name: string
  file_path: string
  uploaded_at: string
  verified: boolean
  verified_by?: string
}

// Form Validation States
export interface FormValidationState {
  isValid: boolean
  errors: Record<string, string[]>
  touched: Record<string, boolean>
  isSubmitting: boolean
  submitError?: string
  submitSuccess?: boolean
}

// Form Field Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file'
  required: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    custom?: (value: any) => string | undefined
  }
  description?: string
  defaultValue?: any
}

export interface DynamicForm {
  id: string
  name: string
  title: string
  description?: string
  fields: FormField[]
  sections?: FormSection[]
  submission_endpoint: string
  validation_rules?: Record<string, any>
  created_at: string
  updated_at: string
  version: number
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: string[]
  conditional?: {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
    value: any
  }
}

// Form Submission Types
export interface FormSubmission {
  id: string
  form_id: string
  submitted_by: string
  submitted_at: string
  data: Record<string, any>
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'requires_revision'
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  attachments?: FormAttachment[]
}

export interface FormAttachment {
  id: string
  file_name: string
  file_size: number
  mime_type: string
  file_path: string
  uploaded_by: string
  uploaded_at: string
}

// Form Builder Types (for dynamic form creation)
export interface FormBuilder {
  form: DynamicForm
  selectedField?: FormField
  draggedField?: FormField
  previewMode: boolean
  validationErrors: Record<string, string>
}

export interface FormTemplate {
  id: string
  name: string
  category: 'quality_control' | 'processing' | 'onboarding' | 'compliance' | 'maintenance'
  description: string
  form_structure: DynamicForm
  usage_count: number
  created_by: string
  created_at: string
}

// Zod Schema Types (for runtime validation)
export const WeightNoteSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  supplier_id: z.string().uuid('Invalid supplier ID'),
  box_number: z.string().min(1, 'Box number is required'),
  weight: z.number().positive('Weight must be positive'),
  qc_staff_id: z.string().uuid('QC Staff ID is required'),
  notes: z.string().optional(),
  temperature: z.number().optional(),
  moisture_content: z.number().min(0).max(100).optional()
})

export const PPCFormSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  station_staff_id: z.string().uuid('Invalid staff ID'),
  boxes: z.array(z.object({
    box_number: z.string().min(1, 'Box number required'),
    product_type: z.enum(['whole_clam', 'clam_meat', 'clam_shell']),
    grade: z.enum(['A', 'B', 'C']),
    weight: z.number().positive('Weight must be positive'),
    temperature: z.number().optional(),
    batch_id: z.string().optional()
  })).min(1, 'At least one box is required'),
  total_boxes: z.number().positive(),
  total_weight: z.number().positive(),
  quality_notes: z.string().optional(),
  processing_method: z.string().optional(),
  operator_signature: z.string().optional()
})

export const FPFormSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  station_staff_id: z.string().uuid('Invalid staff ID'),
  final_boxes: z.array(z.object({
    final_box_number: z.string().min(1, 'Box number required'),
    original_box_numbers: z.array(z.string()).min(1, 'Original box numbers required'),
    product_type: z.enum(['whole_clam', 'clam_meat', 'processed_clam']),
    grade: z.enum(['A', 'B', 'C']),
    weight: z.number().positive('Weight must be positive'),
    processing_date: z.string().datetime('Invalid processing date'),
    expiry_date: z.string().datetime('Invalid expiry date')
  })).min(1, 'At least one final box is required'),
  total_boxes: z.number().positive(),
  total_weight: z.number().positive(),
  processing_method: z.string().min(1, 'Processing method is required'),
  temperature: z.number(),
  duration_minutes: z.number().positive(),
  operator_signature: z.string().optional()
})

export type WeightNoteFormValidation = z.infer<typeof WeightNoteSchema>
export type PPCFormValidation = z.infer<typeof PPCFormSchema>
export type FPFormValidation = z.infer<typeof FPFormSchema>