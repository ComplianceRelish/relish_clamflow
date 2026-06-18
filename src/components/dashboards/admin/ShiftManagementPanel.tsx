"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Plus, ExternalLink, Pencil, Trash2, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import clamflowAPI, { ShiftDefinition } from '../../../lib/clamflow-api';

interface ShiftManagementPanelProps {
  onClose?: () => void;
}

const SHIFT_TYPES = ['Day', 'Swing', 'Night', 'Overtime'] as const;
type ShiftType = typeof SHIFT_TYPES[number];

const SHIFT_COLORS: Record<ShiftType, string> = {
  Day:      '#C3E6CB',
  Swing:    '#FFF3CD',
  Night:    '#D1ECF1',
  Overtime: '#F8D7DA',
};

const TYPE_BADGE: Record<ShiftType, string> = {
  Day:      'bg-green-100 text-green-800',
  Swing:    'bg-yellow-100 text-yellow-800',
  Night:    'bg-blue-100 text-blue-800',
  Overtime: 'bg-red-100 text-red-800',
};

const emptyForm = () => ({
  name: '',
  shift_type: 'Day' as ShiftType,
  start_time: '06:00',
  end_time: '14:00',
  color: SHIFT_COLORS['Day'],
});

type FormState = ReturnType<typeof emptyForm>;

const ShiftManagementPanel: React.FC<ShiftManagementPanelProps> = () => {
  const [definitions, setDefinitions] = useState<ShiftDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const loadDefinitions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clamflowAPI.getShiftDefinitions();
      if (res.success && res.data) {
        setDefinitions(res.data as ShiftDefinition[]);
      } else {
        setError('Failed to load shift definitions.');
      }
    } catch {
      setError('Network error — could not load shift definitions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDefinitions(); }, [loadDefinitions]);

  const openCreate = () => {
    setForm(emptyForm());
    setEditingId(null);
    setModalMode('create');
  };

  const openEdit = (def: ShiftDefinition) => {
    setForm({
      name: def.name,
      shift_type: (def as any).shiftType ?? (def as any).shift_type ?? 'Day',
      start_time: def.start_time,
      end_time: def.end_time,
      color: def.color || SHIFT_COLORS['Day'],
    });
    setEditingId(def.id);
    setModalMode('edit');
  };

  const closeModal = () => { setModalMode(null); setEditingId(null); };

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-set color when shift_type changes
      if (field === 'shift_type') next.color = SHIFT_COLORS[value as ShiftType] ?? prev.color;
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        shift_type: form.shift_type,
        start_time: form.start_time,
        end_time: form.end_time,
        color: form.color,
        code: form.shift_type.toLowerCase(),  // backend requires code field
      };

      let res;
      if (modalMode === 'edit' && editingId) {
        res = await clamflowAPI.updateShiftDefinition(editingId, payload);
      } else {
        res = await clamflowAPI.createShiftDefinition(payload);
      }

      if (res.success) {
        closeModal();
        await loadDefinitions();
        flash(modalMode === 'edit' ? 'Shift definition updated.' : 'Shift definition created.');
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
      const res = await clamflowAPI.deleteShiftDefinition(id);
      if (res.success) {
        setDeleteConfirmId(null);
        await loadDefinitions();
        flash('Shift definition deleted.');
      } else {
        setError(res.error || 'Delete failed.');
      }
    } catch {
      setError('Network error — delete failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shift Management</h2>
          <p className="text-sm text-gray-600">Define shift blocks used by the scheduling calendar</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/shift-scheduling"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Scheduling Calendar
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Shift
          </button>
        </div>
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

      {/* Definitions list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : definitions.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-lg">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No shift definitions yet</p>
          <p className="text-sm text-gray-400 mt-1">Create Day, Swing, and Night shifts to enable the calendar</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Create first shift
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {definitions.map(def => {
            const shiftType: ShiftType = ((def as any).shiftType ?? (def as any).shift_type ?? 'Day') as ShiftType;
            const swatch = def.color || SHIFT_COLORS[shiftType] || '#e5e7eb';
            return (
              <div
                key={def.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ background: swatch }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{def.name}</h3>
                      <span className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[shiftType] ?? 'bg-gray-100 text-gray-700'}`}>
                        {shiftType}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => openEdit(def)}
                      title="Edit"
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(def.id)}
                      title="Delete"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{def.start_time} – {def.end_time}</span>
                </div>
                {!(def as any).isActive && (def as any).is_active === false && (
                  <span className="mt-2 inline-block text-xs text-gray-400">Inactive</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === 'create' ? 'New Shift Definition' : 'Edit Shift Definition'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleFormChange('name', e.target.value)}
                  placeholder="e.g. Day Shift"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type *</label>
                <select
                  value={form.shift_type}
                  onChange={e => handleFormChange('shift_type', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SHIFT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={e => handleFormChange('start_time', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={e => handleFormChange('end_time', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colour</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => handleFormChange('color', e.target.value)}
                    className="w-10 h-9 border border-gray-300 rounded cursor-pointer p-0.5"
                  />
                  <span className="text-sm text-gray-500">{form.color}</span>
                </div>
              </div>
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

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Shift Definition</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              This will permanently delete the shift definition. Any existing shift assignments using it will be affected.
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

export default ShiftManagementPanel;