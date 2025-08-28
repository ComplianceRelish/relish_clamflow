'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { clamflowAPI, DashboardMetrics, SystemHealthData } from '../../lib/clamflow-api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';
import Image from 'next/image';

// Placeholder components - we'll create these step by step
const PlaceholderPanel: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
  <div className="p-6">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    <p className="text-gray-600 mb-4">This panel is under development.</p>
    <Button onClick={onClose} variant="outline">Close</Button>
  </div>
);

// Relish Brand Colors
const BRAND_COLORS = {
  primary: '#8B5CF6',    // Purple
  secondary: '#FF7518',  // Orange  
  accent: '#20B2AA',     // Teal
  success: '#10B981',    // Green
  warning: '#F59E0B',    // Amber
  danger: '#EF4444',     // Red
  neutral: '#6B7280',    // Gray
};

// Feature card interface
interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  component: React.ComponentType<{ title: string; onClose: () => void }>;
  type: 'modal' | 'slideout' | 'overlay';
  critical?: boolean;
  quickStats?: {
    label: string;
    value: string | number;
    status?: 'success' | 'warning' | 'error';
  };
}

interface DashboardState {
  metrics: DashboardMetrics | null;
  systemHealth: SystemHealthData | null;
  loading: boolean;
  error: string | null;
  activeFeature: string | null;
  slideoutOpen: boolean;
}

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    metrics: null,
    systemHealth: null,
    loading: true,
    error: null,
    activeFeature: null,
    slideoutOpen: false,
  });

  // Brand-consistent feature cards
  const featureCards: FeatureCard[] = [
    {
      id: 'users',
      title: 'User Management',
      description: 'Create, edit, delete, and manage user accounts',
      icon: '👥',
      color: BRAND_COLORS.primary,
      component: PlaceholderPanel,
      type: 'modal',
      quickStats: {
        label: 'Total Users',
        value: dashboardState.metrics?.totalUsers || 0,
        status: 'success'
      }
    },
    {
      id: 'permissions',
      title: 'Admin Permissions',
      description: 'Grant and revoke administrative permissions',
      icon: '🔐',
      color: BRAND_COLORS.primary,
      component: PlaceholderPanel,
      type: 'modal',
      quickStats: {
        label: 'Active Admins',
        value: dashboardState.metrics?.activeUsers || 0,
        status: 'success'
      }
    },
    {
      id: 'system-config',
      title: 'System Configuration',
      description: 'Database, API, and hardware settings',
      icon: '⚙️',
      color: BRAND_COLORS.neutral,
      component: PlaceholderPanel,
      type: 'slideout',
      quickStats: {
        label: 'System Status',
        value: dashboardState.systemHealth?.status?.toUpperCase() || 'UNKNOWN',
        status: dashboardState.systemHealth?.status === 'healthy' ? 'success' : 'warning'
      }
    },
    {
      id: 'backup',
      title: 'Backup & Recovery',
      description: 'System backups and disaster recovery',
      icon: '💾',
      color: BRAND_COLORS.success,
      component: PlaceholderPanel,
      type: 'modal',
      quickStats: {
        label: 'Last Backup',
        value: '2 hours ago',
        status: 'success'
      }
    },
    {
      id: 'hardware',
      title: 'Hardware Management',
      description: 'RFID readers, biometric devices configuration',
      icon: '🔧',
      color: BRAND_COLORS.secondary,
      component: PlaceholderPanel,
      type: 'slideout',
      quickStats: {
        label: 'Devices Online',
        value: '12/15',
        status: 'warning'
      }
    },
    {
      id: 'emergency',
      title: 'Emergency Controls',
      description: 'System shutdown, maintenance mode, alerts',
      icon: '🚨',
      color: BRAND_COLORS.danger,
      component: PlaceholderPanel,
      type: 'overlay',
      critical: true,
      quickStats: {
        label: 'System Mode',
        value: 'Normal',
        status: 'success'
      }
    },
    {
      id: 'audit',
      title: 'Audit Log Export',
      description: 'Download audit trails and compliance reports',
      icon: '📊',
      color: BRAND_COLORS.primary,
      component: PlaceholderPanel,
      type: 'modal',
      quickStats: {
        label: 'Recent Events',
        value: '1,247',
        status: 'success'
      }
    },
    {
      id: 'database',
      title: 'Database Console',
      description: 'Direct database access for troubleshooting',
      icon: '🗄️',
      color: BRAND_COLORS.warning,
      component: PlaceholderPanel,
      type: 'overlay',
      critical: true,
      quickStats: {
        label: 'DB Response',
        value: `${dashboardState.systemHealth?.database?.response_time || 0}ms`,
        status: 'success'
      }
    },
    {
      id: 'api',
      title: 'API Monitoring',
      description: 'Monitor and control API endpoints',
      icon: '🔌',
      color: BRAND_COLORS.accent,
      component: PlaceholderPanel,
      type: 'slideout',
      quickStats: {
        label: 'API Health',
        value: dashboardState.systemHealth?.services?.api ? 'Healthy' : 'Down',
        status: dashboardState.systemHealth?.services?.api ? 'success' : 'error'
      }
    }
  ];

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardState(prev => ({ ...prev, loading: true, error: null }));

        const [metricsResponse, healthResponse] = await Promise.all([
          clamflowAPI.getDashboardMetrics(),
          clamflowAPI.getSystemHealth(),
        ]);

        setDashboardState(prev => ({
          ...prev,
          metrics: metricsResponse.success ? (metricsResponse.data || null) : null,
          systemHealth: healthResponse.success ? (healthResponse.data || null) : null,
          loading: false,
          error: metricsResponse.success && healthResponse.success ? null : 'Failed to load dashboard data',
        }));
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setDashboardState(prev => ({
          ...prev,
          metrics: null,
          systemHealth: null,
          loading: false,
          error: 'Failed to load dashboard data',
        }));
      }
    };

    if (user) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const openFeature = (featureId: string) => {
    const feature = featureCards.find(f => f.id === featureId);
    if (feature?.type === 'slideout') {
      setDashboardState(prev => ({ ...prev, activeFeature: featureId, slideoutOpen: true }));
    } else {
      setDashboardState(prev => ({ ...prev, activeFeature: featureId }));
    }
  };

  const closeFeature = () => {
    setDashboardState(prev => ({ 
      ...prev, 
      activeFeature: null, 
      slideoutOpen: false 
    }));
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const activeFeatureCard = featureCards.find(f => f.id === dashboardState.activeFeature);

  if (dashboardState.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Brand-Consistent Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* Relish Logo + ClamFlow Branding */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-3">
                  <Image
                    src="/logo_relish.png"
                    alt="Relish"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <h1 className="text-2xl font-bold" style={{ color: BRAND_COLORS.primary }}>
                    ClamFlow
                  </h1>
                </div>
              </div>
              
              <Badge 
                className="px-3 py-1"
                style={{ 
                  backgroundColor: `${BRAND_COLORS.primary}20`,
                  color: BRAND_COLORS.primary,
                  borderColor: `${BRAND_COLORS.primary}40`
                }}
              >
                Super Admin
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.username}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={logout} 
                size="sm"
                className="border-gray-300 hover:border-purple-300 hover:text-purple-700"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {dashboardState.error && (
          <Card className="p-4 bg-red-50 border-red-200 mb-6">
            <p className="text-red-600">{dashboardState.error}</p>
          </Card>
        )}

        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h2>
          <p className="text-gray-600">Complete system oversight and critical administrative functions</p>
        </div>

        {/* Brand-Consistent System Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div 
                  className="w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: BRAND_COLORS.primary }}
                >
                  <span className="text-white text-sm">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardState.metrics?.totalUsers || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div 
                  className="w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: BRAND_COLORS.success }}
                >
                  <span className="text-white text-sm">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardState.metrics?.activeUsers || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div 
                  className="w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: BRAND_COLORS.accent }}
                >
                  <span className="text-white text-sm">📦</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Lots</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardState.metrics?.totalLots || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center`}
                     style={{ 
                       backgroundColor: dashboardState.systemHealth?.status === 'healthy' 
                         ? BRAND_COLORS.success 
                         : BRAND_COLORS.danger 
                     }}
                >
                  <span className="text-white text-sm">🏥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">System Health</p>
                <p className="text-lg font-semibold text-gray-900">
                  {dashboardState.systemHealth?.status?.toUpperCase() || 'UNKNOWN'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Brand-Consistent Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((feature) => (
            <Card 
              key={feature.id}
              className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                feature.critical ? 'ring-2 ring-red-200 hover:ring-red-300' : ''
              }`}
              onClick={() => openFeature(feature.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl`}
                  style={{ backgroundColor: feature.color }}
                >
                  {feature.icon}
                </div>
                {feature.critical && (
                  <Badge 
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${BRAND_COLORS.danger}20`,
                      color: BRAND_COLORS.danger
                    }}
                  >
                    CRITICAL
                  </Badge>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>

              {feature.quickStats && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">{feature.quickStats.label}</span>
                  <span className={`text-sm font-semibold ${getStatusColor(feature.quickStats.status)}`}>
                    {feature.quickStats.value}
                  </span>
                </div>
              )}

              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full hover:border-purple-300 hover:text-purple-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFeature(feature.id);
                  }}
                >
                  Open {feature.title}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Modal Dialogs - Brand Consistent */}
      {activeFeatureCard && activeFeatureCard.type === 'modal' && (
        <Modal
          isOpen={!!dashboardState.activeFeature}
          onClose={closeFeature}
          title={activeFeatureCard.title}
        >
          <activeFeatureCard.component title={activeFeatureCard.title} onClose={closeFeature} />
        </Modal>
      )}

      {/* Slide-out Panel - Brand Consistent */}
      {activeFeatureCard && activeFeatureCard.type === 'slideout' && (
        <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          dashboardState.slideoutOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: `${BRAND_COLORS.primary}20` }}
          >
            <h2 
              className="text-lg font-semibold"
              style={{ color: BRAND_COLORS.primary }}
            >
              {activeFeatureCard.title}
            </h2>
            <Button variant="outline" size="sm" onClick={closeFeature}>
              ✕
            </Button>
          </div>
          <div className="p-6 overflow-y-auto h-full">
            <activeFeatureCard.component title={activeFeatureCard.title} onClose={closeFeature} />
          </div>
        </div>
      )}

      {/* Full-page Overlay for Critical Functions - Brand Consistent */}
      {activeFeatureCard && activeFeatureCard.type === 'overlay' && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-full overflow-y-auto">
            <div 
              className="flex items-center justify-between p-6 border-b bg-red-50"
              style={{ borderColor: `${BRAND_COLORS.danger}20` }}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: BRAND_COLORS.danger }}
                >
                  <span className="text-white text-sm">⚠️</span>
                </div>
                <h2 
                  className="text-lg font-semibold"
                  style={{ color: BRAND_COLORS.danger }}
                >
                  {activeFeatureCard.title}
                </h2>
              </div>
              <Button variant="outline" size="sm" onClick={closeFeature}>
                ✕
              </Button>
            </div>
            <div className="p-6">
              <activeFeatureCard.component title={activeFeatureCard.title} onClose={closeFeature} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile slide-out backdrop */}
      {dashboardState.slideoutOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
          onClick={closeFeature}
        />
      )}
    </div>
  );
};

export default SuperAdminDashboard;