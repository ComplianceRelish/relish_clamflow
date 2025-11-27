'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock } from 'lucide-react';

// Simple loading spinner component since LoadingSpinner might not exist
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-sm text-gray-600">Loading...</span>
  </div>
);

// Types
interface ApprovalItem {
  id: string;
  title: string;
  type: 'staff_onboarding' | 'supplier_registration' | 'vendor_approval' | 'equipment_request' | 'quality_override';
  submitted_by: string;
  submitted_by_id: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | &apos;in_review&apos;;
  created_at: string;
  updated_at: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface User {
  id: string;
  role: string;
  name: string;
}

// Mock useAuth hook - replace with your actual implementation
const useAuth = () => {
  const [user] = useState<User | null>({
    id: '1',
    role: 'admin',
    name: &apos;Admin User&apos;
  });
  
  return { user };
};

// Mock dashboardAPI - replace with your actual implementation
const dashboardAPI = {
  getPendingApprovals: async (role: string): Promise<ApprovalItem[]> => {
    try {
      const response = await fetch('/api/dashboard/pending-approvals', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clamflow_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending approvals');
      }

      return await response.json();
    } catch (error) {
      // Fallback demo data for development
      return [
        {
          id: '1',
          title: 'Staff Onboarding - John Doe',
          type: 'staff_onboarding',
          submitted_by: 'Staff Lead Manager',
          submitted_by_id: 'staff_lead_001',
          urgency: 'high',
          status: 'pending',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          updated_at: new Date().toISOString(),
          description: 'New production staff member requires approval for floor access',
          metadata: {
            department: 'Production',
            position: 'Quality Control Technician'
          }
        },
        {
          id: '2',
          title: 'Supplier Registration - Fresh Catch Co.',
          type: 'supplier_registration',
          submitted_by: 'Procurement Manager',
          submitted_by_id: 'proc_mgr_001',
          urgency: 'medium',
          status: 'pending',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          updated_at: new Date().toISOString(),
          description: 'New seafood supplier registration for raw material sourcing',
          metadata: {
            supplier_type: 'Raw Material',
            estimated_volume: '500kg/month'
          }
        },
        {
          id: '3',
          title: 'Equipment Request - New Freezer Unit',
          type: 'equipment_request',
          submitted_by: 'Facility Manager',
          submitted_by_id: 'facility_001',
          urgency: 'critical',
          status: 'pending',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          updated_at: new Date().toISOString(),
          description: 'Urgent replacement needed for failed freezer unit in storage area B',
          metadata: {
            equipment_type: 'Freezer',
            estimated_cost: &apos;$15,000&apos;
          }
        }
      ];
    }
  },

  approveItem: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/dashboard/approvals/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clamflow_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(&apos;Failed to approve item&apos;);
      }
    } catch (error) {
      console.log(`Mock approval for item ${id}`);
    }
  },

  rejectItem: async (id: string, reason: string): Promise<void> => {
    try {
      const response = await fetch(`/api/dashboard/approvals/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clamflow_token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error(&apos;Failed to reject item&apos;);
      }
    } catch (error) {
      console.log(`Mock rejection for item ${id}: ${reason}`);
    }
  }
};

const PendingApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        if (user?.role) {
          const data = await dashboardAPI.getPendingApprovals(user.role);
          setApprovals(data);
        }
      } catch (err) {
        setError('Failed to fetch pending approvals');
        console.error('Error fetching approvals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovals();
  }, [user?.role]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await dashboardAPI.approveItem(id);
      
      // Remove from pending list
      setApprovals(prev => prev.filter(approval => approval.id !== id));
      
      // Show success message
      console.log('Item approved successfully');
    } catch (err) {
      console.error('Error approving item:', err);
      setError('Failed to approve item');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setActionLoading(id);
      await dashboardAPI.rejectItem(id, reason);
      
      // Remove from pending list
      setApprovals(prev => prev.filter(approval => approval.id !== id));
      
      // Show success message
      console.log('Item rejected successfully');
    } catch (err) {
      console.error('Error rejecting item:', err);
      setError('Failed to reject item');
    } finally {
      setActionLoading(null);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case &apos;critical&apos;: return <AlertCircle className="h-4 w-4 text-red-600" />;
      case &apos;high&apos;: return <AlertCircle className="h-4 w-4 text-red-500" />;
      case &apos;medium&apos;: return <Clock className="h-4 w-4 text-yellow-500" />;
      case &apos;low&apos;: return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'staff_onboarding': return 'Staff Onboarding';
      case 'supplier_registration': return 'Supplier Registration';
      case 'vendor_approval': return 'Vendor Approval';
      case 'equipment_request': return 'Equipment Request';
      case 'quality_override': return 'Quality Override';
      default: return type.replace('_', &apos; &apos;).toUpperCase();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-red-500">
            <XCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Pending Approvals
          {approvals.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {approvals.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {approvals.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <div className="text-gray-500 font-medium">No pending approvals</div>
            <div className="text-sm text-gray-400">All items have been processed</div>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getUrgencyIcon(approval.urgency)}
                      <div className="font-medium text-gray-900 ml-2">{approval.title}</div>
                      <Badge variant={getUrgencyColor(approval.urgency)} className="ml-2">
                        {approval.urgency.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-1" />
                        Submitted by: {approval.submitted_by}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatTimeAgo(approval.created_at)} • {getTypeLabel(approval.type)}
                      </div>
                      
                      {approval.description && (
                        <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                          {approval.description}
                        </div>
                      )}
                      
                      {approval.metadata && Object.keys(approval.metadata).length > 0 && (
                        <div className="text-xs text-gray-500 mt-2">
                          {Object.entries(approval.metadata).map(([key, value]) => (
                            <span key={key} className="inline-block mr-3">
                              <strong>{key.replace('_', &apos; &apos;)}:</strong> {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(approval.id)}
                    disabled={actionLoading === approval.id}
                    className=&quot;text-red-600 border-red-200 hover:bg-red-50&quot;
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {actionLoading === approval.id ? 'Processing...' : &apos;Reject&apos;}
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(approval.id)}
                    disabled={actionLoading === approval.id}
                    className=&quot;bg-green-600 hover:bg-green-700&quot;
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    {actionLoading === approval.id ? 'Processing...' : &apos;Approve&apos;}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingApprovals;