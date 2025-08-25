import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Schema matching your EXACT backend
const weightNoteSchema = z.object({
  lot_id: z.string().uuid("Invalid lot ID"),
  supplier_id: z.string().uuid("Invalid supplier ID"), 
  box_number: z.string().min(1, "Box number is required"),
  weight: z.number().positive("Weight must be positive"),
  qc_staff_id: z.string().uuid("QC Staff ID is required")
});

type WeightNoteFormData = z.infer<typeof weightNoteSchema>;

interface WeightNoteFormProps {
  onSubmit?: (data: WeightNoteFormData) => void;
  authToken?: string;
}

const WeightNoteForm: React.FC<WeightNoteFormProps> = ({ 
  onSubmit, 
  authToken 
}) => {
  const [lots, setLots] = useState<Array<{id: string, lot_number: string}>>([]);
  const [suppliers, setSuppliers] = useState<Array<{id: string, first_name: string, last_name: string}>>([]);
  const [qcStaff, setQcStaff] = useState<Array<{id: string, full_name: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<WeightNoteFormData>({
    resolver: zodResolver(weightNoteSchema)
  });

  // Fetch dropdown data
  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      // Fetch lots, suppliers, and QC staff from your backend
      // These endpoints would need to be added to your backend
      const [lotsRes, suppliersRes, staffRes] = await Promise.all([
        fetch('https://clamflowbackend-production.up.railway.app/lots', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch('https://clamflowbackend-production.up.railway.app/suppliers', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch('https://clamflowbackend-production.up.railway.app/staff/qc', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      if (lotsRes.ok) setLots(await lotsRes.json());
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
      if (staffRes.ok) setQcStaff(await staffRes.json());
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  };

  const submitWeightNote = async (data: WeightNoteFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('https://clamflowbackend-production.up.railway.app/qa/weight-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          lot_id: data.lot_id,
          supplier_id: data.supplier_id,
          box_number: data.box_number,
          weight: parseFloat(data.weight.toString()),
          qc_staff_id: data.qc_staff_id
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to submit weight note');
      }
      
      const result = await response.json();
      console.log('Weight note submitted successfully:', result);
      
      // Call parent callback if provided
      if (onSubmit) {
        onSubmit(data);
      }
      
      // Reset form
      reset();
      alert('Weight Note submitted successfully!');
      
    } catch (error) {
      console.error('Weight note submission error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Weight Note Form</h2>
      
      <form onSubmit={handleSubmit(submitWeightNote)} className="space-y-6">
        {/* Lot Selection */}
        <div className="form-group">
          <label htmlFor="lot_id" className="block text-sm font-medium text-gray-700 mb-2">
            Lot *
          </label>
          <select 
            {...register("lot_id")} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Lot</option>
            {lots.map(lot => (
              <option key={lot.id} value={lot.id}>
                {lot.lot_number}
              </option>
            ))}
          </select>
          {errors.lot_id && (
            <span className="text-red-500 text-sm mt-1">{errors.lot_id.message}</span>
          )}
        </div>

        {/* Supplier Selection */}
        <div className="form-group">
          <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-2">
            Supplier *
          </label>
          <select 
            {...register("supplier_id")} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Supplier</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.first_name} {supplier.last_name}
              </option>
            ))}
          </select>
          {errors.supplier_id && (
            <span className="text-red-500 text-sm mt-1">{errors.supplier_id.message}</span>
          )}
        </div>

        {/* Box Number */}
        <div className="form-group">
          <label htmlFor="box_number" className="block text-sm font-medium text-gray-700 mb-2">
            Box Number *
          </label>
          <input 
            {...register("box_number")} 
            type="text" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter box number"
          />
          {errors.box_number && (
            <span className="text-red-500 text-sm mt-1">{errors.box_number.message}</span>
          )}
        </div>

        {/* Weight */}
        <div className="form-group">
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg) *
          </label>
          <input 
            {...register("weight", { valueAsNumber: true })} 
            type="number" 
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter weight in kg"
          />
          {errors.weight && (
            <span className="text-red-500 text-sm mt-1">{errors.weight.message}</span>
          )}
        </div>

        {/* QC Staff Selection */}
        <div className="form-group">
          <label htmlFor="qc_staff_id" className="block text-sm font-medium text-gray-700 mb-2">
            QC Staff *
          </label>
          <select 
            {...register("qc_staff_id")} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select QC Staff</option>
            {qcStaff.map(staff => (
              <option key={staff.id} value={staff.id}>
                {staff.full_name}
              </option>
            ))}
          </select>
          {errors.qc_staff_id && (
            <span className="text-red-500 text-sm mt-1">{errors.qc_staff_id.message}</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Weight Note'}
        </button>
      </form>
    </div>
  );
};

export default WeightNoteForm;