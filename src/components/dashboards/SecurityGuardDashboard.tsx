"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { User } from '../../types/auth'
import clamflowAPI, { AttendanceWsEvent, RFIDTagResponse, CameraDetectionEvent, AttendanceMonitorEntry, VisitorSubjectType } from '../../lib/clamflow-api'

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app')
  .replace(/^http/, 'ws').replace(/\/$/, '')
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app')
  .replace(/\/$/, '')

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

interface OverrideRequest {
  id: string
  personName: string
  personId: string
  location: string
  reason: string
  timestamp: string
  status: 'pending' | 'resolved'
}

const loadOverrideRequests = (): OverrideRequest[] => {
  if (typeof window === 'undefined') return []
  const today = new Date().toISOString().slice(0, 10)
  const stored = localStorage.getItem(`clamflow_overrides_${today}`)
  if (!stored) return []
  try { return JSON.parse(stored) as OverrideRequest[] } catch { return [] }
}

// ── Detection card — shared between Camera tab and security-monitor ─────────
// Renders one CameraDetectionEvent as a card with 5 branches matching the
// backend's subject_type values from POST /api/visitors/identify:
//   staff           → green   — known plant employee, no pass needed
//   known_visitor   → blue    — valid active pass
//   expired_visitor → amber   — face known, pass lapsed → guard renews
//   new_visitor     → slate   — no match → registration prompt
//   no_face         → gray    — camera didn't detect a face

const SUBJECT_BADGE: Record<string, { label: string; light: string; dark: string }> = {
  staff:           { label: 'Staff',            light: 'bg-green-100 text-green-800 border-green-300',      dark: 'bg-green-900/60 text-green-300 border-green-700' },
  known_visitor:   { label: 'Known Visitor',    light: 'bg-blue-100 text-blue-800 border-blue-300',         dark: 'bg-blue-900/60 text-blue-300 border-blue-700' },
  expired_visitor: { label: 'Expired Pass',     light: 'bg-amber-100 text-amber-800 border-amber-300',      dark: 'bg-amber-900/60 text-amber-300 border-amber-700' },
  new_visitor:     { label: 'New / Unknown',    light: 'bg-slate-100 text-slate-700 border-slate-300',      dark: 'bg-slate-700/60 text-slate-300 border-slate-600' },
  no_face:         { label: 'No Face',          light: 'bg-gray-100 text-gray-500 border-gray-200',         dark: 'bg-gray-800/60 text-gray-500 border-gray-700' },
}

interface DetectionCardProps {
  ev: CameraDetectionEvent
  isFirst: boolean
  dark: boolean  // true = security-monitor dark theme, false = dashboard light theme
}

