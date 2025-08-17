import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LabelTemplate, LabelField, PlantConfiguration, QRCodeData } from '../../types/labelTypes';
import { FieldComponent } from './FieldComponent';
import QRCode from 'qrcode';

interface QRLabelPreviewProps {
  template: LabelTemplate;
  plantConfig?: PlantConfiguration;
  formData?: Record<string, any>;
  stationData?: Record<string, any>;
  scale?: number;
  showGrid?: boolean;
  showRulers?: boolean;
  className?: string;
  onFieldClick?: (fieldId?: string) => void;
  onQRGenerated?: (qrData: string, qrUrl: string) => void;
}

const QRLabelPreview: React.FC<QRLabelPreviewProps> = ({
  template,
  plantConfig,
  formData = {},
  stationData = {},
  scale = 1,
  showGrid = false,
  showRulers = false,
  className = '',
  onFieldClick,
  onQRGenerated
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [labelDimensions, setLabelDimensions] = useState({ width: 0, height: 0 });
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate label dimensions based on template
  useEffect(() => {
    if (template.fields.length > 0) {
      const maxX = Math.max(...template.fields.map(f => (f.x || 0) + (f.width || 100)));
      const maxY = Math.max(...template.fields.map(f => (f.y || 0) + (f.height || 30)));
      setLabelDimensions({
        width: Math.max(maxX + 20, template.width || 400),
        height: Math.max(maxY + 20, template.height || 300)
      });
    } else {
      setLabelDimensions({
        width: template.width || 400,
        height: template.height || 300
      });
    }
  }, [template]);

  // Generate QR codes for QR fields
  const generateQRCodes = useCallback(async () => {
    setIsGenerating(true);
    const newQrUrls: Record<string, string> = {};

    try {
      for (const field of template.fields) {
        if (field.type === 'qr') {
          const qrData = generateQRData(field, plantConfig, formData, stationData);
          if (qrData) {
            const qrUrl = await QRCode.toDataURL(qrData, {
              width: (field.position?.width || 100) * scale,
              margin: 1,
              color: {
                dark: field.style?.color || '#000000',
                light: field.style?.backgroundColor || '#FFFFFF'
              },
              errorCorrectionLevel: 'M'
            });
            newQrUrls[field.id] = qrUrl;

            // Notify parent component
            if (onQRGenerated) {
              onQRGenerated(qrData, qrUrl);
            }
          }
        }
      }
      setQrCodeUrls(newQrUrls);
    } catch (error) {
      console.error('Error generating QR codes:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [template.fields, plantConfig, formData, stationData, scale, onQRGenerated]);

  // Generate QR data based on field configuration
  const generateQRData = (
    field: LabelField,
    plant?: PlantConfiguration,
    form?: Record<string, any>,
    station?: Record<string, any>
  ): string => {
    if (typeof field.dataSource === 'object' && field.dataSource?.type === 'static') {
      return field.defaultValue || '';
    }

    // Build comprehensive QR data object
    const qrDataObj: QRCodeData = {
      plantId: plant?.id || 'PLANT001',
      plantName: plant?.name || 'Default Plant',
      batchId: form?.batchId || station?.batchId || `BATCH_${Date.now()}`,
      timestamp: new Date().toISOString(),
      station: station?.stationId || form?.station || 'FP001',
      product: {
        type: form?.productType || 'Clam',
        weight: form?.weight || 0,
        grade: form?.grade || 'A',
        lotNumber: form?.lotNumber || `LOT_${Date.now()}`
      },
      processing: {
        method: station?.processingMethod || form?.processingMethod || 'Freezing',
        temperature: station?.temperature || form?.temperature,
        duration: station?.duration || form?.duration,
        operator: station?.operator || form?.operator || 'Unknown'
      },
      quality: {
        inspector: form?.inspector || 'QC001',
        checkDate: form?.checkDate || new Date().toISOString(),
        status: form?.qualityStatus || 'Approved',
        notes: form?.qualityNotes || ''
      },
      traceability: {
        sourceLocation: plant?.location?.coordinates || '',
        weightNoteId: form?.weightNoteId || station?.weightNoteId || `WN${Date.now()}`,
        receivalDate: form?.receivalDate || station?.receivalDate || new Date().toISOString(),
        supplier: form?.supplier || station?.supplier || 'Unknown Supplier',
        traceabilityCode: form?.traceabilityCode || generateTraceabilityCode(plant, form)
      },
      approvals: {
        haccp: plant?.approvals?.haccp?.status === 'active' ? plant.approvals.haccp.number : undefined,
        fda: plant?.approvals?.fda?.status === 'active' ? plant.approvals.fda.number : undefined,
        iso22000: plant?.approvals?.iso22000?.status === 'active' ? plant.approvals.iso22000.number : undefined,
        halal: plant?.approvals?.halal?.status === 'active' ? plant.approvals.halal.number : undefined,
        organic: plant?.approvals?.organic?.status === 'active' ? plant.approvals.organic.number : undefined,
      }
    };

    // Handle different data source types
    if (typeof field.dataSource !== 'object' || !field.dataSource) {
      return field.defaultValue || '';
    }

    switch (field.dataSource.type) {
      case 'form':
        if (field.dataSource.sourceKey) {
          return form?.[field.dataSource.sourceKey] || field.defaultValue || '';
        }
        break;
      case 'plant':
        if (field.dataSource.sourceKey) {
          return plant?.[field.dataSource.sourceKey as keyof PlantConfiguration] as string || field.defaultValue || '';
        }
        break;
      case 'regulation':
        if (field.dataSource.sourceKey && plant?.approvals) {
          // Handle approvals as object properties, not array
          const approvalType = field.dataSource.sourceKey.toLowerCase();
          let approval;
          
          switch (approvalType) {
            case 'haccp':
              approval = plant.approvals.haccp;
              break;
            case 'fda':
              approval = plant.approvals.fda;
              break;
            case 'iso22000':
              approval = plant.approvals.iso22000;
              break;
            case 'halal':
              approval = plant.approvals.halal;
              break;
            case 'organic':
              approval = plant.approvals.organic;
              break;
            default:
              approval = null;
          }
          
          return approval?.number || field.defaultValue || '';
        }
        break;
      case 'calculated':
        if (field.dataSource.formula) {
          return evaluateFormula(field.dataSource.formula, { ...form, ...station, plant });
        }
        break;
      case 'dynamic':
        switch (field.dataSource.sourceKey) {
          case 'comprehensive':
            return JSON.stringify(qrDataObj, null, 2);
          case 'minimal':
            return JSON.stringify({
              plantId: qrDataObj.plantId,
              batchId: qrDataObj.batchId,
              timestamp: qrDataObj.timestamp,
              traceabilityCode: qrDataObj.traceability?.traceabilityCode
            });
          case 'regulatory':
            return JSON.stringify({
              plantId: qrDataObj.plantId,
              approvals: qrDataObj.approvals,
              traceabilityCode: qrDataObj.traceability?.traceabilityCode
            });
          default:
            return JSON.stringify(qrDataObj);
        }
      default:
        return JSON.stringify(qrDataObj);
    }

    return field.defaultValue || JSON.stringify(qrDataObj);
  };

  // Generate traceability code
  const generateTraceabilityCode = (plant?: PlantConfiguration, form?: Record<string, any>): string => {
    const plantCode = plant?.id?.substring(0, 3).toUpperCase() || 'PLT';
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const batchCode = form?.batchId?.substring(-4) || Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${plantCode}-${dateCode}-${batchCode}`;
  };

  // Simple formula evaluator
  const evaluateFormula = (formula: string, data: Record<string, any>): string => {
    try {
      let result = formula;
      // Replace placeholders with actual values
      result = result.replace(/\$\{([^}]+)\}/g, (match, key) => {
        const keys = key.split('.');
        let value = data;
        for (const k of keys) {
          value = value?.[k];
        }
        return String(value || '');
      });
      return result;
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return formula;
    }
  };

  // Generate QR codes when dependencies change
  useEffect(() => {
    generateQRCodes();
  }, [generateQRCodes]);

  // Render grid overlay
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridSize = 20 * scale;
    const lines = [];

    // Vertical lines
    for (let x = 0; x <= labelDimensions.width * scale; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={labelDimensions.height * scale}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= labelDimensions.height * scale; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={labelDimensions.width * scale}
          y2={y}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        {lines}
      </svg>
    );
  };

  // Render rulers
  const renderRulers = () => {
    if (!showRulers) return null;

    const rulerHeight = 20;
    const rulerWidth = 20;
    const tickSize = 5;
    const majorTickInterval = 50 * scale;
    const minorTickInterval = 10 * scale;

    return (
      <>
        {/* Horizontal ruler */}
        <div
          style={{
            position: 'absolute',
            top: -rulerHeight,
            left: rulerWidth,
            width: labelDimensions.width * scale,
            height: rulerHeight,
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #dee2e6'
          }}
        >
          <svg width="100%" height="100%">
            {Array.from({ length: Math.ceil(labelDimensions.width * scale / minorTickInterval) }, (_, i) => {
              const x = i * minorTickInterval;
              const isMajor = i % (majorTickInterval / minorTickInterval) === 0;
              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={rulerHeight - (isMajor ? tickSize * 2 : tickSize)}
                    x2={x}
                    y2={rulerHeight}
                    stroke="#666"
                    strokeWidth={0.5}
                  />
                  {isMajor && (
                    <text
                      x={x}
                      y={rulerHeight - tickSize * 2 - 2}
                      fontSize="10"
                      textAnchor="middle"
                      fill="#666"
                    >
                      {Math.round(x / scale)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Vertical ruler */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: -rulerWidth,
            width: rulerWidth,
            height: labelDimensions.height * scale,
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #dee2e6'
          }}
        >
          <svg width="100%" height="100%">
            {Array.from({ length: Math.ceil(labelDimensions.height * scale / minorTickInterval) }, (_, i) => {
              const y = i * minorTickInterval;
              const isMajor = i % (majorTickInterval / minorTickInterval) === 0;
              return (
                <g key={i}>
                  <line
                    x1={rulerWidth - (isMajor ? tickSize * 2 : tickSize)}
                    y1={y}
                    x2={rulerWidth}
                    y2={y}
                    stroke="#666"
                    strokeWidth={0.5}
                  />
                  {isMajor && (
                    <text
                      x={rulerWidth - tickSize * 2 - 2}
                      y={y + 3}
                      fontSize="10"
                      textAnchor="middle"
                      fill="#666"
                      transform={`rotate(-90, ${rulerWidth - tickSize * 2 - 2}, ${y + 3})`}
                    >
                      {Math.round(y / scale)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Corner */}
        <div
          style={{
            position: 'absolute',
            top: -rulerHeight,
            left: -rulerWidth,
            width: rulerWidth,
            height: rulerHeight,
            backgroundColor: '#e9ecef',
            border: '1px solid #dee2e6'
          }}
        />
      </>
    );
  };

  const labelStyle: React.CSSProperties = {
    position: 'relative',
    width: labelDimensions.width * scale,
    height: labelDimensions.height * scale,
    backgroundColor: template.backgroundColor || '#ffffff',
    border: `1px solid ${template.borderColor || '#cccccc'}`,
    borderRadius: template.borderRadius || '0px',
    overflow: 'hidden',
    margin: showRulers ? '20px 0 0 20px' : '0'
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    padding: showRulers ? '20px' : '0'
  };

  return (
    <div className={`qr-label-preview ${className}`} style={containerStyle}>
      {renderRulers()}

      <div ref={canvasRef} style={labelStyle}>
        {renderGrid()}

        {/* Render fields */}
        {template.fields.map((field) => (
          <FieldComponent
            key={field.id}
            field={field}
            data={formData}
            plantData={plantConfig}
            scale={scale}
            isEditing={false}
            onSelect={onFieldClick ? (fieldId?: string) => {
              if (fieldId) onFieldClick(fieldId);
            } : undefined}
          />
        ))}

        {/* Loading overlay */}
        {isGenerating && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #007bff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 8px'
                }}
              />
              <div style={{ fontSize: '12px', color: '#666' }}>
                Generating QR Codes...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default QRLabelPreview;