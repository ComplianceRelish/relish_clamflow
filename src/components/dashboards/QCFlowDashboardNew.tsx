"use client"

// src/components/dashboards/QCFlowDashboard.tsx
// COMPLETE REPLACEMENT - Based on Figma Framework
// Main entry point for QC Workflow with all components integrated
// NOW CONNECTED TO REAL BACKEND STATION ASSIGNMENTS API

import React, { useState, useCallback, useEffect } from 'react'
import { User } from '../../types/auth'
import { 
  QCViewMode, 
  WorkflowState, 
  RFIDTagData, 
  QRLabelData,
  QC_STAFF_OPTIONS,
  FormAction,
  WeightNoteData,
  PPCFormData,
  FPFormData
} from '../../types/qc-workflow'
import { preloadStaffStationAssignments, clearStationAssignmentCache } from '../../lib/clamflow-api'

// Import QC Components
import QCFlowForm from '../qc/QCFlowForm'
import RFIDScanner from '../qc/RFIDScanner'
import QRLabelGenerator from '../qc/QRLabelGenerator'
import ApprovalDashboard from '../qc/ApprovalDashboard'

// Import Form Components
import WeightNoteForm from '../forms/WeightNoteForm'
import PPCForm from '../forms/PPCForm'
import FPForm from '../forms/FPForm'
import SampleExtractionForm from '../forms/SampleExtractionForm'
import DepurationForm from '../forms/DepurationForm'

interface QCFlowDashboardProps {
  currentUser: User | null
}

const QCFlowDashboard: React.FC<QCFlowDashboardProps> = ({ currentUser }) => {
  // Current view state
  const [currentView, setCurrentView] = useState<QCViewMode>('qc-form')
  const [selectedFormData, setSelectedFormData] = useState<any>(null)
  
  // Workflow state management
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    weightNoteApproved: false,
    supervisorHasCreatedLot: false,
    currentLotId: null,
    rfidTagData: null,
    qrLabelData: null
  })

  // Current QC Staff ID (from authenticated user)
  const [currentQCStaffId, setCurrentQCStaffId] = useState(currentUser?.id || "qc_staff_001")
  const currentStationId = "rm_station" // Would come from user's station assignment

  // Preload station assignments when user changes
  useEffect(() => {
    if (currentQCStaffId) {
      console.log(`🔄 Preloading station assignments for ${currentQCStaffId}...`)
      preloadStaffStationAssignments(currentQCStaffId)
    }
  }, [currentQCStaffId])

  // Helper function to create placeholder data based on form type
  const createPlaceholderData = useCallback((type: 'weight-note' | 'ppc' | 'fp'): Record<string, unknown> => {
    const baseData = {
      id: "placeholder-id",
      lot_id: workflowState.currentLotId || "pending-lot-creation",
      qc_staff_id: currentQCStaffId,
      submitted_at: new Date().toISOString(),
      qc_approved: false,
      qc_approved_by: null,
      qc_approved_at: null,
      remarks: null
    }

    switch (type) {
      case 'weight-note':
        return {
          ...baseData,
          status: "pending",
          lot_id: "pending-supervisor-lot-creation",
          supplier_id: "placeholder-supplier-id",
          box_number: "N/A",
          weight: 0
        }
      
      case 'ppc':
        return {
          ...baseData,
          status: "draft",
          box_number: "N/A",
          product_type: "N/A",
          grade: "N/A",
          weight: 0
        }
      
      case 'fp':
        return {
          ...baseData,
          status: "draft",
          box_number: "N/A",
          product_type: "N/A",
          grade: "N/A",
          weight: 0
        }
        
      default:
        return baseData
    }
  }, [workflowState.currentLotId, currentQCStaffId])

  // Simulate supervisor creating a lot (for demo purposes)
  const simulateSupervisorLotCreation = useCallback(() => {
    const newLotId = `LOT-${Date.now().toString(36).toUpperCase()}`
    setWorkflowState(prev => ({
      ...prev,
      currentLotId: newLotId,
      supervisorHasCreatedLot: true
    }))
    alert(`Production Supervisor has created Lot: ${newLotId}. The washing step is now active.`)
  }, [])

  // RFID Tag linking handler
  const handleRFIDLinked = useCallback((rfidData: RFIDTagData) => {
    setWorkflowState(prev => ({ ...prev, rfidTagData: rfidData }))
    console.log("RFID Tag linked to product:", rfidData)
    alert(`RFID Tag ${rfidData.tag_id} successfully linked to ${rfidData.box_number}`)
    setCurrentView('qc-form')
  }, [])

  // QR Label generation handler
  const handleQRLabelGenerated = useCallback((labelData: QRLabelData) => {
    setWorkflowState(prev => ({ ...prev, qrLabelData: labelData }))
    console.log("QR Label generated:", labelData)
    alert(`QR Label generated for ${labelData.box_number}. Product ready for inventory.`)
    setCurrentView('qc-form')
  }, [])

  // Weight Note Form submission handler
  const handleWeightNoteFormSubmitted = useCallback((formId: string) => {
    console.log("Weight Note Form submitted:", formId)
    alert(`Weight Note Form ${formId} submitted to RM Station QC for approval.`)
    setCurrentView('qc-form')
  }, [])

  // PPC Form submission handler
  const handlePPCFormSubmitted = useCallback((formData: any) => {
    console.log("PPC Form submitted:", formData)
    alert(`PPC Form ${formData.id || 'new'} submitted to Station QC for approval.`)
    setCurrentView('qc-form')
  }, [])

  // FP Form submission handler
  const handleFPFormSubmitted = useCallback((formData: any) => {
    console.log("FP Form submitted:", formData)
    alert(`FP Form ${formData.id || 'new'} submitted to Station QC for approval.`)
    setCurrentView('qc-form')
  }, [])

  // FP Label generation request handler
  const handleFPLabelRequest = useCallback((boxData: any) => {
    console.log("FP Label generation requested for box:", boxData)
    setSelectedFormData({
      ...boxData,
      type: 'fp',
      box_number: boxData.final_box_number || boxData.box_number
    })
    setCurrentView('qr-generator')
  }, [])

  // Step action handler from QCFlowForm
  const handleStepAction = useCallback((step: number, action: FormAction, formData?: unknown) => {
    console.log(`Step ${step} - ${action}`, formData)
    
    // If formData is provided (from pending forms list), use it
    if (formData) {
      setSelectedFormData(formData)
    }
    
    switch (step) {
      case 0: // From pending forms list
        if (action === 'view' || action === 'approve') {
          setCurrentView('approval-dashboard')
        }
        break
        
      case 1: // RM Station - Weight Note
        if (action === 'view' || action === 'approve') {
          setSelectedFormData(createPlaceholderData('weight-note'))
          setCurrentView('weight-note')
        }
        break
        
      case 3: // Depuration - Sample Extraction
        if (action === 'view' || action === 'approve') {
          setCurrentView('sample-extraction')
        }
        break
        
      case 5: // Depuration Form
        if (action === 'view' || action === 'approve') {
          setCurrentView('depuration-form')
        }
        break
        
      case 10: // PPC Packing
        if (action === 'view' || action === 'approve') {
          setSelectedFormData(createPlaceholderData('ppc'))
          setCurrentView('ppc-form')
        }
        break
        
      case 11: // FP Receiving - RFID
        if (action === 'view' || action === 'scan') {
          setSelectedFormData(createPlaceholderData('ppc'))
          setCurrentView('rfid-scanner')
        }
        break
        
      case 13: // Frozen Product - FP Form
        if (action === 'view' || action === 'approve') {
          setSelectedFormData(createPlaceholderData('fp'))
          setCurrentView('fp-form')
        }
        break
        
      case 14: // QR Label Generation
        if (action === 'generate_label') {
          setSelectedFormData(createPlaceholderData('fp'))
          setCurrentView('qr-generator')
        }
        break
        
      default:
        console.log(`Step ${step} functionality not yet fully implemented`)
        break
    }
  }, [createPlaceholderData])

  // Back to dashboard handler
  const handleBackToDashboard = useCallback(() => {
    setCurrentView('qc-form')
    setSelectedFormData(null)
  }, [])

  // Form approval handlers from ApprovalDashboard
  const handleFormApprovedInDashboard = useCallback((formId: string, formType: 'ppc' | 'fp' | 'weight_note' | 'depuration') => {
    console.log(`${formType.toUpperCase()} Form ${formId} approved`)
    
    if (formType === 'weight_note') {
      setWorkflowState(prev => ({ ...prev, weightNoteApproved: true }))
      alert(`Weight Note ${formId} approved. Waiting for Supervisor to create lot.`)
      // Simulate supervisor creating lot after 3 seconds (for demo)
      setTimeout(() => {
        simulateSupervisorLotCreation()
      }, 3000)
    } else if (formType === 'ppc') {
      alert(`PPC Form ${formId} approved. Gate pass will be generated.`)
    } else if (formType === 'fp') {
      alert(`FP Form ${formId} approved. Data will be inserted into inventory.`)
    } else {
      alert(`Depuration Form ${formId} approved. Lot continues to next stage.`)
    }
  }, [simulateSupervisorLotCreation])

  const handleFormRejectedInDashboard = useCallback((formId: string, formType: 'ppc' | 'fp' | 'weight_note' | 'depuration', reason: string) => {
    console.log(`${formType.toUpperCase()} Form ${formId} rejected:`, reason)
    alert(`${formType.toUpperCase()} Form ${formId} rejected and sent back for rectification.`)
  }, [])

  // Get user role for approval dashboard
  const getUserRole = (): 'qc_staff' | 'qc_lead' | 'production_lead' | 'station_qa' | 'admin' => {
    const role = currentUser?.role?.toLowerCase() || ''
    if (role.includes('admin') || role.includes('super')) return 'admin'
    if (role.includes('production lead')) return 'production_lead'
    if (role.includes('qc lead')) return 'qc_lead'
    return 'qc_staff'
  }

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'sample-extraction':
        return (
          <SampleExtractionForm 
            currentUser={currentUser}
            onSubmit={(data) => {
              console.log("Sample extraction submitted:", data)
              setCurrentView('depuration-form')
            }}
          />
        )

      case 'depuration-form':
        return (
          <DepurationForm 
            currentUser={currentUser}
            onSubmit={(data) => {
              console.log("Depuration test results submitted:", data)
              alert("Depuration Form submitted successfully! Lot continues to next stage.")
              handleBackToDashboard()
            }}
          />
        )

      case 'weight-note':
      case 'weight-note-new':
        return (
          <WeightNoteForm 
            onSubmit={handleWeightNoteFormSubmitted}
            onCancel={handleBackToDashboard}
            currentUser={currentUser}
          />
        )

      case 'ppc-form':
      case 'ppc-form-new':
        return workflowState.currentLotId ? (
          <PPCForm 
            onSubmit={handlePPCFormSubmitted}
            currentUser={currentUser}
          />
        ) : (
          <div className="p-8 text-center">
            <p className="text-lg text-gray-600">No active lot. Please wait for supervisor to create a lot.</p>
            <button onClick={handleBackToDashboard} className="mt-4 px-4 py-2 bg-gray-200 rounded">Back</button>
          </div>
        )

      case 'fp-form':
      case 'fp-form-new':
        return workflowState.currentLotId ? (
          <FPForm 
            onSubmit={handleFPFormSubmitted}
            currentUser={currentUser}
          />
        ) : (
          <div className="p-8 text-center">
            <p className="text-lg text-gray-600">No active lot. Please wait for supervisor to create a lot.</p>
            <button onClick={handleBackToDashboard} className="mt-4 px-4 py-2 bg-gray-200 rounded">Back</button>
          </div>
        )

      case 'rfid-scanner':
        return selectedFormData ? (
          <RFIDScanner 
            lotId={selectedFormData.lot_id || workflowState.currentLotId || "demo-lot"}
            boxNumber={selectedFormData.box_number || "DEMO-BOX-001"}
            productType={selectedFormData.product_type || "Whole Clam"}
            grade={selectedFormData.grade || "A"}
            weight={selectedFormData.weight || 25.5}
            onRFIDLinked={handleRFIDLinked}
            onClose={handleBackToDashboard}
          />
        ) : (
          <div className="p-8 text-center">
            <p className="text-lg text-gray-600">No box selected for RFID scanning.</p>
            <button onClick={handleBackToDashboard} className="mt-4 px-4 py-2 bg-gray-200 rounded">Back</button>
          </div>
        )

      case 'qr-generator':
        return selectedFormData ? (
          <QRLabelGenerator 
            lotId={selectedFormData.lot_id || workflowState.currentLotId || "demo-lot"}
            boxNumber={selectedFormData.final_box_number || selectedFormData.box_number || "DEMO-BOX-001"}
            productType={selectedFormData.product_type || "Whole Clam"}
            grade={selectedFormData.grade || "A"}
            weight={selectedFormData.weight || 25.5}
            rfidTagId={selectedFormData.rfid_tag_id || workflowState.rfidTagData?.tag_id}
            staffId={currentQCStaffId}
            onLabelGenerated={handleQRLabelGenerated}
            onClose={handleBackToDashboard}
            originalBoxNumber={selectedFormData.original_box_number}
          />
        ) : (
          <div className="p-8 text-center">
            <p className="text-lg text-gray-600">No box selected for label generation.</p>
            <button onClick={handleBackToDashboard} className="mt-4 px-4 py-2 bg-gray-200 rounded">Back</button>
          </div>
        )
        
      case 'approval-dashboard':
        return (
          <ApprovalDashboard 
            userRole={getUserRole()}
            userId={currentQCStaffId}
            onFormApproved={handleFormApprovedInDashboard}
            onFormRejected={handleFormRejectedInDashboard}
            onClose={handleBackToDashboard}
          />
        )
        
      default:
        return (
          <div className="relative">
            <QCFlowForm 
              loggedInUser={currentUser?.full_name || QC_STAFF_OPTIONS.find(staff => staff.id === currentQCStaffId)?.name || "QC Staff"}
              currentLotId={workflowState.currentLotId}
              supervisorHasCreatedLot={workflowState.supervisorHasCreatedLot}
              onStepAction={handleStepAction}
              currentQCStaffId={currentQCStaffId}
              currentStationId={currentStationId}
            />
            
            {/* Demo Buttons for QC Staff Switching */}
            <div className="fixed top-6 right-6 z-50">
              <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Switch QC Staff (Demo):</p>
                {QC_STAFF_OPTIONS.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => {
                      // Clear cache when switching users to force reload from API
                      clearStationAssignmentCache()
                      setCurrentQCStaffId(staff.id)
                      alert(`Switched to ${staff.name}. Loading station assignments from backend...`)
                    }}
                    className={`block w-full text-left px-3 py-2 text-sm rounded ${
                      currentQCStaffId === staff.id 
                        ? 'bg-green-100 text-green-800 border border-green-300' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{staff.name}</div>
                    <div className="text-xs text-gray-600">{staff.stations.join(", ")} (demo)</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Demo Button for Testing Supervisor Lot Creation */}
            {workflowState.weightNoteApproved && !workflowState.supervisorHasCreatedLot && (
              <div className="fixed bottom-6 right-6 z-50">
                <button
                  onClick={simulateSupervisorLotCreation}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg shadow-lg"
                >
                  [DEMO] Simulate Supervisor Creates Lot
                </button>
              </div>
            )}

            {/* Demo Buttons for New Form Workflows */}
            <div className="fixed bottom-6 left-6 z-50 space-y-2">
              <button
                onClick={() => setCurrentView('weight-note-new')}
                className="block w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
              >
                [DEMO] Create Weight Note
              </button>
              {workflowState.currentLotId && (
                <>
                  <button
                    onClick={() => setCurrentView('sample-extraction')}
                    className="block w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
                  >
                    [DEMO] Test Depuration Workflow
                  </button>
                  <button
                    onClick={() => setCurrentView('ppc-form-new')}
                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
                  >
                    [DEMO] Create PPC Form
                  </button>
                  <button
                    onClick={() => setCurrentView('fp-form-new')}
                    className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
                  >
                    [DEMO] Create FP Form
                  </button>
                  <button
                    onClick={() => setCurrentView('approval-dashboard')}
                    className="block w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
                  >
                    [DEMO] Approval Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFormData(createPlaceholderData('ppc'))
                      setCurrentView('rfid-scanner')
                    }}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
                  >
                    [DEMO] Test RFID Scanner
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFormData(createPlaceholderData('fp'))
                      setCurrentView('qr-generator')
                    }}
                    className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
                  >
                    [DEMO] Test QR Generator
                  </button>
                </>
              )}
            </div>
          </div>
        )
    }
  }

  return <div className="min-h-screen bg-gray-50">{renderCurrentView()}</div>
}

export default QCFlowDashboard
