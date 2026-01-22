"use client"

import React, { useState, useEffect } from 'react'
import { User } from '../../types/auth'
import UserManagementPanel from './admin/UserManagementPanel'
import HardwareManagementPanel from './admin/HardwareManagementPanel'
import DashboardMetricsPanel from './admin/DashboardMetricsPanel'

interface AdminDashboardProps {
  currentUser: User | null
}

type AdminView = 'overview' | 'users' | 'hardware' | 'metrics' | 'settings'

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<AdminView>('overview')
  const [error, setError] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false) // Reset sidebar state on desktop
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }

  // Handle navigation - close sidebar on mobile after selection
  const handleNavClick = (viewId: AdminView) => {
    setActiveView(viewId)
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'hardware', label: 'Hardware', icon: '🔧' },
    { id: 'metrics', label: 'Metrics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <div className="flex h-full bg-gray-100 relative">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar Navigation */}
      <div 
        className={`
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'relative flex-shrink-0'
          }
          w-64 bg-white shadow-lg
        `}
      >
        <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-sm text-purple-100">ClamFlow Management</p>
            </div>
            {/* Close button for mobile */}
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="text-white p-1 hover:bg-purple-500 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <nav className="p-4 overflow-y-auto max-h-[calc(100vh-100px)]">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as AdminView)}
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
      <div className="flex-1 overflow-auto min-w-0">
        {/* Sub-header */}
        <div className="bg-white shadow-sm p-4 md:p-6 border-b sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu Button for Mobile */}
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                {navigationItems.find(item => item.id === activeView)?.label}
              </h2>
            </div>
          </div>
        </div>

        {error && (
          <div className="m-4 md:m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Dynamic Content */}
        <div className="p-4 md:p-6">
          {activeView === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Overview</h3>
                <p className="text-gray-600 mb-4">
                  Welcome to the Admin Dashboard. {isMobile ? 'Tap the menu icon to navigate.' : 'Use the sidebar to navigate between different management sections.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg hover:bg-purple-50 cursor-pointer active:bg-purple-100 transition-colors" onClick={() => handleNavClick('users')}>
                    <div className="text-2xl mb-2">👥</div>
                    <h4 className="font-medium">User Management</h4>
                    <p className="text-sm text-gray-500">Manage users, roles, and permissions</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-purple-50 cursor-pointer active:bg-purple-100 transition-colors" onClick={() => handleNavClick('hardware')}>
                    <div className="text-2xl mb-2">🔧</div>
                    <h4 className="font-medium">Hardware</h4>
                    <p className="text-sm text-gray-500">Monitor and configure hardware devices</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-purple-50 cursor-pointer active:bg-purple-100 transition-colors" onClick={() => handleNavClick('metrics')}>
                    <div className="text-2xl mb-2">📈</div>
                    <h4 className="font-medium">Metrics</h4>
                    <p className="text-sm text-gray-500">View system performance metrics</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Components */}
          {activeView === 'users' && <UserManagementPanel />}
          {activeView === 'hardware' && <HardwareManagementPanel />}
          {activeView === 'metrics' && <DashboardMetricsPanel />}
          
          {activeView === 'settings' && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
                  <div>
                    <h4 className="font-medium">Auto Refresh Dashboard</h4>
                    <p className="text-sm text-gray-600">Automatically refresh dashboard data</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 w-full sm:w-auto">
                    Configure
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
                  <div>
                    <h4 className="font-medium">Notification Settings</h4>
                    <p className="text-sm text-gray-600">Manage notification preferences</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 w-full sm:w-auto">
                    Configure
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
                  <div>
                    <h4 className="font-medium">System Backup</h4>
                    <p className="text-sm text-gray-600">Configure automated backups</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 w-full sm:w-auto">
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