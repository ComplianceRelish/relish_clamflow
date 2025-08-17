// /QC_Flow/components/label-system/LabelPreviewPanel.tsx
// Live Preview Panel Component
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  LabelTemplate, 
  PlantConfiguration, 
  FPStation, 
  ProcessingMethod,
  QRCodeData,
  LabelField
} from '../../types/labelTypes';

interface LabelPreviewPanelProps {
  template: LabelTemplate | null;
  plant: PlantConfiguration | null;
  previewData: any;
  onPreviewDataUpdate: (data: any) => void;
}

export const LabelPreviewPanel: React.FC<LabelPreviewPanelProps> = ({
  template,
  plant,
  previewData,
  onPreviewDataUpdate
}) => {
  const [previewSize, setPreviewSize] = useState<'small' | 'medium' | 'large' | 'actual'>('medium');
  const [selectedStation, setSelectedStation] = useState<FPStation | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<ProcessingMethod | null>(null);
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [generatedQRCodes, setGeneratedQRCodes] = useState<Map<string, string>>(new Map());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (plant && plant.stations.length > 0 && !selectedStation) {
      setSelectedStation(plant.stations.find(s => s.isActive) || plant.stations[0]);
    }
    if (plant && plant.processingMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(plant.processingMethods[0]);
    }
  }, [plant]);

  useEffect(() => {
    generateQRCodes();
  }, [template, plant, selectedStation, selectedMethod, refreshKey]);

  const generatePreviewData = () => {
    if (!template || !plant || !selectedStation || !selectedMethod) return {};

    const currentDate = new Date();
    const baseQRData: QRCodeData = {
      // Required top-level fields
      plantId: plant?.plantCode || 'PLANT001',
      plantName: plant?.plantName,
      batchId: `BATCH-${Date.now()}`,
      timestamp: currentDate.toISOString(),
      station: selectedStation?.code || 'FP001',
      
      // Your nested product structure
      product: {
        type: 'Whole Clam',
        weight: 25.5,
        grade: 'A+',
        lotNumber: 'L2024001'
      },
      
      // Your nested processing structure
      processing: {
        method: selectedMethod?.code || 'STANDARD',
        temperature: selectedMethod?.temperatureRange.min,
        duration: selectedMethod?.timeRange.min,
        operator: 'fp_staff_01'
      },
      
      // Your nested quality structure
      quality: {
        inspector: 'QC Inspector 1',
        checkDate: currentDate.toISOString(),
        status: 'PASSED',
        notes: 'Quality standards met'
      },
      
      // Your nested traceability structure
      traceability: {
        sourceLocation: plant?.location?.city || 'Processing Plant',
        weightNoteId: 'WN-2024001',
        receivalDate: currentDate.toISOString(),
        supplier: 'Supplier-001',
        traceabilityCode: generateTraceabilityCode(plant?.plantCode || 'PLANT001', selectedStation?.code || 'FP001')
      },
      
      // Your approvals structure
      approvals: {
        haccp: plant?.approvals?.haccp?.number,
        fda: plant?.approvals?.fda?.number,
        iso22000: plant?.approvals?.iso22000?.number,
        halal: plant?.approvals?.halal?.number,
        organic: plant?.approvals?.organic?.number
      },
      
      // ADD: New packaging section (optional)
      packaging: {
        specId: 'std-5kg-001',
        type: 'Standard 5kg Box',
        tareWeight: 0.5,
        grossWeight: 25.5 + 0.5
      },
      
      // Legacy fields for backward compatibility
      productId: `FP-${Date.now()}`,
      lotId: 'L2024001',
      boxNumber: 'B001',
      productType: 'Whole Clam',
      grade: 'A+',
      weight: 25.5,
      processedDate: currentDate.toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      fpStaffId: 'fp_staff_01',
      rfidTag: 'RFID123456789',
      batchNumber: `BATCH-${Date.now()}`,
      traceabilityCode: generateTraceabilityCode(plant?.plantCode || 'PLANT001', selectedStation?.code || 'FP001'),
      plantCode: plant?.plantCode || 'PLANT001',
      stationCode: selectedStation?.code || 'FP001',
      processingMethod: selectedMethod?.code || 'STANDARD',
      temperature: selectedMethod?.temperatureRange.min || -18,
      processingTime: selectedMethod?.timeRange.min || 30,
      qualityChecks: [
        {
          checkType: 'Temperature',
          result: 'pass',
          value: selectedMethod?.temperatureRange.min || -18,
          unit: '°C',
          timestamp: currentDate.toISOString(),
          inspector: 'QC Inspector 1'
        },
        {
          checkType: 'Visual Inspection',
          result: 'pass',
          timestamp: currentDate.toISOString(),
          inspector: 'QC Inspector 1'
        }
      ]
    };

    return {
      // Basic Product Info
      productType: baseQRData.productType,
      grade: baseQRData.grade,
      weight: baseQRData.weight,
      boxNumber: baseQRData.boxNumber,
      lotId: baseQRData.lotId,
      batchNumber: baseQRData.batchNumber,

      // Plant Information
      plantName: plant.plantName,
      plantCode: plant.plantCode,
      plantLocation: `${plant.location.city}, ${plant.location.country}`,
      plantAddress: plant.location.address,

      // Station Information
      stationName: selectedStation.name,
      stationCode: selectedStation.code,
      stationLocation: selectedStation.location,

      // Processing Information
      processingMethod: selectedMethod.name,
      processingCode: selectedMethod.code,
      processingDescription: selectedMethod.description,
      processingCategory: selectedMethod.category,

      // Temperature & Time
      temperature: selectedMethod.temperatureRange.min,
      temperatureMax: selectedMethod.temperatureRange.max,
      temperatureUnit: selectedMethod.temperatureRange.unit,
      processingTime: selectedMethod.timeRange.min,
      processingTimeMax: selectedMethod.timeRange.max,
      processingTimeUnit: selectedMethod.timeRange.unit,

      // Regulatory Approvals
      haccpNumber: plant.approvals.haccp.number,
      haccpExpiry: plant.approvals.haccp.expiryDate,
      fdaNumber: plant.approvals.fda.number,
      fdaExpiry: plant.approvals.fda.expiryDate,
      iso22000Number: plant.approvals.iso22000.number,
      iso22000Expiry: plant.approvals.iso22000.expiryDate,
      halalNumber: plant.approvals.halal.number,
      halalExpiry: plant.approvals.halal.expiryDate,
      organicNumber: plant.approvals.organic.number,
      organicExpiry: plant.approvals.organic.expiryDate,

      // Timestamps
      processedDate: new Date().toLocaleDateString(),
      processedTime: new Date().toLocaleTimeString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),

      // Traceability
      traceabilityCode: baseQRData.traceabilityCode,
      rfidTag: baseQRData.rfidTag,

      // QR Code Data
      qrCodeData: JSON.stringify(baseQRData),
      qrDataFormatted: baseQRData,

      // Quality Information
      qualityGrade: baseQRData.grade,
      qualityStatus: 'PASSED',
      inspector: 'QC Inspector 1',

      // Custom fields from template
      companyName: 'ClamFlow Premium Seafood',
      companySlogan: 'Fresh Ocean Processing Co.',
      establishedYear: '2020',
      certificationBadge: 'HACCP Certified',

      // Dynamic calculated fields
      shelfLife: '12 months',
      storageInstructions: 'Keep Frozen at -18°C',
      netWeight: `${baseQRData.weight || baseQRData.product.weight} kg`,
      grossWeight: `${(baseQRData.weight || baseQRData.product.weight) + 0.5} kg`,

      ...previewData // Override with any custom preview data
    };
  };

  const generateQRCodes = async () => {
    if (!template) return;

    const data = generatePreviewData();
    const newQRCodes = new Map<string, string>();

    for (const field of template.fields) {
      if (field.type === 'qr') {
        try {
          const qrValue = getFieldValue(field, data);
          if (qrValue) {
            // AFTER:
const qrCodeBase64 = await QRCode.toDataURL(qrValue, {
  errorCorrectionLevel: 'H',
  type: 'image/png',
  margin: 1,
  width: 128
});
            newQRCodes.set(field.id, qrCodeBase64);
          }
        } catch (error) {
          console.error(`Failed to generate QR code for field ${field.id}:`, error);
        }
      }
    }

    setGeneratedQRCodes(newQRCodes);
  };

  const getFieldValue = (field: LabelField, data: any): string => {
    switch (field.dataSource) {
      case 'static':
        return field.value;

      case 'form':
        return data[field.name] || field.value || '';

      case 'plant':
        if (field.name.includes('plant_name') || field.name.includes('plantName')) return data.plantName || '';
        if (field.name.includes('plant_code') || field.name.includes('plantCode')) return data.plantCode || '';
        if (field.name.includes('plant_location') || field.name.includes('plantLocation')) return data.plantLocation || '';
        if (field.name.includes('plant_address') || field.name.includes('plantAddress')) return data.plantAddress || '';
        if (field.name.includes('station_name') || field.name.includes('stationName')) return data.stationName || '';
        if (field.name.includes('station_code') || field.name.includes('stationCode')) return data.stationCode || '';
        return field.value || '';

      case 'regulation':
        if (field.name.includes('haccp')) return data.haccpNumber || '';
        if (field.name.includes('fda')) return data.fdaNumber || '';
        if (field.name.includes('iso')) return data.iso22000Number || '';
        if (field.name.includes('halal')) return data.halalNumber || '';
        if (field.name.includes('organic')) return data.organicNumber || '';
        return field.value || '';

      case 'calculated':
        if (field.name.includes('traceability')) return data.traceabilityCode || '';
        if (field.name.includes('qr') || field.type === 'qr') return data.qrCodeData || '';
        if (field.name.includes('batch')) return data.batchNumber || '';
        if (field.name.includes('expiry')) return data.expiryDate || '';
        return field.value || '';

      default:
        return field.value || '';
    }
  };

  const getScaleFactors = () => {
    switch (previewSize) {
      case 'small': return { scale: 0.5, label: '50%' };
      case 'medium': return { scale: 1, label: '100%' };
      case 'large': return { scale: 1.5, label: '150%' };
      case 'actual': return { scale: 2, label: 'Actual Size' };
      default: return { scale: 1, label: '100%' };
    }
  };

  const exportPreview = () => {
    if (!template) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = template.layout.width;
    canvas.height = template.layout.height;

    // Fill background
    ctx.fillStyle = template.layout.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // This would need more implementation for proper canvas rendering
    // For now, we'll use a simpler approach
    const link = document.createElement('a');
    link.download = `${template.name}-preview.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const refreshPreview = () => {
    setRefreshKey(prev => prev + 1);
    onPreviewDataUpdate(generatePreviewData());
  };

  const currentData = generatePreviewData();
  const scaleInfo = getScaleFactors();

  return (
    <div className="label-preview-panel">
      <div className="preview-controls">
        <div className="controls-row">
          <div className="control-group">
            <label>Preview Size</label>
            <select 
              value={previewSize} 
              onChange={(e) => setPreviewSize(e.target.value as any)}
            >
              <option value="small">Small (50%)</option>
              <option value="medium">Medium (100%)</option>
              <option value="large">Large (150%)</option>
              <option value="actual">Actual Size (200%)</option>
            </select>
          </div>

          {plant && (
            <>
              <div className="control-group">
                <label>FP Station</label>
                <select 
                  value={selectedStation?.id || ''} 
                  onChange={(e) => setSelectedStation(plant.stations.find(s => s.id === e.target.value) || null)}
                >
                  {plant.stations.map(station => (
                    <option key={station.id} value={station.id}>
                      {station.name} ({station.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <label>Processing Method</label>
                <select 
                  value={selectedMethod?.id || ''} 
                  onChange={(e) => setSelectedMethod(plant.processingMethods.find(m => m.id === e.target.value) || null)}
                >
                  {plant.processingMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.name} ({method.code})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="control-actions">
            <button onClick={refreshPreview} className="refresh-btn" title="Refresh Preview">
              🔄 Refresh
            </button>
            <button onClick={exportPreview} className="export-btn" title="Export as Image">
              📸 Export
            </button>
            <button 
              onClick={() => setShowDataEditor(!showDataEditor)} 
              className="data-editor-btn"
              title="Edit Preview Data"
            >
              📝 Edit Data
            </button>
          </div>
        </div>

        {template && (
          <div className="template-info">
            <span className="info-item">Template: {template.name} v{template.version}</span>
            <span className="info-item">Size: {template.layout.width}×{template.layout.height} {template.layout.unit}</span>
            <span className="info-item">Fields: {template.fields.length}</span>
            <span className="info-item">Scale: {scaleInfo.label}</span>
          </div>
        )}
      </div>

      <div className="preview-content">
        {template && (
          <div className="preview-container">
            <div className="preview-ruler-container">
              <div className="ruler-horizontal">
                {Array.from({ length: Math.ceil(template.layout.width / 50) }, (_, i) => (
                  <div key={i} className="ruler-mark" style={{ left: i * 50 * scaleInfo.scale }}>
                    {i * 50}
                  </div>
                ))}
              </div>
              <div className="ruler-vertical">
                {Array.from({ length: Math.ceil(template.layout.height / 50) }, (_, i) => (
                  <div key={i} className="ruler-mark" style={{ top: i * 50 * scaleInfo.scale }}>
                    {i * 50}
                  </div>
                ))}
              </div>
            </div>

            <div 
              className="label-preview"
              style={{
                width: template.layout.width * scaleInfo.scale,
                height: template.layout.height * scaleInfo.scale,
                backgroundColor: template.layout.backgroundColor,
                border: template.layout.border,
                transform: `scale(1)`,
                transformOrigin: 'top left'
              }}
            >
              {template.fields.map(field => {
                const value = getFieldValue(field, currentData);

                return (
                  <div
                    key={field.id}
                    className={`preview-field field-${field.type}`}
                    style={{
                      position: 'absolute',
                      left: field.position.x * scaleInfo.scale,
                      top: field.position.y * scaleInfo.scale,
                      width: field.position.width * scaleInfo.scale,
                      height: field.position.height * scaleInfo.scale,
                      fontSize: field.style.fontSize * scaleInfo.scale,
                      fontWeight: field.style.fontWeight,
                      color: field.style.color,
                      backgroundColor: field.style.backgroundColor,
                      textAlign: field.style.textAlign,
                      border: field.style.border,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: field.style.textAlign === 'center' ? 'center' : 
                                   field.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
                      overflow: 'hidden'
                    }}
                    title={`${field.label}: ${value}`}
                  >
                    {field.type === 'qr' && generatedQRCodes.has(field.id) && (
                      <img 
                        src={generatedQRCodes.get(field.id)} 
                        alt="QR Code" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'contain' 
                        }} 
                      />
                    )}

                    {field.type === 'barcode' && (
                      <div className="barcode-placeholder" style={{ 
                        width: '100%', 
                        height: '60%', 
                        backgroundColor: '#000',
                        backgroundImage: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        fontSize: Math.max(8 * scaleInfo.scale, 8),
                        color: '#000',
                        paddingTop: '2px'
                      }}>
                        <span style={{ backgroundColor: '#fff', padding: '0 2px' }}>{value}</span>
                      </div>
                    )}

                    {field.type === 'logo' && (
                      <div className="logo-placeholder" style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f0f0f0',
                        border: '2px dashed #ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: Math.max(10 * scaleInfo.scale, 10),
                        color: '#666'
                      }}>
                        🖼️ Logo
                      </div>
                    )}

                    {field.type === 'date' && (
                      <span>
                        {field.name.includes('expiry') ? currentData.expiryDate :
                         field.name.includes('processed') ? currentData.processedDate :
                         value}
                      </span>
                    )}

                    {!['qr', 'barcode', 'logo', 'date'].includes(field.type) && (
                      <span>{value}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!template && (
          <div className="no-template-message">
            <h3>No Template Selected</h3>
            <p>Please select a template from the Template Editor to see the preview.</p>
          </div>
        )}
      </div>

      {showDataEditor && (
        <div className="data-editor-panel">
          <div className="data-editor-header">
            <h4>Preview Data Editor</h4>
            <button onClick={() => setShowDataEditor(false)} className="close-btn">
              ✕
            </button>
          </div>

          <div className="data-editor-content">
            <div className="data-sections">
              <div className="data-section">
                <h5>Product Information</h5>
                <div className="data-fields">
                  <label>
                    Product Type:
                    <input 
                      type="text" 
                      value={currentData.productType || ''} 
                      onChange={(e) => onPreviewDataUpdate({ ...currentData, productType: e.target.value })}
                    />
                  </label>
                  <label>
                    Grade:
                    <input 
                      type="text" 
                      value={currentData.grade || ''} 
                      onChange={(e) => onPreviewDataUpdate({ ...currentData, grade: e.target.value })}
                    />
                  </label>
                  <label>
                    Weight:
                    <input 
                      type="number" 
                      value={currentData.weight || ''} 
                      onChange={(e) => onPreviewDataUpdate({ ...currentData, weight: parseFloat(e.target.value) })}
                    />
                  </label>
                </div>
              </div>

              <div className="data-section">
                <h5>Traceability</h5>
                <div className="data-fields">
                  <label>
                    Lot ID:
                    <input 
                      type="text" 
                      value={currentData.lotId || ''} 
                      onChange={(e) => onPreviewDataUpdate({ ...currentData, lotId: e.target.value })}
                    />
                  </label>
                  <label>
                    Box Number:
                    <input 
                      type="text" 
                      value={currentData.boxNumber || ''} 
                      onChange={(e) => onPreviewDataUpdate({ ...currentData, boxNumber: e.target.value })}
                    />
                  </label>
                  <label>
                    Batch Number:
                    <input 
                      type="text" 
                      value={currentData.batchNumber || ''} 
                      onChange={(e) => onPreviewDataUpdate({ ...currentData, batchNumber: e.target.value })}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="raw-data-editor">
              <h5>Raw Data (JSON)</h5>
              <textarea
                value={JSON.stringify(currentData, null, 2)}
                onChange={(e) => {
                  try {
                    const parsedData = JSON.parse(e.target.value);
                    onPreviewDataUpdate(parsedData);
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={10}
                className="json-editor"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Functions
const generateTraceabilityCode = (plantCode: string, stationCode: string): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CF-${date}-${plantCode}-${stationCode}-${random}`;
};

export default LabelPreviewPanel;