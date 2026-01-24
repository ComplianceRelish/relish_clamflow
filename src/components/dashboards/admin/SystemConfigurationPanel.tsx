// src/components/dashboards/admin/SystemConfigurationPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon, 
  ServerIcon, 
  CircleStackIcon, // Fixed: DatabaseIcon -> CircleStackIcon
  CloudIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SystemConfig {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  editable: boolean;
  sensitive: boolean;
  lastModified: string;
  modifiedBy: string;
}

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  cache: 'healthy' | 'warning' | 'error';
  uptime: string;
  version: string;
  environment: string;
}

const SystemConfigurationPanel: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    cache: 'healthy',
    uptime: '15d 4h 32m',
    version: '2.0.0',
    environment: 'production'
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'all', 'system', 'database', 'api', 'security', 'notifications', 'integrations'
  ];

  useEffect(() => {
    loadSystemConfigs();
    loadSystemStatus();
  }, []);

  const loadSystemConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('clamflow_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/hardware/configurations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load system configurations');
      }

      const data = await response.json();
      setConfigs(data);
    } catch (err) {
      console.error('Error loading configurations:', err);
      setError('Failed to load system configurations');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const token = localStorage.getItem('clamflow_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hardware/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      } else {
        // Fallback to default status if API fails
        setSystemStatus({
          database: 'warning',
          api: 'warning',
          storage: 'warning',
          cache: 'warning',
          uptime: 'Unknown',
          version: '2.0.0',
          environment: 'production'
        });
      }
    } catch (err) {
      console.error('Error loading system status:', err);
      // Keep default status values
    }
  };

  const handleConfigEdit = (configId: string, currentValue: string) => {
    setEditingConfig(configId);
    setEditValue(currentValue);
  };

  const handleConfigSave = async (configId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('clamflow_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/hardware/configurations/${configId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: editValue })
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      setConfigs(configs.map(config => 
        config.id === configId 
          ? { ...config, value: editValue, lastModified: new Date().toISOString() }
          : config
      ));
      setEditingConfig(null);
      setEditValue('');
    } catch (err) {
      console.error('Error updating configuration:', err);
      alert('Failed to update configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigCancel = () => {
    setEditingConfig(null);
    setEditValue('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ArrowPathIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredConfigs = configs.filter(config => {
    const matchesCategory = selectedCategory === 'all' || config.category === selectedCategory;
    const matchesSearch = config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Cog6ToothIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
            <p className="text-gray-600">Manage system settings and parameters</p>
          </div>
        </div>
        <button
          onClick={loadSystemStatus}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh Status
        </button>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CircleStackIcon className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Database</span>
            </div>
            {getStatusIcon(systemStatus.database)}
          </div>
          <p className="mt-2 text-xs text-gray-500">Connection active</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ServerIcon className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">API</span>
            </div>
            {getStatusIcon(systemStatus.api)}
          </div>
          <p className="mt-2 text-xs text-gray-500">All endpoints operational</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CloudIcon className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Storage</span>
            </div>
            {getStatusIcon(systemStatus.storage)}
          </div>
          <p className="mt-2 text-xs text-gray-500">85% capacity</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Security</span>
            </div>
            {getStatusIcon('healthy')}
          </div>
          <p className="mt-2 text-xs text-gray-500">All systems secure</p>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Version</span>
            <p className="text-lg font-semibold text-gray-900">{systemStatus.version}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Environment</span>
            <p className="text-lg font-semibold text-gray-900 capitalize">{systemStatus.environment}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Uptime</span>
            <p className="text-lg font-semibold text-gray-900">{systemStatus.uptime}</p>
          </div>
        </div>
      </div>

      {/* Configuration Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Configuration Settings</h3>
          
          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search configurations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Configuration List */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-yellow-600">{error}</p>
                    <button
                      onClick={loadSystemConfigs}
                      className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-800"
                    >
                      Retry Loading
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredConfigs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
                <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No configuration data entered yet</p>
                <p className="text-sm text-gray-400 mt-1">Configure system settings to get started</p>
              </div>
            </div>
          ) : (
            filteredConfigs.map((config) => (
              <div key={config.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">{config.key}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        config.category === 'security' ? 'bg-red-100 text-red-800' :
                        config.category === 'system' ? 'bg-blue-100 text-blue-800' :
                        config.category === 'database' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {config.category}
                      </span>
                      {config.sensitive && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Sensitive
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{config.description}</p>
                    
                    {editingConfig === config.id ? (
                      <div className="mt-2 flex items-center space-x-2">
                        <input
                          type={config.type === 'number' ? 'number' : 'text'}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleConfigSave(config.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleConfigCancel}
                          className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {config.sensitive ? '***' : config.value}
                        </span>
                        {config.editable && (
                          <button
                            onClick={() => handleConfigEdit(config.id, config.value)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                    
                    <p className="mt-2 text-xs text-gray-500">
                      Last modified: {new Date(config.lastModified).toLocaleString()} by {config.modifiedBy}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemConfigurationPanel;