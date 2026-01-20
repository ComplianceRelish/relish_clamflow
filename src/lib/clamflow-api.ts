// src/lib/clamflow-api.ts
import { User } from '../types/auth';
import {
  StationStatus,
  ActiveLot,
  Bottleneck,
  VehicleLog,
  ActiveDelivery,
  SupplierHistory,
  CheckpointHistory,
  Camera,
  FaceDetectionEvent,
  SecurityEvent,
  UnauthorizedAccess,
  StationEfficiency,
  ThroughputData,
  QualityMetrics,
  ProcessingTime,
  AttendanceRecord,
  StaffPerformance,
  StaffLocation,
  ShiftSchedule,
  FinishedProduct,
  InventoryItem,
  TestResult,
  ReadyForShipment,
  PendingApproval,
  DashboardMetrics,
  SystemHealthData,
} from '../types/dashboard';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// DashboardMetrics and SystemHealthData now imported from ../types/dashboard

export interface ApprovalItem {
  id: string;
  form_type: 'weight_note' | 'ppc_form' | 'fp_form' | 'qc_form' | 'depuration_form';
  form_id: string;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'approval_required';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  user_id: string;
  username: string;
  full_name: string;
  role: string;
  timestamp: string;
  ip_address: string;
  status: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clamflowbackend-production.up.railway.app';

// ============================================
// STATIONS API INTERFACES - Per FRONTEND_API_INTEGRATION.md
// ============================================

export interface StationDefinition {
  id: string;
  name: string;
  code: string;
  plant_type: 'PPC' | 'FP';
  station_type: string;
  capacity: number;
  status: 'operational' | 'maintenance' | 'offline';
  location: string | null;
  station_order: number;
  description: string | null;
  required_skills: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StationAssignment {
  id: string;
  station_id: string;
  staff_id: string;
  shift_assignment_id: string | null;
  assigned_date: string;
  start_time: string | null;
  end_time: string | null;
  status: 'active' | 'completed' | 'cancelled';
  notes: string | null;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StationWithAssignments extends StationDefinition {
  assignments: Array<{
    id: string;
    staff_id: string;
    staff_name: string;
    assigned_date: string;
    start_time: string | null;
    end_time: string | null;
    status: string;
  }>;
}

// ============================================
// SHIFTS API INTERFACES - Per FRONTEND_API_INTEGRATION.md
// ============================================

export interface ShiftDefinition {
  id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  color: string;
  is_active: boolean;
  applies_to_plants: string[];
  created_at: string;
  updated_at: string;
}

export interface ShiftAssignment {
  id: string;
  staff_id: string;
  shift_definition_id: string;
  date: string;
  plant: 'PPC' | 'FP';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffForScheduler {
  id: string;
  full_name: string;
  employee_id: string;
  department: string;
  plant: string;
  is_active: boolean;
}

// ============================================
// FORMS INTERFACES
// ============================================

// Weight Note interface matching backend response
interface WeightNoteFormData {
  id: string;
  lot_id: string;
  supplier_id: string;
  box_number: string;
  weight: number;
  gross_weight?: number;
  tare_weight?: number;
  net_weight?: number;
  temperature?: number;
  visual_quality?: string;
  shell_condition?: string;
  notes?: string;
  status?: string;
  qc_staff_name?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// PPC Form interface matching backend response
interface PPCFormData {
  id: string;
  lot_id: string;
  box_number: string;
  product_type?: string;
  grade?: string;
  weight?: number;
  status?: string;
  qc_staff_name?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// FP Form interface matching backend response
interface FPFormData {
  id: string;
  lot_id: string;
  box_number: string;
  rfid_tag?: string;
  product_type?: string;
  grade?: string;
  weight?: number;
  status?: string;
  qc_staff_name?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface AdminFormData {
  username: string;
  full_name: string;
  email?: string;
  password: string;
  role: string;
  station: string;
  contact_number?: string;
}

class ClamFlowAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    // Ensure HTTPS protocol and remove trailing slash
    this.baseURL = baseURL.replace(/^http:/, 'https:').replace(/\/$/, '');
    
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('clamflow_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      
      // Log the URL to catch any HTTP protocol issues
      if (url.startsWith('http:')) {
        console.error('🚨 SECURITY WARNING: Attempting HTTP request to:', url);
        console.error('🔧 This should be HTTPS. Forcing HTTPS...');
      }
      
      const config: RequestInit = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      };

      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          this.handleUnauthorized();
          throw new Error('Authentication required');
        }

        const errorData = await response.json().catch(() => ({}));
        
        // Enhanced error handling for 422 validation errors
        if (response.status === 422) {
          console.error('🔴 Validation Error [422]:', errorData);
          
          // Try to extract detailed validation errors
          let errorMessage = 'Validation failed';
          
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              // FastAPI validation error format
              const errors = errorData.detail.map((err: any) => 
                `${err.loc?.join('.') || 'field'}: ${err.msg}`
              ).join(', ');
              errorMessage = errors;
            } else if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
          
          throw new Error(errorMessage);
        }
        
        const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`;
        console.error(`❌ API Error [${response.status}] ${endpoint}:`, errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // 🛡️ DEFENSIVE: Handle paginated responses - unwrap various formats
      let finalData = data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Check for common pagination wrapper keys
        const wrapperKeys = ['items', 'finished_products', 'test_results', 'data'];
        for (const key of wrapperKeys) {
          if (key in data && Array.isArray(data[key])) {
            console.log(`📦 Unwrapping paginated response from ${endpoint} (key: ${key})`);
            finalData = data[key];
            break;
          }
        }
      }
      
      // 🛡️ DEFENSIVE: Ensure array endpoints return arrays
      if (this.isArrayEndpoint(endpoint) && !Array.isArray(finalData)) {
        console.warn(`⚠️ Expected array from ${endpoint}, got:`, typeof finalData, finalData);
        return { success: true, data: [] as T };
      }
      
      return { success: true, data: finalData };
    } catch (error) {
      console.error(`💥 Request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private isArrayEndpoint(endpoint: string): boolean {
    // List of endpoints that should return arrays
    const arrayEndpoints = [
      '/api/operations/stations',
      '/api/operations/active-lots',
      '/api/operations/bottlenecks',
      '/api/gate/vehicles',
      '/api/gate/active',
      '/api/gate/suppliers',
      '/api/security/cameras',
      '/api/security/events',
      '/api/security/face-detection',
      '/api/staff/attendance',
      '/api/staff/locations',
      '/api/staff/performance',
      '/api/inventory/finished-products',
      '/api/inventory/items',
      '/api/inventory/test-results',
    ];
    return arrayEndpoints.some(path => endpoint.includes(path));
  }

  private handleUnauthorized() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clamflow_token');
      localStorage.removeItem('clamflow_user');
      window.location.href = '/login';
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // AUTHENTICATION
  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.post('/auth/login', { username, password });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get('/user/profile');
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return this.get('/api/users/');
  }

  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.post('/api/users/', userData);
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.put(`/api/users/${userId}`, userData);
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return this.delete(`/api/users/${userId}`);
  }

  // FORMS
  async getWeightNotes(): Promise<ApiResponse<WeightNoteFormData[]>> {
    return this.get('/api/weight-notes');
  }

  async createWeightNote(formData: WeightNoteFormData): Promise<ApiResponse<WeightNoteFormData>> {
    return this.post('/api/weight-notes', formData);
  }

  async approveWeightNote(noteId: string): Promise<ApiResponse<WeightNoteFormData>> {
    return this.put(`/api/weight-notes/${noteId}/approve`);
  }

  // DASHBOARD - Updated to match backend
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    return this.get('/dashboard/metrics');
  }

