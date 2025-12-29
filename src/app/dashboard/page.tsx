'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Debug logging
    console.log('Dashboard Auth Check:', { isLoading, isAuthenticated, user: user?.username });
    
    // Wait for auth to finish loading
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      console.log('Redirecting to login - not authenticated');
      router.push('/login');
      return;
    }

    // Check if user has dashboard access
    if (!['Super Admin', 'Admin'].includes(user.role)) {
      setError(`Access denied. Role "${user.role}" does not have dashboard access.`);
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">{error || 'Authentication required'}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        pageTitle={user.role === 'Super Admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
        pageSubtitle={`Welcome back, ${user.full_name}`}
      />
      
      {user.role === 'Super Admin' ? (
        <SuperAdminDashboard currentUser={user} />
      ) : (
        <AdminDashboard currentUser={user} />
      )}
    </div>
  );
};

export default DashboardPage;