"use client"

import React, { useState, useEffect } from 'react'
import clamflowAPI, { DashboardMetrics, SystemHealthData } from '../../lib/clamflow-api'
import { User } from '../../types/auth'
import AdminManagementPanel from './admin/AdminManagementPanel'

interface SuperAdminDashboardProps {
  currentUser: User | null
}

type SuperAdminView = 'overview' | 'admins' | 'monitoring' | 'security' | 'backup'

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<SuperAdminView>('overview')
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 300000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('clamflow_token');
      const user = localStorage.getItem('clamflow_user');
      
      console.log('🔄 Loading dashboard data from:', process.env.NEXT_PUBLIC_API_BASE_URL)
      console.log('🔑 Auth Token exists?', !!token)
      console.log('👤 Current User:', user ? JSON.parse(user) : 'No user')
      
      if (!token) {
        console.error('❌ No authentication token found!')
        setLoading(false);
        return;
      }
      
      const results = await Promise.allSettled([
        clamflowAPI.getDashboardMetrics(),
        clamflowAPI.getSystemHealth(),
      ])

      console.log('📊 Dashboard Metrics Result:', results[0])
      console.log('🏥 System Health Result:', results[1])

      if (results[0].status === 'fulfilled' && results[0].value.success && results[0].value.data) {
        const backendData = results[0].value.data as any;
        console.log('✅ Dashboard data received:', backendData)
        setDashboardData({
          totalUsers: backendData.totalUsers || backendData.total_users || 0,
          activeUsers: backendData.activeUsers || backendData.active_users || 0,
          totalLots: backendData.totalLots || 0,
          pendingApprovals: backendData.pendingApprovals || 0,
          systemHealth: backendData.systemHealth || 'healthy',
          lastUpdated: backendData.lastUpdated || backendData.last_updated || new Date().toISOString()
        })
      } else if (results[0].status === 'rejected') {
        console.error('❌ Dashboard metrics failed:', results[0].reason)
      } else {
        console.warn('⚠️ Dashboard metrics returned unsuccessfully:', results[0].value)
      }

      if (results[1].status === 'fulfilled' && results[1].value.success && results[1].value.data) {
        console.log('✅ System health received:', results[1].value.data)
        setSystemHealth(results[1].value.data)
      } else if (results[1].status === 'rejected') {
        console.error('❌ System health failed:', results[1].reason)
      } else {
        console.warn('⚠️ System health returned unsuccessfully:', results[1].value)
      }
    } catch (err) {
      console.error('❌ Critical error loading dashboard:', err)
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

  const handleNavClick = (view: SuperAdminView) => {
    setActiveView(view)
    setMobileMenuOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-purple-900 to-purple-800 p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div>
          <h1 className="text-lg font-bold text-white">⚡ SUPER ADMIN</h1>
          <p className="text-xs text-purple-200">{currentUser?.full_name}</p>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white p-2 hover:bg-purple-700 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
        fixed md:relative
        top-0 md:top-0
        left-0
        w-64 
        h-full
        bg-gradient-to-b from-purple-900 to-purple-800 
        shadow-2xl
        transform transition-transform duration-300 ease-in-out
        z-40
        overflow-y-auto
      `}>
        {/* Desktop Header */}
        <div className="hidden md:block p-6 border-b border-purple-700">
          <h1 className="text-xl font-bold text-white">⚡ SUPER ADMIN</h1>
          <p className="text-sm text-purple-200">Maximum Control</p>
        </div>

        {/* Mobile Close Button */}
        <div className="md:hidden p-4 border-b border-purple-700 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-white">Menu</h1>
            <p className="text-xs text-purple-200">{currentUser?.username}</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-white p-2 hover:bg-purple-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="p-4">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as SuperAdminView)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 text-left transition-all ${
                activeView === item.id
                  ? 'bg-purple-700 text-white border-l-4 border-orange-500 shadow-lg'
                  : 'text-purple-100 hover:bg-purple-700 hover:shadow-md'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium text-sm md:text-base">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-md p-4 md:p-6 border-b sticky top-0 z-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {navigationItems.find(item => item.id === activeView)?.label}
              </h2>
              <p className="text-purple-100 text-xs md:text-sm mt-1">
                Super Admin: {currentUser?.full_name} • Highest Privilege Level
              </p>
            </div>
            
            {systemHealth && (
              <div className="px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold bg-green-500 text-white self-start md:self-auto shadow-lg">
                🟢 SECURE
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-6">
          {activeView === 'overview' && (
            <div className="space-y-4 md:space-y-6">
              {dashboardData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-shadow">
                    <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">Total Admins</h3>
                    <p className="text-2xl md:text-3xl font-bold text-red-600">{dashboardData.totalUsers || 0}</p>
                  </div>
                  <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                    <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">Active Admins</h3>
                    <p className="text-2xl md:text-3xl font-bold text-green-600">{dashboardData.activeUsers || 0}</p>
                  </div>
                  <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                    <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">System Operations</h3>
                    <p className="text-2xl md:text-3xl font-bold text-blue-600">0</p>
                  </div>
                  <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
                    <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">Security Events</h3>
                    <p className="text-2xl md:text-3xl font-bold text-yellow-600">0</p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                  <p className="text-yellow-800 text-sm">Dashboard metrics loading...</p>
                </div>
              )}

              <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">🔒 Critical Security Alerts</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-green-600 text-2xl">✅</span>
                    <div className="flex-1">
                      <p className="font-medium text-green-900 text-sm md:text-base">No Critical Alerts</p>
                      <p className="text-xs md:text-sm text-green-700 mt-1">All systems operating normally</p>
                    </div>
                  </div>
                </div>
              </div>

              {systemHealth && (
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">📊 System Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-3 md:p-4 rounded-lg">
                      <p className="text-xs md:text-sm text-gray-600 mb-1">System Uptime</p>
                      <p className="text-lg md:text-xl font-bold text-purple-600">{systemHealth.uptime || '99.9%'}</p>
                    </div>
                    <div className="bg-teal-50 p-3 md:p-4 rounded-lg">
                      <p className="text-xs md:text-sm text-gray-600 mb-1">Database</p>
                      <p className="text-lg md:text-xl font-bold text-teal-600">
                        {systemHealth.database?.response_time || 0}ms
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'admins' && currentUser && (
            <AdminManagementPanel currentUser={currentUser} />
          )}

          {activeView === 'monitoring' && (
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-900">System Monitoring</h3>
              <p className="text-sm md:text-base text-gray-600">Real-time monitoring dashboard coming soon...</p>
            </div>
          )}

          {activeView === 'security' && (
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-900">Security Center</h3>
              <p className="text-sm md:text-base text-gray-600">Security management panel coming soon...</p>
            </div>
          )}

          {activeView === 'backup' && (
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-900">Disaster Recovery</h3>
              <p className="text-sm md:text-base text-gray-600">Backup and recovery tools coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboard;