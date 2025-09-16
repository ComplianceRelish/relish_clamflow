// src/components/integrations/RFIDHardwareManager.tsx - Corrected & Working Version
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { AlertCircle, CheckCircle, Wifi, WifiOff, Clock, Package, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import type { RFIDReader, RFIDScanResult, BatchScanOperation } from '@/types';

interface RFIDHardwareManagerProps {
  mode: 'attendance' | 'gate' | 'inventory' | 'multi';
  onScanResult?: (result: RFIDScanResult) => void;
  onBatchComplete?: (results: RFIDScanResult[]) => void;
}

const RFIDHardwareManager: React.FC<RFIDHardwareManagerProps> = ({
  mode,
  onScanResult,
  onBatchComplete
}) => {
  const [readers, setReaders] = useState<RFIDReader[]>([]);
  const [activeReaders, setActiveReaders] = useState<Set<string>>(new Set());
  const [scanResults, setScanResults] = useState<RFIDScanResult[]>([]);
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [selectedReader, setSelectedReader] = useState<string>('');
  const [scanInterval, setScanInterval] = useState<number>(1000); // ms
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize RFID hardware system
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
  }, []);

  const initializeRFIDReaders = async () => {
    try {
      const response = await apiClient.get('/rfid/readers');
      const readersData = response.data.readers;
      
      setReaders(readersData);
      
      // Test connection to each reader
      const readerTests = await Promise.allSettled(
        readersData.map((reader: RFIDReader) => 
          apiClient.post(`/rfid/test-connection`, { readerId: reader.id })
        )
      );
      
      const onlineReaderIds = new Set<string>();
      readerTests.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data.connected) {
          onlineReaderIds.add(readersData[index].id);
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
  };

  const connectRFIDWebSocket = () => {
    const wsUrl = `wss://${process.env.NEXT_PUBLIC_API_URL?.replace('https://', '')}/ws/rfid`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('RFID WebSocket connected');
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRFIDEvent(data);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('RFID WebSocket error:', error);
    };
  };

  const handleRFIDEvent = (event: any) => {
    switch (event.type) {
      case 'SCAN_RESULT':
        const scanResult: RFIDScanResult = {
          tagId: event.tagId,
          readerId: event.readerId,
          timestamp: event.timestamp,
          rssi: event.rssi,
          location: event.location,
          data: event.data
        };
        
        setScanResults(prev => [scanResult, ...prev.slice(0, 99)]);
        onScanResult?.(scanResult);
        break;
        
      case 'READER_OFFLINE':
        setActiveReaders(prev => {
          const newSet = new Set(prev);
          newSet.delete(event.readerId);
          return newSet;
        });
        
        toast({
          title: "Reader Offline",
          description: `RFID Reader ${event.readerId} disconnected`,
          variant: "destructive",
        });
        break;
        
      case 'READER_ONLINE':
        setActiveReaders(prev => new Set([...prev, event.readerId]));
        
        toast({
          title: "Reader Online",
          description: `RFID Reader ${event.readerId} connected`,
        });
        break;
        
      case 'BATCH_COMPLETE':
        setIsBatchScanning(false);
        onBatchComplete?.(event.results);
        
        toast({
          title: "Batch Scan Complete",
          description: `Scanned ${event.results.length} tags`,
        });
        break;
    }
  };

  const startSingleScan = async (readerId: string) => {
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
        timeout: 5000
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
      const batchOperation: BatchScanOperation = {
        readerIds: onlineReaders.map(r => r.id),
        duration: 30000, // 30 seconds
        mode: mode === 'inventory' ? 'inventory' : 'attendance',
        filters: {
          rssiThreshold: -70,
          duplicateWindow: 2000 // 2 seconds
        }
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
      await apiClient.post('/rfid/stop-batch-scan');
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
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    scanIntervalRef.current = setInterval(() => {
      activeReaders.forEach(readerId => {
        apiClient.post('/rfid/quick-scan', { readerId }).catch(console.error);
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
                  disabled={!activeReaders.has(reader.id)}
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
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={startBatchScan}
                disabled={isBatchScanning || activeReaders.size === 0}
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
              disabled={!!scanIntervalRef.current}
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