import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Schema matching your EXACT backend
const fpFormSchema = z.object({
  lot_id: z.string().uuid("Invalid lot ID"),
  box_number: z.string().min(1, "Box number is required"),
  product_type: z.string().min(1, "Product type is required"),
  grade: z.string().min(1, "Grade is required"),
  weight: z.number().positive("Weight must be positive"),
  qc_staff_id: z.string().uuid("QC Staff ID is required") // ADDED required field
});

type FPFormData = z.infer<typeof fpFormSchema>;

interface FPFormProps {
  onSubmit?: (data: FPFormData) => void;
  authToken?: string;
}

const FPForm: React.FC<FPFormProps> = ({ 
  onSubmit, 
  authToken 
}) => {
  const [lots, setLots] = useState<Array<{id: string, lot_number: string}>>([]);
  const [qcStaff, setQcStaff] = useState<Array<{id: string, full_name: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedPPCForms, setApprovedPPCForms] = useState<Array<any>>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<FPFormData>({
    resolver: zodResolver(fpFormSchema)
  });

  // Final product types and grades - more refined than PPC
  const finalProductTypes = [
    'Premium Fresh Clam',
    'Standard Fresh Clam', 
    'Frozen Clam Meat',
    'Vacuum Packed Clam',
    'Export Grade Clam',
    'Domestic Grade Clam'
  ];

  const finalGrades = [
    'Premium A+',
    'Export A',
    'Standard A',
    'Grade B+',
    'Grade B',
    'Processing Grade'
  ];

  const watchedLotId = watch("lot_id");

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (watchedLotId) {
      fetchApprovedPPCForms(watchedLotId);
    }
  }, [watchedLotId]);

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

  const fetchApprovedPPCForms = async (lotId: string) => {
    try {
      const response = await fetch(`https://clamflowbackend-production.up.railway.app/qa/ppc-forms?lot_id=${lotId}&approved=true`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        setApprovedPPCForms(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch approved PPC forms:', error);
    }
  };

  const submitFPForm = async (data: FPFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('https://clamflowbackend-production.up.railway.app/qa/fp-form', {
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
        throw new Error(error.detail || 'Failed to submit FP form');
      }
      
      const result = await response.json();
      console.log('FP form submitted successfully:', result);
      
      if (onSubmit) {
        onSubmit(data);
      }
      
      reset();
      alert('Final Product Form submitted successfully!');
      
    } catch (error) {
      console.error('FP form submission error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">FP (Final Product) Form</h2>
      
      {/* Workflow Status Indicator */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Workflow Status</h3>
        <p className="text-blue-600">
          This form processes final products from approved PPC forms. 
          Select a lot to see available approved PPC forms.
        </p>
        {approvedPPCForms.length > 0 && (
          <div className="mt-2">
            <span className="text-green-600 font-medium">
              ✓ {approvedPPCForms.length} approved PPC form(s) available for processing
            </span>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit(submitFPForm)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              Final Product Box Number *
            </label>
            <input 
              {...register("box_number")} 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter final product box number"
            />
            {errors.box_number && (
              <span className="text-red-500 text-sm mt-1">{errors.box_number.message}</span>
            )}
          </div>

          {/* Final Product Type */}
          <div className="form-group">
            <label htmlFor="product_type" className="block text-sm font-medium text-gray-700 mb-2">
              Final Product Type *
            </label>
            <select 
              {...register("product_type")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Final Product Type</option>
              {finalProductTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.product_type && (
              <span className="text-red-500 text-sm mt-1">{errors.product_type.message}</span>
            )}
          </div>

          {/* Final Grade */}
          <div className="form-group">
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
              Final Grade *
            </label>
            <select 
              {...register("grade")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Final Grade</option>
              {finalGrades.map(grade => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
            {errors.grade && (
              <span className="text-red-500 text-sm mt-1">{errors.grade.message}</span>
            )}
          </div>

          {/* Final Weight */}
          <div className="form-group">
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
              Final Product Weight (kg) *
            </label>
            <input 
              {...register("weight", { valueAsNumber: true })} 
              type="number" 
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter final product weight in kg"
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
        </div>

        {/* PPC Forms Reference */}
        {approvedPPCForms.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Available Approved PPC Forms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {approvedPPCForms.map((ppc, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="text-sm">
                    <div><strong>Box:</strong> {ppc.box_number}</div>
                    <div><strong>Type:</strong> {ppc.product_type}</div>
                    <div><strong>Grade:</strong> {ppc.grade}</div>
                    <div><strong>Weight:</strong> {ppc.weight} kg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Checklist */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Final Product Quality Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Visual inspection completed</span>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Weight verification done</span>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Packaging quality check</span>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Label accuracy verified</span>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Temperature log recorded</span>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Traceability information complete</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Final Product Form'}
        </button>
      </form>
    </div>
  );
};

export default FPForm;