'use client';

import React, { useState, useEffect } from 'react';
import { User } from '../../../types/auth';
import clamflowAPI from '../../../lib/clamflow-api';

interface SupervisionOverviewProps {
  currentUser: User | null;
}

interface OverviewStats {
  totalStaff: number;
  checkedInStaff: number;
  pendingSuppliers: number;
  approvedSuppliers: number;
  securityAlerts: number;
  activeLocations: number;
  pendingApprovals: number;
  todayDeliveries: number;
}

interface RecentActivity {
  id: string;
  type: 'staff' | 'supplier' | 'security' | 'delivery';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'success' | 'error';
}

const SupervisionOverview: React.FC<SupervisionOverviewProps> = ({ currentUser }) => {
  const [stats, setStats] = useState<OverviewStats>({
    totalStaff: 0,
    checkedInStaff: 0,
    pendingSuppliers: 0,
    approvedSuppliers: 0,
    securityAlerts: 0,
    activeLocations: 0,
    pendingApprovals: 0,
    todayDeliveries: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOverviewData = async () => {
    try {
      setError(null);

      // Fetch data from multiple endpoints in parallel
      const [staffRes, suppliersRes, securityRes, attendanceRes] = await Promise.allSettled([
        clamflowAPI.getStaffAttendance(),
        clamflowAPI.getSuppliers(),
        clamflowAPI.getSecurityEvents(),
        clamflowAPI.getStaffLocations(),
      ]);

      // Process staff attendance
      let checkedIn = 0;
      let totalStaff = 0;
      if (staffRes.status === 'fulfilled' && staffRes.value.success && staffRes.value.data) {
        const staffData = Array.isArray(staffRes.value.data) ? staffRes.value.data : [];
        totalStaff = staffData.length;
        checkedIn = staffData.filter((s: any) => s.status === 'checked_in').length;
      }

      // Process suppliers
      let pendingSuppliers = 0;
      let approvedSuppliers = 0;
      if (suppliersRes.status === 'fulfilled' && suppliersRes.value.success && suppliersRes.value.data) {
        const supplierData = Array.isArray(suppliersRes.value.data) ? suppliersRes.value.data : [];
        approvedSuppliers = supplierData.length;
        pendingSuppliers = supplierData.filter((s: any) => s.status === 'pending').length;
      }

      // Process security events
      let securityAlerts = 0;
      if (securityRes.status === 'fulfilled' && securityRes.value.success && securityRes.value.data) {
        const securityData = Array.isArray(securityRes.value.data) ? securityRes.value.data : [];
        securityAlerts = securityData.filter((e: any) => !e.resolvedAt).length;
      }

      // Process locations
      let activeLocations = 0;
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value.success && attendanceRes.value.data) {
        const locationData = Array.isArray(attendanceRes.value.data) ? attendanceRes.value.data : [];
        activeLocations = locationData.length;
      }

      setStats({
        totalStaff,
        checkedInStaff: checkedIn,
        pendingSuppliers,
        approvedSuppliers,
        securityAlerts,
        activeLocations,
        pendingApprovals: pendingSuppliers,
        todayDeliveries: 0, // Would need separate endpoint
      });

      // Generate recent activity based on data
      const activities: RecentActivity[] = [];
      
      if (securityAlerts > 0) {
        activities.push({
          id: 'sec-' + Date.now(),
          type: 'security',
          message: `${securityAlerts} unresolved security event${securityAlerts > 1 ? 's' : ''} requiring attention`,
          timestamp: new Date().toISOString(),
          severity: 'warning',
        });
      }

      if (pendingSuppliers > 0) {
        activities.push({
          id: 'sup-' + Date.now(),
          type: 'supplier',
          message: `${pendingSuppliers} supplier onboarding request${pendingSuppliers > 1 ? 's' : ''} pending approval`,
          timestamp: new Date().toISOString(),
          severity: 'info',
        });
      }

      activities.push({
        id: 'staff-' + Date.now(),
        type: 'staff',
        message: `${checkedIn} of ${totalStaff} staff members currently checked in`,
        timestamp: new Date().toISOString(),
        severity: checkedIn > 0 ? 'success' : 'info',
      });

      setRecentActivity(activities);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load overview data';
      console.error('Overview data fetch error:', err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchOverviewData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'staff': return '👥';
      case 'supplier': return '🚚';
      case 'security': return '🔒';
      case 'delivery': return '📦';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading supervision overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Supervision Overview</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'} • Welcome, {currentUser?.full_name}
          </p>
        </div>
        <button
          onClick={fetchOverviewData}
          className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Staff Checked In</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {stats.checkedInStaff}/{stats.totalStaff}
              </div>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Approved Suppliers</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats.approvedSuppliers}</div>
            </div>
            <div className="text-3xl">🚚</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Security Alerts</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats.securityAlerts}</div>
              {stats.securityAlerts > 0 && (
                <div className="text-xs text-red-600 mt-1">Requires attention</div>
              )}
            </div>
            <div className="text-3xl">🔒</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Pending Approvals</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingApprovals}</div>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.hash = '#suppliers'}
            className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <span className="text-3xl mb-2">🚚</span>
            <span className="text-sm font-medium text-gray-700">Add Supplier</span>
          </button>
          <button
            onClick={() => window.location.hash = '#security'}
            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-3xl mb-2">📹</span>
            <span className="text-sm font-medium text-gray-700">View Security</span>
          </button>
          <button
            onClick={() => window.location.hash = '#staff'}
            className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="text-3xl mb-2">👥</span>
            <span className="text-sm font-medium text-gray-700">Staff Status</span>
          </button>
          <button
            onClick={fetchOverviewData}
            className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="text-3xl mb-2">📊</span>
            <span className="text-sm font-medium text-gray-700">Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity & Alerts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>No recent activity to display.</p>
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className={`px-6 py-4 border-l-4 ${getSeverityColor(activity.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{getTypeIcon(activity.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">
                      {getSeverityIcon(activity.severity)} {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Responsibilities Summary */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg shadow p-6 border border-orange-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔶 Staff Lead Responsibilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🚚</span>
              <span className="font-medium text-gray-800">Supplier Onboarding</span>
            </div>
            <p className="text-sm text-gray-600">
              Register and onboard new suppliers. Manage supplier documentation and boat details.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔒</span>
              <span className="font-medium text-gray-800">Security Oversight</span>
            </div>
            <p className="text-sm text-gray-600">
              Monitor security events, camera status, and unauthorized access attempts.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">👥</span>
              <span className="font-medium text-gray-800">Overall Supervision</span>
            </div>
            <p className="text-sm text-gray-600">
              Oversee staff attendance, locations, and performance metrics not covered by Production & QA/QC leads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisionOverview;
