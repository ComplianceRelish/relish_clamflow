"use client";

import React, { useState, useEffect } from 'react';
import {
  Activity,
  User,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  LogIn,
  LogOut,
  CheckCircle,
  FileText,
  Settings,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Download,
  Eye,
  MoreHorizontal
} from 'lucide-react';

interface UserActivity {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  role: string;
  department: string;
  activity_type: 'login' | 'logout' | 'approval' | 'task_completion' | 'data_access' | 'settings_change' | 'error' | 'file_upload';
  action: string;
  description: string;
  timestamp: string;
  ip_address: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  location: string;
  status: 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
  session_duration?: number;
}

interface ActivityStats {
  total_activities: number;
  unique_users: number;
  avg_session_duration: number;
  peak_hour: string;
  most_active_department: string;
  login_success_rate: number;
}

interface UserActivitiesPanelProps {
  onClose?: () => void;
}

const UserActivitiesPanel: React.FC<UserActivitiesPanelProps> = ({ onClose }) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    total_activities: 0,
    unique_users: 0,
    avg_session_duration: 0,
    peak_hour: '',
    most_active_department: '',
    login_success_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d'>('today');
  const [selectedActivity, setSelectedActivity] = useState<UserActivity | null>(null);
  const [showActivityDetails, setShowActivityDetails] = useState(false);

  const activityTypes = [
    { value: 'login', label: 'Login', icon: LogIn },
    { value: 'logout', label: 'Logout', icon: LogOut },
    { value: 'approval', label: 'Approval', icon: CheckCircle },
    { value: 'task_completion', label: 'Task Completion', icon: FileText },
    { value: 'data_access', label: 'Data Access', icon: Eye },
    { value: 'settings_change', label: 'Settings Change', icon: Settings },
    { value: 'error', label: 'Error', icon: AlertTriangle },
    { value: 'file_upload', label: 'File Upload', icon: FileText }
  ];

  const departments = [
    'Processing',
    'Quality Control',
    'Packaging',
    'Shipping',
    'Maintenance',
    'Administration'
  ];

  // Fetch user activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/admin/user-activities?range=${dateRange}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
          setStats(data.stats || {});
        } else {
          // Fallback demo data
          const demoActivities: UserActivity[] = [
            {
              id: '1',
              user_id: 'u1',
              username: 'SA_Williams',
              full_name: 'Sarah Williams',
              role: 'QC Lead',
              department: 'Quality Control',
              activity_type: 'login',
              action: 'User Login',
              description: 'Successful login from QC workstation',
              timestamp: new Date(Date.now() - 300000).toISOString(),
              ip_address: '192.168.1.45',
              device_type: 'desktop',
              location: 'QC Lab - Station 2',
              status: 'success',
              session_duration: 240
            },
            {
              id: '2',
              user_id: 'u2',
              username: 'PL_Johnson',
              full_name: 'Michael Johnson',
              role: 'Production Lead',
              department: 'Processing',
              activity_type: 'approval',
              action: 'Request Approved',
              description: 'Approved staff onboarding request for new QC technician',
              timestamp: new Date(Date.now() - 600000).toISOString(),
              ip_address: '192.168.1.23',
              device_type: 'desktop',
              location: 'Processing Floor Office',
              status: 'success',
              metadata: {
                request_type: 'staff_onboarding',
                approved_user: 'John Peterson'
              }
            },
            {
              id: '3',
              user_id: 'u3',
              username: 'SL_Brown',
              full_name: 'David Brown',
              role: 'Staff Lead',
              department: 'Packaging',
              activity_type: 'task_completion',
              action: 'Task Completed',
              description: 'Completed packaging line inspection and safety check',
              timestamp: new Date(Date.now() - 900000).toISOString(),
              ip_address: '192.168.1.67',
              device_type: 'mobile',
              location: 'Packaging Area B',
              status: 'success',
              metadata: {
                task_id: 'PKG-001',
                inspection_score: 95
              }
            },
            {
              id: '4',
              user_id: 'u4',
              username: 'admin',
              full_name: 'Admin User',
              role: 'Admin',
              department: 'Administration',
              activity_type: 'settings_change',
              action: 'Settings Modified',
              description: 'Updated department permissions for QC Lead role',
              timestamp: new Date(Date.now() - 1200000).toISOString(),
              ip_address: '192.168.1.10',
              device_type: 'desktop',
              location: 'Admin Office',
              status: 'success',
              metadata: {
                setting_type: 'permissions',
                affected_role: 'QC Lead'
              }
            },
            {
              id: '5',
              user_id: 'u5',
              username: 'QC_Martinez',
              full_name: 'Carlos Martinez',
              role: 'QC Lead',
              department: 'Quality Control',
              activity_type: 'error',
              action: 'Login Failed',
              description: 'Failed login attempt - incorrect password',
              timestamp: new Date(Date.now() - 1500000).toISOString(),
              ip_address: '192.168.1.89',
              device_type: 'desktop',
              location: 'QC Lab - Station 1',
              status: 'error',
              metadata: {
                error_type: 'authentication_failure',
                attempt_count: 3
              }
            },
            {
              id: '6',
              user_id: 'u6',
              username: 'LL_Rodriguez',
              full_name: 'Lisa Rodriguez',
              role: 'Logistics Lead',
              department: 'Shipping',
              activity_type: 'data_access',
              action: 'Report Generated',
              description: 'Generated monthly shipping performance report',
              timestamp: new Date(Date.now() - 1800000).toISOString(),
              ip_address: '192.168.1.34',
              device_type: 'desktop',
              location: 'Shipping Office',
              status: 'success',
              metadata: {
                report_type: 'shipping_performance',
                date_range: '2025-07-01 to 2025-07-31'
              }
            }
          ];

          const demoStats: ActivityStats = {
            total_activities: 234,
            unique_users: 45,
            avg_session_duration: 185,
            peak_hour: '10:00 AM',
            most_active_department: 'Processing',
            login_success_rate: 96.5
          };

          setActivities(demoActivities);
          setStats(demoStats);
        }
      } catch (error) {
        console.error('Failed to fetch user activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [dateRange]);

  // Filter activities
  useEffect(() => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.activity_type === filterType);
    }

    if (filterDepartment !== 'all') {
      filtered = filtered.filter(activity => activity.department === filterDepartment);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(activity => activity.status === filterStatus);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredActivities(filtered);
  }, [activities, searchTerm, filterType, filterDepartment, filterStatus]);

  // Get activity icon
  const getActivityIcon = (type: string) => {
    const activityType = activityTypes.find(t => t.value === type);
    return activityType?.icon || Activity;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  // Get device icon
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return Smartphone;
      case 'tablet': return Smartphone;
      default: return Monitor;
    }
  };

  // Export activities
  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Role', 'Department', 'Activity', 'Description', 'Status', 'IP Address', 'Device', 'Location'],
      ...filteredActivities.map(activity => [
        new Date(activity.timestamp).toLocaleString(),
        activity.full_name,
        activity.role,
        activity.department,
        activity.action,
        activity.description,
        activity.status,
        activity.ip_address,
        activity.device_type,
        activity.location
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_activities_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Activity Details Modal
  const ActivityDetailsModal = () => {
    if (!selectedActivity) return null;

    const IconComponent = getActivityIcon(selectedActivity.activity_type);
    const DeviceIcon = getDeviceIcon(selectedActivity.device_type);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                selectedActivity.status === 'success' ? 'bg-green-100 text-green-600' :
                selectedActivity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedActivity.action}</h3>
                <p className="text-sm text-gray-600">{selectedActivity.full_name}</p>
              </div>
            </div>
            <button
              onClick={() => setShowActivityDetails(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Activity Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{selectedActivity.activity_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedActivity.status)}`}>
                        {selectedActivity.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timestamp:</span>
                      <span className="font-medium">{new Date(selectedActivity.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">User Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Username:</span>
                      <span className="font-medium">{selectedActivity.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium">{selectedActivity.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{selectedActivity.department}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Session Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">IP Address:</span>
                      <span className="font-medium">{selectedActivity.ip_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Device:</span>
                      <div className="flex items-center space-x-1">
                        <DeviceIcon className="w-4 h-4" />
                        <span className="font-medium capitalize">{selectedActivity.device_type}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{selectedActivity.location}</span>
                    </div>
                    {selectedActivity.session_duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{selectedActivity.session_duration}m</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedActivity.metadata && (
                  <div>
                    <h4 className="font-semibold mb-2">Additional Data</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(selectedActivity.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Description:</strong> {selectedActivity.description}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end p-6 border-t">
            <button
              onClick={() => setShowActivityDetails(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
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
          <h2 className="text-2xl font-bold text-gray-900">User Activities</h2>
          <p className="text-sm text-gray-600">Monitor user actions and system interactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as 'today' | '7d' | '30d')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Activities</p>
              <p className="text-xl font-bold text-blue-900">{stats.total_activities}</p>
            </div>
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Unique Users</p>
              <p className="text-xl font-bold text-green-900">{stats.unique_users}</p>
            </div>
            <User className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Avg Session</p>
              <p className="text-xl font-bold text-purple-900">{stats.avg_session_duration}m</p>
            </div>
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Peak Hour</p>
              <p className="text-lg font-bold text-orange-900">{stats.peak_hour}</p>
            </div>
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">Most Active</p>
              <p className="text-sm font-bold text-indigo-900">{stats.most_active_department}</p>
            </div>
            <MapPin className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        <div className="bg-teal-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-teal-600">Login Success</p>
              <p className="text-xl font-bold text-teal-900">{stats.login_success_rate}%</p>
            </div>
            <LogIn className="w-6 h-6 text-teal-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search activities by user, action, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          {activityTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Activities List */}
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredActivities.map((activity) => {
            const IconComponent = getActivityIcon(activity.activity_type);
            const DeviceIcon = getDeviceIcon(activity.device_type);
            
            return (
              <div key={activity.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-100 text-green-600' :
                    activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-smFont-medium text-gray-900">
                          {activity.full_name} • {activity.action}
                        </p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status.toUpperCase()}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setShowActivityDetails(true);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{activity.role}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{activity.department}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DeviceIcon className="w-3 h-3" />
                        <span>{activity.device_type}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
        </div>
      )}

      {/* Activity Details Modal */}
      {showActivityDetails && <ActivityDetailsModal />}
    </div>
  );
};

export default UserActivitiesPanel;