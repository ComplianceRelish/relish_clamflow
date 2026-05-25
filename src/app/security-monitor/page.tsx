"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import clamflowAPI, {
  AttendanceWsEvent,
  CameraDetectionEvent,
  AttendanceMonitorEntry,
} from '../../lib/clamflow-api'

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app')
  .replace(/^http/, 'ws').replace(/\/$/, '')
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app')
  .replace(/\/$/, '')

export default function SecurityMonitorPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [attendanceFeed, setAttendanceFeed] = useState<AttendanceWsEvent[]>([])
  const [onSiteCount, setOnSiteCount] = useState(0)
  const [cameraLocation, setCameraLocation] = useState('main_gate')
  const [cameraFeedKey, setCameraFeedKey] = useState(0)
  const [cameraDetectionFeed, setCameraDetectionFeed] = useState<CameraDetectionEvent[]>([])
  const [attendanceWsStatus, setAttendanceWsStatus] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting')
  const [cameraWsStatus, setCameraWsStatus] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting')

  const wsRef = useRef<WebSocket | null>(null)
  const cameraWsRef = useRef<WebSocket | null>(null)
  const attendanceReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cameraReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [user, isLoading, router])

  // ── Clock (updates every second) ────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // ── Camera frame poll (every 2 s) ───────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setCameraFeedKey(k => k + 1), 2000)
    return () => clearInterval(id)
  }, [])

  // ── Initial on-site count ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    clamflowAPI.getAttendanceMonitor()
      .then((res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          setOnSiteCount(res.data.length)
        }
      })
      .catch(() => {})
  }, [user])

  // ── Attendance WebSocket ────────────────────────────────────────────────────
  const connectAttendanceWS = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return
    setAttendanceWsStatus('connecting')
    try {
      const ws = new WebSocket(`${WS_BASE}/api/attendance/ws/attendance`)
      ws.onopen = () => setAttendanceWsStatus('connected')
      ws.onmessage = (e) => {
        try {
          const event: AttendanceWsEvent = JSON.parse(e.data)
          setAttendanceFeed(prev => [event, ...prev].slice(0, 50))
          // Bump on-site count for clock-in events (best-effort; no clock-out distinction)
          setOnSiteCount(n => n + 1)
        } catch { /* ignore malformed frames */ }
      }
      ws.onclose = () => {
        setAttendanceWsStatus('reconnecting')
        attendanceReconnectRef.current = setTimeout(connectAttendanceWS, 5000)
      }
      wsRef.current = ws
    } catch (err) {
      console.warn('[SecurityMonitor] Attendance WS failed:', err)
      attendanceReconnectRef.current = setTimeout(connectAttendanceWS, 5000)
    }
  }, [])

  // ── Camera WebSocket ────────────────────────────────────────────────────────
  const connectCameraWS = useCallback(() => {
    if (cameraWsRef.current && cameraWsRef.current.readyState <= WebSocket.OPEN) return
    setCameraWsStatus('connecting')
    try {
      const ws = new WebSocket(`${WS_BASE}/ws/camera-detections`)
      ws.onopen = () => setCameraWsStatus('connected')
      ws.onmessage = (e) => {
        try {
          const event: CameraDetectionEvent = JSON.parse(e.data)
          setCameraDetectionFeed(prev => [event, ...prev].slice(0, 30))
          setCameraFeedKey(k => k + 1)
        } catch { /* ignore malformed frames */ }
      }
      ws.onclose = () => {
        setCameraWsStatus('reconnecting')
        cameraReconnectRef.current = setTimeout(connectCameraWS, 5000)
      }
      cameraWsRef.current = ws
    } catch (err) {
      console.warn('[SecurityMonitor] Camera WS failed:', err)
      cameraReconnectRef.current = setTimeout(connectCameraWS, 5000)
    }
  }, [])

  useEffect(() => {
    connectAttendanceWS()
    return () => {
      wsRef.current?.close()
      if (attendanceReconnectRef.current) clearTimeout(attendanceReconnectRef.current)
    }
  }, [connectAttendanceWS])

  useEffect(() => {
    connectCameraWS()
    return () => {
      cameraWsRef.current?.close()
      if (cameraReconnectRef.current) clearTimeout(cameraReconnectRef.current)
    }
  }, [connectCameraWS])

  // ── Loading / auth splash ───────────────────────────────────────────────────
  if (isLoading || !user) {
    return (
      <div className="bg-gray-950 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
      </div>
    )
  }

  const wsIndicator = (status: 'connecting' | 'connected' | 'reconnecting') =>
    status === 'connected'
      ? <span className="flex items-center gap-1 text-green-400 text-xs"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />Live</span>
      : status === 'reconnecting'
      ? <span className="flex items-center gap-1 text-yellow-400 text-xs"><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />Reconnecting…</span>
      : <span className="flex items-center gap-1 text-gray-500 text-xs"><span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />Connecting…</span>

  return (
    <div className="bg-gray-950 min-h-screen flex flex-col text-white select-none">

      {/* ── Top header bar ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-red-500 text-2xl">🛡️</span>
          <div>
            <p className="font-bold text-white leading-tight">ClamFlow — Security Monitor</p>
            <p className="text-xs text-gray-400">Live Attendance &amp; Camera Detection</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* On-site count */}
          <div className="text-center">
            <p className="text-2xl font-bold text-white leading-none">{onSiteCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">On-Site</p>
          </div>

          {/* Live clock */}
          <div className="text-right">
            <p className="font-mono text-xl font-semibold text-white leading-none">
              {currentTime.toLocaleTimeString()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>

          {/* Back link */}
          <a
            href="/dashboard"
            className="hidden sm:block text-xs text-gray-500 hover:text-gray-300 transition-colors border border-gray-700 px-3 py-1.5 rounded"
          >
            ← Dashboard
          </a>
        </div>
      </header>

      {/* ── Two-panel body ──────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">

        {/* ── LEFT — Live Attendance Feed ──────────────────────────────────── */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-gray-800 min-h-0">

          {/* Panel header */}
          <div className="px-5 py-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="font-semibold text-white">Live Attendance Feed</h2>
              <p className="text-xs text-gray-400">Staff clock-in / clock-out events</p>
            </div>
            {wsIndicator(attendanceWsStatus)}
          </div>

          {/* Event list */}
          <div className="flex-1 overflow-y-auto">
            {attendanceFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3 p-8">
                <span className="text-6xl opacity-40">👁️</span>
                <p className="text-sm">Waiting for attendance events…</p>
                <p className="text-xs text-gray-700">Events appear here as staff clock in or out</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/60">
                {attendanceFeed.map((ev, idx) => (
                  <div
                    key={idx}
                    className={`px-5 py-3 flex items-center justify-between ${idx === 0 ? 'bg-gray-800/50' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{ev.full_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ev.role} · {ev.location}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        ev.method === 'face'     ? 'bg-blue-900/60 text-blue-300 border border-blue-700' :
                        ev.method === 'rfid'     ? 'bg-green-900/60 text-green-300 border border-green-700' :
                                                   'bg-amber-900/60 text-amber-300 border border-amber-700'
                      }`}>
                        {ev.method}
                      </span>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT — Camera Detection ─────────────────────────────────────── */}
        <div className="flex flex-col min-h-0">

          {/* Panel header */}
          <div className="px-5 py-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="font-semibold text-white">Camera Detection</h2>
              <p className="text-xs text-gray-400">Live feed · face &amp; visitor detection</p>
            </div>
            <div className="flex items-center gap-3">
              {wsIndicator(cameraWsStatus)}
              <select
                value={cameraLocation}
                onChange={e => { setCameraLocation(e.target.value); setCameraFeedKey(k => k + 1) }}
                className="bg-gray-800 border border-gray-700 text-white rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-600"
              >
                <option value="main_gate">Main Gate</option>
                <option value="docks">Docks</option>
                <option value="processing">Processing</option>
              </select>
            </div>
          </div>

          {/* Camera stream */}
          <div className="bg-black relative flex items-center justify-center flex-shrink-0" style={{ height: '45vh' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={cameraFeedKey}
              src={`${API_BASE}/api/camera/stream?location=${cameraLocation}`}
              alt={`Camera — ${cameraLocation}`}
              className="w-full h-full object-contain relative z-10"
              style={{ maxHeight: '45vh' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
              onLoad={e => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
            />
            <p className="absolute inset-0 flex items-center justify-center text-gray-700 text-sm z-0 pointer-events-none">
              📷 No feed available
            </p>
            {/* Location overlay label */}
            <div className="absolute bottom-2 left-3 z-20 bg-black/60 text-white text-xs px-2 py-0.5 rounded font-mono">
              {cameraLocation.replace('_', ' ').toUpperCase()}
            </div>
          </div>

          {/* Detection event list */}
          <div className="flex-1 overflow-y-auto">
            {cameraDetectionFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3 p-6">
                <span className="text-5xl opacity-40">📷</span>
                <p className="text-sm">Awaiting detection events…</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/60">
                {cameraDetectionFeed.map((ev, idx) => (
                  <div
                    key={idx}
                    className={`px-5 py-3 flex items-start justify-between gap-3 ${idx === 0 ? 'bg-gray-800/50' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          ev.subject_type === 'staff'
                            ? 'bg-green-900/60 text-green-300 border border-green-700'
                            : 'bg-blue-900/60 text-blue-300 border border-blue-700'
                        }`}>
                          {ev.subject_type === 'staff' ? 'Staff' : 'Visitor'}
                        </span>
                        <p className="font-semibold text-white truncate">
                          {ev.subject_type === 'staff' ? ev.person?.full_name : ev.visitor?.name}
                        </p>
                      </div>
                      {ev.subject_type === 'staff' && ev.person && (
                        <p className="text-xs text-gray-400">{ev.person.role} · {ev.location}</p>
                      )}
                      {ev.subject_type === 'visitor' && ev.visitor && (
                        <p className={`text-xs ${
                          new Date(ev.visitor.valid_until) > new Date() ? 'text-green-400' : 'text-red-400'
                        }`}>
                          Pass {new Date(ev.visitor.valid_until) > new Date() ? 'valid until' : 'EXPIRED'}{' '}
                          {new Date(ev.visitor.valid_until).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white">{Math.round(ev.confidence * 100)}%</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
