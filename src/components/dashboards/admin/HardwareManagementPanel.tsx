'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Label } from '@/components/ui/Label'
import { AlertCircle, Plus, Edit, Trash2, Cpu, Wifi, Activity, Search, HardDrive, Thermometer, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/Alert'

// Real API client
import { apiClient } from '@/lib/api-client'

// Define proper types instead of 'any'
export interface DeviceSpecifications {
  [key: string]: unknown;
}

export interface HealthMetrics {
  cpu_usage?: number;
  memory_usage?: number;
  temperature?: number;
  network_latency?: number;
  uptime_percentage?: number;
  error_count?: number;
}

interface HardwareDevice {
  id: string
  device_name: string
  device_type: string
  serial_number: string
  station_location: string
  status: 'online' | 'offline' | 'maintenance' | 'error' | 'warning'
  ip_address?: string
  mac_address?: string
  firmware_version?: string
  last_maintenance?: string
  next_maintenance?: string
  installation_date: string
  warranty_expiry?: string
  manufacturer?: string
  model?: string
  specifications?: DeviceSpecifications
  health_metrics?: HealthMetrics
}

interface HardwareStats {
  total_devices: number
  online_devices: number
  offline_devices: number
  maintenance_due: number
  critical_alerts: number
  by_type: Record<string, number>
  by_station: Record<string, number>
  average_uptime: number
}

// ✅ FIXED: Removed empty interface
// We don't need an interface if no props are used

// Custom Select component
const CustomSelect: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ value, onValueChange, children, className }) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    >
      {children}
    </select>
  );
};

// Custom Progress component
const CustomProgress: React.FC<{
  value: number;
  className?: string;
}> = ({ value, className }) => {
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-secondary ${className || ''}`}>
      <div 
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - Math.max(0, Math.min(100, value))}%)` }}
      />
    </div>
  );
};

// DeviceForm component definition
interface DeviceFormProps {
  onSubmit: (deviceData: Partial<HardwareDevice>) => Promise<void>
  onCancel: () => void
  device?: HardwareDevice
}

const DeviceForm: React.FC<DeviceFormProps> = ({ onSubmit, onCancel, device }) => {
  const [formData, setFormData] = useState({
    device_name: device?.device_name || '',
    device_type: device?.device_type || '',
    serial_number: device?.serial_number || '',
    station_location: device?.station_location || '',
    status: device?.status || 'offline',
    ip_address: device?.ip_address || '',
    mac_address: device?.mac_address || '',
    firmware_version: device?.firmware_version || '',
    manufacturer: device?.manufacturer || '',
    model: device?.model || '',
    installation_date: device?.installation_date || new Date().toISOString().split('T')[0],
    warranty_expiry: device?.warranty_expiry || ''
  })

  const deviceTypes = [
    'RFID Reader', 'Scale', 'Temperature Sensor', 'pH Meter',
    'Biometric Scanner', 'Camera', 'Barcode Scanner', 'PLC Controller',
    'Network Switch', 'Gateway', 'Tablet', 'Printer', 'Environmental Sensor'
  ]

  const stations = [
    'Receiving Station', 'Pre-Processing Station', 'Processing Station',
    'Quality Control Station', 'Packaging Station', 'Storage Station',
    'Shipping Station', 'Maintenance Station', 'Security Station'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="device_name">Device Name</Label>
          <Input
            id="device_name"
            value={formData.device_name}
            onChange={(e) => setFormData(prev => ({ ...prev, device_name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="device_type">Device Type</Label>
          <CustomSelect 
            value={formData.device_type} 
            onValueChange={(value: string) => setFormData(prev => ({ ...prev, device_type: value }))}
          >
            <option value="">Select Device Type</option>
            {deviceTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </CustomSelect>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="serial_number">Serial Number</Label>
          <Input
            id="serial_number"
            value={formData.serial_number}
            onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="station_location">Station</Label>
          <CustomSelect 
            value={formData.station_location} 
            onValueChange={(value: string) => setFormData(prev => ({ ...prev, station_location: value }))}
          >
            <option value="">Select Station</option>
            {stations.map(station => (
              <option key={station} value={station}>{station}</option>
            ))}
          </CustomSelect>
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {device ? 'Update Device' : 'Create Device'}
        </Button>
      </div>
    </form>
  )
}

export default function HardwareManagementPanel() {
  const [devices, setDevices] = useState<HardwareDevice[]>([])
  const [stats, setStats] = useState<HardwareStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedDevice, setSelectedDevice] = useState<HardwareDevice | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const deviceTypes = [
    'RFID Reader', 'Scale', 'Temperature Sensor', 'pH Meter',
    'Biometric Scanner', 'Camera', 'Barcode Scanner', 'PLC Controller',
    'Network Switch', 'Gateway', 'Tablet', 'Printer', 'Environmental Sensor'
  ]

  const statusTypes = ['online', 'offline', 'maintenance', 'error', 'warning']

  // Memoize functions to avoid unnecessary re-renders
  const loadDevices = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/hardware/devices')
      
      // Fixed: Type assertion to resolve 'unknown' error
      const data = response.data as { devices: HardwareDevice[] } | null
      setDevices(data?.devices || [])
    } catch (err) {
      setError('Failed to load hardware devices')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadHardwareStats = async () => {
    try {
      const response = await apiClient.get('/hardware/stats')
      
      // Fixed: Type assertion to resolve 'unknown' error
      const data = response.data as HardwareStats
      setStats(data)
    } catch (err) {
      console.error('Failed to load hardware statistics:', err)
    }
  }

  useEffect(() => {
    loadDevices()
    loadHardwareStats()
    
    // Set up real-time monitoring
    const interval = setInterval(() => {
      loadDevices()
      loadHardwareStats()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const handleCreateDevice = async (deviceData: Partial<HardwareDevice>) => {
    try {
      await apiClient.post('/hardware/devices', deviceData)
      setIsCreateDialogOpen(false)
      loadDevices()
      loadHardwareStats()
    } catch (err) {
      setError('Failed to create device')
      console.error(err)
    }
  }

  const handleUpdateDevice = async (deviceId: string, deviceData: Partial<HardwareDevice>) => {
    try {
      await apiClient.put(`/hardware/devices/${deviceId}`, deviceData)
      setIsEditDialogOpen(false)
      setSelectedDevice(null)
      loadDevices()
      loadHardwareStats()
    } catch (err) {
      setError('Failed to update device')
      console.error(err)
    }
  }

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return
    
    try {
      await apiClient.delete(`/hardware/devices/${deviceId}`)
      loadDevices()
      loadHardwareStats()
    } catch (err) {
      setError('Failed to delete device')
      console.error(err)
    }
  }

  const handleRebootDevice = async (deviceId: string) => {
    try {
      await apiClient.post(`/hardware/devices/${deviceId}/reboot`)
      loadDevices()
    } catch (err) {
      setError('Failed to reboot device')
      console.error(err)
    }
  }

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.station_location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || device.device_type === filterType
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online': return 'bg-green-500'
      case 'offline': return 'bg-red-500'
      case 'maintenance': return 'bg-yellow-500'
      case 'error': return 'bg-red-600'
      case 'warning': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getHealthColor = (value: number) => {
    if (value >= 80) return 'text-green-600'
    if (value >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">Loading hardware management panel...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Hardware Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Devices</p>
                  <p className="text-2xl font-bold">{stats.total_devices}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Wifi className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Online</p>
                  <p className="text-2xl font-bold text-green-600">{stats.online_devices}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Uptime</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.average_uptime.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical_alerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hardware Management Interface */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5" />
              <span>Hardware Management</span>
            </CardTitle>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register New Hardware Device</DialogTitle>
                </DialogHeader>
                <DeviceForm onSubmit={handleCreateDevice} onCancel={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <CustomSelect value={filterType} onValueChange={setFilterType} className="w-[180px]">
              <option value="all">All Types</option>
              {deviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </CustomSelect>
            
            <CustomSelect value={filterStatus} onValueChange={setFilterStatus} className="w-[180px]">
              <option value="all">All Status</option>
              {statusTypes.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </CustomSelect>
          </div>

          {/* Devices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDevices.map(device => (
              <Card key={device.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-medium">{device.device_name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{device.device_type}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`} />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serial:</span>
                      <span className="font-mono">{device.serial_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Station:</span>
                      <span>{device.station_location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                        {device.status}
                      </Badge>
                    </div>
                  </div>

                  {device.health_metrics && (
                    <div className="space-y-2">
                      {device.health_metrics.cpu_usage && (
                        <div className="flex items-center space-x-2 text-xs">
                          <Cpu className="h-3 w-3" />
                          <span>CPU:</span>
                          <CustomProgress value={device.health_metrics.cpu_usage} className="flex-1 h-1" />
                          <span className={getHealthColor(100 - device.health_metrics.cpu_usage)}>
                            {device.health_metrics.cpu_usage}%
                          </span>
                        </div>
                      )}
                      
                      {device.health_metrics.memory_usage && (
                        <div className="flex items-center space-x-2 text-xs">
                          <HardDrive className="h-3 w-3" />
                          <span>MEM:</span>
                          <CustomProgress value={device.health_metrics.memory_usage} className="flex-1 h-1" />
                          <span className={getHealthColor(100 - device.health_metrics.memory_usage)}>
                            {device.health_metrics.memory_usage}%
                          </span>
                        </div>
                      )}
                      
                      {device.health_metrics.temperature && (
                        <div className="flex items-center space-x-2 text-xs">
                          <Thermometer className="h-3 w-3" />
                          <span>TEMP:</span>
                          <span className={getHealthColor(device.health_metrics.temperature > 70 ? 0 : 100)}>
                            {device.health_metrics.temperature}°C
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedDevice(device)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteDevice(device.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleRebootDevice(device.id)}
                      disabled={device.status === 'offline'}
                    >
                      <Zap className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Hardware Device</DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <DeviceForm 
              device={selectedDevice}
              onSubmit={(data) => handleUpdateDevice(selectedDevice.id, data)} 
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedDevice(null)
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}