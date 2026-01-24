// src/components/dashboards/admin/AdminPermissionsPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  KeyIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  LockClosedIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  actions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  userCount: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  isSystem: boolean;
}

interface UserRole {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  lastLogin: string;
  status: 'active' | 'inactive' | 'suspended';
}

const AdminPermissionsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'permissions' | 'roles' | 'users'>('roles');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const permissionCategories = [
    'all', 'user_management', 'system_admin', 'data_access', 'hardware_control', 'reporting'
  ];

  useEffect(() => {
    loadPermissions();
    loadRoles();
    loadUserRoles();
  }, []);

  const loadPermissions = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('clamflow_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load permissions');
      }

      const data = await response.json();
      setPermissions(data);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Failed to load permissions');
      setPermissions([]);
    }
  };

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('clamflow_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load admin roles');
      }

      const data = await response.json();
      setRoles(data);
    } catch (err) {
      console.error('Error loading roles:', err);
      setError('Failed to load admin roles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRoles = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('clamflow_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/user-roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load user role assignments');
      }

      const data = await response.json();
      setUserRoles(data);
    } catch (err) {
      console.error('Error loading user roles:', err);
      setError('Failed to load user role assignments');
      setUserRoles([]);
    }
  };

  const handleCreateRole = async (roleData: Partial<Role>) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('clamflow_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      });

      if (!response.ok) {
        throw new Error('Failed to create role');
      }

      const newRole = await response.json();
      setRoles([...roles, newRole]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating role:', err);
      alert('Failed to create role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (roleId: string, roleData: Partial<Role>) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('clamflow_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      const updatedRole = await response.json();
      setRoles(roles.map(role => role.id === roleId ? updatedRole : role));
      setShowEditModal(false);
      setSelectedRole(null);
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      try {
        setLoading(true);
        const token = localStorage.getItem('clamflow_token');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles/${roleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete role');
        }

        setRoles(roles.filter(role => role.id !== roleId));
      } catch (err) {
        console.error('Error deleting role:', err);
        alert('Failed to delete role. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesCategory = filterCategory === 'all' || permission.category === filterCategory;
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = userRoles.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <KeyIcon className="h-8 w-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Permissions</h2>
            <p className="text-gray-600">Manage roles, permissions, and user access control</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Role
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'roles', name: 'Roles', icon: UserGroupIcon },
            { id: 'permissions', name: 'Permissions', icon: ShieldCheckIcon },
            { id: 'users', name: 'User Assignments', icon: KeyIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`mr-2 h-5 w-5 ${
                activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {activeTab === 'permissions' && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {permissionCategories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'roles' && (
        loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-yellow-800 font-medium">Admin Roles Unavailable</h3>
                <p className="text-yellow-600 text-sm mt-1">{error}</p>
                <button
                  onClick={loadRoles}
                  className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-800"
                >
                  Retry Loading
                </button>
              </div>
            </div>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <KeyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">No admin roles configured yet</p>
            <p className="text-sm text-gray-400 mt-2">Create admin roles to manage permissions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRoles.map((role) => (
              <div key={role.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                  </div>
                  {role.isSystem && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      System
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Permission Level</span>
                    <span className="text-sm font-medium">{role.level}/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Users Assigned</span>
                    <span className="text-sm font-medium">{role.userCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Permissions</span>
                    <span className="text-sm font-medium">{role.permissions.length}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-3">
                    Updated: {new Date(role.updatedAt).toLocaleString()}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedRole(role);
                        setShowEditModal(true);
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-indigo-300 rounded-md hover:bg-indigo-200"
                    >
                      <PencilIcon className="h-4 w-4 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => setSelectedRole(role)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      <EyeIcon className="h-4 w-4 inline mr-1" />
                      View
                    </button>
                    {!role.isSystem && (
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'permissions' && (
        permissions.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">No permissions data entered yet</p>
            <p className="text-sm text-gray-400 mt-2">Configure system permissions to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredPermissions.map((permission) => (
                <div key={permission.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{permission.name}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(permission.riskLevel)}`}>
                          {permission.riskLevel}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {permission.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{permission.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Resource: {permission.resource}</span>
                        <span>Actions: {permission.actions.join(', ')}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {permission.riskLevel === 'critical' ? 
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" /> :
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {activeTab === 'users' && (
        userRoles.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">No user role assignments yet</p>
            <p className="text-sm text-gray-400 mt-2">Assign roles to users to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user.userId} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {user.username.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{user.username}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {user.roles.map(roleId => {
                            const role = roles.find(r => r.id === roleId);
                            return (
                              <span key={roleId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {role?.name || 'Unknown Role'}
                              </span>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-500">
                          Last login: {new Date(user.lastLogin).toLocaleString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Role Details Modal */}
      {selectedRole && !showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Role Details</h3>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedRole.name}</h4>
                  <p className="text-sm text-gray-600">{selectedRole.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Level:</span>
                    <p className="text-gray-600">{selectedRole.level}/10</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Users:</span>
                    <p className="text-gray-600">{selectedRole.userCount}</p>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Permissions:</span>
                  {selectedRole.permissions.length === 0 ? (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-500">No permissions assigned yet</p>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {selectedRole.permissions.map(permId => {
                        const permission = permissions.find(p => p.id === permId);
                        return permission ? (
                          <div key={permId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{permission.name}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getRiskLevelColor(permission.riskLevel)}`}>
                              {permission.riskLevel}
                            </span>
                          </div>
                        ) : (
                          <div key={permId} className="p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-500">Permission not found: {permId}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPermissionsPanel;