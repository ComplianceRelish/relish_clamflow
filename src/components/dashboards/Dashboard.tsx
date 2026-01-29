// src/components/dashboard/Dashboard.tsx - CORRECTED Main Dashboard
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleBasedAccess, AdminOnly, ProductionAccess, QCStaffAccess, RoleDisplay } from '../auth/RoleBasedAccess';
import clamflowAPI from '../../lib/clamflow-api';
import { UserRole } from '../../types/auth';
import { SystemHealthData } from '../../types/dashboard';

// Dashboard Widgets
import DashboardMetrics from './DashboardMetrics';
import RecentActivity from './RecentActivity';
import PendingApprovals from './PendingApprovals';
import SystemHealth from './SystemHealth';
import UserManagement from './UserManagement';
import ProductionOverview from './ProductionOverview';
import QualityControl from './QualityControl';

interface DashboardData {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalLots: number;
    pendingApprovals: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
  recentActivity: any[];
  pendingApprovals: any[];
  systemStatus: SystemHealthData;
}

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ FIXED: Use clamflowAPI for consistent API calls
        const [usersResponse, systemHealthResponse, pendingApprovalsResponse, recentActivityResponse] = await Promise.allSettled([
          clamflowAPI.getAllUsers(),
          clamflowAPI.getSystemHealth(),
          clamflowAPI.getPendingApprovals(),
          clamflowAPI.getDashboardMetrics()
        ]);

        // Handle users data for metrics
        const metrics = {
          totalUsers: 0,
          activeUsers: 0,
          totalLots: 0,
          pendingApprovals: 0,
          systemHealth: 'healthy' as const
        };

        if (usersResponse.status === 'fulfilled' && usersResponse.value?.success && Array.isArray(usersResponse.value.data)) {
          const users = usersResponse.value.data;
          metrics.totalUsers = users.length;
          metrics.activeUsers = users.filter(u => u.is_active).length;
        }

        // ✅ FIXED: Handle system health with EXACT SystemHealthData properties
        const defaultSystemStatus: SystemHealthData = {
          status: 'healthy',
          uptime: '0h 0m',
          database: {
            status: 'connected',
            response_time: 45
          },
          services: {
            authentication: true,
            api: true,
            database: true,
            hardware: true
          }
        };
        
        let systemStatus: SystemHealthData = defaultSystemStatus;
        if (systemHealthResponse.status === 'fulfilled' && systemHealthResponse.value?.success && systemHealthResponse.value.data) {
          systemStatus = systemHealthResponse.value.data;
        }

        // Handle pending approvals
        let pendingApprovals: any[] = [];
        if (pendingApprovalsResponse.status === 'fulfilled' && pendingApprovalsResponse.value?.success) {
          pendingApprovals = pendingApprovalsResponse.value.data || [];
          metrics.pendingApprovals = pendingApprovals.length;
        }

        // Handle recent activity (from dashboard metrics)
        let recentActivity: any[] = [];
        if (recentActivityResponse.status === 'fulfilled' && recentActivityResponse.value?.success) {
          // DashboardMetrics doesn't have recentActivity, leave empty for now
          recentActivity = [];
        }

        setDashboardData({
          metrics,
          recentActivity,
          pendingApprovals,
          systemStatus
        });

      } catch (err: any) {
        console.error('Dashboard data fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
        // Production: No fallback data - show error state
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user]);

  // Refresh dashboard data
  const refreshDashboard = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Re-fetch all dashboard data
      const [usersResponse, systemHealthResponse, pendingApprovalsResponse, recentActivityResponse] = await Promise.allSettled([
        clamflowAPI.getAllUsers(),
        clamflowAPI.getSystemHealth(),
        clamflowAPI.getPendingApprovals(),
        clamflowAPI.getDashboardMetrics()
      ]);

      // Process responses same as above
      const metrics = {
        totalUsers: 0,
        activeUsers: 0,
        totalLots: 0,
        pendingApprovals: 0,
        systemHealth: 'healthy' as const
      };

      if (usersResponse.status === 'fulfilled' && usersResponse.value?.success && Array.isArray(usersResponse.value.data)) {
        const users = usersResponse.value.data;
        metrics.totalUsers = users.length;
        metrics.activeUsers = users.filter(u => u.is_active).length;
      }

      // ✅ FIXED: Proper type handling for SystemHealthData
      const defaultSystemStatus: SystemHealthData = {
        status: 'healthy',
        uptime: '0h 0m',
        database: {
          status: 'connected',
          response_time: 45
        },
        services: {
          authentication: true,
          api: true,
          database: true,
          hardware: true
        }
      };
      
      let systemStatus: SystemHealthData = defaultSystemStatus;
      if (systemHealthResponse.status === 'fulfilled' && systemHealthResponse.value?.success && systemHealthResponse.value.data) {
        systemStatus = systemHealthResponse.value.data;
      }

      const pendingApprovals = (pendingApprovalsResponse.status === 'fulfilled' && pendingApprovalsResponse.value?.success) 
        ? (pendingApprovalsResponse.value.data || []) : [];
      const recentActivity: any[] = [];

      metrics.pendingApprovals = pendingApprovals.length;

      setDashboardData({
        metrics,
        recentActivity,
        pendingApprovals,
        systemStatus
      });

    } catch (err: any) {
      console.error('Dashboard refresh error:', err);
      setError(err.message || 'Failed to refresh dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Role display helper
  const getDisplayRole = (role: UserRole): string => {
    const roleMap: Record<UserRole, string> = {
      'Super Admin': 'Super Administrator',
      'Admin': 'Administrator',
      'Staff Lead': 'Staff Lead',
      'Production Lead': 'Production Lead',
      'QC Lead': 'QC Lead',
      'Production Staff': 'Production Staff',
      'QC Staff': 'QC Staff',
      'Security Guard': 'Security Guard'
    };
    return roleMap[role] || role;
  };

  // Loading state
  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ClamFlow dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state (only show if no data and error exists)
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Dashboard Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={refreshDashboard}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 mr-2"
            >
              Retry
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ClamFlow Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome back, {user.full_name} | Role: {getDisplayRole(user.role)}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <RoleDisplay role={user.role} />
                {user.station && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Station: {user.station}
                  </span>
                )}
                <button
                  onClick={refreshDashboard}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    '🔄 Refresh'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner (if error exists but we have fallback data) */}
      {error && dashboardData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Some dashboard data may be outdated: {error}
                <button onClick={refreshDashboard} className="font-medium underline ml-1">Refresh now</button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Metrics Overview */}
        {dashboardData && (
          <div className="mb-8">
            <DashboardMetrics metrics={dashboardData.metrics} />
          </div>
        )}

        {/* Role-Based Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Super Admin & Admin Sections */}
          <AdminOnly>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
              <UserManagement />
            </div>
          </AdminOnly>

          {/* System Health (Admin Only) */}
          <AdminOnly>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
              {dashboardData && <SystemHealth />}
            </div>
          </AdminOnly>

          {/* Production Overview */}
          <ProductionAccess>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Production Overview</h3>
              <ProductionOverview />
            </div>
          </ProductionAccess>

          {/* Quality Control */}
          <QCStaffAccess>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Control</h3>
              <QualityControl />
            </div>
          </QCStaffAccess>

          {/* Pending Approvals (Available to relevant roles) */}
          <RoleBasedAccess allowedRoles={['Super Admin', 'Admin', 'Production Lead', 'QC Lead', 'QC Staff']}>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Approvals</h3>
              {dashboardData && <PendingApprovals />}
            </div>
          </RoleBasedAccess>

          {/* Recent Activity (Everyone) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            {dashboardData && <RecentActivity activities={dashboardData.recentActivity} />}
          </div>

        </div>

        {/* Role-Specific Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions for {getDisplayRole(user.role)}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Weight Note Creation (QC Staff) */}
            <QCStaffAccess>
              <button 
                onClick={() => window.location.href = '/weight-notes/create'}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm font-medium">Create Weight Note</div>
              </button>
            </QCStaffAccess>

            {/* PPC Form (Production Staff) */}
            <ProductionAccess>
              <button 
                onClick={() => window.location.href = '/ppc-forms/create'}
                className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">🔬</div>
                <div className="text-sm font-medium">Create PPC Form</div>
              </button>
            </ProductionAccess>

            {/* FP Form (Production Staff) */}
            <ProductionAccess>
              <button 
                onClick={() => window.location.href = '/fp-forms/create'}
                className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📋</div>
                <div className="text-sm font-medium">Create FP Form</div>
              </button>
            </ProductionAccess>

            {/* User Management (Admin) */}
            <AdminOnly>
              <button 
                onClick={() => window.location.href = '/admin/users'}
                className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm font-medium">Manage Users</div>
              </button>
            </AdminOnly>

            {/* Lot Management */}
            <RoleBasedAccess allowedRoles={['Super Admin', 'Admin', 'Production Lead', 'Production Staff']}>
              <button 
                onClick={() => window.location.href = '/lots'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">🏭</div>
                <div className="text-sm font-medium">View Lots</div>
              </button>
            </RoleBasedAccess>

            {/* Audit Logs (Admin Only) */}
            <AdminOnly>
              <button 
                onClick={() => window.location.href = '/admin/audit'}
                className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📝</div>
                <div className="text-sm font-medium">Audit Logs</div>
              </button>
            </AdminOnly>

          </div>
        </div>

        {/* Quick Stats Cards */}
        {dashboardData && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{dashboardData.metrics.totalUsers}</div>
              <div className="text-sm text-gray-500">Total Users</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{dashboardData.metrics.activeUsers}</div>
              <div className="text-sm text-gray-500">Active Users</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{dashboardData.metrics.pendingApprovals}</div>
              <div className="text-sm text-gray-500">Pending Approvals</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className={`text-3xl font-bold ${
                dashboardData.systemStatus.status === 'healthy' ? 'text-green-600' : 
                dashboardData.systemStatus.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {dashboardData.systemStatus.status === 'healthy' ? '✅' : 
                 dashboardData.systemStatus.status === 'warning' ? '⚠️' : '❌'}
              </div>
              <div className="text-sm text-gray-500">System Status</div>
              <div className="text-xs text-gray-400">Uptime: {dashboardData.systemStatus.uptime}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;