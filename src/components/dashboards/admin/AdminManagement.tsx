'use client';

import React, { useState, useEffect } from 'react';
import { clamflowAPI } from '../../../lib/clamflow-api';
import { User } from '../../../types/auth';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { FormField } from '../../ui/FormField';
import { FormSelect } from '../../ui/FormSelect';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

interface AdminManagementState {
  users: User[];
  loading: boolean;
  error: string | null;
  selectedUser: User | null;
  showCreateModal: boolean;
  showEditModal: boolean;
}

const AdminManagement: React.FC = () => {
  const [state, setState] = useState<AdminManagementState>({
    users: [],
    loading: true,
    error: null,
    selectedUser: null,
    showCreateModal: false,
    showEditModal: false,
  });

  const [newUser, setNewUser] = useState({
    username: '',
    full_name: '',
    role: 'Production Staff' as User['role'],
    station: '',
    password: '',
  });

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await clamflowAPI.getAllUsers();
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          users: response.data || [],
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch users',
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch users',
        loading: false,
      }));
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await clamflowAPI.createUser(newUser);
      
      if (response.success) {
        await fetchUsers();
        setState(prev => ({ ...prev, showCreateModal: false }));
        setNewUser({
          username: '',
          full_name: '',
          role: 'Production Staff',
          station: '',
          password: '',
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = async () => {
    if (!state.selectedUser) return;
    
    try {
      const response = await clamflowAPI.updateUser(state.selectedUser.id, state.selectedUser);
      
      if (response.success) {
        await fetchUsers();
        setState(prev => ({ ...prev, showEditModal: false, selectedUser: null }));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await clamflowAPI.deleteUser(userId);
      
      if (response.success) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <Button onClick={() => setState(prev => ({ ...prev, showCreateModal: true }))}>
          Add New User
        </Button>
      </div>

      {/* Error Message */}
      {state.error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600">{state.error}</p>
        </Card>
      )}

      {/* Users Table */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Station
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500">{user.username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.station || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.is_active ? 'success' : 'destructive'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setState(prev => ({ 
                        ...prev, 
                        selectedUser: user, 
                        showEditModal: true 
                      }))}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={state.showCreateModal}
        onClose={() => setState(prev => ({ ...prev, showCreateModal: false }))}
        title="Create New User"
      >
        <div className="space-y-4">
          <FormField
            label="Username"
            value={newUser.username}
            onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
            placeholder="Enter username"
          />
          <FormField
            label="Full Name"
            value={newUser.full_name}
            onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Enter full name"
          />
          <FormSelect
            label="Role"
            value={newUser.role}
            onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as User['role'] }))}
            options={[
              { value: 'Super Admin', label: 'Super Admin' },
              { value: 'Admin', label: 'Admin' },
              { value: 'Production Lead', label: 'Production Lead' },
              { value: 'QC Lead', label: 'QC Lead' },
              { value: 'Staff Lead', label: 'Staff Lead' },
              { value: 'QC Staff', label: 'QC Staff' },
              { value: 'Production Staff', label: 'Production Staff' },
              { value: 'Security Guard', label: 'Security Guard' },
            ]}
          />
          <FormField
            label="Station"
            value={newUser.station}
            onChange={(e) => setNewUser(prev => ({ ...prev, station: e.target.value }))}
            placeholder="Enter station (optional)"
          />
          <FormField
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Enter password"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setState(prev => ({ ...prev, showCreateModal: false }))}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={state.showEditModal}
        onClose={() => setState(prev => ({ ...prev, showEditModal: false }))}
        title="Edit User"
      >
        {state.selectedUser && (
          <div className="space-y-4">
            <FormField
              label="Full Name"
              value={state.selectedUser.full_name}
              onChange={(e) => setState(prev => ({
                ...prev,
                selectedUser: prev.selectedUser ? {
                  ...prev.selectedUser,
                  full_name: e.target.value
                } : null
              }))}
            />
            <FormSelect
              label="Role"
              value={state.selectedUser.role}
              onChange={(e) => setState(prev => ({
                ...prev,
                selectedUser: prev.selectedUser ? {
                  ...prev.selectedUser,
                  role: e.target.value as User['role']
                } : null
              }))}
              options={[
                { value: 'Super Admin', label: 'Super Admin' },
                { value: 'Admin', label: 'Admin' },
                { value: 'Production Lead', label: 'Production Lead' },
                { value: 'QC Lead', label: 'QC Lead' },
                { value: 'Staff Lead', label: 'Staff Lead' },
                { value: 'QC Staff', label: 'QC Staff' },
                { value: 'Production Staff', label: 'Production Staff' },
                { value: 'Security Guard', label: 'Security Guard' },
              ]}
            />
            <FormField
              label="Station"
              value={state.selectedUser.station || ''}
              onChange={(e) => setState(prev => ({
                ...prev,
                selectedUser: prev.selectedUser ? {
                  ...prev.selectedUser,
                  station: e.target.value
                } : null
              }))}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setState(prev => ({ ...prev, showEditModal: false }))}
              >
                Cancel
              </Button>
              <Button onClick={handleEditUser}>Update User</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminManagement;