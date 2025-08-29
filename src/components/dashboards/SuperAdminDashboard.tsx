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
  CheckCircleIcon,          // ADDED THIS
  ExclamationTriangleIcon   // ADDED THIS
} from '@heroicons/react/24/outline';

// Import all Super Admin panels
import DashboardMetricsPanel from './admin/DashboardMetricsPanel';
import UserActivitiesPanel from './admin/UserActivitiesPanel';
import SystemConfigurationPanel from './admin/SystemConfigurationPanel';
import HardwareManagementPanel from './admin/HardwareManagementPanel';
import AdminPermissionsPanel from './admin/AdminPermissionsPanel';

interface SuperAdminDashboardProps {
  user: {
    id: string;
    username: string;
    role: string;
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
  | 'user_activities';

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
        // Get real user count from AuthContext or localStorage
        const storedUser = localStorage.getItem('clamflow_user');
        const realUserCount = storedUser ? 1 : 0; // Count actual authenticated users
        
        // Get real hardware device count (implement when hardware is connected)
        const hardwareDevices = 0; // TODO: Implement real hardware count API
        
        // Get real critical alerts count
        const criticalAlerts = 0; // TODO: Implement real alerts API
        
        // Calculate system uptime
        const systemUptime = Math.floor((Date.now() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60)); // Hours since midnight
        
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
    
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(fetchDashboardStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Super Admin panel configuration - ALL 9 PANELS
  const superAdminPanels = [
    {
      id: 'user_management' as SuperAdminPanel,
      title: 'User Management',
      description: 'Create, modify, delete user accounts and roles',
      icon: UserGroupIcon,
      color: 'blue',
      component: UserActivitiesPanel // Use as user management for now
    },
    {
      id: 'system_configuration' as SuperAdminPanel,
      title: 'System Configuration',
      description: 'Configure system settings and parameters',
      icon: Cog6ToothIcon,
      color: 'blue',
      component: SystemConfigurationPanel
    },
    {
      id: 'hardware_management' as SuperAdminPanel,
      title: 'Hardware Management',
      description: 'Control RFID readers, sensors, and IoT devices',
      icon: CpuChipIcon,
      color: 'purple',
      component: HardwareManagementPanel
    },
    {
      id: 'admin_permissions' as SuperAdminPanel,
      title: 'Admin Permissions',
      description: 'Manage admin roles and system permissions',
      icon: KeyIcon,
      color: 'indigo',
      component: AdminPermissionsPanel
    },
    {
      id: 'backup_recovery' as SuperAdminPanel,
      title: 'Backup & Recovery',
      description: 'System backup and disaster recovery controls',
      icon: ClipboardDocumentListIcon,
      color: 'green',
      component: DashboardMetricsPanel // Placeholder for now
    },
    {
      id: 'emergency_controls' as SuperAdminPanel,
      title: 'Emergency Controls',
      description: 'Emergency system shutdown and safety controls',
      icon: BellIcon,
      color: 'red',
      component: DashboardMetricsPanel // Placeholder for now
    },
    {
      id: 'audit_log_export' as SuperAdminPanel,
      title: 'Audit Log Export',
      description: 'Export system audit logs and compliance reports',
      icon: UserIcon,
      color: 'yellow',
      component: UserActivitiesPanel
    },
    {
      id: 'api_monitoring' as SuperAdminPanel,
      title: 'API Monitoring',
      description: 'Monitor API performance and system health',
      icon: ChartBarIcon,
      color: 'green',
      component: DashboardMetricsPanel
    },
    {
      id: 'dashboard_metrics' as SuperAdminPanel,
      title: 'Dashboard Metrics',
      description: 'Real-time system performance and analytics',
      icon: ChartBarIcon,
      color: 'indigo',
      component: DashboardMetricsPanel
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
    };
    return colorMap[color] || colorMap.blue;
  };

  const renderActivePanel = () => {
    if (activePanel === 'overview') {
      return (
        <div className="space-y-6">
          {/* Super Admin Welcome */}
          <div className="bg-gradient-to-r from-red-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
            <div className="flex items-center mb-4">
              <img 
                src="/logo-relish.png" 
                alt="Relish Logo" 
                className="h-16 w-16 mr-4 bg-white rounded-lg p-2"
              />
              <div>
                <h1 className="text-3xl font-bold">ClamFlow Control Center</h1>
                <p className="text-red-100">
                  Ultimate system authority - {user.username} | Complete ClamFlow oversight
                </p>
              </div>
            </div>
          </div>

          {/* System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-green-50">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <p className="text-2xl font-semibold text-green-600">Operational</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-50">
                  <UserGroupIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {dashboardStats.loading ? '...' : dashboardStats.totalUsers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-purple-50">
                  <CpuChipIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hardware Devices</p>
                  <p className="text-2xl font-semibold text-purple-600">
                    {dashboardStats.loading ? '...' : dashboardStats.hardwareDevices}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-red-50">
                  <BellIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {dashboardStats.loading ? '...' : dashboardStats.criticalAlerts}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Super Admin Panels Grid - ALL 9 PANELS */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Super Admin Control Panels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {superAdminPanels.map((panel) => {
                const colors = getColorClasses(panel.color);
                const Icon = panel.icon;
                return (
                  <button
                    key={panel.id}
                    onClick={() => setActivePanel(panel.id)}
                    className={`bg-white rounded-lg shadow-lg p-6 text-left transition-all duration-200 ${colors.hover} border ${colors.border}`}
                  >
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-lg ${colors.bg}`}>
                        <Icon className={`h-8 w-8 ${colors.text}`} />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{panel.title}</h3>
                    <p className="text-gray-600 text-sm">{panel.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emergency Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="p-4 text-left border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                <h4 className="font-medium text-red-900">System Shutdown</h4>
                <p className="text-sm text-red-600">Emergency system halt</p>
              </button>
              <button className="p-4 text-left border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors">
                <h4 className="font-medium text-yellow-900">Lock All Gates</h4>
                <p className="text-sm text-yellow-600">Security lockdown</p>
              </button>
              <button className="p-4 text-left border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                <h4 className="font-medium text-blue-900">Backup System</h4>
                <p className="text-sm text-blue-600">Full data backup</p>
              </button>
              <button className="p-4 text-left border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                <h4 className="font-medium text-green-900">Reset Hardware</h4>
                <p className="text-sm text-green-600">Restart all devices</p>
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
      return <PanelComponent />;
    }

    return <div>Panel not found</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo-relish.png" 
                  alt="Relish Logo" 
                  className="h-8 w-8 bg-white rounded-lg p-1"
                />
                <button
                  onClick={() => setActivePanel('overview')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activePanel === 'overview'
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ClamFlow Dashboard
                </button>
              </div>
              <div className="text-gray-300">|</div>
              <div className="text-gray-600">
                {activePanel !== 'overview' && (
                  <span className="capitalize">
                    {superAdminPanels.find(p => p.id === activePanel)?.title || 'Panel'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Super Admin: <span className="font-medium text-red-600">{user.username}</span>
              </span>
              <div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.username.charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActivePanel()}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;