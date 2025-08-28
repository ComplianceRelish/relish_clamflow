'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { clamflowAPI, DashboardMetrics, SystemHealthData } from '../../lib/clamflow-api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs } from '../ui/Tabs';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// Super Admin specific components
import AdminManagement from './admin/AdminManagement';
import SystemHealth from './admin/SystemHealth';
import AuditTrail from './admin/AuditTrail';
import RoleAudit from './admin/RoleAudit';
import DisasterRecovery from './admin/DisasterRecovery';

interface DashboardState {
  metrics: DashboardMetrics | null;
  systemHealth: SystemHealthData | null;
  loading: boolean;
  error: string | null;
}

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    metrics: null,
    systemHealth: null,
    loading: true,
    error: null,
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardState(prev => ({ ...prev, loading: true, error: null }));

        // Fetch metrics and system health in parallel
        const [metricsResponse, healthResponse] = await Promise.all([
          clamflowAPI.getDashboardMetrics(),
          clamflowAPI.getSystemHealth(),
        ]);

        setDashboardState({
          metrics: metricsResponse.success ? metricsResponse.data || null : null,
          systemHealth: healthResponse.success ? healthResponse.data || null : null,
          loading: false,
          error: metricsResponse.success && healthResponse.success ? null : 'Failed to load dashboard data',
        });
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setDashboardState({
          metrics: null,
          systemHealth: null,
          loading: false,
          error: 'Failed to load dashboard data',
        });
      }
    };

    if (user) {
      fetchDashboardData();
      
      // Set up auto-refresh every 5 minutes (reduced from 30 seconds)
      const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Render loading state
  if (dashboardState.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner size="lg" className="text-relish-purple" />
      </div>
    );
  }

  // Render error state
  if (dashboardState.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{dashboardState.error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  const { metrics, systemHealth } = dashboardState;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">CF</span>
                </div>
                                <h1 className="text-2xl font-bold text-gray-900">ClamFlow</h1>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Super Admin
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.username}</p>
              </div>
              <Button variant="outline" onClick={logout} size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'users', label: 'User Management', icon: '👥' },
                { key: 'system', label: 'System Health', icon: '🏥' },
                { key: 'audit', label: 'Audit Trail', icon: '📋' },
                { key: 'roles', label: 'Role Management', icon: '🔒' },
                { key: 'recovery', label: 'Disaster Recovery', icon: '🛡️' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">👥</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Users</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {metrics?.totalUsers || 0}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">✅</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Active Users</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {metrics?.activeUsers || 0}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">📦</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Lots</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {metrics?.totalLots || 0}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">⏳</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {metrics?.pendingApprovals || 0}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* System Status */}
                <Card className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
                  <div className="flex items-center space-x-4">
                    <Badge 
                      variant={systemHealth?.status === 'healthy' ? 'success' : 
                              systemHealth?.status === 'warning' ? 'warning' : 'destructive'}
                    >
                      {systemHealth?.status?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </Card>
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && <AdminManagement />}

            {/* System Health Tab */}
            {activeTab === 'system' && <SystemHealth />}

            {/* Audit Trail Tab */}
            {activeTab === 'audit' && <AuditTrail />}

            {/* Role Management Tab */}
            {activeTab === 'roles' && <RoleAudit />}

            {/* Disaster Recovery Tab */}
            {activeTab === 'recovery' && <DisasterRecovery />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;