"use client"

// src/components/qc/QRLabelGenerator.tsx
// QR Label Generation Interface - Based on Figma Framework
// Used in FP workflow to generate QR labels for final products

import React, { useState, useRef } from 'react'
import clamflowAPI from '../../lib/clamflow-api'
import { QRLabelData } from '../../types/qc-workflow'

interface QRLabelGeneratorProps {
  lotId: string
  boxNumber: string
  productType: string
  grade: string
  weight: number
  rfidTagId?: string
  staffId: string
  onLabelGenerated: (labelData: QRLabelData) => void
  onClose: () => void
  originalBoxNumber?: string
}

const QRLabelGenerator: React.FC<QRLabelGeneratorProps> = ({
  lotId,
  boxNumber,
  productType,
  grade,
  weight,
  rfidTagId,
  staffId,
  onLabelGenerated,
  onClose,
  originalBoxNumber
}) => {
  const [generating, setGenerating] = useState(false)
  const [generatedLabel, setGeneratedLabel] = useState<QRLabelData | null>(null)
  const [error, setError] = useState('')
  const [printCount, setPrintCount] = useState(1)
  const [includeBarcode, setIncludeBarcode] = useState(true)
  const labelRef = useRef<HTMLDivElement>(null)

  // Calculate expiry date (default 12 months from pack date)
  const packDate = new Date()
  const expiryDate = new Date(packDate)
  expiryDate.setMonth(expiryDate.getMonth() + 12)

  // Generate traceability code
  const generateTraceabilityCode = (): string => {
    const dateCode = packDate.toISOString().slice(0, 10).replace(/-/g, '')
    const lotCode = lotId.slice(-6).toUpperCase()
    const boxCode = boxNumber.replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase()
    return `CF-${dateCode}-${lotCode}-${boxCode}`
  }

  // Generate QR label
  const handleGenerateLabel = async () => {
    setGenerating(true)
    setError('')

    try {
      const labelRequest = {
        lotId: lotId,
        boxNumber: boxNumber,
        productType: productType,
        grade: grade,
        weight: weight,
        rfidTagId: rfidTagId,
        staffId: staffId,
        originalBoxNumber: originalBoxNumber
      }

      const response = await clamflowAPI.generateQRLabel(labelRequest)

      if (response.success && response.data) {
        const labelData: QRLabelData = {
          id: response.data.id,
          qr_code_data: response.data.qrCodeData,
          qr_code_image: response.data.qrCodeImage,
          lot_id: lotId,
          box_number: boxNumber,
          product_type: productType,
          grade: grade,
          weight: weight,
          pack_date: packDate.toISOString(),
          expiry_date: expiryDate.toISOString(),
          traceability_code: response.data.labelData.traceabilityCode,
          generated_at: response.data.generatedAt,
          generated_by: response.data.generatedBy
        }
        
        setGeneratedLabel(labelData)
      } else {
        // Generate locally if API fails (demo mode)
        const traceabilityCode = generateTraceabilityCode()
        const demoLabel: QRLabelData = {
          id: `LBL-${Date.now()}`,
          qr_code_data: JSON.stringify({
            lot: lotId,
            box: boxNumber,
            product: productType,
            grade: grade,
            weight: weight,
            trace: traceabilityCode,
            pack: packDate.toISOString(),
            expiry: expiryDate.toISOString()
          }),
          qr_code_image: '', // Would be base64 in real implementation
          lot_id: lotId,
          box_number: boxNumber,
          product_type: productType,
          grade: grade,
          weight: weight,
          pack_date: packDate.toISOString(),
          expiry_date: expiryDate.toISOString(),
          traceability_code: traceabilityCode,
          generated_at: new Date().toISOString(),
          generated_by: staffId
        }
        
        setGeneratedLabel(demoLabel)
      }
    } catch (err: any) {
      // Fallback to demo generation
      const traceabilityCode = generateTraceabilityCode()
      const demoLabel: QRLabelData = {
        id: `LBL-${Date.now()}`,
        qr_code_data: JSON.stringify({
          lot: lotId,
          box: boxNumber,
          product: productType,
          grade: grade,
          weight: weight,
          trace: traceabilityCode
        }),
        qr_code_image: '',
        lot_id: lotId,
        box_number: boxNumber,
        product_type: productType,
        grade: grade,
        weight: weight,
        pack_date: packDate.toISOString(),
        expiry_date: expiryDate.toISOString(),
        traceability_code: traceabilityCode,
        generated_at: new Date().toISOString(),
        generated_by: staffId
      }
      
      setGeneratedLabel(demoLabel)
    } finally {
      setGenerating(false)
    }
  }

  // Print label
  const handlePrint = () => {
    if (!generatedLabel) return

    // Create print window
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow) {
      setError('Unable to open print window. Please check popup blocker settings.')
      return
    }

    const labelHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Product Label - ${generatedLabel.box_number}</title>
        <style>
          @page { size: 100mm 150mm; margin: 5mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
          .label { border: 2px solid #000; padding: 10px; max-width: 90mm; }
          .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
          .logo { font-size: 18px; font-weight: bold; }
          .qr-container { text-align: center; margin: 10px 0; }
          .qr-placeholder { width: 80px; height: 80px; border: 1px dashed #666; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666; }
          .info-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
          .info-label { font-weight: bold; }
          .trace-code { text-align: center; font-family: monospace; font-size: 10px; margin-top: 10px; background: #f0f0f0; padding: 5px; }
          .barcode-placeholder { text-align: center; margin-top: 10px; height: 30px; background: linear-gradient(90deg, #000 2px, transparent 2px) repeat-x; background-size: 4px; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">
            <div class="logo">🦪 ClamFlow</div>
            <div style="font-size: 10px;">Premium Quality Seafood</div>
          </div>
          
          <div class="qr-container">
            <div class="qr-placeholder">[QR Code]</div>
          </div>
          
          <div class="info-row">
            <span class="info-label">Product:</span>
            <span>${generatedLabel.product_type}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Grade:</span>
            <span>${generatedLabel.grade}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Net Weight:</span>
            <span>${generatedLabel.weight} kg</span>
          </div>
          <div class="info-row">
            <span class="info-label">Box No:</span>
            <span>${generatedLabel.box_number}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Pack Date:</span>
            <span>${new Date(generatedLabel.pack_date).toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Best Before:</span>
            <span>${new Date(generatedLabel.expiry_date).toLocaleDateString()}</span>
          </div>
          
          <div class="trace-code">
            ${generatedLabel.traceability_code}
          </div>
          
          ${includeBarcode ? '<div class="barcode-placeholder"></div>' : ''}
          
          <div style="text-align: center; font-size: 8px; margin-top: 10px; color: #666;">
            Lot: ${generatedLabel.lot_id.slice(-8)}
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(labelHTML)
    printWindow.document.close()
  }

  // Confirm and callback
  const handleConfirmLabel = () => {
    if (generatedLabel) {
      onLabelGenerated(generatedLabel)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Label Generator</h1>
              <p className="text-sm text-gray-600">Generate product labels for FP boxes</p>
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Lot ID</p>
              <p className="font-mono text-sm">{lotId.slice(0, 12)}...</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Box Number</p>
              <p className="font-medium">{boxNumber}</p>
            </div>
            {originalBoxNumber && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Original Box</p>
                <p className="font-medium">{originalBoxNumber}</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Product Type</p>
              <p className="font-medium">{productType}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Grade</p>
              <p className="font-medium">{grade}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Weight</p>
              <p className="font-medium">{weight} kg</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Pack Date</p>
              <p className="font-medium">{packDate.toLocaleDateString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Expiry Date</p>
              <p className="font-medium">{expiryDate.toLocaleDateString()}</p>
            </div>
            {rfidTagId && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500">RFID Tag</p>
                <p className="font-mono text-sm text-blue-800">{rfidTagId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Label Options */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Label Options</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeBarcode}
                  onChange={(e) => setIncludeBarcode(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Include barcode on label</span>
              </label>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-700">Print copies:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={printCount}
                onChange={(e) => setPrintCount(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-1 border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Generate Button */}
        {!generatedLabel && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4 text-center">
            <button
              onClick={handleGenerateLabel}
              disabled={generating}
              className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating Label...
                </span>
              ) : (
                '🏷️ Generate QR Label'
              )}
            </button>
          </div>
        )}

        {/* Generated Label Preview */}
        {generatedLabel && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Label Preview</h2>
            
            <div ref={labelRef} className="max-w-sm mx-auto border-2 border-gray-800 rounded-lg p-4 bg-white">
              {/* Label Header */}
              <div className="text-center border-b border-gray-300 pb-2 mb-3">
                <div className="text-xl font-bold">🦪 ClamFlow</div>
                <div className="text-xs text-gray-600">Premium Quality Seafood</div>
              </div>
              
              {/* QR Code Placeholder */}
              <div className="text-center my-4">
                <div className="w-24 h-24 mx-auto border-2 border-dashed border-gray-400 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl">📱</div>
                    <div className="text-xs text-gray-500">QR Code</div>
                  </div>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">Product:</span>
                  <span>{generatedLabel.product_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Grade:</span>
                  <span>{generatedLabel.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Net Weight:</span>
                  <span>{generatedLabel.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Box No:</span>
                  <span>{generatedLabel.box_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Pack Date:</span>
                  <span>{new Date(generatedLabel.pack_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Best Before:</span>
                  <span>{new Date(generatedLabel.expiry_date).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Traceability Code */}
              <div className="mt-3 bg-gray-100 rounded p-2 text-center">
                <div className="font-mono text-xs">{generatedLabel.traceability_code}</div>
              </div>
              
              {/* Barcode Placeholder */}
              {includeBarcode && (
                <div className="mt-3 h-8 bg-gradient-to-r from-black via-white to-black bg-[length:4px_100%]"></div>
              )}
              
              {/* Lot Info */}
              <div className="mt-2 text-center text-xs text-gray-500">
                Lot: {generatedLabel.lot_id.slice(-8)}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                🖨️ Print Label ({printCount})
              </button>
              <button
                onClick={handleConfirmLabel}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                ✓ Confirm & Complete
              </button>
              <button
                onClick={() => setGeneratedLabel(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">📋 Label Generation Process</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Verify all product details are correct</li>
            <li>Adjust label options if needed (barcode, print copies)</li>
            <li>Click &quot;Generate QR Label&quot; to create the label</li>
            <li>Review the label preview carefully</li>
            <li>Print the required number of copies</li>
            <li>Click &quot;Confirm & Complete&quot; to finalize and insert into inventory</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default QRLabelGenerator
