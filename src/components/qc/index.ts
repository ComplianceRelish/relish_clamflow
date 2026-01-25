// src/components/qc/index.ts
// QC Workflow Components - Based on Figma Framework

export { default as QCFlowForm } from './QCFlowForm'
export { default as RFIDScanner } from './RFIDScanner'
export { default as QRLabelGenerator } from './QRLabelGenerator'
export { default as ApprovalDashboard } from './ApprovalDashboard'

// Re-export types
export type { 
  QCViewMode,
  WorkflowState,
  QCStaffOption,
  WeightNoteData,
  PPCFormData,
  FPFormData,
  DepurationFormData,
  RFIDTagData,
  QRLabelData,
  WorkflowStep,
  PendingApprovalItem,
  FormAction
} from '../../types/qc-workflow'
