// frontend/components/WeightNote/AuthenticationWorkflow.tsx
"use client"

import React, { useState, useEffect } from 'react'
import { useAuthentication } from '../../hooks/useWeightNote'
import { WeightNote } from '../../types/supabase'

interface AuthenticationWorkflowProps {
  weightNote: WeightNote
  onComplete: (weightNoteId: string) => void
  onCancel: () => void
}

const AuthenticationWorkflow: React.FC<AuthenticationWorkflowProps> = ({
  weightNote,
  onComplete,
  onCancel
}) => {
  const {
    session,
    loading,
    error,
    startAuthSession,
    completeAuthentication,
    validateRFID,
    performFaceRecognition
  } = useAuthentication()

  const [currentStep, setCurrentStep] = useState<'qc' | 'production' | 'supplier'>('qc')
  const [authMethod, setAuthMethod] = useState<'face_recognition' | 'rfid' | null>(null)
  const [rfidInput, setRfidInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [fallbackReason, setFallbackReason] = useState('')

  // Get next authentication step needed
  const getNextStep = () => {
    if (!weightNote.qc_approval_status) return 'qc'
    if (!weightNote.production_auth_at) return 'production'
    if (!weightNote.supplier_authenticated_by) return 'supplier'
    return null
  }

  // Role mapping for each step
  const getRequiredRole = (step: string) => {
    switch (step) {
      case 'qc': return 'QC Staff'
      case 'production': return 'Production Staff'
      case 'supplier': return 'Supplier'
      default: return 'Staff'
    }
  }

  // Step descriptions
  const getStepDescription = (step: string) => {
    switch (step) {
      case 'qc': return 'Quality Control Verification'
      case 'production': return 'Production Staff Confirmation'
      case 'supplier': return 'Supplier Acknowledgment'
      default: return 'Authentication Required'
    }
  }

  // Initialize authentication session
  useEffect(() => {
    const nextStep = getNextStep()
    if (nextStep && weightNote.id) {
      setCurrentStep(nextStep)
      startAuthSession(
        weightNote.id,
        nextStep,
        getRequiredRole(nextStep)
      )
    }
  }, [weightNote])

  // Handle RFID authentication
  const handleRFIDAuth = async () => {
    if (!rfidInput.trim()) {
      console.error('Please scan or enter RFID')
      return
    }

    setIsProcessing(true)
    try {
      const staffData = await validateRFID(rfidInput)

      if (staffData.role !== getRequiredRole(currentStep)) {
        throw new Error(`This step requires ${getRequiredRole(currentStep)} authentication`)
      }

      const authRecord: {
        staff_id: string;
        staff_name: string;
        timestamp: string;
        method: string;
        rfid_data: string;
      } = {
        staff_id: staffData.id,
        staff_name: staffData.full_name,
        timestamp: new Date().toISOString(),
        method: 'rfid',
        rfid_data: rfidInput
      }

      if (session) {
        await completeAuthentication(
          session.id,
          staffData.id,
          'rfid',
          { rfid_id: rfidInput }
        )
      }

      console.log('RFID Authentication completed:', currentStep, authRecord)
      setRfidInput('')
      setAuthMethod(null)
    } catch (err) {
      console.error(err instanceof Error ? err.message : 'RFID authentication failed')
      setShowFallback(true)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle face recognition authentication
  const handleFaceAuth = async () => {
    setIsProcessing(true)
    try {
      // Simulate face recognition capture
      // In real implementation, this would integrate with camera/face recognition service
      const faceData = 'simulated_face_data'
      const confidence = 0.92 // Simulated confidence score

      const staffData = await performFaceRecognition(faceData, confidence)

      if (staffData.role !== getRequiredRole(currentStep)) {
        throw new Error(`This step requires ${getRequiredRole(currentStep)} authentication`)
      }

      const authRecord: {
        staff_id: string;
        staff_name: string;
        timestamp: string;
        method: string;
        biometric_confidence: number;
      } = {
        staff_id: staffData.id,
        staff_name: staffData.full_name,
        timestamp: new Date().toISOString(),
        method: 'face_recognition',
        biometric_confidence: confidence
      }

      if (session) {
        await completeAuthentication(
          session.id,
          staffData.id,
          'face_recognition',
          { confidence }
        )
      }

      console.log('Face recognition completed:', currentStep, authRecord)
      setAuthMethod(null)
    } catch (err) {
      console.error(err instanceof Error ? err.message : 'Face recognition failed')
      setShowFallback(true)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle fallback authentication (Production Lead approval)
  const handleFallbackAuth = async () => {
    if (!fallbackReason.trim()) {
      console.error('Please provide a reason for fallback authentication')
      return
    }

    setIsProcessing(true)
    try {
      // This would trigger notification to Production Lead
      const authRecord: {
        staff_id: string;
        staff_name: string;
        timestamp: string;
        method: string;
        fallback_reason: string;
        production_lead_approval: boolean;
      } = {
        staff_id: 'fallback_pending',
        staff_name: 'Pending Production Lead Approval',
        timestamp: new Date().toISOString(),
        method: 'fallback',
        fallback_reason: fallbackReason,
        production_lead_approval: false
      }

      if (session) {
        await completeAuthentication(
          session.id,
          'fallback_pending',
          'fallback_approval',
          { reason: fallbackReason }
        )
      }

      console.log('Fallback authentication submitted:', currentStep, authRecord)
      setFallbackReason('')
      setShowFallback(false)
      setAuthMethod(null)
    } catch (err) {
      console.error(err instanceof Error ? err.message : 'Fallback authentication failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!getNextStep()) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Authentication Complete
            </h3>
            <div className="mt-2 text-sm text-green-700">
              All required authentications have been completed for this Weight Note.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Authentication Required
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {getStepDescription(currentStep)} - Weight Note #{weightNote.box_number}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Authentication Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Authentication Progress</span>
          <span className="text-gray-600">
            {['qc', 'production', 'supplier'].filter(step => 
              weightNote[`${step}_authentication` as keyof WeightNote]
            ).length} / 3 Complete
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${((['qc', 'production', 'supplier'].filter(step => 
                weightNote[`${step}_authentication` as keyof WeightNote]
              ).length) / 3) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Current Step Status */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900">
          Current Step: {getStepDescription(currentStep)}
        </h3>
        <p className="text-sm text-blue-700 mt-1">
          Required Role: {getRequiredRole(currentStep)}
        </p>
      </div>

      {!showFallback && !authMethod && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Select Authentication Method
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Face Recognition */}
            <button
              onClick={() => setAuthMethod('face_recognition')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
            >
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-indigo-600 mb-3">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Face Recognition</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Use biometric face authentication
                </p>
              </div>
            </button>

            {/* RFID */}
            <button
              onClick={() => setAuthMethod('rfid')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
            >
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-indigo-600 mb-3">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">RFID Card</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Scan or enter RFID card
                </p>
              </div>
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowFallback(true)}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Authentication not working? Use fallback method
            </button>
          </div>
        </div>
      )}

      {/* Face Recognition Interface */}
      {authMethod === 'face_recognition' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800">Face Recognition</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Position your face in front of the camera and click "Authenticate"
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-64 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Camera Feed
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setAuthMethod(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleFaceAuth}
              disabled={isProcessing}
              className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isProcessing ? 'Authenticating...' : 'Authenticate'}
            </button>
          </div>
        </div>
      )}

      {/* RFID Interface */}
      {authMethod === 'rfid' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800">RFID Authentication</h3>
            <p className="text-sm text-blue-700 mt-1">
              Scan your RFID card or enter the card number manually
            </p>
          </div>

          <div>
            <label htmlFor="rfid_input" className="block text-sm font-medium text-gray-700 mb-1">
              RFID Card Number
            </label>
            <input
              type="text"
              id="rfid_input"
              value={rfidInput}
              onChange={(e) => setRfidInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Scan RFID or enter card number"
              autoFocus
            />
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setAuthMethod(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRFIDAuth}
              disabled={isProcessing || !rfidInput.trim()}
              className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                isProcessing || !rfidInput.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isProcessing ? 'Authenticating...' : 'Authenticate'}
            </button>
          </div>
        </div>
      )}

      {/* Fallback Authentication */}
      {showFallback && (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-medium text-orange-800">Fallback Authentication</h3>
            <p className="text-sm text-orange-700 mt-1">
              Request Production Lead approval for authentication bypass
            </p>
          </div>

          <div>
            <label htmlFor="fallback_reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Fallback Authentication *
            </label>
            <textarea
              id="fallback_reason"
              value={fallbackReason}
              onChange={(e) => setFallbackReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Explain why normal authentication methods are not available..."
            />
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowFallback(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleFallbackAuth}
              disabled={isProcessing || !fallbackReason.trim()}
              className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                isProcessing || !fallbackReason.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isProcessing ? 'Requesting...' : 'Request Approval'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthenticationWorkflow
