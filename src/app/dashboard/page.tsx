'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SuperAdminDashboard from '../../components/dashboards/SuperAdminDashboard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner size="lg" className="text-relish-purple" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to login
  }

  // Role-based dashboard rendering
  switch (user.role) {
    case 'Super Admin':
      return <SuperAdminDashboard />;
    
    case 'Admin':
      // Future: AdminDashboard component
      return <SuperAdminDashboard />; // For now, use Super Admin dashboard
    
    case 'Production Lead':
      // Future: ProductionLeadDashboard component
      return <div>Production Lead Dashboard - Coming Soon</div>;
    
    case 'QC Lead':
      // Future: QCLeadDashboard component
      return <div>QC Lead Dashboard - Coming Soon</div>;
    
    default:
      return <div>Dashboard for {user.role} - Coming Soon</div>;
  }
};

export default DashboardPage;