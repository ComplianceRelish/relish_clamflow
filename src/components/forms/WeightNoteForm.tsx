// src/components/forms/WeightNoteForm.tsx - SIMPLIFIED & WORKING VERSION
"use client";

import React, { useState, useEffect } from 'react';
import { User } from '@/types/auth';

interface WeightNoteFormProps {
  onSubmit: (weightNoteId: string) => void;
  onCancel: () => void;
  currentUser: User | null;
}

const WeightNoteForm: React.FC<WeightNoteFormProps> = ({ 
  onSubmit, 
  onCancel, 
  currentUser 
}) => {
  const [step, setStep] = useState<'supplier' | 'weighing' | 'quality'>('supplier');
  const [supplierVerified, setSupplierVerified] = useState(false);

  const [formData, setFormData] = useState({
    supplier_id: '',
    supplier_name: 'Test Supplier',
    delivery_note: '',
    vehicle_info: '',
    box_number: 'BOX-001',
    weight_gross: 0,
    weight_tare: 0,
    temperature: 2.1,
    moisture_content: 85.0,
    visual_quality: 'Good' as const,
    shell_condition: 'Intact' as const,
    notes: ''
  });

  // Auto-save draft to localStorage
  useEffect(() => {
    localStorage.setItem('weightNoteDraft', JSON.stringify(formData));
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem('weightNoteDraft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn('Failed to load draft');
      }
    }
  }, []);

  const calculateNetWeight = () => {
    return parseFloat((formData.weight_gross - formData.weight_tare).toFixed(3));
  };

  const handleSubmit = async () => {
    const netWeight = calculateNetWeight();
    
    if (!supplierVerified || netWeight <= 0) {
      alert('Please complete all steps and enter valid weights');
      return;
    }

    try {
      // Backend: /weight-notes/ (POST to create)
      const response = await fetch('/weight-notes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `wn-${Date.now()}`,
          ...formData,
          weight_net: netWeight,
          recorded_by: currentUser?.id,
          station: 'WEIGHT_NOTE',
          timestamp: new Date().toISOString(),
          status: 'pending'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Clear draft
        localStorage.removeItem('weightNoteDraft');
        
        onSubmit(result.id || `wn-${Date.now()}`);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      alert('Submission failed. Check network connection.');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-2 text-center">Weight Note</h2>
      <p className="text-xs text-red-600 text-center mb-4">
        🚨 This enables ALL downstream processing
      </p>

      {/* Step Indicator */}
      <div className="flex justify-between mb-6">
        {[
          { step: 'supplier', label: 'Supplier' },
          { step: 'weighing', label: 'Weighing' },
          { step: 'quality', label: 'Quality' }
        ].map(({ step: s, label }) => (
          <div key={s} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              (s === 'supplier' && supplierVerified) ||
              (s === 'weighing' && calculateNetWeight() > 0)
                ? 'bg-green-600 text-white'
                : step === s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
            }`}>
              {s === 'supplier' && '1'}
              {s === 'weighing' && '2'}
              {s === 'quality' && '3'}
            </div>
            <span className="text-xs mt-1">{label}</span>
          </div>
        ))}
      </div>

      {/* Supplier Verification - Simplified */}
      {step === 'supplier' && (
        <div className="border-b pb-4">
          <h3 className="font-medium mb-2">1. Supplier Verification</h3>
          <input
            type="text"
            placeholder="Supplier ID"
            value={formData.supplier_id}
            onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-2"
          />
          <button
            onClick={() => {
              if (formData.supplier_id) {
                setSupplierVerified(true);
                setStep('weighing');
              } else {
                alert('Please enter supplier ID');
              }
            }}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            Verify Supplier
          </button>
        </div>
      )}

      {/* Weighing */}
      {step === 'weighing' && (
        <div className="border-b pb-4">
          <h3 className="font-medium mb-2">2. Weighing</h3>
          <input
            name="weight_gross"
            type="number"
            step="0.01"
            placeholder="Gross Weight (kg)"
            value={formData.weight_gross || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              weight_gross: parseFloat(e.target.value) || 0 
            }))}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            required
          />
          <input
            name="weight_tare"
            type="number"
            step="0.01"
            placeholder="Tare Weight (kg)"
            value={formData.weight_tare || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              weight_tare: parseFloat(e.target.value) || 0 
            }))}
            className="w-full p-3 border border-gray-300 rounded-lg mt-2 text-sm"
            required
          />
          <div className="mt-2 p-3 bg-gray-100 rounded-lg text-sm">
            Net Weight: <strong>{calculateNetWeight()} kg</strong>
          </div>
          <button
            onClick={() => setStep('quality')}
            disabled={calculateNetWeight() <= 0}
            className="w-full mt-3 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
          >
            Continue to Quality
          </button>
        </div>
      )}

      {/* Quality Parameters */}
      {step === 'quality' && (
        <div>
          <h3 className="font-medium mb-2">3. Quality Check</h3>
          <select
            value={formData.visual_quality}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              visual_quality: e.target.value as any 
            }))}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm"
          >
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
          <input
            type="number"
            step="0.1"
            placeholder="Temperature (°C)"
            value={formData.temperature || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              temperature: parseFloat(e.target.value) || 0 
            }))}
            className="w-full p-3 border border-gray-300 rounded-lg mt-2 text-sm"
          />
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg mt-2 text-sm"
            rows={2}
          />
          
          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-3 bg-green-600 text-white rounded-lg text-sm font-medium"
            >
              Submit for QC
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeightNoteForm;