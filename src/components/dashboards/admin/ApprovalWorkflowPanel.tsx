"use client";

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Filter,
  Search,
  Eye,
  MessageSquare,
  FileText,
  Users,
  Building2,
  UserPlus,
  Settings,
  Archive,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight,
  Info,
  Send
} from 'lucide-react';

interface ApprovalRequest {
  id: string;
  request_type: string;
  description: string;
  category: 'staff_onboarding' | 'system_access' | 'role_change' | 'department_transfer' | 'resource_request' | 'policy_exception';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  requested_by: {
    id: string;
    name: string;
    role: string;
    department: string;
  };
  requested_at: string;
  requires_approval_from: string;
  request_data: any;
  approved_by?: {
    id: string;
    name: string;
    role: string;
  };
  approved_at?: string;
  rejection_reason?: string;
  urgency_level: number;
  estimated_impact: 'low' | 'medium' | 'high';
  attachments?: string[];
  comments: ApprovalComment[];
}

interface ApprovalComment {
  id: string;
  user_name: string;
  user_role: string;
  comment: string;
  timestamp: string;
  type: 'comment' | 'status_change' | 'request_info';
}

interface ApprovalStats {
  pending: number;
  approved_today: number;
  rejected_today: number;
  avg_approval_time_hours: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
}

interface ApprovalWorkflowPanelProps {
  onClose?: () => void;
}

