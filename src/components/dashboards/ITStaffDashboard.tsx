// src/components/dashboards/ITStaffDashboard.tsx
// IT Staff Dashboard — Hardware & Network Management
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/auth';
import clamflowAPI, { AuditLog } from '@/lib/clamflow-api';
import { SystemHealthData } from '@/types/dashboard';
import { DeviceRegistry } from '@/components/hardware/DeviceRegistry';
import { HardwareConfig } from '@/components/hardware/HardwareConfig';
import { DeviceRFIDHandover } from '@/components/hardware/DeviceRFIDHandover';

// ============================================
// INTERFACES
// ============================================

interface ITStaffDashboardProps {
  currentUser: User | null;
}

type ActiveTab =
  | 'overview'
  | 'device-registry'
  | 'hardware-config'
  | 'rfid-handover'
  | 'system-health'
  | 'audit-log';

type HardwareConfigTab = 'rfid' | 'face_recognition' | 'label_printer' | 'qr_code';

// ============================================
// COMPONENT
// ============================================

const ITStaffDashboard: React.FC<ITStaffDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [hardwareConfigTab, setHardwareConfigTab] = useState<HardwareConfigTab>('rfid');

  // System Health
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Audit Log
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchSystemHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await clamflowAPI.getSystemHealth();
      if (res.success && res.data) setSystemHealth(res.data);
    } catch {
      // Silently ignore — health may be unavailable if backend is down
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await clamflowAPI.getAuditLogs();
      if (res.success && res.data) setAuditLogs(res.data);
    } catch {
      // Silently ignore
    } finally {
      setAuditLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchSystemHealth();
    fetchAuditLogs();
  }, [fetchSystemHealth, fetchAuditLogs]);

  // ============================================
  // HELPERS
  // ============================================

  const healthStatusColour = (status: string | undefined) => {
    if (status === 'healthy') return 'text-green-600 bg-green-50 border-green-200';
    if (status === 'warning') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const serviceStatusBadge = (ok: boolean) =>
    ok
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-red-100 text-red-700 border-red-200';

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'overview',         label: 'Overview',        icon: '🖥️' },
    { id: 'device-registry',  label: 'Device Registry', icon: '📋' },
    { id: 'hardware-config',  label: 'Hardware Config', icon: '⚙️' },
    { id: 'rfid-handover',    label: 'RFID Handover',   icon: '🔁' },
    { id: 'system-health',    label: 'System Health',   icon: '❤️' },
    { id: 'audit-log',        label: 'Audit Log',       icon: '📜' },
  ];

  const hwConfigTabs: { id: HardwareConfigTab; label: string }[] = [
    { id: 'rfid',             label: 'RFID Reader' },
    { id: 'face_recognition', label: 'Face Recognition' },
    { id: 'label_printer',    label: 'Label Printer' },
    { id: 'qr_code',          label: 'QR Code' },
  ];

  // ============================================
  // TAB PANELS
  // ============================================

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl p-6 text-white shadow-md">
        <p className="text-indigo-100 text-sm font-medium uppercase tracking-wide">IT Staff Dashboard</p>
        <h2 className="text-2xl font-bold mt-1">
          Welcome, {currentUser?.full_name ?? 'IT Staff'}
        </h2>
        <p className="text-indigo-200 mt-1 text-sm">Hardware &amp; Network Management</p>
      </div>

      {/* System health snapshot */}
      {systemHealth && (
        <div className={`rounded-xl border p-5 ${healthStatusColour(systemHealth.status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">System Status</p>
              <p className="text-xl font-bold capitalize mt-0.5">{systemHealth.status}</p>
              <p className="text-sm mt-1 opacity-80">Uptime: {systemHealth.uptime}</p>
            </div>
            <span className="text-4xl">
              {systemHealth.status === 'healthy' ? '✅' : systemHealth.status === 'warning' ? '⚠️' : '🔴'}
            </span>
          </div>
          {/* Services row */}
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(systemHealth.services).map(([svc, ok]) => (
              <span
                key={svc}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${serviceStatusBadge(ok as boolean)}`}
              >
                {svc}: {ok ? 'OK' : 'DOWN'}
              </span>
            ))}
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${serviceStatusBadge(systemHealth.database.status === 'connected')}`}>
              DB: {systemHealth.database.status} ({systemHealth.database.response_time}ms)
            </span>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'View Devices',    tab: 'device-registry' as ActiveTab, icon: '📋' },
            { label: 'Hardware Config', tab: 'hardware-config' as ActiveTab, icon: '⚙️' },
            { label: 'RFID Handover',  tab: 'rfid-handover' as ActiveTab,   icon: '🔁' },
            { label: 'Audit Log',      tab: 'audit-log' as ActiveTab,       icon: '📜' },
          ].map(({ label, tab, icon }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex flex-col items-center justify-center gap-1 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-colors shadow-sm"
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent audit events */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Audit Events</h3>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No audit events available.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm overflow-hidden">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{log.full_name} · {log.role}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${log.status === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {log.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSystemHealth = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
        <button
          onClick={fetchSystemHealth}
          disabled={healthLoading}
          className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {healthLoading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {healthLoading && !systemHealth && (
        <p className="text-sm text-gray-500 italic">Loading system health…</p>
      )}

      {systemHealth ? (
        <div className="space-y-4">
          {/* Overall status */}
          <div className={`rounded-xl border p-5 ${healthStatusColour(systemHealth.status)}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {systemHealth.status === 'healthy' ? '✅' : systemHealth.status === 'warning' ? '⚠️' : '🔴'}
              </span>
              <div>
                <p className="font-bold text-lg capitalize">{systemHealth.status}</p>
                <p className="text-sm opacity-80">Uptime: {systemHealth.uptime}</p>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="font-semibold text-gray-800 text-sm">Services</h4>
            </div>
            <div className="divide-y divide-gray-100">
              {Object.entries(systemHealth.services).map(([svc, ok]) => (
                <div key={svc} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm capitalize text-gray-700">{svc}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${serviceStatusBadge(ok as boolean)}`}>
                    {ok ? 'Operational' : 'Down'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Database */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="font-semibold text-gray-800 text-sm">Database</h4>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-700">Connection</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${serviceStatusBadge(systemHealth.database.status === 'connected')}`}>
                  {systemHealth.database.status}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-700">Response Time</span>
                <span className="text-sm font-medium text-gray-900">{systemHealth.database.response_time} ms</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        !healthLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
            System health data unavailable. Backend may be offline.
          </div>
        )
      )}
    </div>
  );

  const renderAuditLog = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Audit Log</h3>
        <button
          onClick={fetchAuditLogs}
          disabled={auditLoading}
          className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {auditLoading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {auditLoading && auditLogs.length === 0 && (
        <p className="text-sm text-gray-500 italic">Loading audit log…</p>
      )}

      {auditLogs.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">IP</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{log.role}</td>
                    <td className="px-4 py-3 text-gray-800">{log.action}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{log.ip_address}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${log.status === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !auditLoading && (
          <p className="text-sm text-gray-400 italic">No audit log entries available.</p>
        )
      )}
    </div>
  );

  const renderHardwareConfig = () => (
    <div className="space-y-4">
      {/* Sub-tabs for hardware type */}
      <div className="flex gap-2 flex-wrap border-b border-gray-200 pb-3">
        {hwConfigTabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setHardwareConfigTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hardwareConfigTab === id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <HardwareConfig hardwareType={hardwareConfigTab} />
    </div>
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto mb-6 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div>
        {activeTab === 'overview'        && renderOverview()}
        {activeTab === 'device-registry' && <DeviceRegistry />}
        {activeTab === 'hardware-config' && renderHardwareConfig()}
        {activeTab === 'rfid-handover'   && <DeviceRFIDHandover />}
        {activeTab === 'system-health'   && renderSystemHealth()}
        {activeTab === 'audit-log'       && renderAuditLog()}
      </div>
    </div>
  );
};

export default ITStaffDashboard;
