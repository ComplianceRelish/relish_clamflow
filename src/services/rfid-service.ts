// src/services/rfid-service.ts
import { apiClient, ApiResponse } from './api';

export interface RFIDTag {
  id: string;
  tag_id: string;
  lot_number: string;
  product_type: string;
  status: 'active' | 'inactive' | 'expired';
  data: Record<string, any>;
  created_at: string;
  last_scan?: string;
}

export interface RFIDScanResult {
  tag_id: string;
  lot_number?: string;
  product_info?: {
    name: string;
    species: string;
    weight: number;
    process_date: string;
    expiry_date: string;
  };
  scan_location: string;
  scanned_at: string;
  scanned_by: string;
}

export interface RFIDWriteRequest {
  tag_id: string;
  lot_number: string;
  product_data: {
    species: string;
    weight: number;
    process_date: string;
    quality_grade: string;
    [key: string]: any;
  };
}

export class RFIDService {
  private baseUrl = '/api/rfid';
  private readerEndpoint = '/api/hardware/rfid-reader';

  // Tag Management
  async createTag(data: Omit<RFIDTag, 'id' | 'created_at' | 'last_scan'>): Promise<RFIDTag> {
    try {
      const response = await apiClient.post<ApiResponse<RFIDTag>>(`${this.baseUrl}/tags`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create RFID tag:', error);
      throw new Error(error.response?.data?.detail || 'Failed to create RFID tag');
    }
  }

  async getAllTags(filters?: {
    status?: string;
    lot_number?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<RFIDTag[]> {
    try {
      const params = new URLSearchParams(filters as Record<string, string>);
      const response = await apiClient.get<ApiResponse<RFIDTag[]>>(`${this.baseUrl}/tags?${params}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch RFID tags:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load RFID tags');
    }
  }

  async getTagById(id: string): Promise<RFIDTag> {
    try {
      const response = await apiClient.get<ApiResponse<RFIDTag>>(`${this.baseUrl}/tags/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch RFID tag:', error);
      throw new Error(error.response?.data?.detail || 'RFID tag not found');
    }
  }

  // Hardware Communication
  async initializeReader(): Promise<{ status: string; reader_id?: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ status: string; reader_id?: string }>>(`${this.readerEndpoint}/initialize`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to initialize RFID reader:', error);
      throw new Error(error.response?.data?.detail || 'Failed to initialize RFID reader');
    }
  }

  async scanTag(reader_location: string, scanned_by: string): Promise<RFIDScanResult> {
    try {
      const response = await apiClient.post<ApiResponse<RFIDScanResult>>(`${this.readerEndpoint}/scan`, {
        reader_location,
        scanned_by
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to scan RFID tag:', error);
      throw new Error(error.response?.data?.detail || 'Failed to scan RFID tag');
    }
  }

  async writeTag(writeRequest: RFIDWriteRequest): Promise<{ success: boolean; tag_id: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ success: boolean; tag_id: string }>>(`${this.readerEndpoint}/write`, writeRequest);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to write RFID tag:', error);
      throw new Error(error.response?.data?.detail || 'Failed to write to RFID tag');
    }
  }

  // Bulk Operations
  async bulkScan(reader_location: string, scanned_by: string, count = 10): Promise<RFIDScanResult[]> {
    try {
      const response = await apiClient.post<ApiResponse<RFIDScanResult[]>>(`${this.readerEndpoint}/bulk-scan`, {
        reader_location,
        scanned_by,
        count
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to perform bulk RFID scan:', error);
      throw new Error(error.response?.data?.detail || 'Failed to perform bulk scan');
    }
  }

  async bulkWrite(writeRequests: RFIDWriteRequest[]): Promise<{
    successful: number;
    failed: number;
    results: Array<{ tag_id: string; success: boolean; error?: string }>;
  }> {
    try {
      const response = await apiClient.post<ApiResponse<{
        successful: number;
        failed: number;
        results: Array<{ tag_id: string; success: boolean; error?: string }>;
      }>>(`${this.readerEndpoint}/bulk-write`, {
        write_requests: writeRequests
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to perform bulk RFID write:', error);
      throw new Error(error.response?.data?.detail || 'Failed to perform bulk write');
    }
  }

  // Product Tracking
  async trackProduct(tag_id: string): Promise<{
    tag_id: string;
    lot_number: string;
    scan_history: Array<{
      location: string;
      scanned_at: string;
      scanned_by: string;
    }>;
    current_status: string;
    product_journey: Array<{
      stage: string;
      timestamp: string;
      location: string;
    }>;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        tag_id: string;
        lot_number: string;
        scan_history: Array<{
          location: string;
          scanned_at: string;
          scanned_by: string;
        }>;
        current_status: string;
        product_journey: Array<{
          stage: string;
          timestamp: string;
          location: string;
        }>;
      }>>(`${this.baseUrl}/track/${tag_id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to track product:', error);
      throw new Error(error.response?.data?.detail || 'Failed to track product');
    }
  }

  // Reader Status & Diagnostics
  async getReaderStatus(): Promise<{
    reader_id: string;
    status: 'online' | 'offline' | 'error';
    last_activity: string;
    firmware_version: string;
    signal_strength: number;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        reader_id: string;
        status: 'online' | 'offline' | 'error';
        last_activity: string;
        firmware_version: string;
        signal_strength: number;
      }>>(`${this.readerEndpoint}/status`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get RFID reader status:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get reader status');
    }
  }

  async testReaderConnection(): Promise<{ connected: boolean; response_time: number }> {
    try {
      const startTime = Date.now();
      const response = await apiClient.get<ApiResponse<{ connected: boolean }>>(`${this.readerEndpoint}/test`);
      const responseTime = Date.now() - startTime;
      
      return {
        connected: response.data.data.connected,
        response_time: responseTime
      };
    } catch (error: any) {
      console.error('RFID reader connection test failed:', error);
      return { connected: false, response_time: 0 };
    }
  }
}

export const rfidService = new RFIDService();