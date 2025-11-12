// src/components/dashboards/QualityControl.tsx - NEW
'use client';

import React from 'react';

const QualityControl: React.FC = () => {
  // Mock QC data
  const qcStats = {
    pendingTests: 5,
    passedTests: 142,
    failedTests: 3,
    completionRate: 98.5
  };

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
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Weight Notes</span>
          <span className="text-sm font-medium text-green-600">2 pending</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">PPC Forms</span>
          <span className="text-sm font-medium text-yellow-600">1 pending</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">FP Forms</span>
          <span className="text-sm font-medium text-green-600">All clear</span>
        </div>
      </div>
      
      <div className="text-center">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View QC Dashboard →
        </button>
      </div>
    </div>
  );
};

export default QualityControl;