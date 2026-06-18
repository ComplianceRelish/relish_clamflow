'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { clamflowAPI } from '../../lib/clamflow-api';
import { Cpu, Tag, RefreshCw, AlertTriangle, CheckCircle, Package, MapPin } from 'lucide-react';
import Link from 'next/link';

// Roles that can view this page
const AUTHORIZED_ROLES = [
  'Super Admin', 'Admin', 'IT Staff',
  'Production Lead', 'QC Lead', 'Staff Lead',
  'Production Staff', 'QC Staff', 'Security Guard',
];

// Roles that can manage devices / see the full registry
const ADMIN_ROLES = ['Super Admin', 'Admin', 'IT Staff'];

interface RFIDTag {
  id: string;
  tag_id: string;
  box_number: string;
  product_type: string;
  grade: string;
  weight_kg: number;
  status: string;
  location?: string;
  department?: string;
  linked_at: string;
}

export default function DevicesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [tags, setTags] = useState<RFIDTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  // Auth guard
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login?returnUrl=/devices');
      return;
    }
    if (!AUTHORIZED_ROLES.includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const loadTags = async () => {
    setTagsLoading(true);
    setTagsError(null);
    try {
      const res = await clamflowAPI.getRFIDTags();
      if (res.success && Array.isArray(res.data)) {
        setTags(res.data as RFIDTag[]);
      } else {
        setTags([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load RFID tags';
      setTagsError(msg);
    } finally {
      setTagsLoading(false);
    }
  };

  useEffect(() => {
    if (user && AUTHORIZED_ROLES.includes(user.role)) {
      loadTags();
    }
  }, [user]);

  const filteredTags = statusFilter === 'all'
    ? tags
    : tags.filter(t => t.status === statusFilter);

  const statusCounts = tags.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    in_transit: 'bg-blue-100 text-blue-800',
    returned: 'bg-gray-100 text-gray-700',
    damaged: 'bg-red-100 text-red-800',
    archived: 'bg-yellow-100 text-yellow-800',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || !AUTHORIZED_ROLES.includes(user.role)) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="w-7 h-7 text-indigo-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Devices &amp; RFID</h1>
              <p className="text-sm text-gray-500">Hardware devices and RFID tag tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/dashboard?view=device-registry"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Cpu className="w-4 h-4" />
                Device Registry
              </Link>
            )}
            <Link
              href="/devices/handover"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Tag className="w-4 h-4" />
              Device Handover
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Tags', value: tags.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Active', value: statusCounts['active'] || 0, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'In Transit', value: statusCounts['in_transit'] || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Damaged', value: statusCounts['damaged'] || 0, color: 'text-red-600', bg: 'bg-red-50' },
          ].map(card => (
            <div key={card.label} className={`${card.bg} rounded-xl p-4`}>
              <p className="text-sm text-gray-600">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* RFID Tags table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-gray-900">RFID Tags</h2>
              <span className="text-sm text-gray-400 ml-1">({filteredTags.length})</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="in_transit">In Transit</option>
                <option value="returned">Returned</option>
                <option value="damaged">Damaged</option>
                <option value="archived">Archived</option>
              </select>
              <button
                onClick={loadTags}
                disabled={tagsLoading}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${tagsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {tagsError && (
            <div className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {tagsError}
            </div>
          )}

          {tagsLoading ? (
            <div className="px-5 py-10 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading tags…
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400">
              <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No RFID tags found</p>
              <p className="text-sm mt-1">Tags are created when boxes are linked in production</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tag ID', 'Box #', 'Product', 'Grade', 'Weight (kg)', 'Status', 'Location', 'Linked'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTags.map(tag => (
                    <tr key={tag.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{tag.tag_id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{tag.box_number}</td>
                      <td className="px-4 py-3 text-gray-700">{tag.product_type}</td>
                      <td className="px-4 py-3 text-gray-600">{tag.grade}</td>
                      <td className="px-4 py-3 text-gray-700">{tag.weight_kg.toFixed(1)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[tag.status] || 'bg-gray-100 text-gray-600'}`}>
                          {tag.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {tag.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {tag.location}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(tag.linked_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/devices/handover" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group">
            <Tag className="w-6 h-6 text-indigo-500 mb-3" />
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">Device Handover</h3>
            <p className="text-sm text-gray-500 mt-1">Scan and handover RFID devices between staff</p>
          </Link>
          <Link href="/station-assignment" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group">
            <CheckCircle className="w-6 h-6 text-green-500 mb-3" />
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">Station Assignment</h3>
            <p className="text-sm text-gray-500 mt-1">View and manage station assignments</p>
          </Link>
          <Link href="/inventory" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group">
            <Package className="w-6 h-6 text-orange-500 mb-3" />
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">Inventory</h3>
            <p className="text-sm text-gray-500 mt-1">Track boxes and product inventory</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
