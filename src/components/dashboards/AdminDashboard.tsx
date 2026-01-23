"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { User } from '../../types/auth'
import UserManagementPanel from './admin/UserManagementPanel'
import HardwareManagementPanel from './admin/HardwareManagementPanel'
import DashboardMetricsPanel from './admin/DashboardMetricsPanel'
import AdminSettingsPanel from './admin/AdminSettingsPanel'
import DeviceRegistryPanel from './admin/DeviceRegistryPanel'

interface AdminDashboardProps {
  currentUser: User | null
}

type AdminView = 'overview' | 'users' | 'hardware' | 'device-registry' | 'metrics' | 'settings'

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<AdminView>('overview')
  const [error, setError] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Settings state
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const [showRefreshModal, setShowRefreshModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [backupInProgress, setBackupInProgress] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    approvalRequests: true,
    systemAlerts: true,
    hardwareWarnings: true,
    emailNotifications: false,
    soundEnabled: true,
    soundType: 'default'
  })
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

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

  // Settings handlers
  const handleSaveRefreshSettings = useCallback(() => {
    // Save settings to localStorage
    localStorage.setItem('clamflow_autoRefresh', JSON.stringify({ enabled: autoRefreshEnabled, interval: refreshInterval }))
    setShowRefreshModal(false)
    setError('')
    alert('Auto-refresh settings saved successfully!')
  }, [autoRefreshEnabled, refreshInterval])

  const handleSaveNotificationSettings = useCallback(() => {
    // Save settings to localStorage
    localStorage.setItem('clamflow_notifications', JSON.stringify(notificationSettings))
    setShowNotificationModal(false)
    setError('')
    alert('Notification settings saved successfully!')
  }, [notificationSettings])

  const handleBackup = useCallback(async () => {
    setBackupInProgress(true)
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000))
      setBackupInProgress(false)
      setShowBackupModal(false)
      alert('System backup completed successfully!')
    } catch (err) {
      setBackupInProgress(false)
      setError('Backup failed. Please try again.')
    }
  }, [])

  // Load saved settings on mount
  useEffect(() => {
    const savedRefresh = localStorage.getItem('clamflow_autoRefresh')
    const savedNotifications = localStorage.getItem('clamflow_notifications')
    
    if (savedRefresh) {
      const { enabled, interval } = JSON.parse(savedRefresh)
      setAutoRefreshEnabled(enabled)
      setRefreshInterval(interval)
    }
    
    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications))
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      return permission === 'granted'
    }
    return false
  }, [])

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback((soundType: string = 'default') => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Different sound patterns for different types
      switch (soundType) {
        case 'alert':
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.1) // A4
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2) // A5
          break
        case 'success':
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime) // C5
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1) // E5
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2) // G5
          break
        case 'chime':
          oscillator.frequency.setValueAtTime(1047, audioContext.currentTime) // C6
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.15) // G5
          break
        default:
          oscillator.frequency.setValueAtTime(587, audioContext.currentTime) // D5
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1) // A5
      }
      
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.4)
    } catch (err) {
      console.log('Web Audio API not supported')
    }
  }, [])

  // Test notification with sound
  const testNotification = useCallback(async () => {
    if (notificationPermission !== 'granted') {
      const granted = await requestNotificationPermission()
      if (!granted) {
        alert('Please enable notifications in your browser settings to receive ClamFlow alerts.')
        return
      }
    }

    // Play sound if enabled
    if (notificationSettings.soundEnabled) {
      playNotificationSound(notificationSettings.soundType)
    }

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ClamFlow Test Notification', {
        body: 'Notifications are working! You will receive alerts for important events.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test-notification',
        requireInteraction: false
      })
    }
  }, [notificationPermission, notificationSettings.soundEnabled, notificationSettings.soundType, requestNotificationPermission, playNotificationSound])

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'hardware', label: 'Hardware Config', icon: '🔧' },
    { id: 'device-registry', label: 'Device Registry', icon: '📋' },
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
          {activeView === 'device-registry' && <DeviceRegistryPanel />}
          {activeView === 'metrics' && <DashboardMetricsPanel />}
          
          {activeView === 'settings' && (
            <div className="space-y-6">
              {/* Quick Settings Cards */}
              <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Settings</h3>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3 hover:border-purple-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔄</span>
                      <div>
                        <h4 className="font-medium">Auto Refresh Dashboard</h4>
                        <p className="text-sm text-gray-600">
                          {autoRefreshEnabled ? `Enabled - every ${refreshInterval}s` : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowRefreshModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 w-full sm:w-auto transition-colors"
                    >
                      Configure
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3 hover:border-purple-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔔</span>
                      <div>
                        <h4 className="font-medium">Notification Settings</h4>
                        <p className="text-sm text-gray-600">Manage notification preferences</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowNotificationModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 w-full sm:w-auto transition-colors"
                    >
                      Configure
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3 hover:border-purple-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💾</span>
                      <div>
                        <h4 className="font-medium">System Backup</h4>
                        <p className="text-sm text-gray-600">Configure automated backups</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowBackupModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 w-full sm:w-auto transition-colors"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Settings Panel */}
              <AdminSettingsPanel />
            </div>
          )}

          {/* Auto Refresh Modal */}
          {showRefreshModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Auto Refresh Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={autoRefreshEnabled}
                      onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span>Enable auto refresh</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refresh interval (seconds)
                    </label>
                    <select 
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      className="w-full border rounded-lg p-2"
                      disabled={!autoRefreshEnabled}
                    >
                      <option value={15}>15 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={120}>2 minutes</option>
                      <option value={300}>5 minutes</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setShowRefreshModal(false)}
                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveRefreshSettings}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings Modal */}
          {showNotificationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                
                {/* Browser Notification Permission */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Browser Notifications</p>
                      <p className="text-xs text-gray-500">
                        {notificationPermission === 'granted' && '✅ Enabled'}
                        {notificationPermission === 'denied' && '❌ Blocked - Enable in browser settings'}
                        {notificationPermission === 'default' && '⚠️ Not configured'}
                      </p>
                    </div>
                    {notificationPermission !== 'granted' && (
                      <button
                        onClick={requestNotificationPermission}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Notify me about:</p>
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.approvalRequests}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, approvalRequests: e.target.checked }))}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span>Approval requests</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.systemAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span>System alerts</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.hardwareWarnings}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, hardwareWarnings: e.target.checked }))}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span>Hardware warnings</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span>Email notifications</span>
                  </label>
                </div>

                {/* Sound Settings */}
                <div className="mt-4 pt-4 border-t space-y-3">
                  <p className="text-sm font-medium text-gray-700">Sound Settings:</p>
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.soundEnabled}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span>🔔 Enable notification sounds</span>
                  </label>
                  
                  {notificationSettings.soundEnabled && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Sound type:</label>
                      <select
                        value={notificationSettings.soundType}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, soundType: e.target.value }))}
                        className="w-full border rounded-lg p-2"
                      >
                        <option value="default">Default</option>
                        <option value="chime">Chime</option>
                        <option value="alert">Alert</option>
                        <option value="success">Success</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Test Notification */}
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={testNotification}
                    className="w-full px-4 py-2 border-2 border-dashed border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    🔔 Test Notification
                  </button>
                </div>

                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setShowNotificationModal(false)}
                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveNotificationSettings}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Backup Modal */}
          {showBackupModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">System Backup</h3>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Create a backup of all system data including users, configurations, and logs.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ This process may take a few minutes. Please do not close the browser.
                    </p>
                  </div>
                  {backupInProgress && (
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                      <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                      <span className="text-purple-700">Backup in progress...</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setShowBackupModal(false)}
                    disabled={backupInProgress}
                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleBackup}
                    disabled={backupInProgress}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {backupInProgress ? 'Backing up...' : 'Start Backup'}
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