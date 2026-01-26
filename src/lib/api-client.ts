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
        if (error.response?.status === 401) {
          console.error('Unauthorized access - redirecting to login');
          // Clear localStorage tokens
          if (typeof window !== 'undefined') {
            localStorage.removeItem('clamflow_token');
            localStorage.removeItem('clamflow_user');
          }
          window.location.href = '/login';
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

  // Weight Note Management - Backend: /weight-notes/
  async createWeightNote(data: CreateWeightNoteRequest) {
    return this.client.post('/weight-notes/', data);
  }

  async approveWeightNote(id: string) {
    return this.client.put(`/weight-notes/${id}`);
  }

  async getWeightNotes() {
    return this.client.get('/weight-notes/');
  }

  // PPC Form Management - Backend: /ppc-forms/
  async createPPCForm(data: CreatePPCFormRequest) {
    return this.client.post('/ppc-forms/', data);
  }

  async approvePPCForm(id: string) {
    return this.client.put(`/ppc-forms/${id}`);
  }

  // FP Form Management - Backend: /fp-forms/
  async createFPForm(data: CreateFPFormRequest) {
    return this.client.post('/fp-forms/', data);
  }

  async approveFPForm(id: string) {
    return this.client.put(`/fp-forms/${id}`);
  }

  // Sample Extraction - Note: Uses depuration endpoint per backend docs
  async createSampleExtraction(data: {
    lot_id: string;
    tank_location: string;
    sample_type: string;
    extracted_by: string;
  }) {
    return this.client.post('/depuration/', data);
  }

  // ========================================
  // CLAMFLOW SECURE ENDPOINTS  
  // ========================================

  // Gate Control - Backend: /api/gate/
  async recordGateExit(data: GateControlRequest) {
    // Note: Backend expects log_id in URL for exit
    return this.client.post('/api/gate/vehicle-entry', data);
  }

  async recordGateEntry(data: GateControlRequest) {
    return this.client.post('/api/gate/vehicle-entry', data);
  }

  async getBoxTally() {
    return this.client.get('/api/gate/inside-vehicles');
  }

  // Attendance Tracking - Backend: /attendance/
  async recordAttendance(data: AttendanceRecordRequest) {
    return this.client.post('/attendance/', data);
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
    return this.client.get('/inventory');
  }

  // Lot Management
  async getLotDetails(id: string) {
    return this.client.get(`/lots/${id}`);
  }

  // Data Access
  async getSuppliers() {
    return this.client.get('/data/suppliers');
  }

  async getStaff() {
    return this.client.get('/data/staff');
  }

  async getVendors() {
    return this.client.get('/data/vendors');
  }

  // ========================================
  // ONBOARDING ENDPOINTS
  // ========================================

  // Entity Submission
  async submitStaffOnboarding(data: StaffOnboardingRequest) {
    return this.client.post('/onboarding/staff', data);
  }

  async submitSupplierOnboarding(data: SupplierOnboardingRequest) {
    return this.client.post('/onboarding/supplier', data);
  }

  async submitVendorOnboarding(data: VendorOnboardingRequest) {
    return this.client.post('/onboarding/vendor', data);
  }

  // Approval Management
  async approveOnboarding(id: string) {
    return this.client.put(`/onboarding/${id}/approve`);
  }

  async rejectOnboarding(id: string) {
    return this.client.put(`/onboarding/${id}/reject`);
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