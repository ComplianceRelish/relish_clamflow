// src/lib/api-client.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Helper to get token from localStorage (used by AuthContext)
const getStoredToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('clamflow_token');
  }
  return null;
};

// Request configuration interface
interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}

// ✅ ADDED PROPER RESPONSE INTERFACES
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  message: string;
  status?: number;
}

// ✅ ADDED SPECIFIC REQUEST INTERFACES
interface CreateWeightNoteRequest {
  lot_id: string;
  supplier_id: string;
  box_number: string;
  weight: number;
}

interface CreatePPCFormRequest {
  lot_id: string;
  product_grade: string;
  quality_notes?: string;
}

interface CreateFPFormRequest {
  lot_id: string;
  final_weight: number;
  packaging_details: string;
}

interface GateControlRequest {
  rfid_tags: string[];
  timestamp?: string;
}

interface AttendanceRecordRequest {
  employee_id: string;
  method: 'face' | 'qr';
  timestamp?: string;
}

interface DepurationResultRequest {
  lot_id: string;
  test_results: Record<string, unknown>;
  approved: boolean;
}

interface StaffOnboardingRequest {
  full_name: string;
  email: string;
  role: string;
  department?: string;
}

interface SupplierOnboardingRequest {
  name: string;
  contact_info: Record<string, unknown>;
  boat_details?: Record<string, unknown>;
}

interface VendorOnboardingRequest {
  firm_name: string;
  category: string;
  contact_details: Record<string, unknown>;
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app';

// Create axios instance
class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add JWT token from localStorage
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = getStoredToken();
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const status = error.response?.status;
        const detail = error.response?.data?.detail || error.response?.data?.message || '';

        if (status === 401) {
          console.error('Unauthorized access - redirecting to login');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('clamflow_token');
            localStorage.removeItem('clamflow_user');
            window.location.href = '/login';
          }
        } else if (status === 403) {
          console.warn('🔒 Forbidden [403]:', detail || 'Access denied or workflow prerequisite not met');
          // Attach parsed detail for caller to use
          error.userMessage = detail || 'You do not have permission or a prerequisite step must be completed first.';
        } else if (status === 409) {
          console.warn('⚠️ Conflict [409]:', detail || 'Resource already exists');
          error.userMessage = detail || 'This resource already exists.';
        } else if (status === 422) {
          console.warn('❌ Validation Error [422]:', detail);
          if (Array.isArray(detail)) {
            error.userMessage = detail.map((err: any) => `${err.loc?.join('.') || 'field'}: ${err.msg}`).join(', ');
          } else {
            error.userMessage = detail || 'Validation failed. Please check your input.';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck() {
    return this.client.get('/health');
  }

  // ========================================
  // CLAMFLOW QA ENDPOINTS
  // ========================================

  // Weight Note Management - Backend: /api/weight-notes/
  async createWeightNote(data: CreateWeightNoteRequest) {
    return this.client.post('/api/weight-notes/', data);
  }

  async approveWeightNote(id: string) {
    return this.client.put(`/api/weight-notes/${id}`);
  }

  async getWeightNotes() {
    return this.client.get('/api/weight-notes/');
  }

  // PPC Form Management - Backend: /api/ppc-forms/
  async createPPCForm(data: CreatePPCFormRequest) {
    return this.client.post('/api/ppc-forms/', data);
  }

  async approvePPCForm(id: string) {
    return this.client.put(`/api/ppc-forms/${id}`);
  }

  // FP Form Management - Backend: /api/fp-forms/
  async createFPForm(data: CreateFPFormRequest) {
    return this.client.post('/api/fp-forms/', data);
  }

  async approveFPForm(id: string) {
    return this.client.put(`/api/fp-forms/${id}`);
  }

  // Sample Extraction - Backend: /api/v1/depuration/
  async createSampleExtraction(data: {
    lot_id: string;
    tank_location: string;
    sample_type: string;
    extracted_by: string;
  }) {
    return this.client.post('/api/v1/depuration/', data);
  }

  // ========================================
  // CLAMFLOW SECURE ENDPOINTS  
  // ========================================

  // Gate Control - Backend: /api/gate/
  async recordGateExit(data: GateControlRequest) {
    // Backend expects log_id in URL for exit
    return this.client.post('/api/gate/vehicle-exit', data);
  }

  async recordGateEntry(data: GateControlRequest) {
    return this.client.post('/api/gate/vehicle-entry', data);
  }

  async getBoxTally() {
    return this.client.get('/api/gate/inside-vehicles');
  }

  // Attendance Tracking - Backend: /api/attendance/
  async recordAttendance(data: AttendanceRecordRequest) {
    return this.client.post('/api/attendance/', data);
  }

  // ========================================
  // QC LEAD ENDPOINTS
  // ========================================

  // Depuration Testing
  async submitDepurationResult(data: DepurationResultRequest) {
    return this.client.post('/qc-lead/depuration-result', data);
  }

  // Microbiology Approval
  async approveMicrobiology(lotId: string) {
    return this.client.put(`/qc-lead/lots/${lotId}/approve-microbiology`);
  }

  // ========================================
  // INVENTORY & DATA ENDPOINTS
  // ========================================

  // Inventory Management
  async getInventory() {
    return this.client.get('/api/inventory/items');
  }

  // Lot Management
  async getLotDetails(id: string) {
    return this.client.get(`/api/v1/lots/${id}`);
  }

  // Data Access
  async getSuppliers() {
    return this.client.get('/api/gate/suppliers');
  }

  async getStaff() {
    return this.client.get('/api/staff/');
  }

  async getVendors() {
    return this.client.get('/api/gate/vendors');
  }

  // ========================================
  // ONBOARDING ENDPOINTS
  // ========================================

  // Entity Submission
  async submitStaffOnboarding(data: StaffOnboardingRequest) {
    return this.client.post('/api/onboarding/staff', data);
  }

  async submitSupplierOnboarding(data: SupplierOnboardingRequest) {
    return this.client.post('/api/onboarding/supplier', data);
  }

  async submitVendorOnboarding(data: VendorOnboardingRequest) {
    return this.client.post('/api/onboarding/vendor', data);
  }

  // Approval Management
  async approveOnboarding(id: string) {
    return this.client.put(`/api/onboarding/${id}/approve`);
  }

  async rejectOnboarding(id: string) {
    return this.client.put(`/api/onboarding/${id}/reject`);
  }

  // ========================================
  // GENERIC HTTP METHODS
  // ========================================

  // Generic request method for internal use
private async request<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: unknown,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await this.client.request({
      method,
      url: endpoint,
      data,
      ...config,
    });
    
    return {
      success: true,
      data: response.data as T,
      message: 'Request successful',
      status: response.status
    };
  } catch (error: unknown) {
    // Handle error with proper typing
    if (error instanceof Error) {
      return {
        success: false,
        data: null as T,
        error: error.message,
        message: 'Request failed',
        status: 500
      };
    }
    
    return {
      success: false,
      data: null as T,
      error: 'Unknown error occurred',
      message: 'Request failed',
      status: 500
    };
  }
}
  // Generic GET method
  async get<T = unknown>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  // Generic POST method
  async post<T = unknown>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, config);
  }

  // Generic PUT method
  async put<T = unknown>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  // Generic DELETE method
  async delete<T = unknown>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  // Generic PATCH method
  async patch<T = unknown>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, config);
  }
}

// Create singleton instance
export const apiClient = new APIClient();

// Export individual API modules for better organization
export const weightNotesAPI = {
  create: (data: CreateWeightNoteRequest) => apiClient.createWeightNote(data),
  approve: (id: string) => apiClient.approveWeightNote(id),
  getAll: () => apiClient.getWeightNotes(),
};

export const ppcFormsAPI = {
  create: (data: CreatePPCFormRequest) => apiClient.createPPCForm(data),
  approve: (id: string) => apiClient.approvePPCForm(id),
};

export const fpFormsAPI = {
  create: (data: CreateFPFormRequest) => apiClient.createFPForm(data),
  approve: (id: string) => apiClient.approveFPForm(id),
};

export const secureAPI = {
  recordExit: (data: GateControlRequest) => apiClient.recordGateExit(data),
  recordEntry: (data: GateControlRequest) => apiClient.recordGateEntry(data),
  getTally: () => apiClient.getBoxTally(),
  recordAttendance: (data: AttendanceRecordRequest) => apiClient.recordAttendance(data),
};

export const qcLeadAPI = {
  submitDepuration: (data: DepurationResultRequest) => apiClient.submitDepurationResult(data),
  approveMicrobiology: (lotId: string) => apiClient.approveMicrobiology(lotId),
};