  async getSystemHealth(): Promise<ApiResponse<SystemHealthData>> {
    return this.get('/health');
  }

  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return this.get('/notifications/');
  }

  async getAuditLogs(): Promise<ApiResponse<AuditLog[]>> {
    return this.get('/audit/logs');
  }

  // APPROVAL WORKFLOW
  async getPendingApprovals(): Promise<ApiResponse<ApprovalItem[]>> {
    return this.get('/api/approval/pending');
  }

  async approveForm(formId: string, formType: string): Promise<ApiResponse<unknown>> {
    return this.put(`/api/approval/${formId}/approve`, { form_type: formType });
  }

  async rejectForm(formId: string, reason?: string): Promise<ApiResponse<unknown>> {
    return this.put(`/api/approval/${formId}/reject`, { rejection_reason: reason });
  }

  // SUPER ADMIN
  async getAdmins(): Promise<ApiResponse<User[]>> {
    // Try multiple endpoints to find admins
    try {
      const response = await this.get<User[]>('/super-admin/admins');
      if (response.success && response.data) {
        return response;
      }
    } catch (err) {
      console.warn('Failed to get from /super-admin/admins, trying /api/users/');
    }
    
    // Fallback to general users endpoint filtered by admin roles (with trailing slash to avoid 307)
    return this.get<User[]>('/api/users/');
  }

