'use client';

import React, { useState, useEffect } from 'react';
import { clamflowAPI } from '../../../lib/clamflow-api';
import { User } from '../../../types/auth';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

interface RoleAuditState {
  users: User[];
  roleDistribution: { [key: string]: number };
  loading: boolean;
  error: string | null;
}

const RoleAudit: React.FC = () => {
  const [state, setState] = useState<RoleAuditState>({
    users: [],
    roleDistribution: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchRoleData();
  }, []);

  const fetchRoleData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await clamflowAPI.getAllUsers();
      
      if (response.success && response.data) {
        const users = response.data;
        const distribution = users.reduce((acc: { [key: string]: number }, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        
        setState({
          users,
          roleDistribution: distribution,
          loading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch role data',
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching role data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch role data',
        loading: false,
      }));
    }
  };

  const getRoleBadgeColor = (role: User['role']) => {
    const colors = {
      'Super Admin': 'bg-purple-100 text-purple-800',
      'Admin': 'bg-blue-100 text-blue-800',
      'Production Lead': 'bg-green-100 text-green-800',
      'QC Lead': 'bg-orange-100 text-orange-800',
      'Staff Lead': 'bg-indigo-100 text-indigo-800',
      'QC Staff': 'bg-yellow-100 text-yellow-800',
      'Production Staff': 'bg-gray-100 text-gray-800',
      'Security Guard': 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Role Management & Audit</h2>
        <Button onClick={fetchRoleData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {state.error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600">{state.error}</p>
        </Card>
      )}

      {/* Role Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Role Distribution</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(state.roleDistribution).map(([role, count]) => (
            <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <Badge className={getRoleBadgeColor(role as User['role'])}>
                {role}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Users by Role */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Users by Role</h3>
        <div className="space-y-4">
          {Object.keys(state.roleDistribution).map((role) => {
            const roleUsers = state.users.filter(user => user.role === role);
            return (
              <div key={role} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={getRoleBadgeColor(role as User['role'])}>
                    {role} ({roleUsers.length})
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {roleUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-xs text-gray-500">{user.username}</div>
                      </div>
                      <Badge variant={user.is_active ? 'success' : 'destructive'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Role Permissions Matrix */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Role Permissions Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Mgmt
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reports
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hardware
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { role: 'Super Admin', userMgmt: true, system: true, reports: true, hardware: true },
                { role: 'Admin', userMgmt: true, system: false, reports: true, hardware: true },
                { role: 'Production Lead', userMgmt: false, system: false, reports: true, hardware: false },
                { role: 'QC Lead', userMgmt: false, system: false, reports: true, hardware: false },
                { role: 'Staff Lead', userMgmt: false, system: false, reports: true, hardware: false },
                { role: 'QC Staff', userMgmt: false, system: false, reports: false, hardware: false },
                { role: 'Production Staff', userMgmt: false, system: false, reports: false, hardware: false },
                { role: 'Security Guard', userMgmt: false, system: false, reports: false, hardware: false },
              ].map((item) => (
                <tr key={item.role}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getRoleBadgeColor(item.role as User['role'])}>
                      {item.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Badge variant={item.userMgmt ? 'success' : 'secondary'}>
                      {item.userMgmt ? '✓' : '✗'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Badge variant={item.system ? 'success' : 'secondary'}>
                      {item.system ? '✓' : '✗'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Badge variant={item.reports ? 'success' : 'secondary'}>
                      {item.reports ? '✓' : '✗'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Badge variant={item.hardware ? 'success' : 'secondary'}>
                      {item.hardware ? '✓' : '✗'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default RoleAudit;