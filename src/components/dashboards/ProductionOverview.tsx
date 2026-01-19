// src/components/dashboards/ProductionOverview.tsx
'use client';

import React, { useState, useEffect } from 'react';
import clamflowAPI from '@/lib/clamflow-api';

interface ProductionStats {
  todayProduction: number;
  weeklyProduction: number;
  activeStations: number;
  totalStations: number;
}

const ProductionOverview: React.FC = () => {
  const [productionStats, setProductionStats] = useState<ProductionStats>({
    todayProduction: 0,
    weeklyProduction: 0,
    activeStations: 0,
    totalStations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductionData = async () => {
      try {
        const response = await clamflowAPI.getDashboardMetrics();
        if (response.success && response.data) {
          // Map available data to production stats
          setProductionStats({
            todayProduction: 0,
            weeklyProduction: 0,
            activeStations: 0,
            totalStations: 0
          });
        }
      } catch (error) {
        console.error('Error fetching production data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductionData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

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
          <div className="text-2xl font-bold text-orange-600">--</div>
          <div className="text-xs text-orange-700">Efficiency</div>
        </div>
      </div>
      
      {productionStats.todayProduction === 0 && productionStats.activeStations === 0 && (
        <div className="text-center text-gray-500 text-sm py-4">
          No production data available
        </div>
      )}
      
      <div className="text-center">
        <button className="text-green-600 hover:text-green-800 text-sm font-medium">
          View Production →
        </button>
      </div>
    </div>
  );
};

export default ProductionOverview;