// src/types/qc-workflow.ts
// QC Workflow Types - Based on PRODUCTION_WORKFLOW_INTEGRATION.md and Figma Framework

// ============================================
// VIEW MODES & NAVIGATION
// ============================================

export type QCViewMode = 
  | 'qc-form'           // Main QC workflow overview
  | 'sample-extraction' // Depuration sample extraction
  | 'depuration-form'   // Depuration test results form
  | 'weight-note'       // Weight note view/approval
  | 'weight-note-new'   // Create new weight note
  | 'ppc-form'          // PPC form view/approval
  | 'ppc-form-new'      // Create new PPC form
  | 'fp-form'           // FP form view/approval
  | 'fp-form-new'       // Create new FP form
  | 'rfid-scanner'      // RFID tag linking
  | 'qr-generator'      // QR label generation
  | 'approval-dashboard'; // Multi-form approval dashboard

// ============================================
// PRODUCTION STAFF STATION VIEW MODES
// ============================================

export type ProductionStationId = 'rm-station' | 'ppc-station' | 'fp-station';

export type ProductionStaffViewMode =
  | 'station-dashboard'    // Station overview with pending/submitted forms
  | 'weight-note-entry'    // RM Station: create weight note
  | 'ppc-form-entry'       // PPC Station: create PPC form
  | 'fp-form-entry'        // FP Station: create FP form
  | 'form-history';        // View submitted form history

export interface ProductionStationConfig {
  id: ProductionStationId;
  name: string;
  formType: 'weight_note' | 'ppc_form' | 'fp_form';
  description: string;
}

export const PRODUCTION_STATIONS: ProductionStationConfig[] = [
  { id: 'rm-station', name: 'RM Station', formType: 'weight_note', description: 'Receiving Material — Weight Note Entry' },
  { id: 'ppc-station', name: 'PPC Station', formType: 'ppc_form', description: 'Pre-Packed Clam — PPC Form Entry' },
  { id: 'fp-station', name: 'FP Station', formType: 'fp_form', description: 'Frozen Product — FP Form Entry' },
];

// ============================================
// WORKFLOW STATE
// ============================================

export interface WorkflowState {
  weightNoteApproved: boolean;
  supervisorHasCreatedLot: boolean;
  currentLotId: string | null;
  rfidTagData: RFIDTagData | null;
  qrLabelData: QRLabelData | null;
}

// ============================================
// QC STAFF CONFIGURATION
// ============================================

export interface QCStaffOption {
  id: string;
  name: string;
  stations: string[];
}

// ============================================
// WEIGHT NOTE DATA
// ============================================

export interface WeightNoteData {
  id: string;
  lot_id: string;
  supplier_id: string;
  box_number: string;
  weight: number;
  gross_weight?: number;
  tare_weight?: number;
  net_weight?: number;
  temperature?: number;
  moisture_content?: number;
  visual_quality?: string;
  shell_condition?: string;
  qc_staff_id: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  qc_approved: boolean;
  qc_approved_by: string | null;
  qc_approved_at: string | null;
  remarks: string | null;
}

// ============================================
// PPC FORM DATA
// ============================================

export interface PPCFormData {
  id: string;
  lot_id: string;
  box_number: string;
  product_type: string;
  grade: string;
  weight: number;
  qc_staff_id: string;
  submitted_at: string;
  status: 'draft' | 'submitted_to_qc' | 'qc_approved' | 'qc_rejected' | 'production_lead_approved' | 'gate_pass_generated';
  qc_approved: boolean;
  qc_approved_by: string | null;
  qc_approved_at: string | null;
  production_lead_approved: boolean;
  production_lead_approved_by: string | null;
  production_lead_approved_at: string | null;
  remarks: string | null;
  boxes?: PPCBoxData[];
}

export interface PPCBoxData {
  id: string;
  box_number: string;
  product_type: string;
  grade: string;
  weight: number;
  rfid_tag_id?: string;
}

// ============================================
// FP FORM DATA
// ============================================

