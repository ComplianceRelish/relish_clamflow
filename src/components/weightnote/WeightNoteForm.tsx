'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { weightNotesAPI } from '@/lib/clamflow-api';

export interface WeightNoteFormProps {
  onSuccess: () => void;
}

const WeightNoteForm: React.FC<WeightNoteFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    supplier_name: '',
    vehicle_number: '',
    total_weight: '',
    notes: &apos;&apos;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await weightNotesAPI.create({
        ...formData,
        total_weight: parseFloat(formData.total_weight)
      });
      onSuccess();
    } catch (err) {
      setError('Failed to create weight note');
      console.error(&apos;Error creating weight note:&apos;, err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Supplier Name</label>
        <input
          type="text"
          name="supplier_name"
          value={formData.supplier_name}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Vehicle Number</label>
        <input
          type="text"
          name="vehicle_number"
          value={formData.vehicle_number}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Total Weight (kg)</label>
        <input
          type="number"
          name="total_weight"
          value={formData.total_weight}
          onChange={handleChange}
          required
          step="0.01"
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : &apos;Create Weight Note&apos;}
        </Button>
      </div>
    </form>
  );
};

export default WeightNoteForm;