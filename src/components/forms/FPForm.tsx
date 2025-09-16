import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import clamflowAPI, { ApiResponse } from '../../lib/clamflow-api';

// ✅ ENHANCED: Schema matching your EXACT backend
const fpFormSchema = z.object({
  lot_id: z.string().min(1, "Lot selection is required"),
  box_number: z.string().min(1, "Box number is required"),
  product_type: z.string().min(1, "Product type is required"),
  grade: z.string().min(1, "Grade is required"),
  weight: z.number().positive("Weight must be positive"),
  qc_staff_id: z.string().min(1, "QC Staff selection is required"),
  packaging_type: z.string().optional(),
  expiry_date: z.string().optional(),
  final_notes: z.string().optional(),
  quality_certification: z.object({
    visual_inspection: z.boolean().optional(),
    weight_verification: z.boolean().optional(),
    packaging_quality: z.boolean().optional(),
    label_accuracy: z.boolean().optional(),
    temperature_log: z.boolean().optional(),
    traceability_complete: z.boolean().optional()
  }).optional()
});

type FPFormData = z.infer<typeof fpFormSchema>;

interface FPFormProps {
  onSubmit?: (data: FPFormData) => void;
  currentUser?: any;
}

const FPForm: React.FC<FPFormProps> = ({ onSubmit, currentUser }) => {
  const [lots, setLots] = useState<Array<{id: string, lot_number: string, status: string}>>([]);
  const [qcStaff, setQcStaff] = useState<Array<{id: string, full_name: string, role: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedPPCForms, setApprovedPPCForms] = useState<Array<any>>([]);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<FPFormData>({
    resolver: zodResolver(fpFormSchema),
    defaultValues: {
      qc_staff_id: currentUser?.id || '',
      quality_certification: {
        visual_inspection: false,
        weight_verification: false,
        packaging_quality: false,
        label_accuracy: false,
        temperature_log: false,
        traceability_complete: false
      }
    }
  });

  // ✅ ENHANCED: Final product types - more refined than PPC
  const finalProductTypes = [
    'Premium Fresh Clam - Export Grade',
    'Standard Fresh Clam - Domestic',
    'Frozen Clam Meat - Premium',
    'Vacuum Packed Clam - Retail',
    'Bulk Clam Meat - Wholesale',
    'Portion Packed Clam - Restaurant',
    'Organic Certified Clam',
    'Processed Clam Products'
  ];

  const finalGrades = [
    'Premium A+ Export',
    'Premium A Export',
    'Standard A Domestic',
    'Grade B+ Premium',
    'Grade B Standard',
    'Bulk Processing Grade',
    'Value Grade',
    'Organic Certified'
  ];

  const packagingTypes = [
    'Vacuum Sealed',
    'Fresh Tray Pack',
    'Frozen Bag',
    'Bulk Container',
    'Retail Portion Pack',
    'Food Service Pack',
    'Export Container',
    'Custom Packaging'
  ];

  const watchedLotId = watch("lot_id");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (watchedLotId) {
      fetchApprovedPPCForms(watchedLotId);
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

  const fetchApprovedPPCForms = async (lotId: string) => {
    try {
      // ✅ FIXED: Using correct API endpoint
      const response = await clamflowAPI.getPPCForms();
      if (response.success && response.data) {
        // Filter for approved PPC forms for this lot
        const approvedForms = response.data.filter(form => 
          form.lot_id === lotId && form.status === 'approved'
        );
        setApprovedPPCForms(approvedForms);
      }
    } catch (error) {
      console.error('Failed to fetch approved PPC forms:', error);
    }
  };

  const submitFPForm = async (data: FPFormData) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // ✅ FIXED: Using correct API endpoint and data structure
      const fpFormData = {
        lot_id: data.lot_id,
        box_number: data.box_number,
        product_type: data.product_type,
        grade: data.grade,
        weight: parseFloat(data.weight.toString()),
        qc_staff_id: data.qc_staff_id,
        packaging_type: data.packaging_type || null,
        expiry_date: data.expiry_date || null,
        final_notes: data.final_notes || null,
        quality_certification: data.quality_certification || {},
        status: 'pending_approval',
        created_at: new Date().toISOString(),
        is_final_product: true
      };

      // ✅ FIXED: Using correct endpoint /api/fp-forms/
      const response = await clamflowAPI.createFPForm(fpFormData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to submit Final Product form');
      }
      
      console.log('✅ Final Product form submitted successfully:', response.data);
      
      if (onSubmit) {
        onSubmit(data);
      }
      
      reset();
      alert('Final Product Form submitted successfully!');
      
    } catch (error: any) {
      console.error('❌ Final Product form submission error:', error);
      setError(error.message || 'Failed to submit Final Product form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">FP (Final Product) Form</h2>
        <p className="text-sm text-gray-600 mt-1">Process approved PPC forms into final market-ready products</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Workflow Status Indicator */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Workflow Status</h3>
        <p className="text-blue-600">
          This form creates final market-ready products from approved PPC forms.
          Select a lot to see available approved PPC forms.
        </p>
        {approvedPPCForms.length > 0 && (
          <div className="mt-2">
            <span className="text-green-600 font-medium">
              ✓ {approvedPPCForms.length} approved PPC form(s) available for final processing
            </span>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit(submitFPForm)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  {lot.lot_number} ({lot.status})
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

          {/* Weight */}
          <div className="form-group">
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
              Final Product Weight (kg) *
            </label>
            <input 
              {...register("weight", { valueAsNumber: true })} 
              type="number" 
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter final weight"
            />
            {errors.weight && (
              <span className="text-red-500 text-sm mt-1">{errors.weight.message}</span>
            )}
          </div>
        </div>

        {/* Product Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </div>

        {/* Packaging & Expiry */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="packaging_type" className="block text-sm font-medium text-gray-700 mb-2">
              Packaging Type
            </label>
            <select 
              {...register("packaging_type")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Packaging Type</option>
              {packagingTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input 
              {...register("expiry_date")} 
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* QC Staff */}
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
                {staff.full_name} ({staff.role})
              </option>
            ))}
          </select>
          {errors.qc_staff_id && (
            <span className="text-red-500 text-sm mt-1">{errors.qc_staff_id.message}</span>
          )}
        </div>

        {/* Quality Certification Checklist */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Final Product Quality Certification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("quality_certification.visual_inspection")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Visual inspection completed</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("quality_certification.weight_verification")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Weight verification done</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("quality_certification.packaging_quality")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Packaging quality check</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("quality_certification.label_accuracy")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Label accuracy verified</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("quality_certification.temperature_log")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Temperature log recorded</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("quality_certification.traceability_complete")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Traceability information complete</span>
            </div>
          </div>
        </div>

        {/* Final Notes */}
        <div className="form-group">
          <label htmlFor="final_notes" className="block text-sm font-medium text-gray-700 mb-2">
            Final Production Notes
          </label>
          <textarea 
            {...register("final_notes")} 
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any final production notes, quality observations, or special handling instructions..."
          />
        </div>

        {/* PPC Forms Reference */}
        {approvedPPCForms.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Source PPC Forms (Approved)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {approvedPPCForms.map((ppc, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="text-sm">
                    <div><strong>Box:</strong> {ppc.box_number}</div>
                    <div><strong>Type:</strong> {ppc.product_type}</div>
                    <div><strong>Grade:</strong> {ppc.grade}</div>
                    <div><strong>Weight:</strong> {ppc.weight} kg</div>
                    <div className="text-green-600 font-medium mt-1">✓ Approved</div>
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
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
        >
          {isSubmitting ? 'Submitting Final Product...' : 'Submit Final Product Form'}
        </button>
      </form>
    </div>
  );
};

export default FPForm;