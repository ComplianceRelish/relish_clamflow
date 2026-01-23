'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Label } from '@/components/ui/Label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { 
  Plus, Search, Check, X, AlertTriangle, Clock, Settings, 
  Usb, Monitor, Wifi, Activity, History, Shield, RefreshCw,
  Trash2, Edit, Eye, Power
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'

// ============================================
// TYPE DEFINITIONS
// ============================================

type DeviceType = 
  | 'scale'
  | 'rfid_reader'
  | 'barcode_scanner'
  | 'label_printer'
  | 'temperature_sensor'
  | 'ph_meter'
  | 'biometric_scanner'
  | 'camera'
  | 'tablet'
  | 'plc_controller'
  | 'environmental_sensor';

type DeviceStatus = 'pending' | 'approved' | 'revoked' | 'maintenance';

type ConnectionType = 'usb' | 'serial' | 'ethernet' | 'wifi' | 'bluetooth';

interface RegisteredDevice {
  id: string;
  device_name: string;
  device_type: DeviceType;
  serial_number: string;
  vendor_id?: string;
  product_id?: string;
  manufacturer?: string;
  model?: string;
  station_id?: string;
  station_location?: string;
  connection_type?: ConnectionType;
  status: DeviceStatus;
  is_active: boolean;
  allowed_roles: string[];
  configuration?: Record<string, unknown>;
  registered_by?: string;
  registered_at?: string;
  approved_by?: string;
  approved_at?: string;
  last_connected_at?: string;
  last_connected_by?: string;
  connection_count: number;
}

interface DeviceAuditLog {
  id: string;
  event_type: string;
  event_timestamp: string;
  device_id: string;
  device_serial: string;
  user_id?: string;
  username?: string;
  user_role?: string;
  station_name?: string;
  reading_value?: number;
  reading_unit?: string;
  event_data?: Record<string, unknown>;
}

interface RegistrationFormData {
  device_name: string;
  device_type: DeviceType;
  serial_number: string;
  vendor_id: string;
  product_id: string;
  manufacturer: string;
  model: string;
  station_location: string;
  connection_type: ConnectionType;
  allowed_roles: string[];
}

// ============================================
// HELPER COMPONENTS
// ============================================

const DeviceTypeIcon: React.FC<{ type: DeviceType; className?: string }> = ({ type, className = "w-5 h-5" }) => {
  switch (type) {
    case 'scale': return <span className={className}>⚖️</span>;
    case 'rfid_reader': return <span className={className}>📡</span>;
    case 'barcode_scanner': return <span className={className}>📊</span>;
    case 'label_printer': return <span className={className}>🖨️</span>;
    case 'temperature_sensor': return <span className={className}>🌡️</span>;
    case 'ph_meter': return <span className={className}>🧪</span>;
    case 'biometric_scanner': return <span className={className}>👆</span>;
    case 'camera': return <span className={className}>📷</span>;
    case 'tablet': return <span className={className}>📱</span>;
    case 'plc_controller': return <span className={className}>🎛️</span>;
    case 'environmental_sensor': return <span className={className}>🌿</span>;
    default: return <Monitor className={className} />;
  }
};

const StatusBadge: React.FC<{ status: DeviceStatus }> = ({ status }) => {
  const variants: Record<DeviceStatus, { color: string; icon: React.ReactNode }> = {
    approved: { color: 'bg-green-100 text-green-800', icon: <Check className="w-3 h-3" /> },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
    revoked: { color: 'bg-red-100 text-red-800', icon: <X className="w-3 h-3" /> },
    maintenance: { color: 'bg-blue-100 text-blue-800', icon: <Settings className="w-3 h-3" /> }
  };

  const variant = variants[status] || variants.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${variant.color}`}>
      {variant.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const ConnectionTypeBadge: React.FC<{ type?: ConnectionType }> = ({ type }) => {
  if (!type) return null;
  
  const icons: Record<ConnectionType, React.ReactNode> = {
    usb: <Usb className="w-3 h-3" />,
    serial: <Monitor className="w-3 h-3" />,
    ethernet: <Wifi className="w-3 h-3" />,
    wifi: <Wifi className="w-3 h-3" />,
    bluetooth: <Activity className="w-3 h-3" />
  };

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
      {icons[type]}
      {type.toUpperCase()}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function DeviceRegistryPanel() {
  // State
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<DeviceStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<DeviceType | 'all'>('all');
  const [filterConnection, setFilterConnection] = useState<ConnectionType | 'all'>('all');
  
  // Modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<RegisteredDevice | null>(null);
  const [auditLogs, setAuditLogs] = useState<DeviceAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<RegistrationFormData>({
    device_name: '',
    device_type: 'scale',
    serial_number: '',
    vendor_id: '',
    product_id: '',
    manufacturer: '',
    model: '',
    station_location: '',
    connection_type: 'usb',
    allowed_roles: ['Admin', 'Production Lead']
  });

  const deviceTypes: { value: DeviceType; label: string }[] = [
    { value: 'scale', label: 'Industrial Scale' },
    { value: 'rfid_reader', label: 'RFID Reader' },
    { value: 'barcode_scanner', label: 'Barcode/QR Scanner' },
    { value: 'label_printer', label: 'Label Printer' },
    { value: 'temperature_sensor', label: 'Temperature Sensor' },
    { value: 'ph_meter', label: 'pH Meter' },
    { value: 'biometric_scanner', label: 'Biometric Scanner' },
    { value: 'camera', label: 'IP Camera' },
    { value: 'tablet', label: 'Tablet/Terminal' },
    { value: 'plc_controller', label: 'PLC Controller' },
    { value: 'environmental_sensor', label: 'Environmental Sensor' }
  ];

  const connectionTypes: { value: ConnectionType; label: string }[] = [
    { value: 'usb', label: 'USB' },
    { value: 'serial', label: 'Serial/RS232' },
    { value: 'ethernet', label: 'Ethernet' },
    { value: 'wifi', label: 'WiFi' },
    { value: 'bluetooth', label: 'Bluetooth' }
  ];

  const stationLocations = [
    'Gate',
    'Weight Station',
    'PPC Station',
    'Depuration',
    'FP Station',
    'QC Station',
    'Storage',
    'Server Room',
    'Production Floor'
  ];

  const availableRoles = [
    'Super Admin',
    'Admin',
    'Production Lead',
    'QC Lead',
    'Staff Lead',
    'QC Staff',
    'Production Staff',
    'Security Guard'
  ];

  // ============================================
  // DATA FETCHING
  // ============================================

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/devices/registry');
      const data = response.data as { devices: RegisteredDevice[] } | null;
      setDevices(data?.devices || []);
      setError(null);
    } catch (err: unknown) {
      // Handle 404 gracefully - endpoint may not be implemented yet
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 404) {
        console.warn('Device registry endpoint not available yet');
        // Use mock data for UI development
        setDevices(getMockDevices());
      } else {
        setError('Failed to load device registry');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuditLogs = async (deviceId: string) => {
    try {
      setAuditLoading(true);
      const response = await apiClient.get(`/api/admin/devices/${deviceId}/audit`);
      const data = response.data as { logs: DeviceAuditLog[] } | null;
      setAuditLogs(data?.logs || []);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 404) {
        // Mock audit logs for development
        setAuditLogs(getMockAuditLogs(deviceId));
      } else {
        console.error('Failed to load audit logs:', err);
      }
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // ============================================
  // DEVICE ACTIONS
  // ============================================

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await apiClient.post('/api/admin/devices/registry', formData);
      setShowRegisterModal(false);
      resetForm();
      loadDevices();
    } catch (err) {
      console.error('Failed to register device:', err);
      setError('Failed to register device');
    }
  };

  const handleApproveDevice = async (deviceId: string) => {
    try {
      await apiClient.put(`/api/admin/devices/${deviceId}/approve`);
      loadDevices();
    } catch (err) {
      console.error('Failed to approve device:', err);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to revoke access for this device?')) return;
    
    try {
      await apiClient.put(`/api/admin/devices/${deviceId}/revoke`);
      loadDevices();
    } catch (err) {
      console.error('Failed to revoke device:', err);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to permanently delete this device from the registry?')) return;
    
    try {
      await apiClient.delete(`/api/admin/devices/${deviceId}`);
      loadDevices();
    } catch (err) {
      console.error('Failed to delete device:', err);
    }
  };

  const handleViewAudit = (device: RegisteredDevice) => {
    setSelectedDevice(device);
    loadAuditLogs(device.id);
    setShowAuditModal(true);
  };

  const resetForm = () => {
    setFormData({
      device_name: '',
      device_type: 'scale',
      serial_number: '',
      vendor_id: '',
      product_id: '',
      manufacturer: '',
      model: '',
      station_location: '',
      connection_type: 'usb',
      allowed_roles: ['Admin', 'Production Lead']
    });
  };

  // ============================================
  // FILTERING
  // ============================================

  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    const matchesType = filterType === 'all' || device.device_type === filterType;
    const matchesConnection = filterConnection === 'all' || device.connection_type === filterConnection;
    
    return matchesSearch && matchesStatus && matchesType && matchesConnection;
  });

  // ============================================
  // MOCK DATA (for development before backend is ready)
  // ============================================

  function getMockDevices(): RegisteredDevice[] {
    return [
      {
        id: '1',
        device_name: 'Scale-WS-01',
        device_type: 'scale',
        serial_number: 'MT-2024-001234',
        vendor_id: '0x1234',
        product_id: '0x5678',
        manufacturer: 'Mettler Toledo',
        model: 'IND570',
        station_location: 'Weight Station',
        connection_type: 'serial',
        status: 'approved',
        is_active: true,
        allowed_roles: ['Admin', 'Production Lead', 'Production Staff'],
        registered_at: '2024-01-15T10:00:00Z',
        last_connected_at: '2026-01-23T09:30:00Z',
        connection_count: 1523
      },
      {
        id: '2',
        device_name: 'RFID-Gate-01',
        device_type: 'rfid_reader',
        serial_number: 'ZBR-2024-005678',
        manufacturer: 'Zebra',
        model: 'FX9600',
        station_location: 'Gate',
        connection_type: 'ethernet',
        status: 'approved',
        is_active: true,
        allowed_roles: ['Admin', 'Security Guard'],
        registered_at: '2024-01-10T08:00:00Z',
        last_connected_at: '2026-01-23T08:00:00Z',
        connection_count: 5421
      },
      {
        id: '3',
        device_name: 'TempSensor-Dep-01',
        device_type: 'temperature_sensor',
        serial_number: 'TEMP-2024-009999',
        manufacturer: 'Omega',
        model: 'PT100',
        station_location: 'Depuration',
        connection_type: 'ethernet',
        status: 'approved',
        is_active: true,
        allowed_roles: ['Admin', 'QC Lead'],
        registered_at: '2024-02-01T14:00:00Z',
        connection_count: 0
      },
      {
        id: '4',
        device_name: 'Unknown-Scale',
        device_type: 'scale',
        serial_number: 'UNKNOWN-123',
        vendor_id: '0xABCD',
        product_id: '0xEF01',
        station_location: 'Weight Station',
        connection_type: 'usb',
        status: 'pending',
        is_active: false,
        allowed_roles: [],
        registered_at: '2026-01-23T10:15:00Z',
        connection_count: 0
      }
    ];
  }

  function getMockAuditLogs(deviceId: string): DeviceAuditLog[] {
    return [
      {
        id: '1',
        event_type: 'connected',
        event_timestamp: '2026-01-23T09:30:00Z',
        device_id: deviceId,
        device_serial: 'MT-2024-001234',
        username: 'john.operator',
        user_role: 'Production Staff',
        station_name: 'Weight Station'
      },
      {
        id: '2',
        event_type: 'reading',
        event_timestamp: '2026-01-23T09:31:00Z',
        device_id: deviceId,
        device_serial: 'MT-2024-001234',
        username: 'john.operator',
        user_role: 'Production Staff',
        station_name: 'Weight Station',
        reading_value: 125.5,
        reading_unit: 'kg'
      },
      {
        id: '3',
        event_type: 'reading',
        event_timestamp: '2026-01-23T09:32:00Z',
        device_id: deviceId,
        device_serial: 'MT-2024-001234',
        username: 'john.operator',
        user_role: 'Production Staff',
        station_name: 'Weight Station',
        reading_value: 98.2,
        reading_unit: 'kg'
      }
    ];
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Device Registry</h2>
          <p className="text-sm text-gray-600">
            Manage authorized hardware devices for ClamFlow stations
          </p>
        </div>
        <Button onClick={() => setShowRegisterModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Register Device
        </Button>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{devices.filter(d => d.status === 'approved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{devices.filter(d => d.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Revoked</p>
                <p className="text-2xl font-bold">{devices.filter(d => d.status === 'revoked').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold">{devices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, serial number, manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as DeviceStatus | 'all')}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="revoked">Revoked</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as DeviceType | 'all')}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="all">All Types</option>
              {deviceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={filterConnection}
              onChange={(e) => setFilterConnection(e.target.value as ConnectionType | 'all')}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="all">All Connections</option>
              {connectionTypes.map(conn => (
                <option key={conn.value} value={conn.value}>{conn.label}</option>
              ))}
            </select>
            <Button variant="outline" onClick={loadDevices} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Registered Devices ({filteredDevices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-gray-600">Loading devices...</p>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No devices found</p>
              <p className="text-sm">Register a device to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Device</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Serial Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Station</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Connection</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Last Used</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map(device => (
                    <tr key={device.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <DeviceTypeIcon type={device.device_type} className="text-xl" />
                          <div>
                            <p className="font-medium">{device.device_name}</p>
                            <p className="text-sm text-gray-500">
                              {device.manufacturer} {device.model}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {device.serial_number}
                        </code>
                      </td>
                      <td className="py-3 px-4">{device.station_location || '-'}</td>
                      <td className="py-3 px-4">
                        <ConnectionTypeBadge type={device.connection_type} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={device.status} />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {device.last_connected_at 
                          ? new Date(device.last_connected_at).toLocaleString()
                          : 'Never'
                        }
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewAudit(device)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="View Audit Log"
                          >
                            <History className="w-4 h-4 text-gray-600" />
                          </button>
                          {device.status === 'pending' && (
                            <button
                              onClick={() => handleApproveDevice(device.id)}
                              className="p-2 hover:bg-green-100 rounded"
                              title="Approve"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          {device.status === 'approved' && (
                            <button
                              onClick={() => handleRevokeDevice(device.id)}
                              className="p-2 hover:bg-red-100 rounded"
                              title="Revoke Access"
                            >
                              <Power className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDevice(device.id)}
                            className="p-2 hover:bg-red-100 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register Device Modal */}
      <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Register New Device
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegisterDevice} className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="device_name">Device Name *</Label>
                  <Input
                    id="device_name"
                    value={formData.device_name}
                    onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                    placeholder="e.g., Scale-WS-01"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="device_type">Device Type *</Label>
                  <select
                    id="device_type"
                    value={formData.device_type}
                    onChange={(e) => setFormData({ ...formData, device_type: e.target.value as DeviceType })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    {deviceTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="serial_number">Serial Number *</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    placeholder="e.g., MT-2024-001234"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="connection_type">Connection Type *</Label>
                  <select
                    id="connection_type"
                    value={formData.connection_type}
                    onChange={(e) => setFormData({ ...formData, connection_type: e.target.value as ConnectionType })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    {connectionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Hardware Identifiers */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Hardware Identifiers (for WebUSB/WebSerial)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor_id">USB Vendor ID</Label>
                  <Input
                    id="vendor_id"
                    value={formData.vendor_id}
                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                    placeholder="e.g., 0x1234"
                  />
                  <p className="text-xs text-gray-500 mt-1">Found in device properties or documentation</p>
                </div>
                <div>
                  <Label htmlFor="product_id">USB Product ID</Label>
                  <Input
                    id="product_id"
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    placeholder="e.g., 0x5678"
                  />
                </div>
              </div>
            </div>

            {/* Manufacturer Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Manufacturer Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g., Mettler Toledo"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., IND570"
                  />
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Station Assignment</h3>
              <div>
                <Label htmlFor="station_location">Station Location *</Label>
                <select
                  id="station_location"
                  value={formData.station_location}
                  onChange={(e) => setFormData({ ...formData, station_location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select station...</option>
                  {stationLocations.map(station => (
                    <option key={station} value={station}>{station}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Access Permissions</h3>
              <p className="text-sm text-gray-600">Select roles that can use this device:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableRoles.map(role => (
                  <label key={role} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allowed_roles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, allowed_roles: [...formData.allowed_roles, role] });
                        } else {
                          setFormData({ ...formData, allowed_roles: formData.allowed_roles.filter(r => r !== role) });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowRegisterModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Register Device
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Audit Log Modal */}
      <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Audit Log - {selectedDevice?.device_name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {auditLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No audit logs found</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.event_type === 'connected' ? 'default' : 'secondary'}>
                          {log.event_type}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          by {log.username || 'System'} ({log.user_role || 'N/A'})
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.event_timestamp).toLocaleString()}
                      </span>
                    </div>
                    {log.reading_value && (
                      <p className="mt-2 text-sm">
                        Reading: <strong>{log.reading_value} {log.reading_unit}</strong>
                      </p>
                    )}
                    {log.station_name && (
                      <p className="text-xs text-gray-500 mt-1">Station: {log.station_name}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
