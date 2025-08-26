// ClamFlow API Client for Backend Integration
// Based on Frontend Integration Guide

const API_CONFIG = {
  baseURL: 'https://clamflowbackend-production.up.railway.app',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// User Roles as defined in backend
export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin', 
  PRODUCTION_LEAD: 'Production Lead',
  QC_LEAD: 'QC Lead',
  STAFF_LEAD: 'Staff Lead',
  QC_STAFF: 'QC Staff',
  PRODUCTION_STAFF: 'Production Staff',
  SECURITY_GUARD: 'Security Guard'
};

// Role hierarchy levels (1 = highest authority)
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.PRODUCTION_LEAD]: 3,
  [ROLES.QC_LEAD]: 4,
  [ROLES.STAFF_LEAD]: 5,
  [ROLES.QC_STAFF]: 6,
  [ROLES.PRODUCTION_STAFF]: 7,
  [ROLES.SECURITY_GUARD]: 8
};

class ClamFlowAPIClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
  }

  // Get JWT token from localStorage
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jwt_token');
    }
    return null;
  }

  // Get current user role
  getCurrentUserRole(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_role');
    }
    return null;
  }

  // Generic HTTP request method
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user_role');
          window.location.href = '/login';
        }
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Authentication Methods
  async login(username: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    
    // Store tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('jwt_token', data.access_token);
      localStorage.setItem('user_role', data.user?.role || '');
    }

    return data;
  }

  // Face Recognition Authentication
  async loginWithFace(imageFile: File) {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await fetch(`${this.baseURL}/authenticate_by_face`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Face authentication failed');
    }
    
    const data = await response.json();
    
    // Store tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('jwt_token', data.access_token);
      localStorage.setItem('user_role', data.user?.role || '');
    }
    
    return data;
  }

  // Logout
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_role');
    }
  }

  // User Profile
  async getUserProfile() {
    return this.get('/user/profile');
  }

  // Data Access Methods
  async getSuppliers(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    
    const queryString = params.toString();
    return this.get(`/data/suppliers${queryString ? `?${queryString}` : ''}`);
  }

  async getStaff() {
    return this.get('/data/staff');
  }

  async getVendors() {
    return this.get('/data/vendors');
  }

  async getLots() {
    return this.get('/data/lots');
  }

  // Form Methods
  async createWeightNote(formData: any) {
    return this.post('/form/weight-note', formData);
  }

  async approveWeightNote(noteId: string) {
    return this.put(`/form/weight-note/${noteId}/approve`);
  }

  async createPPCForm(formData: any) {
    return this.post('/form/ppc', formData);
  }

  async approvePPCForm(formId: string) {
    return this.put(`/form/ppc/${formId}/approve`);
  }

  async createFPForm(formData: any) {
    return this.post('/form/fp', formData);
  }

  async approveFPForm(formId: string) {
    return this.put(`/form/fp/${formId}/approve`);
  }

  // Staff Lead Methods
  async getStaffList() {
    return this.get('/staff-lead/staff-list');
  }

  async getAttendanceOverview(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    
    const queryString = params.toString();
    return this.get(`/staff-lead/attendance-overview${queryString ? `?${queryString}` : ''}`);
  }

  async getVendorList(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    
    const queryString = params.toString();
    return this.get(`/staff-lead/vendor-list${queryString ? `?${queryString}` : ''}`);
  }

  // Security & Gate Control
  async logGateEntry(rfidTags: string[]) {
    return this.post('/secure/gate/entry', { 
      rfid_tags: rfidTags,
      timestamp: new Date().toISOString()
    });
  }

  async logGateExit(rfidTags: string[]) {
    return this.post('/secure/gate/exit', { 
      rfid_tags: rfidTags,
      timestamp: new Date().toISOString()
    });
  }

  async recordAttendance(employeeId: string, method: 'face' | 'qr') {
    return this.post('/secure/attendance', {
      employee_id: employeeId,
      method,
      timestamp: new Date().toISOString()
    });
  }

  // Onboarding Methods
  async submitStaffOnboarding(staffData: any) {
    return this.post('/onboarding/staff', staffData);
  }

  async submitSupplierOnboarding(supplierData: any) {
    return this.post('/onboarding/supplier', supplierData);
  }

  async submitVendorOnboarding(vendorData: any) {
    return this.post('/onboarding/vendor', vendorData);
  }

  async approveOnboarding(id: string) {
    return this.put(`/onboarding/${id}/approve`);
  }

  // Super Admin Methods
  async getAdmins() {
    return this.get('/super-admin/admins');
  }

  async createAdmin(adminData: any) {
    return this.post('/super-admin/admins', adminData);
  }

  async updateAdminPermissions(userId: string, permissions: any) {
    return this.put(`/super-admin/permissions/${userId}`, permissions);
  }

  async getAuditLogs() {
    return this.get('/super-admin/audit-logs');
  }

  // Utility Methods
  async getNotifications() {
    return this.get('/notifications');
  }

  async getHealthStatus() {
    return this.get('/health');
  }
}

// Permission checking utilities
export function hasPermission(userRole: string, requiredRoles: string | string[]): boolean {
  if (!Array.isArray(requiredRoles)) {
    requiredRoles = [requiredRoles];
  }
  return requiredRoles.includes(userRole);
}

export function hasHierarchyLevel(userRole: string, minimumLevel: number): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 999;
  return userLevel <= minimumLevel;
}

export function canAccessModule(userRole: string, module: string): boolean {
  const modulePermissions: { [key: string]: string[] } = {
    'super_admin': [ROLES.SUPER_ADMIN],
    'admin_panel': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    'production_forms': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PRODUCTION_LEAD, ROLES.PRODUCTION_STAFF],
    'quality_control': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PRODUCTION_LEAD, ROLES.QC_LEAD, ROLES.QC_STAFF],
    'hr_management': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF_LEAD],
    'gate_control': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PRODUCTION_LEAD, ROLES.SECURITY_GUARD],
    'reports': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PRODUCTION_LEAD, ROLES.QC_LEAD, ROLES.STAFF_LEAD]
  };
  
  return hasPermission(userRole, modulePermissions[module] || []);
}

// Create singleton instance
export const apiClient = new ClamFlowAPIClient();
export default apiClient;
