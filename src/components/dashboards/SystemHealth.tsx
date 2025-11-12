'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card'; // ✅ FIXED: Use consistent casing
import LoadingSpinner from '../ui/LoadingSpinner';
import { clamflowAPI } from '../../lib/clamflow-api'; // ✅ FIXED: Use consistent API
import type { SystemHealthData } from '../../types/auth';

const SystemHealth: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const [health, hardware] = await Promise.all([
          clamflowAPI.dashboard.getSystemHealth(), // ✅ FIXED: Use clamflowAPI
          clamflowAPI.dashboard.getHardwareStatus()
        ]);
        setHealthData(health);
        setHardwareStatus(hardware);
      } catch (err) {
        setError('Failed to fetch system health data');
        console.error('Error fetching system health:', err);
        
        // ✅ FALLBACK DATA with correct SystemHealthData structure
        setHealthData({
          overall_status: 'healthy',
          database_status: 'connected',
          api_response_time: 45,
          active_users: 12,
          memory_usage: 45,
          cpu_usage: 23,
          last_backup: new Date().toISOString(),
          uptime: &quot;2h 15m&quot;
        });
        
        setHardwareStatus([
          { id: '1', name: 'Scale #1', type: 'scale', status: 'online', location: 'Station A', last_ping: new Date().toISOString(), ip_address: '192.168.1.10' },
          { id: '2', name: 'QR Scanner', type: 'scanner', status: 'online', location: 'QC Lab', last_ping: new Date().toISOString(), ip_address: '192.168.1.11' },
          { id: '3', name: 'Gate Printer', type: 'printer', status: 'maintenance', location: 'Gate', last_ping: new Date().toISOString(), ip_address: &apos;192.168.1.12&apos; }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemHealth();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error || !healthData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500">{error || &apos;No health data available&apos;}</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'connected': 
        return 'text-green-600 bg-green-50';
      case 'warning':
      case 'slow':
      case 'maintenance': 
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
      case 'offline':
      case 'disconnected': 
        return 'text-red-600 bg-red-50';
      default: 
        return &apos;text-gray-600 bg-gray-50&apos;;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ClamFlow System Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Overall Status</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(healthData.overall_status)}`}>
            {healthData.overall_status.toUpperCase()}
          </span>
        </div>

        {/* Database Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Database</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(healthData.database_status)}`}>
            {healthData.database_status.toUpperCase()}
          </span>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">CPU Usage</div>
            <div className="text-lg font-semibold">{healthData.cpu_usage}%</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Memory Usage</div>
            <div className="text-lg font-semibold">{healthData.memory_usage}%</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Active Users</div>
            <div className="text-lg font-semibold">{healthData.active_users}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">API Response</div>
            <div className="text-lg font-semibold">{healthData.api_response_time}ms</div>
          </div>
        </div>

        {/* System Info */}
        <div className="border-t pt-4">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Uptime:</span>
              <span className="font-medium">{healthData.uptime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Backup:</span>
              <span className="font-medium">{new Date(healthData.last_backup).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Hardware Status */}
        <div>
          <h4 className="font-medium mb-2">Hardware Status</h4>
          <div className="space-y-2">
            {hardwareStatus.slice(0, 3).map((hardware) => (
              <div key={hardware.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{hardware.name}</span>
                  <span className="text-gray-500 ml-1">({hardware.location})</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(hardware.status)}`}>
                  {hardware.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealth;