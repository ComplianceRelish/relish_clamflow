// src/hooks/useOperationsData.ts
// Real-time Operations Monitor data hook with 10-second polling
'use client';

import { useState, useEffect, useCallback } from 'react';
import clamflowAPI from '@/lib/clamflow-api';
import { StationStatus, ActiveLot, Bottleneck } from '@/types/dashboard';

interface UseOperationsDataReturn {
  stations: StationStatus[];
  activeLots: ActiveLot[];
  bottlenecks: Bottleneck[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useOperationsData(): UseOperationsDataReturn {
  const [stations, setStations] = useState<StationStatus[]>([]);
  const [activeLots, setActiveLots] = useState<ActiveLot[]>([]);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [stationsRes, lotsRes, bottlenecksRes] = await Promise.all([
        clamflowAPI.getStations(),
        clamflowAPI.getActiveLots(),
        clamflowAPI.getBottlenecks(),
      ]);

      // Handle stations response - ensure array
      if (stationsRes.success && stationsRes.data) {
        const data = Array.isArray(stationsRes.data) ? stationsRes.data : [];
        setStations(data);
      } else {
        console.warn('Failed to fetch stations:', stationsRes.error);
        setStations([]);
      }

      // Handle active lots response - ensure array
      if (lotsRes.success && lotsRes.data) {
        const data = Array.isArray(lotsRes.data) ? lotsRes.data : [];
        setActiveLots(data);
      } else {
        console.warn('Failed to fetch active lots:', lotsRes.error);
        setActiveLots([]);
      }

      // Handle bottlenecks response - ensure array
      if (bottlenecksRes.success && bottlenecksRes.data) {
        const data = Array.isArray(bottlenecksRes.data) ? bottlenecksRes.data : [];
        setBottlenecks(data);
      } else {
        console.warn('Failed to fetch bottlenecks:', bottlenecksRes.error);
        setBottlenecks([]);
      }

      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load operations data';
      console.error('Operations data fetch error:', err);
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    stations,
    activeLots,
    bottlenecks,
    loading,
    error,
    refetch: fetchData,
    lastUpdated,
  };
}
