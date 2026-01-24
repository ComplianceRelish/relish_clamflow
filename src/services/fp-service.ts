import { 
  FPForm, 
  FPFormCreate, 
  FPFormApproval,
  BoxScanData,
  FinalPackingData,
  MicrobiologyTestResult,
  PackSizeConfiguration,
  LabelGenerationResult,
  WorkflowStage,
  FPFormStatus,
  FPFormDetailed,
  FPWorkflowHistory
} from '../types/forms';
import { API_BASE_URL } from './api';

class FPFormsService {
  // Backend: /fp-forms/
  private baseUrl = `${API_BASE_URL}/fp-forms`;
  private backendUrl = API_BASE_URL;

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('clamflow_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
  }

  // Step 1: QC Staff opens FP Form
  async createFPForm(data: FPFormCreate): Promise<FPForm> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        status: 'draft' as FPFormStatus,
        created_by_role: 'QC Staff',
        workflow_stage: 'ppc_scanning' as WorkflowStage,
        created_at: new Date().toISOString(),
        expected_pack_configurations: data.expected_pack_configurations || []
      })
    });

    return this.handleResponse<FPForm>(response);
  }

  // Step 2: In-scan boxes from PPC with validation
  async scanPPCBoxes(formId: string, scannedBoxes: BoxScanData[]): Promise<{
    fp_form: FPForm;
    scan_results: {
      successful_scans: BoxScanData[];
      failed_scans: BoxScanData[];
      duplicate_scans: BoxScanData[];
    };
  }> {
    const response = await fetch(`${this.baseUrl}/${formId}/scan-boxes`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        scanned_boxes: scannedBoxes,
        scan_timestamp: new Date().toISOString(),
        workflow_stage: 'production_authentication' as WorkflowStage,
        validation_rules: {
          check_ppc_reference: true,
          verify_lot_association: true,
          prevent_duplicates: true
        }
      })
    });

    return this.handleResponse(response);
  }

  // Step 3: Authenticate Production Staff (multiple methods)
  async authenticateProductionStaff(
    formId: string, 
    staffId: string, 
    authMethod: 'face' | 'qr' | 'manual' | 'rfid',
    authData?: any
  ): Promise<{ 
    authenticated: boolean; 
    staff_details: any;
    permissions: string[];
    next_stage: WorkflowStage;
  }> {
    const response = await fetch(`${this.baseUrl}/${formId}/authenticate-staff`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        staff_id: staffId,
        authentication_method: authMethod,
        authentication_data: authData,
        timestamp: new Date().toISOString(),
        ip_address: window.location.hostname
      })
    });

    return this.handleResponse(response);
  }

  // Step 4: Get Admin-defined pack size configurations
  async getPackSizeConfigurations(lotId?: string): Promise<PackSizeConfiguration[]> {
    const url = `${this.backendUrl}/admin/pack-size-configurations${lotId ? `?lot_id=${lotId}` : ''}`;
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to load pack size configurations');
    }

    const data = await response.json();
    return data.configurations || [];
  }

  // Step 5: Production Staff enters final packing data (Multi-box/Multiple pack sizes)
  async enterFinalPackingData(
    formId: string, 
    packingData: FinalPackingData
  ): Promise<{ 
    fp_form: FPForm; 
    generated_labels: LabelGenerationResult[];
    packing_summary: {
      total_boxes: number;
      pack_configurations: PackSizeConfiguration[];
      total_weight: number;
      estimated_pieces: number;
    };
  }> {
    
    // Validate pack configurations
    const validationResult = await this.validatePackConfigurations(packingData.pack_configurations);
    if (!validationResult.valid) {
      throw new Error(`Invalid pack configuration: ${validationResult.errors.join(', ')}`);
    }

    const response = await fetch(`${this.baseUrl}/${formId}/final-packing`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        ...packingData,
        workflow_stage: 'qc_station_review' as WorkflowStage,
        packing_completed_at: new Date().toISOString(),
        validation_results: validationResult,
        generate_labels: true,
        label_format: 'standard_seafood_label'
      })
    });
    
    return this.handleResponse(response);
  }

  // Pack Configuration Validation
  private async validatePackConfigurations(configurations: PackSizeConfiguration[]): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if configurations exist
    if (!configurations || configurations.length === 0) {
      errors.push('At least one pack configuration is required');
    }

    // Validate each configuration
    configurations.forEach((config, index) => {
      if (!config.pack_size_id || !config.quantity || !config.weight_per_pack) {
        errors.push(`Configuration ${index + 1}: Missing required fields`);
      }

      if (config.quantity <= 0) {
        errors.push(`Configuration ${index + 1}: Quantity must be positive`);
      }

      if (config.weight_per_pack <= 0) {
        errors.push(`Configuration ${index + 1}: Weight per pack must be positive`);
      }

      // Business rule validations
      if (config.pieces_per_pack && config.pieces_per_pack < 1) {
        warnings.push(`Configuration ${index + 1}: Very low pieces per pack (${config.pieces_per_pack})`);
      }

      if (config.weight_per_pack > 50) {
        warnings.push(`Configuration ${index + 1}: Heavy pack weight (${config.weight_per_pack}kg)`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Step 6: QC Staff approval/rejection with detailed feedback
  async qcStationReview(
    formId: string, 
    approval: FPFormApproval
  ): Promise<{
    fp_form: FPForm;
    notification_sent: boolean;
    next_assignee?: string;
  }> {
    const endpoint = approval.approved ? 'approve' : 'reject';
    const response = await fetch(`${this.baseUrl}/${formId}/qc-station/${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        ...approval,
        reviewer_role: 'QC Staff',
        review_timestamp: new Date().toISOString(),
        next_stage: approval.approved ? 'production_lead_review' : 'production_rework',
        quality_checklist: approval.quality_checklist,
        send_notifications: true,
        notification_recipients: approval.approved ? ['production_lead'] : ['production_staff', 'production_lead', 'qc_lead']
      })
    });

    return this.handleResponse(response);
  }

  // Step 7: Production Lead approval/rejection
  async productionLeadReview(
    formId: string, 
    approval: FPFormApproval
  ): Promise<{
    fp_form: FPForm;
    inventory_entry?: any;
    notification_sent: boolean;
  }> {
    const endpoint = approval.approved ? 'approve' : 'reject';
    const response = await fetch(`${this.baseUrl}/${formId}/production-lead/${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        ...approval,
        reviewer_role: 'Production Lead',
        review_timestamp: new Date().toISOString(),
        next_stage: approval.approved ? 'inventory_entry' : 'qc_station_rework',
        final_production_approval: approval.approved,
        send_notifications: true,
        auto_inventory_entry: approval.approved
      })
    });

    return this.handleResponse(response);
  }

  // Step 8: Automatic Inventory Entry (triggered after Production Lead approval)
  async enterIntoInventory(formId: string): Promise<{ 
    inventory_entry: any; 
    fp_form: FPForm;
    qc_lead_assigned: boolean;
  }> {
    const response = await fetch(`${this.baseUrl}/${formId}/enter-inventory`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        inventory_entry_timestamp: new Date().toISOString(),
        workflow_stage: 'microbiology_testing' as WorkflowStage,
        auto_assign_qc_lead: true,
        create_lot_tracking: true
      })
    });

    return this.handleResponse(response);
  }

  // Step 9: QC Lead Microbiology Testing
  async submitMicrobiologyResults(
    formId: string, 
    testResults: MicrobiologyTestResult
  ): Promise<{
    fp_form: FPForm;
    lot_status_updated: boolean;
    shipment_ready: boolean;
  }> {
    const response = await fetch(`${this.baseUrl}/${formId}/microbiology-results`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        ...testResults,
        qc_lead_id: testResults.tested_by,
        test_completed_at: new Date().toISOString(),
        workflow_stage: testResults.test_passed ? 'ready_for_shipment' : 'quality_hold',
        update_lot_status: true,
        generate_certificates: testResults.test_passed
      })
    });

    return this.handleResponse(response);
  }

  // Comprehensive Workflow Management
  async getFPFormWorkflowStatus(formId: string): Promise<{
    current_stage: WorkflowStage;
    completed_stages: WorkflowStage[];
    pending_approvals: any[];
    can_proceed: boolean;
    assignee_info: any;
    estimated_completion: string;
  }> {
    const response = await fetch(`${this.baseUrl}/${formId}/workflow-status`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  // Enhanced Rejection Handling with Comprehensive Notifications
  async handleRejection(
    formId: string, 
    rejectionData: {
      reason: string;
      rejected_by: string;
      rejected_by_role: string;
      return_to_stage: WorkflowStage;
      corrective_actions: string[];
      priority_level: 'low' | 'medium' | 'high' | 'critical';
      notification_recipients: string[];
      attachments?: string[];
    }
  ): Promise<{
    fp_form: FPForm;
    notifications_sent: string[];
    escalation_triggered: boolean;
  }> {
    const response = await fetch(`${this.baseUrl}/${formId}/reject-with-notifications`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        ...rejectionData,
        rejection_timestamp: new Date().toISOString(),
        auto_notify_production_lead: true,
        auto_notify_qc_lead: rejectionData.priority_level === 'critical',
        create_corrective_action_plan: true,
        escalation_rules: {
          notify_admin_if_critical: true,
          create_incident_report: rejectionData.priority_level === 'critical'
        }
      })
    });

    return this.handleResponse(response);
  }

  // Advanced Filtering and Search
  async getFPForms(filters?: {
    status?: FPFormStatus[];
    workflow_stage?: WorkflowStage[];
    assigned_to_role?: string[];
    date_range?: { start: string; end: string };
    lot_ids?: string[];
    priority_level?: string;
    search_text?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    fp_forms: FPForm[];
    total_count: number;
    pagination: {
      current_page: number;
      total_pages: number;
      has_next: boolean;
      has_previous: boolean;
    };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  // Comprehensive FP Form Details
  async getFPFormDetails(formId: string): Promise<FPFormDetailed> {
    const response = await fetch(`${this.baseUrl}/${formId}/details`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  // Label Management
  async regenerateLabels(formId: string, labelIds?: string[]): Promise<LabelGenerationResult[]> {
    const response = await fetch(`${this.baseUrl}/${formId}/regenerate-labels`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        label_ids: labelIds,
        regeneration_reason: 'manual_request',
        timestamp: new Date().toISOString()
      })
    });

    return this.handleResponse(response);
  }

  // Bulk Operations
  async bulkApprove(formIds: string[], approvalData: Omit<FPFormApproval, 'form_id'>): Promise<{
    successful: string[];
    failed: { form_id: string; error: string }[];
  }> {
    const response = await fetch(`${this.baseUrl}/bulk-approve`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        form_ids: formIds,
        approval_data: approvalData,
        bulk_timestamp: new Date().toISOString()
      })
    });

    return this.handleResponse(response);
  }

  // Real-time Status Updates
  async subscribeToFormUpdates(formId: string, callback: (update: any) => void): Promise<() => void> {
    // WebSocket or Server-Sent Events implementation
    const eventSource = new EventSource(`${this.backendUrl}/fp-forms/${formId}/stream`);
    
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      callback(update);
    };

    // Return unsubscribe function
    return () => {
      eventSource.close();
    };
  }

  // Analytics and Reporting
  async getFPFormAnalytics(dateRange?: { start: string; end: string }): Promise<{
    total_forms: number;
    completion_rate: number;
    average_processing_time: number;
    rejection_rate: number;
    bottlenecks: { stage: WorkflowStage; average_time: number }[];
    quality_metrics: any;
  }> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
    }

    const response = await fetch(`${this.baseUrl}/analytics?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  // Export functionality
  async exportFPFormData(formIds: string[], format: 'excel' | 'pdf' | 'csv'): Promise<string> {
    const response = await fetch(`${this.baseUrl}/export`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        form_ids: formIds,
        export_format: format,
        include_workflow_history: true,
        include_attachments: format === 'pdf'
      })
    });

    const data = await this.handleResponse<{ download_url: string }>(response);
    return data.download_url;
  }
}

export const fpFormsService = new FPFormsService();
export default fpFormsService;