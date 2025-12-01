'use client';

import React, { useState, useEffect } from 'react';
import clamflowAPI from '../../../lib/clamflow-api';

interface Camera {
  id: string;
  cameraName: string;
  location: string;
  status: 'online' | 'offline' | 'error';
  lastHeartbeat: string;
  recordingStatus: 'active' | 'inactive';
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: 'unauthorized_access' | 'face_detected' | 'motion_detected' | 'alarm_triggered';
  location: string;
  cameraId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolved: boolean;
}

interface FaceDetectionEvent {
  id: string;
  timestamp: string;
  personName: string;
  personId: string;
  cameraLocation: string;
  confidence: number;
  authorized: boolean;
}

const SecuritySurveillance: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [faceEvents, setFaceEvents] = useState<FaceDetectionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      const [camerasRes, eventsRes, faceEventsRes] = await Promise.all([
        clamflowAPI.getSecurityCameras(),
        clamflowAPI.getSecurityEvents(),
        clamflowAPI.getFaceDetectionEvents()
      ]);

      if (camerasRes.success && camerasRes.data) {
        setCameras(camerasRes.data as Camera[]);
      }

      if (eventsRes.success && eventsRes.data) {
        setSecurityEvents(eventsRes.data as SecurityEvent[]);
      }

      if (faceEventsRes.success && faceEventsRes.data) {
        setFaceEvents(faceEventsRes.data as FaceDetectionEvent[]);
      }

      setLastUpdated(new Date().toLocaleTimeString());
      setError('');
    } catch (err) {
      setError('Failed to load security data');
      console.error('Security data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCameraStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800 border-green-300';
      case 'offline': return 'bg-red-100 text-red-800 border-red-300';
      case 'error': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'unauthorized_access': return '🚫';
      case 'face_detected': return '👤';
      case 'motion_detected': return '👁️';
      case 'alarm_triggered': return '🚨';
      default: return '⚠️';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security data...</p>
        </div>
      </div>
    );
  }

  const onlineCameras = cameras.filter(c => c.status === 'online').length;
  const unresolvedEvents = securityEvents.filter(e => !e.resolved).length;
  const criticalEvents = securityEvents.filter(e => e.severity === 'critical' && !e.resolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security & Surveillance</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated || 'Never'}
          </p>
        </div>
        <button
          onClick={loadSecurityData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600">Cameras Online</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {onlineCameras}/{cameras.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-600">Unresolved Events</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{unresolvedEvents}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-600">Critical Alerts</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{criticalEvents}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600">Face Detections Today</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{faceEvents.length}</div>
        </div>
      </div>

      {/* Camera Status Grid */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Camera Status Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No cameras configured
              </div>
            ) : (
              cameras.map((camera) => (
                <div
                  key={camera.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{camera.cameraName}</h4>
                      <p className="text-sm text-gray-600">{camera.location}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getCameraStatusColor(camera.status)}`}>
                      {camera.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Last heartbeat: {new Date(camera.lastHeartbeat).toLocaleString()}</div>
                    <div>Recording: {camera.recordingStatus}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Security Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {securityEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No security events recorded
                  </td>
                </tr>
              ) : (
                securityEvents.slice(0, 10).map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="flex items-center">
                        <span className="mr-2">{getEventTypeIcon(event.eventType)}</span>
                        {event.eventType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {event.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {event.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(event.severity)}`}>
                        {event.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {event.resolved ? (
                        <span className="text-green-600">✓ Resolved</span>
                      ) : (
                        <span className="text-yellow-600">⚠ Pending</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Face Detection Events */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Face Detection Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Authorization
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {faceEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No face detection events recorded
                  </td>
                </tr>
              ) : (
                faceEvents.slice(0, 10).map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.personName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {event.cameraLocation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {(event.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.authorized ? (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-green-100 text-green-800 border-green-300">
                          AUTHORIZED
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-red-100 text-red-800 border-red-300">
                          UNAUTHORIZED
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecuritySurveillance;
