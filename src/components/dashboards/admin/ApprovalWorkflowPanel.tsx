// components/dashboards/admin/ApprovalWorkflowPanel.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  User,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { User as UserType } from '@/types/auth';
import clamflowAPI, { ApprovalItem } from '@/lib/clamflow-api'; // Fixed import

interface ApprovalWorkflowPanelProps {
  currentUser: UserType | null;
}

const ApprovalWorkflowPanel: React.FC<ApprovalWorkflowPanelProps> = ({ currentUser }) => {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await clamflowAPI.getPendingApprovals();
      if (response.success && response.data) {
        setPendingApprovals(response.data);
      } else {
        // No data available - show empty state
        setPendingApprovals([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approval: ApprovalItem) => {
    try {
      setProcessingId(approval.id);
      const response = await clamflowAPI.approveForm(approval.form_id, approval.form_type);
      
      if (response.success) {
        setPendingApprovals(prev => prev.filter(item => item.id !== approval.id));
      } else {
        setError(response.error || 'Failed to approve form');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve form');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;
    
    try {
      setProcessingId(selectedApproval.id);
      const response = await clamflowAPI.rejectForm(selectedApproval.form_id, rejectionReason);
      
      if (response.success) {
        setPendingApprovals(prev => prev.filter(item => item.id !== selectedApproval.id));
        setIsRejectDialogOpen(false);
        setSelectedApproval(null);
        setRejectionReason('');
      } else {
        setError(response.error || 'Failed to reject form');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject form');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (approval: ApprovalItem) => {
    setSelectedApproval(approval);
    setIsRejectDialogOpen(true);
  };

  const getFormTypeDisplay = (formType: string) => {
    const displayNames: { [key: string]: string } = {
      'weight_note': 'Weight Note',
      'ppc_form': 'PPC Form',
      'fp_form': 'FP Form',
      'qc_form': 'QC Form',
      'depuration_form': 'Depuration Form'
    };
    return displayNames[formType] || formType;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormTypeIcon = (formType: string) => {
    return <FileText className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-pulse mx-auto mb-2" />
            <p>Loading pending approvals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Approval Workflow</h2>
          <p className="text-gray-600">Manage pending form approvals and rejections</p>
        </div>
        <Button variant="outline" onClick={fetchPendingApprovals}>
          <Search className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {pendingApprovals.filter(item => item.priority === 'high').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingApprovals.filter(item => item.priority === 'medium').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Priority</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pendingApprovals.filter(item => item.priority === 'low').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p>All forms have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getFormTypeIcon(approval.form_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-medium">{getFormTypeDisplay(approval.form_type)}</h4>
                          <Badge className={getPriorityColor(approval.priority)}>
                            {approval.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">Form ID: {approval.form_id}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>Submitted by: {approval.submitted_by}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(approval.submitted_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(approval)}
                        disabled={processingId === approval.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRejectDialog(approval)}
                        disabled={processingId === approval.id}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Form</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this form. This will be sent to the submitter.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRejectDialogOpen(false);
                setSelectedApproval(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processingId === selectedApproval?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalWorkflowPanel;