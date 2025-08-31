"use client"

import React, { useState, useEffect } from 'react'
import { Database } from '../../types/supabase'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface DigitalSignatureProps {
  user: UserProfile
  authenticationMethod: 'face_recognition' | 'rfid' | 'fallback'
  timestamp: string
  weightNoteId: string
  onSignatureGenerated?: (signature: string, qrCode: string) => void
}

export const DigitalSignatureGenerator: React.FC<DigitalSignatureProps> = ({
  user,
  authenticationMethod,
  timestamp,
  weightNoteId,
  onSignatureGenerated
}) => {
  const [digitalSignature, setDigitalSignature] = useState<string>('')
  const [qrCodeData, setQrCodeData] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate digital signature from user profile data
  const generateDigitalSignature = async () => {
    setIsGenerating(true)

    try {
      // Create signature payload from user profile data
      const signaturePayload = {
        user_id: user.id,
        full_name: user.full_name,
        role: user.role,
        station: user.station,
        username: user.username,
        auth_method: authenticationMethod,
        timestamp: timestamp,
        weight_note_id: weightNoteId,
        created_at: user.created_at
      }

      // Generate condensed digital signature (hash of the payload)
      const signatureString = JSON.stringify(signaturePayload)
      const signature = await generateSignatureHash(signatureString)

      // Create QR code data (condensed version for quick validation)
      const qrPayload = {
        sig: signature.substring(0, 16), // Short signature
        uid: user.id.substring(0, 8), // Short user ID
        wid: weightNoteId.substring(0, 8), // Short weight note ID
        ts: new Date(timestamp).getTime(), // Timestamp
        auth: authenticationMethod.substring(0, 4), // Auth method abbreviation
        name: user.full_name.substring(0, 20) // Short name
      }

      const qrData = btoa(JSON.stringify(qrPayload)) // Base64 encode for QR
      
      setDigitalSignature(signature)
      setQrCodeData(qrData)

      if (onSignatureGenerated) {
        onSignatureGenerated(signature, qrData)
      }

    } catch (error) {
      console.error('Error generating digital signature:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate hash for signature (using Web Crypto API)
  const generateSignatureHash = async (data: string): Promise<string> => {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Validate signature against stored user profile data
  const validateSignature = async (signature: string, originalData: any): Promise<boolean> => {
    try {
      const recreatedSignature = await generateSignatureHash(JSON.stringify(originalData))
      return signature === recreatedSignature
    } catch (error) {
      console.error('Error validating signature:', error)
      return false
    }
  }

  useEffect(() => {
    generateDigitalSignature()
  }, [user, authenticationMethod, timestamp, weightNoteId])

  const generateQRCodeImage = (data: string): string => {
    try {
      // Create QR code using canvas (placeholder implementation)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return ''

      // Simple QR code representation (in production, use proper QR library)
      canvas.width = 200
      canvas.height = 200
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, 200, 200)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('CLAMFLOW QR', 100, 90)
      ctx.fillText('Digital Signature', 100, 105)
      ctx.fillText(data.substring(0, 15) + '...', 100, 120)

      return canvas.toDataURL()
    } catch (error) {
      console.error('Error generating QR code:', error)
      return ''
    }
  }

  const downloadQRCode = () => {
    if (qrCodeData) {
      const qrImage = generateQRCodeImage(qrCodeData)
      const link = document.createElement('a')
      link.href = qrImage
      link.download = `signature-${user.full_name}-${Date.now()}.png`
      link.click()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Signature</h3>
      
      <div className="space-y-4">
        {/* User Information */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Authentication Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-600">Name:</span> {user.full_name}</div>
            <div><span className="text-gray-600">Role:</span> {user.role}</div>
            <div><span className="text-gray-600">Station:</span> {user.station || 'Not specified'}</div>
            <div><span className="text-gray-600">Method:</span> {authenticationMethod}</div>
            {user.username && <div><span className="text-gray-600">Username:</span> {user.username}</div>}
          </div>
        </div>

        {/* Digital Signature */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Generated Signature</h4>
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span className="text-sm text-gray-600">Generating signature...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                {digitalSignature}
              </div>
              <div className="text-xs text-gray-600">
                Generated at: {new Date(timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">QR Code for Authentication</h4>
          {qrCodeData && (
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded border">
                <img 
                  src={generateQRCodeImage(qrCodeData)} 
                  alt="Digital Signature QR Code"
                  className="w-32 h-32"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-2">
                  <p>Scan this QR code for quick authentication validation.</p>
                </div>
                <button
                  onClick={downloadQRCode}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Download QR Code
                </button>
                <div className="mt-2 font-mono text-xs text-gray-500 break-all">
                  {qrCodeData.substring(0, 50)}...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Validation Status */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Validation Ready</h4>
          <p className="text-sm text-gray-600">
            This digital signature is linked to the user's profile data and can be validated 
            against their stored information in the ClamFlow system.
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper hook for signature management
export const useDigitalSignature = () => {
  const [signatures, setSignatures] = useState<Map<string, string>>(new Map())

  const storeSignature = (weightNoteId: string, signature: string) => {
    setSignatures(prev => new Map(prev).set(weightNoteId, signature))
  }

  const validateStoredSignature = async (weightNoteId: string, userData: UserProfile) => {
    const storedSignature = signatures.get(weightNoteId)
    if (!storedSignature) return false

    // Re-generate signature from user data and compare
    const signaturePayload = {
      user_id: userData.id,
      full_name: userData.full_name,
      role: userData.role,
      station: userData.station,
      username: userData.username,
      auth_method: 'face_recognition',
      timestamp: new Date().toISOString(),
      weight_note_id: weightNoteId,
      created_at: userData.created_at
    }

    // Generate hash and compare
    const signatureString = JSON.stringify(signaturePayload)
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(signatureString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const recreatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return storedSignature === recreatedSignature
  }

  return {
    storeSignature,
    validateStoredSignature,
    signatures: Array.from(signatures.entries())
  }
}

export default DigitalSignatureGenerator