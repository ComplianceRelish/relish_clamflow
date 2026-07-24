// src/types/compliance.ts

export type NCRStatus =
  | 'DRAFT_NCR'
  | 'CONFIRMED_NCR'
  | 'ACTION_DISPATCHED'
  | 'EVIDENCE_SUBMITTED'
  | 'RESOLVED'
  | 'OVERDUE'
  | 'BREACH'
  | 'CLARIFICATION';

export type NCRSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';

export interface NCRSummary {
  id: string;
  ncrNumber: string;
  status: NCRStatus;
  severity?: NCRSeverity;
  classifyDeadline: string;
  actionDeadline?: string;
  hoursRemaining?: number;
}

export interface ComplianceComment {
  id: string;
  recordType: string;
  recordId: string;
  commentText: string;
  eiaOfficerId: string;
  commentTime: string;
  status: string;
  createdAt: string;
  ncr?: NCRSummary;
}

export interface NCRRecord extends NCRSummary {
  commentId: string;
  sourceRecordType: string;
  sourceRecordId: string;
  description?: string;
  classifiedAt?: string;
  classifiedBy?: string;
  actionDispatchedAt?: string;
  assigneeId?: string;
  assigneeDueDate?: string;
  correctiveInstruction?: string;
  evidenceUrl?: string;
  evidenceSubmittedAt?: string;
  verifiedAt?: string;
  overdueEscalatedAt?: string;
  breachEscalatedAt?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: 'NCR' | 'OVERDUE' | 'BREACH' | 'RESOLVED';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}
