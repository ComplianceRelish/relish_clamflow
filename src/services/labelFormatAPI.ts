import { 
  LabelTemplate, 
  LabelField, 
  APIResponse, 
  LabelTemplateFilters,
  TemplateValidationResult 
} from '../types/labelTypes';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';
const LABEL_API_ENDPOINT = `${API_BASE_URL}/label-formats`;

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
  const url = endpoint.startsWith('http') ? endpoint : `${LABEL_API_ENDPOINT}${endpoint}`;

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
    console.error('API Request Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Label Format API Service
 * Provides comprehensive CRUD operations for label templates
 */
export class LabelFormatAPI {

  /**
   * Get all label templates (alias for getAllTemplates)
   */
  static async getTemplates(filters?: LabelTemplateFilters): Promise<APIResponse<LabelTemplate[]>> {
    return this.getAllTemplates(filters);
  }

  /**
   * Get all label templates with optional filtering
   */
  static async getAllTemplates(filters?: LabelTemplateFilters): Promise<APIResponse<LabelTemplate[]>> {
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.plantId) queryParams.append('plantId', filters.plantId);
      if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
    }

    const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<LabelTemplate[]>(endpoint);
  }

  /**
   * Get a specific template by ID
   */
  static async getTemplateById(templateId: string): Promise<APIResponse<LabelTemplate>> {
    return apiRequest<LabelTemplate>(`/${templateId}`);
  }

  /**
   * Create a new label template
   */
  static async createTemplate(template: Omit<LabelTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<LabelTemplate>> {
    // Validate template before sending
    const validation = this.validateTemplate(template);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Template validation failed: ${validation.errors.join(', ')}`
      };
    }

    return apiRequest<LabelTemplate>('', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  /**
   * Update an existing template
   */
  static async updateTemplate(templateId: string, updates: Partial<LabelTemplate>): Promise<APIResponse<LabelTemplate>> {
    // If updating the entire template, validate it
    if (updates.fields || updates.name) {
      const validation = this.validateTemplateUpdates(updates);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Template validation failed: ${validation.errors.join(', ')}`
        };
      }
    }

    return apiRequest<LabelTemplate>(`/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(templateId: string): Promise<APIResponse<void>> {
    return apiRequest<void>(`/${templateId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Duplicate a template
   */
  static async duplicateTemplate(templateId: string, newName?: string): Promise<APIResponse<LabelTemplate>> {
    return apiRequest<LabelTemplate>(`/${templateId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ newName }),
    });
  }

  /**
   * Get template versions/history
   */
  static async getTemplateVersions(templateId: string): Promise<APIResponse<LabelTemplate[]>> {
    return apiRequest<LabelTemplate[]>(`/${templateId}/versions`);
  }

  /**
   * Restore a template to a specific version
   */
  static async restoreTemplateVersion(templateId: string, versionId: string): Promise<APIResponse<LabelTemplate>> {
    return apiRequest<LabelTemplate>(`/${templateId}/restore/${versionId}`, {
      method: 'POST',
    });
  }

  /**
   * Export template as JSON
   */
  static async exportTemplate(templateId: string): Promise<APIResponse<Blob>> {
    try {
      const response = await fetch(`${LABEL_API_ENDPOINT}/${templateId}/export`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        await handleAPIError(response);
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob,
        message: 'Template exported successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Import template from JSON file
   */
  static async importTemplate(file: File): Promise<APIResponse<LabelTemplate>> {
    const formData = new FormData();
    formData.append('template', file);

    try {
      const response = await fetch(`${LABEL_API_ENDPOINT}/import`, {
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
        message: 'Template imported successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      };
    }
  }

  /**
   * Validate template structure and fields
   */
  static validateTemplate(template: Partial<LabelTemplate>): TemplateValidationResult {
    const errors: string[] = [];

    // Required fields validation
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    } else if (template.name.length > 100) {
      errors.push('Template name must be less than 100 characters');
    }

    if (!template.category) {
      errors.push('Template category is required');
    }

    // Dimensions validation
    if (template.width && (template.width <= 0 || template.width > 2000)) {
      errors.push('Template width must be between 1 and 2000 pixels');
    }

    if (template.height && (template.height <= 0 || template.height > 2000)) {
      errors.push('Template height must be between 1 and 2000 pixels');
    }

    // Fields validation
    if (template.fields) {
      if (template.fields.length === 0) {
        errors.push('Template must have at least one field');
      }

      template.fields.forEach((field, index) => {
        const fieldErrors = this.validateField(field, index);
        errors.push(...fieldErrors);
      });

      // Check for duplicate field IDs
      const fieldIds = template.fields.map(f => f.id);
      const duplicateIds = fieldIds.filter((id, index) => fieldIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        errors.push(`Duplicate field IDs found: ${duplicateIds.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [], // Add the missing warnings property
    };
  }

  /**
   * Validate template updates
   */
  static validateTemplateUpdates(updates: Partial<LabelTemplate>): TemplateValidationResult {
    const errors: string[] = [];

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        errors.push('Template name cannot be empty');
      } else if (updates.name.length > 100) {
        errors.push('Template name must be less than 100 characters');
      }
    }

    if (updates.width !== undefined && (updates.width <= 0 || updates.width > 2000)) {
      errors.push('Template width must be between 1 and 2000 pixels');
    }

    if (updates.height !== undefined && (updates.height <= 0 || updates.height > 2000)) {
      errors.push('Template height must be between 1 and 2000 pixels');
    }

    if (updates.fields) {
      updates.fields.forEach((field, index) => {
        const fieldErrors = this.validateField(field, index);
        errors.push(...fieldErrors);
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [], // Add the missing warnings property
    };
  }

  /**
   * Validate individual field
   */
  static validateField(field: LabelField, index: number): string[] {
    const errors: string[] = [];
    const fieldPrefix = `Field ${index + 1}`;

    // Required field properties
    if (!field.id || field.id.trim().length === 0) {
      errors.push(`${fieldPrefix}: Field ID is required`);
    }

    if (!field.label || field.label.trim().length === 0) {
      errors.push(`${fieldPrefix}: Field label is required`);
    }

    if (!field.type) {
      errors.push(`${fieldPrefix}: Field type is required`);
    }

    // Position validation
    if (field.x !== undefined && field.x < 0) {
      errors.push(`${fieldPrefix}: X position cannot be negative`);
    }

    if (field.y !== undefined && field.y < 0) {
      errors.push(`${fieldPrefix}: Y position cannot be negative`);
    }

    // Dimensions validation
    if (field.width !== undefined && (field.width <= 0 || field.width > 1000)) {
      errors.push(`${fieldPrefix}: Width must be between 1 and 1000 pixels`);
    }

    if (field.height !== undefined && (field.height <= 0 || field.height > 1000)) {
      errors.push(`${fieldPrefix}: Height must be between 1 and 1000 pixels`);
    }

    // Type-specific validation
    if (field.type === 'logo' && !field.imageUrl) {
      errors.push(`${fieldPrefix}: Logo field requires an image URL`);
    }

    if (field.type === 'qr' && typeof field.dataSource === 'object' && field.dataSource?.type === 'calculated' && !field.dataSource.formula) {
      errors.push(`${fieldPrefix}: QR field with calculated data source requires a formula`);
    }

    return errors;
  }

  /**
   * Get template categories
   */
  static async getTemplateCategories(): Promise<APIResponse<string[]>> {
    return apiRequest<string[]>('/categories');
  }

  /**
   * Search templates by name or description
   */
  static async searchTemplates(query: string, limit: number = 10): Promise<APIResponse<LabelTemplate[]>> {
    const queryParams = new URLSearchParams({
      search: query,
      limit: limit.toString(),
    });

    return apiRequest<LabelTemplate[]>(`/search?${queryParams.toString()}`);
  }

  /**
   * Get templates by plant ID
   */
  static async getTemplatesByPlant(plantId: string): Promise<APIResponse<LabelTemplate[]>> {
    return apiRequest<LabelTemplate[]>(`/plant/${plantId}`);
  }

  /**
   * Set template as default for a plant
   */
  static async setDefaultTemplate(templateId: string, plantId: string): Promise<APIResponse<void>> {
    return apiRequest<void>(`/${templateId}/set-default`, {
      method: 'POST',
      body: JSON.stringify({ plantId }),
    });
  }

  /**
   * Get default template for a plant
   */
  static async getDefaultTemplate(plantId: string): Promise<APIResponse<LabelTemplate | null>> {
    return apiRequest<LabelTemplate | null>(`/default/${plantId}`);
  }

  /**
   * Bulk update templates
   */
  static async bulkUpdateTemplates(
    templateIds: string[], 
    updates: Partial<LabelTemplate>
  ): Promise<APIResponse<LabelTemplate[]>> {
    return apiRequest<LabelTemplate[]>('/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ templateIds, updates }),
    });
  }

  /**
   * Bulk delete templates
   */
  static async bulkDeleteTemplates(templateIds: string[]): Promise<APIResponse<void>> {
    return apiRequest<void>('/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ templateIds }),
    });
  }
}

export default LabelFormatAPI;