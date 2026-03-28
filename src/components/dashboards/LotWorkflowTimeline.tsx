'use client';

import React, { useState } from 'react';
import { useWorkflow } from '@/hooks/useWorkflow';
import { WorkflowStep, WorkflowStepStatus, QCResult } from '@/types/dashboard';

interface LotWorkflowTimelineProps {
  lotId: string;
  userRole: string;
  onStepAction?: (action: string, stepNumber: number) => void;
}

const STATUS_STYLES: Record<WorkflowStepStatus, { bg: string; text: string; icon: string; border: string }> = {
  locked:      { bg: 'bg-gray-100',   text: 'text-gray-400',   icon: '🔒', border: 'border-gray-200' },
  pending:     { bg: 'bg-blue-50',    text: 'text-blue-700',   icon: '⏳', border: 'border-blue-200' },
  in_progress: { bg: 'bg-yellow-50',  text: 'text-yellow-800', icon: '🔄', border: 'border-yellow-300' },
  completed:   { bg: 'bg-green-50',   text: 'text-green-700',  icon: '✅', border: 'border-green-300' },
  skipped:     { bg: 'bg-gray-50',    text: 'text-gray-500',   icon: '⏭️', border: 'border-gray-200' },
  failed:      { bg: 'bg-red-50',     text: 'text-red-700',    icon: '❌', border: 'border-red-300' },
};

const QC_RESULT_STYLES: Record<QCResult, { bg: string; text: string }> = {
  pass:        { bg: 'bg-green-100', text: 'text-green-800' },
  fail:        { bg: 'bg-red-100',   text: 'text-red-800' },
  conditional: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
};

