"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import clamflowAPI, { ApiResponse } from '../../lib/clamflow-api'
import { User } from '../../types/auth'

// ✅ ENHANCED: Schema for sample extraction
const sampleExtractionSchema = z.object({
  lot_id: z.string().min(1, "Lot selection is required"),
  sample_type: z.string().min(1, "Sample type is required"),
  extraction_point: z.string().min(1, "Extraction point is required"),
  sample_size: z.number().positive("Sample size must be positive"),
  container_type: z.string().min(1, "Container type is required"),
  preservation_method: z.string().min(1, "Preservation method is required"),
  qc_staff_id: z.string().min(1, "QC Staff selection is required"),
  extraction_time: z.string().min(1, "Extraction time is required"),
  storage_temperature: z.number(),
  chain_of_custody: z.string().optional(),
  testing_requirements: z.object({
    microbiological: z.boolean().optional(),
    chemical: z.boolean().optional(),
    physical: z.boolean().optional(),
    nutritional: z.boolean().optional(),
    heavy_metals: z.boolean().optional(),
    pesticides: z.boolean().optional()
  }).optional(),
  notes: z.string().optional()
})

type SampleExtractionData = z.infer<typeof sampleExtractionSchema>

interface SampleExtractionFormProps {
  onSubmit?: (data: SampleExtractionData) => void
  currentUser: User | null
}

