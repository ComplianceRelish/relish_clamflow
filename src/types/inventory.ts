// Inventory and Product Management Types
import { BaseEntity } from './index'

export interface Product extends BaseEntity {
  product_code: string
  name: string
  category: 'whole_clam' | 'clam_meat' | 'clam_shell' | 'processed_clam' | 'byproduct'
  description?: string
  unit_of_measure: 'kg' | 'pieces' | 'boxes'
  standard_weight?: number
  shelf_life_days?: number
  storage_requirements: StorageRequirements
  nutritional_info?: NutritionalInfo
  allergen_info?: string[]
  status: 'active' | 'discontinued' | 'seasonal'
}

export interface StorageRequirements {
  temperature_min: number
  temperature_max: number
  temperature_unit: 'celsius' | 'fahrenheit'
  humidity_min?: number
  humidity_max?: number
  special_conditions?: string[]
  storage_location_type: 'freezer' | 'chiller' | 'ambient' | 'controlled_atmosphere'
}

export interface NutritionalInfo {
  calories_per_100g: number
  protein_g: number
  fat_g: number
  carbohydrates_g: number
  sodium_mg: number
  cholesterol_mg?: number
  fiber_g?: number
  sugar_g?: number
  vitamins?: Record<string, number>
  minerals?: Record<string, number>
}

export interface InventoryItem extends BaseEntity {
  product_id: string
  product: Product
  lot_id: string
  lot: Lot
  quantity: number
  weight_kg: number
  unit_cost: number
  total_value: number
  location: StorageLocation
  status: 'available' | 'reserved' | 'allocated' | 'expired' | 'damaged' | 'quarantined'
  quality_grade: 'A' | 'B' | 'C'
  expiry_date?: string
  last_quality_check?: string
  last_movement?: InventoryMovement
  batch_number?: string
  serial_numbers?: string[]
  rfid_tags?: string[]
}

export interface StorageLocation extends BaseEntity {
  location_code: string
  name: string
  location_type: 'warehouse' | 'freezer' | 'chiller' | 'processing_area' | 'quarantine' | 'shipping'
  capacity_kg: number
  current_utilization_kg: number
  temperature_current?: number
  humidity_current?: number
  plant_id: string
  zone: string
  aisle?: string
  shelf?: string
  position?: string
  access_restrictions?: string[]
  equipment_ids?: string[]
}

export interface InventoryMovement extends BaseEntity {
  inventory_item_id: string
  movement_type: 'receipt' | 'transfer' | 'consumption' | 'adjustment' | 'disposal' | 'sale'
  quantity_before: number
  quantity_change: number
  quantity_after: number
  from_location?: StorageLocation
  to_location?: StorageLocation
  reference_document?: string
  reference_id?: string
  performed_by: string
  approved_by?: string
  reason: string
  cost_impact?: number
  notes?: string
}

export interface StockAlert extends BaseEntity {
  inventory_item_id: string
  alert_type: 'low_stock' | 'expiry_warning' | 'temperature_breach' | 'quality_issue' | 'overstock'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  threshold_value?: number
  current_value?: number
  triggered_at: string
  acknowledged_at?: string
  acknowledged_by?: string
  resolved_at?: string
  resolved_by?: string
  action_taken?: string
}

export interface Lot extends BaseEntity {
  lot_number: string
  supplier_id: string
  supplier: Supplier
  product_id: string
  product: Product
  received_date: string
  received_by: string
  quantity_received: number
  weight_received_kg: number
  current_quantity: number
  current_weight_kg: number
  quality_grade: 'A' | 'B' | 'C'
  origin_details: OriginDetails
  certificates: Certificate[]
  quality_tests: QualityTest[]
  processing_history: ProcessingRecord[]
  traceability_code: string
  status: 'received' | 'in_processing' | 'processed' | 'shipped' | 'recalled'
  notes?: string
}

export interface Supplier extends BaseEntity {
  supplier_code: string
  company_name: string
  contact_person: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  tax_id?: string
  license_numbers: string[]
  certifications: string[]
  rating: number
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval'
  payment_terms?: string
  credit_limit?: number
  boat_fleet?: BoatInfo[]
  quality_score?: number
  delivery_performance?: number
  compliance_score?: number
}

export interface BoatInfo {
  vessel_name: string
  registration_number: string
  capacity_kg: number
  captain_name: string
  captain_license: string
  fishing_areas: string[]
  equipment: string[]
  last_inspection_date?: string
  certifications: string[]
}

export interface OriginDetails {
  harvest_date: string
  harvest_location: {
    latitude: number
    longitude: number
    area_name: string
    water_body: string
    jurisdiction: string
  }
  vessel_info: BoatInfo
  fishing_method: string
  sea_conditions?: {
    temperature: number
    salinity: number
    weather: string
  }
  handling_details?: {
    time_to_ice: number
    storage_temperature: number
    transport_duration_hours: number
  }
}

export interface Certificate extends BaseEntity {
  certificate_type: 'health' | 'quality' | 'origin' | 'organic' | 'sustainability' | 'halal' | 'kosher'
  certificate_number: string
  issued_by: string
  issued_date: string
  expiry_date?: string
  status: 'valid' | 'expired' | 'revoked' | 'pending_renewal'
  document_url?: string
  verification_code?: string
  scope: string
  lot_ids: string[]
}