const LotWorkflowTimeline: React.FC<LotWorkflowTimelineProps> = ({ lotId, userRole, onStepAction }) => {
  const {
    workflow,
    loading,
    error,
    refetch,
    initialize,
    startStep,
    completeStep,
    failStep,
    retryStep,
    isStepUnlocked,
  } = useWorkflow(lotId);

  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [qcNotes, setQcNotes] = useState('');
  const [qcResult, setQcResult] = useState<QCResult | ''>('');
  const [showQcModal, setShowQcModal] = useState<number | null>(null);

  const handleAction = async (action: string, stepNumber: number) => {
    setActionLoading(stepNumber);
    try {
      switch (action) {
        case 'start':
          await startStep(stepNumber);
          break;
        case 'complete':
          const step = workflow?.steps.find(s => s.stepNumber === stepNumber);
          if (step?.stepType === 'qc_check') {
            setShowQcModal(stepNumber);
            setActionLoading(null);
            return;
          }
          await completeStep(stepNumber);
          break;
        case 'fail':
          setShowQcModal(stepNumber);
          setActionLoading(null);
          return;
        case 'retry':
          await retryStep(stepNumber);
          break;
      }
      onStepAction?.(action, stepNumber);
    } finally {
      setActionLoading(null);
    }
  };

  const handleQcSubmit = async (stepNumber: number, isFail: boolean) => {
    setActionLoading(stepNumber);
    try {
      if (isFail) {
        await failStep(stepNumber, qcNotes);
      } else {
        if (!qcResult) return;
        await completeStep(stepNumber, {
          qc_result: qcResult,
          qc_notes: qcNotes || undefined,
        });
      }
      setShowQcModal(null);
      setQcNotes('');
      setQcResult('');
      onStepAction?.(isFail ? 'fail' : 'complete', stepNumber);
    } finally {
      setActionLoading(null);
    }
  };

  const canPerformAction = (step: WorkflowStep, action: string): boolean => {
    const roleAllowsQC = ['Super Admin', 'Admin', 'QC Staff', 'QC Lead'].includes(userRole);
    const roleAllowsRetry = ['Super Admin', 'Admin', 'Production Lead', 'QC Lead'].includes(userRole);

    switch (action) {
      case 'start':
        return step.status === 'pending';
      case 'complete':
        return step.status === 'in_progress';
      case 'fail':
        return step.status === 'in_progress' && step.stepType === 'qc_check' && roleAllowsQC;
      case 'retry':
        return step.status === 'failed' && roleAllowsRetry;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading workflow...</span>
      </div>
    );
  }

  // Workflow not initialized — offer to initialize
  if (!workflow) {
    const canInit = ['Super Admin', 'Admin', 'Production Lead'].includes(userRole);
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Lot Workflow</h3>
        <p className="text-gray-600 mb-4">Workflow has not been initialized for this lot.</p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {canInit && (
          <button
            onClick={initialize}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Initialize Workflow (13 Steps)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Lot Workflow Timeline</h3>
          <p className="text-sm text-gray-500">
            Lot {workflow.lotNumber} — Step {workflow.currentStep} of {workflow.totalSteps} — {workflow.completedSteps} completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(workflow.completedSteps / workflow.totalSteps) * 100}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {Math.round((workflow.completedSteps / workflow.totalSteps) * 100)}%
          </span>
          <button
            onClick={refetch}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Steps timeline */}
      <div className="space-y-3">
        {workflow.steps.map((step, index) => {
          const style = STATUS_STYLES[step.status];
          const isLast = index === workflow.steps.length - 1;

          return (
            <div key={step.id || step.stepNumber} className="relative">
              {/* Connector line */}
              {!isLast && (
                <div className={`absolute left-5 top-12 w-0.5 h-6 ${
                  step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                }`}></div>
              )}

              <div className={`flex items-start gap-4 p-3 rounded-lg border ${style.bg} ${style.border}`}>
                {/* Step number circle */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.status === 'completed' ? 'bg-green-200 text-green-800' :
                  step.status === 'in_progress' ? 'bg-yellow-200 text-yellow-800' :
                  step.status === 'failed' ? 'bg-red-200 text-red-800' :
                  step.status === 'pending' ? 'bg-blue-200 text-blue-800' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {step.stepNumber}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{style.icon}</span>
                    <h4 className={`font-medium ${style.text}`}>{step.stepName}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                      {step.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">({step.stepType.replace('_', ' ')})</span>
                  </div>

                  {/* QC result badge */}
                  {step.qcResult && (
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      QC_RESULT_STYLES[step.qcResult].bg
                    } ${QC_RESULT_STYLES[step.qcResult].text}`}>
                      QC: {step.qcResult.toUpperCase()}
                    </span>
                  )}

                  {step.qcNotes && (
                    <p className="text-xs text-gray-500 mt-1">Notes: {step.qcNotes}</p>
                  )}

                  {/* Timestamps */}
                  <div className="flex gap-4 mt-1 text-xs text-gray-400">
                    {step.startedAt && <span>Started: {new Date(step.startedAt).toLocaleString()}</span>}
                    {step.completedAt && <span>Completed: {new Date(step.completedAt).toLocaleString()}</span>}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex-shrink-0 flex gap-2">
                  {canPerformAction(step, 'start') && (
                    <button
                      onClick={() => handleAction('start', step.stepNumber)}
                      disabled={actionLoading === step.stepNumber}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actionLoading === step.stepNumber ? '...' : 'Start'}
                    </button>
                  )}
                  {canPerformAction(step, 'complete') && (
                    <button
                      onClick={() => handleAction('complete', step.stepNumber)}
                      disabled={actionLoading === step.stepNumber}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === step.stepNumber ? '...' : 'Complete'}
                    </button>
                  )}
                  {canPerformAction(step, 'fail') && (
                    <button
                      onClick={() => handleAction('fail', step.stepNumber)}
                      disabled={actionLoading === step.stepNumber}
                      className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Fail
                    </button>
                  )}
                  {canPerformAction(step, 'retry') && (
                    <button
                      onClick={() => handleAction('retry', step.stepNumber)}
                      disabled={actionLoading === step.stepNumber}
                      className="px-3 py-1.5 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                    >
                      {actionLoading === step.stepNumber ? '...' : 'Retry'}
                    </button>
                  )}
                  {step.status === 'locked' && (
                    <span className="text-xs text-gray-400 italic">Locked</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QC Modal */}
      {showQcModal !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {workflow.steps.find(s => s.stepNumber === showQcModal)?.stepName} — QC Assessment
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QC Result</label>
                <select
                  value={qcResult}
                  onChange={(e) => setQcResult(e.target.value as QCResult)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select result...</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="conditional">Conditional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QC Notes</label>
                <textarea
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter QC notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowQcModal(null); setQcNotes(''); setQcResult(''); }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              {qcResult === 'fail' ? (
                <button
                  onClick={() => handleQcSubmit(showQcModal, true)}
                  disabled={!qcNotes || actionLoading === showQcModal}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === showQcModal ? 'Submitting...' : 'Fail Step'}
                </button>
              ) : (
                <button
                  onClick={() => handleQcSubmit(showQcModal, false)}
                  disabled={!qcResult || actionLoading === showQcModal}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading === showQcModal ? 'Submitting...' : 'Complete Step'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotWorkflowTimeline;
