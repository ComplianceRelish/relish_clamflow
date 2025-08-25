import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Schema matching your EXACT backend
const depurationFormSchema = z.object({
  lot_id: z.string().uuid("Invalid lot ID"),
  sample_extraction_id: z.string().uuid("Invalid sample extraction ID"),
  qc_lead_id: z.string().uuid("QC Lead ID is required"),
  depuration_start_time: z.string().min(1, "Depuration start time is required"),
  results: z.record(z.any()).refine(data => Object.keys(data).length > 0, {
    message: "Results are required"
  }),
  depuration_form_url: z.string().url("Invalid URL format")
});

type DepurationFormData = z.infer<typeof depurationFormSchema>;

interface DepurationFormProps {
  onSubmit?: (data: DepurationFormData) => void;
  authToken?: string;
}

const DepurationForm: React.FC<DepurationFormProps> = ({ 
  onSubmit, 
  authToken 
}) => {
  const [lots, setLots] = useState<Array<{id: string, lot_number: string}>>([]);
  const [sampleExtractions, setSampleExtractions] = useState<Array<{id: string, tank_number: string, lot_id: string}>>([]);
  const [qcLeads, setQcLeads] = useState<Array<{id: string, full_name: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLot, setSelectedLot] = useState<string>('');
  
  // Results form fields
  const [testResults, setTestResults] = useState({
    ph_level: '',
    salinity: '',
    temperature: '',
    bacterial_count: '',
    contaminant_level: '',
    visual_inspection: '',
    notes: ''
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<DepurationFormData>({
    resolver: zodResolver(depurationFormSchema)
  });

  const watchedLotId = watch("lot_id");

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (watchedLotId) {
      fetchSampleExtractions(watchedLotId);
    }
  }, [watchedLotId]);

  const fetchDropdownData = async () => {
    try {
      const [lotsRes, leadsRes] = await Promise.all([
        fetch('https://clamflowbackend-production.up.railway.app/lots', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch('https://clamflowbackend-production.up.railway.app/staff/qc-leads', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      if (lotsRes.ok) setLots(await lotsRes.json());
      if (leadsRes.ok) setQcLeads(await leadsRes.json());
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  };

  const fetchSampleExtractions = async (lotId: string) => {
    try {
      const response = await fetch(`https://clamflowbackend-production.up.railway.app/qa/sample-extractions?lot_id=${lotId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        setSampleExtractions(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch sample extractions:', error);
    }
  };

  const updateResults = () => {
    const results = {
      ph_level: parseFloat(testResults.ph_level) || 0,
      salinity: parseFloat(testResults.salinity) || 0,
      temperature: parseFloat(testResults.temperature) || 0,
      bacterial_count: parseInt(testResults.bacterial_count) || 0,
      contaminant_level: parseFloat(testResults.contaminant_level) || 0,
      visual_inspection: testResults.visual_inspection,
      notes: testResults.notes,
      test_timestamp: new Date().toISOString()
    };
    setValue("results", results);
  };

  useEffect(() => {
    updateResults();
  }, [testResults]);

  const submitDepurationForm = async (data: DepurationFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('https://clamflowbackend-production.up.railway.app/qc-lead/depuration-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          lot_id: data.lot_id,
          sample_extraction_id: data.sample_extraction_id,
          qc_lead_id: data.qc_lead_id,
          depuration_start_time: new Date(data.depuration_start_time).toISOString(),
          results: data.results,
          depuration_form_url: data.depuration_form_url
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to submit depuration form');
      }
      
      const result = await response.json();
      console.log('Depuration form submitted successfully:', result);
      
      if (onSubmit) {
        onSubmit(data);
      }
      
      reset();
      setTestResults({
        ph_level: '',
        salinity: '',
        temperature: '',
        bacterial_count: '',
        contaminant_level: '',
        visual_inspection: '',
        notes: ''
      });
      alert('Depuration Form submitted successfully!');
      
    } catch (error) {
      console.error('Depuration form submission error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Depuration Form</h2>
      
      <form onSubmit={handleSubmit(submitDepurationForm)} className="space-y-6">
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

          {/* Sample Extraction Selection */}
          <div className="form-group">
            <label htmlFor="sample_extraction_id" className="block text-sm font-medium text-gray-700 mb-2">
              Sample Extraction *
            </label>
            <select 
              {...register("sample_extraction_id")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!watchedLotId}
            >
              <option value="">Select Sample Extraction</option>
              {sampleExtractions.map(sample => (
                <option key={sample.id} value={sample.id}>
                  Tank {sample.tank_number}
                </option>
              ))}
            </select>
            {errors.sample_extraction_id && (
              <span className="text-red-500 text-sm mt-1">{errors.sample_extraction_id.message}</span>
            )}
          </div>

          {/* QC Lead Selection */}
          <div className="form-group">
            <label htmlFor="qc_lead_id" className="block text-sm font-medium text-gray-700 mb-2">
              QC Lead *
            </label>
            <select 
              {...register("qc_lead_id")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select QC Lead</option>
              {qcLeads.map(lead => (
                <option key={lead.id} value={lead.id}>
                  {lead.full_name}
                </option>
              ))}
            </select>
            {errors.qc_lead_id && (
              <span className="text-red-500 text-sm mt-1">{errors.qc_lead_id.message}</span>
            )}
          </div>

          {/* Depuration Start Time */}
          <div className="form-group">
            <label htmlFor="depuration_start_time" className="block text-sm font-medium text-gray-700 mb-2">
              Depuration Start Time *
            </label>
            <input 
              {...register("depuration_start_time")} 
              type="datetime-local" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.depuration_start_time && (
              <span className="text-red-500 text-sm mt-1">{errors.depuration_start_time.message}</span>
            )}
          </div>
        </div>

        {/* Test Results Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* pH Level */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                pH Level
              </label>
              <input 
                type="number" 
                step="0.1"
                value={testResults.ph_level}
                onChange={(e) => setTestResults(prev => ({...prev, ph_level: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="7.0"
              />
            </div>

            {/* Salinity */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salinity (%)
              </label>
              <input 
                type="number" 
                step="0.1"
                value={testResults.salinity}
                onChange={(e) => setTestResults(prev => ({...prev, salinity: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3.5"
              />
            </div>

            {/* Temperature */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°C)
              </label>
              <input 
                type="number" 
                step="0.1"
                value={testResults.temperature}
                onChange={(e) => setTestResults(prev => ({...prev, temperature: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="15.0"
              />
            </div>

            {/* Bacterial Count */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bacterial Count (CFU/ml)
              </label>
              <input 
                type="number"
                value={testResults.bacterial_count}
                onChange={(e) => setTestResults(prev => ({...prev, bacterial_count: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100"
              />
            </div>

            {/* Contaminant Level */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contaminant Level (ppm)
              </label>
              <input 
                type="number" 
                step="0.01"
                value={testResults.contaminant_level}
                onChange={(e) => setTestResults(prev => ({...prev, contaminant_level: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.05"
              />
            </div>

            {/* Visual Inspection */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visual Inspection
              </label>
              <select
                value={testResults.visual_inspection}
                onChange={(e) => setTestResults(prev => ({...prev, visual_inspection: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Result</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="Conditional">Conditional</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea 
              value={testResults.notes}
              onChange={(e) => setTestResults(prev => ({...prev, notes: e.target.value}))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional observations or notes..."
            />
          </div>
        </div>

        {/* Depuration Form URL */}
        <div className="form-group">
          <label htmlFor="depuration_form_url" className="block text-sm font-medium text-gray-700 mb-2">
            Depuration Form URL *
          </label>
          <input 
            {...register("depuration_form_url")} 
            type="url" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/depuration-form.pdf"
          />
          {errors.depuration_form_url && (
            <span className="text-red-500 text-sm mt-1">{errors.depuration_form_url.message}</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Depuration Form'}
        </button>
      </form>
    </div>
  );
};

export default DepurationForm;