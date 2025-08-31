'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import WeightNoteForm from '../../components/forms/WeightNoteForm'
import AuthenticationWorkflow from '../../components/weightnote/AuthenticationWorkflow'  // Use existing
import WeightNotePrintable from '../../components/weightnote/WeightNotePrintable'      // Use existing
import { Database } from '../../types/supabase'

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

      {/* Simple List View */}
      {activeView === 'list' && (
        <div className="space-y-4">
          {weightNotes.map((note) => (
            <div key={note.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Box: {note.box_number}</h3>
                  <p className="text-gray-600">Weight: {note.weight} kg</p>
                  <p className="text-gray-600">Created: {new Date(note.created_at || '').toLocaleDateString()}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setSelectedWeightNote(note)
                      setActiveView(note.workflow_completed ? 'print' : 'authenticate')
                    }}
                    className="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                  >
                    {note.workflow_completed ? 'View/Print' : 'Continue Workflow'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {weightNotes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No weight notes found</p>
              <button
                onClick={() => setActiveView('create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First Weight Note
              </button>
            </div>
          )}
        </div>
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