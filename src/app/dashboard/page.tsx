'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { User } from '@/types/auth';

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
          
          if (!['Super Admin', 'Admin'].includes(userData.role)) {
            setError(`Access denied. Role "${userData.role}" does not have dashboard access.`);
            return;
          }

          setUser(userData);
          return;
        }

        router.push('/login');
      } catch (err) {
        console.error('Auth error:', err);
        setError('Authentication failed. Please log in again.');
        setTimeout(() => router.push('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };

    validateAndLoadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
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