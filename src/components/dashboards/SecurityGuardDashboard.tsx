"use client"

import React, { useState, useEffect } from 'react'
import { User } from '../../types/auth'
import clamflowAPI from '../../lib/clamflow-api'

interface SecurityGuardDashboardProps {
  currentUser: User | null
}

interface GateLogEntry {
  id: string
  vehicle_plate: string
  driver_name: string
  purpose: string
  entry_time: string
  exit_time: string | null
  status: 'entered' | 'exited' | 'pending'
}

interface RFIDScanEvent {
  id: string
  tag_id: string
  scanned_at: string
  location: string
  staff_name: string
  status: 'valid' | 'invalid' | 'unknown'
}

const SecurityGuardDashboard: React.FC<SecurityGuardDashboardProps> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<'overview' | 'gate-logs' | 'rfid-scans'>('overview')
  const [gateLogs, setGateLogs] = useState<GateLogEntry[]>([])
  const [rfidScans, setRFIDScans] = useState<RFIDScanEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch gate/vehicle data 
        try {
          const gateRes = await clamflowAPI.getVehicles()
          if (gateRes?.success && Array.isArray(gateRes.data)) {
            setGateLogs(
              gateRes.data.slice(0, 20).map((g: any) => ({
                id: g.id,
                vehicle_plate: g.vehicle_plate || g.vehicle_number || 'N/A',
                driver_name: g.driver_name || 'Unknown',
                purpose: g.purpose || g.pass_type || 'Delivery',
                entry_time: g.entry_time || g.created_at,
                exit_time: g.exit_time || null,
                status: g.exit_time ? 'exited' : g.entry_time ? 'entered' : 'pending'
              }))
            )
          }
        } catch (err) {
          console.warn('Could not fetch gate logs:', err)
        }

        // Fetch RFID tag events
        try {
          const rfidRes = await clamflowAPI.getRFIDTags()
          if (rfidRes?.success && Array.isArray(rfidRes.data)) {
            setRFIDScans(
              rfidRes.data.slice(0, 20).map((r: any) => ({
                id: r.id,
                tag_id: r.tag_id || r.rfid_tag || 'Unknown',
                scanned_at: r.scanned_at || r.created_at,
                location: r.location || r.station || 'Gate',
                staff_name: r.staff_name || 'N/A',
                status: r.status || 'valid'
              }))
            )
          }
        } catch (err) {
          console.warn('Could not fetch RFID tags:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-500 mt-2">Loading security dashboard...</p>
      </div>
    )
  }

  const vehiclesOnSite = gateLogs.filter(g => g.status === 'entered').length

  return (
    <div className="p-6 space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'overview', label: 'Overview', icon: '🛡️' },
          { key: 'gate-logs', label: 'Gate Logs', icon: '🚧' },
          { key: 'rfid-scans', label: 'RFID Scans', icon: '📡' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key as typeof activeView)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
              activeView === tab.key
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
            <h2 className="text-xl font-bold">Welcome, {currentUser?.full_name || 'Security Guard'}</h2>
            <p className="text-red-100 mt-1">Security & Gate Control Dashboard</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Vehicles On-Site</p>
                  <p className="text-2xl font-bold text-gray-900">{vehiclesOnSite}</p>
                </div>
                <span className="text-2xl">🚛</span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gate Entries Today</p>
                  <p className="text-2xl font-bold text-gray-900">{gateLogs.length}</p>
                </div>
                <span className="text-2xl">🚧</span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">RFID Scans</p>
                  <p className="text-2xl font-bold text-gray-900">{rfidScans.length}</p>
                </div>
                <span className="text-2xl">📡</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="/gate-pass"
                className="flex items-center p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
              >
                <span className="text-2xl mr-3">🚧</span>
                <div>
                  <p className="font-medium text-red-900">Gate Pass Management</p>
                  <p className="text-sm text-red-600">Log vehicle entries & exits</p>
                </div>
              </a>
              <a
                href="/devices"
                className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <span className="text-2xl mr-3">📡</span>
                <div>
                  <p className="font-medium text-blue-900">RFID Devices</p>
                  <p className="text-sm text-blue-600">Monitor RFID scanners</p>
                </div>
              </a>
            </div>
          </div>

          {/* Recent Gate Activity */}
          {gateLogs.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Gate Activity</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {gateLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{log.vehicle_plate}</p>
                      <p className="text-sm text-gray-500">{log.driver_name} — {log.purpose}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === 'entered' ? 'bg-green-100 text-green-800' :
                      log.status === 'exited' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gate Logs View */}
      {activeView === 'gate-logs' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gate Logs</h3>
              <p className="text-sm text-gray-500">Vehicle entry and exit records</p>
            </div>
            <a
              href="/gate-pass"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors min-h-[44px] flex items-center"
            >
              Manage Gate Passes
            </a>
          </div>
          {gateLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700">Vehicle</th>
                    <th className="text-left p-3 font-medium text-gray-700">Driver</th>
                    <th className="text-left p-3 font-medium text-gray-700">Purpose</th>
                    <th className="text-left p-3 font-medium text-gray-700">Entry</th>
                    <th className="text-left p-3 font-medium text-gray-700">Exit</th>
                    <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {gateLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{log.vehicle_plate}</td>
                      <td className="p-3 text-gray-600">{log.driver_name}</td>
                      <td className="p-3 text-gray-600">{log.purpose}</td>
                      <td className="p-3 text-gray-600">
                        {log.entry_time ? new Date(log.entry_time).toLocaleString() : '—'}
                      </td>
                      <td className="p-3 text-gray-600">
                        {log.exit_time ? new Date(log.exit_time).toLocaleString() : '—'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.status === 'entered' ? 'bg-green-100 text-green-800' :
                          log.status === 'exited' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <span className="text-3xl block mb-2">🚧</span>
              <p>No gate log entries found</p>
            </div>
          )}
        </div>
      )}

      {/* RFID Scans View */}
      {activeView === 'rfid-scans' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">RFID Scan History</h3>
            <p className="text-sm text-gray-500">Recent RFID tag scan events</p>
          </div>
          {rfidScans.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {rfidScans.map((scan) => (
                <div key={scan.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 font-mono">{scan.tag_id}</p>
                    <p className="text-sm text-gray-500">
                      {scan.location} • {scan.staff_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      scan.status === 'valid' ? 'bg-green-100 text-green-800' :
                      scan.status === 'invalid' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {scan.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(scan.scanned_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <span className="text-3xl block mb-2">📡</span>
              <p>No RFID scan events recorded</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SecurityGuardDashboard
