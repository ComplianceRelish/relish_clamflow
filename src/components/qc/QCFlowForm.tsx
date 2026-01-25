"use client"

// src/components/qc/QCFlowForm.tsx
// Main QC Workflow Dashboard - Based on Figma Framework
// Shows the 14-step production workflow with QC approval capabilities

import React, { useState, useEffect, useCallback } from 'react'
import clamflowAPI, { getQCStaffAssignedStations, canQCStaffApproveStation } from '../../lib/clamflow-api'
import { 
  WorkflowStep, 
  WORKFLOW_STEPS, 
  QC_STAFF_OPTIONS,
  QCViewMode,
  WorkflowState,
  FormAction
} from '../../types/qc-workflow'

interface QCFlowFormProps {
  loggedInUser: string
  currentLotId: string | null
  supervisorHasCreatedLot: boolean
  onStepAction: (step: number, action: FormAction, formData?: unknown) => void
  currentQCStaffId: string
  currentStationId: string
}

const QCFlowForm: React.FC<QCFlowFormProps> = ({
  loggedInUser,
  currentLotId,
  supervisorHasCreatedLot,
  onStepAction,
  currentQCStaffId,
  currentStationId
}) => {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(WORKFLOW_STEPS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [pendingForms, setPendingForms] = useState<any[]>([])
  const [qcMetrics, setQCMetrics] = useState<any>(null)
  
  // Get assigned stations for current QC staff
  const assignedStations = getQCStaffAssignedStations(currentQCStaffId)
  const currentStaffInfo = QC_STAFF_OPTIONS.find(s => s.id === currentQCStaffId)

  // Load pending forms and update workflow status
  const loadWorkflowData = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const [formsResponse, metricsResponse] = await Promise.all([
        clamflowAPI.getPendingQCForms(),
        clamflowAPI.getQCMetrics()
      ])

      if (formsResponse.success && formsResponse.data) {
        setPendingForms(formsResponse.data)
      }

      if (metricsResponse.success && metricsResponse.data) {
        setQCMetrics(metricsResponse.data)
      }
      
    } catch (err: any) {
      console.error('Failed to load workflow data:', err)
      setError(err.message || 'Failed to load workflow data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWorkflowData()
    // Refresh every 60 seconds
    const interval = setInterval(loadWorkflowData, 60000)
    return () => clearInterval(interval)
  }, [loadWorkflowData])

  // Update workflow steps based on lot progress
  const updateWorkflowSteps = useCallback(() => {
    setWorkflowSteps(prevSteps => {
      return prevSteps.map(step => {
        let newStatus = step.status

        // Step 1: Weight Note - always available
        if (step.step === 1) {
          newStatus = 'available'
        }
        // Step 2: Lot Creation - available after weight note approved
        else if (step.step === 2) {
          newStatus = supervisorHasCreatedLot ? 'completed' : 'locked'
        }
        // Steps 3+: Available only after lot is created
        else if (step.step >= 3 && step.step <= 14) {
          if (!supervisorHasCreatedLot || !currentLotId) {
            newStatus = 'locked'
          } else {
            // Check if this step's station is assigned to current QC staff
            const canAccess = canQCStaffApproveStation(currentQCStaffId, step.station)
            if (canAccess || !step.requiresApproval) {
              newStatus = 'available'
            } else {
              newStatus = 'locked'
            }
          }
        }

        return { ...step, status: newStatus }
      })
    })
  }, [currentLotId, supervisorHasCreatedLot, currentQCStaffId])

  useEffect(() => {
    updateWorkflowSteps()
  }, [updateWorkflowSteps])

  // Get step status styling
  const getStepStatusStyle = (step: WorkflowStep): string => {
    const styles: Record<string, string> = {
      'locked': 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
      'available': 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100 cursor-pointer',
      'in_progress': 'bg-yellow-50 border-yellow-300 text-yellow-800',
      'completed': 'bg-green-50 border-green-300 text-green-800',
      'skipped': 'bg-gray-50 border-gray-200 text-gray-500'
    }
    return styles[step.status] || styles.locked
  }

  // Get approval badge
  const getApprovalBadge = (step: WorkflowStep): React.ReactNode => {
    if (!step.requiresApproval) return null
    
    const badges: Record<string, { bg: string; text: string }> = {
      'qc_staff': { bg: 'bg-purple-100', text: 'QC Staff' },
      'qc_lead': { bg: 'bg-indigo-100', text: 'QC Lead' },
      'production_lead': { bg: 'bg-orange-100', text: 'Prod. Lead' },
      'supervisor': { bg: 'bg-teal-100', text: 'Supervisor' }
    }
    
    const badge = badges[step.approvalType || 'qc_staff']
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${badge.bg}`}>
        {badge.text} Approval
      </span>
    )
  }

  // Check if step is actionable by current QC staff
  const isStepActionable = (step: WorkflowStep): boolean => {
    if (step.status === 'locked') return false
    if (!step.requiresApproval) return step.status === 'available'
    return canQCStaffApproveStation(currentQCStaffId, step.station)
  }

  // Handle step click
  const handleStepClick = (step: WorkflowStep) => {
    if (!isStepActionable(step)) return
    
    // Determine action based on step
    if (step.requiresApproval) {
      onStepAction(step.step, 'view')
    } else {
      onStepAction(step.step, 'view')
    }
  }

  // Count pending forms for this QC staff's stations
  const getPendingCountForStations = (): number => {
    return pendingForms.filter(form => 
      assignedStations.some(station => 
        form.station?.toLowerCase().includes(station.toLowerCase().replace(' Station', ''))
      )
    ).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QC Flow Dashboard</h1>
              <p className="text-sm text-gray-600">
                Logged in as: <span className="font-medium">{loggedInUser}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Current Lot Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <span className="text-xs text-blue-600">Current Lot</span>
                <p className="font-mono text-sm font-medium text-blue-900">
                  {currentLotId ? currentLotId.slice(0, 8) + '...' : 'No Lot Active'}
                </p>
              </div>
              
              {/* Station Assignment Badge */}
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <span className="text-xs text-green-600">Assigned Stations</span>
                <p className="text-sm font-medium text-green-900">
                  {currentStaffInfo?.stations.join(', ') || 'None'}
                </p>
              </div>

              {/* Pending Forms Count */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
                <span className="text-xs text-orange-600">Pending Forms</span>
                <p className="text-2xl font-bold text-orange-900">{getPendingCountForStations()}</p>
              </div>

              {/* Refresh Button */}
              <button 
                onClick={loadWorkflowData}
                disabled={loading}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* QC Metrics Summary */}
      {qcMetrics && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600">{qcMetrics.pending || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-600">Approved Today</p>
              <p className="text-3xl font-bold text-green-600">{qcMetrics.approved || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{qcMetrics.rejected || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-600">Total Forms</p>
              <p className="text-3xl font-bold text-blue-600">
                {(qcMetrics.pending || 0) + (qcMetrics.approved || 0) + (qcMetrics.rejected || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Steps */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Production Workflow Steps</h2>
            <p className="text-sm text-gray-600">Click on available steps to view/approve forms</p>
          </div>
          
          <div className="p-4">
            <div className="grid gap-3">
              {workflowSteps.map((step) => (
                <div
                  key={step.step}
                  onClick={() => handleStepClick(step)}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${getStepStatusStyle(step)}
                    ${isStepActionable(step) ? 'shadow-sm hover:shadow-md' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Step Number */}
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                        ${step.status === 'completed' ? 'bg-green-500 text-white' : 
                          step.status === 'in_progress' ? 'bg-yellow-500 text-white' :
                          step.status === 'available' ? 'bg-blue-500 text-white' :
                          'bg-gray-300 text-gray-600'}
                      `}>
                        {step.status === 'completed' ? '✓' : step.step}
                      </div>
                      
                      {/* Step Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{step.name}</h3>
                          {getApprovalBadge(step)}
                        </div>
                        <p className="text-sm opacity-75">{step.station}</p>
                        <p className="text-xs opacity-60">{step.description}</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {step.status === 'available' && step.requiresApproval && isStepActionable(step) && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onStepAction(step.step, 'view'); }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            View
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onStepAction(step.step, 'approve'); }}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                        </>
                      )}
                      
                      {step.status === 'locked' && (
                        <span className="text-gray-400 text-sm">🔒 Locked</span>
                      )}
                      
                      {step.status === 'completed' && (
                        <span className="text-green-600 text-sm">✓ Completed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Forms for Assigned Stations */}
      <div className="max-w-7xl mx-auto px-4 mt-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Forms Pending Your Approval</h2>
            <p className="text-sm text-gray-600">Forms from your assigned stations: {assignedStations.join(', ')}</p>
          </div>
          
          <div className="divide-y">
            {pendingForms.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg">No pending forms for your stations</p>
                <p className="text-sm">Forms will appear here when submitted for QC approval</p>
              </div>
            ) : (
              pendingForms
                .filter(form => 
                  assignedStations.some(station => 
                    form.station?.toLowerCase().includes(station.toLowerCase().replace(' Station', ''))
                  )
                )
                .map(form => (
                  <div key={form.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`
                            px-2 py-0.5 rounded text-xs font-medium
                            ${form.formType === 'weight_note' ? 'bg-blue-100 text-blue-800' :
                              form.formType === 'ppc_form' ? 'bg-purple-100 text-purple-800' :
                              form.formType === 'fp_form' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'}
                          `}>
                            {form.formType?.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="font-medium">{form.id}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Station: {form.station} | Lot: {form.lotNumber || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted by {form.submittedByName} at {new Date(form.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onStepAction(0, 'view', form)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Review
                        </button>
                        <button 
                          onClick={() => onStepAction(0, 'approve', form)}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Quick Approve
                        </button>
                        <button 
                          onClick={() => onStepAction(0, 'reject', form)}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Step Status Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-300"></div>
              <span>Locked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QCFlowForm
