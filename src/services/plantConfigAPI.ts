import { 
  PlantConfiguration, 
  APIResponse, 
  Approval, 
  ProcessingMethod, 
  FPStation,
  Location,
  PlantConfigFilters 
} from '../types/labelTypes';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';
const PLANT_API_ENDPOINT = `${API_BASE_URL}/plant-configurations`;

// API Headers
const getHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = localStorage.getItem('clamflow_token') || sessionStorage.getItem('clamflow_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Error handling utility
const handleAPIError = async (response: Response): Promise<never> => {
  let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || errorMessage;
  } catch {
    // If response is not JSON, use default error message
  }

  throw new Error(errorMessage);
};

// Generic API request utility
const apiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<APIResponse<T>> => {
  const url = endpoint.startsWith('http') ? endpoint : `${PLANT_API_ENDPOINT}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      await handleAPIError(response);
    }

    const data = await response.json();

    return {
      success: true,
      data,
      message: data.message || 'Operation completed successfully',
    };
  } catch (error) {
    console.error('Plant Config API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Plant Configuration API Service
 * Manages plant configurations, approvals, processing methods, and FP stations
 */
export class PlantConfigAPI {

  /**
   * Get all plant configurations (alias for getAllPlants)
   */
  static async getPlantConfigurations(filters?: PlantConfigFilters): Promise<APIResponse<PlantConfiguration[]>> {
    return this.getAllPlants(filters);
  }

  /**
   * Save plant configuration (create or update)
   */
  static async savePlantConfiguration(config: Partial<PlantConfiguration>): Promise<APIResponse<PlantConfiguration>> {
    if (config.id) {
      return this.updatePlant(config.id, config);
    } else {
      return this.createPlant(config as PlantConfiguration);
    }
  }

  /**
   * Delete plant configuration
   */
  static async deletePlantConfiguration(configId: string): Promise<APIResponse<void>> {
    return this.deletePlant(configId);
  }

  /**
   * Get all plant configurations with optional filtering
   */
  static async getAllPlants(filters?: PlantConfigFilters): Promise<APIResponse<PlantConfiguration[]>> {
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.active !== undefined) queryParams.append('active', filters.active.toString());
      if (filters.region) queryParams.append('region', filters.region);
      if (filters.hasApproval) queryParams.append('hasApproval', filters.hasApproval);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
    }

    const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<PlantConfiguration[]>(endpoint);
  }

  /**
   * Get a specific plant configuration by ID
   */
  static async getPlantById(plantId: string): Promise<APIResponse<PlantConfiguration>> {
    return apiRequest<PlantConfiguration>(`/${plantId}`);
  }

  /**
   * Create a new plant configuration
   */
  static async createPlant(plant: Omit<PlantConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<PlantConfiguration>> {
    // Validate plant configuration before sending
    const validation = this.validatePlantConfig(plant);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Plant validation failed: ${validation.errors.join(', ')}`
      };
    }

    return apiRequest<PlantConfiguration>('', {
      method: 'POST',
      body: JSON.stringify(plant),
    });
  }

  /**
   * Update an existing plant configuration
   */
  static async updatePlant(plantId: string, updates: Partial<PlantConfiguration>): Promise<APIResponse<PlantConfiguration>> {
    // If updating critical fields, validate them
    const validation = this.validatePlantUpdates(updates);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Plant validation failed: ${validation.errors.join(', ')}`
      };
    }

    return apiRequest<PlantConfiguration>(`/${plantId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a plant configuration
   */
  static async deletePlant(plantId: string): Promise<APIResponse<void>> {
    return apiRequest<void>(`/${plantId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Duplicate a plant configuration
   */
  static async duplicatePlant(plantId: string, newName?: string): Promise<APIResponse<PlantConfiguration>> {
    return apiRequest<PlantConfiguration>(`/${plantId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ newName }),
    });
  }

  // ===== APPROVALS MANAGEMENT =====

  /**
   * Get all approvals for a plant
   */
  static async getPlantApprovals(plantId: string): Promise<APIResponse<Approval[]>> {
    return apiRequest<Approval[]>(`/${plantId}/approvals`);
  }

  /**
   * Add a new approval to a plant
   */
  static async addApproval(plantId: string, approval: Omit<Approval, 'id'>): Promise<APIResponse<Approval>> {
    const validation = this.validateApproval(approval);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Approval validation failed: ${validation.errors.join(', ')}`
      };
    }

    return apiRequest<Approval>(`/${plantId}/approvals`, {
      method: 'POST',
      body: JSON.stringify(approval),
    });
  }

  /**
   * Update an existing approval
   */
  static async updateApproval(plantId: string, approvalId: string, updates: Partial<Approval>): Promise<APIResponse<Approval>> {
    return apiRequest<Approval>(`/${plantId}/approvals/${approvalId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete an approval
   */
  static async deleteApproval(plantId: string, approvalId: string): Promise<APIResponse<void>> {
    return apiRequest<void>(`/${plantId}/approvals/${approvalId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Check approval expiry status
   */
  static async checkApprovalExpiry(plantId: string): Promise<APIResponse<{ expired: Approval[], expiringSoon: Approval[] }>> {
    return apiRequest<{ expired: Approval[], expiringSoon: Approval[] }>(`/${plantId}/approvals/expiry-check`);
  }

  /**
   * Renew an approval
   */
  static async renewApproval(plantId: string, approvalId: string, newExpiryDate: string, newCertificateNumber?: string): Promise<APIResponse<Approval>> {
    return apiRequest<Approval>(`/${plantId}/approvals/${approvalId}/renew`, {
      method: 'POST',
      body: JSON.stringify({ newExpiryDate, newCertificateNumber }),
    });
  }

  // ===== PROCESSING METHODS MANAGEMENT =====

  /**
   * Get all processing methods for a plant
   */
  static async getProcessingMethods(plantId: string): Promise<APIResponse<ProcessingMethod[]>> {
    return apiRequest<ProcessingMethod[]>(`/${plantId}/processing-methods`);
  }

  /**
   * Add a new processing method
   */
  static async addProcessingMethod(plantId: string, method: Omit<ProcessingMethod, 'id'>): Promise<APIResponse<ProcessingMethod>> {
    const validation = this.validateProcessingMethod(method);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Processing method validation failed: ${validation.errors.join(', ')}`
      };
    }

    return apiRequest<ProcessingMethod>(`/${plantId}/processing-methods`, {
      method: 'POST',
      body: JSON.stringify(method),
    });
  }

  /**
   * Update a processing method
   */
  static async updateProcessingMethod(plantId: string, methodId: string, updates: Partial<ProcessingMethod>): Promise<APIResponse<ProcessingMethod>> {
    return apiRequest<ProcessingMethod>(`/${plantId}/processing-methods/${methodId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a processing method
   */
  static async deleteProcessingMethod(plantId: string, methodId: string): Promise<APIResponse<void>> {
    return apiRequest<void>(`/${plantId}/processing-methods/${methodId}`, {
      method: 'DELETE',
    });
  }

  // ===== FP STATIONS MANAGEMENT =====

  /**
   * Get all FP stations for a plant
   */
  static async getFPStations(plantId: string): Promise<APIResponse<FPStation[]>> {
    return apiRequest<FPStation[]>(`/${plantId}/fp-stations`);
  }

  /**
   * Add a new FP station
   */
  static async addFPStation(plantId: string, station: Omit<FPStation, 'id'>): Promise<APIResponse<FPStation>> {
    const validation = this.validateFPStation(station);
    if (!validation.isValid) {
      return {
        success: false,
        error: `FP Station validation failed: ${validation.errors.join(', ')}`
      };
    }

    return apiRequest<FPStation>(`/${plantId}/fp-stations`, {
      method: 'POST',
      body: JSON.stringify(station),
    });
  }

  /**
   * Update an FP station
   */
  static async updateFPStation(plantId: string, stationId: string, updates: Partial<FPStation>): Promise<APIResponse<FPStation>> {
    return apiRequest<FPStation>(`/${plantId}/fp-stations/${stationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete an FP station
   */
  static async deleteFPStation(plantId: string, stationId: string): Promise<APIResponse<void>> {
    return apiRequest<void>(`/${plantId}/fp-stations/${stationId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get FP station status and activity
   */
  static async getFPStationStatus(plantId: string, stationId: string): Promise<APIResponse<{ isActive: boolean, lastActivity: string, currentBatch?: string }>> {
    return apiRequest<{ isActive: boolean, lastActivity: string, currentBatch?: string }>(`/${plantId}/fp-stations/${stationId}/status`);
  }

  // ===== VALIDATION METHODS =====

  /**
   * Validate plant configuration
   */
  static validatePlantConfig(plant: Partial<PlantConfiguration>): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!plant.name || plant.name.trim().length === 0) {
      errors.push('Plant name is required');
    } else if (plant.name.length > 100) {
      errors.push('Plant name must be less than 100 characters');
    }

    if (!plant.location?.address || plant.location.address.trim().length === 0) {
      errors.push('Plant address is required');
    }

    if (!plant.contactInfo?.email || !this.isValidEmail(plant.contactInfo.email)) {
      errors.push('Valid email address is required');
    }

    if (!plant.contactInfo?.phone || plant.contactInfo.phone.trim().length === 0) {
      errors.push('Phone number is required');
    }

    // Validate approvals
    if (plant.approvals && Array.isArray(plant.approvals)) {
      plant.approvals.forEach((approval, index) => {
        const approvalValidation = this.validateApproval(approval);
        if (!approvalValidation.isValid) {
          errors.push(`Approval ${index + 1}: ${approvalValidation.errors.join(', ')}`);
        }
      });
    }

    // Validate processing methods
    if (plant.processingMethods && Array.isArray(plant.processingMethods)) {
      plant.processingMethods.forEach((method, index) => {
        const methodValidation = this.validateProcessingMethod(method);
        if (!methodValidation.isValid) {
          errors.push(`Processing Method ${index + 1}: ${methodValidation.errors.join(', ')}`);
        }
      });
    }

    // Validate FP stations
    if (plant.fpStations && Array.isArray(plant.fpStations)) {
      plant.fpStations.forEach((station, index) => {
        const stationValidation = this.validateFPStation(station);
        if (!stationValidation.isValid) {
          errors.push(`FP Station ${index + 1}: ${stationValidation.errors.join(', ')}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate plant updates
   */
  static validatePlantUpdates(updates: Partial<PlantConfiguration>): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        errors.push('Plant name cannot be empty');
      } else if (updates.name.length > 100) {
        errors.push('Plant name must be less than 100 characters');
      }
    }

    if (updates.contactInfo?.email && !this.isValidEmail(updates.contactInfo.email)) {
      errors.push('Invalid email address format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate approval
   */
  static validateApproval(approval: Partial<Approval>): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!approval.type || approval.type.trim().length === 0) {
      errors.push('Approval type is required');
    }

    if (!approval.number || approval.number.trim().length === 0) {
      errors.push('Certificate number is required');
    }

    if (!approval.expiryDate) {
      errors.push('Expiry date is required');
    } else {
      const expiryDate = new Date(approval.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        errors.push('Invalid expiry date format');
      }
    }

    if (!approval.issuer || approval.issuer.trim().length === 0) {
      errors.push('Issuing authority is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate processing method
   */
  static validateProcessingMethod(method: Partial<ProcessingMethod>): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!method.name || method.name.trim().length === 0) {
      errors.push('Processing method name is required');
    }

    if (!method.category || method.category.trim().length === 0) {
      errors.push('Processing method category is required');
    }

    const validCategories = ['Freezing', 'Drying', 'Chilling', 'Pasteurizing'];
    if (method.category && !validCategories.includes(method.category)) {
      errors.push(`Processing method category must be one of: ${validCategories.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate FP station
   */
  static validateFPStation(station: Partial<FPStation>): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!station.stationId || station.stationId.trim().length === 0) {
      errors.push('Station ID is required');
    }

    if (!station.name || station.name.trim().length === 0) {
      errors.push('Station name is required');
    }

    if (!station.location || station.location.trim().length === 0) {
      errors.push('Station location is required');
    }

    if (station.capacity !== undefined && station.capacity <= 0) {
      errors.push('Station capacity must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Email validation utility
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ===== UTILITY METHODS =====

  /**
   * Search plants by name or location
   */
  static async searchPlants(query: string, limit: number = 10): Promise<APIResponse<PlantConfiguration[]>> {
    const queryParams = new URLSearchParams({
      search: query,
      limit: limit.toString(),
    });

    return apiRequest<PlantConfiguration[]>(`/search?${queryParams.toString()}`);
  }

  /**
   * Get plants by region
   */
  static async getPlantsByRegion(region: string): Promise<APIResponse<PlantConfiguration[]>> {
    return apiRequest<PlantConfiguration[]>(`/region/${region}`);
  }

  /**
   * Get plants with expiring approvals
   */
  static async getPlantsWithExpiringApprovals(daysAhead: number = 30): Promise<APIResponse<PlantConfiguration[]>> {
    return apiRequest<PlantConfiguration[]>(`/expiring-approvals?days=${daysAhead}`);
  }

  /**
   * Export plant configuration
   */
  static async exportPlantConfig(plantId: string): Promise<APIResponse<Blob>> {
    try {
      const response = await fetch(`${PLANT_API_ENDPOINT}/${plantId}/export`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        await handleAPIError(response);
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob,
        message: 'Plant configuration exported successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Import plant configuration
   */
  static async importPlantConfig(file: File): Promise<APIResponse<PlantConfiguration>> {
    const formData = new FormData();
    formData.append('plantConfig', file);

    try {
      const response = await fetch(`${PLANT_API_ENDPOINT}/import`, {
        method: 'POST',
        headers: {
          ...getHeaders(true),
          // Don't set Content-Type for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        await handleAPIError(response);
      }

      const data = await response.json();
      return {
        success: true,
        data,
        message: 'Plant configuration imported successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      };
    }
  }

  /**
   * Bulk operations
   */
  static async bulkUpdatePlants(plantIds: string[], updates: Partial<PlantConfiguration>): Promise<APIResponse<PlantConfiguration[]>> {
    return apiRequest<PlantConfiguration[]>('/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ plantIds, updates }),
    });
  }

  /**
   * Get plant statistics
   */
  static async getPlantStatistics(): Promise<APIResponse<{
    totalPlants: number;
    activePlants: number;
    totalApprovals: number;
    expiringApprovals: number;
    totalFPStations: number;
    activeFPStations: number;
  }>> {
    return apiRequest<{
      totalPlants: number;
      activePlants: number;
      totalApprovals: number;
      expiringApprovals: number;
      totalFPStations: number;
      activeFPStations: number;
    }>('/statistics');
  }
}

export default PlantConfigAPI;