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

// ==================== ENHANCED FP FORM TYPES ====================

// FP Workflow Stage Types
export type WorkflowStage = 
  | 'ppc_scanning'
  | 'production_authentication' 
  | 'final_packing_data'
  | 'label_generation'
  | 'qc_station_review'
  | 'production_lead_review'
  | 'inventory_entry'
  | 'microbiology_testing'
  | 'ready_for_shipment'
  | 'quality_hold'
  | 'production_rework'
  | 'qc_station_rework';

export type FPFormStatus = 
  | 'draft'
  | 'in_progress'
  | 'pending_qc'
  | 'pending_production_lead'
  | 'in_inventory'
  | 'microbiology_testing'
  | 'ready_for_shipment'
  | 'on_hold'
  | 'rejected'
  | 'completed';

// Pack Size Configuration (Admin-Defined Multiple Pack Sizes)
export interface PackSizeConfiguration {
  id?: string;
  pack_size_id: string;
  pack_size_name: string;
  pack_size_code: string;
  quantity: number;
  weight_per_pack: number;
  pieces_per_pack?: number;
  pack_dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  label_template_id?: string;
  admin_defined: boolean;
  created_by?: string;
  created_at?: string;
}

// Enhanced FP Form Creation
export interface FPFormCreate {
  lot_id: string;
  ppc_form_references: string[];
  expected_box_count: number;
  qc_station_id: string;
  expected_pack_configurations: PackSizeConfiguration[];
  priority_level?: 'low' | 'medium' | 'high' | 'critical';
  special_instructions?: string;
  customer_requirements?: Record<string, unknown>;
}

// Box Scanning Data (Step 2: In-Scans Boxes from PPC)
export interface BoxScanData {
  id?: string;
  box_id: string;
  rfid_tag: string;
  scan_timestamp: string;
  ppc_reference: string;
  box_weight?: number;
  scanner_id?: string;
  scan_location?: string;
  validation_status?: 'valid' | 'invalid' | 'duplicate' | 'missing_ppc';
  validation_errors?: string[];
}

// Final Packing Data (Step 4: Multi-Box/Multiple Pack Sizes)
export interface FinalPackingData {
  production_staff_id: string;
  final_product_type: string;
  pack_configurations: PackSizeConfiguration[];
  packaging_specifications: {
    packaging_material: string;
    packaging_date: string;
    expiry_date: string;
    batch_code?: string;
  };
  quality_notes?: string;
  environmental_conditions?: {
    temperature: number;
    humidity: number;
    recorded_at: string;
  };
  customer_specific_requirements?: Record<string, unknown>;
}

// Label Generation Results
export interface LabelGenerationResult {
  id: string;
  pack_configuration_id: string;
  label_data: {
    qr_code: string; // base64 image
    barcode?: string; // base64 image
    label_content: Record<string, unknown>;
  };
  label_format: string;
  generated_at: string;
  printed_status: 'pending' | 'printed' | 'reprinted' | 'failed';
  print_count: number;
}

// Microbiology Test Results (Step 9: QC Lead Testing)
export interface MicrobiologyTestResult {
  test_type: 'pathogen_screening' | 'salmonella' | 'ecoli' | 'listeria' | 'vibrio' | 'comprehensive';
  test_results: {
    pathogen_detected: boolean;
    pathogen_type?: string;
    bacterial_count?: number;
    test_method: string;
    detection_limit: number;
  };
  test_passed: boolean;
  tested_by: string;
  test_date: string;
  lab_certificate_url?: string;
  accreditation_info?: {
    lab_name: string;
    accreditation_number: string;
    certification_date: string;
  };
  retest_required?: boolean;
  corrective_actions?: string[];
}

// Enhanced Approval Interface (QC Staff & Production Lead)
export interface FPFormApproval {
  approved: boolean;
  comments?: string;
  quality_rating?: number;
  rejection_reason?: string;
  corrective_actions?: string[];
  quality_checklist?: Record<string, boolean>;
  attachments?: string[];
  next_review_date?: string;
}

// Workflow History Tracking
export interface FPWorkflowHistory {
  id: string;
  stage: WorkflowStage;
  action: string;
  performed_by: string;
  performed_by_role: string;
  timestamp: string;
  comments?: string;
  data?: Record<string, unknown>;
}

// Enhanced FP Form (Comprehensive)
export interface FPForm {
  id: string;
  lot_id: string;
  form_number: string;
  status: FPFormStatus;
  workflow_stage: WorkflowStage;
  created_by: string;
  created_at: string;
  updated_at: string;
  expected_box_count: number;
  actual_box_count?: number;
  qc_station_id: string;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  
  // Workflow tracking
  ppc_scan_completed?: boolean;
  production_staff_authenticated?: boolean;
  final_packing_completed?: boolean;
  labels_generated?: boolean;
  qc_approved?: boolean;
  production_lead_approved?: boolean;
  inventory_entered?: boolean;
  microbiology_completed?: boolean;
  
