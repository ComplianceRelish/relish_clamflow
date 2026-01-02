// src/hooks/useSecurityData.ts
// Real-time Security & Surveillance data hook with 15-second polling
'use client';

import { useState, useEffect, useCallback } from 'react';
import clamflowAPI from '@/lib/clamflow-api';
import { Camera, FaceDetectionEvent, SecurityEvent } from '@/types/dashboard';

interface UseSecurityDataReturn {
  cameras: Camera[];
  faceDetectionEvents: FaceDetectionEvent[];
  securityEvents: SecurityEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useSecurityData(): UseSecurityDataReturn {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [faceDetectionEvents, setFaceDetectionEvents] = useState<FaceDetectionEvent[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [camerasRes, faceDetectionRes, securityEventsRes] = await Promise.all([
        clamflowAPI.getSecurityCameras(),
        clamflowAPI.getFaceDetectionEvents(),
        clamflowAPI.getSecurityEvents(),
      ]);

      // Handle cameras response
      if (camerasRes.success && camerasRes.data) {
        setCameras(camerasRes.data);
      } else {
        console.warn('Failed to fetch cameras:', camerasRes.error);
      }

      // Handle face detection events response
      if (faceDetectionRes.success && faceDetectionRes.data) {
        setFaceDetectionEvents(faceDetectionRes.data);
      } else {
        console.warn('Failed to fetch face detection events:', faceDetectionRes.error);
      }

      // Handle security events response
      if (securityEventsRes.success && securityEventsRes.data) {
        setSecurityEvents(securityEventsRes.data);
      } else {
        console.warn('Failed to fetch security events:', securityEventsRes.error);
      }

      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load security data';
      console.error('Security data fetch error:', err);
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Poll every 15 seconds for real-time updates
    const interval = setInterval(fetchData, 15000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    cameras,
    faceDetectionEvents,
    securityEvents,
    loading,
    error,
    refetch: fetchData,
    lastUpdated,
  };
}
