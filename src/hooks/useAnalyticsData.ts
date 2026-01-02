// src/hooks/useAnalyticsData.ts
// Real-time Production Analytics data hook with 60-second polling
'use client';

import { useState, useEffect, useCallback } from 'react';
import clamflowAPI from '@/lib/clamflow-api';
import { ThroughputData, StationEfficiency, QualityMetrics, ProcessingTime } from '@/types/dashboard';

interface UseAnalyticsDataReturn {
  throughput: ThroughputData | null;
  efficiency: StationEfficiency[];
  quality: QualityMetrics | null;
  processingTimes: ProcessingTime[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useAnalyticsData(): UseAnalyticsDataReturn {
  const [throughput, setThroughput] = useState<ThroughputData | null>(null);
  const [efficiency, setEfficiency] = useState<StationEfficiency[]>([]);
  const [quality, setQuality] = useState<QualityMetrics | null>(null);
  const [processingTimes, setProcessingTimes] = useState<ProcessingTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [throughputRes, efficiencyRes, qualityRes, processingTimesRes] = await Promise.all([
        clamflowAPI.getProductionThroughput(),
        clamflowAPI.getEfficiencyMetrics(),
        clamflowAPI.getQualityMetrics(),
        clamflowAPI.getProcessingTimes(),
      ]);

      // Handle throughput response
      if (throughputRes.success && throughputRes.data) {
        setThroughput(throughputRes.data);
      } else {
        console.warn('Failed to fetch throughput:', throughputRes.error);
      }

      // Handle efficiency response
      if (efficiencyRes.success && efficiencyRes.data) {
        setEfficiency(efficiencyRes.data);
      } else {
        console.warn('Failed to fetch efficiency:', efficiencyRes.error);
      }

      // Handle quality response
      if (qualityRes.success && qualityRes.data) {
        setQuality(qualityRes.data);
      } else {
        console.warn('Failed to fetch quality metrics:', qualityRes.error);
      }

      // Handle processing times response
      if (processingTimesRes.success && processingTimesRes.data) {
        setProcessingTimes(processingTimesRes.data);
      } else {
        console.warn('Failed to fetch processing times:', processingTimesRes.error);
      }

      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      console.error('Analytics data fetch error:', err);
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Poll every 60 seconds for real-time updates
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    throughput,
    efficiency,
    quality,
    processingTimes,
    loading,
    error,
    refetch: fetchData,
    lastUpdated,
  };
}
