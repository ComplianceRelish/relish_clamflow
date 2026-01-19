"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import clamflowAPI, { ApiResponse } from '../../lib/clamflow-api'
import { User } from '../../types/auth'

// ✅ QC Flow Form Schema
const qcFlowFormSchema = z.object({
  form_type: z.string().min(1, "Form type is required"),
  lot_id: z.string().min(1, "Lot selection is required"),
  station_id: z.string().min(1, "Station selection is required"),
  qc_staff_id: z.string().min(1, "QC Staff selection is required"),
  test_parameters: z.object({
    visual_inspection: z.boolean().optional(),
    weight_check: z.boolean().optional(),
    temperature_check: z.boolean().optional(),
    ph_level: z.boolean().optional(),
    bacterial_count: z.boolean().optional(),
    foreign_matter: z.boolean().optional()
  }).optional(),
  measurements: z.object({
    temperature: z.number().optional(),
    ph_value: z.number().optional(),
    bacterial_count: z.number().optional(),
    sample_weight: z.number().optional()
  }).optional(),
  observations: z.string().optional(),
  pass_fail_status: z.enum(['pass', 'fail', 'conditional']),
  corrective_actions: z.string().optional(),
  notes: z.string().optional()
})

type QCFlowFormData = z.infer<typeof qcFlowFormSchema>

interface QCFlowFormProps {
  onSubmit?: (data: QCFlowFormData) => void
  currentUser: User | null
  preselectedLot?: string
  preselectedFormType?: string
}

const QCFlowForm: React.FC<QCFlowFormProps> = ({
  onSubmit,
  currentUser,
  preselectedLot,
  preselectedFormType
}) => {
  const [lots, setLots] = useState<Array<{id: string, lot_number: string, status: string}>>([])
  const [stations, setStations] = useState<Array<{id: string, name: string, type: string}>>([])
  const [qcStaff, setQcStaff] = useState<Array<{id: string, full_name: string, role: string}>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<QCFlowFormData>({
    resolver: zodResolver(qcFlowFormSchema),
    defaultValues: {
      qc_staff_id: currentUser?.id || '',
      form_type: preselectedFormType || '',
      lot_id: preselectedLot || '',
      pass_fail_status: 'pass',
      test_parameters: {
        visual_inspection: true,
        weight_check: true,
        temperature_check: false,
        ph_level: false,
        bacterial_count: false,
        foreign_matter: true
      },
      measurements: {}
    }
  })

  const formTypes = [
    'Incoming Material QC',
    'In-Process QC Check',
    'Pre-Packaging QC',
    'Final Product QC',
    'Environmental QC',
    'Equipment Validation',
    'Batch Release QC'
  ]

  const watchedFormType = watch("form_type")
  const watchedPassFail = watch("pass_fail_status")

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (currentUser?.id) {
      setValue('qc_staff_id', currentUser.id)
    }
  }, [currentUser, setValue])

  useEffect(() => {
    if (preselectedLot) {
      setValue('lot_id', preselectedLot)
    }
    if (preselectedFormType) {
      setValue('form_type', preselectedFormType)
    }
  }, [preselectedLot, preselectedFormType, setValue])

  const fetchInitialData = async () => {
    try {
      // ✅ FIXED: Using correct ClamFlow API endpoints
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

      // Fetch stations from API
      try {
        const stationsResponse = await clamflowAPI.getStations()
        if (stationsResponse.success && stationsResponse.data) {
          const stationData = Array.isArray(stationsResponse.data) ? stationsResponse.data : []
          setStations(stationData.map((s: any) => ({
            id: s.stationId || s.id || String(Math.random()),
            name: s.stationName || s.name || 'Unknown Station',
            type: s.stationType || s.type || 'processing'
          })))
        } else {
          // No stations available from API
          setStations([])
        }
      } catch (stationErr) {
        console.warn('Could not fetch stations:', stationErr)
        setStations([])
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      setError('Failed to load form data. Please refresh the page.')
    }
  }

  const submitQCForm = async (data: QCFlowFormData) => {
    setIsSubmitting(true)
    setError('')

    try {
      // ✅ FIXED: Using correct API endpoint
      const qcFormData = {
        form_type: data.form_type,
        lot_id: data.lot_id,
        station_id: data.station_id,
        qc_staff_id: data.qc_staff_id,
        test_parameters: data.test_parameters || {},
        measurements: data.measurements || {},
        observations: data.observations || null,
        pass_fail_status: data.pass_fail_status,
        corrective_actions: data.corrective_actions || null,
        notes: data.notes || null,
        status: 'completed',
        created_at: new Date().toISOString()
      }

      // ✅ FIXED: Using correct endpoint
      const response = await clamflowAPI.createQCForm(qcFormData)

      if (!response.success) {
        throw new Error(response.error || 'Failed to submit QC form')
      }

      console.log('✅ QC form submitted successfully:', response.data)

      if (onSubmit) {
        onSubmit(data)
      }

      reset()
      alert('QC Form submitted successfully!')

    } catch (error: any) {
      console.error('❌ QC form submission error:', error)
      setError(error.message || 'Failed to submit QC form')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">QC Flow Form</h2>
        <p className="text-sm text-gray-600 mt-1">Quality control inspection and testing form</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(submitQCForm)} className="space-y-8">
        {/* Basic Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="form_type" className="block text-sm font-medium text-gray-700 mb-2">
              QC Form Type *
            </label>
            <select 
              {...register("form_type")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select QC Form Type</option>
              {formTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.form_type && (
              <span className="text-red-500 text-sm mt-1">{errors.form_type.message}</span>
            )}
          </div>

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
            <label htmlFor="station_id" className="block text-sm font-medium text-gray-700 mb-2">
              Station/Location *
            </label>
            <select 
              {...register("station_id")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Station</option>
              {stations.map(station => (
                <option key={station.id} value={station.id}>
                  {station.name} ({station.type})
                </option>
              ))}
            </select>
            {errors.station_id && (
              <span className="text-red-500 text-sm mt-1">{errors.station_id.message}</span>
            )}
          </div>

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
        </div>

        {/* Test Parameters */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Parameters</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("test_parameters.visual_inspection")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Visual Inspection</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("test_parameters.weight_check")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Weight Check</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("test_parameters.temperature_check")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Temperature</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("test_parameters.ph_level")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">pH Level</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("test_parameters.bacterial_count")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Bacterial Count</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("test_parameters.foreign_matter")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Foreign Matter</span>
            </div>
          </div>
        </div>

        {/* Measurements */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Measurements & Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="form-group">
              <label htmlFor="measurements.temperature" className="block text-sm font-medium text-gray-700 mb-1">
                Temperature (°C)
              </label>
              <input 
                {...register("measurements.temperature", { valueAsNumber: true })} 
                type="number"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 4.5"
              />
            </div>

            <div className="form-group">
              <label htmlFor="measurements.ph_value" className="block text-sm font-medium text-gray-700 mb-1">
                pH Value
              </label>
              <input 
                {...register("measurements.ph_value", { valueAsNumber: true })} 
                type="number"
                step="0.1"
                min="0"
                max="14"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 7.2"
              />
            </div>

            <div className="form-group">
              <label htmlFor="measurements.bacterial_count" className="block text-sm font-medium text-gray-700 mb-1">
                Bacterial Count (CFU/g)
              </label>
              <input 
                {...register("measurements.bacterial_count", { valueAsNumber: true })} 
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 1000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="measurements.sample_weight" className="block text-sm font-medium text-gray-700 mb-1">
                Sample Weight (g)
              </label>
              <input 
                {...register("measurements.sample_weight", { valueAsNumber: true })} 
                type="number"
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 100.0"
              />
            </div>
          </div>
        </div>

        {/* Pass/Fail Status */}
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">QC Result *</h3>
          <div className="flex space-x-6">
            <label className="flex items-center">
              <input
                type="radio"
                {...register("pass_fail_status")}
                value="pass"
                className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500"
              />
              <span className="text-green-700 font-medium">Pass</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                {...register("pass_fail_status")}
                value="conditional"
                className="mr-2 h-4 w-4 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="text-yellow-700 font-medium">Conditional Pass</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                {...register("pass_fail_status")}
                value="fail"
                className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500"
              />
              <span className="text-red-700 font-medium">Fail</span>
            </label>
          </div>
          {errors.pass_fail_status && (
            <span className="text-red-500 text-sm mt-1">{errors.pass_fail_status.message}</span>
          )}
        </div>

        {/* Observations & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-2">
              Observations
            </label>
            <textarea 
              {...register("observations")} 
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter detailed observations from the inspection..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea 
              {...register("notes")} 
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any additional notes or comments..."
            />
          </div>
        </div>

        {/* Corrective Actions (if fail or conditional) */}
        {(watchedPassFail === 'fail' || watchedPassFail === 'conditional') && (
          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-4">
              Corrective Actions Required
            </h3>
            <textarea 
              {...register("corrective_actions")} 
              rows={4}
              className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Describe the corrective actions required to address the issues found..."
              required={watchedPassFail === 'fail'}
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
        >
          {isSubmitting ? 'Submitting QC Form...' : 'Submit QC Form'}
        </button>
      </form>
    </div>
  )
}

export default QCFlowForm