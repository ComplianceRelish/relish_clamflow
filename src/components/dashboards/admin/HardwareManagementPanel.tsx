// src/components/dashboards/admin/HardwareManagementPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  CpuChipIcon, 
  SignalIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  WifiIcon,
  BoltIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface HardwareDevice {
  id: string;
  name: string;
  type: 'rfid_reader' | 'scale' | 'temperature_sensor' | 'camera' | 'scanner' | 'conveyor';
  location: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSeen: string;
  firmware: string;
  ipAddress: string;
  signalStrength: number;
  batteryLevel?: number;
  temperature?: number;
  readings: number;
  errorCount: number;
  uptime: string;
}

interface SystemMetrics {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  errorDevices: number;
  averageUptime: string;
  totalReadings: number;
}

const HardwareManagementPanel: React.FC = () => {
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    errorDevices: 0,
    averageUptime: '0h',
    totalReadings: 0
  });
  const [selectedDevice, setSelectedDevice] = useState<HardwareDevice | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deviceTypes = [
    'all', 'rfid_reader', 'scale', 'temperature_sensor', 'camera', 'scanner', 'conveyor'
  ];

  const statusTypes = ['all', 'online', 'offline', 'maintenance', 'error'];

  useEffect(() => {
    loadDevices();
    loadMetrics();
    // Set up periodic refresh
    const interval = setInterval(() => {
      loadDevices();
      loadMetrics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/hardware/devices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load hardware devices');
      }

      const data = await response.json();
      setDevices(data);
    } catch (err) {
      console.error('Error loading devices:', err);
      setError('Failed to load hardware devices');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/hardware/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        // Calculate metrics from devices if API fails
        const totalDevices = devices.length;
        const onlineDevices = devices.filter(d => d.status === 'online').length;
        const offlineDevices = devices.filter(d => d.status === 'offline').length;
        const errorDevices = devices.filter(d => d.status === 'error').length;
        const totalReadings = devices.reduce((sum, d) => sum + d.readings, 0);

        setMetrics({
          totalDevices,
          onlineDevices,
          offlineDevices,
          errorDevices,
          averageUptime: totalDevices > 0 ? '42d 8h' : '0h',
          totalReadings
        });
      }
    } catch (err) {
      console.error('Error loading metrics:', err);
      // Calculate from existing devices data
      const totalDevices = devices.length;
      const onlineDevices = devices.filter(d => d.status === 'online').length;
      const offlineDevices = devices.filter(d => d.status === 'offline').length;
      const errorDevices = devices.filter(d => d.status === 'error').length;
      const totalReadings = devices.reduce((sum, d) => sum + d.readings, 0);

      setMetrics({
        totalDevices,
        onlineDevices,
        offlineDevices,
        errorDevices,
        averageUptime: totalDevices > 0 ? '42d 8h' : '0h',
        totalReadings
      });
    }
  };

  const handleDeviceAction = async (deviceId: string, action: 'restart' | 'maintenance' | 'reset') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/hardware/devices/${deviceId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        throw new Error(`Failed to perform ${action} on device`);
      }

      // Update device status based on action
      setDevices(devices.map(device => 
        device.id === deviceId 
          ? { 
              ...device, 
              status: action === 'maintenance' ? 'maintenance' : device.status,
              lastSeen: new Date().toISOString()
            }
          : device
      ));
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      alert(`Failed to ${action} device. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'maintenance':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'rfid_reader': return <SignalIcon className="h-6 w-6" />;
      case 'scale': return <CpuChipIcon className="h-6 w-6" />;
      case 'temperature_sensor': return <BoltIcon className="h-6 w-6" />;
      case 'camera': return <EyeIcon className="h-6 w-6" />;
      case 'scanner': return <EyeIcon className="h-6 w-6" />;
      case 'conveyor': return <Cog6ToothIcon className="h-6 w-6" />;
      default: return <CpuChipIcon className="h-6 w-6" />;
    }
  };

  const filteredDevices = devices.filter(device => {
    const matchesType = filterType === 'all' || device.type === filterType;
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    return matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CpuChipIcon className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Hardware Management</h2>
            <p className="text-gray-600">Monitor and control RFID readers, sensors, and IoT devices</p>
          </div>
        </div>
        <button
          onClick={() => {
            loadDevices();
            loadMetrics();
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh All
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CpuChipIcon className="h-8 w-8 text-gray-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Devices</p>
              {metrics.totalDevices > 0 ? (
                <p className="text-2xl font-semibold text-gray-900">{metrics.totalDevices}</p>
              ) : (
                <p className="text-sm text-gray-500">No devices configured</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Online</p>
              <p className="text-2xl font-semibold text-green-600">{metrics.onlineDevices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-gray-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Offline</p>
              <p className="text-2xl font-semibold text-gray-600">{metrics.offlineDevices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Errors</p>
              <p className="text-2xl font-semibold text-red-600">{metrics.errorDevices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <SignalIcon className="h-8 w-8 text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Readings</p>
              {metrics.totalReadings > 0 ? (
                <p className="text-2xl font-semibold text-blue-600">{metrics.totalReadings.toLocaleString()}</p>
              ) : (
                <p className="text-sm text-gray-500">No readings yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {deviceTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {statusTypes.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Device Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-yellow-800 font-medium">Hardware Devices Unavailable</h3>
              <p className="text-yellow-600 text-sm mt-1">{error}</p>
              <button
                onClick={loadDevices}
                className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-800"
              >
                Retry Loading
              </button>
            </div>
          </div>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <CpuChipIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">No hardware devices configured yet</p>
          <p className="text-sm text-gray-400 mt-2">Connect and configure hardware devices to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDevices.map((device) => (
            <div key={device.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
                    <p className="text-sm text-gray-600">{device.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(device.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                    {device.status}
                  </span>
                </div>
              </div>

              {/* Device Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Signal Strength</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          device.signalStrength > 80 ? 'bg-green-500' :
                          device.signalStrength > 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${device.signalStrength}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{device.signalStrength}%</span>
                  </div>
                </div>

                {device.batteryLevel && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Battery</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            device.batteryLevel > 50 ? 'bg-green-500' :
                            device.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${device.batteryLevel}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{device.batteryLevel}%</span>
                    </div>
                  </div>
                )}

                {device.temperature && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Temperature</span>
                    <span className="text-sm font-medium">{device.temperature}°C</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Readings</span>
                  <span className="text-sm font-medium">{device.readings.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Errors</span>
                  <span className={`text-sm font-medium ${device.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {device.errorCount}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm font-medium">{device.uptime}</span>
                </div>
              </div>

              {/* Device Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                  <span>IP: {device.ipAddress}</span>
                  <span>FW: {device.firmware}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Last seen: {new Date(device.lastSeen).toLocaleString()}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleDeviceAction(device.id, 'restart')}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Restart
                </button>
                <button
                  onClick={() => handleDeviceAction(device.id, 'maintenance')}
                  className="flex-1 px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200"
                >
                  Maintenance
                </button>
                <button
                  onClick={() => setSelectedDevice(device)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 border border-purple-300 rounded-md hover:bg-purple-200"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Device Details Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Device Details</h3>
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedDevice.name}</h4>
                  <p className="text-sm text-gray-600">{selectedDevice.location}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <p className="text-gray-600">{selectedDevice.type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <p className={`font-medium ${
                      selectedDevice.status === 'online' ? 'text-green-600' :
                      selectedDevice.status === 'error' ? 'text-red-600' :
                      selectedDevice.status === 'maintenance' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {selectedDevice.status}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">IP Address:</span>
                    <p className="text-gray-600">{selectedDevice.ipAddress}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Firmware:</span>
                    <p className="text-gray-600">{selectedDevice.firmware}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between space-x-2">
                    <button
                      onClick={() => {
                        handleDeviceAction(selectedDevice.id, 'restart');
                        setSelectedDevice(null);
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Restart Device
                    </button>
                    <button
                      onClick={() => {
                        handleDeviceAction(selectedDevice.id, 'reset');
                        setSelectedDevice(null);
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                    >
                      Factory Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HardwareManagementPanel;