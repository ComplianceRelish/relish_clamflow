'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import WeightNoteForm from '@/components/forms/WeightNoteForm'
import WeightNotesList from '@/components/forms/WeightNotesList'
import WeightNotePrintPreview from '@/components/forms/WeightNotePrintPreview'
import AuthenticationWorkflow from '@/components/weightnote/AuthenticationWorkflow'
import WeightNotePrintable from '@/components/weightnote/WeightNotePrintable'
import { Database } from '@/types/supabase'

type WeightNote = Database['public']['Tables']['weight_notes']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export default function WeightNotesPage() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
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
        .select('*')
        .eq('id', user.id)
        .single()

      setCurrentUser(profile)
      await loadWeightNotes()
      setLoading(false)
    }

    getCurrentUser()
  }, [])

  const loadWeightNotes = async () => {
    const { data } = await supabase
      .from('weight_notes')
      .select(`
        *,
        qc_staff:qc_staff_id(full_name, role),
        production_staff:production_staff_id(full_name, role),
        supplier_auth:supplier_authenticated_by(full_name, role),
        supplier:supplier_id(first_name, last_name, type),
        lot:lot_id(lot_number, status)
      `)
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

      {/* List View */}
      {activeView === 'list' && (
        <WeightNotesList 
          onCreateNew={() => setActiveView('create')}
          onViewDetails={(note) => {
            setSelectedWeightNote(note)
            setActiveView(note.workflow_completed ? 'print' : 'authenticate')
          }}
          currentUser={currentUser}
        />
      )}

      {/* Create Form */}
      {activeView === 'create' && (
        <WeightNoteForm 
          onSubmit={handleFormSubmit}
          onCancel={() => setActiveView('list')}
          currentUser={currentUser}
        />
      )}

      {/* Authentication Workflow */}
      {activeView === 'authenticate' && selectedWeightNote && (
        <AuthenticationWorkflow 
          weightNote={selectedWeightNote}
          onComplete={handleAuthenticationComplete}
          onCancel={() => setActiveView('list')}
        />
      )}

      {/* Print Preview */}
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