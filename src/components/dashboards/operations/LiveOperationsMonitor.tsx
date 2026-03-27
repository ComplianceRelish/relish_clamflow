'use client';

import React from 'react';
import { useOperationsData } from '@/hooks/useOperationsData';

const LiveOperationsMonitor: React.FC = () => {
  const {
    stations,
    activeLots,
    bottlenecks,
    loading,
    error,
    lastUpdated,
  } = useOperationsData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'idle': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'offline': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Receiving': return 'bg-blue-100 text-blue-800';
      case 'Washing': return 'bg-cyan-100 text-cyan-800';
      case 'Depuration': return 'bg-blue-100 text-blue-800';
      case 'PPC Processing': return 'bg-indigo-100 text-indigo-800';
      case 'Final Product': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-500 text-red-900';
      case 'medium': return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      case 'low': return 'bg-blue-50 border-blue-500 text-blue-900';
      default: return 'bg-gray-50 border-gray-500 text-gray-900';
    }
  };

  const getTimeElapsed = (startTime: string) => {
    const elapsed = Date.now() - new Date(startTime).getTime();
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading operations data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Operations Data</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh indicator */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🔴 Live Operations Monitor</h2>
          <p className="text-gray-600">Real-time station status and lot tracking</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
          <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        </div>
      </div>

      {/* Bottleneck Alerts */}
      {bottlenecks.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <h3 className="font-bold text-yellow-900 mb-2">⚠️ Bottleneck Alerts</h3>
          <div className="space-y-2">
            {bottlenecks.map(alert => (
              <div key={alert.stationId} className={`p-3 rounded border-l-4 ${getSeverityColor(alert.severity)}`}>
                <p className="font-medium">{alert.stationName} ({alert.plantType}) — Staff: {alert.currentStaff}/{alert.requiredStaff}</p>
                <p className="text-sm">{alert.reason}</p>
                {alert.waitingLots > 0 && (
                  <p className="text-xs text-gray-600 mt-1">Waiting lots: {alert.waitingLots} | Avg wait: {alert.averageWaitTime} min</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Station Status Grid - Grouped by Plant */}
      {(['PPC', 'FP'] as const).map(plantType => {
        const plantStations = stations.filter(s => s.plantType === plantType);
        if (plantStations.length === 0) return null;
        return (
          <div key={plantType}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {plantType} Plant — {plantStations.length} Stations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plantStations.map(station => (
                <div key={station.stationId} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{station.stationName}</h4>
                      <p className="text-xs text-gray-500">{station.stationType} • {station.location}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(station.status)}`}>
                      {station.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-500">Operator:</p>
                      <p className="font-medium text-gray-900">{station.currentOperator || 'Unassigned'}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500">Staff:</p>
                      <p className="font-medium text-gray-900">{station.assignedStaff} / {station.capacity}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Current Lot:</p>
                      <p className="font-medium text-gray-900">{station.currentLot || 'None'}</p>
                    </div>
                    
                    {station.status === 'active' && (
                      <div>
                        <p className="text-gray-500 mb-1">Efficiency:</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              station.efficiency >= 90 ? 'bg-green-500' : 
                              station.efficiency >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${station.efficiency}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{station.efficiency}%</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Active Lots Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Active Lots in Processing</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Species</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Elapsed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeLots.map(lot => (
                <tr key={lot.lotId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{lot.lotId}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(lot.currentStage)}`}>
                      {lot.currentStage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lot.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {lot.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {lot.species}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lot.weightKg?.toFixed(1) ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTimeElapsed(lot.startTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Processing Flow Visualization */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Flow</h3>
        <div className="flex items-center justify-between space-x-4 overflow-x-auto pb-2">
          {[
            { label: 'Receiving', keywords: ['receiving'] },
            { label: 'Washing', keywords: ['washing'] },
            { label: 'Depuration', keywords: ['depuration'] },
            { label: 'PPC Processing', keywords: ['ppc processing', 'grading', 'packing', 'separation'] },
            { label: 'Final Product', keywords: ['final product', 'freezing', 'cold storage', 'shipping'] }
          ].map((stage, index) => {
            const lotsInStage = activeLots.filter(lot => {
              const currentStage = (lot.currentStage || '').toLowerCase();
              return stage.keywords.some(kw => currentStage.includes(kw));
            }).length;
            return (
              <React.Fragment key={stage.label}>
                <div className="flex-1 min-w-[120px]">
                  <div className={`p-4 rounded-lg text-center ${getStageColor(stage.label)}`}>
                    <p className="font-bold text-lg">{stage.label}</p>
                    <p className="text-2xl font-bold mt-2">{lotsInStage}</p>
                    <p className="text-xs mt-1">Active Lots</p>
                  </div>
                </div>
                {index < 4 && (
                  <div className="text-gray-400 text-2xl">→</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <p className="text-sm font-medium text-blue-900">Total Active Lots</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{activeLots.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <p className="text-sm font-medium text-green-900">Active Stations</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stations.filter(s => s.status === 'active').length} / {stations.length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <p className="text-sm font-medium text-blue-900">Avg. Efficiency</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {Math.round(stations.filter(s => s.status === 'active').reduce((sum, s) => sum + s.efficiency, 0) / 
              Math.max(stations.filter(s => s.status === 'active').length, 1))}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveOperationsMonitor;
