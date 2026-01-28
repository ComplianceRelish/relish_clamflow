'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import StaffLeadDashboard from '@/components/dashboards/StaffLeadDashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Roles that have dashboard access
const DASHBOARD_ROLES = ['Super Admin', 'Admin', 'Staff Lead'];

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
    if (!DASHBOARD_ROLES.includes(user.role)) {
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

  // Get page title based on role
  const getPageTitle = () => {
    switch (user.role) {
      case 'Super Admin':
        return 'Super Admin Dashboard';
      case 'Admin':
        return 'Admin Dashboard';
      case 'Staff Lead':
        return 'Staff Lead Dashboard';
      default:
        return 'Dashboard';
    }
  };

  // Render appropriate dashboard based on role
  const renderDashboard = () => {
    switch (user.role) {
      case 'Super Admin':
        return <SuperAdminDashboard currentUser={user} />;
      case 'Admin':
        return <AdminDashboard currentUser={user} />;
      case 'Staff Lead':
        return <StaffLeadDashboard currentUser={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        pageTitle={getPageTitle()}
        pageSubtitle={`Welcome back, ${user.full_name}`}
      />
      
      {renderDashboard()}
    </div>
  );
};

export default DashboardPage;