'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { User, UserRole } from '@/types/auth';

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const validateAndLoadUser = async () => {
      try {
        const token = localStorage.getItem('clamflow_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const storedUser = localStorage.getItem('clamflow_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);

          // ✅ FIXED: Check using Title Case with spaces (matching AuthContext)
          if (!['Super Admin', 'Admin'].includes(userData.role)) {
            setError(`Access denied. Role "${userData.role}" does not have dashboard access privileges.`);
            return;
          }

          setUser(userData);
          return;
        }

        localStorage.removeItem('clamflow_token');
        localStorage.removeItem('clamflow_user');
        router.push('/login');

      } catch (err) {
        console.error('Authentication error:', err);
        setError('Authentication failed. Please log in again.');

        localStorage.removeItem('clamflow_token');
        localStorage.removeItem('clamflow_user');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    validateAndLoadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="text-relish-purple mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Authentication required. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Role-based routing using Title Case with spaces (matching AuthContext)
  switch (user.role) {
    case 'Super Admin':
      return <SuperAdminDashboard currentUser={user} />;
    
    case 'Admin':
      return <AdminDashboard currentUser={user} />;
    
    case 'Production Lead':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Production Lead Dashboard</h2>
              <p className="text-blue-600 mb-4">
                Production Lead dashboard is in development. Temporary admin access granted.
              </p>
              <button
                onClick={() => {
                  const tempUser: User = { ...user, role: 'Admin' };
                  setUser(tempUser);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Access Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">Unrecognized Role</h2>
              <p className="text-yellow-600 mb-4">
                Role "{user.role}" is not configured for dashboard access.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      );
  }
};

export default DashboardPage;