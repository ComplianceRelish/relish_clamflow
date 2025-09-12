// src/services/ppc-service.ts
import { PPCFormData } from '../types/forms';
import { ApiResponse, PaginatedResponse, apiClient } from './api';

// Remove the duplicate PPCForm interface and use a custom one for PPC service
export interface PPCForm {
  id?: string;
  weight_note_id: string;
  lot_number: string;
  
  // Receiving & Initial Processing
  received_weight: number;
  initial_condition: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Washing Process
  washing_temperature: number;
  washing_duration: number; // minutes
  washing_method: 'pressure' | 'immersion' | 'manual';
  
  // Depuration Process  
  depuration_tank_id: string;
  depuration_start_time: string;
  depuration_end_time: string;
  depuration_temperature: number;
  depuration_salinity: number;
  
  // Pressure Washing
  pressure_washing_psi: number;
  pressure_washing_duration: number;
  pressure_washing_completed: boolean;
  
  // Shell Separation
  shell_separation_method: 'manual' | 'mechanical' | 'pneumatic';
  shell_separation_efficiency: number; // percentage
  
  // Grading
  grading_size: 'small' | 'medium' | 'large' | 'jumbo';
  grading_quality: 'grade_a' | 'grade_b' | 'grade_c';
  
  // Cooking Process
  cooking_temperature: number;
  cooking_time: number; // minutes
  cooking_method: 'steam' | 'boiling' | 'pressure';
  
  // Meat Separation
  meat_separation_method: 'manual' | 'mechanical';
  meat_yield_percentage: number;
  
  // Candling
  candling_completed: boolean;
  candling_defects_found: string[];
  candling_passed: boolean;
  
  // Quality Assessment
  final_weight: number;
  yield_percentage: number;
  quality_score: number; // 1-10
  quality_notes: string;
  
  // Staff & Approval
  staff_id: string;
  supervisor_id?: string;
  qc_inspector_id?: string;
  
  // Status & Workflow
  status: 'in_progress' | 'completed' | 'approved' | 'rejected' | 'rework_required';
  rejection_reason?: string;
  
  // Timestamps
  started_at: string;
  completed_at?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PPCFormFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  lot_number?: string;
  staff_id?: string;
  supervisor_id?: string;
}

export class PPCService {
  private baseUrl = '/api/ppc-forms';

  async create(data: Omit<PPCForm, 'id' | 'created_at' | 'updated_at'>): Promise<PPCForm> {
    try {
      const response = await apiClient.post<ApiResponse<PPCForm>>(this.baseUrl, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create PPC form:', error);
      throw new Error(error.response?.data?.detail || 'Failed to create PPC form');
    }
  }

  async getAll(page = 1, limit = 50, filters?: PPCFormFilters): Promise<{
    data: PPCForm[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await apiClient.get<ApiResponse<PaginatedResponse<PPCForm>>>(`${this.baseUrl}?${params}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch PPC forms:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load PPC forms');
    }
  }

  async getById(id: string): Promise<PPCForm> {
    try {
      const response = await apiClient.get<ApiResponse<PPCForm>>(`${this.baseUrl}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch PPC form:', error);
      throw new Error(error.response?.data?.detail || 'PPC form not found');
    }
  }

  async update(id: string, data: Partial<PPCForm>): Promise<PPCForm> {
    try {
      const response = await apiClient.put<ApiResponse<PPCForm>>(`${this.baseUrl}/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update PPC form:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update PPC form');
    }
  }

  async submitForApproval(id: string): Promise<PPCForm> {
    try {
      const response = await apiClient.post<ApiResponse<PPCForm>>(`${this.baseUrl}/${id}/submit-approval`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to submit PPC form for approval:', error);
      throw new Error(error.response?.data?.detail || 'Failed to submit for approval');
    }
  }

  async approve(id: string, supervisor_id: string, notes?: string): Promise<PPCForm> {
    try {
      const response = await apiClient.post<ApiResponse<PPCForm>>(`${this.baseUrl}/${id}/approve`, {
        supervisor_id,
        notes
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to approve PPC form:', error);
      throw new Error(error.response?.data?.detail || 'Failed to approve PPC form');
    }
  }

  async reject(id: string, supervisor_id: string, reason: string): Promise<PPCForm> {
    try {
      const response = await apiClient.post<ApiResponse<PPCForm>>(`${this.baseUrl}/${id}/reject`, {
        supervisor_id,
        reason
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to reject PPC form:', error);
      throw new Error(error.response?.data?.detail || 'Failed to reject PPC form');
    }
  }

  async requestRework(id: string, supervisor_id: string, instructions: string): Promise<PPCForm> {
    try {
      const response = await apiClient.post<ApiResponse<PPCForm>>(`${this.baseUrl}/${id}/rework`, {
        supervisor_id,
        instructions
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to request rework for PPC form:', error);
      throw new Error(error.response?.data?.detail || 'Failed to request rework');
    }
  }

  // Analytics and reporting
  async getQualityMetrics(date_from?: string, date_to?: string): Promise<{
    average_yield: number;
    average_quality_score: number;
    total_forms: number;
    approval_rate: number;
    defect_trends: Array<{ defect: string; count: number }>;
  }> {
    try {
      const params = new URLSearchParams({
        ...(date_from && { date_from }),
        ...(date_to && { date_to })
      });
      
      const response = await apiClient.get<ApiResponse<{
        average_yield: number;
        average_quality_score: number;
        total_forms: number;
        approval_rate: number;
        defect_trends: Array<{ defect: string; count: number }>;
      }>>(`${this.baseUrl}/metrics?${params}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch PPC quality metrics:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load quality metrics');
    }
  }
}

export const ppcService = new PPCService();