"use client"

import React, { useState, useEffect } from 'react'
import clamflowAPI, { ApiResponse, ApprovalItem } from '../../lib/clamflow-api'
import { User } from '../../types/auth'

interface PendingFormViewerProps {
  currentUser: User | null
  onFormApproved?: (formId: string, formType: string) => void
  onFormRejected?: (formId: string, formType: string) => void
}

// ✅ ENHANCED: More specific form data types
interface WeightNoteData {
  id: string
  box_number?: string
  weight?: number
  raw_material_type?: string
  [key: string]: any
}

interface PPCFormData {
  id: string
  box_number?: string
  product_type?: string
  grade?: string
  weight?: number
  [key: string]: any
}

interface FPFormData {
  id: string
  box_number?: string
  product_type?: string
  grade?: string
  weight?: number
  [key: string]: any
}

interface QCFormData {
  id: string
  test_type?: string
  form_type?: string
  sample_id?: string
  [key: string]: any
}

interface DepurationFormData {
  id: string
  sample_id?: string
  tank_id?: string
  [key: string]: any
}

// Update the FormDetails interface
interface FormDetails {
  id: string
  type: 'weight_note' | 'ppc_form' | 'fp_form' | 'qc_form' | 'depuration_form'
  title: string
  data: WeightNoteData | PPCFormData | FPFormData | QCFormData | DepurationFormData | any
  submittedBy: string
  submittedAt: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'approved' | 'rejected'
}

const PendingFormViewer: React.FC<PendingFormViewerProps> = ({
  currentUser,
  onFormApproved,
  onFormRejected
}) => {
  const [pendingForms, setPendingForms] = useState<FormDetails[]>([])
  const [selectedForm, setSelectedForm] = useState<FormDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [formToReject, setFormToReject] = useState<FormDetails | null>(null)
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    loadPendingForms()
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingForms, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadPendingForms = async () => {
    setLoading(true)
    setError('')

    try {
      // ✅ FIXED: Using correct API endpoint
      const response = await clamflowAPI.getPendingApprovals()
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load pending forms')
      }

      // Transform API response to FormDetails format
      // ✅ FIXED: Type-safe form data handling
const forms: FormDetails[] = await Promise.all(
  (response.data || []).map(async (item: ApprovalItem) => {
    let formData: any = {}
    let title = ''

    // Fetch detailed form data based on type with proper error handling
    try {
      switch (item.form_type) {
        case 'weight_note':
          const weightNoteRes = await clamflowAPI.getWeightNoteById(item.form_id)
          if (weightNoteRes.success && weightNoteRes.data) {
            formData = weightNoteRes.data
            title = `Weight Note - Box ${formData.box_number || 'N/A'}`
          } else {
            title = `Weight Note - ${item.form_id}`
          }
          break
        case 'ppc_form':
          const ppcRes = await clamflowAPI.getPPCFormById(item.form_id)
          if (ppcRes.success && ppcRes.data) {
            formData = ppcRes.data
            title = `PPC Form - Box ${formData.box_number || 'N/A'}`
          } else {
            title = `PPC Form - ${item.form_id}`
          }
          break
        case 'fp_form':
          const fpRes = await clamflowAPI.getFPFormById(item.form_id)
          if (fpRes.success && fpRes.data) {
            formData = fpRes.data
            title = `Final Product - Box ${formData.box_number || 'N/A'}`
          } else {
            title = `Final Product - ${item.form_id}`
          }
          break
        case 'qc_form':
          const qcRes = await clamflowAPI.getQCFormById(item.form_id)
          if (qcRes.success && qcRes.data) {
            formData = qcRes.data
            title = `QC Form - ${formData.test_type || formData.form_type || 'N/A'}`
          } else {
            title = `QC Form - ${item.form_id}`
          }
          break
        case 'depuration_form':
          const depRes = await clamflowAPI.getDepurationSample(item.form_id)
          if (depRes.success && depRes.data) {
            formData = depRes.data
            title = `Depuration Form - Sample ${formData.sample_id || formData.id || 'N/A'}`
          } else {
            title = `Depuration Form - ${item.form_id}`
          }
          break
        default:
          title = `${item.form_type} - ${item.form_id}`
          formData = { id: item.form_id, type: item.form_type }
      }
    } catch (detailError) {
      console.warn(`Failed to load details for ${item.form_type}:`, detailError)
      title = `${item.form_type} - ${item.form_id}`
      formData = { 
        id: item.form_id, 
        type: item.form_type,
        error: 'Failed to load details'
      }
    }

    return {
      id: item.id,
      type: item.form_type,
      title,
      data: formData,
      submittedBy: item.submitted_by,
      submittedAt: item.submitted_at,
      priority: item.priority,
      status: item.status
    }
  })
)

      setPendingForms(forms)
    } catch (err: any) {
      console.error('❌ Failed to load pending forms:', err)
      setError(err.message || 'Failed to load pending forms')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (form: FormDetails) => {
    if (!currentUser) {
      setError('User authentication required')
      return
    }

    setActionLoading(form.id)
    setError('')

    try {
      // ✅ FIXED: Using correct API endpoint
      const response = await clamflowAPI.approveForm(form.id, form.type)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to approve form')
      }

      console.log('✅ Form approved successfully:', form.id)
      
      // Update local state
      setPendingForms(prev => prev.filter(f => f.id !== form.id))
      setSelectedForm(null)
      
      if (onFormApproved) {
        onFormApproved(form.id, form.type)
      }

      alert(`${form.title} approved successfully!`)
    } catch (err: any) {
      console.error('❌ Failed to approve form:', err)
      setError(err.message || 'Failed to approve form')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectClick = (form: FormDetails) => {
    setFormToReject(form)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!formToReject || !currentUser) return

    setActionLoading(formToReject.id)
    setError('')

    try {
      // ✅ FIXED: Using correct API endpoint with rejection reason
      const response = await clamflowAPI.rejectForm(formToReject.id, rejectionReason)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to reject form')
      }

      console.log('✅ Form rejected successfully:', formToReject.id)
      
      // Update local state
      setPendingForms(prev => prev.filter(f => f.id !== formToReject.id))
      setSelectedForm(null)
      setShowRejectModal(false)
      setFormToReject(null)
      
      if (onFormRejected) {
        onFormRejected(formToReject.id, formToReject.type)
      }

      alert(`${formToReject.title} rejected successfully!`)
    } catch (err: any) {
      console.error('❌ Failed to reject form:', err)
      setError(err.message || 'Failed to reject form')
    } finally {
      setActionLoading(null)
    }
  }

  const formatFormType = (type: string): string => {
    const typeMap = {
      'weight_note': 'Weight Note',
      'ppc_form': 'PPC Form',
      'fp_form': 'Final Product',
      'qc_form': 'QC Form',
      'depuration_form': 'Depuration'
    }
    return typeMap[type] || type
  }

  const getPriorityColor = (priority: string): string => {
    const colors = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[priority] || colors.low
  }

  const filteredForms = pendingForms.filter(form => 
    filter === 'all' || form.priority === filter
  )

  const canApprove = (formType: string): boolean => {
    if (!currentUser) return false
    
    const role = currentUser.role
    const approvalMatrix = {
      'weight_note': ['Super Admin', 'Admin', 'Production Lead'],
      'ppc_form': ['Super Admin', 'Admin', 'Production Lead'],
      'fp_form': ['Super Admin', 'Admin', 'Production Lead'],
      'qc_form': ['Super Admin', 'Admin', 'QC Lead'],
      'depuration_form': ['Super Admin', 'Admin', 'QC Lead']
    }
    
    return approvalMatrix[formType]?.includes(role) || false
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading pending forms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pending Form Approvals</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and approve/reject pending forms ({filteredForms.length} pending)
            </p>
          </div>
          <button
            onClick={loadPendingForms}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Filter Controls */}
      <div className="mb-6 flex space-x-2">
        {['all', 'high', 'medium', 'low'].map(priority => (
          <button
            key={priority}
            onClick={() => setFilter(priority as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === priority
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {priority === 'all' ? 'All Forms' : `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forms List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pending Forms</h3>
          
          {filteredForms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No pending forms found</p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  View all forms
                </button>
              )}
            </div>
          ) : (
            filteredForms.map(form => (
              <div
                key={form.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedForm?.id === form.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedForm(form)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{form.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(form.priority)}`}>
                    {form.priority}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Type:</span> {formatFormType(form.type)}</p>
                  <p><span className="font-medium">Submitted by:</span> {form.submittedBy}</p>
                  <p><span className="font-medium">Date:</span> {new Date(form.submittedAt).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form Details & Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Details</h3>
          
          {selectedForm ? (
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="mb-4">
                <h4 className="text-xl font-semibold text-gray-900">{selectedForm.title}</h4>
                <p className="text-sm text-gray-600">
                  {formatFormType(selectedForm.type)} • Submitted {new Date(selectedForm.submittedAt).toLocaleString()}
                </p>
              </div>

              {/* Form Data Display */}
<div className="mb-6 p-4 bg-white rounded border">
  <h5 className="font-medium text-gray-900 mb-3">Form Data</h5>
  <div className="grid grid-cols-2 gap-3 text-sm">
    {Object.entries(selectedForm.data || {}).map(([key, value]) => (
      <div key={key}>
        <span className="font-medium text-gray-600 capitalize">
          {key.replace(/_/g, ' ')}:
        </span>
        <span className="ml-2 text-gray-900">
          {value !== null && value !== undefined 
            ? (typeof value === 'object' ? JSON.stringify(value) : String(value))
            : 'N/A'
          }
        </span>
      </div>
    ))}
  </div>
</div>


              {/* Action Buttons */}
              {canApprove(selectedForm.type) ? (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApprove(selectedForm)}
                    disabled={actionLoading === selectedForm.id}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === selectedForm.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleRejectClick(selectedForm)}
                    disabled={actionLoading === selectedForm.id}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === selectedForm.id ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 text-sm">
                    You don't have permission to approve {formatFormType(selectedForm.type)} forms.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-6 bg-gray-50 text-center text-gray-500">
              <p>Select a form to view details and actions</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && formToReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Form</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject "{formToReject.title}"?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setFormToReject(null)
                  setRejectionReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim() || actionLoading === formToReject.id}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === formToReject.id ? 'Rejecting...' : 'Reject Form'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PendingFormViewer