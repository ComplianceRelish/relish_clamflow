// src/components/integrations/RFIDHardwareManager.tsx - Fixed & Production-Ready Version
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { CheckCircle, Wifi, WifiOff, Clock, Package, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext'; // <-- Use this!
import type { RFIDReader, RFIDScanResult, BatchScanOperation } from '@/types/rfid';

// Define permission types
type Permission = 'RFID_READ' | 'RFID_SCAN' | 'RFID_BATCH_SCAN' | 'RFID_CONTINUOUS_SCAN';

interface RFIDHardwareManagerProps {
  mode: 'attendance' | 'gate' | 'inventory' | 'multi';
  onScanResult?: (result: RFIDScanResult) => void;
  onBatchComplete?: (results: RFIDScanResult[]) => void;
}

interface RFIDEventData {
  type: string;
  tagId?: string;
  readerId?: string;
  timestamp?: string;
  rssi?: number;
  location?: string;
  data?: Record<string, unknown>;
  results?: RFIDScanResult[];
}

// Define ApiResponse interface with proper typing
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const RFIDHardwareManager: React.FC<RFIDHardwareManagerProps> = ({
  mode,
  onScanResult,
  onBatchComplete
}) => {
  const { user, hasPermission } = useAuth();
  const [readers, setReaders] = useState<RFIDReader[]>([]);
  const [activeReaders, setActiveReaders] = useState<Set<string>>(new Set());
  const [scanResults, setScanResults] = useState<RFIDScanResult[]>([]);
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [scanInterval, setScanInterval] = useState<number>(1000); // ms
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Type guard for hasPermission - handles case where hasPermission might not exist
  const checkPermission = useCallback((permission: Permission): boolean => {
    if (typeof hasPermission === 'function') {
      return hasPermission(permission);
    }
    // Fallback for basic access if hasPermission is not available
    return permission === 'RFID_READ';
  }, [hasPermission]);

  // Handle RFID Event - moved before usage
  const handleRFIDEvent = useCallback((event: RFIDEventData) => {
    switch (event.type) {
      case 'SCAN_RESULT':
        if (event.tagId && event.readerId && event.timestamp) {
          // ✅ FIXED: Proper object property syntax
          const scanResult: RFIDScanResult = {
            tagId: event.tagId,
            readerId: event.readerId,
            timestamp: event.timestamp,
            rssi: event.rssi || 0,
            location: event.location || '',
            data: event.data ?? undefined // ✅ FIXED: Proper data assignment
          };
          
          setScanResults(prev => [scanResult, ...prev.slice(0, 99)]);
          onScanResult?.(scanResult);
        }
        break;
        
      case 'READER_OFFLINE':
        if (event.readerId) {
          setActiveReaders(prev => {
            const newSet = new Set(prev);
            newSet.delete(event.readerId!);
            return newSet;
          });
          
          toast({
            title: "Reader Offline",
            description: `RFID Reader ${event.readerId} disconnected`,
            variant: "destructive",
          });
        }
        break;
        
      case 'READER_ONLINE':
        if (event.readerId) {
          setActiveReaders(prev => new Set([...prev, event.readerId!]));
          
          toast({
            title: "Reader Online",
            description: `RFID Reader ${event.readerId} connected`,
          });
        }
        break;
        
      case 'BATCH_COMPLETE':
        setIsBatchScanning(false);
        if (event.results) {
          onBatchComplete?.(event.results);
          
          toast({
            title: "Batch Scan Complete",
            description: `Scanned ${event.results.length} tags`,
          });
        }
        break;
    }
  }, [onScanResult, onBatchComplete, toast]);

  // Initialize RFID hardware system
  const initializeRFIDReaders = useCallback(async () => {
    if (!checkPermission('RFID_READ')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access RFID hardware",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiClient.get<ApiResponse<{ readers?: RFIDReader[] }>>('/rfid/readers');
      const readersData = response.data?.data?.readers || [];
      
      setReaders(readersData);
      
      // Test connection to each reader
      const readerTests = await Promise.allSettled(
        readersData.map((reader: RFIDReader) => 
          apiClient.post<ApiResponse<{ connected?: boolean }>>('/rfid/test-connection', { readerId: reader.id })
        )
      );
      
      const onlineReaderIds = new Set<string>();
      readerTests.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.data?.data?.connected) {
            onlineReaderIds.add(readersData[index].id);
          }
        }
      });
      
      setActiveReaders(onlineReaderIds);
      
      toast({
        title: "RFID System Initialized",
        description: `${onlineReaderIds.size}/${readersData.length} readers online`,
      });
    } catch (error) {
      console.error('RFID initialization failed:', error);
      toast({
        title: "RFID Connection Failed",
        description: "Unable to connect to RFID hardware",
        variant: "destructive",
      });
    }
  }, [checkPermission, toast]);

  const connectRFIDWebSocket = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, '');
    if (!apiUrl) {
      console.error('NEXT_PUBLIC_API_URL is not defined');
      return;
    }

    const wsUrl = `wss://${apiUrl}/ws/rfid`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('RFID WebSocket connected');
    };
    
    wsRef.current.onmessage = (event) => {
      let parsedData: RFIDEventData;
      try {
        parsedData = JSON.parse(event.data);
        handleRFIDEvent(parsedData);
      } catch (err) {
        console.error('Failed to parse RFID event:', err);
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('RFID WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('RFID WebSocket closed, reconnecting...');
      setTimeout(connectRFIDWebSocket, 5000);
    };
  }, [handleRFIDEvent]);

  useEffect(() => {
    initializeRFIDReaders();
    connectRFIDWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [initializeRFIDReaders, connectRFIDWebSocket]);

  const startSingleScan = async (readerId: string) => {
    if (!checkPermission('RFID_SCAN')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to perform RFID scans",
        variant: "destructive",
      });
      return;
    }

    if (!activeReaders.has(readerId)) {
      toast({
        title: "Reader Offline",
        description: "Selected RFID reader is not connected",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiClient.post('/rfid/start-scan', {
        readerId,
        mode: 'single',
        timeout: 5000,
        userId: user?.id
      });
      
      toast({
        title: "Scanning Started",
        description: "Place RFID tag near reader",
      });
    } catch (error) {
      console.error('Single scan failed:', error);
      toast({
        title: "Scan Failed",
        description: "Unable to start RFID scan",
        variant: "destructive",
      });
    }
  };

  const startBatchScan = async () => {
    if (!checkPermission('RFID_BATCH_SCAN')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to perform batch scans",
        variant: "destructive",
      });
      return;
    }

    const onlineReaders = readers.filter(r => activeReaders.has(r.id));
    
    if (onlineReaders.length === 0) {
      toast({
        title: "No Readers Available",
        description: "No RFID readers are currently online",
        variant: "destructive",
      });
      return;
    }

    setIsBatchScanning(true);
    
    try {
      // ✅ FIXED: Create proper batch operation object
      const batchOperation: Omit<BatchScanOperation, 'userId'> & { userId?: string } = {
        readerIds: onlineReaders.map(r => r.id),
        duration: 30000, // 30 seconds
        mode: mode === 'inventory' ? 'inventory' : 'attendance',
        filters: {
          rssiThreshold: -70,
          duplicateWindow: 2000 // 2 seconds
        },
        ...(user?.id && { userId: user.id })
      };
      
      await apiClient.post('/rfid/start-batch-scan', batchOperation);
      
      toast({
        title: "Batch Scan Started",
        description: `Scanning with ${onlineReaders.length} readers for 30 seconds`,
      });
    } catch (error) {
      console.error('Batch scan failed:', error);
      setIsBatchScanning(false);
      
      toast({
        title: "Batch Scan Failed",
        description: "Unable to start batch scanning",
        variant: "destructive",
      });
    }
  };

  const stopBatchScan = async () => {
    try {
      await apiClient.post('/rfid/stop-batch-scan', {
        userId: user?.id
      });
      setIsBatchScanning(false);
      
      toast({
        title: "Batch Scan Stopped",
        description: "Scanning operation terminated",
      });
    } catch (error) {
      console.error('Stop batch scan failed:', error);
    }
  };

  const startContinuousScanning = () => {
    if (!checkPermission('RFID_CONTINUOUS_SCAN')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission for continuous scanning",
        variant: "destructive",
      });
      return;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    scanIntervalRef.current = setInterval(() => {
      activeReaders.forEach(readerId => {
        apiClient.post('/rfid/quick-scan', { 
          readerId,
          userId: user?.id
        }).catch(console.error);
      });
    }, scanInterval);
    
    toast({
      title: "Continuous Scanning Started",
      description: `Polling every ${scanInterval}ms`,
    });
  };

  const stopContinuousScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    toast({
      title: "Continuous Scanning Stopped",
      description: "Reader polling disabled",
    });
  };

  const getReaderIcon = (location: string) => {
    switch (location) {
      case 'entrance':
      case 'exit':
        return <Shield className="h-4 w-4" />;
      case 'attendance':
        return <Users className="h-4 w-4" />;
      case 'inventory':
        return <Package className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  // If user doesn't have basic RFID access, show access denied
  if (!checkPermission('RFID_READ')) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Access Denied</h3>
          <p className="text-gray-600">
            You don't have permission to access RFID hardware management.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reader Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {readers.map((reader) => (
          <Card key={reader.id} className="relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {getReaderIcon(reader.location)}
                {reader.name}
                <Badge variant={activeReaders.has(reader.id) ? "default" : "destructive"}>
                  {activeReaders.has(reader.id) ? (
                    <>
                      <Wifi className="h-3 w-3 mr-1" /> Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 mr-1" /> Offline
                    </>
                  )}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>Location: {reader.location}</div>
                <div>IP: {reader.ip_address}</div>
                <div>Range: {reader.read_range || 'N/A'}m</div>
                <Button
                  size="sm"
                  onClick={() => startSingleScan(reader.id)}
                  disabled={!activeReaders.has(reader.id) || !checkPermission('RFID_SCAN')}
                  className="w-full"
                >
                  Single Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Batch Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Batch Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Scan Interval (ms)</label>
              <Input
                type="number"
                value={scanInterval}
                onChange={(e) => setScanInterval(Number(e.target.value))}
                min={100}
                max={10000}
                step={100}
                disabled={!checkPermission('RFID_BATCH_SCAN')}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={startBatchScan}
                disabled={isBatchScanning || activeReaders.size === 0 || !checkPermission('RFID_BATCH_SCAN')}
              >
                {isBatchScanning ? "Scanning..." : "Start Batch Scan"}
              </Button>
              
              {isBatchScanning && (
                <Button variant="destructive" onClick={stopBatchScan}>
                  Stop Scan
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={startContinuousScanning}
              disabled={!!scanIntervalRef.current || !checkPermission('RFID_CONTINUOUS_SCAN')}
            >
              Start Continuous
            </Button>
            
            <Button
              variant="outline"
              onClick={stopContinuousScanning}
              disabled={!scanIntervalRef.current}
            >
              Stop Continuous
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Scan Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Scan Results ({scanResults.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {scanResults.map((result, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Tag: {result.tagId}</div>
                  <div className="text-xs text-gray-500">
                    Reader: {readers.find(r => r.id === result.readerId)?.name} | 
                    RSSI: {result.rssi}dBm | 
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {scanResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No scan results yet. Start scanning to see results here.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RFIDHardwareManager;