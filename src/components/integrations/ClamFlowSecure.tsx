'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  BiometricAuthRequest, 
  BiometricAuthResponse, 
  SecurityEvent 
} from '../../types';

interface ClamFlowSecureProps {
  onAuthSuccess?: (userId: string) => void;
  onAuthFailure?: (error: string) => void;
  onSecurityEvent?: (event: SecurityEvent) => void;
  className?: string;
}

interface BiometricDevice {
  id: string;
  type: 'fingerprint' | 'facial' | 'iris';
  status: 'connected' | 'disconnected' | 'error';
  lastSeen: string;
  accuracy: number;
}

interface AuthSession {
  id: string;
  userId?: string;
  deviceId: string;
  timestamp: string;
  status: 'pending' | 'success' | 'failed' | 'timeout';
  attempts: number;
}

const ClamFlowSecure: React.FC<ClamFlowSecureProps> = ({
  onAuthSuccess,
  onAuthFailure,
  onSecurityEvent,
  className = '',
}) => {
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [currentSession, setCurrentSession] = useState<AuthSession | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  // Initialize hardware connection
  useEffect(() => {
    initializeHardware();
    
    // Set up periodic device status checks
    const statusInterval = setInterval(checkDeviceStatus, 5000);
    
    return () => {
      clearInterval(statusInterval);
      disconnectHardware();
    };
  }, []);

  const initializeHardware = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Production: Detect actual connected hardware devices
      const token = localStorage.getItem('clamflow_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/hardware/devices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const detectedDevices: BiometricDevice[] = (data.devices || []).map((d: any) => ({
          id: d.id,
          type: d.type,
          status: d.status || 'disconnected',
          lastSeen: d.last_seen || new Date().toISOString(),
          accuracy: d.accuracy || 0.95,
        }));
        setDevices(detectedDevices);
        setConnectionStatus(detectedDevices.length > 0 ? 'connected' : 'disconnected');
        
        logSecurityEvent({
          type: 'authentication',
          details: { action: 'hardware_initialized', deviceCount: detectedDevices.length },
          severity: 'low',
        });
      } else {
        console.error('No hardware devices available');
        setDevices([]);
        setConnectionStatus('disconnected');
      }
      
    } catch (error) {
      console.error('Hardware initialization failed:', error);
      setConnectionStatus('disconnected');
      
      logSecurityEvent({
        type: 'hardware_failure',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high',
      });
    }
  };

  const checkDeviceStatus = async () => {
    if (connectionStatus === 'disconnected') return;
    
    // Simulate device status check
    setDevices(prevDevices => 
      prevDevices.map(device => ({
        ...device,
        lastSeen: Math.random() > 0.1 ? new Date().toISOString() : device.lastSeen,
        status: Math.random() > 0.05 ? 'connected' : 'error',
      }))
    );
  };

  const disconnectHardware = () => {
    setConnectionStatus('disconnected');
    setDevices([]);
    setCurrentSession(null);
    setIsScanning(false);
  };

  const logSecurityEvent = (eventData: Partial<SecurityEvent>) => {
    const event: SecurityEvent = {
      id: `event_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'authentication',
      severity: 'low',
      details: {},
      ...eventData,
    };
    
    setSecurityEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
    onSecurityEvent?.(event);
  };

  const startBiometricAuth = useCallback(async (deviceType: BiometricDevice['type']) => {
    const availableDevice = devices.find(d => d.type === deviceType && d.status === 'connected');
    
    if (!availableDevice) {
      const error = `No ${deviceType} device available`;
      onAuthFailure?.(error);
      logSecurityEvent({
        type: 'access_denied',
        details: { reason: 'device_unavailable', deviceType },
        severity: 'medium',
      });
      return;
    }
    
    setIsScanning(true);
    
    const session: AuthSession = {
      id: `session_${Date.now()}`,
      deviceId: availableDevice.id,
      timestamp: new Date().toISOString(),
      status: 'pending',
      attempts: 1,
    };
    
    setCurrentSession(session);
    
    try {
      // Simulate biometric scanning
      const authRequest: BiometricAuthRequest = {
        type: deviceType,
        deviceId: availableDevice.id,
        timeout: 30000,
      };
      
      logSecurityEvent({
        type: 'authentication',
        details: { action: 'auth_started', deviceType, deviceId: availableDevice.id },
        severity: 'low',
      });
      
      // Mock authentication process
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
      
      // Simulate success/failure (90% success rate)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        const mockUserId = `user_${Math.floor(Math.random() * 1000)}`;
        const response: BiometricAuthResponse = {
          success: true,
          userId: mockUserId,
          confidence: 0.95 + Math.random() * 0.04,
          timestamp: new Date().toISOString(),
          deviceId: availableDevice.id,
        };
        
        setCurrentSession(prev => prev ? { ...prev, status: 'success', userId: mockUserId } : null);
        onAuthSuccess?.(mockUserId);
        
        logSecurityEvent({
          type: 'authentication',
          userId: mockUserId,
          deviceId: availableDevice.id,
          details: { action: 'auth_success', confidence: response.confidence },
          severity: 'low',
        });
      } else {
        const error = 'Biometric authentication failed';
        setCurrentSession(prev => prev ? { ...prev, status: 'failed' } : null);
        onAuthFailure?.(error);
        
        logSecurityEvent({
          type: 'access_denied',
          deviceId: availableDevice.id,
          details: { reason: 'auth_failed', deviceType },
          severity: 'medium',
        });
      }
      
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setCurrentSession(prev => prev ? { ...prev, status: 'failed' } : null);
      onAuthFailure?.('Authentication system error');
      
      logSecurityEvent({
        type: 'hardware_failure',
        deviceId: availableDevice.id,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high',
      });
    } finally {
      setIsScanning(false);
    }
  }, [devices, onAuthSuccess, onAuthFailure]);

  const getDeviceStatusColor = (status: BiometricDevice['status']) => {
    switch (status) {
      case 'connected': return 'default';
      case 'disconnected': return 'secondary';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getDeviceIcon = (type: BiometricDevice['type']) => {
    switch (type) {
      case 'fingerprint': return '👆';
      case 'facial': return '👤';
      case 'iris': return '👁️';
      default: return '🔒';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <h3 className="text-lg font-medium text-gray-900">ClamFlowSecure</h3>
          </div>
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus.toUpperCase()}
          </Badge>
        </div>
      </Card>

      {/* Device Status */}
      <Card>
        <CardHeader>
          <CardTitle>Biometric Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div key={device.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getDeviceIcon(device.type)}</span>
                    <span className="font-medium capitalize">{device.type}</span>
                  </div>
                  <Badge variant={getDeviceStatusColor(device.status)}>
                    {device.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Accuracy: {(device.accuracy * 100).toFixed(1)}%</div>
                  <div>ID: {device.id}</div>
                  <div>Last Seen: {new Date(device.lastSeen).toLocaleTimeString()}</div>
                </div>
                <Button
                  className="w-full mt-3"
                  size="sm"
                  disabled={device.status !== 'connected' || isScanning}
                  onClick={() => startBiometricAuth(device.type)}
                >
                  {isScanning && currentSession?.deviceId === device.id ? (
                    <span className="animate-spin">🔄</span>
                  ) : (
                    `Scan ${device.type}`
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Session */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle>Current Authentication Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Session ID: {currentSession.id}</div>
                <div className="text-sm text-gray-600">Device: {currentSession.deviceId}</div>
                {currentSession.userId && (
                  <div className="text-sm text-gray-600">User ID: {currentSession.userId}</div>
                )}
              </div>
              <Badge 
                variant={
                  currentSession.status === 'success' ? 'default' :
                  currentSession.status === 'failed' ? 'destructive' :
                  'secondary'
                }
              >
                {currentSession.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {securityEvents.length === 0 ? (
              <p className="text-sm text-gray-500">No recent security events</p>
            ) : (
              securityEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {event.type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge 
                    variant={
                      event.severity === 'critical' || event.severity === 'high' 
                        ? 'destructive' 
                        : event.severity === 'medium' 
                          ? 'secondary' 
                          : 'secondary'
                    }
                  >
                    {event.severity}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hardware Test Controls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hardware Controls</CardTitle>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={checkDeviceStatus}>
              Refresh Status
            </Button>
            <Button variant="outline" size="sm" onClick={initializeHardware}>
              Reconnect
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default ClamFlowSecure;