// frontend/components/weightnote/WeightNotePrintable.tsx
"use client"

import React, { useRef } from 'react'
import { WeightNote } from '../../types/supabase'

interface WeightNotePrintableProps {
  weightNote: WeightNote
  onComplete: () => void
  onCancel: () => void
}

export const WeightNotePrintable: React.FC<WeightNotePrintableProps> = ({
  weightNote,
  onComplete,
  onCancel
}) => {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div>
      {/* Print Controls */}
      <div className="no-print bg-white rounded-lg shadow-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Print Options</h3>
        <div className="flex space-x-4">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            🖨️ Print Weight Note
          </button>
          <button
            onClick={onComplete}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            ✓ Complete
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            ✗ Cancel
          </button>
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef} className="bg-white rounded-lg shadow-lg p-6">
        <style jsx>{`
          .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .company-info { text-align: center; margin-bottom: 20px; }
          .weight-note-title { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
          .info-section { margin: 15px 0; }
          .info-section h3 { background: #f0f0f0; padding: 8px; margin: 10px 0 5px 0; border-left: 4px solid #007bff; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 10px 0; }
          .info-item { margin: 5px 0; }
          .info-label { font-weight: bold; color: #333; }
          .info-value { color: #666; margin-left: 10px; }
          .signatures { margin-top: 40px; }
          .signature-section { margin: 20px 0; }
          .signature-box { border: 1px solid #ccc; min-height: 80px; padding: 10px; background: #fafafa; margin: 10px 0; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; padding-top: 20px; border-top: 1px solid #eee; }
          @media print {
            .no-print { display: none; }
          }
        `}</style>
        {/* Header */}
        <div className="header">
          <div className="company-info">
            <h1 className="text-2xl font-bold">ClamFlow Quality Control</h1>
            <p className="text-gray-600">Seafood Processing & Quality Assurance</p>
          </div>
        </div>

        <div className="weight-note-title">
          WEIGHT NOTE
          {weightNote.box_number && (
            <div className="text-lg font-normal text-gray-600">
              #{weightNote.box_number}
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="info-section">
          <h3>Weight Note Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Box Number:</span>
              <span className="info-value"> {weightNote.box_number || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Weight:</span>
              <span className="info-value"> {weightNote.weight} kg</span>
            </div>
            <div className="info-item">
              <span className="info-label">Lot ID:</span>
              <span className="info-value"> {weightNote.lot_id || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Supplier ID:</span>
              <span className="info-value"> {weightNote.supplier_id || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="info-section">
          <h3>Status Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">QC Approved:</span>
              <span className="info-value"> {weightNote.qc_approved ? 'Yes' : 'No'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Authentication Step:</span>
              <span className="info-value"> {weightNote.authentication_step || 1}</span>
            </div>
          </div>
        </div>


        {/* Print Control Buttons */}
        <div className="info-section no-print">
          <div className="flex space-x-4 justify-center">
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Complete
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Signatures */}
        <div className="signatures">
          <div className="info-grid">
            <div className="signature-section">
              <div className="info-label">QC Staff Signature:</div>
              <div className="signature-box"></div>
              <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '12px' }}>
                Date: ___________
              </div>
            </div>
            <div className="signature-section">
              <div className="info-label">Production Lead Signature:</div>
              <div className="signature-box"></div>
              <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '12px' }}>
                Date: ___________
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>Generated on: {new Date().toLocaleString()}</p>
          <p>ClamFlow Quality Control System - Weight Note Document</p>
        </div>
      </div>
    </div>
  )
}

export default WeightNotePrintable
