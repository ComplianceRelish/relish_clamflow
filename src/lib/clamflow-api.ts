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

interface WeightNoteFormData {
  lot_id: string;
  supplier_id: string;
  box_number: string;
  weight: number;
}

interface AdminFormData {
  username: string;
  full_name: string;
  email: string;
  password: string;
  role: string;
  station: string;
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
        const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`;
        console.error(`❌ API Error [${response.status}] ${endpoint}:`, errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // 🛡️ DEFENSIVE: Ensure array endpoints return arrays
      if (this.isArrayEndpoint(endpoint) && !Array.isArray(data)) {
        console.warn(`⚠️ Expected array from ${endpoint}, got:`, typeof data, data);
        return { success: true, data: [] as T };
      }
      
      return { success: true, data };
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
  async getPPCForms(): Promise<ApiResponse<unknown[]>> {
    return this.get('/api/ppc-forms');
  }

  async getFPForms(): Promise<ApiResponse<unknown[]>> {
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