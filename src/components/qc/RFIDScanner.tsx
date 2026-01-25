"use client"

// src/components/qc/RFIDScanner.tsx
// RFID Tag Linking Interface - Based on Figma Framework
// Used at FP Receiving to scan and link RFID tags to PPC boxes

import React, { useState, useEffect, useCallback } from 'react'
import clamflowAPI from '../../lib/clamflow-api'
import { RFIDTagData, RFIDScanResult } from '../../types/qc-workflow'

interface RFIDScannerProps {
  lotId: string
  boxNumber: string
  productType: string
  grade: string
  weight: number
  onRFIDLinked: (rfidData: RFIDTagData) => void
  onClose: () => void
}

const RFIDScanner: React.FC<RFIDScannerProps> = ({
  lotId,
  boxNumber,
  productType,
  grade,
  weight,
  onRFIDLinked,
  onClose
}) => {
  const [scanMode, setScanMode] = useState<'manual' | 'auto'>('manual')
  const [tagId, setTagId] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<RFIDScanResult | null>(null)
  const [error, setError] = useState('')
  const [recentScans, setRecentScans] = useState<RFIDTagData[]>([])
  const [autoScanInterval, setAutoScanInterval] = useState<NodeJS.Timeout | null>(null)

  // Simulate auto-scan polling (in real implementation, this would connect to RFID hardware)
  const startAutoScan = useCallback(() => {
    if (autoScanInterval) clearInterval(autoScanInterval)
    
    const interval = setInterval(async () => {
      // Simulate detecting a new RFID tag
      const simulatedTagId = `RFID-${Date.now().toString(36).toUpperCase()}`
      
      try {
        // Check if tag already exists
        const existingTag = await clamflowAPI.scanRFIDTag(simulatedTagId)
        if (existingTag.success && existingTag.data) {
          setScanResult({
            success: false,
            error: 'Tag already linked to another product',
            validation_status: 'duplicate'
          })
        }
      } catch {
        // New tag detected - available for linking
        setTagId(simulatedTagId)
        setScanResult({
          success: true,
          validation_status: 'valid'
        })
      }
    }, 2000) // Poll every 2 seconds

    setAutoScanInterval(interval)
  }, [autoScanInterval])

  const stopAutoScan = useCallback(() => {
    if (autoScanInterval) {
      clearInterval(autoScanInterval)
      setAutoScanInterval(null)
    }
  }, [autoScanInterval])

  useEffect(() => {
    return () => {
      if (autoScanInterval) clearInterval(autoScanInterval)
    }
  }, [autoScanInterval])

  // Manual scan - verify tag
  const handleManualScan = async () => {
    if (!tagId.trim()) {
      setError('Please enter an RFID tag ID')
      return
    }

    setScanning(true)
    setError('')
    setScanResult(null)

    try {
      // Check if tag exists
      const response = await clamflowAPI.scanRFIDTag(tagId)
      
      if (response.success && response.data) {
        // Tag already linked - map response to RFIDTagData
        const existingTag: RFIDTagData = {
          id: response.data.id,
          tag_id: response.data.tagId,
          box_number: response.data.boxNumber,
          lot_id: response.data.lotId,
          product_type: response.data.productType,
          grade: response.data.grade,
          weight: response.data.weight,
          linked_at: response.data.linkedAt,
          linked_by: response.data.linkedBy,
          status: response.data.status as 'active' | 'inactive' | 'transferred'
        }
        setScanResult({
          success: false,
          tag_data: existingTag,
          error: 'This RFID tag is already linked to another product',
          validation_status: 'duplicate'
        })
      } else {
        // Tag is available
        setScanResult({
          success: true,
          validation_status: 'valid'
        })
      }
    } catch (err: any) {
      // Tag not found - means it's available for linking
      setScanResult({
        success: true,
        validation_status: 'valid'
      })
    } finally {
      setScanning(false)
    }
  }

  // Link RFID tag to product
  const handleLinkTag = async () => {
    if (!tagId.trim()) {
      setError('No RFID tag scanned')
      return
    }

    setScanning(true)
    setError('')

    try {
      const linkData = {
        tagId: tagId,
        boxNumber: boxNumber,
        lotId: lotId,
        productType: productType,
        grade: grade,
        weight: weight,
        staffId: 'current_user' // Would come from auth context
      }

      const response = await clamflowAPI.linkRFIDTag(linkData)

      if (response.success && response.data) {
        const linkedTag: RFIDTagData = {
          id: response.data.id,
          tag_id: response.data.tagId,
          box_number: response.data.boxNumber,
          lot_id: response.data.lotId,
          product_type: response.data.productType,
          grade: response.data.grade,
          weight: response.data.weight,
          linked_at: response.data.linkedAt,
          linked_by: response.data.linkedBy,
          status: 'active'
        }

        setRecentScans(prev => [linkedTag, ...prev.slice(0, 4)])
        onRFIDLinked(linkedTag)
        
        // Reset for next scan
        setTagId('')
        setScanResult(null)
      } else {
        throw new Error(response.error || 'Failed to link RFID tag')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to link RFID tag')
    } finally {
      setScanning(false)
    }
  }

  // Generate demo tag ID
  const generateDemoTagId = () => {
    const demoId = `RFID-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    setTagId(demoId)
    setScanResult({
      success: true,
      validation_status: 'valid'
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RFID Scanner</h1>
              <p className="text-sm text-gray-600">Link RFID tags to PPC boxes for FP tracking</p>
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-blue-800 mb-2">Product Information</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-blue-600">Lot ID:</span>
              <span className="ml-2 font-mono">{lotId}</span>
            </div>
            <div>
              <span className="text-blue-600">Box Number:</span>
              <span className="ml-2 font-medium">{boxNumber}</span>
            </div>
            <div>
              <span className="text-blue-600">Product Type:</span>
              <span className="ml-2">{productType}</span>
            </div>
            <div>
              <span className="text-blue-600">Grade:</span>
              <span className="ml-2">{grade}</span>
            </div>
            <div>
              <span className="text-blue-600">Weight:</span>
              <span className="ml-2">{weight} kg</span>
            </div>
          </div>
        </div>

        {/* Scan Mode Toggle */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Scan Mode:</span>
            <div className="flex rounded-lg overflow-hidden border">
              <button
                onClick={() => { setScanMode('manual'); stopAutoScan(); }}
                className={`px-4 py-2 text-sm ${
                  scanMode === 'manual' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => { setScanMode('auto'); startAutoScan(); }}
                className={`px-4 py-2 text-sm ${
                  scanMode === 'auto' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Auto Detect
              </button>
            </div>
          </div>
        </div>

        {/* Manual Scan Input */}
        {scanMode === 'manual' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RFID Tag ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value.toUpperCase())}
                    placeholder="Enter or scan RFID tag ID"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                  <button
                    onClick={handleManualScan}
                    disabled={scanning || !tagId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {scanning ? 'Scanning...' : 'Verify'}
                  </button>
                </div>
              </div>

              {/* Demo Button */}
              <button
                onClick={generateDemoTagId}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                [Demo] Generate Sample Tag ID
              </button>
            </div>
          </div>
        )}

        {/* Auto Scan Status */}
        {scanMode === 'auto' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>
              <p className="mt-4 text-lg font-medium text-gray-700">Scanning for RFID tags...</p>
              <p className="text-sm text-gray-500">Place a tag near the reader</p>
              
              {tagId && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">Tag Detected!</p>
                  <p className="font-mono font-bold text-green-800">{tagId}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className={`rounded-lg p-4 mb-4 ${
            scanResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                scanResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {scanResult.success ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {scanResult.success ? 'Tag Available for Linking' : 'Cannot Use This Tag'}
                </p>
                <p className={`text-sm ${scanResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {scanResult.success 
                    ? `Tag ${tagId} can be linked to ${boxNumber}`
                    : scanResult.error
                  }
                </p>
                
                {scanResult.success && (
                  <button
                    onClick={handleLinkTag}
                    disabled={scanning}
                    className="mt-3 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {scanning ? 'Linking...' : '✓ Link Tag to Product'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Recently Linked Tags</h3>
            <div className="space-y-2">
              {recentScans.map((scan, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-mono text-sm">{scan.tag_id}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="font-medium">{scan.box_number}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(scan.linked_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-yellow-800 mb-2">📋 Instructions</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Verify the product information above matches the physical box</li>
            <li>Scan or enter the RFID tag ID from the tag on the box</li>
            <li>Wait for verification - ensure the tag is not already linked</li>
            <li>Click &quot;Link Tag to Product&quot; to complete the linking</li>
            <li>The linked tag will be used for FP tracking and QR label generation</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default RFIDScanner
