'use client';

import React, { useState, useEffect } from 'react';
import { User } from '../../../types/auth';
import clamflowAPI from '../../../lib/clamflow-api';

interface SupplierOnboardingPanelProps {
  currentUser: User | null;
}

interface Supplier {
  id: string;
  name: string;
  contact_info?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  boat_details?: {
    boat_name?: string;
    registration_number?: string;
    capacity_kg?: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  onboarded_by?: string;
}

interface NewSupplierForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  boat_name: string;
  registration_number: string;
  capacity_kg: string;
}

const SupplierOnboardingPanel: React.FC<SupplierOnboardingPanelProps> = ({ currentUser }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  const [newSupplier, setNewSupplier] = useState<NewSupplierForm>({
    name: '',
    phone: '',
    email: '',
    address: '',
    boat_name: '',
    registration_number: '',
    capacity_kg: '',
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await clamflowAPI.getSuppliers();
      
      if (response.success && response.data) {
        // Convert supplier data to expected format
        const supplierList = Array.isArray(response.data) ? response.data : [];
        setSuppliers(supplierList.map((s: any) => ({
          id: s.id || s.supplier_id || String(Math.random()),
          name: s.name || s.supplier_name || 'Unknown Supplier',
          contact_info: s.contact_info || {},
          boat_details: s.boat_details || {},
          status: s.status || 'approved',
          created_at: s.created_at || new Date().toISOString(),
          onboarded_by: s.onboarded_by,
        })));
      } else {
        console.warn('Failed to fetch suppliers:', response.error);
        setSuppliers([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load suppliers';
      console.error('Supplier fetch error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleInputChange = (field: keyof NewSupplierForm, value: string) => {
    setNewSupplier(prev => ({ ...prev, [field]: value }));
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSupplier.name.trim()) {
      setFormError('Supplier name is required');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const supplierData = {
        name: newSupplier.name.trim(),
        contact_info: {
          phone: newSupplier.phone.trim() || undefined,
          email: newSupplier.email.trim() || undefined,
          address: newSupplier.address.trim() || undefined,
        },
        boat_details: newSupplier.boat_name ? {
          boat_name: newSupplier.boat_name.trim(),
          registration_number: newSupplier.registration_number.trim() || undefined,
          capacity_kg: newSupplier.capacity_kg ? Number(newSupplier.capacity_kg) : undefined,
        } : undefined,
      };

      // Call API to submit supplier onboarding
      const response = await clamflowAPI.submitOnboarding('supplier', supplierData);
      
      if (response.success) {
        setFormSuccess('Supplier onboarding request submitted successfully! Awaiting approval.');
        setNewSupplier({
          name: '',
          phone: '',
          email: '',
          address: '',
          boat_name: '',
          registration_number: '',
          capacity_kg: '',
        });
        setShowAddForm(false);
        fetchSuppliers(); // Refresh the list
      } else {
        setFormError(response.error || 'Failed to submit supplier onboarding');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit supplier onboarding';
      setFormError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🚚 Supplier Onboarding</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and onboard new suppliers
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <span>{showAddForm ? '✕' : '+'}</span>
          <span>{showAddForm ? 'Cancel' : 'New Supplier'}</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {formSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✅ {formSuccess}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Add Supplier Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-orange-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Supplier</h3>
          
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitSupplier} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  value={newSupplier.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter supplier name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newSupplier.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newSupplier.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter address"
                />
              </div>
            </div>

            {/* Boat Details */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-md font-medium text-gray-800 mb-3">Boat Details (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Boat Name
                  </label>
                  <input
                    type="text"
                    value={newSupplier.boat_name}
                    onChange={(e) => handleInputChange('boat_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter boat name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={newSupplier.registration_number}
                    onChange={(e) => handleInputChange('registration_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter registration #"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity (kg)
                  </label>
                  <input
                    type="number"
                    value={newSupplier.capacity_kg}
                    onChange={(e) => handleInputChange('capacity_kg', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter capacity"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {formLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit for Approval'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600">Approved Suppliers</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {suppliers.filter(s => s.status === 'approved').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-600">Pending Approval</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {suppliers.filter(s => s.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-600">Rejected</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {suppliers.filter(s => s.status === 'rejected').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600">Total Suppliers</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{suppliers.length}</div>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Suppliers</h3>
        </div>
        <div className="overflow-x-auto">
          {suppliers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🚚</div>
              <p>No suppliers found. Click "New Supplier" to add one.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boat Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Onboarded
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.contact_info?.phone || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {supplier.contact_info?.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.boat_details?.boat_name || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {supplier.boat_details?.registration_number || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(supplier.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(supplier.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierOnboardingPanel;
