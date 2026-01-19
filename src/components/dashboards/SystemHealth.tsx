'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import clamflowAPI from '../../lib/clamflow-api';
import type { SystemHealthData } from '../../types/dashboard';

interface HardwareStatus {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  last_ping: string;
  ip_address: string;
}

const SystemHealth: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const healthRes = await clamflowAPI.getSystemHealth();
        
        if (healthRes.success && healthRes.data) {
          setHealthData(healthRes.data);
        }
        
        // Hardware status is optional - some deployments may not have it
        try {
          const hardwareRes = await clamflowAPI.get('/api/hardware/status');
          if (hardwareRes.success && hardwareRes.data) {
            const data = Array.isArray(hardwareRes.data) ? hardwareRes.data : [];
            setHardwareStatus(data);
          }
        } catch {
          // Hardware status not available
          setHardwareStatus([]);
        }
      } catch (err) {
        setError('Failed to fetch system health data');
        console.error('Error fetching system health:', err);
        setHealthData(null);
        setHardwareStatus([]);
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
          <div className="text-center py-4">
            <div className="text-red-500 text-2xl mb-2">⚠️</div>
            <p className="text-red-600 font-medium">{error || 'Unable to load system health data'}</p>
            <p className="text-gray-500 text-sm mt-1">Please check your connection and try again</p>
          </div>
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
        return 'text-gray-600 bg-gray-50';
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
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(healthData.status || 'unknown')}`}>
            {(healthData.status || 'UNKNOWN').toUpperCase()}
          </span>
        </div>

        {/* Database Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Database</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(healthData.database?.status || 'unknown')}`}>
            {(healthData.database?.status || 'UNKNOWN').toUpperCase()}
          </span>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Database Response</div>
            <div className="text-lg font-semibold">{healthData.database?.response_time || 0}ms</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">System Uptime</div>
            <div className="text-lg font-semibold">{healthData.uptime || '-'}</div>
          </div>
        </div>

        {/* Services Status */}
        {healthData.services && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Services</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Authentication:</span>
                <span className={healthData.services.authentication ? 'text-green-600' : 'text-red-600'}>
                  {healthData.services.authentication ? '✓ Online' : '✗ Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">API:</span>
                <span className={healthData.services.api ? 'text-green-600' : 'text-red-600'}>
                  {healthData.services.api ? '✓ Online' : '✗ Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Database:</span>
                <span className={healthData.services.database ? 'text-green-600' : 'text-red-600'}>
                  {healthData.services.database ? '✓ Online' : '✗ Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hardware:</span>
                <span className={healthData.services.hardware ? 'text-green-600' : 'text-red-600'}>
                  {healthData.services.hardware ? '✓ Online' : '✗ Offline'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Hardware Status */}
        {hardwareStatus.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Hardware Status</h4>
            <div className="space-y-2">
              {hardwareStatus.slice(0, 5).map((hardware) => (
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
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealth;
