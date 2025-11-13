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
    : allowedRoles.includes(userRole) || userRole === 'Super Admin'; // Super admin can access everything

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Convenience components for common role checks
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['Super Admin', 'Admin']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const SuperAdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['Super Admin']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const QCStaffAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['Super Admin', 'Admin', 'QC Lead', 'QC Staff']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const ProductionAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['Super Admin', 'Admin', 'Production Lead', 'Production Staff']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

// Role display component
export const RoleDisplay: React.FC<{ role: UserRole; className?: string }> = ({ role, className = '' }) => {
  const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
    'Super Admin': 'Super Admin',
    'Admin': 'Admin',
    'Production Lead': 'Production Lead',
    'QC Lead': 'QC Lead',
    'Staff Lead': 'Staff Lead',
    'Production Staff': 'Production Staff',
    'QC Staff': 'QC Staff',
    'Security Guard': 'Security Guard'
  };
  
  const displayName = ROLE_DISPLAY_NAMES[role] || 'Unknown Role';
  
  const getRoleColor = (role: UserRole): string => {
    const colorMap: Record<UserRole, string> = {
      'Super Admin': 'bg-red-100 text-red-800 border-red-200',
      'Admin': 'bg-purple-100 text-purple-800 border-purple-200',
      'Production Lead': 'bg-blue-100 text-blue-800 border-blue-200',
      'QC Lead': 'bg-green-100 text-green-800 border-green-200',
      'Staff Lead': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Production Staff': 'bg-gray-100 text-gray-800 border-gray-200',
      'QC Staff': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Security Guard': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getRoleColor(role)} ${className}`}>
      {displayName}
    </span>
  );
};

export default RoleBasedAccess;