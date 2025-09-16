import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';

// Custom Select component to avoid TypeScript issues
const FormSelect: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
}> = ({ value, onValueChange, children, placeholder, className = "" }) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
};

// Custom SelectItem component
const FormSelectItem: React.FC<{
  value: string;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <option value={value}>{children}</option>;
};

interface DeviceFormProps {
  device?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const DeviceForm: React.FC<DeviceFormProps> = ({ device, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    device_id: '',
    device_name: '',
    device_type: '',
    location: '',
    status: 'active',
    ip_address: '',
    port: '',
    protocol: 'modbus_tcp',
    configuration: '{}'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (device) {
      setFormData({
        device_id: device.device_id || '',
        device_name: device.device_name || '',
        device_type: device.device_type || '',
        location: device.location || '',
        status: device.status || 'active',
        ip_address: device.ip_address || '',
        port: device.port?.toString() || '',
        protocol: device.protocol || 'modbus_tcp',
        configuration: typeof device.configuration === 'object' 
          ? JSON.stringify(device.configuration, null, 2)
          : device.configuration || '{}'
      });
    }
  }, [device]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.device_id.trim()) {
      newErrors.device_id = 'Device ID is required';
    }

    if (!formData.device_name.trim()) {
      newErrors.device_name = 'Device name is required';
    }

    if (!formData.device_type.trim()) {
      newErrors.device_type = 'Device type is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.ip_address && !/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.ip_address)) {
      newErrors.ip_address = 'Invalid IP address format';
    }

    if (formData.port && (isNaN(Number(formData.port)) || Number(formData.port) < 1 || Number(formData.port) > 65535)) {
      newErrors.port = 'Port must be a number between 1 and 65535';
    }

    try {
      JSON.parse(formData.configuration);
    } catch (e) {
      newErrors.configuration = 'Configuration must be valid JSON';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const submitData = {
        ...formData,
        port: formData.port ? Number(formData.port) : null,
        configuration: JSON.parse(formData.configuration)
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{device ? 'Edit Device' : 'Add New Device'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device_id">Device ID</Label>
              <Input
                id="device_id"
                value={formData.device_id}
                onChange={(e) => handleInputChange('device_id', e.target.value)}
                disabled={!!device}
                className={errors.device_id ? 'border-red-500' : ''}
              />
              {errors.device_id && (
                <Alert>
                  <AlertDescription>{errors.device_id}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="device_name">Device Name</Label>
              <Input
                id="device_name"
                value={formData.device_name}
                onChange={(e) => handleInputChange('device_name', e.target.value)}
                className={errors.device_name ? 'border-red-500' : ''}
              />
              {errors.device_name && (
                <Alert>
                  <AlertDescription>{errors.device_name}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device_type">Device Type</Label>
            <FormSelect
              value={formData.device_type}
              onValueChange={(value) => handleInputChange('device_type', value)}
            >
              <FormSelectItem value="">Select device type</FormSelectItem>
              <FormSelectItem value="scale">Scale</FormSelectItem>
              <FormSelectItem value="rfid_reader">RFID Reader</FormSelectItem>
              <FormSelectItem value="barcode_scanner">Barcode Scanner</FormSelectItem>
              <FormSelectItem value="camera">Camera</FormSelectItem>
              <FormSelectItem value="sensor">Sensor</FormSelectItem>
              <FormSelectItem value="plc">PLC</FormSelectItem>
              <FormSelectItem value="hmi">HMI</FormSelectItem>
            </FormSelect>
            {errors.device_type && (
              <Alert>
                <AlertDescription>{errors.device_type}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Production Line 1, Packaging Area"
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && (
              <Alert>
                <AlertDescription>{errors.location}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <FormSelect
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <FormSelectItem value="active">Active</FormSelectItem>
              <FormSelectItem value="inactive">Inactive</FormSelectItem>
              <FormSelectItem value="maintenance">Maintenance</FormSelectItem>
              <FormSelectItem value="error">Error</FormSelectItem>
            </FormSelect>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                value={formData.ip_address}
                onChange={(e) => handleInputChange('ip_address', e.target.value)}
                placeholder="192.168.1.100"
                className={errors.ip_address ? 'border-red-500' : ''}
              />
              {errors.ip_address && (
                <Alert>
                  <AlertDescription>{errors.ip_address}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => handleInputChange('port', e.target.value)}
                placeholder="502"
                min="1"
                max="65535"
                className={errors.port ? 'border-red-500' : ''}
              />
              {errors.port && (
                <Alert>
                  <AlertDescription>{errors.port}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="protocol">Protocol</Label>
            <FormSelect
              value={formData.protocol}
              onValueChange={(value) => handleInputChange('protocol', value)}
            >
              <FormSelectItem value="modbus_tcp">Modbus TCP</FormSelectItem>
              <FormSelectItem value="modbus_rtu">Modbus RTU</FormSelectItem>
              <FormSelectItem value="ethernet_ip">Ethernet/IP</FormSelectItem>
              <FormSelectItem value="profinet">PROFINET</FormSelectItem>
              <FormSelectItem value="opc_ua">OPC UA</FormSelectItem>
              <FormSelectItem value="http">HTTP</FormSelectItem>
              <FormSelectItem value="mqtt">MQTT</FormSelectItem>
              <FormSelectItem value="serial">Serial</FormSelectItem>
            </FormSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="configuration">Configuration (JSON)</Label>
            <textarea
              id="configuration"
              value={formData.configuration}
              onChange={(e) => handleInputChange('configuration', e.target.value)}
              placeholder='{"baudRate": 9600, "dataBits": 8}'
              className={`min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.configuration ? 'border-red-500' : ''
              }`}
              rows={4}
            />
            {errors.configuration && (
              <Alert>
                <AlertDescription>{errors.configuration}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (device ? 'Update Device' : 'Create Device')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DeviceForm;