// frontend/components/WeightNote/WeightNoteForm.tsx
"use client"

import React, { useState, useEffect } from 'react'
import { useWeightNote } from '../../hooks/useWeightNote'
import { WeightNoteData } from '../../types/supabase'

interface WeightNoteFormProps {
  onSubmit?: (weightNote: WeightNoteData) => void
  initialData?: Partial<WeightNoteData>
}

const WeightNoteForm: React.FC<WeightNoteFormProps> = ({ onSubmit, initialData }) => {
  const { createWeightNote, loading, error } = useWeightNote()

  const [formData, setFormData] = useState({
    // Product Information
    product_code: initialData?.product_info?.product_code || '',
    product_name: initialData?.product_info?.product_name || '',
    batch_number: initialData?.product_info?.batch_number || '',
    variety: initialData?.product_info?.variety || '',
    grade: initialData?.product_info?.grade || '',

    // Supplier Information
    supplier_code: initialData?.supplier_info?.supplier_code || '',
    supplier_name: initialData?.supplier_info?.supplier_name || '',
    contact_person: initialData?.supplier_info?.contact_person || '',
    vehicle_number: initialData?.supplier_info?.vehicle_number || '',

    // Weight Information
    gross_weight: initialData?.gross_weight || 0,
    tare_weight: initialData?.tare_weight || 0,

    // Quality Parameters
    temperature: initialData?.quality_parameters?.temperature || '',
    moisture_content: initialData?.quality_parameters?.moisture_content || '',
    foreign_objects: initialData?.quality_parameters?.foreign_objects || false,
    visual_inspection_notes: initialData?.quality_parameters?.visual_inspection_notes || ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Required product fields
    if (!formData.product_code.trim()) {
      errors.product_code = 'Product code is required'
    }
    if (!formData.product_name.trim()) {
      errors.product_name = 'Product name is required'
    }

    // Required supplier fields
    if (!formData.supplier_code.trim()) {
      errors.supplier_code = 'Supplier code is required'
    }
    if (!formData.supplier_name.trim()) {
      errors.supplier_name = 'Supplier name is required'
    }

    // Weight validation
    if (formData.gross_weight <= 0) {
      errors.gross_weight = 'Gross weight must be greater than 0'
    }
    if (formData.tare_weight < 0) {
      errors.tare_weight = 'Tare weight cannot be negative'
    }
    if (formData.gross_weight <= formData.tare_weight) {
      errors.weight_comparison = 'Gross weight must be greater than tare weight'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : 
               type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               value
    }))

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const weightNoteData: Omit<WeightNoteData, 'id' | 'created_at' | 'updated_at'> = {
      product_info: {
        product_code: formData.product_code,
        product_name: formData.product_name,
        batch_number: formData.batch_number,
        variety: formData.variety,
        grade: formData.grade
      },
      supplier_info: {
        supplier_code: formData.supplier_code,
        supplier_name: formData.supplier_name,
        contact_person: formData.contact_person,
        vehicle_number: formData.vehicle_number
      },
      gross_weight: formData.gross_weight,
      tare_weight: formData.tare_weight,
      quality_parameters: {
        temperature: parseFloat(formData.temperature as string) || undefined,
        moisture_content: parseFloat(formData.moisture_content as string) || undefined,
        foreign_objects: formData.foreign_objects,
        visual_inspection_notes: formData.visual_inspection_notes
      }
    }

    const result = await createWeightNote(weightNoteData)
    if (result && onSubmit) {
      onSubmit(result as WeightNoteData)
    }
  }

  const netWeight = formData.gross_weight - formData.tare_weight

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Weight Note</h2>
        <p className="text-sm text-gray-600 mt-1">Enter product and supplier information for quality control processing</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Information Section */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="product_code" className="block text-sm font-medium text-gray-700 mb-1">
                Product Code *
              </label>
              <input
                type="text"
                id="product_code"
                name="product_code"
                value={formData.product_code}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.product_code ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter product code"
              />
              {formErrors.product_code && (
                <p className="text-red-600 text-xs mt-1">{formErrors.product_code}</p>
              )}
            </div>

            <div>
              <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                id="product_name"
                name="product_name"
                value={formData.product_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.product_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
              />
              {formErrors.product_name && (
                <p className="text-red-600 text-xs mt-1">{formErrors.product_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="batch_number" className="block text-sm font-medium text-gray-700 mb-1">
                Batch Number
              </label>
              <input
                type="text"
                id="batch_number"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter batch number"
              />
            </div>

            <div>
              <label htmlFor="variety" className="block text-sm font-medium text-gray-700 mb-1">
                Variety
              </label>
              <input
                type="text"
                id="variety"
                name="variety"
                value={formData.variety}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter variety"
              />
            </div>

            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                Grade
              </label>
              <select
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select grade</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Supplier Information Section */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="supplier_code" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Code *
              </label>
              <input
                type="text"
                id="supplier_code"
                name="supplier_code"
                value={formData.supplier_code}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.supplier_code ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter supplier code"
              />
              {formErrors.supplier_code && (
                <p className="text-red-600 text-xs mt-1">{formErrors.supplier_code}</p>
              )}
            </div>

            <div>
              <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name *
              </label>
              <input
                type="text"
                id="supplier_name"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.supplier_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter supplier name"
              />
              {formErrors.supplier_name && (
                <p className="text-red-600 text-xs mt-1">{formErrors.supplier_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter contact person"
              />
            </div>

            <div>
              <label htmlFor="vehicle_number" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Number
              </label>
              <input
                type="text"
                id="vehicle_number"
                name="vehicle_number"
                value={formData.vehicle_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter vehicle number"
              />
            </div>
          </div>
        </div>

        {/* Weight Information Section */}
        <div className="bg-yellow-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weight Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="gross_weight" className="block text-sm font-medium text-gray-700 mb-1">
                Gross Weight (kg) *
              </label>
              <input
                type="number"
                id="gross_weight"
                name="gross_weight"
                value={formData.gross_weight}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                  formErrors.gross_weight || formErrors.weight_comparison ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {formErrors.gross_weight && (
                <p className="text-red-600 text-xs mt-1">{formErrors.gross_weight}</p>
              )}
            </div>

            <div>
              <label htmlFor="tare_weight" className="block text-sm font-medium text-gray-700 mb-1">
                Tare Weight (kg) *
              </label>
              <input
                type="number"
                id="tare_weight"
                name="tare_weight"
                value={formData.tare_weight}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                  formErrors.tare_weight || formErrors.weight_comparison ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {formErrors.tare_weight && (
                <p className="text-red-600 text-xs mt-1">{formErrors.tare_weight}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Net Weight (kg)
              </label>
              <div className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-medium ${
                netWeight > 0 ? 'text-green-700' : 'text-gray-500'
              }`}>
                {netWeight.toFixed(2)}
              </div>
            </div>

            {formErrors.weight_comparison && (
              <div className="col-span-full">
                <p className="text-red-600 text-xs">{formErrors.weight_comparison}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quality Parameters Section */}
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                id="temperature"
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter temperature"
              />
            </div>

            <div>
              <label htmlFor="moisture_content" className="block text-sm font-medium text-gray-700 mb-1">
                Moisture Content (%)
              </label>
              <input
                type="number"
                id="moisture_content"
                name="moisture_content"
                value={formData.moisture_content}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter moisture content"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="foreign_objects"
                  name="foreign_objects"
                  checked={formData.foreign_objects}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="foreign_objects" className="ml-2 block text-sm text-gray-700">
                  Foreign objects detected
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="visual_inspection_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Visual Inspection Notes
              </label>
              <textarea
                id="visual_inspection_notes"
                name="visual_inspection_notes"
                value={formData.visual_inspection_notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter visual inspection notes..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
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