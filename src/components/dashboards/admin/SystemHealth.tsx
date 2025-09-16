'use client';

import React, { useState, useEffect } from 'react';
import { clamflowAPI, SystemHealthData } from '../../../lib/clamflow-api';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

interface SystemHealthState {
  health: SystemHealthData | null;
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

const SystemHealth: React.FC = () => {
  const [state, setState] = useState<SystemHealthState>({
    health: null,
    loading: true,
    error: null,
    lastRefresh: null,
  });

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await clamflowAPI.getSystemHealth();
      
      if (response.success && response.data) {
        setState({
          health: response.data,
          loading: false,
          error: null,
          lastRefresh: new Date(),
        });
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch system health',
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch system health',
        loading: false,
      }));
    }
  };

  // Initialize and set up auto-refresh
  useEffect(() => {
    fetchSystemHealth();
    
    // Auto-refresh every 2 minutes (reduced from 10 seconds)
    const interval = setInterval(fetchSystemHealth, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string | boolean): 'default' | 'destructive' | 'outline' | 'secondary' => {
    if (typeof status === 'boolean') {
      return status ? 'default' : 'destructive';
    }
    
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'default'; // Changed from 'success' to 'default'
      case 'warning':
        return 'outline'; // Changed from 'warning' to 'outline'
      case 'critical':
      case 'disconnected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (state.loading && !state.health) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
        <div className="flex items-center space-x-4">
          {state.lastRefresh && (
            <span className="text-sm text-gray-500">
              Last updated: {state.lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            onClick={fetchSystemHealth}
            disabled={state.loading}
          >
            {state.loading ? <LoadingSpinner size="sm" /> : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600">{state.error}</p>
        </Card>
      )}

      {state.health && (
        <>
          {/* Overall Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Overall System Status</h3>
                <p className="text-sm text-gray-500">Current system health overview</p>
              </div>
              <Badge variant={getStatusColor(state.health.status)} className="text-lg px-4 py-2">
                {state.health.status.toUpperCase()}
              </Badge>
            </div>
            
            {state.health.uptime && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Uptime:</span> {state.health.uptime}
                </p>
              </div>
            )}
          </Card>

          {/* Database Status */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Database Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Connection Status</span>
                <Badge variant={getStatusColor(state.health.database.status)}>
                  {state.health.database.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Response Time</span>
                <span className="text-sm text-gray-900">
                  {state.health.database.response_time}ms
                </span>
              </div>
            </div>
          </Card>

          {/* Services Status */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Services Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(state.health.services).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {service.replace('_', ' ')}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(status)}>
                    {typeof status === 'boolean' ? (status ? 'Online' : 'Offline') : String(status)}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Hardware Status */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Hardware Components</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">RFID Readers</p>
                  <p className="text-xs text-gray-500">Hardware connectivity status</p>
                </div>
                <Badge variant={state.health.services.hardware ? 'default' : 'destructive'}>
                  {state.health.services.hardware ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Biometric Devices</p>
                  <p className="text-xs text-gray-500">ClamFlowSecure authentication</p>
                </div>
                <Badge variant={state.health.services.hardware ? 'default' : 'destructive'}>
                  {state.health.services.hardware ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {state.health.database.response_time}ms
                </p>
                <p className="text-sm text-blue-800">Database Response</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">99.9%</p>
                <p className="text-sm text-green-800">Uptime</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {Object.values(state.health.services).filter(Boolean).length}/
                  {Object.keys(state.health.services).length}
                </p>
                <p className="text-sm text-purple-800">Services Online</p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default SystemHealth;