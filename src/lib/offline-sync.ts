'use client';

/**
 * ClamFlow Offline Sync Service
 * 
 * Enterprise-grade offline-first architecture for PWA functionality.
 * Queues operations when offline, syncs when network is available.
 * 
 * Usage:
 * - Call queueOperation() when network request fails
 * - Service auto-syncs when online
 * - Check getPendingCount() for UI indicators
 */

import { OfflineOperation, SyncConflict } from '@/types/rfid';

const SYNC_STORAGE_KEY = 'clamflow_pending_sync';
const SYNC_INTERVAL = 30000; // 30 seconds

export interface SyncableOperation {
  id: string;
  type: 'staff_onboarding' | 'supplier_onboarding' | 'aadhar_verification' | 'face_registration' | 'weight_note' | 'form_submission';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  synced: boolean;
  syncError?: string;
  userId?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncAttempt: string | null;
  lastSuccessfulSync: string | null;
  isSyncing: boolean;
}

class OfflineSyncService {
  private pendingOperations: SyncableOperation[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastSyncAttempt: string | null = null;
  private lastSuccessfulSync: string | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.setupNetworkListeners();
      this.startAutoSync();
    }
  }

  // ============================================
  // STORAGE MANAGEMENT
  // ============================================

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(SYNC_STORAGE_KEY);
      if (stored) {
        this.pendingOperations = JSON.parse(stored);
        console.log(`[OfflineSync] Loaded ${this.pendingOperations.length} pending operations from storage`);
      }
    } catch (err) {
      console.error('[OfflineSync] Failed to load from storage:', err);
      this.pendingOperations = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(this.pendingOperations));
    } catch (err) {
      console.error('[OfflineSync] Failed to save to storage:', err);
    }
  }

  // ============================================
  // NETWORK DETECTION
  // ============================================

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('[OfflineSync] Network online - triggering sync');
      this.notifyListeners();
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineSync] Network offline');
      this.notifyListeners();
    });
  }

  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  // ============================================
  // QUEUE OPERATIONS
  // ============================================

  public queueOperation(
    type: SyncableOperation['type'],
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    data: Record<string, unknown>,
    userId?: string
  ): string {
    const operation: SyncableOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      endpoint,
      method,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      synced: false,
      userId
    };

    this.pendingOperations.push(operation);
    this.saveToStorage();
    this.notifyListeners();

    console.log(`[OfflineSync] Queued operation: ${type} -> ${endpoint}`);
    
    // If online, try to sync immediately
    if (this.isOnline()) {
      this.syncNow();
    }

    return operation.id;
  }

  // ============================================
  // SYNC OPERATIONS
  // ============================================

  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline() && this.pendingOperations.length > 0) {
        this.syncNow();
      }
    }, SYNC_INTERVAL);
  }

  public async syncNow(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (this.isSyncing || !this.isOnline()) {
      return { success: false, synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.lastSyncAttempt = new Date().toISOString();
    this.notifyListeners();

    let synced = 0;
    let failed = 0;

    const operationsToSync = this.pendingOperations.filter(op => !op.synced);

    for (const operation of operationsToSync) {
      try {
        const token = localStorage.getItem('clamflow_token');
        const response = await fetch(operation.endpoint, {
          method: operation.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(operation.data)
        });

        if (response.ok) {
          operation.synced = true;
          operation.syncError = undefined;
          synced++;
          console.log(`[OfflineSync] Synced: ${operation.type} (${operation.id})`);
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          operation.syncError = errorData.message || `HTTP ${response.status}`;
          operation.retryCount++;
          failed++;
          console.warn(`[OfflineSync] Failed: ${operation.type} - ${operation.syncError}`);
        }
      } catch (err: any) {
        operation.syncError = err.message || 'Network error';
        operation.retryCount++;
        failed++;
        console.error(`[OfflineSync] Error syncing ${operation.type}:`, err);
      }
    }

    // Remove synced operations
    this.pendingOperations = this.pendingOperations.filter(op => !op.synced);
    
    // Remove operations that exceeded max retries
    const expiredOps = this.pendingOperations.filter(op => op.retryCount >= op.maxRetries);
    if (expiredOps.length > 0) {
      console.warn(`[OfflineSync] Removing ${expiredOps.length} operations that exceeded max retries`);
      this.pendingOperations = this.pendingOperations.filter(op => op.retryCount < op.maxRetries);
    }

    this.saveToStorage();

    if (synced > 0) {
      this.lastSuccessfulSync = new Date().toISOString();
    }

    this.isSyncing = false;
    this.notifyListeners();

    return { success: failed === 0, synced, failed };
  }

  // ============================================
  // STATUS & QUERIES
  // ============================================

  public getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline(),
      pendingCount: this.pendingOperations.filter(op => !op.synced).length,
      lastSyncAttempt: this.lastSyncAttempt,
      lastSuccessfulSync: this.lastSuccessfulSync,
      isSyncing: this.isSyncing
    };
  }

  public getPendingCount(): number {
    return this.pendingOperations.filter(op => !op.synced).length;
  }

  public getPendingOperations(): SyncableOperation[] {
    return [...this.pendingOperations];
  }

  public getPendingByType(type: SyncableOperation['type']): SyncableOperation[] {
    return this.pendingOperations.filter(op => op.type === type && !op.synced);
  }

  public removeOperation(operationId: string): boolean {
    const index = this.pendingOperations.findIndex(op => op.id === operationId);
    if (index !== -1) {
      this.pendingOperations.splice(index, 1);
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public clearAll(): void {
    this.pendingOperations = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  // ============================================
  // LISTENERS
  // ============================================

  public subscribe(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(callback => callback(status));
  }

  // ============================================
  // CLEANUP
  // ============================================

  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const offlineSyncService = typeof window !== 'undefined' 
  ? new OfflineSyncService() 
  : null;

// Helper function for components
export function useOfflineSync() {
  return offlineSyncService;
}

// Register for background sync (if supported)
export async function registerBackgroundSync(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await (registration as any).sync.register('background-sync');
      console.log('[OfflineSync] Background sync registered');
      return true;
    }
  } catch (err) {
    console.warn('[OfflineSync] Background sync not supported:', err);
  }
  return false;
}
