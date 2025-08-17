// /QC_Flow/components/label-system/PlantConfigurationEditor.tsx
// Plant Configuration Editor Component
import React, { useState, useEffect } from 'react';
import { 
  PlantConfiguration, 
  ProcessingMethod, 
  FPStation, 
  ApprovalDetail,
  Equipment,
  ProcessingParameter
} from '../../types/labelTypes';

interface PlantConfigurationEditorProps {
  plants: PlantConfiguration[];
  selectedPlant: PlantConfiguration | null;
  onPlantSelect: (plant: PlantConfiguration) => void;
  onPlantUpdate: () => void;
  readOnly?: boolean;
}

export const PlantConfigurationEditor: React.FC<PlantConfigurationEditorProps> = ({
  plants,
  selectedPlant,
  onPlantSelect,
  onPlantUpdate,
  readOnly = false
}) => {
  const [editingPlant, setEditingPlant] = useState<PlantConfiguration | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'approvals' | 'methods' | 'stations'>('basic');
  const [showAddModal, setShowAddModal] = useState<'method' | 'station' | 'equipment' | null>(null);

  useEffect(() => {
    if (selectedPlant && !editingPlant) {
      setEditingPlant({ ...selectedPlant });
    }
  }, [selectedPlant]);

  const createNewPlant = () => {
    if (readOnly) return;

    const newPlant: PlantConfiguration = {
      id: generateUUID(),
      plantName: 'New Processing Plant',
      plantCode: 'NPP001',
      location: {
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        coordinates: { latitude: 0, longitude: 0 }
      },
      approvals: {
        haccp: { number: '', expiryDate: '', issuer: '', status: 'pending' },
        fda: { number: '', expiryDate: '', issuer: '', status: 'pending' },
        iso22000: { number: '', expiryDate: '', issuer: '', status: 'pending' },
        halal: { number: '', expiryDate: '', issuer: '', status: 'pending' },
        organic: { number: '', expiryDate: '', issuer: '', status: 'pending' },
        custom: []
      },
      processingMethods: [],
      stations: [],
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEditingPlant(newPlant);
  };

  const savePlant = async () => {
    if (!editingPlant || readOnly) return;

    try {
      const plantAPI = await import('../../services/plantConfigAPI');
      const response = await plantAPI.default.savePlantConfiguration({
        ...editingPlant,
        updatedAt: new Date().toISOString()
      });

      onPlantUpdate();
      setEditingPlant(null);
    } catch (error) {
      console.error('Failed to save plant configuration:', error);
      alert('Failed to save plant configuration. Please try again.');
    }
  };

  const deletePlant = async (plantId: string) => {
    if (readOnly) return;

    if (!confirm('Are you sure you want to delete this plant configuration?')) return;

    try {
      const plantAPI = await import('../../services/plantConfigAPI');
      await plantAPI.default.deletePlantConfiguration(plantId);
      onPlantUpdate();
      if (editingPlant?.id === plantId) {
        setEditingPlant(null);
      }
    } catch (error) {
      console.error('Failed to delete plant configuration:', error);
      alert('Failed to delete plant configuration.');
    }
  };

  const addProcessingMethod = () => {
    if (!editingPlant || readOnly) return;

    const newMethod: ProcessingMethod = {
      id: generateUUID(),
      name: 'New Processing Method',
      code: `PM${Date.now().toString().slice(-4)}`,
      description: '',
      category: 'other',
      temperatureRange: { min: -20, max: 4, unit: 'celsius', tolerance: 1 },
      timeRange: { min: 30, max: 240, unit: 'minutes' },
      equipment: [],
      certifications: [],
      parameters: []
    };

    setEditingPlant({
      ...editingPlant,
      processingMethods: [...editingPlant.processingMethods, newMethod]
    });
  };

  const updateProcessingMethod = (methodId: string, updates: Partial<ProcessingMethod>) => {
    if (!editingPlant || readOnly) return;

    setEditingPlant({
      ...editingPlant,
      processingMethods: editingPlant.processingMethods.map(method =>
        method.id === methodId ? { ...method, ...updates } : method
      )
    });
  };

  const removeProcessingMethod = (methodId: string) => {
    if (!editingPlant || readOnly) return;

    setEditingPlant({
      ...editingPlant,
      processingMethods: editingPlant.processingMethods.filter(method => method.id !== methodId)
    });
  };

  const addFPStation = () => {
    if (!editingPlant || readOnly) return;

    const newStation: FPStation = {
      id: generateUUID(),
      name: 'New FP Station',
      code: `FPS${Date.now().toString().slice(-4)}`,
      location: 'Production Floor',
      processingMethods: [],
      capacity: 100,
      isActive: true,
      equipment: [],
      staffAssignments: [],
      operatingHours: {
        monday: { start: '08:00', end: '17:00', active: true },
        tuesday: { start: '08:00', end: '17:00', active: true },
        wednesday: { start: '08:00', end: '17:00', active: true },
        thursday: { start: '08:00', end: '17:00', active: true },
        friday: { start: '08:00', end: '17:00', active: true },
        saturday: { start: '08:00', end: '12:00', active: false },
        sunday: { start: '08:00', end: '12:00', active: false }
      }
    };

    setEditingPlant({
      ...editingPlant,
      stations: [...editingPlant.stations, newStation]
    });
  };

  const updateFPStation = (stationId: string, updates: Partial<FPStation>) => {
    if (!editingPlant || readOnly) return;

    setEditingPlant({
      ...editingPlant,
      stations: editingPlant.stations.map(station =>
        station.id === stationId ? { ...station, ...updates } : station
      )
    });
  };

  const removeFPStation = (stationId: string) => {
    if (!editingPlant || readOnly) return;

    setEditingPlant({
      ...editingPlant,
      stations: editingPlant.stations.filter(station => station.id !== stationId)
    });
  };

  const addCustomApproval = () => {
    if (!editingPlant || readOnly) return;

    const newApproval: ApprovalDetail = {
      number: '',
      expiryDate: '',
      issuer: '',
      status: 'pending'
    };

    setEditingPlant({
      ...editingPlant,
      approvals: {
        ...editingPlant.approvals,
        custom: [...editingPlant.approvals.custom, newApproval]
      }
    });
  };

  return (
    <div className="plant-configuration-editor">
      <div className="plant-list">
        <div className="list-header">
          <h3>🏭 Processing Plants</h3>
          {!readOnly && (
            <button onClick={createNewPlant} className="create-btn">
              ➕ Add Plant
            </button>
          )}
        </div>

        <div className="plants-grid">
          {plants.map(plant => (
            <div 
              key={plant.id}
              className={`plant-card ${selectedPlant?.id === plant.id ? 'selected' : ''}`}
              onClick={() => onPlantSelect(plant)}
            >
              <div className="plant-header">
                <h4>{plant.plantName}</h4>
                <span className={`status ${plant.isActive ? 'active' : 'inactive'}`}>
                  {plant.isActive ? '🟢' : '⚫'}
                </span>
              </div>

              <div className="plant-info">
                <p><strong>Code:</strong> {plant.plantCode}</p>
                <p><strong>Location:</strong> {plant.location.city}, {plant.location.country}</p>
                <p><strong>Stations:</strong> {plant.stations.length}</p>
                <p><strong>Methods:</strong> {plant.processingMethods.length}</p>
              </div>

              <div className="plant-actions">
                {!readOnly && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPlant({ ...plant });
                      }}
                      className="edit-btn"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlant(plant.id);
                      }}
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingPlant && (
        <div className="plant-editor">
          <div className="editor-header">
            <h3>
              {plants.find(p => p.id === editingPlant.id) ? 'Edit Plant Configuration' : 'New Plant Configuration'}
            </h3>
            <div className="header-actions">
              {!readOnly && (
                <>
                  <button onClick={savePlant} className="save-btn">
                    💾 Save Plant
                  </button>
                  <button onClick={() => setEditingPlant(null)} className="cancel-btn">
                    ❌ Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="editor-tabs">
            <button 
              className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              📋 Basic Info
            </button>
            <button 
              className={`tab ${activeTab === 'approvals' ? 'active' : ''}`}
              onClick={() => setActiveTab('approvals')}
            >
              📜 Approvals
            </button>
            <button 
              className={`tab ${activeTab === 'methods' ? 'active' : ''}`}
              onClick={() => setActiveTab('methods')}
            >
              ⚙️ Processing Methods
            </button>
            <button 
              className={`tab ${activeTab === 'stations' ? 'active' : ''}`}
              onClick={() => setActiveTab('stations')}
            >
              🏢 FP Stations
            </button>
          </div>

          <div className="editor-content">
            {activeTab === 'basic' && (
              <BasicInfoTab 
                plant={editingPlant}
                onUpdate={setEditingPlant}
                readOnly={readOnly}
              />
            )}

            {activeTab === 'approvals' && (
              <ApprovalsTab 
                plant={editingPlant}
                onUpdate={setEditingPlant}
                onAddCustomApproval={addCustomApproval}
                readOnly={readOnly}
              />
            )}

            {activeTab === 'methods' && (
              <ProcessingMethodsTab 
                plant={editingPlant}
                onUpdate={setEditingPlant}
                onAdd={addProcessingMethod}
                onUpdateMethod={updateProcessingMethod}
                onRemoveMethod={removeProcessingMethod}
                readOnly={readOnly}
              />
            )}

            {activeTab === 'stations' && (
              <FPStationsTab 
                plant={editingPlant}
                onUpdate={setEditingPlant}
                onAdd={addFPStation}
                onUpdateStation={updateFPStation}
                onRemoveStation={removeFPStation}
                readOnly={readOnly}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Basic Info Tab Component
const BasicInfoTab: React.FC<{
  plant: PlantConfiguration;
  onUpdate: (plant: PlantConfiguration) => void;
  readOnly: boolean;
}> = ({ plant, onUpdate, readOnly }) => {
  return (
    <div className="basic-info-tab">
      <div className="form-section">
        <h4>Plant Information</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Plant Name</label>
            <input
              type="text"
              value={plant.plantName}
              onChange={(e) => onUpdate({ ...plant, plantName: e.target.value })}
              disabled={readOnly}
            />
          </div>

          <div className="form-group">
            <label>Plant Code</label>
            <input
              type="text"
              value={plant.plantCode}
              onChange={(e) => onUpdate({ ...plant, plantCode: e.target.value })}
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={plant.isActive}
              onChange={(e) => onUpdate({ ...plant, isActive: e.target.checked })}
              disabled={readOnly}
            />
            Active Plant
          </label>
        </div>
      </div>

      <div className="form-section">
        <h4>Location Details</h4>
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Address</label>
            <input
              type="text"
              value={plant.location.address}
              onChange={(e) => onUpdate({
                ...plant,
                location: { ...plant.location, address: e.target.value }
              })}
              disabled={readOnly}
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={plant.location.city}
              onChange={(e) => onUpdate({
                ...plant,
                location: { ...plant.location, city: e.target.value }
              })}
              disabled={readOnly}
            />
          </div>

          <div className="form-group">
            <label>State/Province</label>
            <input
              type="text"
              value={plant.location.state}
              onChange={(e) => onUpdate({
                ...plant,
                location: { ...plant.location, state: e.target.value }
              })}
              disabled={readOnly}
            />
          </div>

          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              value={plant.location.country}
              onChange={(e) => onUpdate({
                ...plant,
                location: { ...plant.location, country: e.target.value }
              })}
              disabled={readOnly}
            />
          </div>

          <div className="form-group">
            <label>ZIP Code</label>
            <input
              type="text"
              value={plant.location.zipCode}
              onChange={(e) => onUpdate({
                ...plant,
                location: { ...plant.location, zipCode: e.target.value }
              })}
              disabled={readOnly}
            />
          </div>
        </div>

        {plant.location.coordinates && (
          <div className="form-grid">
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={plant.location.coordinates.latitude}
                onChange={(e) => onUpdate({
                  ...plant,
                  location: {
                    ...plant.location,
                    coordinates: {
                      ...plant.location.coordinates!,
                      latitude: parseFloat(e.target.value)
                    }
                  }
                })}
                disabled={readOnly}
              />
            </div>

            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={plant.location.coordinates.longitude}
                onChange={(e) => onUpdate({
                  ...plant,
                  location: {
                    ...plant.location,
                    coordinates: {
                      ...plant.location.coordinates!,
                      longitude: parseFloat(e.target.value)
                    }
                  }
                })}
                disabled={readOnly}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Approvals Tab Component (continuing in next part due to length)
const ApprovalsTab: React.FC<{
  plant: PlantConfiguration;
  onUpdate: (plant: PlantConfiguration) => void;
  onAddCustomApproval: () => void;
  readOnly: boolean;
}> = ({ plant, onUpdate, onAddCustomApproval, readOnly }) => {
  const standardApprovals = ['haccp', 'fda', 'iso22000', 'halal', 'organic'] as const;

  const updateApproval = (type: keyof typeof plant.approvals, updates: Partial<ApprovalDetail>) => {
    if (type === 'custom') return; // Handle custom approvals separately

    onUpdate({
      ...plant,
      approvals: {
        ...plant.approvals,
        [type]: { ...plant.approvals[type], ...updates }
      }
    });
  };

  const updateCustomApproval = (index: number, updates: Partial<ApprovalDetail>) => {
    const updatedCustom = [...plant.approvals.custom];
    updatedCustom[index] = { ...updatedCustom[index], ...updates };

    onUpdate({
      ...plant,
      approvals: {
        ...plant.approvals,
        custom: updatedCustom
      }
    });
  };

  const removeCustomApproval = (index: number) => {
    onUpdate({
      ...plant,
      approvals: {
        ...plant.approvals,
        custom: plant.approvals.custom.filter((_, i) => i !== index)
      }
    });
  };

  return (
    <div className="approvals-tab">
      <div className="approvals-grid">
        {standardApprovals.map(approvalType => {
          const approval = plant.approvals[approvalType];
          const label = approvalType.toUpperCase();

          return (
            <div key={approvalType} className="approval-card">
              <div className="approval-header">
                <h4>{label} Certification</h4>
                <span className={`status ${approval.status}`}>
                  {approval.status}
                </span>
              </div>

              <div className="approval-fields">
                <div className="field-group">
                  <label>Approval Number</label>
                  <input
                    type="text"
                    placeholder="Enter approval number"
                    value={approval.number}
                    onChange={(e) => updateApproval(approvalType, { number: e.target.value })}
                    disabled={readOnly}
                  />
                </div>

                <div className="field-group">
                  <label>Issuing Authority</label>
                  <input
                    type="text"
                    placeholder="Enter issuing authority"
                    value={approval.issuer}
                    onChange={(e) => updateApproval(approvalType, { issuer: e.target.value })}
                    disabled={readOnly}
                  />
                </div>

                <div className="field-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={approval.expiryDate}
                    onChange={(e) => updateApproval(approvalType, { expiryDate: e.target.value })}
                    disabled={readOnly}
                  />
                </div>

                <div className="field-group">
                  <label>Status</label>
                  <select
                    value={approval.status}
                    onChange={(e) => updateApproval(approvalType, { status: e.target.value as any })}
                    disabled={readOnly}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="custom-approvals-section">
        <div className="section-header">
          <h4>Custom Approvals</h4>
          {!readOnly && (
            <button onClick={onAddCustomApproval} className="add-btn">
              ➕ Add Custom Approval
            </button>
          )}
        </div>

        {plant.approvals.custom.map((approval, index) => (
          <div key={index} className="custom-approval-card">
            <div className="approval-fields">
              <div className="field-group">
                <label>Approval Name</label>
                <input
                  type="text"
                  placeholder="e.g., BRC, SQF, etc."
                  value={approval.number} // Using number field for name in custom approvals
                  onChange={(e) => updateCustomApproval(index, { number: e.target.value })}
                  disabled={readOnly}
                />
              </div>

              <div className="field-group">
                <label>Certificate Number</label>
                <input
                  type="text"
                  placeholder="Certificate number"
                  value={approval.issuer} // Using issuer field for certificate number
                  onChange={(e) => updateCustomApproval(index, { issuer: e.target.value })}
                  disabled={readOnly}
                />
              </div>

              <div className="field-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={approval.expiryDate}
                  onChange={(e) => updateCustomApproval(index, { expiryDate: e.target.value })}
                  disabled={readOnly}
                />
              </div>

              <div className="field-group">
                <label>Status</label>
                <select
                  value={approval.status}
                  onChange={(e) => updateCustomApproval(index, { status: e.target.value as any })}
                  disabled={readOnly}
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {!readOnly && (
              <button 
                onClick={() => removeCustomApproval(index)}
                className="remove-btn"
              >
                🗑️ Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Processing Methods Tab (placeholder - would be implemented similarly)
const ProcessingMethodsTab: React.FC<any> = ({ plant, onAdd, readOnly }) => (
  <div className="processing-methods-tab">
    <div className="section-header">
      <h4>Processing Methods</h4>
      {!readOnly && <button onClick={onAdd} className="add-btn">➕ Add Method</button>}
    </div>
    <p>Processing methods configuration would be implemented here...</p>
  </div>
);

// FP Stations Tab (placeholder - would be implemented similarly)
const FPStationsTab: React.FC<any> = ({ plant, onAdd, readOnly }) => (
  <div className="fp-stations-tab">
    <div className="section-header">
      <h4>FP Stations</h4>
      {!readOnly && <button onClick={onAdd} className="add-btn">➕ Add Station</button>}
    </div>
    <p>FP stations configuration would be implemented here...</p>
  </div>
);

// Helper Functions
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};