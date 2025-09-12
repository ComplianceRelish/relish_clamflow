import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';

interface HardwareConfigProps {
  hardwareType: 'rfid' | 'label_printer' | 'face_recognition' | 'qr_code';
}

interface HardwareSettings {
  [key: string]: any;
}

export const HardwareConfig: React.FC<HardwareConfigProps> = ({ hardwareType }) => {
  const [config, setConfig] = useState<HardwareSettings>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hardwareOptions = {
    rfid: {
      connection_types: ['USB', 'Serial', 'TCP/IP', 'Bluetooth'],
      supported_models: ['Generic USB HID', 'Zebra FX Series', 'Impinj R700', 'Custom'],
      settings: ['read_timeout', 'power_level', 'antenna_configuration']
    },
    label_printer: {
      connection_types: ['USB', 'Network', 'Bluetooth', 'Serial'],
      supported_models: ['Zebra ZD Series', 'DYMO', 'Brother QL', 'Generic ESC/POS', 'Custom'],
      settings: ['paper_width', 'print_density', 'speed', 'label_format']
    },
    face_recognition: {
      connection_types: ['USB Camera', 'Network Camera', 'Built-in Camera'],
      supported_models: ['Generic USB Camera', 'IP Camera', 'Built-in Webcam', 'Custom'],
      settings: ['detection_method', 'confidence_threshold', 'recognition_threshold']
    },
    qr_code: {
      connection_types: ['Software Only'],
      supported_models: ['QR Library', 'Custom Generator'],
      settings: ['qr_version', 'error_correction', 'box_size', 'border']
    }
  };

  useEffect(() => {
    loadHardwareConfig();
  }, [hardwareType]);

  const loadHardwareConfig = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://clamflowbackend-production.up.railway.app/admin/hardware/configurations/${hardwareType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.settings || {});
      }
    } catch (error) {
      console.error('Failed to load hardware config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveHardwareConfig = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://clamflowbackend-production.up.railway.app/admin/hardware/configurations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config_type: hardwareType,
          enabled: true,
          settings: config
        })
      });

      if (response.ok) {
        alert('Hardware configuration saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save hardware config:', error);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return <div>Loading hardware configuration...</div>;
  }

  const options = hardwareOptions[hardwareType];

  return (
    <Card className="hardware-config-panel">
      <div className="config-header">
        <h3>Configure {hardwareType.replace('_', ' ').toUpperCase()}</h3>
      </div>

      <div className="config-form">
        {/* Hardware Model Selection */}
        <div className="form-field">
          <Label>Hardware Model</Label>
          <Select
            value={config.model || ''}
            onChange={(e) => updateConfig('model', e.target.value)}
          >
            <option value="">Select Hardware Model...</option>
            {options.supported_models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </Select>
        </div>

        {/* Connection Type */}
        <div className="form-field">
          <Label>Connection Type</Label>
          <Select
            value={config.connection || ''}
            onChange={(e) => updateConfig('connection', e.target.value)}
          >
            <option value="">Select Connection Type...</option>
            {options.connection_types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </div>

        {/* Dynamic Settings Based on Hardware Type */}
        {hardwareType === 'rfid' && (
          <>
            <div className="form-field">
              <Label>Read Timeout (seconds)</Label>
              <Input
                type="number"
                value={config.read_timeout || 5}
                onChange={(e) => updateConfig('read_timeout', parseInt(e.target.value))}
              />
            </div>
            <div className="form-field">
              <Label>Power Level</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={config.power_level || 5}
                onChange={(e) => updateConfig('power_level', parseInt(e.target.value))}
              />
            </div>
          </>
        )}

        {hardwareType === 'label_printer' && (
          <>
            <div className="form-field">
              <Label>Paper Width (mm)</Label>
              <Input
                type="number"
                value={config.paper_width || 58}
                onChange={(e) => updateConfig('paper_width', parseInt(e.target.value))}
              />
            </div>
            <div className="form-field">
              <Label>Print Density</Label>
              <Input
                type="number"
                min="1"
                max="15"
                value={config.print_density || 8}
                onChange={(e) => updateConfig('print_density', parseInt(e.target.value))}
              />
            </div>
          </>
        )}

        {hardwareType === 'face_recognition' && (
          <>
            <div className="form-field">
              <Label>Detection Method</Label>
              <Select
                value={config.detection_method || 'dnn'}
                onChange={(e) => updateConfig('detection_method', e.target.value)}
              >
                <option value="dnn">DNN (Recommended)</option>
                <option value="haar">Haar Cascade</option>
              </Select>
            </div>
            <div className="form-field">
              <Label>Confidence Threshold</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="1.0"
                value={config.confidence_threshold || 0.7}
                onChange={(e) => updateConfig('confidence_threshold', parseFloat(e.target.value))}
              />
            </div>
          </>
        )}

        {/* Custom Hardware Section */}
        {config.model === 'Custom' && (
          <div className="custom-hardware-section">
            <div className="form-field">
              <Label>Custom Driver Path</Label>
              <Input
                placeholder="Path to custom driver or library"
                value={config.driverPath || ''}
                onChange={(e) => updateConfig('driverPath', e.target.value)}
              />
            </div>
            <div className="form-field">
              <Label>Custom Configuration JSON</Label>
              <textarea
                placeholder='{"custom_setting": "value"}'
                value={config.customSettings || ''}
                onChange={(e) => updateConfig('customSettings', e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
          </div>
        )}

        <div className="config-actions">
          <Button 
            onClick={saveHardwareConfig}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </Card>
  );
};