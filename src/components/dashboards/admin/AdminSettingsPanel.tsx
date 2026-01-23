"use client";

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Save,
  Info,
  Volume2,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';

interface AdminSettingsPanelProps {
  onClose?: () => void;
}

// Current user permissions (would come from AuthContext in production)
interface UserPermissions {
  canApproveStaff: boolean;
  canManageDepartments: boolean;
  canConfigureSystem: boolean;
  canManageDevices: boolean;
  canViewReports: boolean;
  assignedBy: string;
  assignedAt: string;
}

const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  
  // Notification preferences (user CAN control these)
  const [notifications, setNotifications] = useState({
    newApprovals: true,
    departmentAlerts: true,
    systemMaintenance: false,
    deviceAlerts: true,
    soundEnabled: true,
    soundType: 'default' as 'default' | 'chime' | 'bell'
  });

  // Display preferences (user CAN control these)
  const [displayPrefs, setDisplayPrefs] = useState({
    theme: 'light' as 'light' | 'dark' | 'system',
    compactMode: false,
    autoRefresh: true,
    refreshInterval: 30
  });

  // Permissions are READ-ONLY - set by Super Admin
  const [permissions] = useState<UserPermissions>({
    canApproveStaff: true,
    canManageDepartments: true,
    canConfigureSystem: false,
    canManageDevices: true,
    canViewReports: true,
    assignedBy: 'Super Admin',
    assignedAt: '2026-01-15'
  });

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedNotifications = localStorage.getItem('clamflow_admin_notifications');
    const savedDisplay = localStorage.getItem('clamflow_admin_display');
    
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Failed to parse notification settings', e);
      }
    }
    
    if (savedDisplay) {
      try {
        setDisplayPrefs(JSON.parse(savedDisplay));
      } catch (e) {
        console.error('Failed to parse display settings', e);
      }
    }
    
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('clamflow_admin_notifications', JSON.stringify(notifications));
    localStorage.setItem('clamflow_admin_display', JSON.stringify(displayPrefs));
    alert('Settings saved successfully!');
    onClose?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Settings</h2>
        <p className="text-sm text-gray-600">Configure your notification and display preferences</p>
      </div>

      {/* Current Permissions - READ ONLY */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Your Permissions</h3>
          </div>
          <div className="flex items-center text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            <Info className="w-3 h-3 mr-1" />
            Read-only (managed by Super Admin)
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`flex items-center p-2 rounded ${permissions.canApproveStaff ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            <span className="w-5 h-5 mr-2">{permissions.canApproveStaff ? '✓' : '✗'}</span>
            <span className="text-sm">Approve staff requests</span>
          </div>
          <div className={`flex items-center p-2 rounded ${permissions.canManageDepartments ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            <span className="w-5 h-5 mr-2">{permissions.canManageDepartments ? '✓' : '✗'}</span>
            <span className="text-sm">Manage department assignments</span>
          </div>
          <div className={`flex items-center p-2 rounded ${permissions.canConfigureSystem ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            <span className="w-5 h-5 mr-2">{permissions.canConfigureSystem ? '✓' : '✗'}</span>
            <span className="text-sm">System configuration access</span>
          </div>
          <div className={`flex items-center p-2 rounded ${permissions.canManageDevices ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            <span className="w-5 h-5 mr-2">{permissions.canManageDevices ? '✓' : '✗'}</span>
            <span className="text-sm">Manage devices</span>
          </div>
          <div className={`flex items-center p-2 rounded ${permissions.canViewReports ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            <span className="w-5 h-5 mr-2">{permissions.canViewReports ? '✓' : '✗'}</span>
            <span className="text-sm">View reports</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Assigned by: {permissions.assignedBy} on {permissions.assignedAt}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Preferences - User CAN control */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-green-600 mr-3"
                checked={notifications.newApprovals}
                onChange={(e) => setNotifications({...notifications, newApprovals: e.target.checked})}
              />
              <span className="text-sm">New approval requests</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-green-600 mr-3"
                checked={notifications.departmentAlerts}
                onChange={(e) => setNotifications({...notifications, departmentAlerts: e.target.checked})}
              />
              <span className="text-sm">Department alerts</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-green-600 mr-3"
                checked={notifications.deviceAlerts}
                onChange={(e) => setNotifications({...notifications, deviceAlerts: e.target.checked})}
              />
              <span className="text-sm">Device connection alerts</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-green-600 mr-3"
                checked={notifications.systemMaintenance}
                onChange={(e) => setNotifications({...notifications, systemMaintenance: e.target.checked})}
              />
              <span className="text-sm">System maintenance</span>
            </label>
            
            <hr className="my-3" />
            
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-green-600 mr-3"
                checked={notifications.soundEnabled}
                onChange={(e) => setNotifications({...notifications, soundEnabled: e.target.checked})}
              />
              <Volume2 className="w-4 h-4 mr-2" />
              <span className="text-sm">Enable notification sounds</span>
            </label>
            
            {notifications.soundEnabled && (
              <select 
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={notifications.soundType}
                onChange={(e) => setNotifications({...notifications, soundType: e.target.value as 'default' | 'chime' | 'bell'})}
              >
                <option value="default">Default</option>
                <option value="chime">Chime</option>
                <option value="bell">Bell</option>
              </select>
            )}
          </div>
        </div>

        {/* Display Preferences - User CAN control */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Monitor className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Display</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Theme</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDisplayPrefs({...displayPrefs, theme: 'light'})}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${
                    displayPrefs.theme === 'light' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Light
                </button>
                <button
                  onClick={() => setDisplayPrefs({...displayPrefs, theme: 'dark'})}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${
                    displayPrefs.theme === 'dark' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </button>
              </div>
            </div>
            
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-blue-600 mr-3"
                checked={displayPrefs.compactMode}
                onChange={(e) => setDisplayPrefs({...displayPrefs, compactMode: e.target.checked})}
              />
              <span className="text-sm">Compact mode</span>
            </label>
            
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-blue-600 mr-3"
                checked={displayPrefs.autoRefresh}
                onChange={(e) => setDisplayPrefs({...displayPrefs, autoRefresh: e.target.checked})}
              />
              <span className="text-sm">Auto-refresh dashboard</span>
            </label>
            
            {displayPrefs.autoRefresh && (
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Refresh interval</label>
                <select 
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={displayPrefs.refreshInterval}
                  onChange={(e) => setDisplayPrefs({...displayPrefs, refreshInterval: parseInt(e.target.value)})}
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onClose && (
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button 
          onClick={handleSaveSettings}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save className="w-5 h-5" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsPanel;