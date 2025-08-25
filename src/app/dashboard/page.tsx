'use client';

import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-logo flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout 
      pageTitle="Dashboard" 
      pageSubtitle="Quality Control System Overview"
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to ClamFlow QC System
          </h3>
          <p className="text-gray-600 mb-4">
            User: <span className="font-medium">{userProfile?.full_name || user.email}</span>
          </p>
          <p className="text-gray-600">
            Role: <span className="font-medium capitalize">
              {userProfile?.role?.replace('_', ' ') || 'Loading...'}
            </span>
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Today's Weight Notes</h4>
            <p className="text-3xl font-bold text-emerald-600">12</p>
            <p className="text-sm text-gray-600">+3 from yesterday</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Active Lots</h4>
            <p className="text-3xl font-bold text-blue-600">8</p>
            <p className="text-sm text-gray-600">In processing</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold text-gray-900 mb-2">QC Approvals</h4>
            <p className="text-3xl font-bold text-orange-600">5</p>
            <p className="text-sm text-gray-600">Pending review</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Inventory Items</h4>
            <p className="text-3xl font-bold text-purple-600">156</p>
            <p className="text-sm text-gray-600">Ready for shipment</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => router.push('/weight-notes')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">⚖️</span>
              <div className="text-left">
                <p className="font-medium text-gray-900">Create Weight Note</p>
                <p className="text-sm text-gray-600">Record incoming clam weights</p>
              </div>
            </button>
            
            <button 
              onClick={() => router.push('/lots')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">📦</span>
              <div className="text-left">
                <p className="font-medium text-gray-900">Manage Lots</p>
                <p className="text-sm text-gray-600">Create and track lot processing</p>
              </div>
            </button>
            
            <button 
              onClick={() => router.push('/ppc')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">📋</span>
              <div className="text-left">
                <p className="font-medium text-gray-900">QC Forms</p>
                <p className="text-sm text-gray-600">PPC and FP quality control</p>
              </div>
            </button>
          </div>
        </div>

        {/* Backend Connection Status */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-emerald-500 text-xl mr-3">✓</span>
            <div>
              <p className="font-medium text-emerald-800">Backend Connected</p>
              <p className="text-sm text-emerald-700">
                Railway Backend: clamflowbackend-production.up.railway.app
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
