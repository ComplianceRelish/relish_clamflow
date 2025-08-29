'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface User {
  id: string;
  username: string;
  role: string;
  department?: string;
  email?: string;
}

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const validateAndLoadUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }

        // Try to validate with backend first
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/validate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            
            // Verify user has dashboard access
            if (!['Super Admin', 'Admin'].includes(userData.role)) {
              setError(`Access denied. Role "${userData.role}" does not have dashboard access privileges.`);
              return;
            }

            setUser(userData);
            return;
          }
        } catch (apiError) {
          console.log('Backend API unavailable, checking fallback credentials...');
        }

        // Fallback to stored user data if API is unavailable
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Verify user has dashboard access
          if (!['Super Admin', 'Admin'].includes(userData.role)) {
            setError(`Access denied. Role "${userData.role}" does not have dashboard access privileges.`);
            return;
          }

          setUser(userData);
          return;
        }

        // No valid authentication found
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        router.push('/login');
        
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Authentication failed. Please log in again.');
        
        // Clear invalid tokens and redirect
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    validateAndLoadUser();
  }, [router]);

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
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

  // No user state (should not happen due to loading logic, but safety check)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Authentication required. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Production-ready role-based dashboard routing
  switch (user.role) {
    case 'Super Admin':
      return <SuperAdminDashboard user={user} />;
    
    case 'Admin':
      return <AdminDashboard />;
    
    case 'Production Lead':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Production Lead Dashboard</h2>
              <p className="text-blue-600 mb-4">
                Production Lead dashboard is currently in development. You have been granted temporary access to Admin tools.
              </p>
              <button
                onClick={() => {
                  // Temporarily upgrade user to Admin for dashboard access
                  const tempUser = { ...user, role: 'Admin' };
                  setUser(tempUser);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Access Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    
    case 'QC Lead':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-green-800 mb-2">QC Lead Dashboard</h2>
              <p className="text-green-600 mb-4">
                Quality Control Lead dashboard is currently in development. You have been granted temporary access to Admin tools.
              </p>
              <button
                onClick={() => {
                  // Temporarily upgrade user to Admin for dashboard access
                  const tempUser = { ...user, role: 'Admin' };
                  setUser(tempUser);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Access Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      );

    case 'Staff Lead':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-purple-800 mb-2">Staff Lead Dashboard</h2>
              <p className="text-purple-600 mb-4">
                Staff Lead dashboard is currently in development. Contact your administrator for access to required tools.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-purple-500">Available actions:</p>
                <button
                  onClick={() => router.push('/forms')}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Access Forms
                </button>
              </div>
            </div>
          </div>
        </div>
      );

    case 'QC Staff':
    case 'Production Staff':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{user.role} Access</h2>
              <p className="text-gray-600 mb-4">
                Your role has access to specific operational tools. Contact your supervisor for dashboard access.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/forms')}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Access Forms
                </button>
                <button
                  onClick={() => router.push('/inventory')}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  View Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      );

    case 'Security Guard':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-red-800 mb-2">Security Guard Access</h2>
              <p className="text-red-600 mb-4">
                Security dashboard is currently in development. Access gate control and security functions below.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/security/gate-control')}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Gate Control
                </button>
                <button
                  onClick={() => router.push('/security/attendance')}
                  className="w-full px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  Attendance Tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">Unrecognized Role</h2>
              <p className="text-yellow-600 mb-4">
                Role "{user.role}" is not configured for dashboard access. Please contact your system administrator.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
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