import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { supabase } from './supabase'
import { APIResponse } from '../types/api'

// Request configuration interface
interface RequestConfig {
  timeout?: number
  headers?: Record<string, string>
  params?: Record<string, any>
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app'

// Create axios instance
class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add JWT token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`
          }
        } catch (error) {
          console.error('Error getting auth token:', error)
        }
        
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.error('Unauthorized access - redirecting to login')
          await supabase.auth.signOut()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Health check
  async healthCheck() {
    return this.client.get('/health')
  }

  // ========================================
  // CLAMFLOW QA ENDPOINTS
  // ========================================

  // Weight Note Management
  async createWeightNote(data: {
    lot_id: string
    supplier_id: string
    box_number: string
    weight: number
  }) {
    return this.client.post('/qa/weight-note', data)
  }

  async approveWeightNote(id: string) {
    return this.client.put(`/qa/weight-note/${id}/approve`)
  }

  async getWeightNotes() {
    return this.client.get('/qa/weight-notes')
  }

  // PPC Form Management
  async createPPCForm(data: {
    lot_id: string
    product_grade: string
    quality_notes?: string
  }) {
    return this.client.post('/qa/ppc-form', data)
  }

  async approvePPCForm(id: string) {
    return this.client.put(`/qa/ppc-form/${id}/approve`)
  }

  // FP Form Management
  async createFPForm(data: {
    lot_id: string
    final_weight: number
    packaging_details: string
  }) {
    return this.client.post('/qa/fp-form', data)
  }

  async approveFPForm(id: string) {
    return this.client.put(`/qa/fp-form/${id}/approve`)
  }

  // Sample Extraction
  async createSampleExtraction(data: {
    lot_id: string
    tank_location: string
    sample_type: string
    extracted_by: string
  }) {
    return this.client.post('/qa/sample-extraction', data)
  }

  // ========================================
  // CLAMFLOW SECURE ENDPOINTS  
  // ========================================

  // Gate Control
  async recordGateExit(data: {
    rfid_tags: string[]
    timestamp?: string
  }) {
    return this.client.post('/secure/gate/exit', data)
  }

  async recordGateEntry(data: {
    rfid_tags: string[]
    timestamp?: string
  }) {
    return this.client.post('/secure/gate/entry', data)
  }

  async getBoxTally() {
    return this.client.get('/secure/gate/tally')
  }

  // Attendance Tracking
  async recordAttendance(data: {
    employee_id: string
    method: 'face' | 'qr'
    timestamp?: string
  }) {
    return this.client.post('/secure/attendance', data)
  }

  // ========================================
  // QC LEAD ENDPOINTS
  // ========================================

  // Depuration Testing
  async submitDepurationResult(data: {
    lot_id: string
    test_results: object
    approved: boolean
  }) {
    return this.client.post('/qc-lead/depuration-result', data)
  }

  // Microbiology Approval
  async approveMicrobiology(lotId: string) {
    return this.client.put(`/qc-lead/lots/${lotId}/approve-microbiology`)
  }

  // ========================================
  // INVENTORY & DATA ENDPOINTS
  // ========================================

  // Inventory Management
  async getInventory() {
    return this.client.get('/inventory')
  }

  // Lot Management
  async getLotDetails(id: string) {
    return this.client.get(`/lots/${id}`)
  }

  // Data Access
  async getSuppliers() {
    return this.client.get('/data/suppliers')
  }

  async getStaff() {
    return this.client.get('/data/staff')
  }

  async getVendors() {
    return this.client.get('/data/vendors')
  }

  // ========================================
  // ONBOARDING ENDPOINTS
  // ========================================

  // Entity Submission
  async submitStaffOnboarding(data: {
    full_name: string
    email: string
    role: string
    department?: string
  }) {
    return this.client.post('/onboarding/staff', data)
  }

  async submitSupplierOnboarding(data: {
    name: string
    contact_info: object
    boat_details?: object
  }) {
    return this.client.post('/onboarding/supplier', data)
  }

  async submitVendorOnboarding(data: {
    firm_name: string
    category: string
    contact_details: object
  }) {
    return this.client.post('/onboarding/vendor', data)
  }

  // Approval Management
  async approveOnboarding(id: string) {
    return this.client.put(`/onboarding/${id}/approve`)
  }

  async rejectOnboarding(id: string) {
    return this.client.put(`/onboarding/${id}/reject`)
  }

  // ========================================
  // GENERIC HTTP METHODS
  // ========================================

  // Generic request method for internal use
  private async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        data,
        ...config,
      })
      
      return {
        success: true,
        data: response.data,
        message: 'Request successful'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        message: error.response?.data?.message || 'Request failed'
      }
    }
  }

  // Generic GET method
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config)
  }

  // Generic POST method
  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>('POST', endpoint, data, config)
  }

  // Generic PUT method
  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config)
  }

  // Generic DELETE method
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config)
  }

  // Generic PATCH method
  async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, config)
  }
}

// Create singleton instance
export const apiClient = new APIClient()

// Export individual API modules for better organization
export const weightNotesAPI = {
  create: (data: any) => apiClient.createWeightNote(data),
  approve: (id: string) => apiClient.approveWeightNote(id),
  getAll: () => apiClient.getWeightNotes(),
}

export const ppcFormsAPI = {
  create: (data: any) => apiClient.createPPCForm(data),
  approve: (id: string) => apiClient.approvePPCForm(id),
}

export const fpFormsAPI = {
  create: (data: any) => apiClient.createFPForm(data),
  approve: (id: string) => apiClient.approveFPForm(id),
}

export const secureAPI = {
  recordExit: (data: any) => apiClient.recordGateExit(data),
  recordEntry: (data: any) => apiClient.recordGateEntry(data),
  getTally: () => apiClient.getBoxTally(),
  recordAttendance: (data: any) => apiClient.recordAttendance(data),
}

export const qcLeadAPI = {
  submitDepuration: (data: any) => apiClient.submitDepurationResult(data),
  approveMicrobiology: (lotId: string) => apiClient.approveMicrobiology(lotId),
}

export const dataAPI = {
  suppliers: () => apiClient.getSuppliers(),
  staff: () => apiClient.getStaff(),
  vendors: () => apiClient.getVendors(),
  inventory: () => apiClient.getInventory(),
  lotDetails: (id: string) => apiClient.getLotDetails(id),
}

export const onboardingAPI = {
  submitStaff: (data: any) => apiClient.submitStaffOnboarding(data),
  submitSupplier: (data: any) => apiClient.submitSupplierOnboarding(data),
  submitVendor: (data: any) => apiClient.submitVendorOnboarding(data),
  approve: (id: string) => apiClient.approveOnboarding(id),
  reject: (id: string) => apiClient.rejectOnboarding(id),
}

export default apiClient