const SampleExtractionForm: React.FC<SampleExtractionFormProps> = ({ onSubmit, currentUser }) => {
  const [lots, setLots] = useState<Array<{id: string, lot_number: string, status: string}>>([])
  const [qcStaff, setQcStaff] = useState<Array<{id: string, full_name: string, role: string}>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [generatedSampleId, setGeneratedSampleId] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<SampleExtractionData>({
    resolver: zodResolver(sampleExtractionSchema),
    defaultValues: {
      qc_staff_id: currentUser?.id || '',
      storage_temperature: 4, // Default refrigeration temperature
      testing_requirements: {
        microbiological: true,
        chemical: false,
        physical: false,
        nutritional: false,
        heavy_metals: false,
        pesticides: false
      }
    }
  })

  const sampleTypes = [
    'Pre-Processing Sample',
    'Mid-Processing Sample', 
    'Final Product Sample',
    'Environmental Sample',
    'Water Quality Sample',
    'Equipment Swab Sample',
    'Batch Representative Sample',
    'Retain Sample',
    'Reference Sample'
  ]

  const extractionPoints = [
    'Raw Material Intake',
    'After Washing Station',
    'Pre-Processing Area',
    'Processing Line A',
    'Processing Line B',
    'Final Packaging Area',
    'Cold Storage',
    'Shipping Area',
    'Depuration Tank 1',
    'Depuration Tank 2',
    'Quality Control Lab'
  ]

  const containerTypes = [
    'Sterile Sample Bag',
    'Glass Sample Jar',
    'Plastic Sample Container',
    'Vacuum Sample Bag',
    'Insulated Container',
    'Sterile Petri Dish',
    'Sample Tube',
    'Cooled Sample Box'
  ]

  const preservationMethods = [
    'Refrigeration (2-8°C)',
    'Freezing (-18°C)',
    'Frozen with Dry Ice',
    'Room Temperature',
    'Chemical Preservation',
    'Vacuum Sealed',
    'Nitrogen Atmosphere',
    'Immediate Processing'
  ]

  useEffect(() => {
    fetchInitialData()
    generateSampleId()
  }, [])

  useEffect(() => {
    if (currentUser?.id) {
      setValue('qc_staff_id', currentUser.id)
    }
  }, [currentUser, setValue])

  const fetchInitialData = async () => {
    try {
      // ✅ FIXED: Using correct API endpoints
      const [lotsResponse, staffResponse] = await Promise.all([
        clamflowAPI.getLots(),
        clamflowAPI.getStaff()
      ])

      if (lotsResponse.success && lotsResponse.data) {
        setLots(lotsResponse.data)
      }

      if (staffResponse.success && staffResponse.data) {
        const qcOnlyStaff = staffResponse.data.filter(staff => 
          staff.role && (staff.role.includes('QC') || staff.role.includes('Quality'))
        )
        setQcStaff(qcOnlyStaff)
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      setError('Failed to load form data. Please refresh the page.')
    }
  }

  const generateSampleId = () => {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]
    const randomId = Math.random().toString(36).substring(2, 6).toUpperCase()
    const sampleId = `SMP-${timestamp}-${randomId}`
    setGeneratedSampleId(sampleId)
  }

  const submitSampleExtraction = async (data: SampleExtractionData) => {
    setIsSubmitting(true)
    setError('')

    try {
      // ✅ ENHANCED: Complete sample extraction data structure
      const sampleData = {
        sample_id: generatedSampleId,
        lot_id: data.lot_id,
        sample_type: data.sample_type,
        extraction_point: data.extraction_point,
        sample_size: data.sample_size,
        container_type: data.container_type,
        preservation_method: data.preservation_method,
        qc_staff_id: data.qc_staff_id,
        extraction_time: new Date(data.extraction_time).toISOString(),
        storage_temperature: data.storage_temperature,
        chain_of_custody: data.chain_of_custody || generatedSampleId,
        testing_requirements: data.testing_requirements || {},
        notes: data.notes || null,
        status: 'extracted',
        created_at: new Date().toISOString(),
        extracted_by: currentUser?.full_name || 'Unknown'
      }

      // ✅ NOTE: This would typically be a new endpoint like /api/samples/
      // For now, we'll use a generic API call
      const response = await clamflowAPI.post('/api/samples/', sampleData)

      if (!response.success) {
        throw new Error(response.error || 'Failed to submit sample extraction')
      }

      console.log('✅ Sample extraction submitted successfully:', response.data)

      if (onSubmit) {
        onSubmit(data)
      }

      reset()
      generateSampleId()
      alert(`Sample ${generatedSampleId} extracted successfully!`)

    } catch (error: any) {
      console.error('❌ Sample extraction submission error:', error)
      setError(error.message || 'Failed to submit sample extraction')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sample Extraction Form</h2>
        <p className="text-sm text-gray-600 mt-1">Extract samples for quality control testing and analysis</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Sample ID Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Generated Sample ID</h3>
        <div className="flex items-center justify-between">
          <code className="text-2xl font-mono bg-white px-4 py-2 rounded border">
            {generatedSampleId}
          </code>
          <button
            type="button"
            onClick={generateSampleId}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Generate New ID
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(submitSampleExtraction)} className="space-y-8">
        {/* Basic Sample Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          <div className="form-group">
            <label htmlFor="sample_type" className="block text-sm font-medium text-gray-700 mb-2">
              Sample Type *
            </label>
            <select 
              {...register("sample_type")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Sample Type</option>
              {sampleTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.sample_type && (
              <span className="text-red-500 text-sm mt-1">{errors.sample_type.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="extraction_point" className="block text-sm font-medium text-gray-700 mb-2">
              Extraction Point *
            </label>
            <select 
              {...register("extraction_point")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Extraction Point</option>
              {extractionPoints.map(point => (
                <option key={point} value={point}>
                  {point}
                </option>
              ))}
            </select>
            {errors.extraction_point && (
              <span className="text-red-500 text-sm mt-1">{errors.extraction_point.message}</span>
            )}
          </div>
        </div>

        {/* Sample Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="sample_size" className="block text-sm font-medium text-gray-700 mb-2">
              Sample Size (grams) *
            </label>
            <input 
              {...register("sample_size", { valueAsNumber: true })} 
              type="number"
              step="0.1"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter sample size in grams"
            />
            {errors.sample_size && (
              <span className="text-red-500 text-sm mt-1">{errors.sample_size.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="extraction_time" className="block text-sm font-medium text-gray-700 mb-2">
              Extraction Time *
            </label>
            <input 
              {...register("extraction_time")} 
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.extraction_time && (
              <span className="text-red-500 text-sm mt-1">{errors.extraction_time.message}</span>
            )}
          </div>
        </div>

        {/* Container & Preservation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="container_type" className="block text-sm font-medium text-gray-700 mb-2">
              Container Type *
            </label>
            <select 
              {...register("container_type")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Container Type</option>
              {containerTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.container_type && (
              <span className="text-red-500 text-sm mt-1">{errors.container_type.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="preservation_method" className="block text-sm font-medium text-gray-700 mb-2">
              Preservation Method *
            </label>
            <select 
              {...register("preservation_method")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Preservation Method</option>
              {preservationMethods.map(method => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            {errors.preservation_method && (
              <span className="text-red-500 text-sm mt-1">{errors.preservation_method.message}</span>
            )}
          </div>
        </div>

        {/* Storage & Chain of Custody */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="storage_temperature" className="block text-sm font-medium text-gray-700 mb-2">
              Storage Temperature (°C)
            </label>
            <input 
              {...register("storage_temperature", { valueAsNumber: true })} 
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 4.0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="chain_of_custody" className="block text-sm font-medium text-gray-700 mb-2">
              Chain of Custody ID
            </label>
            <input 
              {...register("chain_of_custody")} 
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Auto: ${generatedSampleId}`}
            />
          </div>
        </div>

        {/* Testing Requirements */}
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Required Testing</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("testing_requirements.microbiological")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Microbiological</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("testing_requirements.chemical")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Chemical</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("testing_requirements.physical")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Physical</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("testing_requirements.nutritional")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Nutritional</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("testing_requirements.heavy_metals")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Heavy Metals</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("testing_requirements.pesticides")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Pesticides</span>
            </div>
          </div>
        </div>

        {/* QC Staff & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          <div className="form-group">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Extraction Notes
            </label>
            <textarea 
              {...register("notes")} 
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any notes about the sample extraction..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
        >
          {isSubmitting ? 'Extracting Sample...' : 'Extract Sample'}
        </button>
      </form>
    </div>
  )
}

export default SampleExtractionForm