export interface QualityTest extends BaseEntity {
  test_type: 'microbiological' | 'chemical' | 'physical' | 'sensory' | 'nutritional'
  test_name: string
  sample_id: string
  test_date: string
  tested_by: string
  laboratory?: string
  methodology: string
  parameters: QualityTestParameter[]
  overall_result: 'pass' | 'fail' | 'conditional_pass' | 'pending'
  report_url?: string
  cost?: number
  turnaround_time_hours?: number
  accreditation?: string
}

export interface QualityTestParameter {
  parameter_name: string
  unit: string
  test_value: number
  acceptable_min?: number
  acceptable_max?: number
  specification_limit: string
  result: 'pass' | 'fail' | 'borderline'
  method_used?: string
  detection_limit?: number
  uncertainty?: number
}

export interface ProcessingRecord extends BaseEntity {
  process_type: 'cleaning' | 'grading' | 'packaging' | 'freezing' | 'cooking' | 'smoking' | 'drying'
  process_name: string
  start_time: string
  end_time?: string
  duration_minutes?: number
  input_quantity: number
  output_quantity?: number
  yield_percentage?: number
  operator_id: string
  equipment_used?: string[]
  process_parameters: ProcessParameter[]
  quality_checks: ProcessQualityCheck[]
  batch_code?: string
  notes?: string
}

export interface ProcessParameter {
  parameter_name: string
  target_value: number
  actual_value?: number
  unit: string
  tolerance?: number
  recorded_at: string
  within_specification: boolean
}

export interface ProcessQualityCheck {
  check_type: string
  inspector_id: string
  check_time: string
  results: Record<string, any>
  passed: boolean
  corrective_actions?: string[]
  notes?: string
}

// Inventory Reports and Analytics
export interface InventoryReport {
  report_id: string
  report_type: 'stock_summary' | 'movement_analysis' | 'expiry_report' | 'valuation' | 'compliance'
  generated_by: string
  generated_at: string
  period_from: string
  period_to: string
  filters_applied?: Record<string, any>
  data: any
  summary: InventoryReportSummary
  export_url?: string
}

export interface InventoryReportSummary {
  total_items: number
  total_value: number
  average_age_days: number
  turnover_rate: number
  stock_accuracy_percentage: number
  alerts_count: number
  movements_count: number
  waste_percentage: number
}

export interface InventoryValuation {
  inventory_item_id: string
  method: 'fifo' | 'lifo' | 'weighted_average' | 'specific_identification'
  unit_cost: number
  quantity: number
  total_value: number
  as_of_date: string
  last_movement_date?: string
  age_days: number
  carrying_cost?: number
  obsolescence_reserve?: number
  net_realizable_value?: number
}

export interface StockTake extends BaseEntity {
  stock_take_number: string
  scheduled_date: string
  actual_start_date?: string
  actual_end_date?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  type: 'full' | 'partial' | 'cycle'
  locations: string[]
  conducted_by: string[]
  approved_by?: string
  items_counted: number
  discrepancies_found: number
  total_adjustment_value: number
  adjustment_entries: StockAdjustment[]
  notes?: string
}

export interface StockAdjustment extends BaseEntity {
  stock_take_id: string
  inventory_item_id: string
  book_quantity: number
  physical_quantity: number
  variance: number
  variance_percentage: number
  unit_cost: number
  value_adjustment: number
  reason_code: string
  reason_description?: string
  approved_by?: string
  processed_at?: string
}

// Inventory Configuration
export interface InventorySettings {
  default_costing_method: 'fifo' | 'lifo' | 'weighted_average'
  reorder_point_calculation: 'manual' | 'automatic'
  lead_time_days: number
  safety_stock_percentage: number
  expiry_warning_days: number
  temperature_tolerance: number
  automatic_lot_creation: boolean
  rfid_tracking_enabled: boolean
  barcode_format: string
  quality_hold_period_hours: number
  default_storage_location_id?: string
}

// Dashboard and Analytics Types
export interface InventoryMetrics {
  total_stock_value: number
  total_items_count: number
  available_items: number
  reserved_items: number
  expired_items: number
  low_stock_alerts: number
  average_age_days: number
  turnover_ratio: number
  waste_percentage: number
  compliance_score: number
}

export interface InventoryTrend {
  date: string
  stock_value: number
  quantity: number
  movements_count: number
  receipts: number
  issues: number
  adjustments: number
}

export interface ProductPerformance {
  product_id: string
  product_name: string
  total_received: number
  total_issued: number
  current_stock: number
  turnover_rate: number
  average_age_days: number
  quality_issues_count: number
  profitability_score: number
  demand_trend: 'increasing' | 'decreasing' | 'stable'
}

// Search and Filter Types for Inventory
export interface InventoryFilters {
  product_categories?: string[]
  suppliers?: string[]
  locations?: string[]
  quality_grades?: ('A' | 'B' | 'C')[]
  status?: ('available' | 'reserved' | 'expired' | 'damaged')[]
  expiry_date_from?: string
  expiry_date_to?: string
  received_date_from?: string
  received_date_to?: string
  value_range?: {
    min: number
    max: number
  }
  lot_numbers?: string[]
}

export interface InventorySearchResult {
  items: InventoryItem[]
  total_count: number
  total_value: number
  filters_applied: InventoryFilters
  aggregations: {
    by_category: Record<string, number>
    by_location: Record<string, number>
    by_grade: Record<string, number>
    by_status: Record<string, number>
  }
}