import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';

// Use environment variable for API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflow-backend-production.up.railway.app';

interface Device {
  id: string;
  device_type: string;
  device_name: string;
  is_active: boolean;
  last_seen: string;
  connection_details: any;
  location?: string;
}

export const DeviceRegistry: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_type: '',
    device_name: '',
    connection_type: 'USB',
    location: ''
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const token = localStorage.getItem('clamflow_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/hardware/devices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const addDevice = async () => {
    try {
      const token = localStorage.getItem('clamflow_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/hardware/devices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_type: newDevice.device_type,
          device_name: newDevice.device_name,
          connection_type: newDevice.connection_type,
          location: newDevice.location,
          connection_details: {}
        })
      });

      if (response.ok) {
        loadDevices();
        setShowAddDevice(false);
        setNewDevice({ device_type: '', device_name: '', connection_type: 'USB', location: '' });
      }
    } catch (error) {
      console.error('Failed to add device:', error);
    }
  };

  const toggleDevice = async (deviceId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('clamflow_token');
      await fetch(`${API_BASE_URL}/api/admin/hardware/devices/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: isActive })
      });

      loadDevices();
    } catch (error) {
      console.error('Failed to toggle device:', error);
    }
  };

  return (
    <div className="device-registry">
      <div className="registry-header">
        <h2>🔧 Device Registry</h2>
        <Button onClick={() => setShowAddDevice(true)}>
          ➕ Add Device
        </Button>
      </div>

      <div className="devices-grid">
        {devices.map(device => (
          <Card key={device.id} className="device-card">
            <div className="device-header">
              <h3>{device.device_name}</h3>
              <div className={`status-indicator ${device.is_active ? 'active' : 'inactive'}`}>
                {device.is_active ? '🟢' : '🔴'}
              </div>
            </div>

            <div className="device-details">
              <p><strong>Type:</strong> {device.device_type}</p>
              <p><strong>Location:</strong> {device.location || 'Not specified'}</p>
              <p><strong>Last Seen:</strong> {device.last_seen || 'Never'}</p>
            </div>

            <div className="device-actions">
              <Button
                onClick={() => toggleDevice(device.id, !device.is_active)}
                variant={device.is_active ? 'outline' : 'default'}
              >
                {device.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {showAddDevice && (
        <Card className="add-device-modal">
          <h3>Add New Device</h3>
          
          <div className="form-grid">
            <div>
              <Label>Device Type</Label>
              <Select
                value={newDevice.device_type}
                onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
              >
                <option value="">Select Type...</option>
                <option value="rfid_reader">RFID Reader</option>
                <option value="label_printer">Label Printer</option>
                <option value="camera">Camera</option>
                <option value="scanner">Scanner</option>
              </Select>
            </div>

            <div>
              <Label>Device Name</Label>
              <Input
                value={newDevice.device_name}
                onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                placeholder="e.g., Main Gate RFID Reader"
              />
            </div>

            <div>
              <Label>Connection Type</Label>
              <Select
                value={newDevice.connection_type}
                onChange={(e) => setNewDevice({ ...newDevice, connection_type: e.target.value })}
              >
                <option value="USB">USB</option>
                <option value="TCP">TCP/IP</option>
                <option value="Serial">Serial</option>
                <option value="Bluetooth">Bluetooth</option>
              </Select>
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={newDevice.location}
                onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                placeholder="e.g., Main Production Floor"
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button onClick={addDevice}>Add Device</Button>
            <Button variant="outline" onClick={() => setShowAddDevice(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};