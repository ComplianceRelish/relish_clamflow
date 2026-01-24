import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';

// Use environment variable for API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflow-backend-production.up.railway.app';

interface PassiveDetectionCamera {
  id: string;
  location: string;
  status: 'active' | 'inactive' | 'error';
  assignedMonitors: string[];
  detectionZone: string;
}

interface PassiveDetectionMonitor {
  id: string;
  name: string;
  location: string;
  displaySettings: {
    position: string;
    labelStyle: string;
    updateFrequency: number;
  };
}

export const PassiveDetect: React.FC = () => {
  const [cameras, setCameras] = useState<PassiveDetectionCamera[]>([]);
  const [monitors, setMonitors] = useState<PassiveDetectionMonitor[]>([]);
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [showAddMonitor, setShowAddMonitor] = useState(false);

  const [newCamera, setNewCamera] = useState({
    location: '',
    detectionZone: '',
    confidenceThreshold: 0.75
  });

  const [newMonitor, setNewMonitor] = useState({
    name: '',
    location: '',
    position: 'top-right',
    labelStyle: 'name_designation',
    updateFrequency: 1000
  });

  useEffect(() => {
    loadPassiveDetectionConfig();
  }, []);

  const loadPassiveDetectionConfig = async () => {
    try {
      const token = localStorage.getItem('clamflow_token');
      
      // Load cameras
      const camerasResponse = await fetch(`${API_BASE_URL}/admin/hardware/passive-detection/cameras`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (camerasResponse.ok) {
        const camerasData = await camerasResponse.json();
        setCameras(camerasData);
      }

      // Load monitors  
      const monitorsResponse = await fetch(`${API_BASE_URL}/admin/hardware/passive-detection/monitors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (monitorsResponse.ok) {
        const monitorsData = await monitorsResponse.json();
        setMonitors(monitorsData);
      }

    } catch (error) {
      console.error('Failed to load passive detection config:', error);
    }
  };

  const addCamera = async () => {
    try {
      const token = localStorage.getItem('clamflow_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/hardware/passive-detection/cameras`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: newCamera.location,
          camera_type: 'passive_detection',
          detection_zone: newCamera.detectionZone,
          settings: {
            detection_interval: 2,
            confidence_threshold: newCamera.confidenceThreshold,
            display_duration: 10,
            enable_unknown_alert: true
          }
        })
      });

      if (response.ok) {
        loadPassiveDetectionConfig();
        setShowAddCamera(false);
        setNewCamera({ location: '', detectionZone: '', confidenceThreshold: 0.75 });
      }
    } catch (error) {
      console.error('Failed to add camera:', error);
    }
  };

  const addMonitor = async () => {
    try {
      const token = localStorage.getItem('clamflow_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/hardware/passive-detection/monitors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newMonitor.name,
          location: newMonitor.location,
          display_settings: {
            position: newMonitor.position,
            label_style: newMonitor.labelStyle,
            update_frequency: newMonitor.updateFrequency
          }
        })
      });

      if (response.ok) {
        loadPassiveDetectionConfig();
        setShowAddMonitor(false);
        setNewMonitor({
          name: '',
          location: '',
          position: 'top-right',
          labelStyle: 'name_designation',
          updateFrequency: 1000
        });
      }
    } catch (error) {
      console.error('Failed to add monitor:', error);
    }
  };

  const assignMonitorToCamera = async (cameraId: string, monitorId: string) => {
    try {
      const token = localStorage.getItem('clamflow_token');
      
      await fetch(`${API_BASE_URL}/admin/hardware/passive-detection/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          camera_id: cameraId,
          monitor_id: monitorId
        })
      });

      loadPassiveDetectionConfig();
    } catch (error) {
      console.error('Failed to assign monitor:', error);
    }
  };

  return (
    <div className="passive-detection-config">
      <div className="config-header">
        <h2>🎯 Passive Detection System</h2>
        <p>Configure cameras for personnel identification and monitor display</p>
      </div>

      {/* Cameras Section */}
      <Card className="cameras-section">
        <div className="section-header">
          <h3>📹 Detection Cameras</h3>
          <Button onClick={() => setShowAddCamera(true)}>
            ➕ Add Camera
          </Button>
        </div>

        <div className="cameras-grid">
          {cameras.map(camera => (
            <div key={camera.id} className="camera-card">
              <div className="camera-info">
                <h4>{camera.location}</h4>
                <div className={`status-badge ${camera.status}`}>
                  {camera.status}
                </div>
              </div>
              
              <div className="camera-details">
                <p><strong>Zone:</strong> {camera.detectionZone}</p>
                <p><strong>Monitors:</strong> {camera.assignedMonitors.length}</p>
              </div>

              <div className="monitor-assignment">
                <Label>Assign Monitor:</Label>
                <Select
  onChange={(e) => assignMonitorToCamera(camera.id, e.target.value)}
                >
                  <option value="">Select Monitor...</option>
                  {monitors.map(monitor => (
                    <option key={monitor.id} value={monitor.id}>
                      {monitor.name} - {monitor.location}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ))}
        </div>

        {showAddCamera && (
          <div className="add-camera-form">
            <h4>Add New Detection Camera</h4>
            
            <div className="form-grid">
              <div>
                <Label>Camera Location</Label>
                <Input
                  value={newCamera.location}
                  onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
                  placeholder="e.g., Main Production Area"
                />
              </div>

              <div>
                <Label>Detection Zone</Label>
                <Input
                  value={newCamera.detectionZone}
                  onChange={(e) => setNewCamera({ ...newCamera, detectionZone: e.target.value })}
                  placeholder="e.g., Entry Point, Work Station A"
                />
              </div>

              <div>
                <Label>Confidence Threshold</Label>
                <Input
                  type="number"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={newCamera.confidenceThreshold}
                  onChange={(e) => setNewCamera({ ...newCamera, confidenceThreshold: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-actions">
              <Button onClick={addCamera}>Add Camera</Button>
              <Button variant="outline" onClick={() => setShowAddCamera(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Monitors Section */}
      <Card className="monitors-section">
        <div className="section-header">
          <h3>🖥️ Display Monitors</h3>
          <Button onClick={() => setShowAddMonitor(true)}>
            ➕ Add Monitor
          </Button>
        </div>

        <div className="monitors-grid">
          {monitors.map(monitor => (
            <div key={monitor.id} className="monitor-card">
              <div className="monitor-info">
                <h4>{monitor.name}</h4>
                <p>{monitor.location}</p>
              </div>
              
              <div className="monitor-settings">
                <p><strong>Position:</strong> {monitor.displaySettings.position}</p>
                <p><strong>Style:</strong> {monitor.displaySettings.labelStyle}</p>
                <p><strong>Update:</strong> {monitor.displaySettings.updateFrequency}ms</p>
              </div>
            </div>
          ))}
        </div>

        {showAddMonitor && (
          <div className="add-monitor-form">
            <h4>Add New Display Monitor</h4>
            
            <div className="form-grid">
              <div>
                <Label>Monitor Name</Label>
                <Input
                  value={newMonitor.name}
                  onChange={(e) => setNewMonitor({ ...newMonitor, name: e.target.value })}
                  placeholder="e.g., Station A Display"
                />
              </div>

              <div>
                <Label>Monitor Location</Label>
                <Input
                  value={newMonitor.location}
                  onChange={(e) => setNewMonitor({ ...newMonitor, location: e.target.value })}
                  placeholder="e.g., Production Floor - East"
                />
              </div>

              <div>
                <Label>Label Position</Label>
                <Select
  value={newMonitor.position}
  onChange={(e) => setNewMonitor({ ...newMonitor, position: e.target.value })}
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </Select>
              </div>

              <div>
                <Label>Label Style</Label>
                <Select
  value={newMonitor.labelStyle}
  onChange={(e) => setNewMonitor({ ...newMonitor, labelStyle: e.target.value })}
                >
                  <option value="name_only">Name Only</option>
                  <option value="name_designation">Name + Designation</option>
                  <option value="full_details">Full Details</option>
                </Select>
              </div>
            </div>

            <div className="form-actions">
              <Button onClick={addMonitor}>Add Monitor</Button>
              <Button variant="outline" onClick={() => setShowAddMonitor(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};