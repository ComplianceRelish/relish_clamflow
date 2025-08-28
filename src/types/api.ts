// API Response Types
import { User } from './auth';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}

// Form submission types
export interface FormSubmissionResponse {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
}

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  services: {
    database: boolean;
    authentication: boolean;
    hardware: boolean;
  };
  uptime: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalLots: number;
  pendingApprovals: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

// Export legacy compatibility
export type { User as UserProfile } from './auth';