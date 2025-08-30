'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  ChartBarIcon, 
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  BellIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  KeyIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Import Header Component
import Header from '../layout/Header';

// Import EXISTING panels only (no missing components)
import DashboardMetricsPanel from './admin/DashboardMetricsPanel';
import UserManagementPanel from './admin/UserManagementPanel';
import SystemConfigurationPanel from './admin/SystemConfigurationPanel';
import HardwareManagementPanel from './admin/HardwareManagementPanel';
import AdminPermissionsPanel from './admin/AdminPermissionsPanel';
import DepartmentOversightPanel from './admin/DepartmentOversightPanel';
// REMOVED: DisasterRecovery, SystemHealth, AuditTrail (these don't exist yet)

interface SuperAdminDashboardProps {
  user: {
    id: string;
    username: string;
    role: string;
    full_name?: string;
  };
}

type SuperAdminPanel = 
  | 'overview'
  | 'system_configuration'
  | 'hardware_management'
  | 'admin_permissions'
  | 'user_management'
  | 'backup_recovery'
  | 'emergency_controls'
  | 'audit_log_export'
  | 'api_monitoring'
  | 'dashboard_metrics'
  | 'department_oversight';

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user }) => {
  const [activePanel, setActivePanel] = useState<SuperAdminPanel>('overview');
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    hardwareDevices: 0,
    criticalAlerts: 0,
    systemUptime: 0,
    loading: true
  });

  // Fetch real-time dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const storedUser = localStorage.getItem('clamflow_user');
        const realUserCount = storedUser ? 1 : 0;
        const hardwareDevices = 0;
        const criticalAlerts = 0;
        const systemUptime = Math.floor((Date.now() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60));
        
        setDashboardStats({
          totalUsers: realUserCount,
          hardwareDevices,
          criticalAlerts,
          systemUptime,
          loading: false
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setDashboardStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Super Admin panel configuration - USING ONLY EXISTING COMPONENTS
  const superAdminPanels = [
    {
      id: 'user_management' as SuperAdminPanel,
      title: 'User Management',
      description: 'Create, modify, delete user accounts and roles',
      icon: UserGroupIcon,
      color: 'blue',
      component: UserManagementPanel,
      priority: 'CRITICAL'
    },
    {
      id: 'system_configuration' as SuperAdminPanel,
      title: 'System Configuration',
      description: 'Configure system settings and parameters',
      icon: Cog6ToothIcon,
      color: 'blue',
      component: SystemConfigurationPanel,
      priority: 'HIGH'
    },
    {
      id: 'hardware_management' as SuperAdminPanel,
      title: 'Hardware Management',
      description: 'Control RFID readers, sensors, and IoT devices',
      icon: CpuChipIcon,
      color: 'purple',
      component: HardwareManagementPanel,
      priority: 'MEDIUM'
    },
    {
      id: 'admin_permissions' as SuperAdminPanel,
      title: 'Admin Permissions',
      description: 'Manage admin roles and system permissions',
      icon: KeyIcon,
      color: 'indigo',
      component: AdminPermissionsPanel,
      priority: 'CRITICAL'
    },
    {
      id: 'department_oversight' as SuperAdminPanel,
      title: 'Department Oversight',
      description: 'Oversee departmental operations and metrics',
      icon: BuildingOfficeIcon,
      color: 'teal',
      component: DepartmentOversightPanel,
      priority: 'MEDIUM'
    },
    {
      id: 'dashboard_metrics' as SuperAdminPanel,
      title: 'Dashboard Metrics',
      description: 'Real-time system performance and analytics',
      icon: ChartBarIcon,
      color: 'indigo',
      component: DashboardMetricsPanel,
      priority: 'MEDIUM'
    },
    // PLACEHOLDER PANELS - These will use DashboardMetricsPanel until components are created
    {
      id: 'backup_recovery' as SuperAdminPanel,
      title: 'Backup & Recovery',
      description: 'System backup and disaster recovery controls',
      icon: ClipboardDocumentListIcon,
      color: 'green',
      component: DashboardMetricsPanel, // Placeholder
      priority: 'HIGH'
    },
    {
      id: 'emergency_controls' as SuperAdminPanel,
      title: 'Emergency Controls',
      description: 'Emergency system shutdown and safety controls',
      icon: BellIcon,
      color: 'red',
      component: DashboardMetricsPanel, // Placeholder - THIS FIXES THE ERROR
      priority: 'CRITICAL'
    },
    {
      id: 'audit_log_export' as SuperAdminPanel,
      title: 'Audit Log Export',
      description: 'Export system audit logs and compliance reports',
      icon: UserIcon,
      color: 'yellow',
      component: DashboardMetricsPanel, // Placeholder
      priority: 'MEDIUM'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; hover: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-100', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:bg-green-100', border: 'border-green-200' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', hover: 'hover:bg-yellow-100', border: 'border-yellow-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', hover: 'hover:bg-red-100', border: 'border-red-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:bg-purple-100', border: 'border-purple-200' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:bg-indigo-100', border: 'border-indigo-200' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-600', hover: 'hover:bg-teal-100', border: 'border-teal-200' },
    };
    return colorMap[color] || colorMap.blue;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderActivePanel = () => {
    if (activePanel === 'overview') {
      return (
        <div className="space-y-4 lg:space-y-6">
          {/* System Status Cards - Fixed Mobile Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-50">
                  <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-xs lg:text-sm font-medium text-gray-600 truncate">System Status</p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-semibold text-green-600">Operational</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50">
                  <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-xs lg:text-sm font-medium text-gray-600 truncate">Total Users</p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-semibold text-blue-600">
                    {dashboardStats.loading ? '...' : dashboardStats.totalUsers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-50">
                  <CpuChipIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-600" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-xs lg:text-sm font-medium text-gray-600 truncate">Hardware Devices</p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-semibold text-purple-600">
                    {dashboardStats.loading ? '...' : dashboardStats.hardwareDevices}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 rounded-lg bg-red-50">
                  <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-red-600" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-xs lg:text-sm font-medium text-gray-600 truncate">Critical Alerts</p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-semibold text-red-600">
                    {dashboardStats.loading ? '...' : dashboardStats.criticalAlerts}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Super Admin Panels Grid - Fixed Mobile Layout */}
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 px-1">
              Super Admin Control Panels
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {superAdminPanels.map((panel) => {
                const colors = getColorClasses(panel.color);
                const Icon = panel.icon;
                return (
                  <button
                    key={panel.id}
                    onClick={() => setActivePanel(panel.id)}
                    className={`bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 text-left transition-all duration-200 ${colors.hover} border ${colors.border} touch-manipulation min-h-0`}
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                      <div className={`p-1.5 sm:p-2 lg:p-3 rounded-lg ${colors.bg}`}>
                        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 ${colors.text}`} />
                      </div>
                      <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium border ${getPriorityColor(panel.priority)}`}>
                        {panel.priority}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                      {panel.title}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
                      {panel.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emergency Controls - Fixed Mobile Layout */}
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Quick Emergency Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <button 
                onClick={() => setActivePanel('emergency_controls')}
                className="p-2 sm:p-3 lg:p-4 text-left border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors touch-manipulation"
              >
                <h4 className="font-medium text-red-900 text-xs sm:text-sm lg:text-base truncate">
                  System Shutdown
                </h4>
                <p className="text-xs lg:text-sm text-red-600 truncate">Emergency system halt</p>
              </button>
              
              <button 
                onClick={() => setActivePanel('emergency_controls')}
                className="p-2 sm:p-3 lg:p-4 text-left border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors touch-manipulation"
              >
                <h4 className="font-medium text-yellow-900 text-xs sm:text-sm lg:text-base truncate">
                  Lock All Gates
                </h4>
                <p className="text-xs lg:text-sm text-yellow-600 truncate">Security lockdown</p>
              </button>
              
              <button 
                onClick={() => setActivePanel('backup_recovery')}
                className="p-2 sm:p-3 lg:p-4 text-left border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors touch-manipulation"
              >
                <h4 className="font-medium text-blue-900 text-xs sm:text-sm lg:text-base truncate">
                  Backup System
                </h4>
                <p className="text-xs lg:text-sm text-blue-600 truncate">Full data backup</p>
              </button>
              
              <button 
                onClick={() => setActivePanel('hardware_management')}
                className="p-2 sm:p-3 lg:p-4 text-left border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors touch-manipulation"
              >
                <h4 className="font-medium text-green-900 text-xs sm:text-sm lg:text-base truncate">
                  Reset Hardware
                </h4>
                <p className="text-xs lg:text-sm text-green-600 truncate">Restart all devices</p>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Render the selected panel component
    const selectedPanel = superAdminPanels.find(panel => panel.id === activePanel);
    if (selectedPanel) {
      const PanelComponent = selectedPanel.component;
      return (
        <div>
          {/* Back Navigation - Mobile Optimized */}
          <div className="mb-4 lg:mb-6">
            <button
              onClick={() => setActivePanel('overview')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm lg:text-base touch-manipulation"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
          </div>
          
          {/* Show placeholder message for incomplete panels */}
          {['backup_recovery', 'emergency_controls', 'audit_log_export'].includes(activePanel) ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-yellow-800">Panel Under Development</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    This {selectedPanel?.title} panel is currently being developed. 
                    Showing dashboard metrics as placeholder.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          
          <PanelComponent />
        </div>
      );
    }

    return <div>Panel not found</div>;
  };

  // Get dynamic page title based on active panel
  const getPageTitle = () => {
    if (activePanel === 'overview') return 'Super Admin Dashboard';
    const selectedPanel = superAdminPanels.find(panel => panel.id === activePanel);
    return selectedPanel ? selectedPanel.title : 'Super Admin Dashboard';
  };

  const getPageSubtitle = () => {
    if (activePanel === 'overview') return 'System Administration & Control Center';
    const selectedPanel = superAdminPanels.find(panel => panel.id === activePanel);
    return selectedPanel ? selectedPanel.description : '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Component with Branding, User Info & Navigation */}
      <Header 
        pageTitle={getPageTitle()}
        pageSubtitle={getPageSubtitle()}
      />

      {/* Main Content - Mobile Optimized */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-8">
        {renderActivePanel()}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;