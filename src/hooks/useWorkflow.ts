// src/hooks/useWorkflow.ts
// Hook for lot workflow enforcement — 13-step sequential workflow
'use client';

import { useState, useEffect, useCallback } from 'react';
import clamflowAPI from '@/lib/clamflow-api';
import { WorkflowStatus, WorkflowStep, WorkflowCompleteResponse } from '@/types/dashboard';

interface UseWorkflowReturn {
  workflow: WorkflowStatus | null;
  loading: boolean;
  error: string | null;
  /** Reload workflow status from API */
  refetch: () => Promise<void>;
  /** Initialize workflow for a lot */
  initialize: () => Promise<boolean>;
  /** Start a specific step */
  startStep: (stepNumber: number) => Promise<WorkflowStep | null>;
  /** Complete a specific step (with optional QC data) */
  completeStep: (
    stepNumber: number,
    data?: { qc_result?: string; qc_notes?: string; reference_type?: string; reference_id?: string }
  ) => Promise<WorkflowCompleteResponse | null>;
  /** Fail a QC step with notes */
  failStep: (stepNumber: number, qcNotes: string) => Promise<WorkflowStep | null>;
  /** Retry a failed step */
  retryStep: (stepNumber: number) => Promise<WorkflowStep | null>;
  /** Check if a step prerequisite is met */
  isStepUnlocked: (stepNumber: number) => boolean;
}

export function useWorkflow(lotId: string | null): UseWorkflowReturn {
  const [workflow, setWorkflow] = useState<WorkflowStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!lotId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await clamflowAPI.getWorkflowStatus(lotId);
      if (res.success && res.data) {
        setWorkflow(res.data);
      } else {
        // 404 means workflow not initialized yet — not an error per se
        if (res.error?.includes('404') || res.error?.includes('not initialized')) {
          setWorkflow(null);
        } else {
          setError(res.error || 'Failed to fetch workflow status');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflow status');
    } finally {
      setLoading(false);
    }
  }, [lotId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const initialize = useCallback(async (): Promise<boolean> => {
    if (!lotId) return false;
    setError(null);
    try {
      const res = await clamflowAPI.initializeWorkflow(lotId);
      if (res.success && res.data) {
        setWorkflow(res.data);
        return true;
      } else {
        setError(res.error || 'Failed to initialize workflow');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize workflow');
      return false;
    }
  }, [lotId]);

  const startStep = useCallback(async (stepNumber: number): Promise<WorkflowStep | null> => {
    if (!lotId) return null;
    setError(null);
    try {
      const res = await clamflowAPI.startWorkflowStep(lotId, stepNumber);
      if (res.success && res.data) {
        await fetchStatus(); // Refresh full status
        return res.data;
      } else {
        setError(res.error || 'Failed to start step');
        return null;
      }
    } catch (err: any) {
      if (err.status === 403) {
        setError('Complete prior steps first.');
      } else {
        setError(err.message || 'Failed to start step');
      }
      return null;
    }
  }, [lotId, fetchStatus]);

  const completeStep = useCallback(async (
    stepNumber: number,
    data?: { qc_result?: string; qc_notes?: string; reference_type?: string; reference_id?: string }
  ): Promise<WorkflowCompleteResponse | null> => {
    if (!lotId) return null;
    setError(null);
    try {
      const res = await clamflowAPI.completeWorkflowStep(lotId, stepNumber, data);
      if (res.success && res.data) {
        await fetchStatus(); // Refresh full status
        return res.data;
      } else {
        setError(res.error || 'Failed to complete step');
        return null;
      }
    } catch (err: any) {
      if (err.status === 403) {
        setError('This step is locked. Complete prior steps first.');
      } else if (err.status === 422) {
        setError('QC result is required for this step.');
      } else {
        setError(err.message || 'Failed to complete step');
      }
      return null;
    }
  }, [lotId, fetchStatus]);

  const failStep = useCallback(async (stepNumber: number, qcNotes: string): Promise<WorkflowStep | null> => {
    if (!lotId) return null;
    setError(null);
    try {
      const res = await clamflowAPI.failWorkflowStep(lotId, stepNumber, qcNotes);
      if (res.success && res.data) {
        await fetchStatus();
        return res.data;
      } else {
        setError(res.error || 'Failed to fail step');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fail step');
      return null;
    }
  }, [lotId, fetchStatus]);

  const retryStep = useCallback(async (stepNumber: number): Promise<WorkflowStep | null> => {
    if (!lotId) return null;
    setError(null);
    try {
      const res = await clamflowAPI.retryWorkflowStep(lotId, stepNumber);
      if (res.success && res.data) {
        await fetchStatus();
        return res.data;
      } else {
        setError(res.error || 'Failed to retry step');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retry step');
      return null;
    }
  }, [lotId, fetchStatus]);

  const isStepUnlocked = useCallback((stepNumber: number): boolean => {
    if (!workflow) return false;
    const step = workflow.steps.find(s => s.stepNumber === stepNumber);
    return step ? step.status !== 'locked' : false;
  }, [workflow]);

  return {
    workflow,
    loading,
    error,
    refetch: fetchStatus,
    initialize,
    startStep,
    completeStep,
    failStep,
    retryStep,
    isStepUnlocked,
  };
}