  // Assignees
  current_assignee?: string;
  current_assignee_role?: string;
  qc_staff_assigned?: string;
  production_lead_assigned?: string;
  qc_lead_assigned?: string;
  
  // Timestamps
  ppc_scan_timestamp?: string;
  production_auth_timestamp?: string;
  final_packing_timestamp?: string;
  qc_approval_timestamp?: string;
  production_approval_timestamp?: string;
  inventory_entry_timestamp?: string;
  microbiology_timestamp?: string;
  completion_timestamp?: string;
  
  // Data
  pack_configurations?: PackSizeConfiguration[];
  total_weight?: number;
  total_pieces?: number;
  special_instructions?: string;
}

// Detailed FP Form (with full workflow context)
export interface FPFormDetailed extends FPForm {
  workflow_history: FPWorkflowHistory[];
  current_permissions: string[];
  next_actions: string[];
  scanned_boxes: BoxScanData[];
  packing_configurations: PackSizeConfiguration[];
  generated_labels: LabelGenerationResult[];
  rejection_history: Record<string, unknown>[];
}

// Legacy FP Form Types (maintaining backward compatibility)
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

// ==================== EXISTING FORM TYPES (Unchanged) ====================

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
    custom?: (value: unknown) => string | undefined
  }
  description?: string
  defaultValue?: unknown
}

export interface DynamicForm {
  id: string
  name: string
  title: string
  description?: string
  fields: FormField[]
  sections?: FormSection[]
  submission_endpoint: string
  validation_rules?: Record<string, unknown>
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
    value: unknown
  }
}

// Form Submission Types
export interface FormSubmission {
  id: string
  form_id: string
  submitted_by: string
  submitted_at: string
  data: Record<string, unknown>
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

// ==================== VALIDATION SCHEMAS ====================

// Existing Zod Schemas
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

// Enhanced FP Form Schema (New Workflow)
export const EnhancedFPFormSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  ppc_form_references: z.array(z.string().uuid()).min(1, 'At least one PPC form reference required'),
  expected_box_count: z.number().positive('Expected box count must be positive'),
  qc_station_id: z.string().min(1, 'QC Station ID is required'),
  expected_pack_configurations: z.array(z.object({
    pack_size_id: z.string().min(1, 'Pack size ID required'),
    pack_size_name: z.string().min(1, 'Pack size name required'),
    pack_size_code: z.string().min(1, 'Pack size code required'),
    quantity: z.number().positive('Quantity must be positive'),
    weight_per_pack: z.number().positive('Weight per pack must be positive'),
    pieces_per_pack: z.number().positive().optional(),
    admin_defined: z.boolean()
  })).min(1, 'At least one pack configuration required'),
  priority_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  special_instructions: z.string().optional()
})

export const PackSizeConfigurationSchema = z.object({
  pack_size_id: z.string().min(1, 'Pack size ID required'),
  pack_size_name: z.string().min(1, 'Pack size name required'),
  pack_size_code: z.string().min(1, 'Pack size code required'),
  quantity: z.number().positive('Quantity must be positive'),
  weight_per_pack: z.number().positive('Weight per pack must be positive'),
  pieces_per_pack: z.number().positive().optional(),
  pack_dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive()
  }).optional(),
  admin_defined: z.boolean()
})

export const BoxScanDataSchema = z.object({
  box_id: z.string().min(1, 'Box ID required'),
  rfid_tag: z.string().min(1, 'RFID tag required'),
  ppc_reference: z.string().uuid('Invalid PPC reference'),
  box_weight: z.number().positive().optional(),
  scanner_id: z.string().optional(),
  scan_location: z.string().optional()
})

export const FinalPackingDataSchema = z.object({
  production_staff_id: z.string().uuid('Invalid production staff ID'),
  final_product_type: z.string().min(1, 'Final product type required'),
  pack_configurations: z.array(PackSizeConfigurationSchema).min(1, 'At least one pack configuration required'),
  packaging_specifications: z.object({
    packaging_material: z.string().min(1, 'Packaging material required'),
    packaging_date: z.string().datetime('Invalid packaging date'),
    expiry_date: z.string().datetime('Invalid expiry date'),
    batch_code: z.string().optional()
  }),
  quality_notes: z.string().optional(),
  environmental_conditions: z.object({
    temperature: z.number(),
    humidity: z.number().min(0).max(100),
    recorded_at: z.string().datetime()
  }).optional()
})

// Legacy FP Form Schema (backward compatibility)
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

// Type Inference
export type WeightNoteFormValidation = z.infer<typeof WeightNoteSchema>
export type PPCFormValidation = z.infer<typeof PPCFormSchema>
export type FPFormValidation = z.infer<typeof FPFormSchema>
export type EnhancedFPFormValidation = z.infer<typeof EnhancedFPFormSchema>
export type PackSizeConfigurationValidation = z.infer<typeof PackSizeConfigurationSchema>
export type BoxScanDataValidation = z.infer<typeof BoxScanDataSchema>
export type FinalPackingDataValidation = z.infer<typeof FinalPackingDataSchema>