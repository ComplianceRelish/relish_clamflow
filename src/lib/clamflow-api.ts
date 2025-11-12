// src/lib/clamflow-api.ts
import { User } from '../types/auth';

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

export interface ApprovalItem {
  id: string;
  form_type: 'weight_note' | 'ppc_form' | 'fp_form' | 'qc_form' | 'depuration_form';
  form_id: string;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
}

// ✅ FIXED: Removed trailing spaces from API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clamflowbackend-production.up.railway.app';

// ✅ ADDED: Type definitions for form data
interface WeightNoteFormData {
  lot_id: string;
  supplier_id: string;
  box_number: string;
  weight: number;
  // Add other fields as needed
}

// ✅ REMOVED: PPCFormFormData (not used)
// ✅ REMOVED: FPFormFormData (not used)

interface AdminFormData {
  full_name: string;
  username: string;
  // Add other fields as needed
}

class ClamFlowAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL.replace(/\/$/, '');
    
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
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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
    return this.get('/api/users');
  }

  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.post('/api/users', userData);
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

  // DASHBOARD
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    return this.get('/dashboard/metrics');
  }

  async getSystemHealth(): Promise<ApiResponse<SystemHealthData>> {
    return this.get('/health');
  }

  async getNotifications(): Promise<ApiResponse<unknown[]>> {
    return this.get('/notifications/');
  }

  async getAuditLogs(): Promise<ApiResponse<unknown[]>> {
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

  // ADMIN
  async getAdmins(): Promise<ApiResponse<User[]>> {
    return this.get('/super-admin/admins');
  }

  async createAdmin(adminData: AdminFormData): Promise<ApiResponse<User>> {
    return this.post('/super-admin/create-admin', adminData);
  }
}

// PERMISSION UTILITIES
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

export function canAccessModule(userRole: string, module: string): boolean {
  const permissions: Record<string, string[]> = {
    'production_forms': ["super_admin", "admin", "production_lead", "production_staff"],
    'quality_control': ["super_admin", "admin", "production_lead", "qc_lead", "qc_staff"],
    'hr_management': ["super_admin", "admin", "staff_lead"],
    'gate_control': ["super_admin", "admin", "production_lead", "security_guard"]
  };
  
  return hasPermission(userRole, permissions[module] || []);
}

export function canApproveForm(userRole: string, formType: string): boolean {
  const approvalPermissions: { [key: string]: string[] } = {
    'weight_note': ["super_admin", "admin", "production_lead"],
    'ppc_form': ["super_admin", "admin", "production_lead"],
    'fp_form': ["super_admin", "admin", "production_lead"],
    'qc_form': ["super_admin", "admin", "qc_lead"],
    'depuration_form': ["super_admin", "admin", "qc_lead"]
  };
  
  return hasPermission(userRole, approvalPermissions[formType] || []);
}

export const clamflowAPI = new ClamFlowAPI();
export default clamflowAPI;