export interface FPFormData {
  id: string;
  lot_id: string;
  box_number: string;
  original_box_number?: string;
  final_box_number?: string;
  product_type: string;
  grade: string;
  weight: number;
  rfid_tag_id?: string;
  qc_staff_id: string;
  submitted_at: string;
  status: 'draft' | 'submitted_to_qc' | 'qc_approved' | 'qc_rejected' | 'qc_lead_approved' | 'in_inventory';
  qc_approved: boolean;
  qc_approved_by: string | null;
  qc_approved_at: string | null;
  qc_lead_approved: boolean;
  qc_lead_approved_by: string | null;
  qc_lead_approved_at: string | null;
  remarks: string | null;
  boxes?: FPBoxData[];
}

export interface FPBoxData {
  id: string;
  box_number: string;
  final_box_number?: string;
  product_type: string;
  grade: string;
  weight: number;
  rfid_tag_id?: string;
  qr_label_generated: boolean;
}

// ============================================
// DEPURATION DATA
// ============================================

export interface DepurationSampleData {
  id: string;
  lot_id: string;
  sample_type: string;
  extraction_point: string;
  sample_size: number;
  container_type: string;
  preservation_method: string;
  qc_staff_id: string;
  extraction_time: string;
  storage_temperature: number;
  chain_of_custody?: string;
  testing_requirements?: TestingRequirements;
  notes?: string;
}

export interface TestingRequirements {
  microbiological?: boolean;
  chemical?: boolean;
  physical?: boolean;
  nutritional?: boolean;
  heavy_metals?: boolean;
  pesticides?: boolean;
}

export interface DepurationFormData {
  id: string;
  sample_id: string;
  lot_id: string;
  depuration_tank_id: string;
  start_time: string;
  planned_duration: number;
  initial_salinity: number;
  initial_temperature: number;
  initial_ph: number;
  water_source: string;
  filtration_type: string;
  qc_staff_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  qc_lead_approved: boolean;
  qc_lead_approved_by: string | null;
  qc_lead_approved_at: string | null;
  notes?: string;
  monitoring_parameters?: MonitoringParameters;
}

export interface MonitoringParameters {
  salinity_checks?: boolean;
  temperature_monitoring?: boolean;
  ph_monitoring?: boolean;
  turbidity_checks?: boolean;
  bacterial_testing?: boolean;
}

// ============================================
// RFID DATA
// ============================================

export interface RFIDTagData {
  id: string;
  tag_id: string;
  box_number: string;
  lot_id: string;
  product_type: string;
  grade: string;
  weight: number;
  linked_at: string;
  linked_by: string;
  status: 'active' | 'inactive' | 'transferred';
}

export interface RFIDScanResult {
  success: boolean;
  tag_data?: RFIDTagData;
  error?: string;
  validation_status?: 'valid' | 'invalid' | 'duplicate' | 'missing_ppc';
}

// ============================================
// QR LABEL DATA
// ============================================

export interface QRLabelData {
  id: string;
  qr_code_data: string;
  qr_code_image: string; // Base64
  lot_id: string;
  box_number: string;
  product_type: string;
  grade: string;
  weight: number;
  pack_date: string;
  expiry_date: string;
  traceability_code: string;
  generated_at: string;
  generated_by: string;
}

// ============================================
// WORKFLOW STEPS (14 Steps per Backend Doc)
// ============================================

