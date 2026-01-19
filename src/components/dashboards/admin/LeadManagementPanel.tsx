"use client";

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  Calendar,
  Activity,
  MoreHorizontal,
  UserCheck,
  UserX,
  Settings,
  Award,
  Target,
  TrendingUp
} from 'lucide-react';

interface Lead {
  id: string;
  username: string;
  full_name: string;
  role: 'Production Lead' | 'QC Lead' | 'Staff Lead' | 'Shift Lead';
  department: string;
  station: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'on_leave';
  hire_date: string;
  last_login: string;
  performance_score: number;
  team_size: number;
  current_shift: string;
  achievements: string[];
  metrics: {
    tasks_completed: number;
    team_efficiency: number;
    quality_score: number;
    attendance_rate: number;
  };
}

interface LeadManagementPanelProps {
  onClose?: () => void;
}

const LeadManagementPanel: React.FC<LeadManagementPanelProps> = ({ onClose }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetails, setShowLeadDetails] = useState(false);

  // Departments from your backend structure
  const departments = [
    'Processing',
    'Quality Control',
    'Packaging',
    'Shipping',
    'Maintenance',
    'Administration'
  ];

  const leadRoles = [
    'Production Lead',
    'QC Lead', 
    'Staff Lead',
    'Shift Lead'
  ];

  // Fetch leads data
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/admin/leads', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('clamflow_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setLeads(data.leads || []);
        } else {
          // Production: No fallback - show empty state
          console.error('Failed to fetch leads - API returned error');
          setLeads([]);
        }
      } catch (error) {
        console.error('Failed to fetch leads:', error);
        // Use fallback data on error
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Filter leads based on search and filters
  useEffect(() => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(lead => lead.role === filterRole);
    }

    if (filterDepartment !== 'all') {
      filtered = filtered.filter(lead => lead.department === filterDepartment);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === filterStatus);
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, filterRole, filterDepartment, filterStatus]);

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Production Lead': return 'bg-blue-100 text-blue-800';
      case 'QC Lead': return 'bg-purple-100 text-purple-800';
      case 'Staff Lead': return 'bg-indigo-100 text-indigo-800';
      case 'Shift Lead': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format last login time
  const formatLastLogin = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Handle lead details view
  const viewLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadDetails(true);
  };

  // Create Lead Form Component
  const CreateLeadForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Create New Lead</h3>
          <button
            onClick={() => setShowCreateForm(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Role</option>
                {leadRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter station/location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1-555-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Shift</option>
                <option value="Morning (6AM-2PM)">Morning (6AM-2PM)</option>
                <option value="Day (8AM-4PM)">Day (8AM-4PM)</option>
                <option value="Afternoon (2PM-10PM)">Afternoon (2PM-10PM)</option>
                <option value="Evening (4PM-12AM)">Evening (4PM-12AM)</option>
                <option value="Night (10PM-6AM)">Night (10PM-6AM)</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Lead Details Modal
  const LeadDetailsModal = () => {
    if (!selectedLead) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedLead.full_name}</h3>
                <p className="text-sm text-gray-600">{selectedLead.role} • {selectedLead.department}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLeadDetails(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedLead.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedLead.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedLead.station}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedLead.current_shift}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Status & Role</h4>
                  <div className="space-y-2">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLead.status)}`}>
                      {selectedLead.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedLead.role)}`}>
                      {selectedLead.role}
                    </span>
                    <div className="text-sm text-gray-600">
                      <p>Team Size: {selectedLead.team_size} members</p>
                      <p>Hire Date: {new Date(selectedLead.hire_date).toLocaleDateString()}</p>
                      <p>Last Login: {formatLastLogin(selectedLead.last_login)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h4 className="font-semibold mb-4">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Overall Score</p>
                          <p className="text-2xl font-bold text-blue-900">{selectedLead.performance_score}%</p>
                        </div>
                        <Award className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium">Team Efficiency</p>
                          <p className="text-2xl font-bold text-green-900">{selectedLead.metrics.team_efficiency}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Quality Score</p>
                          <p className="text-2xl font-bold text-purple-900">{selectedLead.metrics.quality_score}%</p>
                        </div>
                        <Target className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Attendance</p>
                          <p className="text-2xl font-bold text-orange-900">{selectedLead.metrics.attendance_rate}%</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Achievements</h4>
                  <div className="space-y-2">
                    {selectedLead.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <Award className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Recent Activity</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Completed {selectedLead.metrics.tasks_completed} tasks this month</p>
                        <p className="text-xs text-gray-600">Updated 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Users className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Team meeting scheduled for tomorrow</p>
                        <p className="text-xs text-gray-600">Created 4 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 p-6 border-t">
            <button
              onClick={() => setShowLeadDetails(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Edit Lead
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
          <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
          <p className="text-sm text-gray-600">Manage department leads and their assignments</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5" />
          <span>Create Lead</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search leads by name, username, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          {leadRoles.map(role => (
            <option key={role} value={role}>{role}</option>
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on_leave">On Leave</option>
        </select>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <div key={lead.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{lead.full_name}</h3>
                  <p className="text-sm text-gray-600">@{lead.username}</p>
                </div>
              </div>
              <div className="relative">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(lead.role)}`}>
                  {lead.role}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                  {lead.status.replace('_', ' ')}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4" />
                  <span>{lead.department}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{lead.team_size} team members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{lead.current_shift}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-sm">
                  <span className="text-gray-600">Performance: </span>
                  <span className="font-semibold text-green-600">{lead.performance_score}%</span>
                </div>
                <div className="text-xs text-gray-500">
                  Last active: {formatLastLogin(lead.last_login)}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => viewLeadDetails(lead)}
                className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                View Details
              </button>
              <button className="px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or create a new lead.</p>
        </div>
      )}

      {/* Modals */}
      {showCreateForm && <CreateLeadForm />}
      {showLeadDetails && <LeadDetailsModal />}
    </div>
  );
};

export default LeadManagementPanel;