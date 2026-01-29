import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import clamflowAPI, { ApiResponse } from '../../lib/clamflow-api';

// ✅ ENHANCED: Schema matching your EXACT backend
const ppcFormSchema = z.object({
  lot_id: z.string().min(1, "Lot selection is required"),
  box_number: z.string().min(1, "Box number is required"),
  product_type: z.string().min(1, "Product type is required"),
  grade: z.string().min(1, "Grade is required"),
  weight: z.number().positive("Weight must be positive"),
  qc_staff_id: z.string().min(1, "QC Staff selection is required"),
  processing_notes: z.string().optional(),
  quality_parameters: z.object({
    freshness: z.string().optional(),
    color: z.string().optional(),
    texture: z.string().optional(),
    smell: z.string().optional()
  }).optional()
});

type PPCFormData = z.infer<typeof ppcFormSchema>;

interface PPCFormProps {
  onSubmit?: (data: PPCFormData) => void;
  currentUser?: any;
}

const PPCForm: React.FC<PPCFormProps> = ({ onSubmit, currentUser }) => {
  // Use API response types - LotResponse uses 'lotNumber', StaffMember uses 'fullName'
  const [lots, setLots] = useState<Array<{id: string, lotNumber: string, status: string}>>([])
  const [qcStaff, setQcStaff] = useState<Array<{id: string, fullName: string, role: string}>>([])
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedWeightNotes, setApprovedWeightNotes] = useState<Array<any>>([]);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<PPCFormData>({
    resolver: zodResolver(ppcFormSchema),
    defaultValues: {
      qc_staff_id: currentUser?.id || '',
      quality_parameters: {
        freshness: '',
        color: '',
        texture: '',
        smell: ''
      }
    }
  });

  // ✅ ENHANCED: Product types and grades based on ClamFlow business logic
  const productTypes = [
    'Fresh Clam Meat',
    'Pre-Packed Fresh Clam',
    'Processed Clam Meat',
    'Cleaned Clam Meat',
    'Grade A Clam Meat',
    'Export Quality Clam'
  ];

  const grades = [
    'Premium A+',
    'Grade A',
    'Grade B+', 
    'Grade B',
    'Processing Grade',
    'Export Grade'
  ];

  const qualityOptions = {
    freshness: ['Excellent', 'Good', 'Fair', 'Poor'],
    color: ['Natural', 'Pale', 'Dark', 'Off-color'],
    texture: ['Firm', 'Tender', 'Soft', 'Mushy'],
    smell: ['Fresh', 'Mild', 'Strong', 'Off']
  };

  const watchedLotId = watch("lot_id");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (watchedLotId) {
      fetchApprovedWeightNotes(watchedLotId);
    }
  }, [watchedLotId]);

  useEffect(() => {
    if (currentUser?.id) {
      setValue('qc_staff_id', currentUser.id);
    }
  }, [currentUser, setValue]);

  const fetchInitialData = async () => {
    try {
      // ✅ FIXED: Using correct API endpoints
      const [lotsResponse, staffResponse] = await Promise.all([
        clamflowAPI.getLots(),
        clamflowAPI.getStaff()
      ]);

      if (lotsResponse.success && lotsResponse.data) {
        setLots(lotsResponse.data);
      }

      if (staffResponse.success && staffResponse.data) {
        // Filter for QC staff
        const qcOnlyStaff = staffResponse.data.filter(staff => 
          staff.role && (staff.role.includes('QC') || staff.role.includes('Quality'))
        );
        setQcStaff(qcOnlyStaff);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setError('Failed to load form data. Please refresh the page.');
    }
  };

  const fetchApprovedWeightNotes = async (lotId: string) => {
    try {
      // ✅ FIXED: Using correct API endpoint
      const response = await clamflowAPI.getWeightNotes();
      if (response.success && response.data) {
        // Filter for approved weight notes for this lot
        const approvedNotes = response.data.filter(note => 
          note.lot_id === lotId && note.status === 'approved'
        );
        setApprovedWeightNotes(approvedNotes);
      }
    } catch (error) {
      console.error('Failed to fetch approved weight notes:', error);
    }
  };

  const submitPPCForm = async (data: PPCFormData) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // ✅ FIXED: Using correct API endpoint and data structure
      const ppcFormData = {
        lot_id: data.lot_id,
        box_number: data.box_number,
        product_type: data.product_type,
        grade: data.grade,
        weight: parseFloat(data.weight.toString()),
        qc_staff_id: data.qc_staff_id,
        processing_notes: data.processing_notes || null,
        quality_parameters: data.quality_parameters || {},
        status: 'pending_approval',
        created_at: new Date().toISOString()
      };

      // ✅ FIXED: Using correct endpoint /api/ppc-forms/
      const response = await clamflowAPI.createPPCForm(ppcFormData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to submit PPC form');
      }
      
      console.log('✅ PPC form submitted successfully:', response.data);
      
      if (onSubmit) {
        onSubmit(data);
      }
      
      reset();
      alert('PPC Form submitted successfully!');
      
    } catch (error: any) {
      console.error('❌ PPC form submission error:', error);
      setError(error.message || 'Failed to submit PPC form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">PPC (Pre-Packed Clam) Form</h2>
        <p className="text-sm text-gray-600 mt-1">Process approved weight notes into pre-packed clam products</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Workflow Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Workflow Status</h3>
        <p className="text-blue-600">
          This form processes approved weight notes into pre-packed products.
          {approvedWeightNotes.length > 0 && (
            <span className="block mt-2 text-green-600 font-medium">
              ✓ {approvedWeightNotes.length} approved weight note(s) available for processing
            </span>
          )}
        </p>
      </div>
      
      <form onSubmit={handleSubmit(submitPPCForm)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  {lot.lotNumber} ({lot.status})
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
              PPC Box Number *
            </label>
            <input 
              {...register("box_number")} 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter PPC box number"
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
                  {staff.fullName} ({staff.role})
                </option>
              ))}
            </select>
            {errors.qc_staff_id && (
              <span className="text-red-500 text-sm mt-1">{errors.qc_staff_id.message}</span>
            )}
          </div>
        </div>

        {/* Quality Parameters */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quality Assessment</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(qualityOptions).map(([parameter, options]) => (
              <div key={parameter} className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {parameter}
                </label>
                <select 
                  {...register(`quality_parameters.${parameter as keyof typeof qualityOptions}`)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                >
                  <option value="">Select {parameter}</option>
                  {options.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Processing Notes */}
        <div className="form-group">
          <label htmlFor="processing_notes" className="block text-sm font-medium text-gray-700 mb-2">
            Processing Notes
          </label>
          <textarea 
            {...register("processing_notes")} 
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any processing notes or observations..."
          />
        </div>

        {/* Available Weight Notes Reference */}
        {approvedWeightNotes.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Available Approved Weight Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {approvedWeightNotes.map((note, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="text-sm">
                    <div><strong>Box:</strong> {note.box_number}</div>
                    <div><strong>Type:</strong> {note.raw_material_type}</div>
                    <div><strong>Weight:</strong> {note.weight} kg</div>
                    <div><strong>Status:</strong> <span className="text-green-600">Approved</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
        >
          {isSubmitting ? 'Submitting...' : 'Submit PPC Form'}
        </button>
      </form>
    </div>
  );
};

export default PPCForm;