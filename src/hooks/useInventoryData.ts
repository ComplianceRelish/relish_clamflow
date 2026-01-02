// src/hooks/useInventoryData.ts
// Real-time Inventory & Shipments data hook with 45-second polling
'use client';

import { useState, useEffect, useCallback } from 'react';
import clamflowAPI from '@/lib/clamflow-api';
import { FinishedProduct, InventoryItem, TestResult, ReadyForShipment, PendingApproval } from '@/types/dashboard';

interface UseInventoryDataReturn {
  finishedProducts: FinishedProduct[];
  inventoryItems: InventoryItem[];
  testResults: TestResult[];
  readyForShipment: ReadyForShipment[];
  pendingApprovals: PendingApproval[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useInventoryData(): UseInventoryDataReturn {
  const [finishedProducts, setFinishedProducts] = useState<FinishedProduct[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [readyForShipment, setReadyForShipment] = useState<ReadyForShipment[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [
        finishedProductsRes,
        inventoryItemsRes,
        testResultsRes,
        readyForShipmentRes,
        pendingApprovalsRes,
      ] = await Promise.all([
        clamflowAPI.getFinishedProducts(),
        clamflowAPI.getInventoryItems(),
        clamflowAPI.getTestResults(),
        clamflowAPI.getReadyForShipment(),
        clamflowAPI.getPendingInventoryApprovals(),
      ]);

      // Handle finished products response
      if (finishedProductsRes.success && finishedProductsRes.data) {
        setFinishedProducts(finishedProductsRes.data);
      } else {
        console.warn('Failed to fetch finished products:', finishedProductsRes.error);
      }

      // Handle inventory items response
      if (inventoryItemsRes.success && inventoryItemsRes.data) {
        setInventoryItems(inventoryItemsRes.data);
      } else {
        console.warn('Failed to fetch inventory items:', inventoryItemsRes.error);
      }

      // Handle test results response
      if (testResultsRes.success && testResultsRes.data) {
        setTestResults(testResultsRes.data);
      } else {
        console.warn('Failed to fetch test results:', testResultsRes.error);
      }

      // Handle ready for shipment response
      if (readyForShipmentRes.success && readyForShipmentRes.data) {
        setReadyForShipment(readyForShipmentRes.data);
      } else {
        console.warn('Failed to fetch ready for shipment:', readyForShipmentRes.error);
      }

      // Handle pending approvals response
      if (pendingApprovalsRes.success && pendingApprovalsRes.data) {
        setPendingApprovals(pendingApprovalsRes.data);
      } else {
        console.warn('Failed to fetch pending approvals:', pendingApprovalsRes.error);
      }

      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inventory data';
      console.error('Inventory data fetch error:', err);
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Poll every 45 seconds for real-time updates
    const interval = setInterval(fetchData, 45000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    finishedProducts,
    inventoryItems,
    testResults,
    readyForShipment,
    pendingApprovals,
    loading,
    error,
    refetch: fetchData,
    lastUpdated,
  };
}
