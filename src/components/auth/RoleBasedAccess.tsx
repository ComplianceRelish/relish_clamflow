// src/components/auth/RoleBasedAccess.tsx - Role-based rendering
'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';

interface RoleBasedAccessProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles, if false ANY role
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback = null,
  requireAll = false
}) => {
  const { user, isAuthenticated } = useAuth();

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Check role access
  const userRole = user.role;
  const hasAccess = requireAll 
    ? allowedRoles.every(role => role === userRole)
    : allowedRoles.includes(userRole) || userRole === &apos;super_admin&apos;; // Super admin can access everything

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Convenience components for common role checks
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['super_admin', 'admin']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const SuperAdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['super_admin']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const QCStaffAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['super_admin', 'admin', 'qc_lead', 'qc_staff']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const ProductionAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['super_admin', 'admin', 'production_lead', 'production_staff']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

// Role display component
export const RoleDisplay: React.FC<{ role: UserRole; className?: string }> = ({ role, className = '' }) => {
  const displayName = ROLE_DISPLAY_NAMES[role] || &apos;Unknown Role&apos;;
  
  const getRoleColor = (role: UserRole): string => {
    const colorMap: Record<UserRole, string> = {
      'super_admin': 'bg-red-100 text-red-800 border-red-200',
      'admin': 'bg-purple-100 text-purple-800 border-purple-200',
      'production_lead': 'bg-blue-100 text-blue-800 border-blue-200',
      'qc_lead': 'bg-green-100 text-green-800 border-green-200',
      'staff_lead': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'production_staff': 'bg-gray-100 text-gray-800 border-gray-200',
      'qc_staff': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'security_guard': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colorMap[role] || &apos;bg-gray-100 text-gray-800 border-gray-200&apos;;
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getRoleColor(role)} ${className}`}>
      {displayName}
    </span>
  );
};

export default RoleBasedAccess;