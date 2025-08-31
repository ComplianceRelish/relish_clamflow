"use client"

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../../types/supabase'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type Supplier = Database['public']['Tables']['suppliers']['Row']
type Lot = Database['public']['Tables']['lots']['Row']

interface WeightNoteFormProps {
  onSubmit?: (weightNoteId: string) => void
  onCancel?: () => void
  currentUser: UserProfile | null
}

const WeightNoteForm: React.FC<WeightNoteFormProps> = ({ onSubmit, onCancel, currentUser }) => {
  const supabase = createClientComponentClient<Database>()
  
  const [formData, setFormData] = useState({
    lot_id: '',
    supplier_id: '',
    box_number: '',
    weight: ''
  })
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadSuppliers()
    loadLots()
  }, [])

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'approved')
      .order('first_name')
    
    setSuppliers(data || [])
  }

  const loadLots = async () => {
    const { data } = await supabase
      .from('lots')
      .select('*')
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
    
    setLots(data || [])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.lot_id || !formData.supplier_id || !formData.box_number || !formData.weight) {
        throw new Error('All fields are required')
      }

      if (!currentUser?.id) {
        throw new Error('User not authenticated')
      }

      const weightValue = parseFloat(formData.weight)
      if (isNaN(weightValue) || weightValue <= 0) {
        throw new Error('Weight must be a positive number')
      }

      // Create weight note with correct schema
      const { data, error: insertError } = await supabase
        .from('weight_notes')
        .insert({
          lot_id: formData.lot_id,
          supplier_id: formData.supplier_id,
          box_number: formData.box_number,
          weight: weightValue,
          qc_staff_id: currentUser.id,
          authentication_step: 1,
          qc_approval_status: 'pending',
          workflow_completed: false
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Create authentication session
      await supabase
        .from('authentication_sessions')
        .insert({
          weight_note_id: data.id,
          session_type: 'weight_note_creation',
          current_step: 1,
          qc_staff_id: currentUser.id,
          status: 'active'
        })

      if (onSubmit) {
        onSubmit(data.id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create weight note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Weight Note</h2>
        <p className="text-sm text-gray-600 mt-1">Enter weight note information for quality control processing</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Lot Selection */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lot Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lot_id" className="block text-sm font-medium text-gray-700 mb-1">
                Lot *
              </label>
              <select
                id="lot_id"
                name="lot_id"
                value={formData.lot_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a lot</option>
                {lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.lot_number} ({lot.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                id="supplier_id"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.first_name} {supplier.last_name} ({supplier.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Weight Information */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weight Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="box_number" className="block text-sm font-medium text-gray-700 mb-1">
                Box Number *
              </label>
              <input
                type="text"
                id="box_number"
                name="box_number"
                value={formData.box_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter box number"
                required
              />
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg) *
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter weight in kg"
                required
              />
            </div>
          </div>
        </div>

        {/* Current User Info */}
        <div className="bg-yellow-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">QC Staff Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-600">Name:</span> {currentUser?.full_name}</div>
            <div><span className="text-gray-600">Role:</span> {currentUser?.role}</div>
            <div><span className="text-gray-600">Station:</span> {currentUser?.station || 'Not specified'}</div>
            <div><span className="text-gray-600">Username:</span> {currentUser?.username || 'Not specified'}</div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Creating...' : 'Create Weight Note'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default WeightNoteForm