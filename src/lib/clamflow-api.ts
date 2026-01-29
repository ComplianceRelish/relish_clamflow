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

// Standardized to NEXT_PUBLIC_API_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app';

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

  // FORMS - Backend: /weight-notes/
  async getWeightNotes(): Promise<ApiResponse<WeightNoteFormData[]>> {
    return this.get('/weight-notes/');
  }

  async createWeightNote(formData: WeightNoteFormData): Promise<ApiResponse<WeightNoteFormData>> {
    return this.post('/weight-notes/', formData);
  }

  async approveWeightNote(noteId: string): Promise<ApiResponse<WeightNoteFormData>> {
    return this.put(`/weight-notes/${noteId}`);
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

  // ============================================
  // QC WORKFLOW API - Per PRODUCTION_WORKFLOW_INTEGRATION.md
  // ============================================

  // PPC Forms (PPC Station)
  async getPPCForms(): Promise<ApiResponse<PPCFormData[]>> {
    return this.get('/api/ppc-forms/');
  }

  async createPPCForm(formData: Partial<PPCFormData>): Promise<ApiResponse<PPCFormData>> {
    return this.post('/api/ppc-forms/', formData);
  }

  async getPPCForm(id: string): Promise<ApiResponse<PPCFormData>> {
    return this.get(`/api/ppc-forms/${id}`);
  }

  async updatePPCForm(id: string, formData: Partial<PPCFormData>): Promise<ApiResponse<PPCFormData>> {
    return this.put(`/api/ppc-forms/${id}`, formData);
  }

  async addPPCBox(formId: string, boxData: unknown): Promise<ApiResponse<unknown>> {
    return this.post(`/api/ppc-forms/${formId}/boxes`, boxData);
  }

  async submitPPCFormForQC(formId: string): Promise<ApiResponse<unknown>> {
    return this.put(`/api/ppc-forms/${formId}/submit`);
  }

  // FP Forms (FP Station)
  async getFPForms(): Promise<ApiResponse<FPFormData[]>> {
    return this.get('/api/fp-forms/');
  }

  async createFPForm(formData: Partial<FPFormData>): Promise<ApiResponse<FPFormData>> {
    return this.post('/api/fp-forms/', formData);
  }

  async getFPForm(id: string): Promise<ApiResponse<FPFormData>> {
    return this.get(`/api/fp-forms/${id}`);
  }

  async updateFPForm(id: string, formData: Partial<FPFormData>): Promise<ApiResponse<FPFormData>> {
    return this.put(`/api/fp-forms/${id}`, formData);
  }

  async addFPBox(formId: string, boxData: unknown): Promise<ApiResponse<unknown>> {
    return this.post(`/api/fp-forms/${formId}/boxes`, boxData);
  }

  async submitFPFormForQC(formId: string): Promise<ApiResponse<unknown>> {
    return this.put(`/api/fp-forms/${formId}/submit`);
  }

  // QC Dashboard & Metrics (QC Flow Dashboard)
  async getQCForms(status?: string, formType?: string): Promise<ApiResponse<QCFormResponse[]>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (formType) params.append('form_type', formType);
    const queryString = params.toString();
    return this.get(`/api/qc/forms${queryString ? `?${queryString}` : ''}`);
  }

  async getQCMetrics(): Promise<ApiResponse<QCMetricsResponse>> {
    return this.get('/api/qc/metrics');
  }

  async getPendingQCForms(): Promise<ApiResponse<QCFormResponse[]>> {
    return this.get('/api/forms/pending');
  }

  // Form Approval Workflow (QC Staff & Leads)
  async approveQCForm(formId: string, observations?: string): Promise<ApiResponse<ApprovalResponse>> {
    return this.put(`/api/forms/${formId}/approve`, { observations });
  }

  async rejectQCForm(formId: string, rejectionReason: string): Promise<ApiResponse<ApprovalResponse>> {
    return this.put(`/api/forms/${formId}/reject`, { rejection_reason: rejectionReason });
  }

  // Production Lead Approval (for PPC → Gate Pass)
  async productionLeadApprovePPC(formId: string, observations?: string): Promise<ApiResponse<ApprovalResponse>> {
    return this.put(`/api/forms/${formId}/production-lead-approve`, { observations });
  }

  // QC Lead Approval (for FP → Inventory)
  async qcLeadApproveFP(formId: string, observations?: string): Promise<ApiResponse<ApprovalResponse>> {
    return this.put(`/api/forms/${formId}/qc-lead-approve`, { observations });
  }

  // Depuration Workflow (Part of PPC)
  async getDepurationForms(): Promise<ApiResponse<DepurationFormResponse[]>> {
    return this.get('/api/v1/depuration/forms');
  }

  async extractSample(sampleData: SampleExtractionRequest): Promise<ApiResponse<unknown>> {
    return this.post('/api/v1/depuration/sample', sampleData);
  }

  async submitDepurationForm(formData: unknown): Promise<ApiResponse<unknown>> {
    return this.post('/api/v1/depuration/form', formData);
  }

  async approveDepuration(depurationId: string): Promise<ApiResponse<unknown>> {
    return this.put(`/api/v1/depuration/${depurationId}/approve`);
  }

  // Lots Management
  async getLots(): Promise<ApiResponse<LotResponse[]>> {
    return this.get('/api/v1/lots/');
  }

  async createLot(lotData: CreateLotRequest): Promise<ApiResponse<LotResponse>> {
    return this.post('/api/v1/lots/', lotData);
  }

  async getLot(lotId: string): Promise<ApiResponse<LotResponse>> {
    return this.get(`/api/v1/lots/${lotId}`);
  }

  async updateLotStatus(lotId: string, status: string): Promise<ApiResponse<LotResponse>> {
    return this.put(`/api/v1/lots/${lotId}`, { status });
  }

  // Staff
  async getStaff(): Promise<ApiResponse<StaffMember[]>> {
    return this.get('/api/staff/');
  }

  async getQCStaff(): Promise<ApiResponse<StaffMember[]>> {
    return this.get('/api/staff/?role=qc');
  }

  // ============================================
  // ONBOARDING API (Staff Lead)
  // ============================================
  
  // Generic onboarding submission
  async submitOnboarding(entityType: 'staff' | 'supplier' | 'vendor', data: Record<string, unknown>): Promise<ApiResponse<OnboardingResponse>> {
    return this.post(`/api/onboarding/${entityType}`, data);
  }

  // Specific onboarding endpoints
  async submitStaffOnboarding(data: StaffOnboardingRequest): Promise<ApiResponse<OnboardingResponse>> {
    return this.post('/api/onboarding/staff', data);
  }

  async submitSupplierOnboarding(data: SupplierOnboardingRequest): Promise<ApiResponse<OnboardingResponse>> {
    return this.post('/api/onboarding/supplier', data);
  }

  async submitVendorOnboarding(data: VendorOnboardingRequest): Promise<ApiResponse<OnboardingResponse>> {
    return this.post('/api/onboarding/vendor', data);
  }

  // Onboarding approval (Admin only)
  async approveOnboarding(id: string): Promise<ApiResponse<OnboardingResponse>> {
    return this.put(`/api/onboarding/${id}/approve`);
  }

  async rejectOnboarding(id: string, reason?: string): Promise<ApiResponse<OnboardingResponse>> {
    return this.put(`/api/onboarding/${id}/reject`, { reason });
  }

  // Get pending onboarding requests
  async getPendingOnboarding(): Promise<ApiResponse<OnboardingResponse[]>> {
    return this.get('/api/onboarding/pending');
  }

  // RFID Operations
  async linkRFIDTag(rfidData: RFIDLinkRequest): Promise<ApiResponse<RFIDTagResponse>> {
    return this.post('/api/rfid/link', rfidData);
  }

  async scanRFIDTag(tagId: string): Promise<ApiResponse<RFIDTagResponse>> {
    return this.get(`/api/rfid/scan/${tagId}`);
  }

  async getRFIDTags(): Promise<ApiResponse<RFIDTagResponse[]>> {
    return this.get('/api/rfid/tags');
  }

  async updateRFIDTag(tagId: string, data: Partial<RFIDTagResponse>): Promise<ApiResponse<RFIDTagResponse>> {
    return this.put(`/api/rfid/tags/${tagId}`, data);
  }

  // QR Label Generation (FP Workflow)
  async generateQRLabel(labelData: QRLabelRequest): Promise<ApiResponse<QRLabelResponse>> {
    return this.post('/api/fp-forms/generate-qr-label', labelData);
  }

  // DEPRECATED: QC forms are created through station workflows, not directly
  // Use approveQCForm() or rejectQCForm() instead
  async createQCForm(_formData: unknown): Promise<ApiResponse<never>> {
    console.warn('DEPRECATED: createQCForm() - QC forms are not created directly. Use approval endpoints.');
    return { success: false, error: 'QC forms are not created directly. Use approval endpoints.' };
  }
}

// ============================================
// QC WORKFLOW INTERFACES
// ============================================

export interface QCFormResponse {
  id: string;
  formType: 'weight_note' | 'ppc_form' | 'fp_form' | 'depuration_form';
  status: 'pending' | 'qc_approved' | 'qc_rejected' | 'production_lead_approved' | 'qc_lead_approved';
  lotNumber: string | null;
  lotId: string | null;
  createdAt: string;
  submittedAt: string | null;
  submittedBy: string | null;
  stationId: string | null;
  formData: Record<string, unknown>;
}

export interface QCMetricsResponse {
  pending: number;
  approved: number;
  rejected: number;
  byFormType: {
    weight_notes: { pending: number; approved: number; rejected: number };
    ppc_forms: { pending: number; approved: number; rejected: number };
    fp_forms: { pending: number; approved: number; rejected: number };
    depuration_forms: { pending: number; approved: number; rejected: number };
  };
}

export interface ApprovalResponse {
  success: boolean;
  formId: string;
  newStatus: string;
  approvedBy: string;
  approvedAt: string;
  message?: string;
}

export interface DepurationFormResponse {
  id: string;
  sampleId: string;
  lotId: string;
  depurationTankId: string;
  startTime: string;
  plannedDuration: number;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  qcStaffId: string;
  qcStaffName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SampleExtractionRequest {
  lotId: string;
  sampleType: string;
  extractionPoint: string;
  sampleSize: number;
  containerType: string;
  preservationMethod: string;
  qcStaffId: string;
  extractionTime: string;
  storageTemperature: number;
  testingRequirements?: {
    microbiological?: boolean;
    chemical?: boolean;
    physical?: boolean;
    nutritional?: boolean;
    heavyMetals?: boolean;
    pesticides?: boolean;
  };
  notes?: string;
}

export interface LotResponse {
  id: string;
  lotNumber: string;
  supplierId: string;
  supplierName?: string;
  status: 'received' | 'washing' | 'depuration' | 'ppc' | 'fp' | 'shipped' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  weightNoteId?: string;
}

export interface CreateLotRequest {
  supplierId: string;
  weightNoteId: string;
  notes?: string;
}

export interface StaffMember {
  id: string;
  fullName: string;
  employeeId: string;
  role: string;
  department?: string;
  stationAssignments?: string[];
  isActive: boolean;
}

// ============================================
// ONBOARDING INTERFACES (Staff Lead)
// ============================================

export interface StaffOnboardingRequest {
  full_name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
}

export interface SupplierOnboardingRequest {
  name: string;
  contact_info?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  boat_details?: {
    boat_name?: string;
    registration_number?: string;
    capacity_kg?: number;
  };
}

export interface VendorOnboardingRequest {
  firm_name: string;
  category: string;
  contact_details?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

export interface OnboardingResponse {
  id: string;
  entityType: 'staff' | 'supplier' | 'vendor';
  status: 'pending' | 'approved' | 'rejected';
  data: Record<string, unknown>;
  submittedBy: string;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface RFIDLinkRequest {
  tagId: string;
  boxNumber: string;
  lotId: string;
  productType: string;
  grade: string;
  weight: number;
  staffId: string;
}

export interface RFIDTagResponse {
  id: string;
  tagId: string;
  boxNumber: string;
  lotId: string;
  productType: string;
  grade: string;
  weight: number;
  linkedAt: string;
  linkedBy: string;
  status: 'active' | 'inactive' | 'transferred';
}

export interface QRLabelRequest {
  lotId: string;
  boxNumber: string;
  productType: string;
  grade: string;
  weight: number;
  rfidTagId?: string;
  staffId: string;
  originalBoxNumber?: string;
}

export interface QRLabelResponse {
  id: string;
  qrCodeData: string;
  qrCodeImage: string; // Base64
  labelData: {
    lotNumber: string;
    boxNumber: string;
    productType: string;
    grade: string;
    weight: number;
    packDate: string;
    expiryDate: string;
    traceabilityCode: string;
  };
  generatedAt: string;
  generatedBy: string;
}

// PERMISSION UTILITIES - Per PRODUCTION_WORKFLOW_INTEGRATION.md
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

export function canAccessModule(userRole: string, module: string): boolean {
  const permissions: Record<string, string[]> = {
    'production_forms': ["Super Admin", "Admin", "Production Lead", "Production Staff"],
    'quality_control': ["Super Admin", "Admin", "Production Lead", "QC Lead", "QC Staff"],
    'hr_management': ["Super Admin", "Admin", "Staff Lead"],
    'gate_control': ["Super Admin", "Admin", "Production Lead", "Security Guard"],
    'qc_workflow': ["Super Admin", "Admin", "QC Lead", "QC Staff"],
    'approval_dashboard': ["Super Admin", "Admin", "Production Lead", "QC Lead"],
    'dashboard': ["Super Admin", "Admin", "Staff Lead"],
    'supplier_onboarding': ["Super Admin", "Admin", "Staff Lead"],
    'security_surveillance': ["Super Admin", "Admin", "Staff Lead"],
    'staff_management': ["Super Admin", "Admin", "Staff Lead"],
  };
  
  return hasPermission(userRole, permissions[module] || []);
}

export function canApproveForm(userRole: string, formType: string): boolean {
  const approvalPermissions: { [key: string]: string[] } = {
    // Weight Note: QC Staff can approve, sends to Supervisor for Lot creation
    'weight_note': ["Super Admin", "Admin", "QC Lead", "QC Staff"],
    // PPC Form: QC Staff approves → Production Lead approves → Gate Pass
    'ppc_form': ["Super Admin", "Admin", "QC Lead", "QC Staff"],
    'ppc_form_production_lead': ["Super Admin", "Admin", "Production Lead"],
    // FP Form: QC Staff approves → QC Lead approves → Inventory
    'fp_form': ["Super Admin", "Admin", "QC Lead", "QC Staff"],
    'fp_form_qc_lead': ["Super Admin", "Admin", "QC Lead"],
    // Depuration: QC Lead approval
    'depuration_form': ["Super Admin", "Admin", "QC Lead"]
  };
  
  return hasPermission(userRole, approvalPermissions[formType] || []);
}

// ============================================
// QC STAFF STATION AUTHORIZATION - LIVE API
// ============================================

// Cache for staff station assignments (to avoid excessive API calls)
let staffStationCache: Map<string, { stations: string[]; expiry: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Fallback data for demo/offline mode
export const QC_STAFF_STATION_ASSIGNMENTS_FALLBACK: Record<string, string[]> = {
  "qc_staff_001": ["RM Station", "Depuration Station"],
  "qc_staff_002": ["PPC Station", "Separation Station"],
  "qc_staff_003": ["FP Station"]
};

/**
 * Fetch staff's assigned stations from the backend API.
 * Returns array of station names the staff is assigned to for today.
 * Falls back to cached data or demo data if API fails.
 */
export async function fetchStaffAssignedStations(staffId: string): Promise<string[]> {
  // Check cache first
  const cached = staffStationCache.get(staffId);
  if (cached && cached.expiry > Date.now()) {
    return cached.stations;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await clamflowAPI.getStationsWithAssignments(today);
    
    if (response.success && response.data) {
      // Find stations where this staff is assigned
      const assignedStations: string[] = [];
      
      for (const station of response.data) {
        const isAssigned = station.assignments?.some(
          (assignment: any) => 
            assignment.staff_id === staffId && 
            assignment.status === 'active'
        );
        
        if (isAssigned) {
          assignedStations.push(station.name);
        }
      }
      
      // Update cache
      staffStationCache.set(staffId, {
        stations: assignedStations,
        expiry: Date.now() + CACHE_TTL_MS
      });
      
      return assignedStations;
    }
  } catch (error) {
    console.error('Failed to fetch staff station assignments:', error);
  }
  
  // Fallback to demo data
  return QC_STAFF_STATION_ASSIGNMENTS_FALLBACK[staffId] || [];
}

/**
 * Synchronous version using cache - for backward compatibility.
 * Use fetchStaffAssignedStations for real-time data.
 */
export function getQCStaffAssignedStations(staffId: string): string[] {
  const cached = staffStationCache.get(staffId);
  if (cached) {
    return cached.stations;
  }
  // Return fallback data if cache miss
  return QC_STAFF_STATION_ASSIGNMENTS_FALLBACK[staffId] || [];
}

/**
 * Check if a staff member can approve forms from a specific station.
 * Uses cached data for synchronous check.
 */
export function canQCStaffApproveStation(staffId: string, stationName: string): boolean {
  const assignedStations = getQCStaffAssignedStations(staffId);
  return assignedStations.some(station => 
    stationName.toLowerCase().includes(station.toLowerCase().replace(' Station', ''))
  );
}

/**
 * Check if a staff member can approve forms from a specific station.
 * Async version that fetches fresh data from API.
 */
export async function canQCStaffApproveStationAsync(staffId: string, stationName: string): Promise<boolean> {
  const assignedStations = await fetchStaffAssignedStations(staffId);
  return assignedStations.some(station => 
    stationName.toLowerCase().includes(station.toLowerCase().replace(' Station', ''))
  );
}

/**
 * Clear the station assignment cache (call when assignments change)
 */
export function clearStationAssignmentCache(): void {
  staffStationCache.clear();
}

/**
 * Preload station assignments for a staff member.
 * Call this when a user logs in to warm the cache.
 */
export async function preloadStaffStationAssignments(staffId: string): Promise<void> {
  await fetchStaffAssignedStations(staffId);
}

export const clamflowAPI = new ClamFlowAPI();
export default clamflowAPI;