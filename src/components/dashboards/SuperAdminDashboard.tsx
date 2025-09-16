"use client"

import React, { useState, useEffect } from 'react'
import clamflowAPI, { ApiResponse } from '../../lib/clamflow-api'
import { User } from '../../types/auth'
import AdminManagement from './admin/AdminManagement'
import SystemHealth from './admin/SystemHealth'
import AuditTrail from './admin/AuditTrail'
import DisasterRecovery from './admin/DisasterRecovery'

interface SuperAdminDashboardProps {
  currentUser: User | null
}

type SuperAdminView = 'overview' | 'admins' | 'permissions' | 'system_config' | 'audit' | 'disaster_recovery' | 'security'

interface SystemMetrics {
  totalAdmins: number
  activeAdmins: number
  systemOperations: number
  securityEvents: number
  backupStatus: string
  lastBackup: string
}

// Create wrapper components that accept currentUser but don't pass it if not needed
const AdminPermissionsPanel: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 Admin Permissions Management</h3>
      <p className="text-gray-600 mb-4">Manage administrator permissions and access levels.</p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900">Role Assignments</h4>
            <p className="text-sm text-gray-600">Manage user role assignments and permissions</p>
            <button className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              Manage Roles
            </button>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900">Access Control</h4>
            <p className="text-sm text-gray-600">Configure system access permissions</p>
            <button className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
              Configure Access
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const SystemConfigurationPanel: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ System Configuration</h3>
      <p className="text-gray-600 mb-4">Configure system settings and parameters.</p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900">General Settings</h4>
            <p className="text-sm text-gray-600">System-wide configuration options</p>
            <button className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              Configure
            </button>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900">Integration Settings</h4>
            <p className="text-sm text-gray-600">External system integrations</p>
            <button className="mt-2 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<SuperAdminView>('overview')
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([])

  useEffect(() => {
    loadSuperAdminData()
    const interval = setInterval(loadSuperAdminData, 120000)
    return () => clearInterval(interval)
  }, [])

  const loadSuperAdminData = async () => {
    try {
      const [
        adminsResponse,
        auditResponse,
        systemHealthResponse,
        notificationsResponse
      ] = await Promise.all([
        clamflowAPI.getAdmins(),
        clamflowAPI.getAuditLogs(),
        clamflowAPI.getSystemHealth(),
        clamflowAPI.getNotifications()
      ])

      const metrics: SystemMetrics = {
        totalAdmins: adminsResponse.success ? adminsResponse.data?.length || 0 : 0,
        activeAdmins: adminsResponse.success ? 
          adminsResponse.data?.filter((admin: any) => admin.is_active).length || 0 : 0,
        systemOperations: auditResponse.success ? auditResponse.data?.length || 0 : 0,
        securityEvents: 0,
        backupStatus: systemHealthResponse.success ? 'Healthy' : 'Unknown',
        lastBackup: new Date().toISOString()
      }

      setSystemMetrics(metrics)

      if (notificationsResponse.success) {
        const alerts = notificationsResponse.data?.filter((notif: any) => 
          notif.type === 'security' || notif.priority === 'high'
        ) || []
        setSecurityAlerts(alerts)
      }
    } catch (err: any) {
      console.error('❌ Failed to load super admin data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const navigationItems = [
    { id: 'overview', label: 'System Overview', icon: '🌐' },
    { id: 'admins', label: 'Admin Management', icon: '👑' },
    { id: 'permissions', label: 'Permissions', icon: '🔐' },
    { id: 'system_config', label: 'System Config', icon: '⚙️' },
    { id: 'audit', label: 'Audit Trail', icon: '📋' },
    { id: 'disaster_recovery', label: 'Disaster Recovery', icon: '🚨' },
    { id: 'security', label: 'Security Center', icon: '🛡️' }
  ]

  if (loading && !systemMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-red-400">⚡ SUPER ADMIN</h1>
          <p className="text-sm text-gray-300">Maximum Control</p>
        </div>
        
        <nav className="p-4 flex-1">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as SuperAdminView)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 text-left transition-colors ${
                activeView === item.id
                  ? 'bg-red-900 text-red-100 border-l-4 border-red-500'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-100">
        {/* Header */}
        <div className="bg-red-600 shadow-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {navigationItems.find(item => item.id === activeView)?.label}
              </h2>
              <p className="text-red-100">
                Super Admin: {currentUser?.full_name} • Highest Privilege Level
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-red-100">Security Status</p>
                <p className="font-bold text-green-300">🟢 SECURE</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadSuperAdminData}
              className="mt-2 text-red-700 hover:text-red-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="p-6 text-gray-900">
          {activeView === 'overview' && (
            <div className="space-y-6">
              {systemMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                    <h3 className="text-sm font-medium text-gray-500">Total Admins</h3>
                    <p className="text-3xl font-bold text-red-600">{systemMetrics.totalAdmins}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-sm font-medium text-gray-500">Active Admins</h3>
                    <p className="text-3xl font-bold text-green-600">{systemMetrics.activeAdmins}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-sm font-medium text-gray-500">System Operations</h3>
                    <p className="text-3xl font-bold text-blue-600">{systemMetrics.systemOperations}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                    <h3 className="text-sm font-medium text-gray-500">Security Events</h3>
                    <p className="text-3xl font-bold text-yellow-600">{systemMetrics.securityEvents}</p>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  🚨 Critical Security Alerts
                </h3>
                {securityAlerts.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-green-600 font-medium">✅ No Critical Alerts</p>
                    <p className="text-gray-500 text-sm">All systems operating normally</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {securityAlerts.slice(0, 5).map((alert, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">{alert.message}</p>
                          <p className="text-xs text-red-600">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                        <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                          Investigate
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 System Controls</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      <span className="text-blue-900 font-medium">Force System Backup</span>
                      <span className="text-blue-600">▶</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                      <span className="text-yellow-900 font-medium">Maintenance Mode</span>
                      <span className="text-yellow-600">⚠️</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      <span className="text-red-900 font-medium">Emergency Shutdown</span>
                      <span className="text-red-600">🛑</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Backup Status:</span>
                      <span className="text-green-600 font-medium">✅ {systemMetrics?.backupStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Backup:</span>
                      <span className="text-gray-900 text-sm">
                        {systemMetrics?.lastBackup ? new Date(systemMetrics.lastBackup).toLocaleString() : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Sessions:</span>
                      <span className="text-blue-600 font-medium">{systemMetrics?.activeAdmins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">System Uptime:</span>
                      <span className="text-green-600 font-medium">99.9%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'admins' && (
            <AdminManagement currentUser={currentUser} />
          )}

          {activeView === 'permissions' && (
            <AdminPermissionsPanel currentUser={currentUser} />
          )}

          {activeView === 'system_config' && (
            <SystemConfigurationPanel currentUser={currentUser} />
          )}

          {activeView === 'audit' && (
            <AuditTrail />
          )}

          {activeView === 'disaster_recovery' && (
            <DisasterRecovery />
          )}

          {activeView === 'security' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🛡️ Security Center</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900">Authentication</h4>
                  <p className="text-2xl font-bold text-green-600">Secure</p>
                  <p className="text-sm text-green-600">Multi-factor enabled</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900">Data Encryption</h4>
                  <p className="text-2xl font-bold text-blue-600">Active</p>
                  <p className="text-sm text-blue-600">AES-256 encryption</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-900">Access Monitoring</h4>
                  <p className="text-2xl font-bold text-yellow-600">Enabled</p>
                  <p className="text-sm text-yellow-600">Real-time tracking</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Force Password Reset (All Users)</h4>
                    <p className="text-sm text-gray-600">Require all users to reset passwords</p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Execute
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Lock All Sessions</h4>
                    <p className="text-sm text-gray-600">Immediately logout all active users</p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Execute
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Generate Security Report</h4>
                    <p className="text-sm text-gray-600">Create comprehensive security audit report</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Generate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboard;