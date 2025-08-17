import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LabelField, FieldType, DynamicDataSource } from '../../types/labelTypes';
import QRCode from 'qrcode';

interface FieldComponentProps {
  field: LabelField;
  data?: Record<string, any>;
  plantData?: Record<string, any>;
  isEditing?: boolean;
  isSelected?: boolean;
  scale?: number;
  readOnly?: boolean;
  snapToGrid?: boolean;
  onUpdate?: (field: LabelField) => void;
  onSelect?: (fieldId?: string) => void;
  onDelete?: (fieldId: string) => void;
  onDuplicate?: (fieldId: string) => void;
  onDragStart?: () => void;
  onDragEnd?: (newPosition: any) => void;
}

const FieldComponent: React.FC<FieldComponentProps> = ({
  field,
  data = {},
  plantData = {},
  isEditing = false,
  isSelected = false,
  scale = 1,
  onUpdate,
  onSelect,
  onDelete,
  onDuplicate
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isEditable, setIsEditable] = useState(false);
  const [editValue, setEditValue] = useState('');
  const fieldRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate field value based on data source
  const getFieldValue = useCallback((): string => {
    // Handle string dataSource (legacy)
    if (typeof field.dataSource === 'string') {
      return data[field.dataSource] || field.defaultValue || '';
    }

    // Handle object dataSource
    if (typeof field.dataSource === 'object' && field.dataSource?.type === 'static') {
      return field.defaultValue || '';
    }

    if (typeof field.dataSource === 'object' && field.dataSource?.type === 'form' && 'sourceKey' in field.dataSource && field.dataSource.sourceKey) {
      const dataSource = field.dataSource;
      const sourceKey = dataSource.sourceKey;
      return (sourceKey ? data[sourceKey] : undefined) || field.defaultValue || '';
    }

    if (typeof field.dataSource === 'object' && field.dataSource?.type === 'plant' && 'sourceKey' in field.dataSource && field.dataSource.sourceKey) {
      const dataSource = field.dataSource;
      const sourceKey = dataSource.sourceKey;
      return (sourceKey ? plantData[sourceKey] : undefined) || field.defaultValue || '';
    }

    if (typeof field.dataSource === 'object' && field.dataSource?.type === 'regulation' && 'sourceKey' in field.dataSource && field.dataSource.sourceKey) {
      const dataSource = field.dataSource;
      const regulations = plantData.approvals || [];
      const regulation = regulations.find((r: any) => r.type === dataSource.sourceKey);
      return regulation ? (dataSource.sourceKey === 'expiry' ? regulation.expiryDate : regulation.certificateNumber) : '';
    }

    if (typeof field.dataSource === 'object' && field.dataSource?.type === 'calculated' && 'formula' in field.dataSource && field.dataSource.formula) {
      try {
        // Simple formula evaluation - extend as needed
        const dataSource = field.dataSource;
        const formula = dataSource.formula;
        if (formula && formula.includes('${')) {
          let result = formula;
          // Replace placeholders with actual values
          result = result.replace(/\$\{([^}]+)\}/g, (match, key) => {
            return data[key] || plantData[key] || '';
          });
          return result;
        }
        return formula || '';
      } catch (error) {
        console.error('Formula calculation error:', error);
        return field.defaultValue || '';
      }
    }

    if (typeof field.dataSource === 'object' && field.dataSource?.type === 'dynamic' && 'sourceKey' in field.dataSource) {
      // Generate dynamic values based on field type
      const dataSource = field.dataSource;
      switch (dataSource.sourceKey) {
        case 'timestamp':
          return new Date().toISOString();
        case 'date':
          return new Date().toLocaleDateString();
        case 'time':
          return new Date().toLocaleTimeString();
        case 'batch_id':
          return `BATCH_${Date.now()}`;
        case 'qr_data':
          return JSON.stringify({
            plantId: plantData.id,
            batchId: data.batchId || `BATCH_${Date.now()}`,
            timestamp: new Date().toISOString(),
            station: data.station || 'FP001'
          });
        default:
          return field.defaultValue || '';
      }
    }

    return field.defaultValue || '';
  }, [field, data, plantData]);

  // Generate QR code for QR fields
  useEffect(() => {
    if (field.type === 'qr') {
      const value = getFieldValue();
      if (value) {
        QRCode.toDataURL(value, {
          width: field.position?.width || 100,
          margin: 1,
          color: {
            dark: field.style?.color || '#000000',
            light: field.style?.backgroundColor || '#FFFFFF'
          }
        }).then(setQrCodeUrl).catch(console.error);
      }
    }
  }, [field, getFieldValue]);

  // Handle field click
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing && onSelect) {
      onSelect(field.id);
    }
  }, [isEditing, onSelect, field.id]);

  // Handle double-click for editing
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing && field.type === 'text') {
      setIsEditable(true);
      setEditValue(getFieldValue());
    }
  }, [isEditing, field.type, getFieldValue]);

  // Handle inline editing
  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (onUpdate) {
        onUpdate({
          ...field,
          defaultValue: editValue
        });
      }
      setIsEditable(false);
    } else if (e.key === 'Escape') {
      setIsEditable(false);
      setEditValue('');
    }
  }, [editValue, field, onUpdate]);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditing) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - (field.position?.x || 0) * scale,
      y: e.clientY - (field.position?.y || 0) * scale
    });

    e.preventDefault();
  }, [isEditing, field.position?.x, field.position?.y, scale]);

  // Handle drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !isEditing || !onUpdate) return;

    const newX = Math.max(0, (e.clientX - dragStart.x) / scale);
    const newY = Math.max(0, (e.clientY - dragStart.y) / scale);

    onUpdate({
      ...field,
      x: Math.round(newX),
      y: Math.round(newY)
    });
  }, [isDragging, isEditing, dragStart, scale, field, onUpdate]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle context menu for field operations
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!isEditing) return;
    e.preventDefault();

    const contextMenu = document.createElement('div');
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.backgroundColor = 'white';
    contextMenu.style.border = '1px solid #ccc';
    contextMenu.style.borderRadius = '4px';
    contextMenu.style.padding = '8px';
    contextMenu.style.zIndex = '1000';
    contextMenu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

    const duplicateBtn = document.createElement('button');
    duplicateBtn.textContent = 'Duplicate';
    duplicateBtn.style.display = 'block';
    duplicateBtn.style.width = '100%';
    duplicateBtn.style.marginBottom = '4px';
    duplicateBtn.style.padding = '4px 8px';
    duplicateBtn.style.border = 'none';
    duplicateBtn.style.background = 'none';
    duplicateBtn.style.cursor = 'pointer';
    duplicateBtn.onclick = () => {
      if (onDuplicate) onDuplicate(field.id);
      document.body.removeChild(contextMenu);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.display = 'block';
    deleteBtn.style.width = '100%';
    deleteBtn.style.padding = '4px 8px';
    deleteBtn.style.border = 'none';
    deleteBtn.style.background = 'none';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.color = 'red';
    deleteBtn.onclick = () => {
      if (onDelete) onDelete(field.id);
      document.body.removeChild(contextMenu);
    };

    contextMenu.appendChild(duplicateBtn);
    contextMenu.appendChild(deleteBtn);
    document.body.appendChild(contextMenu);

    const closeMenu = (e: MouseEvent) => {
      if (!contextMenu.contains(e.target as Node)) {
        document.body.removeChild(contextMenu);
        document.removeEventListener('click', closeMenu);
      }
    };

    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }, [isEditing, field.id, onDuplicate, onDelete]);

  // Calculate field styles
  const fieldStyles: React.CSSProperties = {
    position: 'absolute',
    left: `${(field.position?.x || 0) * scale}px`,
    top: `${(field.position?.y || 0) * scale}px`,
    width: `${(field.position?.width || 100) * scale}px`,
    height: `${(field.position?.height || 30) * scale}px`,
    fontSize: `${(field.style?.fontSize || 12) * scale}px`,
    fontFamily: field.style?.fontFamily || 'Arial, sans-serif',
    fontWeight: field.style?.fontWeight || 'normal',
    color: field.style?.color || '#000000',
    backgroundColor: field.style?.backgroundColor || 'transparent',
    border: field.style?.border || (isEditing ? '1px dashed #ccc' : 'none'),
    borderRadius: field.style?.borderRadius || '0px',
    padding: `${(field.style?.padding || 2) * scale}px`,
    textAlign: (field.style?.textAlign as any) || 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: field.style?.textAlign === 'center' ? 'center' : field.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
    cursor: isEditing ? (isDragging ? 'grabbing' : 'grab') : 'default',
    outline: isSelected ? '2px solid #007bff' : 'none',
    boxSizing: 'border-box',
    userSelect: isEditing && !isEditable ? 'none' : 'auto'
  };

  // Render field content based on type
  const renderFieldContent = () => {
    const value = getFieldValue();

    switch (field.type) {
      case 'text':
        if (isEditable) {
          return (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={() => setIsEditable(false)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'transparent',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                color: 'inherit',
                textAlign: 'inherit'
              }}
              autoFocus
            />
          );
        }
        return <span>{value}</span>;

      case 'number':
        return <span>{value}</span>;

      case 'date':
        const dateValue = value ? new Date(value).toLocaleDateString() : '';
        return <span>{dateValue}</span>;

      case 'qr':
        return qrCodeUrl ? (
          <img 
            src={qrCodeUrl} 
            alt="QR Code"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain' 
            }}
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#f0f0f0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '10px',
            color: '#666'
          }}>
            QR
          </div>
        );

      case 'barcode':
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#000', 
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, #000 2px, #000 4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            color: '#000',
            fontSize: '8px'
          }}>
            {value}
          </div>
        );

      case 'logo':
        return field.imageUrl ? (
          <img 
            src={field.imageUrl} 
            alt="Logo"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain' 
            }}
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#f0f0f0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '10px',
            color: '#666'
          }}>
            LOGO
          </div>
        );

      case 'dynamic':
        return <span>{value}</span>;

      default:
        return <span>{value}</span>;
    }
  };

  return (
    <div
      ref={fieldRef}
      style={fieldStyles}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      title={isEditing ? `${field.label} (${field.type})` : undefined}
    >
      {renderFieldContent()}

      {/* Resize handles for editing mode */}
      {isEditing && isSelected && !isEditable && (
        <>
          <div
            style={{
              position: 'absolute',
              right: '-3px',
              bottom: '-3px',
              width: '6px',
              height: '6px',
              backgroundColor: '#007bff',
              cursor: 'se-resize'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              // Handle resize logic here
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '-3px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '6px',
              height: '6px',
              backgroundColor: '#007bff',
              cursor: 'e-resize'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              // Handle resize logic here
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-3px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '6px',
              height: '6px',
              backgroundColor: '#007bff',
              cursor: 's-resize'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              // Handle resize logic here
            }}
          />
        </>
      )}
    </div>
  );
};

export { FieldComponent };
export default FieldComponent;