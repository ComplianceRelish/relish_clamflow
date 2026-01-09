"use client"

import React, { useState, useEffect } from 'react'
import clamflowAPI, { DashboardMetrics, SystemHealthData } from '../../lib/clamflow-api'
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

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 300000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const results = await Promise.allSettled([
        clamflowAPI.getDashboardMetrics(),
        clamflowAPI.getSystemHealth(),
      ])

      if (results[0].status === 'fulfilled' && results[0].value.success && results[0].value.data) {
        setDashboardData(results[0].value.data)
      } else {
        console.warn('Dashboard metrics endpoint not available')
      }

      if (results[1].status === 'fulfilled' && results[1].value.success && results[1].value.data) {
        setSystemHealth(results[1].value.data)
      } else {
        console.warn('System health endpoint not available')
      }

      setError('')
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err)
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

  if (loading && !dashboardData && !systemHealth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-gray-100">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-lg flex-shrink-0">
        <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-purple-100">ClamFlow Management</p>
        </div>
        
        <nav className="p-4">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as AdminView)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 text-left transition-colors ${
                activeView === item.id
                  ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-700'
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
        {/* Sub-header */}
        <div className="bg-white shadow-sm p-6 border-b sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => item.id === activeView)?.label}
              </h2>
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
              {dashboardData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                    <p className="text-3xl font-bold text-purple-600">{dashboardData.totalUsers}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
                    <p className="text-3xl font-bold text-green-600">{dashboardData.activeUsers}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total Lots</h3>
                    <p className="text-3xl font-bold text-teal-600">{dashboardData.totalLots}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
                    <p className="text-3xl font-bold text-orange-600">{dashboardData.pendingApprovals}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    📊 Dashboard metrics are currently unavailable. Backend endpoints may not be deployed yet.
                  </p>
                </div>
              )}

              {systemHealth && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        systemHealth.services?.authentication ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {systemHealth.services?.authentication ? '✅' : '❌'} Auth
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        systemHealth.services?.api ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {systemHealth.services?.api ? '✅' : '❌'} API
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        systemHealth.services?.database ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {systemHealth.services?.database ? '✅' : '❌'} Database
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        systemHealth.services?.hardware ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {systemHealth.services?.hardware ? '✅' : '❌'} Hardware
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

          {/* ✅ KEEP currentUser for components that need it */}
          {/* Components WITHOUT currentUser prop */}
{activeView === 'users' && <UserManagementPanel />}
{activeView === 'hardware' && <HardwareManagementPanel />}
{activeView === 'metrics' && <DashboardMetricsPanel />}

{/* Component WITH currentUser prop */}
{activeView === 'approvals' && currentUser && <ApprovalWorkflowPanel currentUser={currentUser} />}

{/* SystemHealth - no props */}
{activeView === 'system' && <SystemHealth />}
          
          {activeView === 'settings' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Auto Refresh Dashboard</h4>
                    <p className="text-sm text-gray-600">Automatically refresh dashboard data</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                    Configure
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Notification Settings</h4>
                    <p className="text-sm text-gray-600">Manage notification preferences</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                    Configure
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">System Backup</h4>
                    <p className="text-sm text-gray-600">Configure automated backups</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
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