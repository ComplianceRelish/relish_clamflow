// src/components/dashboards/QualityControl.tsx
'use client';

import React, { useState, useEffect } from 'react';
import clamflowAPI from '@/lib/clamflow-api';

interface QCStats {
  pendingTests: number;
  passedTests: number;
  failedTests: number;
  completionRate: number;
}

const QualityControl: React.FC = () => {
  const [qcStats, setQcStats] = useState<QCStats>({
    pendingTests: 0,
    passedTests: 0,
    failedTests: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQCData = async () => {
      try {
        const response = await clamflowAPI.getDashboardMetrics();
        if (response.success && response.data) {
          // Map available data to QC stats
          setQcStats({
            pendingTests: response.data.pendingApprovals || 0,
            passedTests: 0,
            failedTests: 0,
            completionRate: 0
          });
        }
      } catch (error) {
        console.error('Error fetching QC data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQCData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{qcStats.pendingTests}</div>
          <div className="text-xs text-yellow-700">Pending Tests</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{qcStats.passedTests}</div>
          <div className="text-xs text-green-700">Passed Tests</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{qcStats.failedTests}</div>
          <div className="text-xs text-red-700">Failed Tests</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{qcStats.completionRate}%</div>
          <div className="text-xs text-blue-700">Pass Rate</div>
        </div>
      </div>
      
      {qcStats.pendingTests === 0 && qcStats.passedTests === 0 && (
        <div className="text-center text-gray-500 text-sm py-4">
          No QC data available
        </div>
      )}
      
      <div className="text-center">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View QC Dashboard →
        </button>
      </div>
    </div>
  );
};

export default QualityControl;