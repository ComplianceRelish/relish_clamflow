"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  Building2,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Download,
  Calendar,
  Filter
} from 'lucide-react';

interface SystemMetrics {
  total_users: number;
  active_users: number;
  user_growth: number;
  total_departments: number;
  active_requests: number;
  completed_today: number;
  system_uptime: number;
  database_size: string;
  api_calls_today: number;
  error_rate: number;
  avg_response_time: number;
  storage_used: number;
}

interface DepartmentMetric {
  name: string;
  efficiency: number;
  staff_count: number;
  active_tasks: number;
  completion_rate: number;
  status: 'optimal' | 'good' | 'needs_attention' | 'critical';
}

interface RealtimeActivity {
  id: string;
  type: 'user_login' | 'approval_request' | 'task_completion' | 'system_alert' | 'data_export';
  user: string;
  action: string;
  timestamp: string;
  department?: string;
  status: 'success' | 'warning' | 'error';
}

interface DashboardMetricsPanelProps {
  onClose?: () => void;
}

const DashboardMetricsPanel: React.FC<DashboardMetricsPanelProps> = ({ onClose }) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    total_users: 0,
    active_users: 0,
    user_growth: 0,
    total_departments: 0,
    active_requests: 0,
    completed_today: 0,
    system_uptime: 0,
    database_size: '0 MB',
    api_calls_today: 0,
    error_rate: 0,
    avg_response_time: 0,
    storage_used: 0
  });
  
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetric[]>([]);
  const [realtimeActivity, setRealtimeActivity] = useState<RealtimeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Fetch dashboard metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-metrics', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics);
          setDepartmentMetrics(data.department_metrics || []);
          setRealtimeActivity(data.realtime_activity || []);
        } else {
          // Fallback demo data
          const demoMetrics: SystemMetrics = {
            total_users: 127,
            active_users: 89,
            user_growth: 12.5,
            total_departments: 6,
            active_requests: 23,
            completed_today: 156,
            system_uptime: 99.8,
            database_size: '2.4 GB',
            api_calls_today: 15420,
            error_rate: 0.02,
            avg_response_time: 145,
            storage_used: 78
          };

          const demoDepartments: DepartmentMetric[] = [
            {
              name: 'Processing',
              efficiency: 94,
              staff_count: 28,
              active_tasks: 12,
              completion_rate: 89,
              status: 'optimal'
            },
            {
              name: 'Quality Control',
              efficiency: 97,
              staff_count: 12,
              active_tasks: 8,
              completion_rate: 95,
              status: 'optimal'
            },
            {
              name: 'Packaging',
              efficiency: 82,
              staff_count: 20,
              active_tasks: 15,
              completion_rate: 76,
              status: 'needs_attention'
            },
            {
              name: 'Shipping',
              efficiency: 91,
              staff_count: 15,
              active_tasks: 6,
              completion_rate: 92,
              status: 'good'
            },
            {
              name: 'Maintenance',
              efficiency: 88,
              staff_count: 8,
              active_tasks: 4,
              completion_rate: 85,
              status: 'good'
            },
            {
              name: 'Administration',
              efficiency: 95,
              staff_count: 6,
              active_tasks: 3,
              completion_rate: 98,
              status: 'optimal'
            }
          ];

          const demoActivity: RealtimeActivity[] = [
            {
              id: '1',
              type: 'user_login',
              user: 'Sarah Williams',
              action: 'Logged in from QC workstation',
              timestamp: new Date(Date.now() - 300000).toISOString(),
              department: 'Quality Control',
              status: 'success'
            },
            {
              id: '2',
              type: 'approval_request',
              user: 'Michael Johnson',
              action: 'Submitted staff onboarding request',
              timestamp: new Date(Date.now() - 600000).toISOString(),
              department: 'Processing',
              status: 'success'
            },
            {
              id: '3',
              type: 'task_completion',
              user: 'David Brown',
              action: 'Completed packaging line inspection',
              timestamp: new Date(Date.now() - 900000).toISOString(),
              department: 'Packaging',
              status: 'success'
            },
            {
              id: '4',
              type: 'system_alert',
              user: 'System',
              action: 'Database backup completed successfully',
              timestamp: new Date(Date.now() - 1200000).toISOString(),
              status: 'success'
            },
            {
              id: '5',
              type: 'data_export',
              user: 'Lisa Rodriguez',
              action: 'Generated monthly shipping report',
              timestamp: new Date(Date.now() - 1500000).toISOString(),
              department: 'Shipping',
              status: 'success'
            }
          ];

          setMetrics(demoMetrics);
          setDepartmentMetrics(demoDepartments);
          setRealtimeActivity(demoActivity);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
      } finally {
        setLoading(false);
        setLastRefresh(new Date());
      }
    };

    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Get status color for departments
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'needs_attention': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login': return Users;
      case 'approval_request': return CheckCircle;
      case 'task_completion': return Target;
      case 'system_alert': return AlertTriangle;
      case 'data_export': return Download;
      default: return Activity;
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Manual refresh handler
  const handleRefresh = () => {
    setLoading(true);
    // Trigger useEffect refresh
    setLastRefresh(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Metrics</h2>
          <p className="text-sm text-gray-600">Real-time system performance and analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-gray-500">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.total_users}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{metrics.user_growth}%</span>
              </div>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Users</p>
              <p className="text-2xl font-bold text-green-900">{metrics.active_users}</p>
              <p className="text-sm text-green-600">
                {Math.round((metrics.active_users / metrics.total_users) * 100)}% online
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Completed Today</p>
              <p className="text-2xl font-bold text-purple-900">{metrics.completed_today}</p>
              <p className="text-sm text-purple-600">Tasks & Requests</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">System Uptime</p>
              <p className="text-2xl font-bold text-orange-900">{metrics.system_uptime}%</p>
              <p className="text-sm text-orange-600">Last 30 days</p>
            </div>
            <Zap className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* System Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">System Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Database Size</span>
              </div>
              <span className="text-sm text-gray-900">{metrics.database_size}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">API Calls Today</span>
              </div>
              <span className="text-sm text-gray-900">{metrics.api_calls_today.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium">Error Rate</span>
              </div>
              <span className="text-sm text-gray-900">{metrics.error_rate}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Avg Response Time</span>
              </div>
              <span className="text-sm text-gray-900">{metrics.avg_response_time}ms</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">Storage Used</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ width: `${metrics.storage_used}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-900">{metrics.storage_used}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Real-time Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {realtimeActivity.map((activity) => {
              const IconComponent = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                  <div className={`p-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-100 text-green-600' :
                    activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                      {activity.department && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{activity.department}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Department Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentMetrics.map((dept) => (
            <div key={dept.name} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dept.status)}`}>
                  {dept.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Efficiency:</span>
                  <span className="font-medium">{dept.efficiency}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Staff:</span>
                  <span className="font-medium">{dept.staff_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Tasks:</span>
                  <span className="font-medium">{dept.active_tasks}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completion Rate:</span>
                  <span className="font-medium">{dept.completion_rate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardMetricsPanel;