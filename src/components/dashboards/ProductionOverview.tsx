// src/components/dashboards/ProductionOverview.tsx - NEW
'use client';

import React from 'react';

const ProductionOverview: React.FC = () => {
  // Mock production data
  const productionStats = {
    todayProduction: 1250,
    weeklyProduction: 8500,
    activeStations: 3,
    totalStations: 4
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{productionStats.todayProduction}</div>
          <div className="text-xs text-green-700">Today (kg)</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{productionStats.weeklyProduction}</div>
          <div className="text-xs text-blue-700">This Week (kg)</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {productionStats.activeStations}/{productionStats.totalStations}
          </div>
          <div className="text-xs text-purple-700">Active Stations</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">92%</div>
          <div className="text-xs text-orange-700">Efficiency</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">RM Station</span>
          <span className="text-sm font-medium text-green-600">Active</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">PPC Station</span>
          <span className="text-sm font-medium text-green-600">Active</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">FP Station</span>
          <span className="text-sm font-medium text-yellow-600">Maintenance</span>
        </div>
      </div>
      
      <div className="text-center">
        <button className="text-green-600 hover:text-green-800 text-sm font-medium">
          View Production →
        </button>
      </div>
    </div>
  );
};

export default ProductionOverview;