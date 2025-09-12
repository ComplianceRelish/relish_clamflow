// src/services/auth-service.ts  
import { apiClient, type ApiResponse } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface BiometricLoginRequest {
  face_encoding: string;
  employee_id?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  is_active: boolean;
  permissions: string[];
  last_login?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
}

export class AuthService {
  private baseUrl = '/api/auth';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        `${this.baseUrl}/login`, 
        credentials,
        { skipAuth: true } // Skip auth for login endpoint
      );
      
      const authData = response.data.data;
      
      // Store tokens (your API client will auto-inject them)
      localStorage.setItem('auth_token', authData.access_token);
      localStorage.setItem('refresh_token', authData.refresh_token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      
      return authData;
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  }

  async biometricLogin(biometricData: BiometricLoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        `${this.baseUrl}/biometric-login`, 
        biometricData,
        { skipAuth: true }
      );
      
      const authData = response.data.data;
      
      localStorage.setItem('auth_token', authData.access_token);
      localStorage.setItem('refresh_token', authData.refresh_token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      
      return authData;
    } catch (error: any) {
      console.error('Biometric login failed:', error);
      throw new Error(error.response?.data?.detail || 'Biometric authentication failed');
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refresh_token = localStorage.getItem('refresh_token');
      if (!refresh_token) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        `${this.baseUrl}/refresh`, 
        { refresh_token },
        { skipAuth: true }
      );
      
      const authData = response.data.data;
      localStorage.setItem('auth_token', authData.access_token);
      localStorage.setItem('refresh_token', authData.refresh_token);
      
      return authData;
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      this.logout();
      throw new Error('Session expired. Please login again.');
    }
  }

  async logout(): Promise<void> {
    try {
      const refresh_token = localStorage.getItem('refresh_token');
      if (refresh_token) {
        await apiClient.post(`${this.baseUrl}/logout`, { refresh_token });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Clear all auth data (your API client interceptor will handle this)
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(`${this.baseUrl}/me`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get current user:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get user information');
    }
  }

  // Utility methods
  getAccessToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getCurrentUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();