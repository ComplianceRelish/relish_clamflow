// /QC_Flow/types/labelTypes.ts
// Complete TypeScript interfaces and types for QR Label Format Editor

export interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fields: LabelField[];
  layout: LabelLayout;
  compliance: ComplianceSettings;
  // Additional properties for template styling
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  category?: string;
}

export type DynamicDataSource = 
  | string
  | {
      type: 'static' | 'form' | 'plant' | 'regulation' | 'calculated' | 'dynamic';
      sourceKey?: string;
      formula?: string;
      params?: Record<string, any>;
      fallbackValue?: string;
    };

export interface LabelField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'qr' | 'barcode' | 'logo' | 'dynamic';
  label: string;
  value: string;
  defaultValue?: string;
  position: FieldPosition;
  style: FieldStyle;
  required: boolean;
  editable: boolean;
  dataSource?: DynamicDataSource;
  validation?: FieldValidation;
  // Legacy direct access properties for backward compatibility
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  imageUrl?: string;
}

export interface FieldPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
}

export interface FieldStyle {
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'lighter';
  fontFamily?: string;
  color: string;
  backgroundColor: string;
  border: string;
  borderRadius?: number;
  textAlign: 'left' | 'center' | 'right';
  padding?: number;
  margin?: number;
}

export interface FieldValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customValidator?: string;
}

export interface LabelLayout {
  width: number;
  height: number;
  unit: 'mm' | 'inch' | 'px';
  orientation: 'portrait' | 'landscape';
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  backgroundColor: string;
  border: string;
}

export interface ComplianceSettings {
  haccp: boolean;
  fda: boolean;
  iso22000: boolean;
  halal: boolean;
  organic: boolean;
  customCompliance: Array<{
    name: string;
    required: boolean;
    fieldMapping: string;
  }>;
}

export interface PlantConfiguration {
  id: string;
  plantName: string;
  plantCode: string;
  location: PlantLocation;
  approvals: RegulatoryApprovals;
  processingMethods: ProcessingMethod[];
  stations: FPStation[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional legacy properties
  name?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  fpStations?: FPStation[];
  // ADD: Packaging specifications
  packagingSpecs?: PackagingSpecification[];
  defaultPackaging?: string;
}

export interface PlantLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface RegulatoryApprovals {
  haccp: ApprovalDetail;
  fda: ApprovalDetail;
  iso22000: ApprovalDetail;
  halal: ApprovalDetail;
  organic: ApprovalDetail;
  custom: ApprovalDetail[];
  // Array methods for compatibility
  filter?: (callback: (approval: any) => boolean) => any[];
  find?: (callback: (approval: any) => boolean) => any;
  forEach?: (callback: (approval: any, index: any) => void) => void;
}

export interface ApprovalDetail {
  number: string;
  expiryDate: string;
  issuer: string;
  issuedDate?: string;
  status: 'active' | 'expired' | 'pending' | 'suspended';
  documents?: string[];
}

export interface ProcessingMethod {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'freezing' | 'drying' | 'chilling' | 'pasteurizing' | 'packaging' | 'other';
  temperatureRange: TemperatureRange;
  timeRange: TimeRange;
  equipment: Equipment[];
  certifications: string[];
  parameters: ProcessingParameter[];
}

export interface TemperatureRange {
  min: number;
  max: number;
  unit: 'celsius' | 'fahrenheit';
  tolerance: number;
}

export interface TimeRange {
  min: number;
  max: number;
  unit: 'minutes' | 'hours' | 'days';
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  calibrationDate?: string;
  nextCalibrationDate?: string;
}

export interface ProcessingParameter {
  name: string;
  value: string | number;
  unit: string;
  critical: boolean;
  monitoringFrequency: string;
}

export interface FPStation {
  id: string;
  name: string;
  code: string;
  location: string;
  processingMethods: string[];
  capacity: number;
  isActive: boolean;
  equipment: Equipment[];
  staffAssignments: StaffAssignment[];
  operatingHours: OperatingHours;
  // Legacy property for compatibility
  stationId?: string;
}

export interface StaffAssignment {
  staffId: string;
  staffName: string;
  role: string;
  shift: 'morning' | 'afternoon' | 'night';
  certifications: string[];
}

export interface OperatingHours {
  monday: ShiftHours;
  tuesday: ShiftHours;
  wednesday: ShiftHours;
  thursday: ShiftHours;
  friday: ShiftHours;
  saturday: ShiftHours;
  sunday: ShiftHours;
}

export interface ShiftHours {
  start: string;
  end: string;
  active: boolean;
}

export interface QRCodeData {
  // Plant and batch information (starts at weight station)
  plantId: string;
  plantName?: string;
  batchId: string;
  timestamp: string;
  station: string;
  
  // Product information from weight note
  product: {
    type: string;
    weight: number;
    grade: string;
    lotNumber: string;
  };
  
  // Processing information
  processing: {
    method: string;
    temperature?: number;
    duration?: number;
    operator: string;
  };
  
  // Quality control
  quality: {
    inspector: string;
    checkDate: string;
    status: string;
    notes: string;
  };
  
  // Traceability (from weight note onwards, not harvest)
  traceability?: {
    sourceLocation: string | { latitude: number; longitude: number; };
    weightNoteId: string;
    receivalDate: string;
    supplier: string;
    traceabilityCode: string;
  };
  
  // Regulatory approvals
  approvals: {
    haccp?: string;
    fda?: string;
    iso22000?: string;
    halal?: string;
    organic?: string;
  };
  
  // ADD: Packaging information
  packaging?: {
    specId: string;
    type: string;
    tareWeight: number;
    grossWeight: number;
  };
  
  // Legacy fields for backward compatibility
  productId?: string;
  lotId?: string;
  boxNumber?: string;
  productType?: string;
  grade?: string;
  weight?: number;
  processedDate?: string;
  expiryDate?: string;
  rfidTag?: string;
  fpStaffId?: string;
  batchNumber?: string;
  traceabilityCode?: string;
  plantCode?: string;
  stationCode?: string;
  processingMethod?: string;
  temperature?: number;
  processingTime?: number;
  qualityChecks?: QualityCheck[];
}

export interface QualityCheck {
  checkType: string;
  result: 'pass' | 'fail' | 'warning';
  value?: string | number;
  unit?: string;
  timestamp: string;
  inspector: string;
  notes?: string;
}

// =================== PACKAGING SPECIFICATIONS (ADDITION) ===================

export interface PackagingSpecification {
  id: string;
  name: string;
  code: string;
  boxType: 'standard' | 'premium' | 'export' | 'bulk' | 'retail';
  capacity: number; // kg
  tareWeight: number; // kg
  dimensions: {
    length: number; // mm
    width: number; // mm
    height: number; // mm
  };
  material: string;
  
  // Link to your existing vendor system
  vendorId: string;
  
  // Admin management
  approvedBy: string;
  approvalDate: string;
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes?: string;
}

export interface LabelConfig {
  template: 'STANDARD' | 'EXPORT' | 'PREMIUM' | 'CUSTOM';
  size: '4x6' | '4x4' | '2x4' | '3x5' | 'CUSTOM';
  customSize?: {
    width: number;
    height: number;
    unit: 'mm' | 'inch';
  };
  copies: number;
  includeBarcode: boolean;
  includeNutrition: boolean;
  includeQRCode: boolean;
  includeLogo: boolean;
  logoPath?: string;
  printQuality: 'draft' | 'normal' | 'high';
  paperType: 'standard' | 'glossy' | 'matte' | 'waterproof';
}

export interface LabelData {
  qrData: QRCodeData;
  qrCode: string;
  rfidTag: string;
  config: LabelConfig;
  template: LabelTemplate;
  plant: PlantConfiguration;
  station: FPStation;
  processingMethod: ProcessingMethod;
  customFields?: Record<string, any>;
}

export interface InventoryRecord {
  id: string;
  lotId: string;
  boxNumber: string;
  rfidTag: string;
  qrCode: string;
  qrData: QRCodeData;
  productType: string;
  grade: string;
  weight: number;
  temperature?: number;
  location: string;
  zone: string;
  status: 'in-stock' | 'reserved' | 'shipped' | 'damaged' | 'expired';
  traceabilityCode: string;
  processedAt: string;
  processedBy: string;
  expiryDate: string;
  qualityChecks: QualityCheckRecord;
  packaging: PackagingInfo;
  compliance: ComplianceRecord;
  createdAt: string;
  updatedAt: string;
}

export interface QualityCheckRecord {
  temperature: number;
  temperatureCompliant: boolean;
  visualInspection: 'PASSED' | 'FAILED' | 'WARNING';
  weightVerification: 'PASSED' | 'FAILED' | 'WARNING';
  packagingIntegrity: 'INTACT' | 'DAMAGED' | 'COMPROMISED';
  microbiological?: 'PASSED' | 'FAILED' | 'PENDING';
  chemical?: 'PASSED' | 'FAILED' | 'PENDING';
  allergen?: 'PASSED' | 'FAILED' | 'PENDING';
}

export interface PackagingInfo {
  labelsPrinted: boolean;
  labelConfig: LabelConfig;
  qrCodeGenerated: boolean;
  sealIntegrity: 'INTACT' | 'DAMAGED' | 'COMPROMISED';
  packagingDate: string;
  packagingStaff: string;
  batchNumber: string;
}

export interface ComplianceRecord {
  haccp: boolean;
  iso22000: boolean;
  fda: boolean;
  halal: boolean;
  organic: boolean;
  customCompliance: Array<{
    name: string;
    status: boolean;
    verifiedBy: string;
    verifiedAt: string;
  }>;
}

export interface InventoryMovement {
  id: string;
  inventoryId: string;
  fromLocation: string;
  toLocation: string;
  movementType: 'PRODUCTION_INTAKE' | 'TRANSFER' | 'SHIPMENT' | 'RETURN' | 'DISPOSAL';
  staffId: string;
  timestamp: string;
  notes?: string;
  quantity: number;
  reason?: string;
  approvedBy?: string;
}

export interface InventoryTrackingInfo {
  currentLocation: string;
  status: string;
  lastMovement: InventoryMovement;
  qualityStatus: QualityCheckRecord;
  complianceStatus: ComplianceRecord;
  fullHistory: InventoryMovement[];
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Data Types
export interface FPFormData {
  id: string;
  lot_id: string;
  box_number: string;
  product_type: string;
  grade: string;
  weight: number;
  temperature: number;
  rfid_tag: string;
  qr_code: string;
  qr_data: QRCodeData;
  qc_staff_id: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  labels_printed: boolean;
  inventory_created: boolean;
  plant_id: string;
  station_id: string;
  processing_method_id: string;
}

// Event Types
export interface LabelFormatEvent {
  type: 'TEMPLATE_CREATED' | 'TEMPLATE_UPDATED' | 'TEMPLATE_DELETED' | 'PLANT_UPDATED' | 'STATION_ADDED';
  timestamp: string;
  userId: string;
  data: any;
}

// Utility Types
export type DataSourceType = 'static' | 'form' | 'plant' | 'regulation' | 'calculated';
export type FieldType = 'text' | 'number' | 'date' | 'qr' | 'barcode' | 'logo' | 'dynamic';
export type LabelSize = '4x6' | '4x4' | '2x4' | '3x5' | 'CUSTOM';
export type ProcessingCategory = 'freezing' | 'drying' | 'chilling' | 'pasteurizing' | 'packaging' | 'other';
export type ComplianceType = 'haccp' | 'fda' | 'iso22000' | 'halal' | 'organic';

// This export ensures the file is recognized as a module

// Additional missing types for API compatibility
export interface LabelTemplateFilters {
  category?: string;
  isActive?: boolean;
  plantId?: string;
  searchTerm?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  offset?: number;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PlantConfigFilters {
  isActive?: boolean;
  location?: string;
  searchTerm?: string;
  active?: boolean;
  region?: string;
  hasApproval?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  offset?: number;
}

export interface Approval {
  id: string;
  type: string;
  number: string;
  status: string;
  expiryDate: string;
  issuer: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

const _defaultExport = {};
export default _defaultExport;