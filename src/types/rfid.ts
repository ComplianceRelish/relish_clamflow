// RFID Integration and Tracking Types
import { BaseEntity } from './index'

export interface RFIDTag extends BaseEntity {
  tag_id: string
  tag_type: 'box' | 'employee' | 'vehicle' | 'equipment' | 'visitor'
  technology: 'UHF' | 'HF' | 'LF' | 'NFC'
  frequency: string
  read_range_meters: number
  entity_type: 'inventory_item' | 'employee' | 'vehicle' | 'equipment' | 'visitor_pass'
  entity_id: string
  status: 'active' | 'inactive' | 'lost' | 'damaged' | 'decommissioned'
  assigned_date: string
  last_read_time?: string
  last_reader_id?: string
  battery_level?: number
  firmware_version?: string
  encryption_enabled: boolean
  access_permissions: string[]
  custom_data?: Record<string, any>
}

export interface RFIDReader extends BaseEntity {
  id: string
  name: string
  location: string // Changed from ReaderLocation enum to string
  ip_address: string
  port: number
  status: ReaderStatus
  read_range?: number // Add this property
  last_seen: string
  firmware_version?: string
  // Legacy fields for backward compatibility
  reader_id?: string
  model?: string
  mac_address?: string
  supported_frequencies?: string[]
  antenna_count?: number
  last_heartbeat?: string
  configuration?: ReaderConfiguration
  statistics?: ReaderStatistics
}

export interface ReaderLocation {
  plant_id: string
  zone: string
  area: string
  coordinates?: {
    x: number
    y: number
    z?: number
  }
  description?: string
  access_level: 'public' | 'restricted' | 'secure'
}

export interface ReaderConfiguration {
  read_power_dbm: number
  session_flag: 0 | 1 | 2 | 3
  inventory_duration_ms: number
  read_timeout_ms: number
  tag_population_estimate: number
  anti_collision_enabled: boolean
  filter_settings?: RFIDFilter[]
  trigger_settings: TriggerSettings
  output_settings: OutputSettings
}

export interface RFIDFilter {
  memory_bank: 'EPC' | 'TID' | 'USER' | 'RESERVED'
  start_address: number
  data_length: number
  filter_data: string
  filter_action: 'include' | 'exclude'
  enabled: boolean
}

export interface TriggerSettings {
  auto_read: boolean
  gpio_trigger: boolean
  network_trigger: boolean
  scheduled_reads: ScheduledRead[]
}

export interface ScheduledRead {
  id: string
  name: string
  cron_expression: string
  enabled: boolean
  duration_seconds: number
  tag_filters?: RFIDFilter[]
}

export interface OutputSettings {
  real_time_streaming: boolean
  batch_mode: boolean
  batch_size: number
  batch_timeout_seconds: number
  output_format: 'json' | 'xml' | 'csv'
  include_metadata: boolean
}

export interface ReaderStatistics {
  total_reads_today: number
  unique_tags_today: number
  read_rate_per_second: number
  success_rate_percentage: number
  error_count_today: number
  last_error?: string
  uptime_percentage: number
  data_throughput_kbps: number
}

export interface RFIDScanData {
  scan_id: string
  tag_id: string
  reader_id: string
  timestamp: string
  rssi_dbm: number
  antenna_port: number
  read_count: number
  phase_angle?: number
  doppler_frequency?: number
  location_coordinates?: {
    x: number
    y: number
    z?: number
  }
  scan_context: ScanContext
  validated: boolean
  processing_status: 'pending' | 'processed' | 'failed' | 'ignored'
  associated_records?: AssociatedRecord[]
}

export interface ScanContext {
  operation_type: 'gate_entry' | 'gate_exit' | 'attendance' | 'inventory_check' | 'process_tracking' | 'quality_control'
  operator_id?: string
  work_order_id?: string
  location_zone: string
  environmental_conditions?: {
    temperature: number
    humidity: number
    interference_level: number
  }
  additional_data?: Record<string, any>
}

export interface AssociatedRecord {
  record_type: 'inventory_movement' | 'attendance_log' | 'gate_log' | 'quality_check' | 'process_step'
  record_id: string
  created: boolean
  error_message?: string
}

