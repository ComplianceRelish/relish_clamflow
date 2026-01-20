'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import InteractiveStationAssignment from '../../components/InteractiveStationAssignment';

// Authorized roles for station assignment
const AUTHORIZED_ROLES = [
  'Super Admin',
  'Admin',
  'Production Lead',
  'QC Lead',
  'Staff Lead'
];

export default function StationAssignmentPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login?returnUrl=/station-assignment');
        return;
      }
      
      const authorized = AUTHORIZED_ROLES.includes(user.role);
      setIsAuthorized(authorized);
      
      if (!authorized) {
        console.warn('User not authorized for station assignment:', user.role);
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-600">
        <div className="text-center text-white max-w-md p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="mb-4">
            You do not have permission to access the Station Assignment module.
          </p>
          <p className="text-sm opacity-80 mb-4">
            Required roles: Production Lead, QC Lead, Staff Lead, Admin, or Super Admin
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <InteractiveStationAssignment />;
}
