'use client';

import React, { useState, useEffect } from 'react';
import { clamflowAPI } from '../../../lib/clamflow-api';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

interface BackupStatus {
  id: string;
  type: 'database' | 'files' | 'full_system';
  status: 'completed' | 'failed' | 'in_progress';
  created_at: string;
  size: string;
  location: string;
}

const DisasterRecovery: React.FC = () => {
  const [backups, setBackups] = useState<BackupStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      const response = await clamflowAPI.getSystemHealth();
      
      if (response.success) {
        setSystemHealth(response.data);
        // Mock backup data for demonstration
        setBackups([
          {
            id: '1',
            type: 'database',
            status: 'completed',
            created_at: new Date().toISOString(),
            size: '2.5 GB',
            location: 'AWS S3'
          },
          {
            id: '2',
            type: 'files',
            status: 'completed',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            size: '1.2 GB',
            location: 'AWS S3'
          }
        ]);
      } else {
        setError(response.error || 'Failed to fetch system status');
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
      setError('Failed to fetch system status');
    } finally {
      setLoading(false);
    }
  };

  const initiateBackup = async (type: 'database' | 'files' | 'full_system') => {
    try {
      setLoading(true);
      // This would be a real API call to initiate backup
      // await clamflowAPI.initiateBackup(type);
      
      // Mock successful backup initiation
      alert(`${type} backup initiated successfully`);
      await fetchSystemStatus();
    } catch (error) {
      console.error('Error initiating backup:', error);
      alert('Failed to initiate backup');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'destructive';
      case 'in_progress': return 'warning';
      default: return 'secondary';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'database': return 'bg-blue-100 text-blue-800';
      case 'files': return 'bg-green-100 text-green-800';
      case 'full_system': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Disaster Recovery</h2>
        <Button onClick={fetchSystemStatus} variant="outline" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : 'Refresh'}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* System Health Overview */}
      {systemHealth && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Health Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">Overall Status</div>
              <Badge variant={systemHealth.status === 'healthy' ? 'success' : 'destructive'}>
                {systemHealth.status?.toUpperCase()}
              </Badge>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">Database</div>
              <Badge variant={systemHealth.database?.status === 'connected' ? 'success' : 'destructive'}>
                {systemHealth.database?.status?.toUpperCase()}
              </Badge>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">Response Time</div>
              <span className="text-sm text-gray-600">
                {systemHealth.database?.response_time}ms
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Backup Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Database Backup</h4>
            <p className="text-sm text-gray-600 mb-4">Backup all database tables and schemas</p>
            <Button
              onClick={() => initiateBackup('database')}
              disabled={loading}
              className="w-full"
            >
              Start Database Backup
            </Button>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Files Backup</h4>
            <p className="text-sm text-gray-600 mb-4">Backup uploaded files and documents</p>
            <Button
              onClick={() => initiateBackup('files')}
              disabled={loading}
              className="w-full"
            >
              Start Files Backup
            </Button>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Full System Backup</h4>
            <p className="text-sm text-gray-600 mb-4">Complete system backup including all data</p>
            <Button
              onClick={() => initiateBackup('full_system')}
              disabled={loading}
              className="w-full"
              variant="secondary"
            >
              Start Full Backup
            </Button>
          </div>
        </div>
      </Card>

      {/* Backup History */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Backups</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getTypeBadgeColor(backup.type)}>
                      {backup.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusBadgeColor(backup.status)}>
                      {backup.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(backup.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recovery Procedures */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recovery Procedures</h3>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Emergency Recovery Protocol</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
              <li>Assess the scope of the disaster</li>
              <li>Activate backup systems if available</li>
              <li>Identify the most recent valid backup</li>
              <li>Initiate recovery process from backup</li>
              <li>Verify data integrity after recovery</li>
              <li>Test all critical system functions</li>
              <li>Notify all stakeholders of recovery status</li>
            </ol>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">📞 Emergency Contacts</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>System Administrator:</strong> admin@clamflow.com</p>
              <p><strong>Database Admin:</strong> dba@clamflow.com</p>
              <p><strong>Infrastructure Team:</strong> infrastructure@clamflow.com</p>
              <p><strong>Emergency Hotline:</strong> +1-800-CLAMFLOW</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DisasterRecovery;