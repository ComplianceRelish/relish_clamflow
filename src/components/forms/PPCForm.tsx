import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Schema matching your EXACT backend
const ppcFormSchema = z.object({
  lot_id: z.string().uuid("Invalid lot ID"),
  box_number: z.string().min(1, "Box number is required"),
  product_type: z.string().min(1, "Product type is required"),
  grade: z.string().min(1, "Grade is required"),
  weight: z.number().positive("Weight must be positive"),
  qc_staff_id: z.string().uuid("QC Staff ID is required") // ADDED required field
});

type PPCFormData = z.infer<typeof ppcFormSchema>;

interface PPCFormProps {
  onSubmit?: (data: PPCFormData) => void;
  authToken?: string;
}

const PPCForm: React.FC<PPCFormProps> = ({ 
  onSubmit, 
  authToken 
}) => {
  const [lots, setLots] = useState<Array<{id: string, lot_number: string}>>([]);
  const [qcStaff, setQcStaff] = useState<Array<{id: string, full_name: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PPCFormData>({
    resolver: zodResolver(ppcFormSchema)
  });

  // Product types and grades - adjust based on your business logic
  const productTypes = [
    'Fresh Clam',
    'Processed Clam',
    'Frozen Clam',
    'Dried Clam'
  ];

  const grades = [
    'A+',
    'A',
    'B+',
    'B',
    'C'
  ];

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [lotsRes, staffRes] = await Promise.all([
        fetch('https://clamflowbackend-production.up.railway.app/lots', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch('https://clamflowbackend-production.up.railway.app/staff/qc', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      if (lotsRes.ok) setLots(await lotsRes.json());
      if (staffRes.ok) setQcStaff(await staffRes.json());
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  };

  const submitPPCForm = async (data: PPCFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('https://clamflowbackend-production.up.railway.app/qa/ppc-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          lot_id: data.lot_id,
          box_number: data.box_number,
          product_type: data.product_type,
          grade: data.grade,
          weight: parseFloat(data.weight.toString()),
          qc_staff_id: data.qc_staff_id // ADDED required field
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to submit PPC form');
      }
      
      const result = await response.json();
      console.log('PPC form submitted successfully:', result);
      
      if (onSubmit) {
        onSubmit(data);
      }
      
      reset();
      alert('PPC Form submitted successfully!');
      
    } catch (error) {
      console.error('PPC form submission error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">PPC (Pre-Packed Clam) Form</h2>
      
      <form onSubmit={handleSubmit(submitPPCForm)} className="space-y-6">
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

        {/* Product Type */}
        <div className="form-group">
          <label htmlFor="product_type" className="block text-sm font-medium text-gray-700 mb-2">
            Product Type *
          </label>
          <select 
            {...register("product_type")} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Product Type</option>
            {productTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.product_type && (
            <span className="text-red-500 text-sm mt-1">{errors.product_type.message}</span>
          )}
        </div>

        {/* Grade */}
        <div className="form-group">
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
            Grade *
          </label>
          <select 
            {...register("grade")} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Grade</option>
            {grades.map(grade => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
          {errors.grade && (
            <span className="text-red-500 text-sm mt-1">{errors.grade.message}</span>
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
          className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit PPC Form'}
        </button>
      </form>
    </div>
  );
};

export default PPCForm;