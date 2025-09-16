'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import WeightNoteForm from '@/components/forms/WeightNoteForm'
import WeightNotesList from '@/components/forms/WeightNotesList'
import WeightNotePrintable from '@/components/weightnote/WeightNotePrintable'
import AuthenticationWorkflow from '@/components/weightnote/AuthenticationWorkflow'
import { User, UserRole, toApiRole } from '@/types/auth'

type WeightNote = {
  id: string;
  lot_id: string;
  supplier_id: string;
  box_number: string;
  weight: number;
  qc_staff_id: string;
  notes?: string;
  temperature?: number;
  moisture_content?: number;
  created_at: string;
  workflow_completed: boolean;
}

export default function WeightNotesPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeView, setActiveView] = useState<'list' | 'create' | 'authenticate' | 'print'>('list')
  const [selectedWeightNote, setSelectedWeightNote] = useState<WeightNote | null>(null)
  const [weightNotes, setWeightNotes] = useState<WeightNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, station, username, is_active, created_at')
        .eq('id', user.id)
        .single()

      if (profile) {
        // ✅ Create full User object with all required fields
        const fullUser: User = {
          id: profile.id,
          full_name: profile.full_name,
          username: profile.username || profile.id,
          role: toApiRole(profile.role), // Convert display name → snake_case
          station: profile.station || undefined,
          is_active: profile.is_active ?? true,
          created_at: profile.created_at || new Date().toISOString(),
          last_login: undefined,
          password_reset_required: undefined,
          login_attempts: undefined
        };
        setCurrentUser(fullUser);
      }
      
      await loadWeightNotes()
      setLoading(false)
    }

    getCurrentUser()
  }, [])

  const loadWeightNotes = async () => {
    const { data } = await supabase
      .from('weight_notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    setWeightNotes(data || [])
  }

  const handleFormSubmit = async (weightNoteId: string) => {
    const { data } = await supabase
      .from('weight_notes')
      .select('*')
      .eq('id', weightNoteId)
      .single()

    setSelectedWeightNote(data)
    setActiveView('authenticate')
  }

  const handleAuthenticationComplete = async (weightNoteId: string) => {
    const { data } = await supabase
      .from('weight_notes')
      .select('*')
      .eq('id', weightNoteId)
      .single()

    setSelectedWeightNote(data)
    setActiveView('print')
    await loadWeightNotes()
  }

  const handlePrintComplete = () => {
    setActiveView('list')
    setSelectedWeightNote(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weight Notes Management</h1>
          <p className="text-gray-600 mt-2">Create and manage weight notes for incoming clam shipments</p>
        </div>
        {activeView === 'list' && (
          <button
            onClick={() => setActiveView('create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Weight Note
          </button>
        )}
      </div>

      {activeView === 'list' && (
        <WeightNotesList 
          onViewDetails={(note) => {
            setSelectedWeightNote(note)
            setActiveView(note.workflow_completed ? 'print' : 'authenticate')
          }}
          currentUser={currentUser}
        />
      )}

      {activeView === 'create' && (
        <WeightNoteForm 
          onSubmit={handleFormSubmit}
          onCancel={() => setActiveView('list')}
          currentUser={currentUser}
        />
      )}

      {activeView === 'authenticate' && selectedWeightNote && (
        <AuthenticationWorkflow 
          weightNote={selectedWeightNote}
          onComplete={handleAuthenticationComplete}
          onCancel={() => setActiveView('list')}
        />
      )}

      {activeView === 'print' && selectedWeightNote && (
        <WeightNotePrintable 
          weightNote={selectedWeightNote}
          onComplete={handlePrintComplete}
          onCancel={() => setActiveView('list')}
        />
      )}
    </div>
  )
}