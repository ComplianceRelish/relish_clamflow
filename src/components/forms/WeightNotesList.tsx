'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../../types/supabase'

type WeightNote = Database['public']['Tables']['weight_notes']['Row'] & {
  qc_staff?: { full_name: string; role: string }
  production_staff?: { full_name: string; role: string }
  supplier_auth?: { full_name: string; role: string }
  supplier?: { first_name: string; last_name: string; type: string }
  lot?: { lot_number: string; status: string }
}

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface WeightNotesListProps {
  onCreateNew: () => void
  onViewDetails: (note: WeightNote) => void
  currentUser: UserProfile | null
}

export function WeightNotesList({ onCreateNew, onViewDetails, currentUser }: WeightNotesListProps) {
  const supabase = createClientComponentClient<Database>()
  const [weightNotes, setWeightNotes] = useState<WeightNote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadWeightNotes()
  }, [])

  const loadWeightNotes = async () => {
    setLoading(true)
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
      .limit(50)

    setWeightNotes(data || [])
    setLoading(false)
  }

  const filteredNotes = weightNotes.filter(note =>
    note.box_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${note.supplier?.first_name} ${note.supplier?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.lot?.lot_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (note: WeightNote) => {
    if (note.workflow_completed) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Completed</span>
    }
    if (note.qc_approval_status === 'rejected') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Rejected</span>
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Step {note.authentication_step || 1}/4</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <input
            type="text"
            placeholder="Search weight notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          New Weight Note
        </button>
      </div>

      {/* Weight Notes List */}
      <div className="grid gap-4">
        {filteredNotes.map((note) => (
          <div key={note.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">Box: {note.box_number}</h3>
                <p className="text-gray-600">
                  Supplier: {note.supplier ? `${note.supplier.first_name} ${note.supplier.last_name}` : 'Unknown'}
                </p>
                <p className="text-gray-600">Lot: {note.lot?.lot_number || 'Unknown'}</p>
              </div>
              {getStatusBadge(note)}
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Weight:</span>
                <div className="font-medium">{note.weight || 0} kg</div>
              </div>
              <div>
                <span className="text-gray-500">QC Staff:</span>
                <div className="font-medium">{note.qc_staff?.full_name || 'Unassigned'}</div>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <div className="font-medium">{new Date(note.created_at || '').toLocaleDateString()}</div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => onViewDetails(note)}
                  className="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No weight notes found</p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create First Weight Note
          </button>
        </div>
      )}
    </div>
  )
}

export default WeightNotesList