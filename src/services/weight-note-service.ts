// src/services/weight-note-service.ts
import { apiClient, type ApiResponse, type PaginatedResponse, type BaseFilters } from './api';

export interface WeightNote {
  id?: string;
  lot_number: string;
  vessel_name: string;
  species: string;
  gross_weight: number;
  tare_weight: number;
  net_weight: number;
  date: string;
  time: string;
  staff_id: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  qr_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WeightNoteFilters extends BaseFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  lot_number?: string;
  vessel_name?: string;
  species?: string;
}

export class WeightNoteService {
  private baseUrl = '/api/weight-notes';

  async create(data: Omit<WeightNote, 'id' | 'created_at' | 'updated_at'>): Promise<WeightNote> {
    try {
      const response = await apiClient.post<ApiResponse<WeightNote>>(this.baseUrl, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create weight note:', error);
      throw new Error(error.response?.data?.detail || 'Failed to create weight note');
    }
  }

  async getAll(filters?: WeightNoteFilters): Promise<PaginatedResponse<WeightNote>> {
    try {
      const response = await apiClient.getPaginated<WeightNote>(this.baseUrl, filters);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch weight notes:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load weight notes');
    }
  }

  async getById(id: string): Promise<WeightNote> {
    try {
      const response = await apiClient.get<ApiResponse<WeightNote>>(`${this.baseUrl}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch weight note:', error);
      throw new Error(error.response?.data?.detail || 'Weight note not found');
    }
  }

  async update(id: string, data: Partial<WeightNote>): Promise<WeightNote> {
    try {
      const response = await apiClient.put<ApiResponse<WeightNote>>(`${this.baseUrl}/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update weight note:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update weight note');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error: any) {
      console.error('Failed to delete weight note:', error);
      throw new Error(error.response?.data?.detail || 'Failed to delete weight note');
    }
  }

  async approve(id: string, approver_id: string, notes?: string): Promise<WeightNote> {
    try {
      const response = await apiClient.post<ApiResponse<WeightNote>>(`${this.baseUrl}/${id}/approve`, {
        approver_id,
        notes
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to approve weight note:', error);
      throw new Error(error.response?.data?.detail || 'Failed to approve weight note');
    }
  }

  async reject(id: string, approver_id: string, reason: string): Promise<WeightNote> {
    try {
      const response = await apiClient.post<ApiResponse<WeightNote>>(`${this.baseUrl}/${id}/reject`, {
        approver_id,
        reason
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to reject weight note:', error);
      throw new Error(error.response?.data?.detail || 'Failed to reject weight note');
    }
  }

  async generateQRCode(id: string): Promise<{ qr_code: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ qr_code: string }>>(`${this.baseUrl}/${id}/generate-qr`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to generate QR code:', error);
      throw new Error(error.response?.data?.detail || 'Failed to generate QR code');
    }
  }
}

export const weightNoteService = new WeightNoteService();