function DetectionCard({ ev, isFirst, dark }: DetectionCardProps) {
  const badge = SUBJECT_BADGE[ev.subject_type] ?? SUBJECT_BADGE['no_face']
  const badgeCls = dark ? badge.dark : badge.light
  const rowBg   = dark
    ? (isFirst ? 'bg-gray-800/50' : '')
    : (isFirst ? 'bg-gray-50' : '')
  const textPri = dark ? 'text-white' : 'text-gray-900'
  const textSec = dark ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`px-4 py-3 flex items-start justify-between gap-3 ${rowBg}`}>
      <div className="min-w-0 flex-1">
        {/* Badge row */}
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 border ${badgeCls}`}>
            {badge.label}
          </span>

          {/* Primary name */}
          {ev.subject_type === 'staff' && ev.person && (
            <p className={`font-semibold truncate ${textPri}`}>{ev.person.full_name}</p>
          )}
          {(ev.subject_type === 'known_visitor' || ev.subject_type === 'expired_visitor') && ev.visitor && (
            <p className={`font-semibold truncate ${textPri}`}>{ev.visitor.name}</p>
          )}
          {ev.subject_type === 'new_visitor' && (
            <p className={`italic ${textSec}`}>Register this visitor →</p>
          )}
          {ev.subject_type === 'no_face' && (
            <p className={`italic ${textSec}`}>Reposition — no face detected</p>
          )}
        </div>

        {/* Detail line */}
        {ev.subject_type === 'staff' && ev.person && (
          <p className={`text-xs ${textSec}`}>{ev.person.role} · {ev.location}</p>
        )}
        {ev.subject_type === 'known_visitor' && ev.visitor && (
          <p className="text-xs text-blue-500">
            {ev.visitor.organisation ? `${ev.visitor.organisation} · ` : ''}
            {ev.visitor.visitor_category ?? ''}
            {ev.visitor.visit_count ? ` · visit #${ev.visitor.visit_count}` : ''}
            {ev.visitor.valid_until
              ? ` · valid until ${new Date(ev.visitor.valid_until).toLocaleTimeString()}`
              : ' · permanent'}
          </p>
        )}
        {ev.subject_type === 'expired_visitor' && ev.visitor && (
          <p className="text-xs text-amber-500">
            {ev.visitor.organisation ? `${ev.visitor.organisation} · ` : ''}
            Pass expired — tap to renew
            {ev.visitor.valid_until
              ? ` (expired ${new Date(ev.visitor.valid_until).toLocaleDateString()})`
              : ''}
          </p>
        )}
        {ev.subject_type === 'new_visitor' && (
          <a
            href="/gate-pass/visitors"
            className="text-xs text-slate-400 underline hover:text-slate-200"
          >
            Open visitor registration
          </a>
        )}
      </div>

      {/* Right column — confidence + time */}
      <div className="text-right flex-shrink-0">
        {ev.subject_type !== 'no_face' && ev.confidence > 0 && (
          // Rekognition returns 0–100 (not 0–1)
          <p className={`text-sm font-bold ${textPri}`}>{ev.confidence.toFixed(1)}%</p>
        )}
        <p className={`text-xs font-mono mt-0.5 ${textSec}`}>
          {new Date(ev.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

const SecurityGuardDashboard: React.FC<SecurityGuardDashboardProps> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<'overview' | 'gate-logs' | 'rfid-scans' | 'attendance' | 'box-gate' | 'camera' | 'override'>('overview')
  const [gateLogs, setGateLogs] = useState<GateLogEntry[]>([])
  const [rfidScans, setRFIDScans] = useState<RFIDScanEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [attendanceFeed, setAttendanceFeed] = useState<AttendanceWsEvent[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  // Box Gate state
  const [boxTallyCount, setBoxTallyCount] = useState<number | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [tagResult, setTagResult] = useState<RFIDTagResponse | null | 'not-found'>(null)
  const [tagLookupLoading, setTagLookupLoading] = useState(false)
  const [gateTagList, setGateTagList] = useState<string[]>([])
  const [gateTagEntry, setGateTagEntry] = useState('')
  const [gateMode, setGateMode] = useState<'entry' | 'exit'>('entry')
  const [gateSubmitting, setGateSubmitting] = useState(false)
  const [gateResult, setGateResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Camera detection state
  const [cameraLocation, setCameraLocation] = useState('docks')
  const [cameraFeedKey, setCameraFeedKey] = useState(0)
  const [cameraDetectionFeed, setCameraDetectionFeed] = useState<CameraDetectionEvent[]>([])
  const cameraWsRef = useRef<WebSocket | null>(null)

  // Attendance monitor (who is on-site right now)
  const [onSiteNow, setOnSiteNow] = useState<AttendanceMonitorEntry[]>([])

  // Supervisor override request queue (persisted to localStorage per day)
  const [overrideRequests, setOverrideRequests] = useState<OverrideRequest[]>(loadOverrideRequests)
  const [overrideForm, setOverrideForm] = useState({
    personName: '',
    personId: '',
    location: 'main_gate',
    reason: 'Authentication failed — both face and RFID unavailable',
  })

  // Live attendance WebSocket
  const connectAttendanceWS = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return
    try {
      const ws = new WebSocket(`${WS_BASE}/api/attendance/ws/attendance`)
      ws.onmessage = (e) => {
        try {
          const event: AttendanceWsEvent = JSON.parse(e.data)
          setAttendanceFeed(prev => [event, ...prev].slice(0, 50))
        } catch { /* ignore malformed frames */ }
      }
      ws.onclose = () => {
        // Auto-reconnect after 5 s
        setTimeout(connectAttendanceWS, 5000)
      }
      wsRef.current = ws
    } catch (err) {
      console.warn('[SecurityGuardDashboard] WS connect failed:', err)
    }
  }, [])

  const connectCameraWS = useCallback(() => {
    if (cameraWsRef.current && cameraWsRef.current.readyState <= WebSocket.OPEN) return
    try {
      const ws = new WebSocket(`${WS_BASE}/ws/camera-detections`)
      ws.onmessage = (e) => {
        try {
          const event: CameraDetectionEvent = JSON.parse(e.data)
          setCameraDetectionFeed(prev => [event, ...prev].slice(0, 20))
          setCameraFeedKey(k => k + 1)
        } catch { /* ignore malformed frames */ }
      }
      ws.onclose = () => { setTimeout(connectCameraWS, 5000) }
      cameraWsRef.current = ws
    } catch (err) {
      console.warn('[SecurityGuardDashboard] Camera WS connect failed:', err)
    }
  }, [])

  useEffect(() => {
    connectAttendanceWS()
    return () => { wsRef.current?.close() }
  }, [connectAttendanceWS])

  useEffect(() => {
    connectCameraWS()
    return () => { cameraWsRef.current?.close() }
  }, [connectCameraWS])

  // Poll camera snapshot only while the Camera tab is active
  useEffect(() => {
    if (activeView !== 'camera') return
    const id = setInterval(() => setCameraFeedKey(k => k + 1), 2000)
    return () => clearInterval(id)
  }, [activeView])

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

        // Fetch who is currently on-site
        try {
          const monitorRes = await clamflowAPI.getAttendanceMonitor()
          if (monitorRes?.success && Array.isArray(monitorRes.data)) {
            setOnSiteNow(monitorRes.data)
          }
        } catch (err) {
          console.warn('Could not fetch attendance monitor:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  useEffect(() => {
    clamflowAPI.getBoxTally().then((res: any) => {
      const data = res?.data
      if (Array.isArray(data)) setBoxTallyCount(data.length)
      else if (typeof data?.count === 'number') setBoxTallyCount(data.count)
      else if (typeof data?.total === 'number') setBoxTallyCount(data.total)
    }).catch(() => { /* silently ignore */ })
  }, [])

  // Persist override requests to localStorage whenever they change
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem(`clamflow_overrides_${today}`, JSON.stringify(overrideRequests))
  }, [overrideRequests])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-500 mt-2">Loading security dashboard...</p>
      </div>
    )
  }

  const vehiclesOnSite = gateLogs.filter(g => g.status === 'entered').length
  const pendingOverrideCount = overrideRequests.filter(r => r.status === 'pending').length

  return (
    <div className="p-6 space-y-6">
      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'overview', label: 'Overview', icon: '🛡️' },
          { key: 'gate-logs', label: 'Gate Logs', icon: '🚧' },
          { key: 'rfid-scans', label: 'RFID Scans', icon: '📡' },
          { key: 'attendance', label: 'Live Attendance', icon: '👁️' },
          { key: 'box-gate', label: 'Box Gate', icon: '📦' },
          { key: 'camera', label: 'Camera', icon: '📹' },
          { key: 'override', label: 'Override', icon: '🚨' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key as typeof activeView)}
            className={`flex-shrink-0 py-2 px-3 rounded-md text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap ${
              activeView === tab.key
                ? tab.key === 'override'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-red-700 shadow-sm'
                : tab.key === 'override' && pendingOverrideCount > 0
                  ? 'text-red-600 hover:text-red-800'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
            {tab.key === 'override' && pendingOverrideCount > 0 && activeView !== 'override' && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-red-600 text-white text-xs rounded-full leading-none">
                {pendingOverrideCount}
              </span>
            )}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <p className="text-sm text-gray-500">Staff On-Site</p>
                  <p className="text-2xl font-bold text-gray-900">{onSiteNow.length}</p>
                </div>
                <span className="text-2xl">👷</span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Boxes On-Site</p>
                  <p className="text-2xl font-bold text-gray-900">{boxTallyCount ?? '—'}</p>
                </div>
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="/gate-pass/visitors"
                className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                <span className="text-2xl mr-3">🪪</span>
                <div>
                  <p className="font-medium text-purple-900">Visitor Passes</p>
                  <p className="text-sm text-purple-600">Register &amp; verify visitors</p>
                </div>
              </a>
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
              <a
                href="/security-monitor"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
              >
                <span className="text-2xl mr-3">🖥️</span>
                <div>
                  <p className="font-medium text-white">Security Monitor</p>
                  <p className="text-sm text-gray-300">Open live display on separate monitor</p>
                </div>
              </a>
            </div>
          </div>

          {/* Staff On-Site Now */}
          {onSiteNow.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">On-Site Now</h3>
                <span className="text-sm text-gray-500">{onSiteNow.length} staff</span>
              </div>
              <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {onSiteNow.map((person) => (
                  <div key={person.person_id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{person.full_name}</p>
                      <p className="text-xs text-gray-500">{person.role} • {person.location}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      person.last_seen_method === 'face'     ? 'bg-blue-100 text-blue-800' :
                      person.last_seen_method === 'rfid'     ? 'bg-green-100 text-green-800' :
                                                               'bg-amber-100 text-amber-800'
                    }`}>
                      {person.last_seen_method}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* Live Attendance Feed (WebSocket) */}
      {activeView === 'attendance' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Live Attendance Feed</h3>
              <p className="text-sm text-gray-500">Real-time attendance events via WebSocket</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
              Live
            </span>
          </div>
          {attendanceFeed.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <span className="text-3xl block mb-2">👁️</span>
              <p>Waiting for attendance events…</p>
              <p className="text-xs mt-1 text-gray-400">Events appear here when staff clock in/out</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {attendanceFeed.map((ev, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{ev.full_name}</p>
                    <p className="text-sm text-gray-500">{ev.role} • {ev.location}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ev.method === 'face'     ? 'bg-blue-100 text-blue-800' :
                      ev.method === 'rfid'     ? 'bg-green-100 text-green-800' :
                                                 'bg-amber-100 text-amber-800'
                    }`}>
                      {ev.method}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Camera Detection Panel */}
      {activeView === 'camera' && (
        <div className="space-y-4">

          {/* Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Camera Detection Panel</h3>
              <p className="text-sm text-gray-500">Live feed + face detection events</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={cameraLocation}
                onChange={e => { setCameraLocation(e.target.value); setCameraFeedKey(k => k + 1) }}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="docks">Docks</option>
                <option value="main_gate">Main Gate</option>
                <option value="processing">Processing</option>
              </select>
              <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
                Live
              </span>
            </div>
          </div>

          {/* Stream + Detection Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Live camera stream */}
            <div className="bg-gray-900 rounded-lg overflow-hidden relative min-h-[240px] flex items-center justify-center">
              <img
                key={cameraFeedKey}
                src={`${API_BASE}/api/camera/stream?location=${cameraLocation}`}
                alt={`Camera — ${cameraLocation}`}
                className="w-full h-auto max-h-[360px] object-contain relative z-10"
                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
                onLoad={e => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
              />
              <p className="absolute text-gray-500 text-sm select-none pointer-events-none z-0">📷 No feed available</p>
            </div>

            {/* Detection events */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
              <div className="p-3 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Recent Detections</p>
                {cameraDetectionFeed.length > 0 && (
                  <button
                    onClick={() => setCameraDetectionFeed([])}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
              {cameraDetectionFeed.length === 0 ? (
                <div className="p-8 text-center text-gray-400 flex-1 flex flex-col items-center justify-center">
                  <span className="text-3xl block mb-2">👁️</span>
                  <p className="text-sm">Waiting for detection events…</p>
                  <p className="text-xs mt-1 text-gray-300">Streams in when faces are detected</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 overflow-y-auto max-h-[360px]">
                  {cameraDetectionFeed.map((ev, idx) => (
                    <DetectionCard key={idx} ev={ev} isFirst={idx === 0} dark={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Box Gate — RFID Box Entry / Exit at Main Gate */}
      {activeView === 'box-gate' && (
        <div className="space-y-6">

          {/* On-site tally */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">RFID Box Gate</h3>
              <p className="text-sm text-gray-500">Record boxes entering or exiting the main gate</p>
            </div>
            <div className="text-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Boxes On-Site</p>
              <p className="text-3xl font-bold text-blue-800">
                {boxTallyCount !== null ? boxTallyCount : '—'}
              </p>
            </div>
          </div>

          {/* --- Tag Lookup --- */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <h4 className="font-semibold text-gray-900">Look Up a Tag</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => { setTagInput(e.target.value); setTagResult(null) }}
                onKeyDown={async e => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    setTagLookupLoading(true)
                    const res = await clamflowAPI.scanRFIDTag(tagInput.trim()).catch(() => null)
                    setTagResult(res?.data ?? 'not-found')
                    setTagLookupLoading(false)
                  }
                }}
                placeholder="Type or scan tag ID, then press Enter"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                disabled={!tagInput.trim() || tagLookupLoading}
                onClick={async () => {
                  if (!tagInput.trim()) return
                  setTagLookupLoading(true)
                  const res = await clamflowAPI.scanRFIDTag(tagInput.trim()).catch(() => null)
                  setTagResult(res?.data ?? 'not-found')
                  setTagLookupLoading(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 min-w-[80px]"
              >
                {tagLookupLoading ? '…' : 'Look Up'}
              </button>
            </div>

            {tagResult === 'not-found' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                Tag <span className="font-mono font-semibold">{tagInput}</span> not found in the system.
              </div>
            )}
            {tagResult && tagResult !== 'not-found' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Box #</span><p className="font-semibold text-gray-900">{tagResult.boxNumber || '—'}</p></div>
                <div><span className="text-gray-500">Lot ID</span><p className="font-semibold text-gray-900">{tagResult.lotId || '—'}</p></div>
                <div><span className="text-gray-500">Product</span><p className="font-semibold text-gray-900">{tagResult.productType || '—'}</p></div>
                <div><span className="text-gray-500">Grade</span><p className="font-semibold text-gray-900">{tagResult.grade || '—'}</p></div>
                <div><span className="text-gray-500">Weight</span><p className="font-semibold text-gray-900">{tagResult.weight ? `${tagResult.weight} kg` : '—'}</p></div>
                <div><span className="text-gray-500">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    tagResult.status === 'active' ? 'bg-green-100 text-green-800' :
                    tagResult.status === 'transferred' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>{tagResult.status}</span>
                </div>
              </div>
            )}
          </div>

          {/* --- Log Entry / Exit --- */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <h4 className="font-semibold text-gray-900">Log Box Movement</h4>

            {/* Entry / Exit toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
              {(['entry', 'exit'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setGateMode(mode); setGateResult(null) }}
                  className={`px-6 py-2 text-sm font-medium capitalize ${
                    gateMode === mode
                      ? mode === 'entry'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {mode === 'entry' ? '→ Entry' : '← Exit'}
                </button>
              ))}
            </div>

            {/* Add tags to list */}
            <div className="flex gap-2">
              <input
                type="text"
                value={gateTagEntry}
                onChange={e => setGateTagEntry(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && gateTagEntry.trim()) {
                    const tag = gateTagEntry.trim()
                    if (!gateTagList.includes(tag)) setGateTagList(prev => [...prev, tag])
                    setGateTagEntry('')
                  }
                }}
                placeholder="Scan/type tag ID, press Enter to add"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={() => {
                  const tag = gateTagEntry.trim()
                  if (tag && !gateTagList.includes(tag)) setGateTagList(prev => [...prev, tag])
                  setGateTagEntry('')
                }}
                disabled={!gateTagEntry.trim()}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {/* Tag list */}
            {gateTagList.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{gateTagList.length} tag{gateTagList.length !== 1 ? 's' : ''} queued</p>
                <div className="flex flex-wrap gap-2">
                  {gateTagList.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-800"
                    >
                      {tag}
                      <button
                        onClick={() => setGateTagList(prev => prev.filter(t => t !== tag))}
                        className="text-gray-400 hover:text-red-500 ml-1 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3 pt-1">
              <button
                disabled={gateTagList.length === 0 || gateSubmitting}
                onClick={async () => {
                  setGateSubmitting(true)
                  setGateResult(null)
                  try {
                    const res = gateMode === 'entry'
                      ? await clamflowAPI.recordGateEntry(gateTagList)
                      : await clamflowAPI.recordGateExit(gateTagList)
                    if (res?.success !== false) {
                      setGateResult({ ok: true, msg: `${gateTagList.length} box${gateTagList.length !== 1 ? 'es' : ''} logged as ${gateMode}.` })
                      setGateTagList([])
                      // Refresh tally
                      clamflowAPI.getBoxTally().then((r: any) => {
                        const d = r?.data
                        if (Array.isArray(d)) setBoxTallyCount(d.length)
                        else if (typeof d?.count === 'number') setBoxTallyCount(d.count)
                        else if (typeof d?.total === 'number') setBoxTallyCount(d.total)
                      }).catch(() => {})
                    } else {
                      setGateResult({ ok: false, msg: res?.error || res?.message || 'Failed to log movement.' })
                    }
                  } catch {
                    setGateResult({ ok: false, msg: 'Network error — could not reach server.' })
                  } finally {
                    setGateSubmitting(false)
                  }
                }}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 min-h-[44px] ${
                  gateMode === 'entry' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {gateSubmitting ? 'Submitting…' : gateMode === 'entry' ? 'Confirm Entry' : 'Confirm Exit'}
              </button>
              {gateTagList.length > 0 && (
                <button
                  onClick={() => { setGateTagList([]); setGateResult(null) }}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              )}
            </div>

            {gateResult && (
              <div className={`p-3 rounded-lg text-sm ${gateResult.ok ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                {gateResult.msg}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Supervisor Override Request Queue */}
      {activeView === 'override' && (
        <div className="space-y-6">

          {/* Instructions banner */}
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex gap-3">
            <span className="text-amber-500 text-xl flex-shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-amber-900">Supervisor Action Required</p>
              <p className="text-sm text-amber-800 mt-1">
                Use this form when a staff member <strong>cannot clock in</strong> via face recognition or RFID.
                Log the request below, then notify a <strong>Production Lead</strong>, <strong>Staff Lead</strong>, or <strong>Admin</strong> —
                they must complete the override on their own dashboard using the Staff ID shown here.
              </p>
            </div>
          </div>

          {/* New Request Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <h4 className="font-semibold text-gray-900">Log New Override Request</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Staff Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={overrideForm.personName}
                  onChange={e => setOverrideForm(f => ({ ...f, personName: e.target.value }))}
                  placeholder="Full name of staff member"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Staff ID <span className="text-gray-400">(optional — needed for override)
                  </span>
                </label>
                <input
                  type="text"
                  value={overrideForm.personId}
                  onChange={e => setOverrideForm(f => ({ ...f, personId: e.target.value }))}
                  placeholder="UUID or badge number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <select
                  value={overrideForm.location}
                  onChange={e => setOverrideForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <option value="main_gate">Main Gate</option>
                  <option value="docks">Docks</option>
                  <option value="processing">Processing</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
                <input
                  type="text"
                  value={overrideForm.reason}
                  onChange={e => setOverrideForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            </div>
            <button
              disabled={!overrideForm.personName.trim()}
              onClick={() => {
                const req: OverrideRequest = {
                  id: Date.now().toString(36).toUpperCase().slice(-6),
                  personName: overrideForm.personName.trim(),
                  personId: overrideForm.personId.trim(),
                  location: overrideForm.location,
                  reason: overrideForm.reason.trim() || 'Authentication failed',
                  timestamp: new Date().toISOString(),
                  status: 'pending',
                }
                setOverrideRequests(prev => [req, ...prev])
                setOverrideForm(f => ({ ...f, personName: '', personId: '' }))
              }}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 min-h-[44px] transition-colors"
            >
              🚨 Log Override Request
            </button>
          </div>

          {/* Request queue */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Today’s Requests</h4>
              <div className="flex items-center gap-3">
                {pendingOverrideCount > 0 && (
                  <span className="text-sm font-medium text-red-600">{pendingOverrideCount} pending</span>
                )}
                {overrideRequests.length > 0 && (
                  <button
                    onClick={() => setOverrideRequests([])}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
            {overrideRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <span className="text-3xl block mb-2">✅</span>
                <p className="text-sm">No override requests today</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {overrideRequests.map(req => (
                  <div
                    key={req.id}
                    className={`p-4 flex items-start justify-between gap-3 ${
                      req.status === 'pending' ? 'bg-red-50' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{req.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          req.status === 'pending' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {req.status === 'pending' ? '⏳ Pending' : '✅ Resolved'}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">{req.personName}</p>
                      {req.personId && (
                        <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {req.personId}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">{req.location} • {req.reason}</p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-2">
                      <p className="text-xs text-gray-400">{new Date(req.timestamp).toLocaleTimeString()}</p>
                      {req.status === 'pending' && (
                        <button
                          onClick={() => setOverrideRequests(prev =>
                            prev.map(r => r.id === req.id ? { ...r, status: 'resolved' as const } : r)
                          )}
                          className="block text-xs text-green-600 hover:text-green-800 font-medium underline"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

export default SecurityGuardDashboard