export interface WorkflowStep {
  step: number;
  name: string;
  station: string;
  description: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped';
  requiresApproval: boolean;
  approvalType?: 'qc_staff' | 'qc_lead' | 'production_lead' | 'supervisor';
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  // Production Staff enters data at RM, PPC, FP stations. QC Staff approves at station level.
  // After QC approval, forms route to Production Lead for final action.
  { step: 1, name: 'Weight Note', station: 'RM Station', description: 'Production Staff enters weight note for incoming raw material', status: 'available', requiresApproval: true, approvalType: 'qc_staff' },
  { step: 2, name: 'Lot Creation', station: 'Supervisor', description: 'Production Lead creates lot after QC approval of weight note', status: 'locked', requiresApproval: false },
  { step: 3, name: 'Sample Extraction', station: 'Depuration Station', description: 'QC Staff extracts sample for depuration testing', status: 'locked', requiresApproval: true, approvalType: 'qc_lead' },
  { step: 4, name: 'Washing', station: 'PPC - Washing', description: 'Production Staff performs washing process', status: 'locked', requiresApproval: false },
  { step: 5, name: 'Depuration', station: 'PPC - Depuration', description: 'QC Staff monitors depuration in tanks', status: 'locked', requiresApproval: true, approvalType: 'qc_lead' },
  { step: 6, name: 'Separation', station: 'PPC - Separation', description: 'Production Staff performs steam cooking & meat separation', status: 'locked', requiresApproval: false },
  { step: 7, name: 'Grading', station: 'PPC - Grading', description: 'Production Staff performs grade sorting', status: 'locked', requiresApproval: false },
  { step: 8, name: 'Packing', station: 'PPC - Packing', description: 'Production Staff packs products into boxes', status: 'locked', requiresApproval: false },
  { step: 9, name: 'PPC QC Check', station: 'PPC - QC', description: 'QC Staff quality verification before PPC form', status: 'locked', requiresApproval: true, approvalType: 'qc_staff' },
  { step: 10, name: 'PPC Form', station: 'PPC Station', description: 'Production Staff completes PPC form, QC approves, then Production Lead approves & generates gate pass', status: 'locked', requiresApproval: true, approvalType: 'production_lead' },
  { step: 11, name: 'FP Receiving', station: 'FP - Receiving', description: 'RFID scan & verify PPC box at FP intake', status: 'locked', requiresApproval: false },
  { step: 12, name: 'FP Processing', station: 'FP - Freezing/Packing', description: 'Production Staff performs freezing & final packing', status: 'locked', requiresApproval: false },
  { step: 13, name: 'FP Form', station: 'FP Station', description: 'Production Staff completes FP form, QC approves, Production Lead approves → inventory (pending microbiology)', status: 'locked', requiresApproval: true, approvalType: 'production_lead' },
  { step: 14, name: 'Microbiology & Shipping', station: 'QC Lab / Cold Storage', description: 'QC Lead initiates lot-wise sample extraction & microbiology testing (EIC Norms). Tested lots marked Ready for Shipment', status: 'locked', requiresApproval: true, approvalType: 'qc_lead' },
];

// ============================================
// APPROVAL DASHBOARD TYPES
// ============================================

export interface PendingApprovalItem {
  id: string;
  formType: 'weight_note' | 'ppc_form' | 'fp_form' | 'depuration_form';
  lotId: string | null;
  lotNumber: string | null;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  station: string;
  status: 'pending_qc' | 'pending_production_lead' | 'pending_qc_lead';
  priority: 'low' | 'medium' | 'high' | 'critical';
  ageInMinutes: number;
  formData: WeightNoteData | PPCFormData | FPFormData | DepurationFormData;
}

export interface ApprovalAction {
  formId: string;
  formType: 'weight_note' | 'ppc_form' | 'fp_form' | 'depuration_form';
  action: 'approve' | 'reject';
  observations?: string;
  rejectionReason?: string;
}

// ============================================
// SUPPLIER DATA (for Weight Note)
// ============================================

export interface SupplierData {
  id: string;
  name: string;
  contact?: string;
  address?: string;
  license_number?: string;
}

// ============================================
// LOT STATUS LIFECYCLE
// ============================================

export type LotStatus = 'received' | 'washing' | 'depuration' | 'ppc' | 'fp' | 'shipped' | 'archived';

export interface LotData {
  id: string;
  lot_number: string;
  supplier_id: string;
  supplier_name?: string;
  status: LotStatus;
  weight_note_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ============================================
// FORM ACTIONS HELPER
// ============================================

export type FormAction = 'approve' | 'reject' | 'view' | 'upload' | 'scan' | 'generate_label';

export interface FormActionHandler {
  (step: number, action: FormAction, formData?: unknown): void;
}
