// ClamFlow Backend API Client - Production Ready
import { User } from '../types/auth';

// Types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalLots: number;
  pendingApprovals: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

interface SystemHealthData {
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

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clamflowbackend-production.up.railway.app';

// User Roles as defined in backend
export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin', 
  PRODUCTION_LEAD: 'Production Lead',
  QC_LEAD: 'QC Lead',
  STAFF_LEAD: 'Staff Lead',
  QC_STAFF: 'QC Staff',
  PRODUCTION_STAFF: 'Production Staff',
  SECURITY_GUARD: 'Security Guard'
};

// Role hierarchy levels (1 = highest authority)
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.PRODUCTION_LEAD]: 3,
  [ROLES.QC_LEAD]: 4,
  [ROLES.STAFF_LEAD]: 5,
  [ROLES.QC_STAFF]: 6,
  [ROLES.PRODUCTION_STAFF]: 7,
  [ROLES.SECURITY_GUARD]: 8
};

class ClamFlowAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('clamflow_token');
    }
  }

  // Set authentication token
  setToken(token: string | null) {
    this.token = token;
  }

  // Get authentication headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic API request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('clamflow_token');
            localStorage.removeItem('clamflow_user');
            window.location.href = '/login';
          }
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Authentication API
  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async refreshToken(): Promise<ApiResponse<{ access_token: string }>> {
    return this.request<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
    });
  }

  // Face Recognition Authentication
  async loginWithFace(imageFile: File): Promise<ApiResponse<LoginResponse>> {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    try {
      const response = await fetch(`${this.baseURL}/authenticate_by_face`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Face authentication failed');
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Face authentication failed',
      };
    }
  }

  // User Management API
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/user/profile');
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>('/users/');
  }

  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Dashboard API
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    return this.request<DashboardMetrics>('/dashboard/metrics');
  }

  async getSystemHealth(): Promise<ApiResponse<SystemHealthData>> {
    return this.request<SystemHealthData>('/health');
  }

  // Forms API
  async getPPCForms(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/ppc/forms');
  }

  async getFPForms(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/fp/forms');
  }

  async getWeightNotes(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/weight-notes/');
  }

  async getDepurationForms(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/depuration/forms');
  }

  async createWeightNote(formData: any): Promise<ApiResponse<any>> {
    return this.post('/form/weight-note', formData);
  }

  async approveWeightNote(noteId: string): Promise<ApiResponse<any>> {
    return this.put(`/form/weight-note/${noteId}/approve`);
  }

  async createPPCForm(formData: any): Promise<ApiResponse<any>> {
    return this.post('/form/ppc', formData);
  }

  async approvePPCForm(formId: string): Promise<ApiResponse<any>> {
    return this.put(`/form/ppc/${formId}/approve`);
  }

  async createFPForm(formData: any): Promise<ApiResponse<any>> {
    return this.post('/form/fp', formData);
  }

  async approveFPForm(formId: string): Promise<ApiResponse<any>> {
    return this.put(`/form/fp/${formId}/approve`);
  }

  // Lots API
  async getLots(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/lots/');
  }

  async createLot(lotData: any): Promise<ApiResponse<any>> {
    return this.request<any>('/lots/', {
      method: 'POST',
      body: JSON.stringify(lotData),
    });
  }

  // Staff Management API
  async getStaff(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/staff/');
  }

  async getSuppliers(filters: any = {}): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    
    const queryString = params.toString();
    return this.request<any[]>(`/suppliers/${queryString ? `?${queryString}` : ''}`);
  }

  async getVendors(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/vendors/');
  }

  // Staff Lead Methods
  async getStaffList(): Promise<ApiResponse<any[]>> {
    return this.get('/staff-lead/staff-list');
  }

  async getAttendanceOverview(filters: any = {}): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    
    const queryString = params.toString();
    return this.get(`/staff-lead/attendance-overview${queryString ? `?${queryString}` : ''}`);
  }

  async getVendorList(filters: any = {}): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    
    const queryString = params.toString();
    return this.get(`/staff-lead/vendor-list${queryString ? `?${queryString}` : ''}`);
  }

  // Security & Gate Control
  async logGateEntry(rfidTags: string[]): Promise<ApiResponse<any>> {
    return this.post('/secure/gate/entry', { 
      rfid_tags: rfidTags,
      timestamp: new Date().toISOString()
    });
  }

  async logGateExit(rfidTags: string[]): Promise<ApiResponse<any>> {
    return this.post('/secure/gate/exit', { 
      rfid_tags: rfidTags,
      timestamp: new Date().toISOString()
    });
  }

  async recordAttendance(employeeId: string, method: 'face' | 'qr'): Promise<ApiResponse<any>> {
    return this.post('/secure/attendance', {
      employee_id: employeeId,
      method,
      timestamp: new Date().toISOString()
    });
  }

  // Onboarding Methods
  async submitStaffOnboarding(staffData: any): Promise<ApiResponse<any>> {
    return this.post('/onboarding/staff', staffData);
  }

  async submitSupplierOnboarding(supplierData: any): Promise<ApiResponse<any>> {
    return this.post('/onboarding/supplier', supplierData);
  }

  async submitVendorOnboarding(vendorData: any): Promise<ApiResponse<any>> {
    return this.post('/onboarding/vendor', vendorData);
  }

  async approveOnboarding(id: string): Promise<ApiResponse<any>> {
    return this.put(`/onboarding/${id}/approve`);
  }

  // Hardware API
  async getDeviceRegistry(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/hardware/devices');
  }

  async testHardware(deviceType: string): Promise<ApiResponse<any>> {
    return this.request<any>('/hardware/test', {
      method: 'POST',
      body: JSON.stringify({ device_type: deviceType }),
    });
  }

  // Notifications API
  async getNotifications(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/notifications/');
  }

  async markNotificationRead(notificationId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  // Audit Trail API
  async getAuditLogs(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/audit/logs');
  }

  // Super Admin Methods
  async getAdmins(): Promise<ApiResponse<any[]>> {
    return this.get('/super-admin/admins');
  }

  async createAdmin(adminData: any): Promise<ApiResponse<any>> {
    return this.post('/super-admin/admins', adminData);
  }

  async updateAdminPermissions(userId: string, permissions: any): Promise<ApiResponse<any>> {
    return this.put(`/super-admin/permissions/${userId}`, permissions);
  }
}

