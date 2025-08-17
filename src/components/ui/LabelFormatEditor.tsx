// /QC_Flow/components/label-system/LabelFormatEditor.tsx
// Main QR Label Format Editor Component
import React, { useState, useEffect } from 'react';
import { TemplateEditor } from './TemplateEditor';
import { PlantConfigurationEditor } from './PlantConfigurationEditor';
import { LabelPreviewPanel } from './LabelPreviewPanel';
import { 
  LabelTemplate, 
  PlantConfiguration, 
  LabelField, 
  FieldStyle, 
  FieldPosition 
} from '../../types/labelTypes';

interface LabelFormatEditorProps {
  initialTemplate?: LabelTemplate;
  initialPlant?: PlantConfiguration;
  onSave?: (template: LabelTemplate, plant: PlantConfiguration) => void;
  readOnly?: boolean;
}

export const LabelFormatEditor: React.FC<LabelFormatEditorProps> = ({
  initialTemplate,
  initialPlant,
  onSave,
  readOnly = false
}) => {
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<LabelTemplate | null>(initialTemplate || null);
  const [plants, setPlants] = useState<PlantConfiguration[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<PlantConfiguration | null>(initialPlant || null);
  const [editMode, setEditMode] = useState<'template' | 'plant' | 'preview'>('template');
  const [previewData, setPreviewData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTemplates(),
        loadPlantConfigurations()
      ]);
    } catch (err) {
      setError('Failed to load initial data');
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const labelAPI = await import('../../services/labelFormatAPI');
      const response = await labelAPI.default.getTemplates();
      const data = response.data || [];
      setTemplates(data);
      if (data.length > 0 && !activeTemplate) {
        setActiveTemplate(data.find(t => t.isActive) || data[0]);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      throw error;
    }
  };

  const loadPlantConfigurations = async () => {
    try {
      const plantAPI = await import('../../services/plantConfigAPI');
      const response = await plantAPI.default.getPlantConfigurations();
      const data = response.data || [];
      setPlants(data);
      if (data.length > 0 && !selectedPlant) {
        setSelectedPlant(data.find((p: any) => p.isActive) || data[0]);
      }
    } catch (error) {
      console.error('Failed to load plant configurations:', error);
      throw error;
    }
  };

  const createNewTemplate = () => {
    if (readOnly) return;

    const newTemplate: LabelTemplate = {
      id: generateUUID(),
      name: 'New Template',
      description: 'Custom label template',
      version: '1.0.0',
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: getDefaultFields(),
      layout: getDefaultLayout(),
      compliance: getDefaultCompliance()
    };

    setTemplates(prev => [...prev, newTemplate]);
    setActiveTemplate(newTemplate);
  };

  const updateTemplate = async (updatedTemplate: LabelTemplate) => {
    if (readOnly) return;

    try {
      const labelAPI = await import('../../services/labelFormatAPI');
      const response = await labelAPI.default.updateTemplate(updatedTemplate.id, {
        ...updatedTemplate,
        updatedAt: new Date().toISOString()
      });
      const updated = response.data;

      if (updated) {
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
        setActiveTemplate(updated);
      }
    } catch (error) {
      console.error('Failed to update template:', error);
      setError('Failed to update template');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (readOnly) return;

    try {
      const labelAPI = await import('../../services/labelFormatAPI');
      await labelAPI.default.deleteTemplate(templateId);

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      if (activeTemplate?.id === templateId) {
        setActiveTemplate(templates.find(t => t.id !== templateId) || null);
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      setError('Failed to delete template');
    }
  };

  const addField = (fieldType: string) => {
    if (!activeTemplate || readOnly) return;

    const newField: LabelField = {
      id: generateUUID(),
      name: `field_${Date.now()}`,
      type: fieldType as any,
      label: `New ${fieldType} Field`,
      value: getDefaultFieldValue(fieldType),
      position: getDefaultFieldPosition(),
      style: getDefaultFieldStyle(),
      required: false,
      editable: true,
      dataSource: 'static'
    };

    const updatedTemplate = {
      ...activeTemplate,
      fields: [...activeTemplate.fields, newField],
      updatedAt: new Date().toISOString()
    };

    setActiveTemplate(updatedTemplate);
  };

  const updateField = (fieldId: string, updates: Partial<LabelField>) => {
    if (!activeTemplate || readOnly) return;

    const updatedTemplate = {
      ...activeTemplate,
      fields: activeTemplate.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      ),
      updatedAt: new Date().toISOString()
    };

    setActiveTemplate(updatedTemplate);
  };

  const removeField = (fieldId: string) => {
    if (!activeTemplate || readOnly) return;

    const updatedTemplate = {
      ...activeTemplate,
      fields: activeTemplate.fields.filter(field => field.id !== fieldId),
      updatedAt: new Date().toISOString()
    };

    setActiveTemplate(updatedTemplate);
  };

  const duplicateField = (fieldId: string) => {
    if (!activeTemplate || readOnly) return;

    const fieldToDuplicate = activeTemplate.fields.find(f => f.id === fieldId);
    if (!fieldToDuplicate) return;

    const duplicatedField: LabelField = {
      ...fieldToDuplicate,
      id: generateUUID(),
      name: `${fieldToDuplicate.name}_copy`,
      position: {
        ...fieldToDuplicate.position,
        x: fieldToDuplicate.position.x + 20,
        y: fieldToDuplicate.position.y + 20
      }
    };

    const updatedTemplate = {
      ...activeTemplate,
      fields: [...activeTemplate.fields, duplicatedField],
      updatedAt: new Date().toISOString()
    };

    setActiveTemplate(updatedTemplate);
  };

  const handleSave = async () => {
    if (!activeTemplate || !selectedPlant || readOnly) return;

    try {
      await updateTemplate(activeTemplate);
      if (onSave) {
        onSave(activeTemplate, selectedPlant);
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setError('Failed to save changes');
    }
  };

  if (loading) {
    return (
      <div className="label-format-editor loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Label Format Editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="label-format-editor error">
        <div className="error-message">
          <h3>Error Loading Editor</h3>
          <p>{error}</p>
          <button onClick={loadInitialData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="label-format-editor">
      <div className="editor-header">
        <div className="header-content">
          <h1>🏷️ QR Label Format Editor</h1>
          <div className="header-info">
            {activeTemplate && (
              <span className="template-info">
                Template: {activeTemplate.name} v{activeTemplate.version}
              </span>
            )}
            {selectedPlant && (
              <span className="plant-info">
                Plant: {selectedPlant.plantName} ({selectedPlant.plantCode})
              </span>
            )}
          </div>
        </div>

        <div className="header-actions">
          {!readOnly && (
            <>
              <button onClick={handleSave} className="save-btn" disabled={!activeTemplate}>
                💾 Save Changes
              </button>
              <button onClick={createNewTemplate} className="create-btn">
                ➕ New Template
              </button>
            </>
          )}
          <button onClick={() => window.print()} className="print-btn">
            🖨️ Print Preview
          </button>
        </div>
      </div>

      <div className="editor-tabs">
        <button 
          className={`tab ${editMode === 'template' ? 'active' : ''}`}
          onClick={() => setEditMode('template')}
        >
          📝 Template Editor
        </button>
        <button 
          className={`tab ${editMode === 'plant' ? 'active' : ''}`}
          onClick={() => setEditMode('plant')}
        >
          🏭 Plant Configuration
        </button>
        <button 
          className={`tab ${editMode === 'preview' ? 'active' : ''}`}
          onClick={() => setEditMode('preview')}
        >
          👁️ Live Preview
        </button>
      </div>

      <div className="editor-content">
        {editMode === 'template' && (
          <TemplateEditor
            templates={templates}
            activeTemplate={activeTemplate}
            onTemplateSelect={setActiveTemplate}
            onTemplateUpdate={updateTemplate}
            onTemplateDelete={deleteTemplate}
            onCreateNew={createNewTemplate}
            onAddField={addField}
            onUpdateField={updateField}
            onRemoveField={removeField}
            onDuplicateField={duplicateField}
            readOnly={readOnly}
          />
        )}

        {editMode === 'plant' && (
          <PlantConfigurationEditor
            plants={plants}
            selectedPlant={selectedPlant}
            onPlantSelect={setSelectedPlant}
            onPlantUpdate={loadPlantConfigurations}
            readOnly={readOnly}
          />
        )}

        {editMode === 'preview' && (
          <LabelPreviewPanel
            template={activeTemplate}
            plant={selectedPlant}
            previewData={previewData}
            onPreviewDataUpdate={setPreviewData}
          />
        )}
      </div>

      <div className="editor-footer">
        <div className="footer-info">
          <span>Last saved: {activeTemplate?.updatedAt ? new Date(activeTemplate.updatedAt).toLocaleString() : 'Never'}</span>
          <span>Fields: {activeTemplate?.fields.length || 0}</span>
          <span>Status: {activeTemplate?.isActive ? 'Active' : 'Inactive'}</span>
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

const getDefaultFields = (): LabelField[] => [
  {
    id: generateUUID(),
    name: 'company_name',
    type: 'text',
    label: 'Company Name',
    value: 'ClamFlow Premium Seafood',
    position: { x: 10, y: 10, width: 200, height: 30 },
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000000',
      backgroundColor: 'transparent',
      border: 'none',
      textAlign: 'center'
    },
    required: true,
    editable: true,
    dataSource: 'static'
  },
  {
    id: generateUUID(),
    name: 'qr_code',
    type: 'qr',
    label: 'QR Code',
    value: '',
    position: { x: 300, y: 50, width: 100, height: 100 },
    style: {
      fontSize: 12,
      fontWeight: 'normal',
      color: '#000000',
      backgroundColor: 'transparent',
      border: 'none',
      textAlign: 'center'
    },
    required: true,
    editable: false,
    dataSource: 'calculated'
  }
];

const getDefaultLayout = () => ({
  width: 400,
  height: 600,
  unit: 'px' as const,
  orientation: 'portrait' as const,
  margin: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  },
  backgroundColor: '#ffffff',
  border: '1px solid #cccccc'
});

const getDefaultCompliance = () => ({
  haccp: true,
  fda: true,
  iso22000: false,
  halal: false,
  organic: false,
  customCompliance: []
});

const getDefaultFieldValue = (fieldType: string): string => {
  switch (fieldType) {
    case 'text': return 'Sample Text';
    case 'number': return '0';
    case 'date': return new Date().toISOString().split('T')[0];
    case 'qr': return '';
    case 'barcode': return '';
    case 'logo': return '';
    case 'dynamic': return '{{dynamic_value}}';
    default: return '';
  }
};

const getDefaultFieldPosition = (): FieldPosition => ({
  x: 10,
  y: 10,
  width: 100,
  height: 30,
  zIndex: 1
});

const getDefaultFieldStyle = (): FieldStyle => ({
  fontSize: 12,
  fontWeight: 'normal',
  color: '#000000',
  backgroundColor: 'transparent',
  border: 'none',
  textAlign: 'left'
});

export default LabelFormatEditor;