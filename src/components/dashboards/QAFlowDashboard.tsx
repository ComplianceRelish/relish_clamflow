import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface QAFlowDashboardProps {
  authToken?: string;
  currentUserRole?: string;
}

interface WorkflowStats {
  weightNotes: {
    total: number;
    pending: number;
    approved: number;
  };
  sampleExtractions: {
    total: number;
    pending: number;
    completed: number;
  };
  ppcForms: {
    total: number;
    pending: number;
    approved: number;
  };
  fpForms: {
    total: number;
    pending: number;
    approved: number;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
  user: string;
}

const QAFlowDashboard: React.FC<QAFlowDashboardProps> = ({ 
  authToken, 
  currentUserRole 
}) => {
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats>({
    weightNotes: { total: 0, pending: 0, approved: 0 },
    sampleExtractions: { total: 0, pending: 0, completed: 0 },
    ppcForms: { total: 0, pending: 0, approved: 0 },
    fpForms: { total: 0, pending: 0, approved: 0 }
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState('today');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch workflow statistics
      const [statsRes, activityRes] = await Promise.all([
        fetch(`https://clamflowbackend-production.up.railway.app/qa/dashboard/stats?range=${selectedDateRange}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`https://clamflowbackend-production.up.railway.app/qa/dashboard/activity?range=${selectedDateRange}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setWorkflowStats(stats);
      }

      if (activityRes.ok) {
        const activity = await activityRes.json();
        setRecentActivity(activity);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Mock data for development
      setWorkflowStats({
        weightNotes: { total: 45, pending: 8, approved: 37 },
        sampleExtractions: { total: 23, pending: 5, completed: 18 },
        ppcForms: { total: 32, pending: 6, approved: 26 },
        fpForms: { total: 28, pending: 4, approved: 24 }
      });
      
      setRecentActivity([
        {
          id: '1',
          type: 'Weight Note',
          description: 'Weight note WN-001 approved',
          timestamp: new Date().toISOString(),
          status: 'approved',
          user: 'QC Staff 1'
        },
        {
          id: '2',
          type: 'Sample Extraction',
          description: 'Sample extracted from Tank T-05',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'completed',
          user: 'QC Staff 2'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (approved: number, total: number) => {
    return total > 0 ? Math.round((approved / total) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">QA Flow Dashboard</h1>
        
        {/* Date Range Selector */}
        <div className="flex space-x-2">
          {['today', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setSelectedDateRange(range)}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedDateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Role-based Access Notice */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800">
          <strong>Current Role:</strong> {currentUserRole || 'Unknown'} | 
          <strong> Access Level:</strong> Quality Assurance Workflow Management
        </p>
      </div>

      {/* Workflow Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Weight Notes Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Weight Notes</h3>
            <div className="bg-blue-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold text-gray-800">{workflowStats.weightNotes.total}</span>
              <span className="text-sm text-gray-600">Total</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-600">Pending: {workflowStats.weightNotes.pending}</span>
              <span className="text-green-600">Approved: {workflowStats.weightNotes.approved}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${calculateProgress(workflowStats.weightNotes.approved, workflowStats.weightNotes.total)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Sample Extractions Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Sample Extractions</h3>
            <div className="bg-green-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold text-gray-800">{workflowStats.sampleExtractions.total}</span>
              <span className="text-sm text-gray-600">Total</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-600">Pending: {workflowStats.sampleExtractions.pending}</span>
              <span className="text-green-600">Completed: {workflowStats.sampleExtractions.completed}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${calculateProgress(workflowStats.sampleExtractions.completed, workflowStats.sampleExtractions.total)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* PPC Forms Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">PPC Forms</h3>
            <div className="bg-orange-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold text-gray-800">{workflowStats.ppcForms.total}</span>
              <span className="text-sm text-gray-600">Total</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-600">Pending: {workflowStats.ppcForms.pending}</span>
              <span className="text-green-600">Approved: {workflowStats.ppcForms.approved}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full" 
                style={{ width: `${calculateProgress(workflowStats.ppcForms.approved, workflowStats.ppcForms.total)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* FP Forms Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">FP Forms</h3>
            <div className="bg-purple-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold text-gray-800">{workflowStats.fpForms.total}</span>
              <span className="text-sm text-gray-600">Total</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-600">Pending: {workflowStats.fpForms.pending}</span>
              <span className="text-green-600">Approved: {workflowStats.fpForms.approved}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${calculateProgress(workflowStats.fpForms.approved, workflowStats.fpForms.total)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Progress Visualization */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Workflow Progress Overview</h2>
        <div className="flex items-center justify-between">
          {/* Weight Notes */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-blue-600 font-bold">WN</span>
            </div>
            <span className="text-sm text-gray-600">Weight Notes</span>
            <span className="text-xs text-green-600">{workflowStats.weightNotes.approved} approved</span>
          </div>

          {/* Arrow */}
          <div className="flex-1 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Sample Extractions */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-green-600 font-bold">SE</span>
            </div>
            <span className="text-sm text-gray-600">Sample Extraction</span>
            <span className="text-xs text-green-600">{workflowStats.sampleExtractions.completed} completed</span>
          </div>

          {/* Arrow */}
          <div className="flex-1 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* PPC Forms */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-orange-600 font-bold">PPC</span>
            </div>
            <span className="text-sm text-gray-600">PPC Forms</span>
            <span className="text-xs text-green-600">{workflowStats.ppcForms.approved} approved</span>
          </div>

          {/* Arrow */}
          <div className="flex-1 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* FP Forms */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-purple-600 font-bold">FP</span>
            </div>
            <span className="text-sm text-gray-600">FP Forms</span>
            <span className="text-xs text-green-600">{workflowStats.fpForms.approved} approved</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent QA Activity</h2>
        <div className="space-y-4">
          {recentActivity.length > 0 ? recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {activity.type}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                  <p className="text-xs text-gray-600">by {activity.user}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                </p>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              No recent activity found
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium">New Weight Note</span>
          </div>
        </button>

        <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className="text-sm font-medium">Extract Sample</span>
          </div>
        </button>

        <button className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-sm font-medium">PPC Form</span>
          </div>
        </button>

        <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="text-sm font-medium">FP Form</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default QAFlowDashboard;