// Permission checking utilities
export function hasPermission(userRole: string, requiredRoles: string | string[]): boolean {
  if (!Array.isArray(requiredRoles)) {
    requiredRoles = [requiredRoles];
  }
  return requiredRoles.includes(userRole);
}

export function hasHierarchyLevel(userRole: string, minimumLevel: number): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 999;
  return userLevel <= minimumLevel;
}

export function canAccessModule(userRole: string, module: string): boolean {
  const modulePermissions: { [key: string]: string[] } = {
    'super_admin': [ROLES.SUPER_ADMIN],
    'admin_panel': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    'production_forms': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PRODUCTION_LEAD, ROLES.PRODUCTION_STAFF],
    'quality_control': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PRODUCTION_LEAD, ROLES.QC_LEAD, ROLES.QC_STAFF],
    'hr_management': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF_LEAD],
    'gate_control': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PRODUCTION_LEAD, ROLES.SECURITY_GUARD],
    'reports': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PRODUCTION_LEAD, ROLES.QC_LEAD, ROLES.STAFF_LEAD]
  };
  
  return hasPermission(userRole, modulePermissions[module] || []);
}

// Create and export API instance
export const clamflowAPI = new ClamFlowAPI();

// Export types for use in components
export type {
  ApiResponse,
  LoginResponse,
  DashboardMetrics,
  SystemHealthData,
};

export default clamflowAPI;