// src/components/dashboards/QCLeadDashboard.tsx
// QC Lead (QA - Quality Assurance) Dashboard - QC Unit Controller
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import clamflowAPI from '../../lib/clamflow-api';
import { 
  QCLeadAccess,
  QCFormApprovalAccess,
  DepurationTestingAccess,
  MicrobiologyTestingAccess,
  InventoryManageAccess,
  ShiftSchedulingAccess,
  StationAssignmentAccess
} from '../auth/RoleBasedAccess';

// ============================================
// INTERFACES
// ============================================

interface DashboardStats {
  pendingQCForms: number;
  pendingFPForms: number;
  pendingDepurationTests: number;
  pendingMicrobiologyTests: number;
  completedTestsToday: number;
  qcStaffOnShift: number;
  lotsAwaitingTest: number;
  inventoryUpdatesToday: number;
}

interface PendingApproval {
  id: string;
  type: 'qc_form' | 'fp_form' | 'ppc_form';
  title: string;
  submittedBy: string;
  submittedAt: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  lotNumber?: string;
}

interface PendingTest {
  id: string;
  type: 'depuration' | 'microbiology';
  lotNumber: string;
  sampleId: string;
  extractedBy: string;
  extractedAt: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
}

// ============================================
// QC LEAD DASHBOARD COMPONENT
// ============================================

const QCLeadDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats>({
    pendingQCForms: 0,
    pendingFPForms: 0,
    pendingDepurationTests: 0,
    pendingMicrobiologyTests: 0,
    completedTestsToday: 0,
    qcStaffOnShift: 0,
    lotsAwaitingTest: 0,
    inventoryUpdatesToday: 0,
  });
  
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [pendingTests, setPendingTests] = useState<PendingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'testing' | 'staff'>('overview');

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard metrics
      const [metricsResponse, approvalsResponse] = await Promise.allSettled([
        clamflowAPI.getDashboardMetrics(),
        clamflowAPI.getPendingApprovals()
      ]);

      // Process metrics
      if (metricsResponse.status === 'fulfilled' && metricsResponse.value?.success) {
        const data = metricsResponse.value.data;
        setStats(prev => ({
          ...prev,
          lotsAwaitingTest: data?.totalLots || 0, // Use totalLots from DashboardMetrics
        }));
      }

      // Process pending approvals
      if (approvalsResponse.status === 'fulfilled' && approvalsResponse.value?.success) {
        const approvals = approvalsResponse.value.data || [];
        // Filter for QC Lead relevant approvals (ALL QC forms)
        const relevantApprovals = approvals
          .filter((a: any) => ['qc_form', 'fp_form', 'ppc_form'].includes(a.form_type))
          .map((a: any) => ({
            id: a.id,
            type: a.form_type,
            title: `${getFormTypeName(a.form_type)} #${a.form_id}`,
            submittedBy: a.submitted_by,
            submittedAt: a.submitted_at,
            priority: a.priority || 'medium',
            status: a.status,
            lotNumber: a.lot_number
          }));
        
        setPendingApprovals(relevantApprovals);
        setStats(prev => ({
          ...prev,
          pendingQCForms: relevantApprovals.filter((a: PendingApproval) => a.type === 'qc_form').length,
          pendingFPForms: relevantApprovals.filter((a: PendingApproval) => a.type === 'fp_form').length,
        }));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormTypeName = (type: string): string => {
    const names: Record<string, string> = {
      qc_form: 'QC Form',
      fp_form: 'FP Form',
      ppc_form: 'PPC Form',
    };
    return names[type] || type;
  };

  if (!user || user.role !== 'QC Lead' && user.role !== 'Super Admin' && user.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-500 mt-2">You do not have permission to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">QA Dashboard</h1>
              <p className="text-green-100 mt-1">
                Welcome, {user.full_name} | Quality Assurance Controller
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                🔬 QC Lead (QA)
              </span>
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                {loading ? '⏳' : '🔄'} Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'approvals', label: '✅ Form Approvals' },
              { id: 'testing', label: '🧪 Testing & Reports' },
              { id: 'staff', label: '👥 QC Staff' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Pending QC Forms"
                value={stats.pendingQCForms}
                icon="📋"
                color="orange"
                onClick={() => setActiveTab('approvals')}
              />
              <StatCard
                title="Pending FP Forms"
                value={stats.pendingFPForms}
                icon="📝"
                color="yellow"
                onClick={() => setActiveTab('approvals')}
              />
              <StatCard
                title="Lots Awaiting Tests"
                value={stats.lotsAwaitingTest}
                icon="🧪"
                color="purple"
                onClick={() => setActiveTab('testing')}
              />
              <StatCard
                title="Tests Completed Today"
                value={stats.completedTestsToday}
                icon="✅"
                color="green"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <ShiftSchedulingAccess staffType="qc">
                  <QuickActionButton
                    title="Schedule QC Shifts"
                    icon="📅"
                    color="blue"
                    onClick={() => router.push('/shift-scheduling?filter=qc')}
                    description="QC staff shift scheduling"
                  />
                </ShiftSchedulingAccess>

                <StationAssignmentAccess staffType="qc">
                  <QuickActionButton
                    title="Assign QC Stations"
                    icon="🏭"
                    color="green"
                    onClick={() => router.push('/station-assignment?filter=qc')}
                    description="Assign QC staff to stations"
                  />
                </StationAssignmentAccess>

                <QCFormApprovalAccess>
                  <QuickActionButton
                    title="Approve QC Forms"
                    icon="✅"
                    color="orange"
                    onClick={() => router.push('/qc-forms/approve')}
                    description="ALL QC form approvals"
                  />
                </QCFormApprovalAccess>

                <DepurationTestingAccess>
                  <QuickActionButton
                    title="Depuration Testing"
                    icon="🧫"
                    color="purple"
                    onClick={() => router.push('/testing/depuration')}
                    description="Extract, test & report"
                  />
                </DepurationTestingAccess>

                <MicrobiologyTestingAccess>
                  <QuickActionButton
                    title="Microbiology Testing"
                    icon="🔬"
                    color="indigo"
                    onClick={() => router.push('/testing/microbiology')}
                    description="FP lot-wise testing"
                  />
                </MicrobiologyTestingAccess>

                <MicrobiologyTestingAccess>
                  <QuickActionButton
                    title="Upload Reports"
                    icon="📤"
                    color="teal"
                    onClick={() => router.push('/reports/upload')}
                    description="Depuration & Microbiology"
                  />
                </MicrobiologyTestingAccess>

                <InventoryManageAccess>
                  <QuickActionButton
                    title="Add to Inventory"
                    icon="📦"
                    color="cyan"
                    onClick={() => router.push('/inventory/add')}
                    description="FP → Inventory"
                  />
                </InventoryManageAccess>

                <QuickActionButton
                  title="View All Lots"
                  icon="📊"
                  color="gray"
                  onClick={() => router.push('/lots')}
                  description="Lot-wise overview"
                />
              </div>
            </div>

            {/* Workflow Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 QA Workflow</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Depuration Workflow */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <h4 className="font-semibold text-purple-800 mb-3">🧫 Depuration Testing</h4>
                  <ol className="space-y-2 text-sm text-purple-700">
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
                      Extract Depuration Samples (or designate QC Staff)
                    </li>
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs mr-2">2</span>
                      Perform Depuration Tests
                    </li>
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs mr-2">3</span>
                      Generate & Upload Depuration Report
                    </li>
                  </ol>
                </div>

                {/* Microbiology Workflow */}
                <div className="border rounded-lg p-4 bg-indigo-50">
                  <h4 className="font-semibold text-indigo-800 mb-3">🔬 Microbiology Testing</h4>
                  <ol className="space-y-2 text-sm text-indigo-700">
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
                      Extract FP Samples (Lot-wise)
                    </li>
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs mr-2">2</span>
                      Perform Microbiology Tests
                    </li>
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs mr-2">3</span>
                      Upload Microbiology Report
                    </li>
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs mr-2">4</span>
                      FP → Inventory (Notifies Production Lead, Admin, Super Admin)
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Recent Pending Approvals Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">⏳ Pending Form Approvals</h3>
                <button 
                  onClick={() => setActiveTab('approvals')}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl">✅</span>
                  <p className="mt-2">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.slice(0, 5).map((approval) => (
                    <ApprovalCard key={approval.id} approval={approval} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">ALL QC Form Approvals</h3>
                <p className="text-gray-500 text-sm mt-1">
                  QC Forms, FP Forms, and PPC Forms (first-level QC approval) requiring your approval
                </p>
              </div>
              
              <div className="divide-y">
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-6xl">✅</span>
                    <p className="mt-4 text-lg">All caught up!</p>
                    <p className="text-sm">No pending approvals at this time.</p>
                  </div>
                ) : (
                  pendingApprovals.map((approval) => (
                    <div key={approval.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <ApprovalCard approval={approval} showActions />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Testing Tab */}
        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Depuration Testing */}
              <DepurationTestingAccess>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">🧫</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Depuration Testing</h3>
                      <p className="text-gray-500 text-sm">Extract samples, test & generate reports</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => router.push('/testing/depuration/extract')}
                      className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-left"
                    >
                      <div className="font-medium">Extract Samples</div>
                      <div className="text-sm opacity-80">Or designate QC Staff</div>
                    </button>
                    <button 
                      onClick={() => router.push('/testing/depuration/test')}
                      className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-left"
                    >
                      <div className="font-medium">Perform Tests</div>
                      <div className="text-sm opacity-80">Run depuration tests</div>
                    </button>
                    <button 
                      onClick={() => router.push('/testing/depuration/report')}
                      className="w-full px-4 py-3 bg-purple-400 text-white rounded-lg hover:bg-purple-500 text-left"
                    >
                      <div className="font-medium">Generate & Upload Report</div>
                      <div className="text-sm opacity-80">Complete depuration report</div>
                    </button>
                  </div>
                </div>
              </DepurationTestingAccess>

              {/* Microbiology Testing */}
              <MicrobiologyTestingAccess>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">🔬</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Microbiology Testing</h3>
                      <p className="text-gray-500 text-sm">Lot-wise FP testing → Inventory</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => router.push('/testing/microbiology/extract')}
                      className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-left"
                    >
                      <div className="font-medium">Extract FP Samples</div>
                      <div className="text-sm opacity-80">Lot-wise sample extraction</div>
                    </button>
                    <button 
                      onClick={() => router.push('/testing/microbiology/test')}
                      className="w-full px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-left"
                    >
                      <div className="font-medium">Perform Tests</div>
                      <div className="text-sm opacity-80">Run microbiology tests</div>
                    </button>
                    <button 
                      onClick={() => router.push('/testing/microbiology/report')}
                      className="w-full px-4 py-3 bg-indigo-400 text-white rounded-lg hover:bg-indigo-500 text-left"
                    >
                      <div className="font-medium">Upload Report → Inventory</div>
                      <div className="text-sm opacity-80">Moves FP to Inventory (notifies leads)</div>
                    </button>
                  </div>
                </div>
              </MicrobiologyTestingAccess>
            </div>

            {/* Pending Tests List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🧪 Pending Tests</h3>
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl">📋</span>
                <p className="mt-2">Pending tests will appear here</p>
                <p className="text-sm">Extracted samples awaiting testing</p>
              </div>
            </div>
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ShiftSchedulingAccess staffType="qc">
                <ActionCard
                  title="QC Staff Shift Scheduling"
                  description="Schedule shifts for QC Staff using the interactive calendar"
                  icon="📅"
                  buttonText="Open Shift Scheduler"
                  onClick={() => router.push('/shift-scheduling?filter=qc')}
                />
              </ShiftSchedulingAccess>
              
              <StationAssignmentAccess staffType="qc">
                <ActionCard
                  title="QC Station Assignment"
                  description="Assign QC Staff to QC stations using drag-and-drop"
                  icon="🏭"
                  buttonText="Open Station Assignment"
                  onClick={() => router.push('/station-assignment?filter=qc')}
                />
              </StationAssignmentAccess>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                👥 QC Staff on Shift
              </h3>
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl">🔬</span>
                <p className="mt-2">QC staff list will appear here</p>
                <button 
                  onClick={() => router.push('/shift-scheduling?filter=qc')}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  View QC Shift Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: string;
  color: string;
  onClick?: () => void;
}> = ({ title, value, icon, color, onClick }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  return (
    <div 
      className={`p-4 rounded-lg border-2 ${colorClasses[color]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="mt-2 text-sm font-medium">{title}</p>
    </div>
  );
};

const QuickActionButton: React.FC<{
  title: string;
  icon: string;
  color: string;
  onClick: () => void;
  description?: string;
}> = ({ title, icon, color, onClick, description }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    teal: 'bg-teal-600 hover:bg-teal-700',
    cyan: 'bg-cyan-600 hover:bg-cyan-700',
    gray: 'bg-gray-600 hover:bg-gray-700',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg text-white ${colorClasses[color]} transition-colors text-center`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-medium">{title}</div>
      {description && <div className="text-xs opacity-80 mt-1">{description}</div>}
    </button>
  );
};

const ActionCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  buttonText: string;
  onClick: () => void;
}> = ({ title, description, icon, buttonText, onClick }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-start space-x-4">
      <span className="text-4xl">{icon}</span>
      <div className="flex-1">
        <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
        <p className="text-gray-500 text-sm mt-1">{description}</p>
        <button
          onClick={onClick}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          {buttonText}
        </button>
      </div>
    </div>
  </div>
);

const ApprovalCard: React.FC<{
  approval: PendingApproval;
  showActions?: boolean;
}> = ({ approval, showActions }) => {
  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };

  const typeIcons: Record<string, string> = {
    qc_form: '📋',
    fp_form: '📝',
    ppc_form: '🔬',
  };

  const typeColors: Record<string, string> = {
    qc_form: 'bg-green-100 text-green-700',
    fp_form: 'bg-blue-100 text-blue-700',
    ppc_form: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{typeIcons[approval.type]}</span>
        <div>
          <div className="flex items-center space-x-2">
            <p className="font-medium text-gray-800">{approval.title}</p>
            <span className={`px-2 py-0.5 rounded text-xs ${typeColors[approval.type]}`}>
              {approval.type.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            By {approval.submittedBy} • {new Date(approval.submittedAt).toLocaleDateString()}
            {approval.lotNumber && ` • Lot: ${approval.lotNumber}`}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[approval.priority]}`}>
          {approval.priority}
        </span>
        {showActions && (
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
              Approve
            </button>
            <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QCLeadDashboard;
