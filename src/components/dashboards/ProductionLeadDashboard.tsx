// src/components/dashboards/ProductionLeadDashboard.tsx
// Production Lead Dashboard - Production Unit Controller
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import clamflowAPI from '../../lib/clamflow-api';
import { 
  ProductionLeadAccess, 
  WeightNoteApprovalAccess, 
  PPCApprovalAccess,
  GatePassAccess,
  LotCreationAccess,
  DeviceHandoverAccess,
  StaffOnboardingAccess,
  ShiftSchedulingAccess,
  StationAssignmentAccess
} from '../auth/RoleBasedAccess';

// ============================================
// INTERFACES
// ============================================

interface DashboardStats {
  pendingWeightNotes: number;
  pendingPPCForms: number;
  activeLots: number;
  activeStations: number;
  totalStations: number;
  productionStaffOnShift: number;
  todayProduction: number;
  weeklyProduction: number;
}

interface PendingApproval {
  id: string;
  type: 'weight_note' | 'ppc_form';
  title: string;
  submittedBy: string;
  submittedAt: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
}

interface StaffMember {
  id: string;
  name: string;
  station: string;
  status: 'active' | 'inactive' | 'on_break';
  shiftStart: string;
  shiftEnd: string;
}

// ============================================
// PRODUCTION LEAD DASHBOARD COMPONENT
// ============================================

const ProductionLeadDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats>({
    pendingWeightNotes: 0,
    pendingPPCForms: 0,
    activeLots: 0,
    activeStations: 0,
    totalStations: 0,
    productionStaffOnShift: 0,
    todayProduction: 0,
    weeklyProduction: 0,
  });
  
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [activeStaff, setActiveStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'staff' | 'stations'>('overview');

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchDashboardData();
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
          todayProduction: data?.pendingApprovals || 0, // Using pending approvals as production indicator
          activeLots: data?.totalLots || 0, // Use totalLots from DashboardMetrics
        }));
      }

      // Process pending approvals
      if (approvalsResponse.status === 'fulfilled' && approvalsResponse.value?.success) {
        const approvals = approvalsResponse.value.data || [];
        // Filter for Production Lead relevant approvals
        const relevantApprovals = approvals
          .filter((a: any) => ['weight_note', 'ppc_form'].includes(a.form_type))
          .map((a: any) => ({
            id: a.id,
            type: a.form_type,
            title: `${a.form_type === 'weight_note' ? 'Weight Note' : 'PPC Form'} #${a.form_id}`,
            submittedBy: a.submitted_by,
            submittedAt: a.submitted_at,
            priority: a.priority || 'medium',
            status: a.status
          }));
        
        setPendingApprovals(relevantApprovals);
        setStats(prev => ({
          ...prev,
          pendingWeightNotes: relevantApprovals.filter((a: PendingApproval) => a.type === 'weight_note').length,
          pendingPPCForms: relevantApprovals.filter((a: PendingApproval) => a.type === 'ppc_form').length,
        }));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'Production Lead' && user.role !== 'Super Admin' && user.role !== 'Admin') {
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Production Lead Dashboard</h1>
              <p className="text-blue-100 mt-1">
                Welcome, {user.full_name} | Production Unit Controller
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                🏭 Production Lead
              </span>
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
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
              { id: 'overview', label: '📊 Overview', icon: '📊' },
              { id: 'approvals', label: '✅ Approvals', icon: '✅' },
              { id: 'staff', label: '👥 Staff Management', icon: '👥' },
              { id: 'stations', label: '🏭 Stations', icon: '🏭' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
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
                title="Pending Weight Notes"
                value={stats.pendingWeightNotes}
                icon="📋"
                color="orange"
                onClick={() => setActiveTab('approvals')}
              />
              <StatCard
                title="Pending PPC Forms"
                value={stats.pendingPPCForms}
                icon="📝"
                color="yellow"
                onClick={() => setActiveTab('approvals')}
              />
              <StatCard
                title="Active Lots"
                value={stats.activeLots}
                icon="📦"
                color="blue"
              />
              <StatCard
                title="Today's Production (kg)"
                value={stats.todayProduction}
                icon="⚖️"
                color="green"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <StaffOnboardingAccess>
                  <QuickActionButton
                    title="Onboard Staff"
                    icon="👤+"
                    color="purple"
                    onClick={() => router.push('/staff/onboarding')}
                    description="Add new Production, QC or Security staff"
                  />
                </StaffOnboardingAccess>

                <ShiftSchedulingAccess staffType="production">
                  <QuickActionButton
                    title="Schedule Shifts"
                    icon="📅"
                    color="blue"
                    onClick={() => router.push('/shift-scheduling')}
                    description="Production staff shift scheduling"
                  />
                </ShiftSchedulingAccess>

                <StationAssignmentAccess staffType="production">
                  <QuickActionButton
                    title="Assign Stations"
                    icon="🏭"
                    color="green"
                    onClick={() => router.push('/station-assignment')}
                    description="Assign staff to stations"
                  />
                </StationAssignmentAccess>

                <DeviceHandoverAccess>
                  <QuickActionButton
                    title="Device Handover"
                    icon="📱"
                    color="indigo"
                    onClick={() => router.push('/devices/handover')}
                    description="RFID device to staff"
                  />
                </DeviceHandoverAccess>

                <WeightNoteApprovalAccess>
                  <QuickActionButton
                    title="Approve Weight Notes"
                    icon="✅"
                    color="orange"
                    onClick={() => router.push('/weight-notes/approve')}
                    description="RM Station form approvals"
                  />
                </WeightNoteApprovalAccess>

                <LotCreationAccess>
                  <QuickActionButton
                    title="Create Lot"
                    icon="📦"
                    color="teal"
                    onClick={() => router.push('/lots/create')}
                    description="Create new production lot"
                  />
                </LotCreationAccess>

                <PPCApprovalAccess>
                  <QuickActionButton
                    title="Approve PPC Forms"
                    icon="📝"
                    color="yellow"
                    onClick={() => router.push('/ppc-forms/approve')}
                    description="PPC form approvals"
                  />
                </PPCApprovalAccess>

                <GatePassAccess>
                  <QuickActionButton
                    title="Generate Gate Pass"
                    icon="🎫"
                    color="red"
                    onClick={() => router.push('/gate-pass/generate')}
                    description="After PPC approval"
                  />
                </GatePassAccess>
              </div>
            </div>

            {/* Recent Pending Approvals Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">⏳ Pending Approvals</h3>
                <button 
                  onClick={() => setActiveTab('approvals')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
                <h3 className="text-lg font-semibold text-gray-800">Pending Approvals</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Weight Notes (RM Station Forms) & PPC Forms requiring your approval
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

        {/* Staff Management Tab */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StaffOnboardingAccess>
                <ActionCard
                  title="Staff Onboarding"
                  description="Onboard new Production, QC & Security staff (requires Admin approval)"
                  icon="👤+"
                  buttonText="Start Onboarding"
                  onClick={() => router.push('/staff/onboarding')}
                />
              </StaffOnboardingAccess>
              
              <ActionCard
                title="Manage Absences"
                description="Handle staff absence requests and leave management"
                icon="📅"
                buttonText="View Absences"
                onClick={() => router.push('/staff/absences')}
              />
              
              <ActionCard
                title="Access Control"
                description="Manage staff access permissions and restrictions"
                icon="🔐"
                buttonText="Manage Access"
                onClick={() => router.push('/staff/access-control')}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                👥 Production Staff on Shift
              </h3>
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl">👷</span>
                <p className="mt-2">Staff list will appear here</p>
                <button 
                  onClick={() => router.push('/shift-scheduling')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Shift Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stations Tab */}
        {activeTab === 'stations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StationAssignmentAccess staffType="production">
                <ActionCard
                  title="Station Assignment"
                  description="Assign production staff to stations using drag-and-drop"
                  icon="🏭"
                  buttonText="Open Assignment Board"
                  onClick={() => router.push('/station-assignment')}
                />
              </StationAssignmentAccess>
              
              <DeviceHandoverAccess>
                <ActionCard
                  title="Device RFID Handover"
                  description="Scan device RFID tag and link to assigned station staff"
                  icon="📱"
                  buttonText="Start Handover"
                  onClick={() => router.push('/devices/handover')}
                />
              </DeviceHandoverAccess>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🏭 Station Status Overview
              </h3>
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl">📊</span>
                <p className="mt-2">Station status will appear here</p>
                <button 
                  onClick={() => router.push('/station-assignment')}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  View All Stations
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
    red: 'bg-red-50 border-red-200 text-red-700',
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
    red: 'bg-red-600 hover:bg-red-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    teal: 'bg-teal-600 hover:bg-teal-700',
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
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
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
    weight_note: '📋',
    ppc_form: '📝',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{typeIcons[approval.type]}</span>
        <div>
          <p className="font-medium text-gray-800">{approval.title}</p>
          <p className="text-sm text-gray-500">
            By {approval.submittedBy} • {new Date(approval.submittedAt).toLocaleDateString()}
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

export default ProductionLeadDashboard;
