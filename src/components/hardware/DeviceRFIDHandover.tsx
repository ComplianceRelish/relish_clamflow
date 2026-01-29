// src/components/hardware/DeviceRFIDHandover.tsx
// Device RFID Handover - Link RFID Device to Assigned Station Staff
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import clamflowAPI from '../../lib/clamflow-api';
import { DeviceHandoverAccess } from '../auth/RoleBasedAccess';

// ============================================
// INTERFACES
// ============================================

interface RFIDDevice {
  id: string;
  device_tag: string;
  device_type: 'handheld' | 'fixed' | 'tablet';
  model: string;
  serial_number: string;
  status: 'available' | 'assigned' | 'maintenance';
  last_assigned_to?: string;
  last_assigned_at?: string;
  battery_level?: number;
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  station: string;
  is_active: boolean;
  has_device: boolean;
  current_device?: string;
}

interface HandoverRecord {
  id: string;
  device_id: string;
  device_tag: string;
  staff_id: string;
  staff_name: string;
  station: string;
  handed_over_by: string;
  handed_over_at: string;
  status: 'active' | 'returned';
  returned_at?: string;
}

// ============================================
// DEVICE RFID HANDOVER COMPONENT
// ============================================

const DeviceRFIDHandover: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'handover' | 'active' | 'history'>('handover');
  const [devices, setDevices] = useState<RFIDDevice[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activeHandovers, setActiveHandovers] = useState<HandoverRecord[]>([]);
  
  // Handover form state
  const [selectedDevice, setSelectedDevice] = useState<RFIDDevice | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [scannedTag, setScannedTag] = useState('');
  const [scanMode, setScanMode] = useState<'device' | 'staff_badge'>('device');
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchData();
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Mock data - In production, fetch from API
      setDevices([
        {
          id: '1',
          device_tag: 'DEV-001',
          device_type: 'handheld',
          model: 'Zebra MC3300',
          serial_number: 'SN123456',
          status: 'available',
          battery_level: 85
        },
        {
          id: '2',
          device_tag: 'DEV-002',
          device_type: 'handheld',
          model: 'Zebra MC3300',
          serial_number: 'SN123457',
          status: 'assigned',
          last_assigned_to: 'John Doe',
          last_assigned_at: new Date().toISOString(),
          battery_level: 62
        },
        {
          id: '3',
          device_tag: 'DEV-003',
          device_type: 'tablet',
          model: 'Samsung Galaxy Tab Active',
          serial_number: 'SN789012',
          status: 'available',
          battery_level: 100
        },
      ]);

      setStaff([
        {
          id: '1',
          full_name: 'John Doe',
          role: 'Production Staff',
          station: 'RM Station 1',
          is_active: true,
          has_device: true,
          current_device: 'DEV-002'
        },
        {
          id: '2',
          full_name: 'Jane Smith',
          role: 'Production Staff',
          station: 'Washing Station',
          is_active: true,
          has_device: false
        },
        {
          id: '3',
          full_name: 'Mike Johnson',
          role: 'QC Staff',
          station: 'QC Station 1',
          is_active: true,
          has_device: false
        },
      ]);

      setActiveHandovers([
        {
          id: '1',
          device_id: '2',
          device_tag: 'DEV-002',
          staff_id: '1',
          staff_name: 'John Doe',
          station: 'RM Station 1',
          handed_over_by: 'Production Lead',
          handed_over_at: new Date(Date.now() - 3600000).toISOString(),
          status: 'active'
        }
      ]);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleScanDevice = async () => {
    try {
      setScanning(true);
      setError(null);
      
      // Simulate RFID scan - In production, this would interface with RFID hardware
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock scanned tag
      const mockTag = 'DEV-001';
      setScannedTag(mockTag);
      
      // Find the device
      const device = devices.find(d => d.device_tag === mockTag);
      if (device) {
        setSelectedDevice(device);
        if (device.status === 'assigned') {
          setError(`Device ${mockTag} is already assigned to ${device.last_assigned_to}`);
        }
      } else {
        setError(`Device with tag ${mockTag} not found in system`);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to scan device');
    } finally {
      setScanning(false);
    }
  };

  const handleManualTagEntry = (tag: string) => {
    setScannedTag(tag);
    const device = devices.find(d => d.device_tag === tag);
    if (device) {
      setSelectedDevice(device);
      if (device.status === 'assigned') {
        setError(`Device ${tag} is already assigned to ${device.last_assigned_to}`);
      } else {
        setError(null);
      }
    } else {
      setSelectedDevice(null);
      if (tag) setError(`Device with tag ${tag} not found`);
    }
  };

  const handleHandover = async () => {
    if (!selectedDevice || !selectedStaff) {
      setError('Please select both a device and a staff member');
      return;
    }

    if (selectedDevice.status === 'assigned') {
      setError('This device is already assigned. Please return it first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // API call: POST /api/devices/handover
      const handoverData = {
        device_id: selectedDevice.id,
        device_tag: selectedDevice.device_tag,
        staff_id: selectedStaff.id,
        staff_name: selectedStaff.full_name,
        station: selectedStaff.station,
        handed_over_by: user?.full_name,
        handed_over_at: new Date().toISOString()
      };

      console.log('Processing handover:', handoverData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(`Device ${selectedDevice.device_tag} successfully handed over to ${selectedStaff.full_name} at ${selectedStaff.station}`);
      
      // Reset form
      setSelectedDevice(null);
      setSelectedStaff(null);
      setScannedTag('');
      
      // Refresh data
      fetchData();

    } catch (err: any) {
      setError(err.message || 'Failed to process handover');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (handover: HandoverRecord) => {
    try {
      setLoading(true);
      
      // API call: POST /api/devices/return
      console.log('Processing return:', handover);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(`Device ${handover.device_tag} returned by ${handover.staff_name}`);
      fetchData();
      
    } catch (err: any) {
      setError(err.message || 'Failed to process return');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access device handover.</p>
      </div>
    );
  }

  return (
    <DeviceHandoverAccess fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl">🔒</span>
          <h2 className="text-xl font-semibold text-gray-700 mt-4">Access Denied</h2>
          <p className="text-gray-500 mt-2">You do not have permission to access device handover.</p>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Device RFID Handover</h1>
                <p className="text-indigo-100 mt-1">
                  Scan device RFID tag and link to assigned station staff
                </p>
              </div>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {[
                { id: 'handover', label: '📱 New Handover' },
                { id: 'active', label: '✅ Active Assignments' },
                { id: 'history', label: '📋 History' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Alerts */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center justify-between">
              <span>✅ {success}</span>
              <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">×</button>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center justify-between">
              <span>❌ {error}</span>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">×</button>
            </div>
          )}

          {/* New Handover Tab */}
          {activeTab === 'handover' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Step 1: Scan/Select Device */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Step 1: Scan Device RFID Tag
                </h3>
                
                {/* Scan Button */}
                <button
                  onClick={handleScanDevice}
                  disabled={scanning}
                  className="w-full py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 mb-4"
                >
                  {scanning ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">📡</span>
                      Scanning...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">📱</span>
                      Scan Device RFID Tag
                    </span>
                  )}
                </button>

                <div className="text-center text-gray-500 text-sm mb-4">— OR —</div>

                {/* Manual Entry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter Device Tag Manually
                  </label>
                  <input
                    type="text"
                    value={scannedTag}
                    onChange={(e) => handleManualTagEntry(e.target.value.toUpperCase())}
                    placeholder="e.g., DEV-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Selected Device Info */}
                {selectedDevice && (
                  <div className={`mt-4 p-4 rounded-lg border-2 ${
                    selectedDevice.status === 'available' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{selectedDevice.device_tag}</p>
                        <p className="text-sm text-gray-600">{selectedDevice.model}</p>
                        <p className="text-xs text-gray-500">SN: {selectedDevice.serial_number}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedDevice.status === 'available' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {selectedDevice.status.toUpperCase()}
                        </span>
                        {selectedDevice.battery_level && (
                          <p className="text-sm text-gray-600 mt-1">
                            🔋 {selectedDevice.battery_level}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Available Devices List */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Available Devices:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {devices.filter(d => d.status === 'available').map(device => (
                      <button
                        key={device.id}
                        onClick={() => {
                          setSelectedDevice(device);
                          setScannedTag(device.device_tag);
                          setError(null);
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedDevice?.id === device.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{device.device_tag}</span>
                          <span className="text-sm text-gray-500">{device.model}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2: Select Staff */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Step 2: Select Staff Member
                </h3>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {staff.filter(s => s.is_active && !s.has_device).map(member => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedStaff(member)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        selectedStaff?.id === member.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{member.full_name}</p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {member.station}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {staff.filter(s => s.is_active && !s.has_device).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl">👥</span>
                    <p className="mt-2">All active staff already have devices</p>
                  </div>
                )}

                {/* Selected Staff Info */}
                {selectedStaff && (
                  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <p className="font-semibold text-gray-800">{selectedStaff.full_name}</p>
                    <p className="text-sm text-gray-600">{selectedStaff.role} at {selectedStaff.station}</p>
                  </div>
                )}

                {/* Handover Button */}
                <button
                  onClick={handleHandover}
                  disabled={!selectedDevice || !selectedStaff || selectedDevice.status !== 'available' || loading}
                  className="w-full mt-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : '✅ Complete Handover'}
                </button>

                {/* Summary */}
                {selectedDevice && selectedStaff && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <p><strong>Summary:</strong></p>
                    <p>• Device: {selectedDevice.device_tag} ({selectedDevice.model})</p>
                    <p>• Assigned to: {selectedStaff.full_name}</p>
                    <p>• Station: {selectedStaff.station}</p>
                    <p>• Handed over by: {user?.full_name}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Assignments Tab */}
          {activeTab === 'active' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Active Device Assignments</h3>
                <p className="text-gray-500 text-sm mt-1">Currently assigned devices to staff</p>
              </div>
              
              <div className="divide-y">
                {activeHandovers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-6xl">📱</span>
                    <p className="mt-4">No active assignments</p>
                  </div>
                ) : (
                  activeHandovers.map((handover) => (
                    <div key={handover.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">📱</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{handover.device_tag}</p>
                          <p className="text-sm text-gray-600">
                            Assigned to: <strong>{handover.staff_name}</strong>
                          </p>
                          <p className="text-xs text-gray-500">
                            Station: {handover.station} • Since {new Date(handover.handed_over_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleReturn(handover)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                      >
                        🔄 Return Device
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Handover History</h3>
                <p className="text-gray-500 text-sm mt-1">Past device handovers and returns</p>
              </div>
              
              <div className="text-center py-12 text-gray-500">
                <span className="text-6xl">📋</span>
                <p className="mt-4">Handover history will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DeviceHandoverAccess>
  );
};

export default DeviceRFIDHandover;
