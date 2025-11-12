// src/components/dashboards/UserManagement.tsx - NEW
'use client';

import React, { useState } from 'react';
import { userAPI } from '../../lib/api-client';

const UserManagement: React.FC = () => {
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    recentRegistrations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await userAPI.getStatistics();
        if (response.success) {
          setUserStats({
            totalUsers: response.data.total_users || 0,
            activeUsers: response.data.active_users || 0,
            inactiveUsers: response.data.inactive_users || 0,
            recentRegistrations: response.data.recent_registrations_30d || 0
          });
        }
      } catch (error) {
        console.error(&apos;Failed to fetch user stats:&apos;, error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
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
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{userStats.totalUsers}</div>
          <div className="text-xs text-blue-700">Total Users</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{userStats.activeUsers}</div>
          <div className="text-xs text-green-700">Active Users</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{userStats.inactiveUsers}</div>
          <div className="text-xs text-yellow-700">Inactive Users</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{userStats.recentRegistrations}</div>
          <div className="text-xs text-purple-700">New (30d)</div>
        </div>
      </div>
      
      <div className="text-center">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Manage Users →
        </button>
      </div>
    </div>
  );
};

export default UserManagement;