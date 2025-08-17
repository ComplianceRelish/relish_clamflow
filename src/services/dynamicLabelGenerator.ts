import { 
  LabelTemplate, 
  LabelField, 
  PlantConfiguration, 
  QRCodeData,
  ProcessingMethod,
  FPStation 
} from '../types/labelTypes';
import QRCode from 'qrcode';

export interface GeneratedLabel {
  id: string;
  templateId: string;
  plantId: string;
  batchId: string;
  timestamp: string;
  qrCodeData: string;
  qrCodeUrl?: string;
  fields: GeneratedFieldData[];
  metadata: {
    generatedBy: string;
    station?: string;
    processingMethod?: string;
    operator?: string;
  };
}

export interface GeneratedFieldData {
  fieldId: string;
  label: string;
  value: string;
  type: string;
  position: { x: number, y: number };
  dimensions: { width: number, height: number };
}

export interface LabelGenerationOptions {
  scale?: number;
  includeQRCode?: boolean;
  qrCodeSize?: number;
  format?: 'json' | 'html' | 'pdf' | 'png';
  dpi?: number;
  backgroundColor?: string;
  customData?: Record<string, any>;
}

export interface BatchLabelGeneration {
  batchId: string;
  quantity: number;
  startNumber?: number;
  sequenceFormat?: string; // e.g., "BATCH-{seq:4}" for BATCH-0001
  customFields?: Record<string, any>;
}

/**
 * Dynamic Label Generator Service
 * Generates labels dynamically based on templates, plant configurations, and form data
 */
export class DynamicLabelGenerator {

  /**
   * Generate a single label from template and data
   */
  static async generateLabel(
    template: LabelTemplate,
    plantConfig: PlantConfiguration,
    formData: Record<string, any>,
    stationData?: Record<string, any>,
    options: LabelGenerationOptions = {}
  ): Promise<GeneratedLabel> {
    const timestamp = new Date().toISOString();
    const batchId = formData.batchId || stationData?.batchId || this.generateBatchId(plantConfig.id);

    // Generate field data
    const fields = await this.generateFieldData(
      template.fields,
      plantConfig,
      formData,
      stationData,
      options.customData
    );

    // Generate QR code data
    const qrCodeData = this.generateQRData(
      plantConfig,
      formData,
      stationData || {},
      batchId,
      timestamp
    );

    let qrCodeUrl: string | undefined;
    if (options.includeQRCode !== false) {
      qrCodeUrl = await this.generateQRCodeImage(
        qrCodeData,
        options.qrCodeSize || 200,
        options.backgroundColor
      );
    }

    return {
      id: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId: template.id,
      plantId: plantConfig.id,
      batchId,
      timestamp,
      qrCodeData,
      qrCodeUrl,
      fields,
      metadata: {
        generatedBy: formData.operator || stationData?.operator || 'System',
        station: stationData?.stationId || formData.station,
        processingMethod: stationData?.processingMethod || formData.processingMethod,
        operator: formData.operator || stationData?.operator
      }
    };
  }

  /**
   * Generate multiple labels in batch
   */
  static async generateBatchLabels(
    template: LabelTemplate,
    plantConfig: PlantConfiguration,
    batchConfig: BatchLabelGeneration,
    baseFormData: Record<string, any>,
    stationData?: Record<string, any>,
    options: LabelGenerationOptions = {}
  ): Promise<GeneratedLabel[]> {
    const labels: GeneratedLabel[] = [];
    const startNum = batchConfig.startNumber || 1;

    for (let i = 0; i < batchConfig.quantity; i++) {
      const sequenceNum = startNum + i;
      const sequenceStr = this.formatSequence(sequenceNum, batchConfig.sequenceFormat);

      // Merge base form data with sequence-specific data
      const formData = {
        ...baseFormData,
        ...batchConfig.customFields,
        batchId: batchConfig.batchId,
        sequenceNumber: sequenceNum,
        sequenceString: sequenceStr,
        labelNumber: i + 1,
        totalLabels: batchConfig.quantity
      };

      const label = await this.generateLabel(
        template,
        plantConfig,
        formData,
        stationData,
        options
      );

      labels.push(label);
    }

    return labels;
  }

  /**
   * Generate field data from template fields
   */
  private static async generateFieldData(
    fields: LabelField[],
    plantConfig: PlantConfiguration,
    formData: Record<string, any>,
    stationData?: Record<string, any>,
    customData?: Record<string, any>
  ): Promise<GeneratedFieldData[]> {
    const generatedFields: GeneratedFieldData[] = [];

    for (const field of fields) {
      const value = this.calculateFieldValue(
        field,
        plantConfig,
        formData,
        stationData,
        customData
      );

      generatedFields.push({
        fieldId: field.id,
        label: field.label,
        value,
        type: field.type,
        position: { x: field.x || 0, y: field.y || 0 },
        dimensions: { width: field.width || 100, height: field.height || 30 }
      });
    }

    return generatedFields;
  }

  /**
   * Calculate field value based on data source
   */
  private static calculateFieldValue(
    field: LabelField,
    plantConfig: PlantConfiguration,
    formData: Record<string, any>,
    stationData?: Record<string, any>,
    customData?: Record<string, any>
  ): string {
    const allData = { ...formData, ...stationData, ...customData, plant: plantConfig };

    // Handle string dataSource (legacy format)
    if (typeof field.dataSource === 'string') {
      return (allData as any)[field.dataSource] || field.defaultValue || '';
    }

    // Handle object dataSource
    if (typeof field.dataSource === 'object' && field.dataSource?.type) {
      switch (field.dataSource.type) {
        case 'static':
          return field.defaultValue || '';

        case 'form':
          if (field.dataSource.sourceKey) {
            return formData[field.dataSource.sourceKey] || field.defaultValue || '';
          }
          return field.defaultValue || '';

        case 'plant':
          if (field.dataSource.sourceKey) {
            return this.getNestedValue(plantConfig, field.dataSource.sourceKey) || field.defaultValue || '';
          }
          return field.defaultValue || '';

        case 'regulation':
          if (field.dataSource.sourceKey && plantConfig.approvals) {
            // Handle approvals as object properties, not array
            const approvalType = field.dataSource.sourceKey.toLowerCase();
            let approval;
            
            switch (approvalType) {
              case 'haccp':
                approval = plantConfig.approvals.haccp;
                break;
              case 'fda':
                approval = plantConfig.approvals.fda;
                break;
              case 'iso22000':
                approval = plantConfig.approvals.iso22000;
                break;
              case 'halal':
                approval = plantConfig.approvals.halal;
                break;
              case 'organic':
                approval = plantConfig.approvals.organic;
                break;
              default:
                approval = null;
            }
            
            return approval?.number || field.defaultValue || '';
          }
          return field.defaultValue || '';

        case 'calculated':
          if (field.dataSource.formula) {
            return this.evaluateFormula(field.dataSource.formula, allData);
          }
          return field.defaultValue || '';

        case 'dynamic':
          return this.generateDynamicValue(field.dataSource.sourceKey, allData, plantConfig);

        default:
          return field.defaultValue || '';
      }
    }

    return field.defaultValue || '';
  }

  /**
   * Generate dynamic values
   */
  private static generateDynamicValue(
    sourceKey: string | undefined,
    data: Record<string, any>,
    plantConfig: PlantConfiguration
  ): string {
    const now = new Date();

    switch (sourceKey) {
      case 'timestamp':
        return now.toISOString();
      case 'date':
        return now.toLocaleDateString();
      case 'time':
        return now.toLocaleTimeString();
      case 'batch_id':
        return data.batchId || this.generateBatchId(plantConfig.id);
      case 'sequence_number':
        return (data.sequenceNumber || 1).toString();
      case 'traceability_code':
        return this.generateTraceabilityCode(plantConfig, data);
      case 'qr_data':
        return this.generateQRData(plantConfig, data, data.station || {}, data.batchId, now.toISOString());
      default:
        return '';
    }
  }

  /**
   * Evaluate formula expressions
   */
  private static evaluateFormula(formula: string, data: Record<string, any>): string {
    try {
      let result = formula;

      // Replace ${key} placeholders
      result = result.replace(/\$\{([^}]+)\}/g, (match, key) => {
        const value = this.getNestedValue(data, key);
        return value !== undefined ? String(value) : '';
      });

      // Handle simple arithmetic if needed
      if (/^[0-9+\-*/.\s()]+$/.test(result)) {
        try {
          // Safe evaluation for simple arithmetic
          const evalResult = Function(`"use strict"; return (${result})`)();
          return String(evalResult);
        } catch {
          return result;
        }
      }

      return result;
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return formula;
    }
  }

  /**
   * Get nested object value by key path
   */
  private static getNestedValue(obj: any, keyPath: string): any {
    return keyPath.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Generate QR code data object
   */
  private static generateQRData(
    plantConfig: PlantConfiguration,
    formData: Record<string, any>,
    stationData: Record<string, any>,
    batchId: string,
    timestamp: string
  ): string {
    const qrData: QRCodeData = {
      plantId: plantConfig.id,
      plantName: plantConfig.name,
      batchId,
      timestamp,
      station: stationData.stationId || formData.station || 'Unknown',
      product: {
        type: formData.productType || 'Clam',
        weight: formData.weight || 0,
        grade: formData.grade || 'A',
        lotNumber: formData.lotNumber || `LOT_${Date.now()}`
      },
      processing: {
        method: stationData.processingMethod || formData.processingMethod || 'Freezing',
        temperature: stationData.temperature || formData.temperature,
        duration: stationData.duration || formData.duration,
        operator: stationData.operator || formData.operator || 'Unknown'
      },
      quality: {
        inspector: formData.inspector || 'QC001',
        checkDate: formData.checkDate || timestamp,
        status: formData.qualityStatus || 'Approved',
        notes: formData.qualityNotes || ''
      },
      traceability: {
        sourceLocation: plantConfig.location?.coordinates || '',
        weightNoteId: formData.weightNoteId || `WN${Date.now()}`,
        receivalDate: formData.receivalDate || timestamp,
        supplier: formData.supplier || 'Unknown Supplier',
        traceabilityCode: this.generateTraceabilityCode(plantConfig, formData)
      },
      approvals: {
        haccp: plantConfig.approvals?.haccp?.status === 'active' ? plantConfig.approvals.haccp.number : undefined,
        fda: plantConfig.approvals?.fda?.status === 'active' ? plantConfig.approvals.fda.number : undefined,
        iso22000: plantConfig.approvals?.iso22000?.status === 'active' ? plantConfig.approvals.iso22000.number : undefined,
        halal: plantConfig.approvals?.halal?.status === 'active' ? plantConfig.approvals.halal.number : undefined,
        organic: plantConfig.approvals?.organic?.status === 'active' ? plantConfig.approvals.organic.number : undefined,
      }
    };

    return JSON.stringify(qrData);
  }

  /**
   * Generate QR code image
   */
  private static async generateQRCodeImage(
    data: string,
    size: number = 200,
    backgroundColor?: string
  ): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: backgroundColor || '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('QR Code generation error:', error);
      return '';
    }
  }

  /**
   * Generate traceability code
   */
  private static generateTraceabilityCode(
    plantConfig: PlantConfiguration,
    formData: Record<string, any>
  ): string {
    const plantCode = plantConfig.id.substring(0, 3).toUpperCase();
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const batchCode = (formData.batchId || 'BATCH').substring(-4).toUpperCase();
    const sequenceCode = (formData.sequenceNumber || 1).toString().padStart(3, '0');

    return `${plantCode}-${dateCode}-${batchCode}-${sequenceCode}`;
  }

  /**
   * Generate batch ID
   */
  private static generateBatchId(plantId: string): string {
    const plantCode = plantId.substring(0, 3).toUpperCase();
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `${plantCode}_${dateCode}_${randomCode}`;
  }

  /**
   * Format sequence number
   */
  private static formatSequence(sequenceNum: number, format?: string): string {
    if (!format) {
      return sequenceNum.toString();
    }

    return format.replace(/\{seq:(\d+)\}/g, (match, digits) => {
      const numDigits = parseInt(digits, 10);
      return sequenceNum.toString().padStart(numDigits, '0');
    }).replace(/\{seq\}/g, sequenceNum.toString());
  }

  /**
   * Export label as different formats
   */
  static async exportLabel(
    label: GeneratedLabel,
    format: 'json' | 'html' | 'pdf' | 'png' = 'json'
  ): Promise<string | Blob> {
    switch (format) {
      case 'json':
        return JSON.stringify(label, null, 2);

      case 'html':
        return this.generateHTMLLabel(label);

      case 'pdf':
        // This would require a PDF generation library like jsPDF
        throw new Error('PDF export not implemented. Requires jsPDF integration.');

      case 'png':
        // This would require canvas rendering
        throw new Error('PNG export not implemented. Requires canvas rendering.');

      default:
        return JSON.stringify(label, null, 2);
    }
  }

  /**
   * Generate HTML representation of label
   */
  private static generateHTMLLabel(label: GeneratedLabel): string {
    const fieldsHtml = label.fields.map(field => {
      const style = `
        position: absolute;
        left: ${field.position.x}px;
        top: ${field.position.y}px;
        width: ${field.dimensions.width}px;
        height: ${field.dimensions.height}px;
        border: 1px solid #ddd;
        padding: 2px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      `;

      return `<div style="${style}" title="${field.label}">${field.value}</div>`;
    }).join('');

    const qrCodeHtml = label.qrCodeUrl 
      ? `<img src="${label.qrCodeUrl}" alt="QR Code" style="position: absolute; bottom: 10px; right: 10px; width: 80px; height: 80px;" />`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Label ${label.id}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .label-container { 
            position: relative; 
            width: 400px; 
            height: 300px; 
            border: 2px solid #333; 
            background: white;
            margin: 0 auto;
          }
          .label-info { 
            margin-bottom: 20px; 
            padding: 10px; 
            background: #f5f5f5; 
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="label-info">
          <h3>Label Information</h3>
          <p><strong>ID:</strong> ${label.id}</p>
          <p><strong>Plant:</strong> ${label.plantId}</p>
          <p><strong>Batch:</strong> ${label.batchId}</p>
          <p><strong>Generated:</strong> ${new Date(label.timestamp).toLocaleString()}</p>
          <p><strong>Operator:</strong> ${label.metadata.generatedBy}</p>
        </div>

        <div class="label-container">
          ${fieldsHtml}
          ${qrCodeHtml}
        </div>

        <div style="margin-top: 20px; padding: 10px; background: #f9f9f9; border-radius: 4px;">
          <h4>QR Code Data:</h4>
          <pre style="white-space: pre-wrap; font-size: 10px;">${label.qrCodeData}</pre>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Validate label template for generation
   */
  static validateTemplateForGeneration(template: LabelTemplate): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!template.fields || template.fields.length === 0) {
      errors.push('Template must have at least one field');
    }

    template.fields?.forEach((field, index) => {
      if (!field.id) {
        errors.push(`Field ${index + 1}: Missing field ID`);
      }

      if (!field.type) {
        errors.push(`Field ${index + 1}: Missing field type`);
      }

      if (field.type === 'qr' && !field.dataSource) {
        errors.push(`Field ${index + 1}: QR field requires a data source`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get label generation statistics
   */
  static generateStatistics(labels: GeneratedLabel[]): {
    totalLabels: number;
    uniqueBatches: number;
    plantsInvolved: string[];
    generationTimespan: { start: string, end: string };
    operatorsInvolved: string[];
  } {
    if (labels.length === 0) {
      return {
        totalLabels: 0,
        uniqueBatches: 0,
        plantsInvolved: [],
        generationTimespan: { start: '', end: '' },
        operatorsInvolved: []
      };
    }

    const timestamps = labels.map(l => l.timestamp).sort();
    const uniqueBatches = new Set(labels.map(l => l.batchId)).size;
    const plantsInvolved = Array.from(new Set(labels.map(l => l.plantId)));
    const operatorsInvolved = Array.from(new Set(labels.map(l => l.metadata.generatedBy)));

    return {
      totalLabels: labels.length,
      uniqueBatches,
      plantsInvolved,
      generationTimespan: {
        start: timestamps[0],
        end: timestamps[timestamps.length - 1]
      },
      operatorsInvolved
    };
  }
}

export default DynamicLabelGenerator;