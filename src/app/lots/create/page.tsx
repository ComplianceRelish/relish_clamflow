'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { clamflowAPI } from '../../../lib/clamflow-api';

const AUTHORIZED_ROLES = [
  'Production Lead',
];

interface Supplier {
  supplierId: string;
  supplierName: string;
}

interface WeightNote {
  id: string;
  lot_id: string;
  supplier_id: string;
  box_number: string;
  weight: number;
  net_weight?: number;
  status?: string;
  created_at: string;
}

export default function CreateLotPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Form state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [weightNotes, setWeightNotes] = useState<WeightNote[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedWeightNote, setSelectedWeightNote] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingWeightNotes, setLoadingWeightNotes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login?returnUrl=/lots/create');
        return;
      }
      const authorized = AUTHORIZED_ROLES.includes(user.role);
      setIsAuthorized(authorized);
      if (!authorized) {
        console.warn('User not authorized for lot creation:', user.role);
      }
    }
  }, [user, isLoading, router]);

  const fetchSuppliers = useCallback(async () => {
    setLoadingSuppliers(true);
    try {
      if (token) {
        clamflowAPI.setToken(token);
      }
      const response = await clamflowAPI.getSuppliers();
      if (response.data) {
        setSuppliers(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoadingSuppliers(false);
    }
  }, [token]);

  const fetchWeightNotes = useCallback(async () => {
    setLoadingWeightNotes(true);
    try {
      if (token) {
        clamflowAPI.setToken(token);
      }
      const response = await clamflowAPI.getWeightNotes();
      if (response.data) {
        setWeightNotes(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch weight notes:', err);
    } finally {
      setLoadingWeightNotes(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthorized && token) {
      fetchSuppliers();
      fetchWeightNotes();
    }
  }, [isAuthorized, token, fetchSuppliers, fetchWeightNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedSupplier) {
      setError('Please select a supplier.');
      return;
    }
    if (!selectedWeightNote) {
      setError('Please select a weight note.');
      return;
    }

    setSubmitting(true);
    try {
      if (token) {
        clamflowAPI.setToken(token);
      }
      const response = await clamflowAPI.createLot({
        supplierId: selectedSupplier,
        weightNoteId: selectedWeightNote,
        notes: notes.trim() || undefined,
      });

      if (response.data) {
        setSuccess(`Lot ${response.data.lotNumber || response.data.id} created successfully!`);
        setSelectedSupplier('');
        setSelectedWeightNote('');
        setNotes('');
        // Refresh weight notes list
        fetchWeightNotes();
      } else {
        setError(response.error || 'Failed to create lot. Please try again.');
      }
    } catch (err) {
      console.error('Failed to create lot:', err);
      setError('An error occurred while creating the lot. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Unauthorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-600">
        <div className="text-center text-white max-w-md p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="mb-4">You do not have permission to create lots.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Filter weight notes by selected supplier if one is chosen
  const filteredWeightNotes = selectedSupplier
    ? weightNotes.filter(wn => wn.supplier_id === selectedSupplier)
    : weightNotes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium backdrop-blur-sm"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Create Production Lot</h1>
          <p className="text-white/70 text-sm mt-1">
            Create a new lot linked to a supplier and weight note
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <span className="text-green-600 text-xl">✅</span>
            <div>
              <p className="text-green-800 font-medium">{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-600 text-sm underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <span className="text-red-600 text-xl">❌</span>
            <div>
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 text-sm underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Supplier Selection */}
          <div>
            <label htmlFor="supplier" className="block text-sm font-semibold text-gray-700 mb-2">
              Supplier <span className="text-red-500">*</span>
            </label>
            {loadingSuppliers ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                Loading suppliers...
              </div>
            ) : suppliers.length === 0 ? (
              <p className="text-gray-500 text-sm py-2">
                No suppliers found. Please add suppliers first.
              </p>
            ) : (
              <select
                id="supplier"
                value={selectedSupplier}
                onChange={(e) => {
                  setSelectedSupplier(e.target.value);
                  setSelectedWeightNote(''); // Reset weight note when supplier changes
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              >
                <option value="">Select a supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.supplierName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Weight Note Selection */}
          <div>
            <label htmlFor="weightNote" className="block text-sm font-semibold text-gray-700 mb-2">
              Weight Note <span className="text-red-500">*</span>
            </label>
            {loadingWeightNotes ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                Loading weight notes...
              </div>
            ) : weightNotes.length === 0 ? (
              <p className="text-gray-500 text-sm py-2">
                No weight notes found.
              </p>
            ) : filteredWeightNotes.length === 0 ? (
              <p className="text-gray-500 text-sm py-2">
                No weight notes found for the selected supplier.
              </p>
            ) : (
              <select
                id="weightNote"
                value={selectedWeightNote}
                onChange={(e) => setSelectedWeightNote(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              >
                <option value="">Select a weight note...</option>
                {filteredWeightNotes.map((wn) => (
                  <option key={wn.id} value={wn.id}>
                    Box #{wn.box_number} — {wn.net_weight ?? wn.weight}kg
                    {wn.status ? ` (${wn.status})` : ''}
                    {' — '}
                    {new Date(wn.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this lot..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSupplier || !selectedWeightNote}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>📦 Create Lot</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
