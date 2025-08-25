// src/components/integrations/ClamFlowSecure.tsx - CORRECTED VERSION
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Fingerprint, Eye, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import type { BiometricAuthRequest, BiometricAuthResponse, SecurityEvent } from '@/types';

interface ClamFlowSecureProps {
  mode: 'authentication' | 'enrollment' | 'monitoring';
  onAuthSuccess?: (userId: string, method: string) => void;
  onAuthFailure?: (reason: string) => void;
}

const ClamFlowSecure: React.FC<ClamFlowSecureProps> = ({ 
  mode, 
  onAuthSuccess, 
  onAuthFailure 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [biometricDevices, setBiometricDevices] = useState<any[]>([]);
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize ClamFlowSecure connection
  useEffect(() => {
    initializeBiometricSystem();
    connectSecurityWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const initializeBiometricSystem = async () => {
    try {
      // Connect to biometric hardware
      const response = await apiClient.post('/secure/initialize', {
        devices: ['fingerprint', 'facial', 'iris'],
        location: { latitude: 0, longitude: 0 } // Fixed location type
      });
      
      setBiometricDevices(response.data.devices);
      setIsConnected(true);
      
      toast({
        title: "ClamFlowSecure Connected",
        description: `${response.data.devices.length} biometric devices online`,
      });
    } catch (error) {
      console.error('Biometric system initialization failed:', error);
      setIsConnected(false);
      toast({
        title: "Connection Failed",
        description: "Unable to connect to biometric hardware",
        variant: "destructive",
      });
    }
  };

  const connectSecurityWebSocket = () => {
    const wsUrl = `wss://${process.env.NEXT_PUBLIC_API_URL?.replace('https://', '')}/ws/security`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('Security WebSocket connected');
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleSecurityEvent(data);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('Security WebSocket error:', error);
    };
  };

  const handleSecurityEvent = (event: SecurityEvent) => {
    setSecurityEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
    
    // Handle different event types
    switch (event.type) {
      case 'AUTH_SUCCESS':
        setCurrentUser(event.user_id); // Fixed property name
        onAuthSuccess?.(event.user_id, event.method); // Fixed property name
        break;
      case 'AUTH_FAILURE':
        onAuthFailure?.(event.reason || 'Authentication failed'); // Fixed property access
        break;
      case 'UNAUTHORIZED_ACCESS':
        toast({
          title: "Security Alert",
          description: event.message, // This now exists in the type
          variant: "destructive",
        });
        break;
    }
  };

  const startBiometricScan = async (method: 'fingerprint' | 'facial' | 'iris') => {
    if (!isConnected) {
      toast({
        title: "Device Offline",
        description: "Biometric system not connected",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    
    try {
      const authRequest: BiometricAuthRequest = {
        method,
        deviceId: biometricDevices.find(d => d.type === method)?.id,
        timestamp: new Date().toISOString(),
        location: { latitude: 0, longitude: 0 } // Fixed location format
      };

      const response = await apiClient.post<BiometricAuthResponse>('/secure/authenticate', authRequest);
      
      if (response.success && response.data && response.data.success) {
        setCurrentUser(response.data.user.id);
        onAuthSuccess?.(response.data.user.id, method);
        
        toast({
          title: "Authentication Successful",
          description: `Welcome, ${response.data.user.full_name || response.data.user.username}`,
        });
      } else {
        const errorMessage = response.error || 'Authentication failed';
        onAuthFailure?.(errorMessage);
        
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      toast({
        title: "System Error",
        description: "Biometric scanner malfunction",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const enrollBiometric = async (userId: string, method: 'fingerprint' | 'facial' | 'iris') => {
    if (!isConnected) return;

    setIsScanning(true);
    
    try {
      const response = await apiClient.post('/secure/enroll', {
        userId,
        method,
        deviceId: biometricDevices.find(d => d.type === method)?.id
      });
      
      if (response.data.success) {
        toast({
          title: "Enrollment Successful",
          description: `${method} biometric enrolled for user ${userId}`,
        });
      }
    } catch (error) {
      console.error('Biometric enrollment error:', error);
      toast({
        title: "Enrollment Failed",
        description: "Unable to enroll biometric data",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Rest of component remains the same...
  if (mode === 'authentication') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            ClamFlowSecure Authentication
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Online" : "Offline"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={() => startBiometricScan('fingerprint')}
              disabled={!isConnected || isScanning}
              className="flex items-center gap-2 h-12"
            >
              <Fingerprint className="h-5 w-5" />
              {isScanning ? "Scanning..." : "Fingerprint Scan"}
            </Button>
            
            <Button
              onClick={() => startBiometricScan('facial')}
              disabled={!isConnected || isScanning}
              variant="outline"
              className="flex items-center gap-2 h-12"
            >
              <Eye className="h-5 w-5" />
              {isScanning ? "Scanning..." : "Facial Recognition"}
            </Button>
            
            <Button
              onClick={() => startBiometricScan('iris')}
              disabled={!isConnected || isScanning}
              variant="outline"
              className="flex items-center gap-2 h-12"
            >
              <Eye className="h-5 w-5" />
              {isScanning ? "Scanning..." : "Iris Scan"}
            </Button>
          </div>
          
          {currentUser && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Authenticated: {currentUser}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (mode === 'monitoring') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Security Monitoring Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {biometricDevices.filter(d => d.status === 'online').length}
                </div>
                <div className="text-sm text-blue-800">Devices Online</div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {securityEvents.filter(e => e.type === 'AUTH_SUCCESS').length}
                </div>
                <div className="text-sm text-green-800">Successful Auths Today</div>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {securityEvents.filter(e => e.type === 'AUTH_FAILURE').length}
                </div>
                <div className="text-sm text-red-800">Failed Attempts</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Recent Security Events</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {securityEvents.map((event, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    {event.type === 'AUTH_SUCCESS' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {event.type === 'AUTH_FAILURE' && <XCircle className="h-4 w-4 text-red-500" />}
                    {event.type === 'UNAUTHORIZED_ACCESS' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium">{event.message}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default ClamFlowSecure;