  async createAdmin(adminData: AdminFormData): Promise<ApiResponse<User>> {
    return this.post('/super-admin/create-admin', adminData);
  }

  async updateAdmin(adminId: string, adminData: Partial<AdminFormData>): Promise<ApiResponse<User>> {
    return this.put(`/super-admin/admins/${adminId}`, adminData);
  }

  async deleteAdmin(adminId: string): Promise<ApiResponse<void>> {
    return this.delete(`/super-admin/admins/${adminId}`);
  }

  async getApiMonitoring(): Promise<ApiResponse<unknown>> {
    return this.get('/super-admin/api-monitoring');
  }

  // OPERATIONS MONITOR
  async getStations(): Promise<ApiResponse<StationStatus[]>> {
    return this.get('/api/operations/stations');
  }

  async getActiveLots(): Promise<ApiResponse<ActiveLot[]>> {
    return this.get('/api/operations/active-lots');
  }

  async getBottlenecks(): Promise<ApiResponse<Bottleneck[]>> {
    return this.get('/api/operations/bottlenecks');
  }

  // LIVE OPERATIONS - Real-time dashboard data
  async getLiveOperations(): Promise<ApiResponse<{
    stations: Array<{
      id: string;
      name: string;
      code: string;
      plant_type: string;
      status: string;
      current_staff: Array<{ id: string; name: string }>;
      active_lot: { lot_number: string; product: string } | null;
    }>;
    active_lots: Array<{
      lot_number: string;
      status: string;
      current_station: string;
      progress_percentage: number;
    }>;
    bottlenecks: Array<{
      station: string;
      queue_count: number;
      wait_time_minutes: number;
    }>;
    timestamp: string;
  }>> {
    return this.get('/api/operations/live');
  }

  // ============================================
  // STATIONS API - Per FRONTEND_API_INTEGRATION.md
  // ============================================

  // Station Definitions
  async getStationDefinitions(plantType?: 'PPC' | 'FP', status?: string): Promise<ApiResponse<StationDefinition[]>> {
    const params = new URLSearchParams();
    if (plantType) params.append('plant_type', plantType);
    if (status) params.append('status', status);
    const query = params.toString();
    return this.get(`/api/stations/${query ? '?' + query : ''}`);
  }

  async getStationsWithAssignments(date: string, plantType?: 'PPC' | 'FP'): Promise<ApiResponse<StationWithAssignments[]>> {
    const params = new URLSearchParams({ date });
    if (plantType) params.append('plant_type', plantType);
    return this.get(`/api/stations/with-assignments?${params.toString()}`);
  }

  async getStation(stationId: string): Promise<ApiResponse<StationDefinition>> {
    return this.get(`/api/stations/${stationId}`);
  }

  async createStation(stationData: Partial<StationDefinition>): Promise<ApiResponse<StationDefinition>> {
    return this.post('/api/stations/', stationData);
  }

  async updateStation(stationId: string, stationData: Partial<StationDefinition>): Promise<ApiResponse<StationDefinition>> {
    return this.put(`/api/stations/${stationId}`, stationData);
  }

  async deleteStation(stationId: string): Promise<ApiResponse<void>> {
    return this.delete(`/api/stations/${stationId}`);
  }

