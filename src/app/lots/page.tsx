'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { clamflowAPI, LotResponse } from '../../lib/clamflow-api';

const AUTHORIZED_ROLES = [
  'Super Admin',
  'Admin',
  'Production Lead',
  'Staff Lead',
  'QC Lead',
  'QC Staff',
];

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-blue-100 text-blue-800',
  washing: 'bg-cyan-100 text-cyan-800',
  depuration: 'bg-purple-100 text-purple-800',
  ppc: 'bg-yellow-100 text-yellow-800',
  fp: 'bg-orange-100 text-orange-800',
  shipped: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
};

export default function LotsPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [lots, setLots] = useState<LotResponse[]>([]);
  const [filteredLots, setFilteredLots] = useState<LotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login?returnUrl=/lots');
        return;
      }
      const authorized = AUTHORIZED_ROLES.includes(user.role);
      setIsAuthorized(authorized);
      if (!authorized) {
        console.warn('User not authorized for lots view:', user.role);
      }
    }
  }, [user, isLoading, router]);

  const fetchLots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (token) {
        clamflowAPI.setToken(token);
      }
      const response = await clamflowAPI.getLots();
      if (response.data) {
        setLots(response.data);
        setFilteredLots(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch lots:', err);
      setError('Failed to load lots. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthorized && token) {
      fetchLots();
    }
  }, [isAuthorized, token, fetchLots]);

  // Apply filters
  useEffect(() => {
    let result = lots;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (lot) =>
          lot.lotNumber?.toLowerCase().includes(q) ||
          lot.supplierName?.toLowerCase().includes(q) ||
          lot.id?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((lot) => lot.status === statusFilter);
    }

    setFilteredLots(result);
  }, [lots, searchQuery, statusFilter]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You do not have permission to view lots.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const statusCounts = lots.reduce<Record<string, number>>((acc, lot) => {
    acc[lot.status] = (acc[lot.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📦 Lot Management</h1>
            <p className="text-indigo-100 mt-1">View and manage all processing lots</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Dashboard
            </button>
            <button
              onClick={fetchLots}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Refresh
            </button>
            {user?.role === 'Production Lead' && (
              <button
                onClick={() => router.push('/lots/create')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                + Create Lot
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {['received', 'washing', 'depuration', 'ppc', 'fp', 'shipped', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`rounded-lg p-3 text-center transition-all border-2 ${
                statusFilter === status
                  ? 'border-indigo-500 shadow-md'
                  : 'border-transparent hover:border-gray-300'
              } ${STATUS_COLORS[status]}`}
            >
              <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
              <div className="text-xs font-medium capitalize">{status === 'fp' ? 'FP' : status === 'ppc' ? 'PPC' : status}</div>
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by lot number, supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses ({lots.length})</option>
              {['received', 'washing', 'depuration', 'ppc', 'fp', 'shipped', 'archived'].map((s) => (
                <option key={s} value={s}>
                  {s === 'fp' ? 'FP' : s === 'ppc' ? 'PPC' : s.charAt(0).toUpperCase() + s.slice(1)} ({statusCounts[s] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchLots}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading lots...</span>
          </div>
        )}

        {/* Lots Table */}
        {!loading && !error && (
          <>
            {filteredLots.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Lots Found</h3>
                <p className="text-gray-500">
                  {lots.length === 0
                    ? 'No lots have been created yet.'
                    : 'No lots match your current filters.'}
                </p>
                {lots.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Lot Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredLots.map((lot) => (
                        <tr
                          key={lot.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-indigo-600">
                              {lot.lotNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {lot.supplierName || lot.supplierId || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                STATUS_COLORS[lot.status] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {lot.status === 'fp' ? 'FP' : lot.status === 'ppc' ? 'PPC' : lot.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lot.createdAt
                              ? new Date(lot.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lot.updatedAt
                              ? new Date(lot.updatedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t text-sm text-gray-500">
                  Showing {filteredLots.length} of {lots.length} lots
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
