'use client';

import React, { useState, useEffect } from 'react';
import clamflowAPI from '../../../lib/clamflow-api';

interface ThroughputData {
  date: string;
  lotsProcessed: number;
  weightProcessed: number;
  averageProcessingTime: number;
}

interface EfficiencyMetrics {
  overallEfficiency: number;
  stationEfficiency: {
    stationName: string;
    efficiency: number;
    throughput: number;
  }[];
  downtimeMinutes: number;
  utilizationRate: number;
}

interface QualityMetrics {
  totalInspections: number;
  passRate: number;
  failRate: number;
  rejectionReasons: {
    reason: string;
    count: number;
  }[];
  averageQualityScore: number;
}

const ProductionAnalytics: React.FC = () => {
  const [throughput, setThroughput] = useState<ThroughputData | null>(null);
  const [efficiency, setEfficiency] = useState<EfficiencyMetrics | null>(null);
  const [quality, setQuality] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      const [throughputRes, efficiencyRes, qualityRes] = await Promise.all([
        clamflowAPI.getProductionThroughput(),
        clamflowAPI.getEfficiencyMetrics(),
        clamflowAPI.getQualityMetrics()
      ]);

      if (throughputRes.success && throughputRes.data) {
        setThroughput(throughputRes.data as ThroughputData);
      }

      if (efficiencyRes.success && efficiencyRes.data) {
        setEfficiency(efficiencyRes.data as EfficiencyMetrics);
      }

      if (qualityRes.success && qualityRes.data) {
        setQuality(qualityRes.data as QualityMetrics);
      }

      setLastUpdated(new Date().toLocaleTimeString());
      setError('');
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBgColor = (efficiency: number) => {
    if (efficiency >= 90) return 'bg-green-100 border-green-300';
    if (efficiency >= 75) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Production Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated || 'Never'}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'today' | 'week' | 'month')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={loadAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600">Lots Processed</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {throughput?.lotsProcessed || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600">Overall Efficiency</div>
          <div className={`text-3xl font-bold mt-2 ${getEfficiencyColor(efficiency?.overallEfficiency || 0)}`}>
            {efficiency?.overallEfficiency?.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">System-wide average</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="text-sm font-medium text-gray-600">Quality Pass Rate</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {quality?.passRate?.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {quality?.totalInspections || 0} inspections
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="text-sm font-medium text-gray-600">Avg Processing Time</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {throughput?.averageProcessingTime?.toFixed(0) || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">minutes per lot</div>
        </div>
      </div>

      {/* Throughput Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Throughput Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Lots Processed</div>
              <div className="text-4xl font-bold text-blue-600">
                {throughput?.lotsProcessed || 0}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Total Weight Processed</div>
              <div className="text-4xl font-bold text-green-600">
                {throughput?.weightProcessed?.toFixed(1) || 0}
                <span className="text-lg text-gray-500 ml-2">kg</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Avg Time per Lot</div>
              <div className="text-4xl font-bold text-purple-600">
                {throughput?.averageProcessingTime?.toFixed(0) || 0}
                <span className="text-lg text-gray-500 ml-2">min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Station Efficiency */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Station Efficiency Breakdown</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {efficiency?.stationEfficiency && efficiency.stationEfficiency.length > 0 ? (
              efficiency.stationEfficiency.map((station, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{station.stationName}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        Throughput: {station.throughput} lots
                      </span>
                      <span className={`text-sm font-semibold ${getEfficiencyColor(station.efficiency)}`}>
                        {station.efficiency.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        station.efficiency >= 90 ? 'bg-green-500' :
                        station.efficiency >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${station.efficiency}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No station efficiency data available
              </div>
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">System Utilization</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {efficiency?.utilizationRate?.toFixed(1) || 0}%
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Total Downtime</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {efficiency?.downtimeMinutes || 0} min
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quality Control Metrics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-2">Total Inspections</div>
              <div className="text-4xl font-bold text-gray-900">
                {quality?.totalInspections || 0}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-2">Pass Rate</div>
              <div className="text-4xl font-bold text-green-600">
                {quality?.passRate?.toFixed(1) || 0}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-2">Avg Quality Score</div>
              <div className="text-4xl font-bold text-blue-600">
                {quality?.averageQualityScore?.toFixed(1) || 0}
              </div>
            </div>
          </div>

          {/* Rejection Reasons */}
          {quality?.rejectionReasons && quality.rejectionReasons.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Rejection Reasons</h4>
              <div className="space-y-3">
                {quality.rejectionReasons.map((reason, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{reason.reason}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-900">{reason.count} cases</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ 
                            width: `${(reason.count / (quality.totalInspections || 1)) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionAnalytics;