  // Station Assignments
  async getStationAssignments(params?: {
    station_id?: string;
    staff_id?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    status?: 'active' | 'completed' | 'cancelled';
  }): Promise<ApiResponse<StationAssignment[]>> {
    const urlParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) urlParams.append(key, value);
      });
    }
    const query = urlParams.toString();
    return this.get(`/api/stations/assignments/${query ? '?' + query : ''}`);
  }

  async getStationAssignment(assignmentId: string): Promise<ApiResponse<StationAssignment>> {
    return this.get(`/api/stations/assignments/${assignmentId}`);
  }

  async createStationAssignment(assignmentData: {
    station_id: string;
    staff_id: string;
    assigned_date: string;
    start_time?: string;
    end_time?: string;
    shift_assignment_id?: string;
    notes?: string;
  }): Promise<ApiResponse<StationAssignment>> {
    return this.post('/api/stations/assignments/', assignmentData);
  }

  async updateStationAssignment(assignmentId: string, assignmentData: Partial<StationAssignment>): Promise<ApiResponse<StationAssignment>> {
    return this.put(`/api/stations/assignments/${assignmentId}`, assignmentData);
  }

  async deleteStationAssignment(assignmentId: string): Promise<ApiResponse<void>> {
    return this.delete(`/api/stations/assignments/${assignmentId}`);
  }

  async bulkCreateStationAssignments(data: {
    date: string;
    assignments: Array<{
      station_id: string;
      staff_id: string;
      start_time?: string;
      end_time?: string;
      notes?: string;
    }>;
  }): Promise<ApiResponse<{ created: number; updated: number; assignments: StationAssignment[] }>> {
    return this.post('/api/stations/assignments/bulk', data);
  }

  async clearAssignmentsForDate(date: string): Promise<ApiResponse<void>> {
    return this.delete(`/api/stations/assignments/by-date/${date}`);
  }

  // ============================================
  // SHIFTS API - Per FRONTEND_API_INTEGRATION.md
  // ============================================

  // Shift Definitions
  async getShiftDefinitions(): Promise<ApiResponse<ShiftDefinition[]>> {
    return this.get('/api/shifts/shift-definitions');
  }

  async getShiftDefinition(definitionId: string): Promise<ApiResponse<ShiftDefinition>> {
    return this.get(`/api/shifts/shift-definitions/${definitionId}`);
  }

  async createShiftDefinition(shiftData: {
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    break_duration_minutes?: number;
    color?: string;
    applies_to_plants?: string[];
  }): Promise<ApiResponse<ShiftDefinition>> {
    return this.post('/api/shifts/shift-definitions', shiftData);
  }

  async updateShiftDefinition(definitionId: string, shiftData: Partial<ShiftDefinition>): Promise<ApiResponse<ShiftDefinition>> {
    return this.put(`/api/shifts/shift-definitions/${definitionId}`, shiftData);
  }

  async deleteShiftDefinition(definitionId: string): Promise<ApiResponse<void>> {
    return this.delete(`/api/shifts/shift-definitions/${definitionId}`);
  }

  // Shift Assignments
  async getShiftAssignments(params?: {
    staff_id?: string;
    shift_definition_id?: string;
    start_date?: string;
    end_date?: string;
    plant?: 'PPC' | 'FP';
  }): Promise<ApiResponse<ShiftAssignment[]>> {
    const urlParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) urlParams.append(key, value);
      });
    }
    const query = urlParams.toString();
    return this.get(`/api/shifts/shift-assignments${query ? '?' + query : ''}`);
  }

  async getShiftAssignment(assignmentId: string): Promise<ApiResponse<ShiftAssignment>> {
    return this.get(`/api/shifts/shift-assignments/${assignmentId}`);
  }

  async createShiftAssignment(assignmentData: {
    staff_id: string;
    shift_definition_id: string;
    date: string;
    plant: 'PPC' | 'FP';
    notes?: string;
  }): Promise<ApiResponse<ShiftAssignment>> {
    return this.post('/api/shifts/shift-assignments', assignmentData);
  }

  async updateShiftAssignment(assignmentId: string, assignmentData: Partial<ShiftAssignment>): Promise<ApiResponse<ShiftAssignment>> {
    return this.put(`/api/shifts/shift-assignments/${assignmentId}`, assignmentData);
  }

  async deleteShiftAssignment(assignmentId: string): Promise<ApiResponse<void>> {
    return this.delete(`/api/shifts/shift-assignments/${assignmentId}`);
  }

  // Staff for Scheduler
  async getStaffForScheduler(): Promise<ApiResponse<StaffForScheduler[]>> {
    return this.get('/api/shifts/staff-for-scheduler');
  }

  // GATE & VEHICLES
  async getVehicles(): Promise<ApiResponse<VehicleLog[]>> {
    return this.get('/api/gate/vehicles');
  }

  async getActiveVehicles(): Promise<ApiResponse<ActiveDelivery[]>> {
    return this.get('/api/gate/active');
  }

  async getSuppliers(): Promise<ApiResponse<SupplierHistory[]>> {
    return this.get('/api/gate/suppliers');
  }

  async getCheckpoints(): Promise<ApiResponse<CheckpointHistory[]>> {
    return this.get('/api/gate/checkpoints');
  }

  // SECURITY & SURVEILLANCE
  async getSecurityCameras(): Promise<ApiResponse<Camera[]>> {
    return this.get('/api/security/cameras');
  }

  async getSecurityEvents(): Promise<ApiResponse<SecurityEvent[]>> {
    return this.get('/api/security/events');
  }

  async getFaceDetectionEvents(): Promise<ApiResponse<FaceDetectionEvent[]>> {
    return this.get('/api/security/face-detection');
  }

  async getUnauthorizedAccess(): Promise<ApiResponse<UnauthorizedAccess[]>> {
    return this.get('/api/security/unauthorized');
  }

  // PRODUCTION ANALYTICS
  async getProductionThroughput(): Promise<ApiResponse<ThroughputData>> {
    return this.get('/api/analytics/throughput');
  }

  async getEfficiencyMetrics(): Promise<ApiResponse<StationEfficiency[]>> {
    return this.get('/api/analytics/efficiency');
  }

  async getQualityMetrics(): Promise<ApiResponse<QualityMetrics>> {
    return this.get('/api/analytics/quality');
  }

  async getProcessingTimes(): Promise<ApiResponse<ProcessingTime[]>> {
    return this.get('/api/analytics/processing-times');
  }

  // STAFF MANAGEMENT
  async getStaffAttendance(): Promise<ApiResponse<AttendanceRecord[]>> {
    return this.get('/api/staff/attendance');
  }

  async getStaffLocations(): Promise<ApiResponse<StaffLocation[]>> {
    return this.get('/api/staff/locations');
  }

  async getStaffPerformance(): Promise<ApiResponse<StaffPerformance[]>> {
    return this.get('/api/staff/performance');
  }

  async getShiftSchedules(): Promise<ApiResponse<ShiftSchedule[]>> {
    return this.get('/api/staff/shifts');
  }

  // INVENTORY & SHIPMENTS
  async getFinishedProducts(): Promise<ApiResponse<FinishedProduct[]>> {
    return this.get('/api/inventory/finished-products');
  }

  async getInventoryItems(): Promise<ApiResponse<InventoryItem[]>> {
    return this.get('/api/inventory/items');
  }

  async getTestResults(): Promise<ApiResponse<TestResult[]>> {
    return this.get('/api/inventory/test-results');
  }

  async getReadyForShipment(): Promise<ApiResponse<ReadyForShipment[]>> {
    return this.get('/api/inventory/ready-for-shipment');
  }

  async getPendingInventoryApprovals(): Promise<ApiResponse<PendingApproval[]>> {
    return this.get('/api/inventory/pending-approvals');
  }

  // QA/QC FORMS - Required by QAFlowDashboard and QCFlowDashboard
  async getPPCForms(): Promise<ApiResponse<PPCFormData[]>> {
    return this.get('/api/ppc-forms');
  }

  async getFPForms(): Promise<ApiResponse<FPFormData[]>> {
    return this.get('/api/fp-forms');
  }

  async getQCForms(): Promise<ApiResponse<unknown[]>> {
    return this.get('/api/qc-forms');
  }

  async getDepurationForms(): Promise<ApiResponse<unknown[]>> {
    return this.get('/api/depuration-forms');
  }

  async getLots(): Promise<ApiResponse<unknown[]>> {
    return this.get('/api/lots');
  }

  async getStaff(): Promise<ApiResponse<unknown[]>> {
    return this.get('/api/staff');
  }

  async createQCForm(formData: unknown): Promise<ApiResponse<unknown>> {
    return this.post('/api/qc-forms', formData);
  }
}

// PERMISSION UTILITIES
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

export function canAccessModule(userRole: string, module: string): boolean {
  const permissions: Record<string, string[]> = {
    'production_forms': ["Super Admin", "Admin", "Production Lead", "Production Staff"],
    'quality_control': ["Super Admin", "Admin", "Production Lead", "QC Lead", "QC Staff"],
    'hr_management': ["Super Admin", "Admin", "Staff Lead"],
    'gate_control': ["Super Admin", "Admin", "Production Lead", "Security Guard"]
  };
  
  return hasPermission(userRole, permissions[module] || []);
}

export function canApproveForm(userRole: string, formType: string): boolean {
  const approvalPermissions: { [key: string]: string[] } = {
    'weight_note': ["Super Admin", "Admin", "Production Lead"],
    'ppc_form': ["Super Admin", "Admin", "Production Lead"],
    'fp_form': ["Super Admin", "Admin", "Production Lead"],
    'qc_form': ["Super Admin", "Admin", "QC Lead"],
    'depuration_form': ["Super Admin", "Admin", "QC Lead"]
  };
  
  return hasPermission(userRole, approvalPermissions[formType] || []);
}

export const clamflowAPI = new ClamFlowAPI();
export default clamflowAPI;