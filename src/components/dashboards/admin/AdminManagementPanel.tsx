'use client';

import React, { useState, useEffect } from 'react';
import clamflowAPI from '../../../lib/clamflow-api';
import { User } from '../../../types/auth';

interface AdminManagementPanelProps {
  currentUser: User | null;
}

interface Admin {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  station: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

interface CreateAdminFormData {
  username: string;
  full_name: string;
  email: string;
  password: string;
  role: string;
  station: string;
}

const AdminManagementPanel: React.FC<AdminManagementPanelProps> = ({ currentUser }) => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState<CreateAdminFormData>({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'Admin',
    station: 'Main Office'
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setAdmins([]); // Reset to empty array to prevent stale data
      
      // Try the specific admin endpoint first
      console.log('🔍 Fetching admins from /super-admin/admins...');
      let response = await clamflowAPI.getAdmins();
      
      console.log('📦 Raw response:', JSON.stringify(response, null, 2));
      console.log('✅ Response success:', response.success);
      console.log('📊 Response data type:', typeof response.data, Array.isArray(response.data) ? 'Array' : 'Object');
      console.log('📋 Response data:', response.data);
      
      // If that fails or returns empty, try getting all users
      if (!response.success || !response.data || (Array.isArray(response.data) && response.data.length === 0)) {
        console.log('⚠️ First attempt failed or empty, trying getAllUsers endpoint...');
        response = await clamflowAPI.getAllUsers();
        console.log('📦 Fallback response:', JSON.stringify(response, null, 2));
      }
      
      if (response.success && response.data) {
        // Handle different response formats - backend returns double-wrapped response
        let adminData: Admin[] = [];
        
        // Check if response.data has nested success/data structure
        if ((response.data as any).success && (response.data as any).data) {
          console.log('🔓 Unwrapping double-wrapped response...');
          adminData = (response.data as any).data;
        } else if (Array.isArray(response.data)) {
          adminData = response.data;
        } else if (typeof response.data === 'object') {
          adminData = (response.data as any).admins || (response.data as any).users || [];
        }
        
        console.log('🔧 Extracted admin data (before filtering):', adminData);
        console.log('📏 Admin data length:', Array.isArray(adminData) ? adminData.length : 0);
        
        // Ensure adminData is an array
        if (!Array.isArray(adminData)) {
          console.error('❌ Admin data is not an array:', typeof adminData, adminData);
          adminData = [];
        }
        
        // Filter for admin roles only - with safety check
        const filteredAdmins = adminData.filter((user: any) => {
          if (!user || typeof user !== 'object') return false;
          return user.role === 'Super Admin' || user.role === 'Admin';
        });
        
        console.log('✨ Filtered admins:', filteredAdmins);
        console.log('👥 Number of admins found:', filteredAdmins.length);
        setAdmins(filteredAdmins);
        setError('');
      } else {
        console.error('❌ No admin data received - response:', response);
        setError(response.error || 'Failed to load admin list');
        setAdmins([]); // Set empty array on error
      }
    } catch (err: any) {
      console.error('💥 Failed to load admins:', err);
      setError('Failed to load admin list');
      setAdmins([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.full_name || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const response = await clamflowAPI.createAdmin(formData);
      
      if (response.success) {
        setSuccessMessage(`Admin "${formData.full_name}" created successfully!`);
        setShowCreateForm(false);
        setFormData({
          username: '',
          full_name: '',
          email: '',
          password: '',
          role: 'Admin',
          station: 'Main Office'
        });
        
        await loadAdmins();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(response.error || 'Failed to create admin');
      }
    } catch (err: any) {
      console.error('Failed to create admin:', err);
      setError(err.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to deactivate admin "${adminName}"?`)) {
      return;
    }

    try {
      const response = await clamflowAPI.deleteAdmin(adminId);
      
      if (response.success) {
        setSuccessMessage(`Admin "${adminName}" deactivated successfully`);
        await loadAdmins();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(response.error || 'Failed to deactivate admin');
      }
    } catch (err: any) {
      console.error('Failed to delete admin:', err);
      setError('Failed to deactivate admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
          <p className="text-gray-600">Manage administrator accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          {showCreateForm ? '✕ Cancel' : '+ Create Admin'}
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-green-600 text-xl mr-3">✓</span>
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠</span>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Create New Admin</h3>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="admin_john"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="john@clamflow.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Station *</label>
                <input
                  type="text"
                  value={formData.station}
                  onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Main Office"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & Station</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!Array.isArray(admins) || admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {loading ? 'Loading admins...' : 'No admins found'}
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{admin.full_name}</div>
                        <div className="text-sm text-gray-500">{admin.username}</div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {admin.role}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">{admin.station}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      {admin.username !== currentUser?.username && (
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.full_name)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Deactivate
                        </button>
                      )}
                      {admin.username === currentUser?.username && (
                        <span className="text-gray-400 text-sm">Current User</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-900">Total Admins</p>
            <p className="text-2xl font-bold text-purple-600">{admins.length}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-purple-900">Active</p>
            <p className="text-2xl font-bold text-green-600">{admins.filter(a => a.is_active).length}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-purple-900">Super Admins</p>
            <p className="text-2xl font-bold text-purple-600">{admins.filter(a => a.role === 'Super Admin').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManagementPanel;