"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Pencil, Trash2, X, Check, AlertCircle, Loader2, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import clamflowAPI, { StationDefinition } from '../../../lib/clamflow-api';

const PLANT_TYPES = ['PPC', 'FP'] as const;
type PlantType = typeof PLANT_TYPES[number];

const STATION_TYPES = [
  'receiving', 'depuration', 'processing', 'packing',
  'storage', 'freezer', 'rfid', 'sentry', 'machine-room', 'product-store', 'other',
] as const;

const STATUS_OPTIONS = ['operational', 'maintenance', 'offline'] as const;
type StationStatus = typeof STATUS_OPTIONS[number];

const STATUS_BADGE: Record<StationStatus, string> = {
  operational: 'bg-green-100 text-green-800',
  maintenance:  'bg-yellow-100 text-yellow-800',
  offline:      'bg-red-100 text-red-800',
};

const PLANT_BADGE: Record<PlantType, string> = {
  PPC: 'bg-blue-100 text-blue-800',
  FP:  'bg-purple-100 text-purple-800',
};

const emptyForm = (): Partial<StationDefinition> => ({
  name: '',
  code: '',
  plant_type: 'PPC',
  station_type: 'processing',
  capacity: 2,
  status: 'operational',
  location: '',
  description: '',
  required_skills: '',
  is_active: true,
  station_order: 1,
});

const StationManagementPanel: React.FC = () => {
  const [stations, setStations] = useState<StationDefinition[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [filterPlant, setFilterPlant] = useState<PlantType | 'All'>('All');
  const [error, setError]       = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [modalMode, setModalMode]     = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState<Partial<StationDefinition>>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clamflowAPI.getStationDefinitions();
      if (res.success && res.data) {
        setStations(res.data as StationDefinition[]);
      } else {
        setError('Failed to load stations.');
      }
    } catch {
      setError('Network error — could not load stations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(emptyForm());
    setEditingId(null);
    setModalMode('create');
  };

  const openEdit = (s: StationDefinition) => {
    setForm({ ...s });
    setEditingId(s.id);
    setModalMode('edit');
  };

  const closeModal = () => { setModalMode(null); setEditingId(null); };

  const handleSave = async () => {
    if (!form.name?.trim()) { setError('Station name is required.'); return; }
    if (!form.code?.trim()) { setError('Station code is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      let res;
      if (modalMode === 'edit' && editingId) {
        res = await clamflowAPI.updateStation(editingId, form);
      } else {
        res = await clamflowAPI.createStation(form);
      }
      if (res.success) {
        closeModal();
        await load();
        flash(modalMode === 'edit' ? 'Station updated.' : 'Station created.');
      } else {
        setError(res.error || 'Save failed.');
      }
    } catch {
      setError('Network error — save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await clamflowAPI.deleteStation(id);
      if (res.success) {
        setDeleteConfirmId(null);
        await load();
        flash('Station deleted.');
      } else {
        setError(res.error || 'Delete failed.');
      }
    } catch {
      setError('Network error — delete failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (station: StationDefinition) => {
    try {
      await clamflowAPI.updateStation(station.id, { is_active: !station.is_active });
      await load();
    } catch {
      setError('Could not toggle station.');
    }
  };

  const visible = filterPlant === 'All'
    ? stations
    : stations.filter(s => s.plant_type === filterPlant);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Station Management</h2>
          <p className="text-sm text-gray-600">Define production stations used for staff assignment</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/station-assignment"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Assignment Board
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Station
          </button>
        </div>
      </div>

      {/* Plant filter */}
      <div className="flex items-center gap-2">
        {(['All', ...PLANT_TYPES] as const).map(p => (
          <button
            key={p}
            onClick={() => setFilterPlant(p as typeof filterPlant)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              filterPlant === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p === 'All' ? `All (${stations.length})` : `${p} (${stations.filter(s => s.plant_type === p).length})`}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Station list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-lg">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No stations{filterPlant !== 'All' ? ` for ${filterPlant}` : ''}</p>
          <p className="text-sm text-gray-400 mt-1">Create station definitions to enable staff assignment</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Create first station
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Station</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Plant</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Capacity</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Active</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map(s => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${!s.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLANT_BADGE[s.plant_type as PlantType] ?? 'bg-gray-100 text-gray-700'}`}>
                      {s.plant_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell capitalize text-gray-600">{s.station_type}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600">{s.capacity}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status as StationStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(s)} title={s.is_active ? 'Deactivate' : 'Activate'}>
                      {s.is_active
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        title="Edit"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(s.id)}
                        title="Delete"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === 'create' ? 'New Station' : 'Edit Station'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name ?? ''}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. RM Station"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={form.code ?? ''}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    placeholder="e.g. ppc-receiving"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plant *</label>
                  <select
                    value={form.plant_type ?? 'PPC'}
                    onChange={e => setForm(p => ({ ...p, plant_type: e.target.value as PlantType }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PLANT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={form.station_type ?? 'processing'}
                    onChange={e => setForm(p => ({ ...p, station_type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATION_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={form.capacity ?? 2}
                    onChange={e => setForm(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status ?? 'operational'}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value as StationStatus }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={form.location ?? ''}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Zone A, Bay 3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                <input
                  type="text"
                  value={form.required_skills ?? ''}
                  onChange={e => setForm(p => ({ ...p, required_skills: e.target.value }))}
                  placeholder="e.g. Material Handling, Weight Note"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active (visible in assignment board)</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {modalMode === 'edit' ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Station</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              This will permanently delete the station definition. Existing staff assignments to this station will be affected.
            </p>
            <p className="text-sm font-medium text-red-600 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationManagementPanel;
