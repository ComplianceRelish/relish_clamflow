// services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// ✅ ADD THESE NECESSARY API TYPES FOR CONSISTENCY
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
  status?: number;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more?: boolean;
}

export interface ErrorResponse {
  detail: string;
  status_code: number;
  error_type?: string;
  field_errors?: Record<string, string[]>;
}

// ✅ ADD STANDARDIZED API REQUEST OPTIONS
export interface ApiRequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  retries?: number;
}

// ✅ ADD FILTER BASE INTERFACE FOR CONSISTENCY
export interface BaseFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: inject auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor: handle errors globally
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ✅ ENHANCED METHODS WITH BETTER TYPE SAFETY
  get<T>(url: string, config?: ApiRequestOptions): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  post<T>(url: string, data?: any, config?: ApiRequestOptions): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: ApiRequestOptions): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  delete<T>(url: string, config?: ApiRequestOptions): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  // ✅ ADD CONVENIENCE METHOD FOR PAGINATED REQUESTS
  async getPaginated<T>(
    url: string, 
    filters?: BaseFilters, 
    config?: ApiRequestOptions
  ): Promise<AxiosResponse<PaginatedResponse<T>>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const urlWithParams = params.toString() ? `${url}?${params.toString()}` : url;
    return this.client.get<PaginatedResponse<T>>(urlWithParams, config);
  }
}

// At the end of your api.ts file, make sure you have:
export const apiClient = new APIClient();