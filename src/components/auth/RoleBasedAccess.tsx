// src/components/auth/RoleBasedAccess.tsx - Role-based rendering
'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, Permission, ROLE_PERMISSIONS, hasPermission } from '../../types/auth';

interface RoleBasedAccessProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles, if false ANY role
}

interface PermissionBasedAccessProps {
  requiredPermissions: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL permissions
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

// Permission-based access control (more granular than role-based)
export const PermissionBasedAccess: React.FC<PermissionBasedAccessProps> = ({
  requiredPermissions,
  children,
  fallback = null,
  requireAll = true
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  const hasAccess = requireAll
    ? requiredPermissions.every(perm => userPermissions.includes(perm))
    : requiredPermissions.some(perm => userPermissions.includes(perm));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// ============================================
// CONVENIENCE COMPONENTS - Admin Roles
// ============================================

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

// ============================================
// CONVENIENCE COMPONENTS - Lead Roles (Controllers)
// ============================================

// Production Lead Access - Production Unit Controller
export const ProductionLeadAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['Super Admin', 'Admin', 'Production Lead']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

// QC Lead (QA) Access - Quality Assurance Controller  
export const QCLeadAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['Super Admin', 'Admin', 'QC Lead']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

// Staff Lead Access - General Staff Controller
export const StaffLeadAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['Super Admin', 'Admin', 'Staff Lead']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

// All Lead Roles Access (Production Lead, QC Lead, Staff Lead)
export const LeadAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['Super Admin', 'Admin', 'Production Lead', 'QC Lead', 'Staff Lead']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

// ============================================
// CONVENIENCE COMPONENTS - Staff Access
// ============================================

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

export const SecurityAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['Super Admin', 'Admin', 'Staff Lead', 'Security Guard']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

// ============================================
// PERMISSION-BASED CONVENIENCE COMPONENTS
// ============================================

// Staff Onboarding Access (Production Lead initiates, Admin approves)
export const StaffOnboardingAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionBasedAccess requiredPermissions={['STAFF_ONBOARD']} requireAll={false} fallback={fallback}>
    {children}
  </PermissionBasedAccess>
);

// Shift Scheduling Access
export const ShiftSchedulingAccess: React.FC<{ 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
  staffType?: 'production' | 'qc' | 'all';
}> = ({ children, fallback, staffType = 'all' }) => {
  const permissionMap: Record<string, Permission[]> = {
    production: ['SHIFT_SCHEDULE_PRODUCTION', 'SHIFT_SCHEDULE_ALL'],
    qc: ['SHIFT_SCHEDULE_QC', 'SHIFT_SCHEDULE_ALL'],
    all: ['SHIFT_SCHEDULE_ALL', 'SHIFT_SCHEDULE_PRODUCTION', 'SHIFT_SCHEDULE_QC'],
  };
  return (
    <PermissionBasedAccess requiredPermissions={permissionMap[staffType]} requireAll={false} fallback={fallback}>
      {children}
    </PermissionBasedAccess>
  );
};

// Station Assignment Access
export const StationAssignmentAccess: React.FC<{ 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
  staffType?: 'production' | 'qc' | 'all';
}> = ({ children, fallback, staffType = 'all' }) => {
  const permissionMap: Record<string, Permission[]> = {
    production: ['STATION_ASSIGN_PRODUCTION', 'STATION_ASSIGN_ALL'],
    qc: ['STATION_ASSIGN_QC', 'STATION_ASSIGN_ALL'],
    all: ['STATION_ASSIGN_ALL', 'STATION_ASSIGN_PRODUCTION', 'STATION_ASSIGN_QC'],
  };
  return (
    <PermissionBasedAccess requiredPermissions={permissionMap[staffType]} requireAll={false} fallback={fallback}>
      {children}
    </PermissionBasedAccess>
  );
};

// Device RFID Handover Access
export const DeviceHandoverAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionBasedAccess requiredPermissions={['DEVICE_RFID_HANDOVER']} fallback={fallback}>
    {children}
  </PermissionBasedAccess>
);

// Weight Note Approval Access
export const WeightNoteApprovalAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionBasedAccess requiredPermissions={['WEIGHTNOTE_APPROVE']} fallback={fallback}>
    {children}
  </PermissionBasedAccess>
);

// PPC Form Approval & Gate Pass Access
export const PPCApprovalAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionBasedAccess requiredPermissions={['PPC_FORM_APPROVE']} fallback={fallback}>
    {children}
  </PermissionBasedAccess>
);

// QC Form Approval Access (QC Lead approves ALL QC forms)
export const QCFormApprovalAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionBasedAccess requiredPermissions={['QC_FORM_APPROVE']} fallback={fallback}>
    {children}
  </PermissionBasedAccess>
);

// Depuration Testing Access
export const DepurationTestingAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionBasedAccess requiredPermissions={['DEPURATION_TEST', 'DEPURATION_REPORT_GENERATE']} requireAll={false} fallback={fallback}>
    {children}
  </PermissionBasedAccess>
);

// Microbiology Testing Access (moves FP to Inventory)
export const MicrobiologyTestingAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionBasedAccess requiredPermissions={['MICROBIOLOGY_TEST', 'MICROBIOLOGY_REPORT_UPLOAD']} requireAll={false} fallback={fallback}>
    {children}
  </PermissionBasedAccess>
);

// Gate Pass Generation Access
export const GatePassAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionBasedAccess requiredPermissions={['GATE_PASS_GENERATE']} fallback={fallback}>
    {children}
  </PermissionBasedAccess>
);

// Lot Creation Access
export const LotCreationAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionBasedAccess requiredPermissions={['LOT_CREATE']} fallback={fallback}>
    {children}
  </PermissionBasedAccess>
);

// Inventory Management Access
export const InventoryManageAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionBasedAccess requiredPermissions={['INVENTORY_MANAGE']} fallback={fallback}>
    {children}
  </PermissionBasedAccess>
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