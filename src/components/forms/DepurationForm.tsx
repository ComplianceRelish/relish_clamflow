"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import clamflowAPI, { ApiResponse } from '../../lib/clamflow-api'
import { User } from '../../types/auth'

// ✅ ENHANCED: Schema matching ClamFlow backend
const depurationFormSchema = z.object({
  sample_id: z.string().min(1, "Sample ID is required"),
  lot_id: z.string().min(1, "Lot selection is required"),
  depuration_tank_id: z.string().min(1, "Tank selection is required"),
  start_time: z.string().min(1, "Start time is required"),
  planned_duration: z.number().positive("Duration must be positive"),
  initial_salinity: z.number().positive("Initial salinity is required"),
  initial_temperature: z.number().positive("Initial temperature is required"),
  initial_ph: z.number().min(6).max(9, "pH must be between 6-9"),
  qc_staff_id: z.string().min(1, "QC Staff selection is required"),
  notes: z.string().optional(),
  water_source: z.string().min(1, "Water source is required"),
  filtration_type: z.string().min(1, "Filtration type is required"),
  monitoring_parameters: z.object({
    salinity_checks: z.boolean().optional(),
    temperature_monitoring: z.boolean().optional(),
    ph_monitoring: z.boolean().optional(),
    turbidity_checks: z.boolean().optional(),
    bacterial_testing: z.boolean().optional()
  }).optional()
})

type DepurationFormData = z.infer<typeof depurationFormSchema>

interface DepurationFormProps {
  onSubmit?: (data: DepurationFormData) => void
  currentUser: User | null
}

const DepurationForm: React.FC<DepurationFormProps> = ({ onSubmit, currentUser }) => {
  const [lots, setLots] = useState<Array<{id: string, lot_number: string, status: string}>>([])
  const [qcStaff, setQcStaff] = useState<Array<{id: string, full_name: string, role: string}>>([])
  const [tanks, setTanks] = useState<Array<{id: string, tank_number: string, capacity: number, status: string}>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [availableSamples, setAvailableSamples] = useState<Array<any>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<DepurationFormData>({
    resolver: zodResolver(depurationFormSchema),
    defaultValues: {
      qc_staff_id: currentUser?.id || '',
      planned_duration: 24, // Default 24 hours
      monitoring_parameters: {
        salinity_checks: true,
        temperature_monitoring: true,
        ph_monitoring: true,
        turbidity_checks: false,
        bacterial_testing: false
      }
    }
  })

  const waterSources = [
    'Municipal Treated Water',
    'Filtered Seawater',
    'UV Treated Seawater',
    'Ozonated Seawater',
    'RO Processed Water'
  ]

  const filtrationTypes = [
    'Sand Filtration',
    'Carbon Filtration',
    'UV Sterilization',
    'Ozone Treatment',
    'Multi-Stage Filtration',
    'Membrane Filtration'
  ]

  const watchedLotId = watch("lot_id")

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (currentUser?.id) {
      setValue('qc_staff_id', currentUser.id)
    }
  }, [currentUser, setValue])

  useEffect(() => {
    if (watchedLotId) {
      fetchAvailableSamples(watchedLotId)
    }
  }, [watchedLotId])

  const fetchInitialData = async () => {
    try {
      // ✅ FIXED: Using correct API endpoints
      const [lotsResponse, staffResponse] = await Promise.all([
        clamflowAPI.getLots(),
        clamflowAPI.getStaff()
      ])

      if (lotsResponse.success && lotsResponse.data) {
        setLots(lotsResponse.data.filter(lot => lot.status === 'in_progress' || lot.status === 'ready_for_depuration'))
      }

      if (staffResponse.success && staffResponse.data) {
        const qcOnlyStaff = staffResponse.data.filter(staff => 
          staff.role && (staff.role.includes('QC') || staff.role.includes('Quality'))
        )
        setQcStaff(qcOnlyStaff)
      }

      // Fetch tanks from API
      try {
        const tanksResponse = await clamflowAPI.get('/api/depuration/tanks');
        if (tanksResponse.success && tanksResponse.data) {
          setTanks(Array.isArray(tanksResponse.data) ? tanksResponse.data : []);
        } else {
          setTanks([]);
        }
      } catch {
        console.warn('Failed to fetch tanks');
        setTanks([]);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      setError('Failed to load form data. Please refresh the page.')
    }
  }

  const fetchAvailableSamples = async (lotId: string) => {
    try {
      // Fetch samples from API
      const samplesResponse = await clamflowAPI.get(`/api/lots/${lotId}/samples`);
      if (samplesResponse.success && samplesResponse.data) {
        setAvailableSamples(Array.isArray(samplesResponse.data) ? samplesResponse.data : []);
      } else {
        setAvailableSamples([]);
      }
    } catch (error) {
      console.error('Failed to fetch available samples:', error)
      setAvailableSamples([]);
    }
  }

  const submitDepurationForm = async (data: DepurationFormData) => {
    setIsSubmitting(true)
    setError('')

    try {
      // ✅ FIXED: Using correct API endpoint and data structure
      const depurationData = {
        sample_id: data.sample_id,
        lot_id: data.lot_id,
        depuration_tank_id: data.depuration_tank_id,
        start_time: new Date(data.start_time).toISOString(),
        planned_duration: data.planned_duration,
        initial_salinity: data.initial_salinity,
        initial_temperature: data.initial_temperature,
        initial_ph: data.initial_ph,
        qc_staff_id: data.qc_staff_id,
        notes: data.notes || null,
        water_source: data.water_source,
        filtration_type: data.filtration_type,
        monitoring_parameters: data.monitoring_parameters || {},
        status: 'active',
        created_at: new Date().toISOString()
      }

      // ✅ FIXED: Using correct endpoint /api/depuration/form
      const response = await clamflowAPI.submitDepurationForm(depurationData)

      if (!response.success) {
        throw new Error(response.error || 'Failed to submit depuration form')
      }

      console.log('✅ Depuration form submitted successfully:', response.data)

      if (onSubmit) {
        onSubmit(data)
      }

      reset()
      alert('Depuration form submitted successfully!')

    } catch (error: any) {
      console.error('❌ Depuration form submission error:', error)
      setError(error.message || 'Failed to submit depuration form')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Depuration Process Form</h2>
        <p className="text-sm text-gray-600 mt-1">Initialize depuration process for clam purification</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Process Information */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Depuration Process</h3>
        <p className="text-blue-600 text-sm">
          Depuration removes sand, grit, and impurities from clams using controlled water circulation. 
          Typical process duration is 24-48 hours with continuous monitoring of water quality parameters.
        </p>
      </div>

      <form onSubmit={handleSubmit(submitDepurationForm)} className="space-y-8">
        {/* Basic Information */}
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
            <label htmlFor="sample_id" className="block text-sm font-medium text-gray-700 mb-2">
              Sample ID *
            </label>
            <select 
              {...register("sample_id")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Sample</option>
              {availableSamples.map(sample => (
                <option key={sample.id} value={sample.id}>
                  {sample.id} - {sample.sample_type}
                </option>
              ))}
            </select>
            {errors.sample_id && (
              <span className="text-red-500 text-sm mt-1">{errors.sample_id.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="depuration_tank_id" className="block text-sm font-medium text-gray-700 mb-2">
              Depuration Tank *
            </label>
            <select 
              {...register("depuration_tank_id")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Tank</option>
              {tanks.filter(tank => tank.status === 'available').map(tank => (
                <option key={tank.id} value={tank.id}>
                  {tank.tank_number} (Capacity: {tank.capacity}L)
                </option>
              ))}
            </select>
            {errors.depuration_tank_id && (
              <span className="text-red-500 text-sm mt-1">{errors.depuration_tank_id.message}</span>
            )}
          </div>
        </div>

        {/* Timing Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <input 
              {...register("start_time")} 
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.start_time && (
              <span className="text-red-500 text-sm mt-1">{errors.start_time.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="planned_duration" className="block text-sm font-medium text-gray-700 mb-2">
              Planned Duration (hours) *
            </label>
            <input 
              {...register("planned_duration", { valueAsNumber: true })} 
              type="number"
              min="1"
              max="72"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter duration in hours"
            />
            {errors.planned_duration && (
              <span className="text-red-500 text-sm mt-1">{errors.planned_duration.message}</span>
            )}
          </div>
        </div>

        {/* Water Quality Parameters */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Initial Water Quality Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-group">
              <label htmlFor="initial_salinity" className="block text-sm font-medium text-gray-700 mb-2">
                Initial Salinity (ppt) *
              </label>
              <input 
                {...register("initial_salinity", { valueAsNumber: true })} 
                type="number"
                step="0.1"
                min="25"
                max="40"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 35.0"
              />
              {errors.initial_salinity && (
                <span className="text-red-500 text-sm mt-1">{errors.initial_salinity.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="initial_temperature" className="block text-sm font-medium text-gray-700 mb-2">
                Initial Temperature (°C) *
              </label>
              <input 
                {...register("initial_temperature", { valueAsNumber: true })} 
                type="number"
                step="0.1"
                min="4"
                max="25"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 15.5"
              />
              {errors.initial_temperature && (
                <span className="text-red-500 text-sm mt-1">{errors.initial_temperature.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="initial_ph" className="block text-sm font-medium text-gray-700 mb-2">
                Initial pH *
              </label>
              <input 
                {...register("initial_ph", { valueAsNumber: true })} 
                type="number"
                step="0.1"
                min="6"
                max="9"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 8.2"
              />
              {errors.initial_ph && (
                <span className="text-red-500 text-sm mt-1">{errors.initial_ph.message}</span>
              )}
            </div>
          </div>
        </div>

        {/* Water Treatment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="water_source" className="block text-sm font-medium text-gray-700 mb-2">
              Water Source *
            </label>
            <select 
              {...register("water_source")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Water Source</option>
              {waterSources.map(source => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            {errors.water_source && (
              <span className="text-red-500 text-sm mt-1">{errors.water_source.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="filtration_type" className="block text-sm font-medium text-gray-700 mb-2">
              Filtration Type *
            </label>
            <select 
              {...register("filtration_type")} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Filtration Type</option>
              {filtrationTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.filtration_type && (
              <span className="text-red-500 text-sm mt-1">{errors.filtration_type.message}</span>
            )}
          </div>
        </div>

        {/* Monitoring Parameters */}
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monitoring Parameters</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("monitoring_parameters.salinity_checks")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Salinity Checks</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("monitoring_parameters.temperature_monitoring")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Temperature Monitoring</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("monitoring_parameters.ph_monitoring")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">pH Monitoring</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("monitoring_parameters.turbidity_checks")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Turbidity Checks</span>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...register("monitoring_parameters.bacterial_testing")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Bacterial Testing</span>
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
              Process Notes
            </label>
            <textarea 
              {...register("notes")} 
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any special notes about the depuration process..."
            />
          </div>
        </div>

        {/* Tank Status Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Tank Status Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {tanks.map(tank => (
              <div 
                key={tank.id} 
                className={`p-3 rounded border text-center ${
                  tank.status === 'available' 
                    ? 'bg-green-100 border-green-300' 
                    : tank.status === 'in_use'
                    ? 'bg-yellow-100 border-yellow-300'
                    : 'bg-red-100 border-red-300'
                }`}
              >
                <div className="font-medium text-sm">{tank.tank_number}</div>
                <div className="text-xs text-gray-600">{tank.capacity}L</div>
                <div className={`text-xs font-medium ${
                  tank.status === 'available' ? 'text-green-700' : 
                  tank.status === 'in_use' ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {tank.status.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
        >
          {isSubmitting ? 'Starting Depuration Process...' : 'Start Depuration Process'}
        </button>
      </form>
    </div>
  )
}

export default DepurationForm