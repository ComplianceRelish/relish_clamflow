"use client"

// src/components/qc/ApprovalDashboard.tsx
// Approval Dashboard - Based on Figma Framework
// Handles multi-tier approvals: QC Staff → Production Lead (PPC) / QC Lead (FP)

import React, { useState, useEffect, useCallback } from 'react'
import clamflowAPI, { canApproveForm } from '../../lib/clamflow-api'
import { 
  PendingApprovalItem, 
  PPCFormData, 
  FPFormData, 
  WeightNoteData,
  DepurationFormData 
} from '../../types/qc-workflow'

interface ApprovalDashboardProps {
  userRole: 'qc_staff' | 'qc_lead' | 'production_lead' | 'station_qa' | 'admin'
  userId: string
  onFormApproved: (formId: string, formType: 'ppc' | 'fp' | 'weight_note' | 'depuration') => void
  onFormRejected: (formId: string, formType: 'ppc' | 'fp' | 'weight_note' | 'depuration', reason: string) => void
  onClose: () => void
}

type FormType = 'all' | 'weight_note' | 'ppc_form' | 'fp_form' | 'depuration_form'
type ApprovalStage = 'all' | 'pending_qc' | 'pending_production_lead' | 'pending_qc_lead'

const ApprovalDashboard: React.FC<ApprovalDashboardProps> = ({
  userRole,
  userId,
  onFormApproved,
  onFormRejected,
  onClose
}) => {
  const [pendingForms, setPendingForms] = useState<PendingApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedForm, setSelectedForm] = useState<PendingApprovalItem | null>(null)
  const [filterType, setFilterType] = useState<FormType>('all')
  const [filterStage, setFilterStage] = useState<ApprovalStage>('all')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  // Calculate priority based on age and form type
  const calculatePriority = (form: any): 'low' | 'medium' | 'high' | 'critical' => {
    const age = calculateAge(form.submittedAt || form.createdAt)
    if (age > 120) return 'critical' // Over 2 hours
    if (age > 60) return 'high' // Over 1 hour
    if (age > 30) return 'medium' // Over 30 minutes
    return 'low'
  }

  // Calculate age in minutes
  const calculateAge = (submittedAt: string): number => {
    const submitted = new Date(submittedAt)
    const now = new Date()
    return Math.floor((now.getTime() - submitted.getTime()) / 60000)
  }

  // Load pending forms
  const loadPendingForms = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await clamflowAPI.getPendingQCForms()

      if (response.success && response.data) {
        // Transform to PendingApprovalItem format
        const items: PendingApprovalItem[] = response.data.map((form: any) => {
          const submittedAt = form.submittedAt || form.createdAt
          const age = Math.floor((new Date().getTime() - new Date(submittedAt).getTime()) / 60000)
          let priority: 'low' | 'medium' | 'high' | 'critical' = 'low'
          if (age > 120) priority = 'critical'
          else if (age > 60) priority = 'high'
          else if (age > 30) priority = 'medium'
          
          return {
            id: form.id,
            formType: form.formType,
            lotId: form.lotId,
            lotNumber: form.lotNumber,
            submittedBy: form.submittedBy,
            submittedByName: form.submittedByName || 'Unknown',
            submittedAt: submittedAt,
            station: form.stationId || 'Unknown',
            status: form.status,
            priority: priority,
            ageInMinutes: age,
            formData: form.formData || form
          }
        })

        setPendingForms(items)
      }
    } catch (err: any) {
      console.error('Failed to load pending forms:', err)
      setError(err.message || 'Failed to load pending forms')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPendingForms()
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingForms, 30000)
    return () => clearInterval(interval)
  }, [loadPendingForms])

  // Filter forms based on user role and filters
  const getFilteredForms = (): PendingApprovalItem[] => {
    return pendingForms.filter(form => {
      // Type filter
      if (filterType !== 'all' && form.formType !== filterType) return false
      
      // Stage filter
      if (filterStage !== 'all' && form.status !== filterStage) return false

      // Role-based filtering
      // QC Staff can see pending_qc forms
      // Production Lead can see pending_production_lead (PPC forms)
      // QC Lead can see pending_qc_lead (FP forms) and depuration forms
      if (userRole === 'qc_staff') {
        return form.status === 'pending_qc'
      } else if (userRole === 'production_lead') {
        return form.status === 'pending_production_lead' && form.formType === 'ppc_form'
      } else if (userRole === 'qc_lead') {
        return (form.status === 'pending_qc_lead' && form.formType === 'fp_form') ||
               form.formType === 'depuration_form'
      }
      
      // Admin/station_qa can see all
      return true
    })
  }

  // Check if user can approve this specific form
  const canUserApprove = (form: PendingApprovalItem): boolean => {
    const roleMap: Record<string, string> = {
      'qc_staff': 'QC Staff',
      'qc_lead': 'QC Lead',
      'production_lead': 'Production Lead',
      'admin': 'Admin',
      'station_qa': 'QC Staff'
    }
    
    const mappedRole = roleMap[userRole] || userRole
    
    // Determine required form type based on status
    let formTypeForApproval = form.formType
    if (form.status === 'pending_production_lead') {
      formTypeForApproval = 'ppc_form_production_lead' as any
    } else if (form.status === 'pending_qc_lead') {
      formTypeForApproval = 'fp_form_qc_lead' as any
    }
    
    return canApproveForm(mappedRole, formTypeForApproval)
  }

  // Handle form approval
  const handleApprove = async (form: PendingApprovalItem) => {
    if (!canUserApprove(form)) {
      setError('You do not have permission to approve this form')
      return
    }

    setProcessing(true)
    setError('')

    try {
      let response

      // Route to appropriate approval endpoint based on form type and status
      if (form.status === 'pending_production_lead') {
        response = await clamflowAPI.productionLeadApprovePPC(form.id)
      } else if (form.status === 'pending_qc_lead') {
        response = await clamflowAPI.qcLeadApproveFP(form.id)
      } else {
        response = await clamflowAPI.approveQCForm(form.id)
      }

      if (response.success) {
        // Remove from pending list
        setPendingForms(prev => prev.filter(f => f.id !== form.id))
        
        // Notify parent
        const formTypeMap: Record<string, 'ppc' | 'fp' | 'weight_note' | 'depuration'> = {
          'ppc_form': 'ppc',
          'fp_form': 'fp',
          'weight_note': 'weight_note',
          'depuration_form': 'depuration'
        }
        onFormApproved(form.id, formTypeMap[form.formType] || 'ppc')
        
        setSelectedForm(null)
      } else {
        throw new Error(response.error || 'Approval failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve form')
    } finally {
      setProcessing(false)
    }
  }

  // Handle form rejection
  const handleReject = async () => {
    if (!selectedForm || !rejectReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const response = await clamflowAPI.rejectQCForm(selectedForm.id, rejectReason)

      if (response.success) {
        // Remove from pending list
        setPendingForms(prev => prev.filter(f => f.id !== selectedForm.id))
        
        // Notify parent
        const formTypeMap: Record<string, 'ppc' | 'fp' | 'weight_note' | 'depuration'> = {
          'ppc_form': 'ppc',
          'fp_form': 'fp',
          'weight_note': 'weight_note',
          'depuration_form': 'depuration'
        }
        onFormRejected(selectedForm.id, formTypeMap[selectedForm.formType] || 'ppc', rejectReason)
        
        setSelectedForm(null)
        setRejectModalOpen(false)
        setRejectReason('')
      } else {
        throw new Error(response.error || 'Rejection failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject form')
    } finally {
      setProcessing(false)
    }
  }

  // Get status badge styling
  const getStatusBadge = (status: string): { bg: string; text: string; label: string } => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      'pending_qc': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pending QC' },
      'pending_production_lead': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Pending Prod. Lead' },
      'pending_qc_lead': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Pending QC Lead' },
    }
    return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status }
  }

  // Get form type badge
  const getFormTypeBadge = (formType: string): { bg: string; icon: string } => {
    const badges: Record<string, { bg: string; icon: string }> = {
      'weight_note': { bg: 'bg-red-100 text-red-800', icon: '⚖️' },
      'ppc_form': { bg: 'bg-purple-100 text-purple-800', icon: '📦' },
      'fp_form': { bg: 'bg-green-100 text-green-800', icon: '❄️' },
      'depuration_form': { bg: 'bg-blue-100 text-blue-800', icon: '💧' },
    }
    return badges[formType] || { bg: 'bg-gray-100 text-gray-800', icon: '📋' }
  }

  // Get priority styling
  const getPriorityStyle = (priority: string): string => {
    const styles: Record<string, string> = {
      'low': 'border-l-gray-400',
      'medium': 'border-l-yellow-400',
      'high': 'border-l-orange-500',
      'critical': 'border-l-red-600 bg-red-50'
    }
    return styles[priority] || styles.low
  }

  const filteredForms = getFilteredForms()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Approval Dashboard</h1>
              <p className="text-sm text-gray-600">
                Role: <span className="font-medium capitalize">{userRole.replace('_', ' ')}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={loadPendingForms}
                disabled={loading}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : '🔄 Refresh'}
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Pending</p>
            <p className="text-3xl font-bold text-gray-900">{filteredForms.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Critical (2h+)</p>
            <p className="text-3xl font-bold text-red-600">
              {filteredForms.filter(f => f.priority === 'critical').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
            <p className="text-sm text-gray-600">High Priority</p>
            <p className="text-3xl font-bold text-orange-600">
              {filteredForms.filter(f => f.priority === 'high').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Normal</p>
            <p className="text-3xl font-bold text-green-600">
              {filteredForms.filter(f => f.priority === 'low' || f.priority === 'medium').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Form Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FormType)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="weight_note">Weight Notes</option>
                <option value="ppc_form">PPC Forms</option>
                <option value="fp_form">FP Forms</option>
                <option value="depuration_form">Depuration Forms</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm text-gray-600 block mb-1">Approval Stage</label>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value as ApprovalStage)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Stages</option>
                <option value="pending_qc">Pending QC</option>
                <option value="pending_production_lead">Pending Production Lead</option>
                <option value="pending_qc_lead">Pending QC Lead</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError('')}
              className="text-sm text-red-600 hover:text-red-800 mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Forms List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Pending Approvals</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading forms...</p>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">No pending approvals</p>
              <p className="text-sm">Forms will appear here when submitted for approval</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredForms.map(form => {
                const statusBadge = getStatusBadge(form.status)
                const typeBadge = getFormTypeBadge(form.formType)
                
                return (
                  <div 
                    key={form.id}
                    className={`p-4 hover:bg-gray-50 border-l-4 ${getPriorityStyle(form.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header Row */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${typeBadge.bg}`}>
                            {typeBadge.icon} {form.formType.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                          {form.priority === 'critical' && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white animate-pulse">
                              ⚠️ URGENT
                            </span>
                          )}
                        </div>
                        
                        {/* Form Details */}
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">
                            Form ID: <span className="font-mono">{form.id.slice(0, 12)}...</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Lot: {form.lotNumber || 'N/A'} | Station: {form.station}
                          </p>
                          <p className="text-sm text-gray-500">
                            Submitted by {form.submittedByName} • {form.ageInMinutes} min ago
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setSelectedForm(form)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          View Details
                        </button>
                        {canUserApprove(form) && (
                          <>
                            <button
                              onClick={() => handleApprove(form)}
                              disabled={processing}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => { setSelectedForm(form); setRejectModalOpen(true); }}
                              disabled={processing}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Approval Flow Reference */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Approval Workflow Reference</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-700">PPC Form Approval:</p>
              <p className="text-blue-600">QC Staff → Production Lead → Gate Pass</p>
            </div>
            <div>
              <p className="font-medium text-blue-700">FP Form Approval:</p>
              <p className="text-blue-600">QC Staff → QC Lead → Inventory</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Detail Modal */}
      {selectedForm && !rejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Form Details</h2>
              <button 
                onClick={() => setSelectedForm(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {/* Form Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Form ID</p>
                  <p className="font-mono">{selectedForm.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Form Type</p>
                  <p className="capitalize">{selectedForm.formType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lot Number</p>
                  <p>{selectedForm.lotNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Station</p>
                  <p>{selectedForm.station}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted By</p>
                  <p>{selectedForm.submittedByName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted At</p>
                  <p>{new Date(selectedForm.submittedAt).toLocaleString()}</p>
                </div>
              </div>
              
              {/* Form Data Preview */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Form Data</h3>
                <pre className="text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedForm.formData, null, 2)}
                </pre>
              </div>
              
              {/* Actions */}
              {canUserApprove(selectedForm) && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedForm)}
                    disabled={processing}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : '✓ Approve Form'}
                  </button>
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    disabled={processing}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    ✗ Reject Form
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-red-800">Reject Form</h2>
              <p className="text-sm text-gray-600">
                Rejecting: {selectedForm.formType.replace('_', ' ')} - {selectedForm.id.slice(0, 8)}...
              </p>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter the reason for rejection..."
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectReason.trim()}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => { setRejectModalOpen(false); setRejectReason(''); }}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalDashboard
