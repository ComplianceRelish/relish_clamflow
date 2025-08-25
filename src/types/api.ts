// API Request/Response Types
import { WeightNote, PPCForm, FPForm, SampleExtraction, DepurationForm } from './forms'
import { User, UserProfile } from './auth'
import { Product, InventoryItem, Supplier } from './inventory'
import { RFIDScanData, RFIDTag } from './rfid'
import { PaginatedResponse } from './index'

// Generic API Response Structure
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
  meta?: ResponseMetadata
}

export interface ResponseMetadata {
  timestamp: string
  request_id: string
  version: string
  total_count?: number
  page?: number
  per_page?: number
  total_pages?: number
}

// Error Response Types
export interface APIError {
  code: string
  message: string
  details?: any
  field?: string
  timestamp: string
}

export interface ValidationErrorResponse {
  success: false
  error: 'validation_failed'
  errors: Record<string, string[]>
  message: string
}

// Authentication API Types
export interface LoginAPIRequest {
  username: string
  password: string
  remember_me?: boolean
}

export interface LoginAPIResponse {
  success: true
  data: {
    user: UserProfile
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: 'Bearer'
  }
}

export interface RefreshTokenAPIRequest {
  refresh_token: string
}

export interface RefreshTokenAPIResponse {
  success: true
  data: {
    access_token: string
    expires_in: number
  }
}

// QA Endpoints Types
export interface CreateWeightNoteRequest {
  lot_id: string
  supplier_id: string
  box_number: string
  weight: number
  qc_staff_id: string
  notes?: string
}

export interface CreateWeightNoteResponse extends APIResponse<WeightNote> {}

export interface GetWeightNotesResponse extends APIResponse<WeightNote[]> {}

export interface ApproveWeightNoteResponse extends APIResponse<WeightNote> {}

export interface CreatePPCFormRequest {
  lot_id: string
  product_grade: string
  quality_notes?: string
  station_staff_id: string
  boxes: Array<{
    box_number: string
    product_type: string
    grade: string
    weight: number
  }>
}

export interface CreatePPCFormResponse extends APIResponse<PPCForm> {}

export interface CreateFPFormRequest {
  lot_id: string
  final_weight: number
  packaging_details: string
  station_staff_id: string
  final_boxes: Array<{
    final_box_number: string
    original_box_numbers: string[]
    product_type: string
    grade: string
    weight: number
  }>
}

export interface CreateFPFormResponse extends APIResponse<FPForm> {}

export interface CreateSampleExtractionRequest {
  lot_id: string
  tank_location: string
  sample_type: string
  extracted_by: string
}

export interface CreateSampleExtractionResponse extends APIResponse<SampleExtraction> {}

// Secure Endpoints Types
export interface RecordGateExitRequest {
  rfid_tags: string[]
  timestamp?: string
  operator_id: string
  vehicle_info?: {
    license_plate: string
    driver_name: string
    destination: string
  }
}

export interface RecordGateExitResponse extends APIResponse<{
  gate_log_id: string
  processed_tags: string[]
  failed_tags: string[]
  timestamp: string
}> {}

export interface RecordGateEntryRequest {
  rfid_tags: string[]
  timestamp?: string
  operator_id: string
  supplier_info?: {
    supplier_id: string
    vehicle_info: {
      license_plate: string
      driver_name: string
    }
  }
}

export interface RecordGateEntryResponse extends APIResponse<{
  gate_log_id: string
  processed_tags: string[]
  failed_tags: string[]
  timestamp: string
}> {}

export interface GetBoxTallyResponse extends APIResponse<{
  total_boxes_in: number
  total_boxes_out: number
  current_inventory: number
  daily_summary: {
    date: string
    entries: number
    exits: number
    net_change: number
  }
}> {}

export interface RecordAttendanceRequest {
  employee_id: string
  method: 'face' | 'qr' | 'rfid'
  timestamp?: string
  biometric_data?: string
  location?: {
    latitude: number
    longitude: number
  }
}

export interface RecordAttendanceResponse extends APIResponse<{
  attendance_id: string
  employee: User
  clock_in_time?: string
  clock_out_time?: string
  total_hours?: number
  status: 'clocked_in' | 'clocked_out' | 'break' | 'overtime'
}> {}

// QC Lead Endpoints Types
export interface SubmitDepurationResultRequest {
  lot_id: string
  test_results: {
    bacterial_count: number
    ph_level: number
    salinity: number
    temperature: number
    duration_hours: number
  }
  approved: boolean
  notes?: string
  technician_id: string
}

export interface SubmitDepurationResultResponse extends APIResponse<DepurationForm> {}

export interface ApproveMicrobiologyRequest {
  lot_id: string
  test_results: {
    e_coli: number
    salmonella: boolean
    total_bacterial_count: number
    yeast_mold: number
  }
  approved: boolean
  tested_by: string
  notes?: string
}

export interface ApproveMicrobiologyResponse extends APIResponse<{
  approval_id: string
  lot_id: string
  approved: boolean
  approved_by: string
  approved_at: string
  test_results: any
}> {}

// Inventory & Data Endpoints Types
export interface GetInventoryResponse extends APIResponse<InventoryItem[]> {}

export interface GetLotDetailsResponse extends APIResponse<{
  id: string
  lot_number: string
  supplier: Supplier
  received_date: string
  total_weight: number
  current_weight: number
  grade: string
  status: string
  processing_history: ProcessingHistoryItem[]
  quality_checks: QualityCheck[]
}> {}

export interface ProcessingHistoryItem {
  id: string
  process_type: string
  operator: User
  start_time: string
  end_time?: string
  parameters: Record<string, any>
  output_weight: number
  quality_grade: string
}

export interface QualityCheck {
  id: string
  check_type: string
  inspector: User
  performed_at: string
  results: Record<string, any>
  passed: boolean
  notes?: string
}

export interface GetSuppliersResponse extends APIResponse<Supplier[]> {}

export interface GetStaffResponse extends APIResponse<User[]> {}

export interface GetVendorsResponse extends APIResponse<Vendor[]> {}

export interface Vendor {
  id: string
  firm_name: string
  category: string
  contact_person: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive' | 'pending'
  certifications: string[]
  created_at: string
}

// Onboarding Endpoints Types
export interface SubmitStaffOnboardingRequest {
  full_name: string
  email: string
  role: string
  department?: string
  employee_id: string
  phone: string
  start_date: string
  emergency_contact: {
    name: string
    phone: string
    relationship: string
  }
}

export interface SubmitStaffOnboardingResponse extends APIResponse<{
  onboarding_id: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
}> {}

export interface SubmitSupplierOnboardingRequest {
  name: string
  contact_info: {
    contact_person: string
    email: string
    phone: string
    address: string
  }
  boat_details?: {
    vessel_name: string
    registration_number: string
    capacity: number
    captain_name: string
  }
  certifications: string[]
  banking_info: {
    bank_name: string
    account_number: string
    ifsc_code: string
  }
}

export interface SubmitSupplierOnboardingResponse extends APIResponse<{
  onboarding_id: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
}> {}

export interface SubmitVendorOnboardingRequest {
  firm_name: string
  category: string
  contact_details: {
    contact_person: string
    email: string
    phone: string
    address: string
  }
  gst_number?: string
  certifications: string[]
  services_offered: string[]
}

export interface SubmitVendorOnboardingResponse extends APIResponse<{
  onboarding_id: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
}> {}

export interface ApproveOnboardingRequest {
  onboarding_id: string
  approved: boolean
  notes?: string
  approved_by: string
}

export interface ApproveOnboardingResponse extends APIResponse<{
  onboarding_id: string
  status: 'approved' | 'rejected'
  processed_at: string
  processed_by: string
}> {}

// Health Check Types
export interface HealthCheckResponse extends APIResponse<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  database: {
    status: 'connected' | 'disconnected'
    response_time_ms: number
  }
  external_services: {
    service_name: string
    status: 'available' | 'unavailable'
    response_time_ms?: number
  }[]
}> {}

// Search and Filter Types
export interface SearchRequest {
  query?: string
  filters?: {
    date_from?: string
    date_to?: string
    status?: string[]
    plant_id?: string
    operator_id?: string
    product_type?: string
    grade?: string[]
  }
  pagination?: {
    page: number
    per_page: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }
}

export interface SearchResponse<T> extends APIResponse<PaginatedResponse<T>> {}

// Batch Operations
export interface BatchOperationRequest {
  operation: 'approve' | 'reject' | 'delete' | 'update'
  entity_type: 'weight_notes' | 'ppc_forms' | 'fp_forms' | 'lots'
  entity_ids: string[]
  parameters?: Record<string, any>
  performed_by: string
  reason?: string
}

export interface BatchOperationResponse extends APIResponse<{
  operation_id: string
  successful_operations: string[]
  failed_operations: {
    entity_id: string
    error: string
  }[]
  summary: {
    total: number
    successful: number
    failed: number
  }
}> {}

// File Upload Types
export interface FileUploadRequest {
  file: File
  entity_type: 'weight_note' | 'ppc_form' | 'fp_form' | 'onboarding'
  entity_id?: string
  file_type: 'document' | 'image' | 'certificate' | 'report'
  description?: string
}

export interface FileUploadResponse extends APIResponse<{
  file_id: string
  file_name: string
  file_size: number
  file_path: string
  mime_type: string
  uploaded_at: string
}> {}

// Export Types
export interface ExportRequest {
  entity_type: 'weight_notes' | 'ppc_forms' | 'fp_forms' | 'inventory' | 'lots'
  format: 'csv' | 'excel' | 'pdf' | 'json'
  filters?: SearchRequest['filters']
  date_range?: {
    from: string
    to: string
  }
  columns?: string[]
}

export interface ExportResponse extends APIResponse<{
  export_id: string
  download_url: string
  expires_at: string
  file_size: number
  record_count: number
}> {}

// WebSocket Types
export interface WebSocketMessage {
  type: 'notification' | 'update' | 'alert' | 'system'
  channel: string
  data: any
  timestamp: string
  sender?: string
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'notification'
  data: {
    title: string
    message: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    action_url?: string
    user_ids: string[]
  }
}

export interface UpdateMessage extends WebSocketMessage {
  type: 'update'
  data: {
    entity_type: string
    entity_id: string
    action: 'created' | 'updated' | 'deleted'
    changes: Record<string, any>
  }
}