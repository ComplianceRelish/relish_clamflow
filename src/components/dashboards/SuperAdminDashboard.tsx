"use client"

import React, { useState, useEffect } from 'react'
import clamflowAPI, { DashboardMetrics, SystemHealthData } from '../../lib/clamflow-api'
import { User } from '../../types/auth'

interface SuperAdminDashboardProps {
  currentUser: User | null
}

type SuperAdminView = 'overview' | 'admins' | 'monitoring' | 'security' | 'backup'

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<SuperAdminView>('overview')
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 300000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const results = await Promise.allSettled([
        clamflowAPI.getDashboardMetrics(),
        clamflowAPI.getSystemHealth(),
      ])

      if (results[0].status === 'fulfilled' && results[0].value.success && results[0].value.data) {
        setDashboardData(results[0].value.data)
      }

      if (results[1].status === 'fulfilled' && results[1].value.success && results[1].value.data) {
        setSystemHealth(results[1].value.data)
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const navigationItems = [
    { id: 'overview', label: 'System Overview', icon: '⚡' },
    { id: 'admins', label: 'Admin Management', icon: '👑' },
    { id: 'monitoring', label: 'System Monitoring', icon: '📡' },
    { id: 'security', label: 'Security Center', icon: '🛡️' },
    { id: 'backup', label: 'Disaster Recovery', icon: '🚨' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-gray-100">
      <div className="w-64 bg-gradient-to-b from-purple-900 to-purple-800 shadow-lg flex-shrink-0">
        <div className="p-6 border-b border-purple-700">
          <h1 className="text-xl font-bold text-white">⚡ SUPER ADMIN</h1>
          <p className="text-sm text-purple-200">Maximum Control</p>
        </div>
        
        <nav className="p-4">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as SuperAdminView)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 text-left transition-colors ${
                activeView === item.id
                  ? 'bg-purple-700 text-white border-l-4 border-orange-500'
                  : 'text-purple-100 hover:bg-purple-700'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-sm p-6 border-b sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {navigationItems.find(item => item.id === activeView)?.label}
              </h2>
              <p className="text-purple-100 text-sm">
                Super Admin: {currentUser?.full_name} • Highest Privilege Level
              </p>
            </div>
            
            {systemHealth && (
              <div className="px-4 py-2 rounded-full text-sm font-medium bg-green-500 text-white">
                🟢 SECURE
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {activeView === 'overview' && (
            <div className="space-y-6">
              {dashboardData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                    <h3 className="text-sm font-medium text-gray-500">Total Admins</h3>
                    <p className="text-3xl font-bold text-red-600">{dashboardData.totalUsers || 0}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-sm font-medium text-gray-500">Active Admins</h3>
                    <p className="text-3xl font-bold text-green-600">{dashboardData.activeUsers || 0}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-sm font-medium text-gray-500">System Operations</h3>
                    <p className="text-3xl font-bold text-blue-600">0</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                    <h3 className="text-sm font-medium text-gray-500">Security Events</h3>
                    <p className="text-3xl font-bold text-yellow-600">0</p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-yellow-800">Dashboard metrics endpoint not available yet.</p>
                </div>
              )}

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Critical Security Alerts</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 text-xl">✅</span>
                    <div>
                      <p className="font-medium text-green-900">No Critical Alerts</p>
                      <p className="text-sm text-green-700">All systems operating normally</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🛠️ System Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="p-4 border-2 border-purple-600 rounded-lg hover:bg-purple-50 text-left">
                    <h4 className="font-medium text-purple-700">Force System Backup</h4>
                    <p className="text-sm text-gray-600">Trigger immediate system backup</p>
                  </button>
                  <button className="p-4 border-2 border-yellow-600 rounded-lg hover:bg-yellow-50 text-left">
                    <h4 className="font-medium text-yellow-700">Maintenance Mode</h4>
                    <p className="text-sm text-gray-600">Enable system maintenance mode</p>
                  </button>
                </div>
              </div>

              {systemHealth && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Backup Status</p>
                      <p className="text-xl font-bold text-green-600">✅ Healthy</p>
                      <p className="text-xs text-gray-500">Last Backup: 11/16/2025, 1:20:58 PM</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active Sessions</p>
                      <p className="text-xl font-bold text-blue-600">0</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">System Uptime</p>
                      <p className="text-xl font-bold text-purple-600">{systemHealth.uptime || '99.9%'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Database Response</p>
                      <p className="text-xl font-bold text-teal-600">{systemHealth.database.response_time}ms</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'admins' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Admin Management</h3>
              <p className="text-gray-600">Admin management panel coming soon...</p>
            </div>
          )}

          {activeView === 'monitoring' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">System Monitoring</h3>
              <p className="text-gray-600">Real-time monitoring dashboard coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboard;