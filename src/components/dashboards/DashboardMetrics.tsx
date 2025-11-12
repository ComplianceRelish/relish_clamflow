// src/components/dashboards/DashboardMetrics.tsx - CORRECTED
'use client';

import React from 'react';

interface DashboardMetricsProps {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalLots: number;
    pendingApprovals: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metrics }) => {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const metricCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      change: '+12%',
      changeType: 'positive',
      icon: '👥'
    },
    {
      title: 'Active Users',
      value: metrics.activeUsers,
      change: '+8%',
      changeType: 'positive',
      icon: '✅'
    },
    {
      title: 'Total Lots',
      value: metrics.totalLots,
      change: '+24%',
      changeType: 'positive',
      icon: '📦'
    },
    {
      title: 'Pending Approvals',
      value: metrics.pendingApprovals,
      change: '-5%',
      changeType: 'negative',
      icon: &apos;⏳&apos;
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">{card.icon}</div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {card.title}
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {card.value.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className={`${card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'} font-medium`}>
                {card.change}
              </span>
              <span className="ml-2 text-gray-500">from last month</span>
            </div>
          </div>
        </div>
      ))}

      {/* System Health Card */}
      <div className="bg-white rounded-lg shadow p-6 md:col-span-2 lg:col-span-1">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-2xl">🏥</div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                System Health
              </dt>
              <dd className={`text-lg font-medium capitalize px-2 py-1 rounded ${getHealthColor(metrics.systemHealth)}`}>
                {metrics.systemHealth}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;