const ApprovalWorkflowPanel: React.FC<ApprovalWorkflowPanelProps> = ({ onClose }) => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ApprovalRequest[]>([]);
  const [stats, setStats] = useState<ApprovalStats>({
    pending: 0,
    approved_today: 0,
    rejected_today: 0,
    avg_approval_time_hours: 0,
    by_category: {},
    by_priority: {}
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [newComment, setNewComment] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const categories = [
    { value: 'staff_onboarding', label: 'Staff Onboarding' },
    { value: 'system_access', label: 'System Access' },
    { value: 'role_change', label: 'Role Change' },
    { value: 'department_transfer', label: 'Department Transfer' },
    { value: 'resource_request', label: 'Resource Request' },
    { value: 'policy_exception', label: 'Policy Exception' }
  ];

  const priorities = [
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' }
  ];

  // Fetch approval requests and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestsResponse, statsResponse] = await Promise.all([
          fetch('/api/admin/approval-requests', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch('/api/admin/approval-stats', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ]);

        if (requestsResponse.ok && statsResponse.ok) {
          const requestsData = await requestsResponse.json();
          const statsData = await statsResponse.json();
          setRequests(requestsData.requests || []);
          setStats(statsData);
        } else {
          // Fallback demo data
          const demoRequests: ApprovalRequest[] = [
            {
              id: '1',
              request_type: 'Staff Onboarding',
              description: 'New QC technician onboarding request for Processing Department',
              category: 'staff_onboarding',
              priority: 'high',
              status: 'pending',
              requested_by: {
                id: 'u1',
                name: 'Sarah Williams',
                role: 'QC Lead',
                department: 'Quality Control'
              },
              requested_at: '2025-08-29T04:30:00Z',
              requires_approval_from: 'Admin',
              request_data: {
                staff_name: 'John Peterson',
                position: 'QC Technician',
                department: 'Processing',
                start_date: '2025-09-01',
                salary_range: '$45,000-$50,000',
                qualifications: 'Food Science Degree, 3 years experience'
              },
              urgency_level: 8,
              estimated_impact: 'medium',
              attachments: ['resume.pdf', 'certifications.pdf'],
              comments: [
                {
                  id: 'c1',
                  user_name: 'Sarah Williams',
                  user_role: 'QC Lead',
                  comment: 'Urgent need for additional QC staff due to increased production volume',
                  timestamp: '2025-08-29T04:32:00Z',
                  type: 'comment'
                }
              ]
            },
            {
              id: '2',
              request_type: 'System Access',
              description: 'Admin access request for new department supervisor',
              category: 'system_access',
              priority: 'normal',
              status: 'pending',
              requested_by: {
                id: 'u2',
                name: 'Michael Johnson',
                role: 'Production Lead',
                department: 'Processing'
              },
              requested_at: '2025-08-29T03:15:00Z',
              requires_approval_from: 'Admin',
              request_data: {
                user_name: 'David Chen',
                requested_role: 'Supervisor',
                access_level: 'Department Admin',
                justification: 'Promoted to supervisor role, needs admin access for team management'
              },
              urgency_level: 5,
              estimated_impact: 'low',
              comments: [
                {
                  id: 'c2',
                  user_name: 'Michael Johnson',
                  user_role: 'Production Lead',
                  comment: 'David has been acting supervisor for 2 months, ready for full access',
                  timestamp: '2025-08-29T03:16:00Z',
                  type: 'comment'
                }
              ]
            },
            {
              id: '3',
              request_type: 'Resource Request',
              description: 'Additional equipment request for packaging line efficiency',
              category: 'resource_request',
              priority: 'urgent',
              status: 'under_review',
              requested_by: {
                id: 'u3',
                name: 'Lisa Rodriguez',
                role: 'Staff Lead',
                department: 'Packaging'
              },
              requested_at: '2025-08-29T02:45:00Z',
              requires_approval_from: 'Admin',
              request_data: {
                equipment_type: 'Automated Packaging Machine',
                cost_estimate: '$25,000',
                justification: 'Current bottleneck in packaging line, 40% efficiency improvement expected',
                vendor: 'PackTech Solutions',
                installation_timeline: '2-3 weeks'
              },
              urgency_level: 9,
              estimated_impact: 'high',
              attachments: ['quote.pdf', 'specifications.pdf'],
              comments: [
                {
                  id: 'c3',
                  user_name: 'Admin System',
                  user_role: 'System',
                  comment: 'Request under review by procurement team',
                  timestamp: '2025-08-29T05:00:00Z',
                  type: 'status_change'
                }
              ]
            },
            {
              id: '4',
              request_type: 'Department Transfer',
              description: 'Staff transfer from Processing to Quality Control',
              category: 'department_transfer',
              priority: 'normal',
              status: 'approved',
              requested_by: {
                id: 'u4',
                name: 'Carlos Martinez',
                role: 'QC Lead',
                department: 'Quality Control'
              },
              requested_at: '2025-08-28T14:20:00Z',
              requires_approval_from: 'Admin',
              approved_by: {
                id: 'admin1',
                name: 'Admin User',
                role: 'Admin'
              },
              approved_at: '2025-08-29T06:00:00Z',
              request_data: {
                staff_name: 'Maria Santos',
                from_department: 'Processing',
                to_department: 'Quality Control',
                effective_date: '2025-09-05',
                reason: 'Career development and department needs alignment'
              },
              urgency_level: 4,
              estimated_impact: 'medium',
              comments: [
                {
                  id: 'c4',
                  user_name: 'Admin User',
                  user_role: 'Admin',
                  comment: 'Transfer approved. HR will coordinate the transition.',
                  timestamp: '2025-08-29T06:00:00Z',
                  type: 'status_change'
                }
              ]
            },
            {
              id: '5',
              request_type: 'Policy Exception',
              description: 'Extended break policy exception for medical accommodation',
              category: 'policy_exception',
              priority: 'high',
              status: 'rejected',
              requested_by: {
                id: 'u5',
                name: 'Jennifer Lee',
                role: 'Staff Lead',
                department: 'Administration'
              },
              requested_at: '2025-08-28T11:30:00Z',
              requires_approval_from: 'Admin',
              approved_by: {
                id: 'admin1',
                name: 'Admin User',
                role: 'Admin'
              },
              approved_at: '2025-08-29T05:45:00Z',
              rejection_reason: 'Request denied - medical accommodations should be processed through HR department following proper ADA procedures',
              request_data: {
                staff_name: 'Robert Wilson',
                policy_section: 'Break Schedule Policy',
                requested_exception: 'Additional 15-minute breaks every 2 hours',
                duration: '3 months',
                medical_documentation: 'Available upon request'
              },
              urgency_level: 7,
              estimated_impact: 'low',
              comments: [
                {
                  id: 'c5',
                  user_name: 'Admin User',
                  user_role: 'Admin',
                  comment: 'Please redirect this request through HR for proper ADA accommodation processing.',
                  timestamp: '2025-08-29T05:45:00Z',
                  type: 'status_change'
                }
              ]
            }
          ];

          const demoStats: ApprovalStats = {
            pending: 3,
            approved_today: 2,
            rejected_today: 1,
            avg_approval_time_hours: 18.5,
            by_category: {
              'staff_onboarding': 1,
              'system_access': 1,
              'resource_request': 1,
              'department_transfer': 1,
              'policy_exception': 1
            },
            by_priority: {
              'urgent': 1,
              'high': 2,
              'normal': 2,
              'low': 0
            }
          };

          setRequests(demoRequests);
          setStats(demoStats);
        }
      } catch (error) {
        console.error('Failed to fetch approval data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter requests
  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requested_by.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.request_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(request => request.status === filterStatus);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(request => request.category === filterCategory);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(request => request.priority === filterPriority);
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime();
    });

    setFilteredRequests(filtered);
  }, [requests, searchTerm, filterStatus, filterCategory, filterPriority]);

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const priorityConfig = priorities.find(p => p.value === priority);
    return priorityConfig?.color || 'bg-gray-100 text-gray-800';
  };

  // Handle approval action
  const handleApprovalAction = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/admin/approval-requests/${selectedRequest.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action,
          reason: approvalReason,
          additional_data: {}
        })
      });

      if (response.ok) {
        // Update local state
        setRequests(prev => prev.map(req => 
          req.id === selectedRequest.id 
            ? { 
                ...req, 
                status: action === 'approve' ? 'approved' : 'rejected',
                approved_by: { id: 'current_user', name: 'Admin User', role: 'Admin' },
                approved_at: new Date().toISOString(),
                rejection_reason: action === 'reject' ? approvalReason : undefined
              }
            : req
        ));
        
        setShowApprovalModal(false);
        setApprovalReason('');
        setShowRequestDetails(false);
      } else {
        console.error('Failed to process approval action');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  // Toggle card expansion
  const toggleCardExpansion = (requestId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedCards(newExpanded);
  };

  // Request Details Modal
  const RequestDetailsModal = () => {
    if (!selectedRequest) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 className="text-xl font-semibold">{selectedRequest.request_type}</h3>
              <p className="text-sm text-gray-600">{selectedRequest.description}</p>
            </div>
            <button
              onClick={() => setShowRequestDetails(false)}
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
              {/* Request Info */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Request Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {Object.entries(selectedRequest.request_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="text-sm text-gray-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {selectedRequest.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium">{attachment}</span>
                          <button className="ml-auto text-blue-600 hover:text-blue-800">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-3">Comments & Activity</h4>
                  <div className="space-y-3">
                    {selectedRequest.comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">{comment.user_name}</span>
                            <span className="text-xs text-gray-500">{comment.user_role}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{formatTimeAgo(comment.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="mt-4">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          // Add comment logic here
                          setNewComment('');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Metadata */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Request Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Priority:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Category:</span>
                      <span className="ml-2 text-sm font-medium">{selectedRequest.category.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Impact:</span>
                      <span className="ml-2 text-sm font-medium capitalize">{selectedRequest.estimated_impact}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Urgency:</span>
                      <span className="ml-2 text-sm font-medium">{selectedRequest.urgency_level}/10</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Requested By</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">{selectedRequest.requested_by.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedRequest.requested_by.department}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{formatTimeAgo(selectedRequest.requested_at)}</span>
                    </div>
                  </div>
                </div>

                {selectedRequest.approved_by && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">
                      {selectedRequest.status === 'approved' ? 'Approved By' : 'Processed By'}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{selectedRequest.approved_by.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{formatTimeAgo(selectedRequest.approved_at!)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {selectedRequest.status === 'pending' && (
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => setShowRequestDetails(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setApprovalAction('reject');
                  setShowApprovalModal(true);
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setApprovalAction('approve');
                  setShowApprovalModal(true);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Approval Action Modal
  const ApprovalModal = () => {
    if (!approvalAction || !selectedRequest) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">
              {approvalAction === 'approve' ? 'Approve Request' : 'Reject Request'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedRequest.request_type} - {selectedRequest.requested_by.name}
            </p>
          </div>
          
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {approvalAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
            </label>
            <textarea
              value={approvalReason}
              onChange={(e) => setApprovalReason(e.target.value)}
              placeholder={
                approvalAction === 'approve' 
                  ? 'Add any notes about this approval...'
                  : 'Please provide a reason for rejection...'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required={approvalAction === 'reject'}
            />
          </div>
          
          <div className="flex justify-end space-x-3 p-6 border-t">
            <button
              onClick={() => {
                setShowApprovalModal(false);
                setApprovalReason('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => handleApprovalAction(approvalAction)}
              disabled={approvalAction === 'reject' && !approvalReason.trim()}
              className={`px-6 py-2 text-white rounded-lg ${
                approvalAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {approvalAction === 'approve' ? 'Approve Request' : 'Reject Request'}
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
          <h2 className="text-2xl font-bold text-gray-900">Approval Workflows</h2>
          <p className="text-sm text-gray-600">Review and process pending approval requests</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <RefreshCw className="w-5 h-5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Approved Today</p>
              <p className="text-2xl font-bold text-green-900">{stats.approved_today}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Rejected Today</p>
              <p className="text-2xl font-bold text-red-900">{stats.rejected_today}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Avg. Time</p>
              <p className="text-2xl font-bold text-blue-900">{stats.avg_approval_time_hours}h</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search requests by description, requester, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.value} value={category.value}>{category.label}</option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Priorities</option>
          {priorities.map(priority => (
            <option key={priority.value} value={priority.value}>{priority.label}</option>
          ))}
        </select>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <div key={request.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{request.request_type}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                      {request.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{request.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{request.requested_by.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Building2 className="w-4 h-4" />
                      <span>{request.requested_by.department}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTimeAgo(request.requested_at)}</span>
                    </div>
                    {request.urgency_level >= 7 && (
                      <div className="flex items-center space-x-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>High Urgency</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleCardExpansion(request.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    {expandedCards.has(request.id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowRequestDetails(true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Eye className="w-5 h-5" />
                  </button>

                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setApprovalAction('reject');
                          setShowApprovalModal(true);
                        }}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setApprovalAction('approve');
                          setShowApprovalModal(true);
                        }}
                        className="px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedCards.has(request.id) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                      <div className="space-y-1 text-sm">
                        {Object.entries(request.request_data).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                            <span className="text-gray-900 font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                      <div className="space-y-2">
                        {request.comments.slice(-2).map((comment) => (
                          <div key={comment.id} className="text-sm">
                            <span className="font-medium">{comment.user_name}:</span>
                            <span className="text-gray-600 ml-1">{comment.comment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {request.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                          <p className="text-sm text-red-700">{request.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
        </div>
      )}

      {/* Modals */}
      {showRequestDetails && <RequestDetailsModal />}
      {showApprovalModal && <ApprovalModal />}
    </div>
  );
};

export default ApprovalWorkflowPanel;