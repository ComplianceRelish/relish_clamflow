'use client';

import React, { useState, useEffect } from 'react';
import { clamflowAPI } from '../../../lib/clamflow-api';
import { User } from '../../../types/auth';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

interface UserManagementProps {
  title: string;
  onClose: () => void;
}

interface UserManagementState {
  users: User[];
  loading: boolean;
  error: string | null;
  selectedUser: User | null;
  showCreateModal: boolean;
  showEditModal: boolean;
  searchTerm: string;
  filterRole: string;
}

const UserManagementPanel: React.FC<UserManagementProps> = ({ title, onClose }) => {
  const [state, setState] = useState<UserManagementState>({
    users: [],
    loading: true,
    error: null,
    selectedUser: null,
    showCreateModal: false,
    showEditModal: false,
    searchTerm: '',
    filterRole: '',
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

  // Filter users based on search and role filter
  const filteredUsers = state.users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(state.searchTerm.toLowerCase());
    const matchesRole = !state.filterRole || user.role === state.filterRole;
    return matchesSearch && matchesRole;
  });

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

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search users..."
            value={state.searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="flex-1"
          />
          <select
            value={state.filterRole}
            onChange={(e) => setState(prev => ({ ...prev, filterRole: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="Production Lead">Production Lead</option>
            <option value="QC Lead">QC Lead</option>
            <option value="Staff Lead">Staff Lead</option>
            <option value="QC Staff">QC Staff</option>
            <option value="Production Staff">Production Staff</option>
            <option value="Security Guard">Security Guard</option>
          </select>
        </div>
      </Card>

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
              {filteredUsers.map((user) => (
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

      {filteredUsers.length === 0 && !state.loading && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No users found matching your criteria.</p>
        </Card>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={state.showCreateModal}
        onClose={() => setState(prev => ({ ...prev, showCreateModal: false }))}
        title="Create New User"
      >
        <div className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <Input
              value={newUser.username}
              onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter username"
              className="w-full"
            />
          </div>

          {/* Full Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <Input
              value={newUser.full_name}
              onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter full name"
              className="w-full"
            />
          </div>

          {/* Role Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as User['role'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Production Lead">Production Lead</option>
              <option value="QC Lead">QC Lead</option>
              <option value="Staff Lead">Staff Lead</option>
              <option value="QC Staff">QC Staff</option>
              <option value="Production Staff">Production Staff</option>
              <option value="Security Guard">Security Guard</option>
            </select>
          </div>

          {/* Station Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
            <Input
              value={newUser.station}
              onChange={(e) => setNewUser(prev => ({ ...prev, station: e.target.value }))}
              placeholder="Enter station (optional)"
              className="w-full"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
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
            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <Input
                value={state.selectedUser.full_name}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  selectedUser: prev.selectedUser ? {
                    ...prev.selectedUser,
                    full_name: e.target.value
                  } : null
                }))}
                className="w-full"
              />
            </div>

            {/* Role Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={state.selectedUser.role}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  selectedUser: prev.selectedUser ? {
                    ...prev.selectedUser,
                    role: e.target.value as User['role']
                  } : null
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Production Lead">Production Lead</option>
                <option value="QC Lead">QC Lead</option>
                <option value="Staff Lead">Staff Lead</option>
                <option value="QC Staff">QC Staff</option>
                <option value="Production Staff">Production Staff</option>
                <option value="Security Guard">Security Guard</option>
              </select>
            </div>

            {/* Station Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
              <Input
                value={state.selectedUser.station || ''}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  selectedUser: prev.selectedUser ? {
                    ...prev.selectedUser,
                    station: e.target.value
                  } : null
                }))}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
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

export default UserManagementPanel;