'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DigitalSignatureGenerator } from '../weightnote/DigitalSignatureGenerator'
import { Database } from '../../types/supabase'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface AuthenticationWorkflowProps {
  weightNoteId: string
  onComplete: (weightNoteId: string) => void
  onCancel: () => void
  currentUser: UserProfile | null
}

export function AuthenticationWorkflow({ weightNoteId, onComplete, onCancel, currentUser }: AuthenticationWorkflowProps) {
  const supabase = createClientComponentClient<Database>()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authMethod, setAuthMethod] = useState<'face_recognition' | 'rfid' | 'fallback'>('face_recognition')

  const stepTitles = {
    1: 'Production Staff Authentication',
    2: 'Supplier Authentication', 
    3: 'Data Entry Complete',
    4: 'QC Approval'
  }

  const advanceStep = async () => {
    if (!currentUser) return

    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase.rpc('advance_weight_note_workflow', {
        note_id: weightNoteId,
        staff_id: currentUser.id,
        auth_method: authMethod
      })

      if (updateError) throw updateError

      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      } else {
        onComplete(weightNoteId)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        ></div>
      </div>

      {/* Current Step */}
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">{stepTitles[currentStep as keyof typeof stepTitles]}</h2>
        <p className="text-gray-600">Step {currentStep} of 4</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Authentication Method Selection */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium mb-3">Authentication Method</h3>
        <div className="flex space-x-4">
          {(['face_recognition', 'rfid', 'fallback'] as const).map((method) => (
            <label key={method} className="flex items-center">
              <input
                type="radio"
                value={method}
                checked={authMethod === method}
                onChange={(e) => setAuthMethod(e.target.value as typeof authMethod)}
                className="mr-2"
              />
              {method === 'face_recognition' && 'Face Recognition'}
              {method === 'rfid' && 'RFID'}
              {method === 'fallback' && 'Manual Fallback'}
            </label>
          ))}
        </div>
      </div>

      {/* Digital Signature */}
      {currentUser && (
        <DigitalSignatureGenerator
          user={currentUser}
          authenticationMethod={authMethod}
          timestamp={new Date().toISOString()}
          weightNoteId={weightNoteId}
        />
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={advanceStep}
          disabled={loading}
          className={`px-6 py-2 text-white rounded-lg ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : currentStep === 4 ? 'Complete' : 'Next Step'}
        </button>
      </div>
    </div>
  )
}

export default AuthenticationWorkflow