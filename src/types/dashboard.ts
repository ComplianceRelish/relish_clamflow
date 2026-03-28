// src/types/dashboard.ts
// Complete TypeScript definitions from Backend Integration Guide
// All types match Railway backend API responses EXACTLY

// ============================================
// OPERATIONS DASHBOARD TYPES
// ============================================

export interface StationStatus {
  stationId: string;
  stationCode: string;
  stationName: string;
  plantType: 'PPC' | 'FP';
  stationType: string;
  currentOperator: string | null;
  assignedStaff: number;
  capacity: number;
  currentLot: string | null;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  efficiency: number;
  location: string;
}

export interface ActiveLot {
  lotId: string;
  currentStage: string;
  location: string;
  startTime: string;
  estimatedCompletion: string;
  supplier: string;
  species: string;
  weightKg: number;
}

export interface Bottleneck {
  stationId: string;
  stationCode: string;
  stationName: string;
  plantType: 'PPC' | 'FP' | 'System';
  severity: 'high' | 'medium';
  currentStaff: number;
  requiredStaff: number;
  waitingLots: number;
  averageWaitTime: number;
  reason: string;
}

// ============================================
// GATE MANAGEMENT TYPES
// ============================================

export interface VehicleLog {
  vehicleId: string;
  lotNumber: string;
  driverName: string;
  supplierName: string;
  entryTime: string;
  exitTime: string | null;
  status: 'in_facility' | 'departed';
  rfidCount: number;
  weight: number;
  contactNumber: string;
}

export interface ActiveDelivery {
  vehicleId: string;
  lotNumber: string;
  supplierName: string;
  entryTime: string;
  duration: string;
  rfidScanned: number;
  status: string;
}

export interface SupplierHistory {
  supplierId: string;
  supplierName: string;
  totalDeliveries: number;
  lastDelivery: string;
  avgWeight: number;
  contactNumber: string;
}

export interface CheckpointHistory {
  checkpointId: string;
  vehicleId: string;
  checkpointType: string;
  timestamp: string;
  operator: string;
  notes: string;
}

// ============================================
// SECURITY DASHBOARD TYPES
// ============================================

export interface Camera {
  cameraId: string;
  cameraName: string;
  location: string;
  status: 'online' | 'offline' | 'unknown';
  lastActivity: string | null;
  resolution: string;
  recordingEnabled: boolean;
  firmwareVersion: string;
}

export interface FaceDetectionEvent {
  eventId: string;
  personId: string;
  personName: string;
  location: string;
  timestamp: string;
  confidence: number;
  eventType: 'check-in' | 'check-out';
  method: string;
}

export interface SecurityEvent {
  eventId: string;
  eventType: string;
  location: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  resolvedAt: string | null;
}

export interface UnauthorizedAccess {
  eventId: string;
  location: string;
  timestamp: string;
  attemptType: string;
  cameraId: string | null;
  resolved: boolean;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface StationEfficiency {
  stationName: string;
  efficiency: number;
  lotsProcessed: number;
  avgProcessingTime: number;
}

export interface ThroughputData {
  daily: Array<{ date: string; count: number; weight: number }>;
  weekly: Array<{ week: string; count: number; weight: number }>;
  monthly: Array<{ month: string; count: number; weight: number }>;
}

export interface QualityMetrics {
  passRate: number;
  failRate: number;
  avgScore: number;
  byStation: Array<{
    station: string;
    passRate: number;
    failRate: number;
    totalTests: number;
  }>;
}

export interface ProcessingTime {
  stage: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  samples: number;
}

// ============================================
// STAFF DASHBOARD TYPES
// ============================================

export interface AttendanceRecord {
  userId: string;
  fullName: string;
  role: string;
  status: 'checked_in' | 'checked_out';
  checkInTime: string | null;
  location: string;
  shiftType: string;
  method: string;
}

export interface StaffPerformance {
  userId: string;
  fullName: string;
  role: string;
  lotsProcessed: number;
  avgProcessingTime: number;
  qualityScore: number;
  efficiency: number;
}

export interface StaffLocation {
  location: string;
  staffCount: number;
  staffMembers: Array<{
    userId: string;
    fullName: string;
    role: string;
  }>;
}

export interface ShiftSchedule {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  assignedStaff: number;
  station: string;
}

// ============================================
// INVENTORY DASHBOARD TYPES
// ============================================

export interface FinishedProduct {
  productId: string;
  lotNumber: string;
  species: string;
  supplierName: string;
  totalBoxes: number;
  totalWeight: number;
  status: 'packed' | 'tested' | 'ready_for_shipment';
  approvalStatus: 'pending' | 'qc_approved' | 'approved';
  testResultUploaded: boolean;
  createdAt: string;
}

export interface InventoryItem {
  itemId: string;
  lotNumber: string;
  species: string;
  quantity: number;
  weight: number;
  location: string;
  status: string;
  lastUpdated: string;
}

export interface TestResult {
  testId: string;
  lotNumber: string;
  species: string;
  testType: string;
  result: 'pass' | 'fail' | 'pending';
  testedBy: string;
  testedAt: string;
  notes: string;
}

export interface ReadyForShipment {
  shipmentId: string;
  lotNumber: string;
  species: string;
  totalBoxes: number;
  totalWeight: number;
  approvedAt: string;
  destination: string;
}

export interface PendingApproval {
  approvalId: string;
  lotNumber: string;
  species: string;
  submittedBy: string;
  submittedAt: string;
  approvalStage: 'qc' | 'supervisor';
  urgency: 'low' | 'medium' | 'high';
}

// ============================================
// WORKFLOW ENFORCEMENT TYPES (13-step sequential)
// ============================================

export type WorkflowStepType = 'data_entry' | 'qc_check' | 'approval' | 'scan' | 'processing';
export type WorkflowStepStatus = 'locked' | 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
export type QCResult = 'pass' | 'fail' | 'conditional';

export interface WorkflowStep {
  id: string;
  lotId: string;
  stepNumber: number;
  stepCode: string;
  stepName: string;
  stepType: WorkflowStepType;
  status: WorkflowStepStatus;
  startedAt: string | null;
  completedAt: string | null;
  completedBy: string | null;
  qcStaffId: string | null;
  qcResult: QCResult | null;
  qcNotes: string | null;
  referenceType: 'weight_note' | 'depuration_form' | 'ppc_form' | null;
  referenceId: string | null;
}

export interface WorkflowStatus {
  lotId: string;
  lotNumber: string;
  lotStatus: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  steps: WorkflowStep[];
}

export interface WorkflowCompleteResponse {
  message: string;
  completedStep: WorkflowStep;
  nextStep: WorkflowStep | null;
}

// ============================================
// ADMIN DASHBOARD TYPES (new response shapes)
// ============================================

export interface AdminOverviewData {
  production: {
    pendingApprovals: number;
    activeLots: number;
    pendingForms: number;
    formsReviewedToday: number;
  };
  staff: {
    staffOnSite: number;
    activeShifts: number;
    pendingShiftApprovals: number;
  };
  gate: {
    vehiclesInside: number;
    pendingTransfers: number;
    entriesToday: number;
    exitsToday: number;
  };
  quickStats: {
    totalPendingTasks: number;
    operationalAlerts: number;
    lastUpdated: string;
  };
}

export interface AdminPendingTask {
  id: string;
  type: 'lot_approval' | 'form_review' | 'shift_approval';
  title: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string | null;
  location: string;
}

export interface AdminPendingTasksResponse {
  success: boolean;
  data: AdminPendingTask[];
  total: number;
  summary: {
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  };
}

export interface AdminRecentActivity {
  id: string;
  type: 'lot_processed' | 'form_reviewed' | 'vehicle_entered' | 'vehicle_exited';
  user: string;
  description: string;
  timestamp: string;
  location: string;
}

export interface AdminRecentActivityResponse {
  success: boolean;
  data: AdminRecentActivity[];
  total: number;
  timeRangeHours: number;
}

export interface AdminOperationalAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
}

export interface AdminOperationalAlertsResponse {
  success: boolean;
  data: AdminOperationalAlert[];
  total: number;
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
}

// ============================================
// COMMON API RESPONSE WRAPPER
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  message?: string;
  status?: number;
}

// ============================================
// DASHBOARD METRICS (SUPER ADMIN OVERVIEW)
// ============================================

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalLots: number;
  pendingApprovals: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

export interface SystemHealthData {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  database: {
    status: 'connected' | 'disconnected';
    response_time: number;
  };
  services: {
    authentication: boolean;
    api: boolean;
    database: boolean;
    hardware: boolean;
  };
}

// ============================================
// HELPER TYPE GUARDS
// ============================================

export function isStationStatus(obj: unknown): obj is StationStatus {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'stationId' in obj &&
    'stationName' in obj &&
    'status' in obj
  );
}

export function isCamera(obj: unknown): obj is Camera {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'cameraId' in obj &&
    'cameraName' in obj &&
    'status' in obj
  );
}

export function isAttendanceRecord(obj: unknown): obj is AttendanceRecord {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'userId' in obj &&
    'fullName' in obj &&
    'status' in obj
  );
}