// RFID Events and Alerts
export interface RFIDEvent extends BaseEntity {
  event_type: 'tag_read' | 'tag_lost' | 'reader_offline' | 'unauthorized_read' | 'system_error' | 'maintenance_required'
  severity: 'info' | 'warning' | 'error' | 'critical'
  source: 'reader' | 'tag' | 'system' | 'user'
  source_id: string
  title: string
  description: string
  event_data?: Record<string, any>
  acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: string
  resolved: boolean
  resolved_by?: string
  resolved_at?: string
  resolution_notes?: string
}

export interface RFIDAlert extends RFIDEvent {
  alert_rule_id?: string
  notification_sent: boolean
  notification_recipients: string[]
  escalation_level: number
  auto_resolve: boolean
  correlation_id?: string
}

// RFID System Configuration
export interface RFIDSystemSettings {
  system_id: string
  plant_id: string
  enabled: boolean
  default_read_power: number
  global_filters: RFIDFilter[]
  data_retention_days: number
  real_time_processing: boolean
  backup_enabled: boolean
  encryption_required: boolean
  audit_logging: boolean
  integration_endpoints: IntegrationEndpoint[]
  alert_rules: AlertRule[]
}

export interface IntegrationEndpoint {
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  authentication: {
    type: 'none' | 'basic' | 'bearer' | 'api_key'
    credentials?: Record<string, string>
  }
  data_mapping: Record<string, string>
  retry_policy: {
    max_retries: number
    retry_delay_ms: number
    backoff_multiplier: number
  }
  enabled: boolean
}

export interface AlertRule {
  rule_id: string
  name: string
  description: string
  condition: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  enabled: boolean
  notification_channels: ('email' | 'sms' | 'push' | 'webhook')[]
  recipients: string[]
  cooldown_minutes: number
  escalation_rules?: EscalationRule[]
}

export interface EscalationRule {
  delay_minutes: number
  severity: 'info' | 'warning' | 'error' | 'critical'
  recipients: string[]
  notification_channels: ('email' | 'sms' | 'push' | 'webhook')[]
}

// Business Logic Integration
export interface AttendanceRecord extends BaseEntity {
  employee_id: string
  rfid_tag_id: string
  reader_id: string
  clock_in_time?: string
  clock_out_time?: string
  break_start_time?: string
  break_end_time?: string
  total_work_hours?: number
  overtime_hours?: number
  status: 'clocked_in' | 'clocked_out' | 'on_break' | 'overtime'
  location: string
  approved: boolean
  approved_by?: string
  notes?: string
}

export interface GateLog extends BaseEntity {
  gate_id: string
  direction: 'entry' | 'exit'
  vehicle_id?: string
  driver_id?: string
  visitor_id?: string
  rfid_tags_read: string[]
  timestamp: string
  operator_id: string
  purpose: string
  authorized: boolean
  authorization_method: 'rfid' | 'manual' | 'biometric' | 'qr_code'
  cargo_details?: CargoDetails[]
  quality_seal_verified?: boolean
  documents_checked?: string[]
  notes?: string
}

export interface CargoDetails {
  product_type: string
  quantity: number
  weight_kg: number
  destination?: string
  lot_numbers: string[]
  quality_certificates: string[]
  temperature_required?: number
  special_handling?: string[]
}

export interface BoxTracking extends BaseEntity {
  box_id: string
  rfid_tag_id: string
  current_location: string
  current_status: 'in_storage' | 'in_transit' | 'in_processing' | 'shipped' | 'delivered'
  location_history: LocationHistoryEntry[]
  handling_events: HandlingEvent[]
  quality_checks: BoxQualityCheck[]
  chain_of_custody: ChainOfCustodyEntry[]
}

export interface LocationHistoryEntry {
  location: string
  reader_id: string
  timestamp: string
  duration_minutes?: number
  moved_by?: string
  reason?: string
}

export interface HandlingEvent {
  event_type: 'received' | 'moved' | 'processed' | 'inspected' | 'packaged' | 'shipped'
  timestamp: string
  operator_id: string
  location: string
  parameters?: Record<string, any>
  quality_impact?: 'positive' | 'negative' | 'neutral'
  notes?: string
}

export interface BoxQualityCheck {
  inspector_id: string
  check_time: string
  check_type: 'visual' | 'temperature' | 'weight' | 'documentation'
  results: Record<string, any>
  passed: boolean
  corrective_actions?: string[]
  next_check_due?: string
}

export interface ChainOfCustodyEntry {
  transferred_from: string
  transferred_to: string
  timestamp: string
  authorization_method: string
  witness?: string
  documentation?: string[]
  condition_notes?: string
}

// Analytics and Reporting
export interface RFIDAnalytics {
  time_period: {
    start: string
    end: string
  }
  total_reads: number
  unique_tags: number
  reader_utilization: ReaderUtilization[]
  tag_movement_patterns: TagMovementPattern[]
  system_performance: SystemPerformance
  business_insights: BusinessInsight[]
}

export interface ReaderUtilization {
  reader_id: string
  reader_name: string
  total_reads: number
  unique_tags: number
  uptime_percentage: number
  average_reads_per_hour: number
  peak_usage_hour: string
  error_rate_percentage: number
}

export interface TagMovementPattern {
  zone_from: string
  zone_to: string
  movement_count: number
  average_duration_minutes: number
  peak_movement_hour: string
  associated_processes: string[]
}

export interface SystemPerformance {
  overall_uptime_percentage: number
  average_response_time_ms: number
  data_processing_rate: number
  error_rate_percentage: number
  storage_utilization_percentage: number
  network_throughput_mbps: number
}

export interface BusinessInsight {
  insight_type: 'efficiency' | 'compliance' | 'security' | 'inventory' | 'quality'
  title: string
  description: string
  impact_score: number
  recommendation: string
  supporting_data: Record<string, any>
}

// Mobile and Handheld Device Integration
export interface HandheldReaderConfig {
  device_id: string
  user_id: string
  application_mode: 'inventory' | 'attendance' | 'quality_check' | 'maintenance'
  offline_capability: boolean
  sync_interval_minutes: number
  battery_warning_threshold: number
  barcode_scanning_enabled: boolean
  photo_capture_enabled: boolean
  location_tracking_enabled: boolean
}

export interface OfflineOperation {
  operation_id: string
  device_id: string
  operation_type: 'scan' | 'update' | 'create' | 'delete'
  timestamp: string
  data: Record<string, any>
  synced: boolean
  sync_timestamp?: string
  conflicts?: SyncConflict[]
}

export interface SyncConflict {
  field: string
  local_value: any
  server_value: any
  resolution: 'use_local' | 'use_server' | 'manual_merge'
  resolved_by?: string
  resolved_at?: string
}

// Security and Compliance
export interface RFIDSecurityLog extends BaseEntity {
  event_type: 'unauthorized_access' | 'data_breach' | 'tampering_detected' | 'encryption_failure' | 'audit_log_access'
  severity: 'low' | 'medium' | 'high' | 'critical'
  source_ip?: string
  user_id?: string
  affected_components: string[]
  description: string
  remediation_actions: string[]
  investigated: boolean
  investigator_id?: string
  investigation_notes?: string
  resolved: boolean
  resolution_summary?: string
}

export interface ComplianceAudit {
  audit_id: string
  audit_type: 'internal' | 'external' | 'regulatory'
  auditor: string
  audit_date: string
  scope: string[]
  findings: AuditFinding[]
  overall_compliance_score: number
  recommendations: string[]
  follow_up_required: boolean
  follow_up_date?: string
  certificate_issued?: boolean
  certificate_expiry?: string
}

export interface AuditFinding {
  finding_id: string
  category: 'data_integrity' | 'security' | 'process' | 'documentation' | 'technology'
  severity: 'minor' | 'major' | 'critical'
  description: string
  evidence: string[]
  requirement_reference: string
  corrective_action_required: boolean
  target_completion_date?: string
  responsible_person?: string
  status: 'open' | 'in_progress' | 'closed' | 'deferred'
}

// ========================================
// ADDITIONAL RFID TYPES
// ========================================

// Reader Status Type
export type ReaderStatus = 'online' | 'offline' | 'error' | 'maintenance'

// RFID Scan Result Interface
export interface RFIDScanResult {
  tagId: string
  readerId: string
  timestamp: string
  rssi: number
  location: string
  data?: Record<string, any>
}

// Batch Scan Operation Interface
export interface BatchScanOperation {
  readerIds: string[]
  duration: number
  mode: 'inventory' | 'attendance' | 'access'
  filters: {
    rssiThreshold: number
    duplicateWindow: number
  }
}