// src/hooks/useGateData.ts
// Real-time Gate & Vehicle Management data hook with 30-second polling
'use client';

import { useState, useEffect, useCallback } from 'react';
import clamflowAPI from '@/lib/clamflow-api';
import { VehicleLog, ActiveDelivery, SupplierHistory } from '@/types/dashboard';

interface UseGateDataReturn {
  vehicles: VehicleLog[];
  activeDeliveries: ActiveDelivery[];
  suppliers: SupplierHistory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useGateData(): UseGateDataReturn {
  const [vehicles, setVehicles] = useState<VehicleLog[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [vehiclesRes, activeRes, suppliersRes] = await Promise.all([
        clamflowAPI.getVehicles(),
        clamflowAPI.getActiveVehicles(),
        clamflowAPI.getSuppliers(),
      ]);

      // Handle vehicles response
      if (vehiclesRes.success && vehiclesRes.data) {
        setVehicles(vehiclesRes.data);
      } else {
        console.warn('Failed to fetch vehicles:', vehiclesRes.error);
      }

      // Handle active deliveries response
      if (activeRes.success && activeRes.data) {
        setActiveDeliveries(activeRes.data);
      } else {
        console.warn('Failed to fetch active deliveries:', activeRes.error);
      }

      // Handle suppliers response
      if (suppliersRes.success && suppliersRes.data) {
        setSuppliers(suppliersRes.data);
      } else {
        console.warn('Failed to fetch suppliers:', suppliersRes.error);
      }

      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load gate data';
      console.error('Gate data fetch error:', err);
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    vehicles,
    activeDeliveries,
    suppliers,
    loading,
    error,
    refetch: fetchData,
    lastUpdated,
  };
}
