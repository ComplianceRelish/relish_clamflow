// frontend/hooks/useWeightNote.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { WeightNote, AuthenticationSession } from '../types/supabase'

// Define AuthenticationStepData locally since it's not in the database schema
type AuthenticationStepData = {
  staff_id: string;
  staff_name: string;
  timestamp: string;
  method: 'face_recognition' | 'rfid' | 'fallback';
  [key: string]: any;
}

export const useWeightNote = (weightNoteId?: string) => {
  const [weightNote, setWeightNote] = useState<WeightNote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch weight note by ID
  const fetchWeightNote = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: supabaseError } = await supabase
        .from('weight_notes')
        .select('*')
        .eq('id', id)
        .single()

      if (supabaseError) throw supabaseError

      setWeightNote(data as WeightNote)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weight note')
    } finally {
      setLoading(false)
    }
  }

  // Create new weight note
  const createWeightNote = async (data: Omit<WeightNote, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true)
    setError(null)

    try {
      const { data: newWeightNote, error: supabaseError } = await supabase
        .from('weight_notes')
        .insert([{
          ...data,
          workflow_status: 'draft',
          workflow_metadata: { created_by: 'system', step: 1 }
        }])
        .select()
        .single()

      if (supabaseError) throw supabaseError

      setWeightNote(newWeightNote as WeightNote)
      return newWeightNote
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create weight note')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Update weight note authentication
  const updateAuthentication = async (
    id: string,
    step: 'qc' | 'production' | 'supplier',
    authData: AuthenticationStepData
  ) => {
    setLoading(true)
    setError(null)

    try {
      const updateField = `${step}_authentication`
      const { data, error: supabaseError } = await supabase
        .from('weight_notes')
        .update({
          [updateField]: authData,
          workflow_status: step === 'supplier' ? 'completed' : 'in_progress'
        })
        .eq('id', id)
        .select()
        .single()

      if (supabaseError) throw supabaseError

      setWeightNote(data as WeightNote)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update authentication')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Fetch weight notes with filters
  const fetchWeightNotes = async (filters?: {
    status?: string
    dateFrom?: string
    dateTo?: string
    supplier?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase.from('weight_notes').select('*')

      if (filters?.status) {
        query = query.eq('workflow_status', filters.status)
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }
      if (filters?.supplier) {
        query = query.ilike('supplier_info->supplier_name', `%${filters.supplier}%`)
      }

      const { data, error: supabaseError } = await query.order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      return data as WeightNote[]
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weight notes')
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (weightNoteId) {
      fetchWeightNote(weightNoteId)
    }
  }, [weightNoteId])

  return {
    weightNote,
    loading,
    error,
    fetchWeightNote,
    createWeightNote,
    updateAuthentication,
    fetchWeightNotes
  }
}

// Hook for authentication sessions
export const useAuthentication = () => {
  const [session, setSession] = useState<AuthenticationSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start authentication session
  const startAuthSession = async (
    weightNoteId: string,
    step: string,
    requiredRole: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

      const { data, error: supabaseError } = await supabase
        .from('authentication_sessions')
        .insert([{
          weight_note_id: weightNoteId,
          session_type: 'weight_note_creation',
          current_step: 1,
          qc_staff_id: 'temp_qc_staff', // This should be the actual QC staff ID
          status: 'active',
          expires_at: expiresAt.toISOString()
        }])
        .select()
        .single()

      if (supabaseError) throw supabaseError

      setSession(data as AuthenticationSession)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start authentication session')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Complete authentication
  const completeAuthentication = async (
    sessionId: string,
    staffId: string,
    method: string,
    authData: any
  ) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: supabaseError } = await supabase
        .from('authentication_sessions')
        .update({
          production_staff_id: staffId,
          production_auth_method: method as 'face_recognition' | 'rfid' | 'fallback',
          session_data: authData,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (supabaseError) throw supabaseError

      setSession(data as AuthenticationSession)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete authentication')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Validate RFID
  const validateRFID = async (rfidId: string) => {
    try {
      const { data, error } = await supabase
        .from('personnel_records')
        .select('id, full_name, role, department, status')
        .contains('rfid_ids', [rfidId])
        .eq('status', 'active')
        .single()

      if (error) throw error

      return data
    } catch (err) {
      throw new Error('RFID validation failed')
    }
  }

  // Simulate face recognition (placeholder for actual implementation)
  const performFaceRecognition = async (faceData: string, confidence: number) => {
    try {
      // This would integrate with actual face recognition service
      // For now, simulating with stored biometric data lookup
      const { data, error } = await supabase
        .from('personnel_records')
        .select('id, full_name, role, department, biometric_data')
        .eq('status', 'active')

      if (error) throw error

      // Simulate face matching logic
      const matchedStaff = data.find(staff => 
        staff.biometric_data && confidence > 0.85
      )

      if (matchedStaff) {
        return {
          ...matchedStaff,
          confidence
        }
      }

      throw new Error('Face recognition failed')
    } catch (err) {
      throw new Error('Face recognition validation failed')
    }
  }

  return {
    session,
    loading,
    error,
    startAuthSession,
    completeAuthentication,
    validateRFID,
    performFaceRecognition
  }
}

// Hook for personnel management
export const usePersonnel = () => {
  const [personnel, setPersonnel] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all active personnel
  const fetchPersonnel = async (filters?: { role?: string, department?: string }) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('personnel_records')
        .select('*')
        .eq('status', 'active')

      if (filters?.role) {
        query = query.eq('role', filters.role)
      }
      if (filters?.department) {
        query = query.eq('department', filters.department)
      }

      const { data, error: supabaseError } = await query.order('full_name')

      if (supabaseError) throw supabaseError

      setPersonnel(data || [])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch personnel')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Get production leads for fallback notifications
  const getProductionLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('personnel_records')
        .select('id, full_name, contact_info')
        .eq('role', 'Production Lead')
        .eq('status', 'active')

      if (error) throw error

      return data
    } catch (err) {
      throw new Error('Failed to fetch production leads')
    }
  }

  return {
    personnel,
    loading,
    error,
    fetchPersonnel,
    getProductionLeads
  }
}