"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  Building2, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  UserPlus,
  FileCheck,
  BarChart3,
  Settings,
  Calendar,
  Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LeadManagementPanel from './admin/LeadManagementPanel';
import ApprovalWorkflowPanel from './admin/ApprovalWorkflowPanel';
import DepartmentOversightPanel from './admin/DepartmentOversightPanel';
import AdminAnalytics from './admin/AdminAnalytics';
import ShiftManagementPanel from './admin/ShiftManagementPanel';
import AdminSettingsPanel from './admin/AdminSettingsPanel';

interface AdminStats {
  totalLeads: number;
  activeLeads: number;
  pendingApprovals: number;
  departmentsManaged: number;
  todayActivity: number;
  urgentIssues: number;
}

interface DashboardModule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  stats?: string;
  component: React.ComponentType<any>;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalLeads: 0,
    activeLeads: 0,
    pendingApprovals: 0,
    departmentsManaged: 0,
    todayActivity: 0,
    urgentIssues: 0
  });
  const [loading, setLoading] = useState(true);

  // Admin Dashboard Modules
  const modules: DashboardModule[] = [
    {
      id: 'lead-management',
      title: 'Lead Management',
      description: 'Create, assign and manage department leads',
      icon: Users,
      color: 'bg-blue-500',
      stats: `${stats.activeLeads}/${stats.totalLeads} Active`,
      component: LeadManagementPanel
    },
    {
      id: 'approval-workflow',
      title: 'Approval Workflows',
      description: 'Review and process pending approvals',
      icon: CheckCircle,
      color: 'bg-green-500',
      stats: `${stats.pendingApprovals} Pending`,
      component: ApprovalWorkflowPanel
    },
    {
      id: 'department-oversight',
      title: 'Department Oversight',
      description: 'Monitor department performance and operations',
      icon: Building2,
      color: 'bg-purple-500',
      stats: `${stats.departmentsManaged} Departments`,
      component: DepartmentOversightPanel
    },
    {
      id: 'admin-analytics',
      title: 'Analytics & Reports',
      description: 'Department analytics and performance metrics',
      icon: BarChart3,
      color: 'bg-orange-500',
      stats: `${stats.todayActivity} Today`,
      component: AdminAnalytics
    },
    {
      id: 'shift-management',
      title: 'Shift Management',
      description: 'Schedule leads and manage shift coverage',
      icon: Calendar,
      color: 'bg-indigo-500',
      stats: 'Schedule & Coverage',
      component: ShiftManagementPanel
    },
    {
      id: 'admin-settings',
      title: 'Admin Settings',
      description: 'Configure admin permissions and preferences',
      icon: Settings,
      color: 'bg-gray-500',
      stats: 'Configuration',
      component: AdminSettingsPanel
    }
  ];

  // Fetch admin dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('clamflow_token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Fallback demo data
          setStats({
            totalLeads: 12,
            activeLeads: 9,
            pendingApprovals: 5,
            departmentsManaged: 4,
            todayActivity: 23,
            urgentIssues: 2
          });
        }
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        // Use fallback data
        setStats({
          totalLeads: 12,
          activeLeads: 9,
          pendingApprovals: 5,
          departmentsManaged: 4,
          todayActivity: 23,
          urgentIssues: 2
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Close active module
  const closeModule = () => {
    setActiveModule(null);
  };

  // Render active module
  const renderActiveModule = () => {
    const module = modules.find(m => m.id === activeModule);
    if (!module) return null;

    const Component = module.component;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${module.color} text-white`}>
                <module.icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{module.title}</h2>
                <p className="text-sm text-gray-600">{module.description}</p>
              </div>
            </div>
            <button
              onClick={closeModule}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <Component onClose={closeModule} />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.full_name || user?.username} • Department Management & Lead Oversight
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-6">
              {stats.urgentIssues > 0 && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">{stats.urgentIssues} Urgent</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-blue-600">
                <Activity className="w-5 h-5" />
                <span className="text-sm font-medium">{stats.todayActivity} Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Leads</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeLeads}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.departmentsManaged}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Activity</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayActivity}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 p-6 text-left group hover:scale-105 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${module.color} text-white group-hover:scale-110 transition-transform`}>
                  <module.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Admin
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                {module.title}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {module.description}
              </p>
              
              {module.stats && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{module.stats}</span>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" 
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Admin Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { action: 'Approved staff onboarding request', user: 'John Smith', time: '5 minutes ago', type: 'approval' },
                { action: 'Assigned QC Lead to Processing Dept', user: 'Sarah Johnson', time: '12 minutes ago', type: 'assignment' },
                { action: 'Updated department performance targets', user: 'Admin', time: '1 hour ago', type: 'update' },
                { action: 'Created new shift schedule', user: 'Mike Chen', time: '2 hours ago', type: 'schedule' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'approval' ? 'bg-green-100 text-green-600' :
                    activity.type === 'assignment' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'update' ? 'bg-orange-100 text-orange-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {activity.type === 'approval' && <CheckCircle className="w-4 h-4" />}
                    {activity.type === 'assignment' && <UserPlus className="w-4 h-4" />}
                    {activity.type === 'update' && <Settings className="w-4 h-4" />}
                    {activity.type === 'schedule' && <Calendar className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.user} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Render Active Module */}
      {activeModule && renderActiveModule()}
    </div>
  );
};

export default AdminDashboard;