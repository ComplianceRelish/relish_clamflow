// /QC_Flow/components/label-system/TemplateEditor.tsx
// Template Editor Component for Label Format Editor
import React, { useState, useRef, useEffect } from 'react';
import FieldComponent from './FieldComponent';
import { 
  LabelTemplate, 
  LabelField, 
  FieldType,
  DataSourceType
} from '../../types/labelTypes';

interface TemplateEditorProps {
  templates: LabelTemplate[];
  activeTemplate: LabelTemplate | null;
  onTemplateSelect: (template: LabelTemplate) => void;
  onTemplateUpdate: (template: LabelTemplate) => void;
  onTemplateDelete: (templateId: string) => void;
  onCreateNew: () => void;
  onAddField: (fieldType: string) => void;
  onUpdateField: (fieldId: string, updates: Partial<LabelField>) => void;
  onRemoveField: (fieldId: string) => void;
  onDuplicateField: (fieldId: string) => void;
  readOnly?: boolean;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  templates,
  activeTemplate,
  onTemplateSelect,
  onTemplateUpdate,
  onTemplateDelete,
  onCreateNew,
  onAddField,
  onUpdateField,
  onRemoveField,
  onDuplicateField,
  readOnly = false
}) => {
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  const fieldTypes = [
    { type: 'text', label: 'Text Field', icon: '📝', description: 'Static or dynamic text' },
    { type: 'number', label: 'Number', icon: '🔢', description: 'Numeric values' },
    { type: 'date', label: 'Date', icon: '📅', description: 'Date/time fields' },
    { type: 'qr', label: 'QR Code', icon: '⚡', description: 'QR code generation' },
    { type: 'barcode', label: 'Barcode', icon: '📊', description: 'Linear barcode' },
    { type: 'logo', label: 'Logo/Image', icon: '🖼️', description: 'Company logos' },
    { type: 'dynamic', label: 'Dynamic Data', icon: '🔄', description: 'Real-time data' }
  ];

  const dataSourceOptions: Array<{ value: DataSourceType; label: string; icon: string }> = [
    { value: 'static' as DataSourceType, label: 'Static Value', icon: '📌' },
    { value: 'form' as DataSourceType, label: 'Form Data', icon: '📋' },
    { value: 'plant' as DataSourceType, label: 'Plant Configuration', icon: '🏭' },
    { value: 'regulation' as DataSourceType, label: 'Regulatory Data', icon: '📋' },
    { value: 'calculated' as DataSourceType, label: 'Calculated Value', icon: '🧮' }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedField && !readOnly) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          onRemoveField(selectedField);
          setSelectedField(null);
        } else if (e.key === 'c' && e.ctrlKey) {
          onDuplicateField(selectedField);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedField, onRemoveField, onDuplicateField, readOnly]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedField(null);
    }
  };

  const handleFieldDragEnd = (fieldId: string, newPosition: { x: number; y: number }) => {
    if (readOnly) return;

    let position = newPosition;
    if (snapToGrid) {
      position = {
        x: Math.round(newPosition.x / 10) * 10,
        y: Math.round(newPosition.y / 10) * 10
      };
    }

    onUpdateField(fieldId, { position: { ...activeTemplate?.fields.find(f => f.id === fieldId)?.position!, ...position } });
  };

  const handleLayoutUpdate = (updates: Partial<LabelTemplate['layout']>) => {
    if (!activeTemplate || readOnly) return;

    onTemplateUpdate({
      ...activeTemplate,
      layout: { ...activeTemplate.layout, ...updates }
    });
  };

  const handleTemplateMetaUpdate = (updates: Partial<Pick<LabelTemplate, 'name' | 'description' | 'version' | 'isActive'>>) => {
    if (!activeTemplate || readOnly) return;

    onTemplateUpdate({
      ...activeTemplate,
      ...updates
    });
  };

  const duplicateTemplate = () => {
    if (!activeTemplate || readOnly) return;

    const duplicated: LabelTemplate = {
      ...activeTemplate,
      id: generateUUID(),
      name: `${activeTemplate.name} Copy`,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: activeTemplate.fields.map(field => ({
        ...field,
        id: generateUUID()
      }))
    };

    onCreateNew();
    // The parent component should handle adding the template
  };

  const exportTemplate = () => {
    if (!activeTemplate) return;

    const dataStr = JSON.stringify(activeTemplate, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${activeTemplate.name.replace(/\s+/g, '_')}_template.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="template-editor">
      <div className="template-sidebar">
        {/* Template List */}
        <div className="template-list-section">
          <div className="section-header">
            <h3>📋 Templates</h3>
            {!readOnly && (
              <button onClick={onCreateNew} className="create-btn" title="Create New Template">
                ➕
              </button>
            )}
          </div>

          <div className="template-list">
            {templates.map(template => (
              <div 
                key={template.id}
                className={`template-item ${activeTemplate?.id === template.id ? 'active' : ''}`}
                onClick={() => onTemplateSelect(template)}
              >
                <div className="template-info">
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <div className="template-meta">
                    <span className="version">v{template.version}</span>
                    <span className={`status ${template.isActive ? 'active' : 'inactive'}`}>
                      {template.isActive ? '🟢 Active' : '⚫ Inactive'}
                    </span>
                  </div>
                </div>
                {!readOnly && (
                  <div className="template-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete template "${template.name}"?`)) {
                          onTemplateDelete(template.id);
                        }
                      }}
                      className="delete-btn"
                      title="Delete Template"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Field Types Toolbox */}
        {!readOnly && (
          <div className="field-toolbox">
            <h3>🔧 Field Types</h3>
            <div className="field-types-grid">
              {fieldTypes.map(fieldType => (
                <button
                  key={fieldType.type}
                  className="field-type-btn"
                  onClick={() => onAddField(fieldType.type)}
                  title={fieldType.description}
                  disabled={readOnly}
                >
                  <span className="field-icon">{fieldType.icon}</span>
                  <span className="field-label">{fieldType.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas Controls */}
        <div className="canvas-controls">
          <h3>🎛️ Canvas Controls</h3>
          <div className="control-group">
            <label>Scale: {Math.round(canvasScale * 100)}%</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={canvasScale}
              onChange={(e) => setCanvasScale(parseFloat(e.target.value))}
              className="scale-slider"
            />
          </div>

          <div className="control-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              Show Grid
            </label>
          </div>

          <div className="control-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
              />
              Snap to Grid
            </label>
          </div>
        </div>
      </div>

      <div className="template-canvas-area">
        {activeTemplate && (
          <>
            {/* Canvas Header */}
            <div className="canvas-header">
              <div className="template-details">
                <div className="detail-group">
                  <label>Template Name</label>
                  <input
                    type="text"
                    value={activeTemplate.name}
                    onChange={(e) => handleTemplateMetaUpdate({ name: e.target.value })}
                    className="template-name-input"
                    disabled={readOnly}
                  />
                </div>

                <div className="detail-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={activeTemplate.description}
                    onChange={(e) => handleTemplateMetaUpdate({ description: e.target.value })}
                    className="template-description-input"
                    placeholder="Template description"
                    disabled={readOnly}
                  />
                </div>

                <div className="detail-group">
                  <label>Version</label>
                  <input
                    type="text"
                    value={activeTemplate.version}
                    onChange={(e) => handleTemplateMetaUpdate({ version: e.target.value })}
                    className="template-version-input"
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="canvas-actions">
                {!readOnly && (
                  <>
                    <button 
                      onClick={() => handleTemplateMetaUpdate({ isActive: !activeTemplate.isActive })}
                      className={`toggle-active-btn ${activeTemplate.isActive ? 'active' : 'inactive'}`}
                    >
                      {activeTemplate.isActive ? '🟢 Active' : '⚫ Activate'}
                    </button>
                    <button onClick={duplicateTemplate} className="duplicate-btn">
                      📋 Duplicate
                    </button>
                  </>
                )}
                <button onClick={exportTemplate} className="export-btn">
                  📤 Export
                </button>
              </div>
            </div>

            {/* Layout Controls */}
            <div className="layout-controls">
              <div className="control-group">
                <label>Width</label>
                <input
                  type="number"
                  value={activeTemplate.layout.width}
                  onChange={(e) => handleLayoutUpdate({ width: parseInt(e.target.value) })}
                  disabled={readOnly}
                />
              </div>

              <div className="control-group">
                <label>Height</label>
                <input
                  type="number"
                  value={activeTemplate.layout.height}
                  onChange={(e) => handleLayoutUpdate({ height: parseInt(e.target.value) })}
                  disabled={readOnly}
                />
              </div>

              <div className="control-group">
                <label>Unit</label>
                <select
                  value={activeTemplate.layout.unit}
                  onChange={(e) => handleLayoutUpdate({ unit: e.target.value as any })}
                  disabled={readOnly}
                >
                  <option value="px">Pixels</option>
                  <option value="mm">Millimeters</option>
                  <option value="inch">Inches</option>
                </select>
              </div>

              <div className="control-group">
                <label>Orientation</label>
                <select
                  value={activeTemplate.layout.orientation}
                  onChange={(e) => handleLayoutUpdate({ orientation: e.target.value as any })}
                  disabled={readOnly}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            {/* Canvas */}
            <div className="label-canvas-container">
              <div className="canvas-rulers">
                <div className="ruler ruler-horizontal"></div>
                <div className="ruler ruler-vertical"></div>
              </div>

              <div 
                ref={canvasRef}
                className={`label-canvas ${showGrid ? 'show-grid' : ''}`}
                style={{ 
                  transform: `scale(${canvasScale})`,
                  transformOrigin: 'top left',
                  width: activeTemplate.layout.width,
                  height: activeTemplate.layout.height,
                  backgroundColor: activeTemplate.layout.backgroundColor,
                  border: activeTemplate.layout.border
                }}
                onClick={handleCanvasClick}
              >
                {activeTemplate.fields.map(field => (
                  <FieldComponent
                    key={field.id}
                    field={field}
                    isSelected={selectedField === field.id}
                    onSelect={() => setSelectedField(field.id)}
                    onUpdate={(updates) => onUpdateField(field.id, updates)}
                    onDelete={() => onRemoveField(field.id)}
                    onDuplicate={() => onDuplicateField(field.id)}
                    onDragStart={() => setDraggedField(field.id)}
                    onDragEnd={(newPosition) => handleFieldDragEnd(field.id, newPosition)}
                    readOnly={readOnly}
                    snapToGrid={snapToGrid}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {!activeTemplate && (
          <div className="no-template-selected">
            <h3>No Template Selected</h3>
            <p>Select a template from the sidebar or create a new one to get started.</p>
            {!readOnly && (
              <button onClick={onCreateNew} className="create-new-btn">
                ➕ Create New Template
              </button>
            )}
          </div>
        )}
      </div>

      {/* Properties Panel */}
      {selectedField && activeTemplate && (
        <div className="properties-panel">
          <FieldPropertiesPanel
            field={activeTemplate.fields.find(f => f.id === selectedField)!}
            onUpdate={(updates) => onUpdateField(selectedField, updates)}
            dataSourceOptions={dataSourceOptions}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  );
};

// Field Properties Panel Component
const FieldPropertiesPanel: React.FC<{
  field: LabelField;
  onUpdate: (updates: Partial<LabelField>) => void;
  dataSourceOptions: Array<{ value: DataSourceType; label: string; icon: string }>;
  readOnly: boolean;
}> = ({ field, onUpdate, dataSourceOptions, readOnly }) => {
  return (
    <div className="field-properties">
      <h3>🎨 Field Properties</h3>

      {/* Basic Properties */}
      <div className="property-section">
        <h4>Basic</h4>

        <div className="property-group">
          <label>Field Name</label>
          <input
            type="text"
            value={field.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            disabled={readOnly}
          />
        </div>

        <div className="property-group">
          <label>Label</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            disabled={readOnly}
          />
        </div>

        <div className="property-group">
          <label>Value</label>
          <textarea
            value={field.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            rows={3}
            disabled={readOnly || field.type === 'qr' || field.type === 'barcode'}
          />
        </div>

        <div className="property-group">
          <label>Data Source</label>
          <select
            value={typeof field.dataSource === 'string' ? field.dataSource : field.dataSource?.type || 'static'}
            onChange={(e) => onUpdate({ dataSource: e.target.value as DataSourceType })}
            disabled={readOnly}
          >
            {dataSourceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Position & Size */}
      <div className="property-section">
        <h4>Position & Size</h4>

        <div className="property-grid">
          <div className="property-group">
            <label>X</label>
            <input
              type="number"
              value={field.position.x}
              onChange={(e) => onUpdate({ 
                position: { ...field.position, x: parseInt(e.target.value) }
              })}
              disabled={readOnly}
            />
          </div>

          <div className="property-group">
            <label>Y</label>
            <input
              type="number"
              value={field.position.y}
              onChange={(e) => onUpdate({ 
                position: { ...field.position, y: parseInt(e.target.value) }
              })}
              disabled={readOnly}
            />
          </div>

          <div className="property-group">
            <label>Width</label>
            <input
              type="number"
              value={field.position.width}
              onChange={(e) => onUpdate({ 
                position: { ...field.position, width: parseInt(e.target.value) }
              })}
              disabled={readOnly}
            />
          </div>

          <div className="property-group">
            <label>Height</label>
            <input
              type="number"
              value={field.position.height}
              onChange={(e) => onUpdate({ 
                position: { ...field.position, height: parseInt(e.target.value) }
              })}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Style Properties */}
      <div className="property-section">
        <h4>Style</h4>

        <div className="property-group">
          <label>Font Size</label>
          <input
            type="number"
            value={field.style.fontSize}
            onChange={(e) => onUpdate({ 
              style: { ...field.style, fontSize: parseInt(e.target.value) }
            })}
            disabled={readOnly}
          />
        </div>

        <div className="property-group">
          <label>Font Weight</label>
          <select
            value={field.style.fontWeight}
            onChange={(e) => onUpdate({ 
              style: { ...field.style, fontWeight: e.target.value as any }
            })}
            disabled={readOnly}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="lighter">Lighter</option>
          </select>
        </div>

        <div className="property-group">
          <label>Text Color</label>
          <input
            type="color"
            value={field.style.color}
            onChange={(e) => onUpdate({ 
              style: { ...field.style, color: e.target.value }
            })}
            disabled={readOnly}
          />
        </div>

        <div className="property-group">
          <label>Background Color</label>
          <input
            type="color"
            value={field.style.backgroundColor === 'transparent' ? '#ffffff' : field.style.backgroundColor}
            onChange={(e) => onUpdate({ 
              style: { ...field.style, backgroundColor: e.target.value }
            })}
            disabled={readOnly}
          />
        </div>

        <div className="property-group">
          <label>Text Align</label>
          <select
            value={field.style.textAlign}
            onChange={(e) => onUpdate({ 
              style: { ...field.style, textAlign: e.target.value as any }
            })}
            disabled={readOnly}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      {/* Field Options */}
      <div className="property-section">
        <h4>Options</h4>

        <div className="property-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              disabled={readOnly}
            />
            Required Field
          </label>
        </div>

        <div className="property-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={field.editable}
              onChange={(e) => onUpdate({ editable: e.target.checked })}
              disabled={readOnly}
            />
            Editable
          </label>
        </div>
      </div>
    </div>
  );
};

// Helper Functions
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default TemplateEditor;