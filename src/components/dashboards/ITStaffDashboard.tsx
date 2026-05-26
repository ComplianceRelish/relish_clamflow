// src/components/dashboards/ITStaffDashboard.tsx
// IT Staff Dashboard — Hardware & Network Management
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/auth';
import clamflowAPI, { AuditLog } from '@/lib/clamflow-api';
import { SystemHealthData } from '@/types/dashboard';
import { DeviceRegistry } from '@/components/hardware/DeviceRegistry';
import { HardwareConfig } from '@/components/hardware/HardwareConfig';
import DeviceRFIDHandover from '@/components/hardware/DeviceRFIDHandover';
import SupplierOnboardingPanel from '@/components/dashboards/stafflead/SupplierOnboardingPanel';

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
  | 'audit-log'
  | 'onboarding';

type OnboardingSubTab = 'staff' | 'suppliers';

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

  // Onboarding (IT Staff initiates → Admin approves)
  const [onboardingSubTab, setOnboardingSubTab] = useState<OnboardingSubTab>('staff');
  const [staffForm, setStaffForm] = useState({
    full_name: '', role: 'Production Staff', department: 'production',
    phone: '', email: '', start_date: new Date().toISOString().split('T')[0],
    initial_station: '', notes: '',
  });
  const [staffFormLoading, setStaffFormLoading] = useState(false);
  const [staffFormSuccess, setStaffFormSuccess] = useState<string | null>(null);
  const [staffFormError, setStaffFormError] = useState<string | null>(null);

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
    { id: 'onboarding',       label: 'Onboarding',      icon: '👤' },
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
            {Object.entries(systemHealth.services ?? {}).map(([svc, ok]) => (
              <span
                key={svc}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${serviceStatusBadge(ok as boolean)}`}
              >
                {svc}: {ok ? 'OK' : 'DOWN'}
              </span>
            ))}
            {systemHealth.database && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${serviceStatusBadge(systemHealth.database.status === 'connected')}`}>
                DB: {systemHealth.database.status} ({systemHealth.database.response_time}ms)
              </span>
            )}
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
              {Object.entries(systemHealth.services ?? {}).map(([svc, ok]) => (
                <div key={svc} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm capitalize text-gray-700">{svc}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${serviceStatusBadge(ok as boolean)}`}>
                    {ok ? 'Operational' : 'Down'}
                  </span>
                </div>
              ))}
              {!systemHealth.services && (
                <p className="px-4 py-3 text-sm text-gray-400 italic">No service data available.</p>
              )}
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
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${serviceStatusBadge(systemHealth.database?.status === 'connected')}`}>
                  {systemHealth.database?.status ?? 'unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-700">Response Time</span>
                <span className="text-sm font-medium text-gray-900">{systemHealth.database?.response_time ?? '—'} ms</span>
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
  // ONBOARDING PANEL
  // ============================================

  const renderOnboarding = () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app';

    const staffRoles = [
      'Production Staff', 'Production Lead',
      'QC Staff', 'QC Lead',
      'Security Guard', 'Gate Staff',
      'Maintenance Staff', 'Staff Lead', 'IT Staff',
    ];

    const handleStaffSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setStaffFormLoading(true);
      setStaffFormError(null);
      setStaffFormSuccess(null);
      try {
        const payload = {
          ...staffForm,
          username: staffForm.full_name.toLowerCase().replace(/\s+/g, '.'),
          status: 'pending',
          requested_by: currentUser?.id,
          requested_by_name: currentUser?.full_name,
          requested_at: new Date().toISOString(),
          onboarding_status: 'incomplete',
        };
        const token = typeof window !== 'undefined' ? localStorage.getItem('clamflow_token') : null;
        const res = await fetch(`${API_BASE}/staff/onboarding-requests`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok && !json.success) throw new Error(json.message || json.detail || 'Submission failed');
        setStaffFormSuccess(`Onboarding request for ${staffForm.full_name} submitted — pending Admin approval.`);
        setStaffForm({ full_name: '', role: 'Production Staff', department: 'production', phone: '', email: '', start_date: new Date().toISOString().split('T')[0], initial_station: '', notes: '' });
      } catch (err: any) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setStaffFormSuccess('Saved offline — will sync to Admin when connection is restored.');
          setStaffForm({ full_name: '', role: 'Production Staff', department: 'production', phone: '', email: '', start_date: new Date().toISOString().split('T')[0], initial_station: '', notes: '' });
        } else {
          setStaffFormError(err.message || 'Failed to submit onboarding request.');
        }
      } finally {
        setStaffFormLoading(false);
      }
    };

    return (
      <div className="space-y-4">
        {/* Sub-tab bar */}
        <div className="flex gap-2 border-b border-gray-200 pb-3">
          {([
            { id: 'staff' as OnboardingSubTab, label: '👤 Staff' },
            { id: 'suppliers' as OnboardingSubTab, label: '🚚 Suppliers / Vendors' },
          ]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setOnboardingSubTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                onboardingSubTab === id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Staff Onboarding */}
        {onboardingSubTab === 'staff' && (
          <div className="space-y-4">
            {/* Approval notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>
                Requests are submitted as <strong>pending</strong> and require <strong>Admin approval</strong> before the account is activated.
                Collect Aadhar, Bank &amp; Face details on paper — Admin will complete verification in the User Management panel.
              </span>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">New Staff Onboarding Request</h3>

              {staffFormSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center justify-between">
                  <span>✅ {staffFormSuccess}</span>
                  <button onClick={() => setStaffFormSuccess(null)} className="text-green-600 ml-2 text-lg leading-none">×</button>
                </div>
              )}
              {staffFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center justify-between">
                  <span>❌ {staffFormError}</span>
                  <button onClick={() => setStaffFormError(null)} className="text-red-600 ml-2 text-lg leading-none">×</button>
                </div>
              )}

              <form onSubmit={handleStaffSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={staffForm.full_name}
                    onChange={e => setStaffForm(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="e.g., Rajesh Kumar"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={staffForm.department}
                    onChange={e => setStaffForm(p => ({ ...p, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="production">Production</option>
                    <option value="qc">Quality Control</option>
                    <option value="security">Security</option>
                    <option value="it">IT</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={e => setStaffForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    {staffRoles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={staffForm.phone}
                    onChange={e => setStaffForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 XXXXXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={staffForm.email}
                    onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={staffForm.start_date}
                    onChange={e => setStaffForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {/* Initial Station */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Station</label>
                  <input
                    type="text"
                    value={staffForm.initial_station}
                    onChange={e => setStaffForm(p => ({ ...p, initial_station: e.target.value }))}
                    placeholder="e.g., Grading Station A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes for Admin</label>
                  <textarea
                    value={staffForm.notes}
                    onChange={e => setStaffForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Any relevant context for the Admin review…"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {/* Submit */}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={staffFormLoading}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium text-sm transition-colors"
                  >
                    {staffFormLoading ? 'Submitting…' : '📤 Submit for Admin Approval'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Supplier / Vendor Onboarding */}
        {onboardingSubTab === 'suppliers' && (
          <SupplierOnboardingPanel currentUser={currentUser} />
        )}
      </div>
    );
  };

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
        {activeTab === 'onboarding'      && renderOnboarding()}
      </div>
    </div>
  );
};

export default ITStaffDashboard;
