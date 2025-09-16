"use client"

import React, { useState, useEffect } from 'react'
import clamflowAPI, { ApiResponse, DashboardMetrics, SystemHealthData } from '../../lib/clamflow-api'
import { User } from '../../types/auth'
import UserManagementPanel from './admin/UserManagementPanel'
import HardwareManagementPanel from './admin/HardwareManagementPanel'
import ApprovalWorkflowPanel from './admin/ApprovalWorkflowPanel'
import DashboardMetricsPanel from './admin/DashboardMetricsPanel'
import SystemHealth from './admin/SystemHealth'

interface AdminDashboardProps {
  currentUser: User | null
}

type AdminView = 'overview' | 'users' | 'hardware' | 'approvals' | 'metrics' | 'system' | 'settings'

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<AdminView>('overview')
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 300000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [metricsResponse, healthResponse, notificationsResponse] = await Promise.all([
        clamflowAPI.getDashboardMetrics(),
        clamflowAPI.getSystemHealth(),
        clamflowAPI.getNotifications()
      ])

      if (metricsResponse.success && metricsResponse.data) {
        setDashboardData(metricsResponse.data)
      }

      if (healthResponse.success && healthResponse.data) {
        setSystemHealth(healthResponse.data)
      }

      if (notificationsResponse.success && notificationsResponse.data) {
        setNotifications(notificationsResponse.data)
      }
    } catch (err: any) {
      console.error('❌ Failed to load dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getHealthStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'healthy': 'text-green-600 bg-green-100',
      'warning': 'text-yellow-600 bg-yellow-100',
      'critical': 'text-red-600 bg-red-100'
    }
    return colors[status] || colors.healthy
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'hardware', label: 'Hardware', icon: '🔧' },
    { id: 'approvals', label: 'Approvals', icon: '✅' },
    { id: 'metrics', label: 'Metrics', icon: '📈' },
    { id: 'system', label: 'System Health', icon: '🏥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-600">ClamFlow Management</p>
        </div>
        
        <nav className="p-4">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as AdminView)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 text-left transition-colors ${
                activeView === item.id
                  ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => item.id === activeView)?.label}
              </h2>
              <p className="text-gray-600">
                Welcome back, {currentUser?.full_name} • {currentUser?.role}
              </p>
            </div>
            
            {systemHealth && (
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${getHealthStatusColor(systemHealth.status)}`}>
                System: {systemHealth.status.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadDashboardData}
              className="mt-2 text-red-700 hover:text-red-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dynamic Content */}
        <div className="p-6">
          {activeView === 'overview' && (
            <div className="space-y-6">
              {dashboardData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                    <p className="text-3xl font-bold text-blue-600">{dashboardData.totalUsers}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
                    <p className="text-3xl font-bold text-green-600">{dashboardData.activeUsers}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total Lots</h3>
                    <p className="text-3xl font-bold text-purple-600">{dashboardData.totalLots}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
                    <p className="text-3xl font-bold text-orange-600">{dashboardData.pendingApprovals}</p>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
                {notifications.length === 0 ? (
                  <p className="text-gray-500">No recent notifications</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {systemHealth && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        systemHealth.services.authentication ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {systemHealth.services.authentication ? '✅' : '❌'} Auth
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        systemHealth.services.api ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {systemHealth.services.api ? '✅' : '❌'} API
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        systemHealth.services.database ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {systemHealth.services.database ? '✅' : '❌'} Database
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        systemHealth.services.hardware ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {systemHealth.services.hardware ? '✅' : '❌'} Hardware
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Uptime: {systemHealth.uptime}</p>
                    <p>Database Response: {systemHealth.database.response_time}ms</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'users' && (
            <UserManagementPanel 
              currentUser={currentUser} 
              key="user-management-panel" 
            />
          )}

          {activeView === 'hardware' && (
            <HardwareManagementPanel 
              currentUser={currentUser} 
              key="hardware-panel" 
            />
          )}

          {activeView === 'approvals' && (
            <ApprovalWorkflowPanel 
              currentUser={currentUser} 
              key="approvals-panel" 
            />
          )}

          {activeView === 'metrics' && (
            <DashboardMetricsPanel 
              currentUser={currentUser} 
              key="metrics-panel" 
            />
          )}

          {activeView === 'system' && (
            <SystemHealth key="system-health-panel" />
          )}

          {activeView === 'settings' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Auto Refresh Dashboard</h4>
                    <p className="text-sm text-gray-600">Automatically refresh dashboard data</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Configure
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Notification Settings</h4>
                    <p className="text-sm text-gray-600">Manage notification preferences</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Configure
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">System Backup</h4>
                    <p className="text-sm text-gray-600">Configure automated backups</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Configure
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

export default AdminDashboard