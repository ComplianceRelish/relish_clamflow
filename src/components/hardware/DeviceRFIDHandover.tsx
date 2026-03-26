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
      setError(null);

      // Fetch real staff from backend
      const staffResponse = await clamflowAPI.getStaff();
      if (staffResponse.success && staffResponse.data) {
        const mappedStaff: StaffMember[] = staffResponse.data.map((person: any) => ({
          id: person.id || person.personId || person.person_id || '',
          full_name: person.fullName || person.full_name || `${person.firstName || person.first_name || ''} ${person.lastName || person.last_name || ''}`.trim() || 'Unknown',
          role: person.role || person.designation || '',
          station: person.station || person.currentStation || person.current_station || 'Unassigned',
          is_active: (person.isActive ?? person.is_active) !== false,
          has_device: false, // Will be updated when device assignments are loaded
          current_device: undefined
        }));
        setStaff(mappedStaff);
      } else {
        setStaff([]);
      }

      // Fetch devices from backend (if endpoint exists)
      try {
        const devicesResponse = await clamflowAPI.getRFIDTags();
        if (devicesResponse.success && devicesResponse.data) {
          const mappedDevices: RFIDDevice[] = devicesResponse.data.map((tag: any) => ({
            id: tag.id || '',
            device_tag: tag.tagId || tag.tag_id || tag.deviceTag || tag.device_tag || '',
            device_type: tag.deviceType || tag.device_type || 'handheld',
            model: tag.model || tag.description || '',
            serial_number: tag.serialNumber || tag.serial_number || '',
            status: tag.status === 'active' || tag.status === 'assigned' ? 'assigned' : 'available',
            last_assigned_to: tag.assignedTo || tag.assigned_to || undefined,
            last_assigned_at: tag.assignedAt || tag.assigned_at || undefined,
            battery_level: tag.batteryLevel || tag.battery_level || undefined
          }));
          setDevices(mappedDevices);

          // Update staff has_device based on active assignments
          const assignedStaffIds = new Set(
            mappedDevices
              .filter(d => d.status === 'assigned' && d.last_assigned_to)
              .map(d => d.last_assigned_to)
          );
          setStaff(prev => prev.map(s => ({
            ...s,
            has_device: assignedStaffIds.has(s.id) || assignedStaffIds.has(s.full_name)
          })));
        } else {
          setDevices([]);
        }
      } catch {
        // Device endpoint may not exist yet - show empty state
        console.info('Device endpoint not available yet');
        setDevices([]);
      }

      // Fetch active handovers (if endpoint exists)
      try {
        const handoverResponse = await clamflowAPI.get('/api/devices/handovers?status=active');
        if (handoverResponse.success && handoverResponse.data) {
          setActiveHandovers(Array.isArray(handoverResponse.data) ? handoverResponse.data : []);
        } else {
          setActiveHandovers([]);
        }
      } catch {
        console.info('Handover endpoint not available yet');
        setActiveHandovers([]);
      }

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load data from server');
    } finally {
      setLoading(false);
    }
  };

  const handleScanDevice = async () => {
    try {
      setScanning(true);
      setError(null);
      
      // Call backend RFID scan endpoint
      // The physical RFID reader should be connected and this triggers a read
      const response = await clamflowAPI.scanRFIDTag('scan');
      
      if (response.success && response.data) {
        const tag = (response.data as any).tagId || (response.data as any).tag_id || (response.data as any).device_tag || '';
        setScannedTag(tag);
        
        const device = devices.find(d => d.device_tag === tag);
        if (device) {
          setSelectedDevice(device);
          if (device.status === 'assigned') {
            setError(`Device ${tag} is already assigned to ${device.last_assigned_to}`);
          }
        } else {
          setError(`Device with tag ${tag} not found in system. Register it first.`);
        }
      } else {
        setError('No RFID tag detected. Ensure the reader is connected and the device tag is in range.');
      }
      
    } catch (err: any) {
      setError('RFID reader not available. Use manual tag entry instead.');
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

      const handoverData = {
        device_id: selectedDevice.id,
        device_tag: selectedDevice.device_tag,
        staff_id: selectedStaff.id,
        staff_name: selectedStaff.full_name,
        station: selectedStaff.station,
        handed_over_by: user?.full_name || user?.username || 'Unknown',
        handed_over_at: new Date().toISOString()
      };

      const response = await clamflowAPI.post('/api/devices/handover', handoverData);
      
      if (response.success) {
        setSuccess(`Device ${selectedDevice.device_tag} successfully handed over to ${selectedStaff.full_name} at ${selectedStaff.station}`);
      } else {
        throw new Error(response.error || 'Handover failed');
      }
      
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
      setError(null);
      
      const response = await clamflowAPI.post('/api/devices/return', {
        handover_id: handover.id,
        device_id: handover.device_id,
        device_tag: handover.device_tag,
        returned_by: user?.full_name || user?.username || 'Unknown',
        returned_at: new Date().toISOString()
      });
      
      if (response.success) {
        setSuccess(`Device ${handover.device_tag} returned by ${handover.staff_name}`);
        fetchData();
      } else {
        throw new Error(response.error || 'Return failed');
      }
      
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
                    {devices.filter(d => d.status === 'available').length === 0 ? (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        {devices.length === 0 
                          ? 'No devices registered in the system yet' 
                          : 'All devices are currently assigned'}
                      </div>
                    ) : (
                      devices.filter(d => d.status === 'available').map(device => (
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
                    ))
                    )}
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
              
              {(() => {
                // History loaded in fetchData; for now show from activeHandovers with returned status
                const history = activeHandovers.filter(h => h.status === 'returned');
                if (history.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <span className="text-6xl">📋</span>
                      <p className="mt-4">No handover history yet</p>
                    </div>
                  );
                }
                return (
                  <div className="divide-y">
                    {history.map((h) => (
                      <div key={h.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">📋</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{h.device_tag} → {h.staff_name}</p>
                            <p className="text-sm text-gray-500">
                              {h.station} • Returned {h.returned_at ? new Date(h.returned_at).toLocaleString() : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </DeviceHandoverAccess>
  );
};

export default DeviceRFIDHandover;
