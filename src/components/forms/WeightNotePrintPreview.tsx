"use client"

import React, { useState, useEffect } from 'react'
import clamflowAPI from '../../lib/clamflow-api'

interface WeightNotePrintPreviewProps {
  weightNoteId: string
  onClose?: () => void
}

interface WeightNoteData {
  id: string
  box_number: string
  weight: number
  raw_material_type?: string
  temperature?: number
  moisture_content?: number
  notes?: string
  created_at: string
  qc_staff_id?: string
  supplier_id?: string
  lot_id?: string
  status?: string
}

const WeightNotePrintPreview: React.FC<WeightNotePrintPreviewProps> = ({
  weightNoteId,
  onClose
}) => {
  const [weightNote, setWeightNote] = useState<WeightNoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadWeightNoteData()
  }, [weightNoteId])

  const loadWeightNoteData = async () => {
    setLoading(true)
    setError('')

    try {
      // ✅ FIXED: Using existing getWeightNotes method + filter
      const response = await clamflowAPI.getWeightNotes()
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load weight note')
      }

      const noteData = response.data.find((note: any) => note.id === weightNoteId)
      
      if (!noteData) {
        throw new Error('Weight note not found')
      }

      setWeightNote(noteData)
    } catch (err: any) {
      console.error('❌ Failed to load weight note:', err)
      setError(err.message || 'Failed to load weight note')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading weight note...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !weightNote) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Weight note not found'}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Print Controls (hidden during print) */}
        <div className="print:hidden flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Weight Note Print Preview</h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-8 bg-white">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ClamFlow System</h1>
            <h2 className="text-xl text-gray-700">Weight Note Certificate</h2>
            <div className="mt-4 h-1 bg-blue-600 w-24 mx-auto"></div>
          </div>

          {/* Weight Note Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weight Note Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-gray-600">Weight Note ID:</span>
                  <span className="font-mono">{weightNote.id}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-gray-600">Box Number:</span>
                  <span className="font-semibold">{weightNote.box_number}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-gray-600">Weight:</span>
                  <span className="font-semibold text-lg">{weightNote.weight} kg</span>
                </div>
                {weightNote.temperature && (
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-medium text-gray-600">Temperature:</span>
                    <span>{weightNote.temperature}°C</span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    weightNote.status === 'approved' ? 'text-green-600' :
                    weightNote.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {weightNote.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-gray-600">Created Date:</span>
                  <span>{new Date(weightNote.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-gray-600">Created Time:</span>
                  <span>{new Date(weightNote.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {weightNote.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <div className="p-4 bg-gray-50 rounded border">
                <p className="text-gray-700">{weightNote.notes}</p>
              </div>
            </div>
          )}

          {/* QR Code Placeholder */}
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 border-2 border-gray-300 flex items-center justify-center mb-2">
                <span className="text-xs text-gray-500">QR Code<br/>Placeholder</span>
              </div>
              <p className="text-xs text-gray-600">Scan for digital verification</p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t mt-8 pt-6 text-center text-xs text-gray-500">
            <p>This document is generated by ClamFlow Quality Management System</p>
            <p>Generated on {new Date().toLocaleString()}</p>
            <p className="mt-2">© 2024 ClamFlow Systems. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeightNotePrintPreview