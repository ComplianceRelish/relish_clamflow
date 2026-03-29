"use client"

// src/components/dashboards/QCFlowDashboardNew.tsx
// QC Staff Dashboard — Lot-Based Approval & Oversight
// QC Staff approves forms submitted by Production Staff AND performs
// sequential QC checkpoints per lot (sample extraction, depuration
// monitoring, RFID scanning, QR label generation, etc.)

import React, { useState, useCallback, useEffect } from 'react'
import { User } from '../../types/auth'
import { RFIDTagData, QRLabelData } from '../../types/qc-workflow'
import clamflowAPI from '../../lib/clamflow-api'

// QC Components
import RFIDScanner from '../qc/RFIDScanner'
import QRLabelGenerator from '../qc/QRLabelGenerator'
import ApprovalDashboard from '../qc/ApprovalDashboard'

// QC-specific Forms (tasks only QC Staff performs)
import SampleExtractionForm from '../forms/SampleExtractionForm'
import DepurationForm from '../forms/DepurationForm'

// ============================================
// QC CHECKPOINT DEFINITIONS (per-lot sequence)
// ============================================

interface QCCheckpoint {
  id: string
  step: number
  label: string
  description: string
  icon: string
  type: 'approval' | 'task' | 'scan' | 'label'
}

const QC_CHECKPOINTS: QCCheckpoint[] = [
  { id: 'weight-note',       step: 1,  label: 'Weight Note Approval',   description: 'Review & approve incoming raw material weight note',          icon: '⚖️', type: 'approval' },
  { id: 'sample-extraction', step: 3,  label: 'Sample Extraction',      description: 'Extract depuration sample for lab testing',                   icon: '🔬', type: 'task' },
  { id: 'depuration',        step: 5,  label: 'Depuration Monitoring',  description: 'Monitor tank parameters — salinity, temp, pH, turbidity',     icon: '🧪', type: 'task' },
  { id: 'ppc-qc-check',      step: 9,  label: 'PPC Quality Verification', description: 'Inspect freshness, colour, texture, smell of packed product', icon: '🔍', type: 'approval' },
  { id: 'ppc-form',          step: 10, label: 'PPC Form Approval',      description: 'Approve PPC form → routes to Production Lead for gate pass',  icon: '📋', type: 'approval' },
  { id: 'rfid-scan',         step: 11, label: 'RFID Tag Scan',          description: 'Scan & link RFID tag to FP receiving box',                    icon: '📡', type: 'scan' },
  { id: 'fp-form',           step: 13, label: 'FP Form Approval',       description: 'Approve FP form → routes to Production Lead for inventory',   icon: '📦', type: 'approval' },
  { id: 'qr-label',          step: 14, label: 'QR Label Generation',    description: 'Generate traceability QR label for FP box',                   icon: '🏷️', type: 'label' },
]

// ============================================
// TYPES
// ============================================

type CheckpointStatus = 'blocked' | 'ready' | 'completed'

interface LotData {
  id: string
  lotNumber: string
  supplierName?: string
  status: string
  createdAt: string
  checkpoints: Record<string, CheckpointStatus>
}

type DashboardView =
  | 'tracker'
  | 'lot-detail'
  | 'approval-dashboard'
  | 'sample-extraction'
  | 'depuration-form'
  | 'rfid-scanner'
  | 'qr-generator'

// ============================================
// CHECKPOINT STATUS INFERENCE
// Map lot status → which QC checkpoints are done / ready / blocked
// Lot statuses: received, washing, depuration, ppc, fp, shipped, archived
// ============================================

const LOT_STATUS_ORDER: Record<string, number> = {
  received: 0,
  washing: 1,
  depuration: 2,
  ppc: 3,
  fp: 4,
  shipped: 5,
  archived: 6,
}

function inferCheckpointStatus(lotStatus: string): Record<string, CheckpointStatus> {
  const idx = LOT_STATUS_ORDER[lotStatus] ?? -1
  const cp: Record<string, CheckpointStatus> = {}

  // Step 1  — Weight Note: lot exists → already approved (lot was created after approval)
  cp['weight-note'] = idx >= 0 ? 'completed' : 'ready'

  // Step 3  — Sample Extraction: ready once lot is in washing, done once in depuration+
  cp['sample-extraction'] = idx >= 2 ? 'completed' : idx >= 1 ? 'ready' : 'blocked'

  // Step 5  — Depuration Monitoring: ready during depuration, done once in ppc+
  cp['depuration'] = idx >= 3 ? 'completed' : idx >= 2 ? 'ready' : 'blocked'

  // Step 9  — PPC QC Check: ready during ppc stage, done once in fp+
  cp['ppc-qc-check'] = idx >= 4 ? 'completed' : idx >= 3 ? 'ready' : 'blocked'

  // Step 10 — PPC Form Approval: same window as PPC QC check
  cp['ppc-form'] = idx >= 4 ? 'completed' : idx >= 3 ? 'ready' : 'blocked'

  // Step 11 — RFID Scan: ready during fp stage, done once shipped+
  cp['rfid-scan'] = idx >= 5 ? 'completed' : idx >= 4 ? 'ready' : 'blocked'

  // Step 13 — FP Form Approval: ready during fp, done once shipped+
  cp['fp-form'] = idx >= 5 ? 'completed' : idx >= 4 ? 'ready' : 'blocked'

  // Step 14 — QR Label: ready after fp-form approved, done once shipped
  cp['qr-label'] = idx >= 5 ? 'completed' : idx >= 4 ? 'ready' : 'blocked'

  return cp
}

// ============================================
// HELPERS
// ============================================

function completedCount(lot: LotData): number {
  return Object.values(lot.checkpoints).filter(s => s === 'completed').length
}
function readyCount(lot: LotData): number {
  return Object.values(lot.checkpoints).filter(s => s === 'ready').length
}
function progressPercent(lot: LotData): number {
  return Math.round((completedCount(lot) / QC_CHECKPOINTS.length) * 100)
}

const STATUS_PILL: Record<CheckpointStatus, string> = {
  completed: 'text-green-700 bg-green-100',
  ready:     'text-amber-700 bg-amber-100',
  blocked:   'text-gray-500 bg-gray-100',
}
const STATUS_LABEL: Record<CheckpointStatus, string> = {
  completed: 'Done',
  ready:     'Action Needed',
  blocked:   'Waiting',
}
const STATUS_DOT: Record<CheckpointStatus, string> = {
  completed: 'bg-green-500',
  ready:     'bg-amber-500',
  blocked:   'bg-gray-300',
}

// ============================================
// COMPONENT
// ============================================

interface QCFlowDashboardProps {
  currentUser: User | null
}

const QCFlowDashboard: React.FC<QCFlowDashboardProps> = ({ currentUser }) => {
  const [view, setView] = useState<DashboardView>('tracker')
  const [lots, setLots] = useState<LotData[]>([])
  const [selectedLot, setSelectedLot] = useState<LotData | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scanContext, setScanContext] = useState<Record<string, unknown> | null>(null)

  const currentStaffId = currentUser?.id || ''

  // ── Data fetching ──────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [lotsRes, pendingRes] = await Promise.all([
        clamflowAPI.getLots(),
        clamflowAPI.getPendingQCForms(),
      ])

      if (lotsRes.success && lotsRes.data) {
        const arr = Array.isArray(lotsRes.data) ? lotsRes.data : []
        const active: LotData[] = arr
          .filter((l: any) => l.status !== 'shipped' && l.status !== 'archived')
          .map((l: any) => ({
            id: l.id,
            lotNumber: l.lotNumber || l.lot_number || l.id,
            supplierName: l.supplierName || l.supplier_name,
            status: l.status || 'received',
            createdAt: l.createdAt || l.created_at || new Date().toISOString(),
            checkpoints: inferCheckpointStatus(l.status || 'received'),
          }))
        setLots(active)
      }

      if (pendingRes.success && pendingRes.data) {
        setPendingCount(Array.isArray(pendingRes.data) ? pendingRes.data.length : 0)
      }
    } catch (err) {
      console.error('Failed to load QC dashboard data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Keep selectedLot in sync after refresh
  useEffect(() => {
    if (selectedLot) {
      const updated = lots.find(l => l.id === selectedLot.id)
      if (updated) setSelectedLot(updated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lots])

  // ── Navigation ─────────────────────────────────────────

  const handleBack = useCallback(() => {
    if (view === 'lot-detail') {
      setSelectedLot(null)
      setView('tracker')
    } else {
      loadData()
      setView(selectedLot ? 'lot-detail' : 'tracker')
    }
  }, [view, selectedLot, loadData])

  const openLotDetail = (lot: LotData) => {
    setSelectedLot(lot)
    setView('lot-detail')
  }

  // ── Checkpoint action router ───────────────────────────

  const handleCheckpointAction = (cp: QCCheckpoint, lot: LotData) => {
    setSelectedLot(lot)

    switch (cp.id) {
      case 'weight-note':
      case 'ppc-qc-check':
      case 'ppc-form':
      case 'fp-form':
        setView('approval-dashboard')
        break
      case 'sample-extraction':
        setView('sample-extraction')
        break
      case 'depuration':
        setView('depuration-form')
        break
      case 'rfid-scan':
        setScanContext({
          lot_id: lot.id,
          box_number: `${lot.lotNumber}-BOX-001`,
          product_type: 'Whole Clam',
          grade: 'A',
          weight: 25,
        })
        setView('rfid-scanner')
        break
      case 'qr-label':
        setScanContext({
          lot_id: lot.id,
          box_number: `${lot.lotNumber}-FP-001`,
          product_type: 'Whole Clam',
          grade: 'A',
          weight: 25,
        })
        setView('qr-generator')
        break
    }
  }

  // ── Approval handlers ──────────────────────────────────

  const handleFormApproved = useCallback(
    (formId: string, formType: 'ppc' | 'fp' | 'weight_note' | 'depuration') => {
      const label = formType.replace('_', ' ').toUpperCase()
      alert(`${label} ${formId} approved successfully.`)
      loadData()
    },
    [loadData],
  )

  const handleFormRejected = useCallback(
    (formId: string, formType: 'ppc' | 'fp' | 'weight_note' | 'depuration', reason: string) => {
      const label = formType.replace('_', ' ').toUpperCase()
      alert(`${label} ${formId} rejected — sent back for correction.\nReason: ${reason}`)
    },
    [],
  )

  const getUserRole = (): 'qc_staff' | 'qc_lead' | 'production_lead' | 'station_qa' | 'admin' => {
    const role = currentUser?.role?.toLowerCase() || ''
    if (role.includes('admin') || role.includes('super')) return 'admin'
    if (role.includes('production lead')) return 'production_lead'
    if (role.includes('qc lead')) return 'qc_lead'
    return 'qc_staff'
  }

  // ════════════════════════════════════════════════════════
  // RENDER: LOT TRACKER (default view)
  // ════════════════════════════════════════════════════════

  const renderLotTracker = () => (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QC Oversight Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentUser?.full_name || 'QC Staff'} &mdash; {lots.length} active lot{lots.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('approval-dashboard')}
            className="relative inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            Pending Approvals
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={loadData} className="ml-2 underline font-medium">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && lots.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-600">Loading lots…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && lots.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900">No Active Lots</h3>
          <p className="text-gray-500 mt-1">Lots will appear here once Production Lead creates them after weight note approval.</p>
          <button
            onClick={() => setView('approval-dashboard')}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
          >
            Check Pending Approvals
          </button>
        </div>
      )}

      {/* Lot cards grid */}
      {lots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lots.map(lot => {
            const done = completedCount(lot)
            const ready = readyCount(lot)
            const pct = progressPercent(lot)

            return (
              <div
                key={lot.id}
                onClick={() => openLotDetail(lot)}
                className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-teal-300 transition-all"
              >
                {/* Lot header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{lot.lotNumber}</h3>
                    {lot.supplierName && <p className="text-xs text-gray-500">{lot.supplierName}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                    lot.status === 'fp' || lot.status === 'ppc' ? 'bg-blue-100 text-blue-700' :
                    lot.status === 'received' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {lot.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{done}/{QC_CHECKPOINTS.length} QC checks</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Checkpoint dot indicators */}
                <div className="flex flex-wrap gap-1.5">
                  {QC_CHECKPOINTS.map(cp => (
                    <div
                      key={cp.id}
                      className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[lot.checkpoints[cp.id] || 'blocked']}`}
                      title={`${cp.label}: ${lot.checkpoints[cp.id] || 'blocked'}`}
                    />
                  ))}
                </div>

                {/* Ready actions badge */}
                {ready > 0 && (
                  <div className="mt-3 text-xs text-amber-600 font-medium">
                    {ready} action{ready !== 1 ? 's' : ''} needed
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ════════════════════════════════════════════════════════
  // RENDER: LOT DETAIL (sequential QC checklist)
  // ════════════════════════════════════════════════════════

  const renderLotDetail = () => {
    if (!selectedLot) return null
    const done = completedCount(selectedLot)

    return (
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setSelectedLot(null); setView('tracker') }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            aria-label="Back to lot tracker"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">Lot {selectedLot.lotNumber}</h2>
            <p className="text-sm text-gray-500">
              {selectedLot.supplierName ? `${selectedLot.supplierName} · ` : ''}
              Stage: <span className="capitalize font-medium">{selectedLot.status}</span> · {done}/{QC_CHECKPOINTS.length} checks complete
            </p>
          </div>
          <button
            onClick={() => setView('approval-dashboard')}
            className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
          >
            All Approvals
          </button>
        </div>

        {/* Sequential checklist */}
        <div className="space-y-1">
          {QC_CHECKPOINTS.map((cp, idx) => {
            const status = selectedLot.checkpoints[cp.id] || 'blocked'
            const isLast = idx === QC_CHECKPOINTS.length - 1

            return (
              <div key={cp.id} className="relative">
                {/* Vertical connector */}
                {!isLast && (
                  <div className={`absolute left-5 top-[3.25rem] w-0.5 h-5 ${
                    status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}

                <div className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                  status === 'ready'
                    ? 'bg-amber-50 border-amber-200 shadow-sm'
                    : status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-100'
                }`}>
                  {/* Circle indicator */}
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-base ${
                    status === 'completed' ? 'bg-green-500 text-white' :
                    status === 'ready'     ? 'bg-amber-500 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {status === 'completed' ? '✓' : cp.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{cp.label}</span>
                      <span className="text-xs text-gray-400">Step {cp.step}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_PILL[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{cp.description}</p>
                  </div>

                  {/* Action button */}
                  {status === 'ready' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCheckpointAction(cp, selectedLot) }}
                      className="flex-shrink-0 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      {cp.type === 'approval' ? 'Review' :
                       cp.type === 'scan'     ? 'Scan'   :
                       cp.type === 'label'    ? 'Generate' : 'Start'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // RENDER: SUB-VIEWS (approval, forms, scanners)
  // ════════════════════════════════════════════════════════

  const renderSubViewHeader = (title: string) => (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
      <button onClick={handleBack} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600" aria-label="Back">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <span className="font-medium text-gray-900">{title}</span>
      {selectedLot && <span className="text-sm text-gray-500">· Lot {selectedLot.lotNumber}</span>}
    </div>
  )

  const renderSubView = () => {
    switch (view) {
      case 'approval-dashboard':
        return (
          <ApprovalDashboard
            userRole={getUserRole()}
            userId={currentStaffId}
            onFormApproved={handleFormApproved}
            onFormRejected={handleFormRejected}
            onClose={handleBack}
          />
        )

      case 'sample-extraction':
        return (
          <>
            {renderSubViewHeader('Sample Extraction')}
            <SampleExtractionForm
              currentUser={currentUser}
              onSubmit={(data) => {
                console.log('Sample extraction submitted:', data)
                alert('Sample extracted successfully. Depuration monitoring is now available.')
                handleBack()
              }}
            />
          </>
        )

      case 'depuration-form':
        return (
          <>
            {renderSubViewHeader('Depuration Monitoring')}
            <DepurationForm
              currentUser={currentUser}
              onSubmit={(data) => {
                console.log('Depuration monitoring submitted:', data)
                alert('Depuration parameters recorded. Awaiting QC Lead approval.')
                handleBack()
              }}
            />
          </>
        )

      case 'rfid-scanner':
        return scanContext ? (
          <>
            {renderSubViewHeader('RFID Tag Scan')}
            <RFIDScanner
              lotId={String(scanContext.lot_id)}
              boxNumber={String(scanContext.box_number)}
              productType={String(scanContext.product_type)}
              grade={String(scanContext.grade)}
              weight={Number(scanContext.weight)}
              onRFIDLinked={(rfidData: RFIDTagData) => {
                alert(`RFID Tag ${rfidData.tag_id} linked to ${rfidData.box_number}`)
                handleBack()
              }}
              onClose={handleBack}
            />
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No box selected for RFID scanning.
            <button onClick={handleBack} className="ml-2 text-teal-600 underline">Back</button>
          </div>
        )

      case 'qr-generator':
        return scanContext ? (
          <>
            {renderSubViewHeader('QR Label Generation')}
            <QRLabelGenerator
              lotId={String(scanContext.lot_id)}
              boxNumber={String(scanContext.box_number)}
              productType={String(scanContext.product_type)}
              grade={String(scanContext.grade)}
              weight={Number(scanContext.weight)}
              rfidTagId={scanContext.rfid_tag_id ? String(scanContext.rfid_tag_id) : undefined}
              staffId={currentStaffId}
              onLabelGenerated={(labelData: QRLabelData) => {
                alert(`QR Label generated for ${labelData.box_number}`)
                handleBack()
              }}
              onClose={handleBack}
            />
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No box selected for label generation.
            <button onClick={handleBack} className="ml-2 text-teal-600 underline">Back</button>
          </div>
        )

      default:
        return null
    }
  }

  // ════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50">
      {view === 'tracker' && renderLotTracker()}
      {view === 'lot-detail' && renderLotDetail()}
      {!['tracker', 'lot-detail'].includes(view) && renderSubView()}
    </div>
  )
}

export default QCFlowDashboard
