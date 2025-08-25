import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Schema matching your EXACT backend
const sampleExtractionSchema = z.object({
  lot_id: z.string().uuid("Invalid lot ID"),
  tank_number: z.string().min(1, "Tank number is required"),
  column_number: z.string().min(1, "Column number is required"), // FIXED field name
  row_number: z.string().min(1, "Row number is required"),       // FIXED field name
  weight: z.number().positive("Weight must be positive"),
  pieces_count: z.number().int().positive("Pieces count must be positive")
});

type SampleExtractionFormData = z.infer<typeof sampleExtractionSchema>;

interface SampleExtractionFormProps {
  onSubmit?: (data: SampleExtractionFormData) => void;
  authToken?: string;
}

const SampleExtractionForm: React.FC<SampleExtractionFormProps> = ({ 
  onSubmit, 
  authToken 
}) => {
  const [lots, setLots] = useState<Array<{id: string, lot_number: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SampleExtractionFormData>({
    resolver: zodResolver(sampleExtractionSchema)
  });

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    try {
      const response = await fetch('https://clamflowbackend-production.up.railway.app/lots', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        setLots(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch lots:', error);
    }
  };

  const submitSampleExtraction = async (data: SampleExtractionFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('https://clamflowbackend-production.up.railway.app/qa/sample-extraction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          lot_id: data.lot_id,
          tank_number: data.tank_number,
          column_number: data.column_number, // FIXED field name
          row_number: data.row_number,       // FIXED field name
          weight: parseFloat(data.weight.toString()),
          pieces_count: parseInt(data.pieces_count.toString())
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to submit sample extraction');
      }
      
      const result = await response.json();
      console.log('Sample extraction submitted successfully:', result);
      
      if (onSubmit) {
        onSubmit(data);
      }
      
      reset();
      alert('Sample Extraction submitted successfully!');
      
    } catch (error) {
      console.error('Sample extraction submission error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Sample Extraction Form</h2>
      
      <form onSubmit={handleSubmit(submitSampleExtraction)} className="space-y-6">
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

        {/* Tank Number */}
        <div className="form-group">
          <label htmlFor="tank_number" className="block text-sm font-medium text-gray-700 mb-2">
            Tank Number *
          </label>
          <input 
            {...register("tank_number")} 
            type="text" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter tank number"
          />
          {errors.tank_number && (
            <span className="text-red-500 text-sm mt-1">{errors.tank_number.message}</span>
          )}
        </div>

        {/* Column Number */}
        <div className="form-group">
          <label htmlFor="column_number" className="block text-sm font-medium text-gray-700 mb-2">
            Column Number *
          </label>
          <input 
            {...register("column_number")} 
            type="text" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter column number"
          />
          {errors.column_number && (
            <span className="text-red-500 text-sm mt-1">{errors.column_number.message}</span>
          )}
        </div>

        {/* Row Number */}
        <div className="form-group">
          <label htmlFor="row_number" className="block text-sm font-medium text-gray-700 mb-2">
            Row Number *
          </label>
          <input 
            {...register("row_number")} 
            type="text" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter row number"
          />
          {errors.row_number && (
            <span className="text-red-500 text-sm mt-1">{errors.row_number.message}</span>
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

        {/* Pieces Count */}
        <div className="form-group">
          <label htmlFor="pieces_count" className="block text-sm font-medium text-gray-700 mb-2">
            Pieces Count *
          </label>
          <input 
            {...register("pieces_count", { valueAsNumber: true })} 
            type="number" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter number of pieces"
          />
          {errors.pieces_count && (
            <span className="text-red-500 text-sm mt-1">{errors.pieces_count.message}</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Sample Extraction'}
        </button>
      </form>
    </div>
  );
};

export default SampleExtractionForm;