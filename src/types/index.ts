// Core ClamFlow Types and Interfaces
export * from './forms'
export * from './auth'
export * from './inventory'
export * from './rfid'
export * from './api'

// Explicit re-exports from labelTypes to avoid conflicts
export type {
  LabelTemplate,
  DynamicDataSource,
  LabelField,
  FieldPosition,
  FieldStyle,
  FieldValidation,
  LabelLayout,
  ComplianceSettings,
  PlantConfiguration,
  PlantLocation,
  RegulatoryApprovals,
  ApprovalDetail,
  TemperatureRange,
  TimeRange,
  Equipment,
  ProcessingParameter,
  FPStation,
  StaffAssignment,
  OperatingHours,
  ShiftHours,
  QRCodeData,
  PackagingSpecification,
  LabelConfig,
  LabelData,
  InventoryRecord,
  QualityCheckRecord,
  PackagingInfo,
  ComplianceRecord,
  InventoryTrackingInfo,
  LabelFormatEvent,
  DataSourceType,
  FieldType,
  LabelSize,
  ProcessingCategory,
  ComplianceType,
  LabelTemplateFilters,
  TemplateValidationResult,
  PlantConfigFilters,
  Approval
} from './labelTypes'

// Re-export Location with namespace to avoid conflicts
import type { Location as LabelLocation } from './labelTypes'
export type { LabelLocation }

// Note: APIResponse, QualityCheck, InventoryMovement, FPFormData, PaginatedResponse, Location, and ProcessingMethod are excluded
// to avoid conflicts with the same types from api.ts, forms.ts, and inventory.ts

// Base Entity Interface
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// Common Status Types
export type Status = 'active' | 'inactive' | 'pending' | 'approved' | 'rejected'
export type ProcessingStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

// Location and Plant Types
export interface Location {
  latitude: number
  longitude: number
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
}

export interface Plant extends BaseEntity {
  name: string
  code: string
  location: Location
  status: Status
  capacity: number
  plant_type: 'processing' | 'storage' | 'distribution'
  certifications: string[]
  manager_id?: string
  contact_info: ContactInfo
}

export interface ContactInfo {
  email?: string
  phone?: string
  fax?: string
  website?: string
  contact_person?: string
}

// Quality Control Types
export interface QualityMetrics {
  temperature?: number
  humidity?: number
  ph_level?: number
  salinity?: number
  bacterial_count?: number
  weight_variance?: number
}

export interface QCCheckpoint {
  id: string
  name: string
  description: string
  required_metrics: string[]
  acceptance_criteria: Record<string, any>
  operator_id: string
  timestamp: string
}

// Processing Types
export interface ProcessingMethod {
  id: string
  name: string
  description: string
  parameters: Record<string, any>
  duration_minutes: number
  temperature_range?: {
    min: number
    max: number
    unit: 'celsius' | 'fahrenheit'
  }
}

// Batch and Lot Types
export interface Batch extends BaseEntity {
  batch_number: string
  lot_id: string
  product_type: string
  quantity: number
  weight_kg: number
  status: ProcessingStatus
  start_time?: string
  end_time?: string
  operator_id: string
  qc_status?: 'pending' | 'approved' | 'rejected'
  notes?: string
}

export interface Lot extends BaseEntity {
  lot_number: string
  supplier_id: string
  received_date: string
  quantity: number
  total_weight: number
  grade: 'A' | 'B' | 'C'
  status: Status
  origin_location?: string
  harvest_date?: string
  vessel_name?: string
}

// Notification Types
export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  read: boolean
  user_id: string
  action_url?: string
}

// Dashboard Types
export interface DashboardMetrics {
  total_lots: number
  active_batches: number
  pending_qc: number
  daily_production: number
  efficiency_rate: number
  quality_score: number
  alerts_count: number
  staff_on_duty: number
}

// Search and Filter Types
export interface SearchFilters {
  query?: string
  date_from?: string
  date_to?: string
  status?: Status[]
  plant_id?: string
  operator_id?: string
  product_type?: string
  grade?: string[]
}

export interface PaginationParams {
  page: number
  per_page: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys]

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
  user_id?: string
  action?: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}