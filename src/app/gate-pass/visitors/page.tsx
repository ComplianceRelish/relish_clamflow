'use client';

/**
 * Visitor Pass Management Page
 *
 * Accessible to: Security Guard, Gate Staff, Staff Lead, Admin, Super Admin
 *
 * Tabs:
 *  1. Register  — collect visitor details + face JPEG → POST /api/visitors/register
 *  2. Verify    — capture face JPEG → POST /api/visitors/verify (AWS Rekognition server-side)
 *  3. Scan QR   — enter pass token → GET /api/visitors/{token}
 *  4. Log       — paginated list   → GET /api/visitors/list
 *
 * Face recognition is performed server-side via AWS Rekognition (clamflow-visitors collection).
 * The frontend captures a raw JPEG frame and sends it as base64 — no client-side ML models.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  clamflowAPI,
  VisitorPassResponse,
  VisitorListItem,
  VisitorScanResponse,
  VisitorCategory,
} from '../../../lib/clamflow-api';

const AUTHORIZED_ROLES = [
  'Super Admin', 'Admin', 'Staff Lead', 'Security Guard', 'Gate Staff',
] as const;

// ── QR display helper ──────────────────────────────────────────────────────
// Renders a simple visual QR placeholder; replace with a real QR library
// (e.g. `npm i qrcode.react`) if a scannable QR image is needed.
const PassTokenDisplay: React.FC<{ token: string }> = ({ token }) => (
  <div className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-lg">
    <div className="w-32 h-32 bg-gray-100 border border-dashed border-gray-400 flex items-center justify-center rounded text-xs text-gray-500 text-center px-2">
      QR code<br />(install qrcode.react)
    </div>
    <p className="font-mono text-xs text-gray-700 break-all max-w-xs text-center">{token}</p>
    <button
      onClick={() => navigator.clipboard.writeText(token)}
      className="text-xs text-blue-600 hover:underline"
    >
      Copy token
    </button>
  </div>
);

// ── Camera capture helper ──────────────────────────────────────────────────
interface CameraState {
  streaming: boolean;
  error: string | null;
}

function useCameraCapture(videoRef: React.RefObject<HTMLVideoElement>, canvasRef: React.RefObject<HTMLCanvasElement>) {
  const [cam, setCam] = useState<CameraState>({ streaming: false, error: null });

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCam({ streaming: true, error: null });
    } catch {
      setCam({ streaming: false, error: 'Camera access denied or unavailable' });
    }
  }, [videoRef]);

  const stop = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCam({ streaming: false, error: null });
  }, [videoRef]);

  const captureFrame = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    return canvas;
  }, [videoRef, canvasRef]);

  // Returns raw base64 JPEG string (no data: prefix) — what AWS Rekognition expects
  const captureJpeg = useCallback((): string | null => {
    const canvas = captureFrame();
    if (!canvas) return null;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return dataUrl.replace(/^data:image\/jpeg;base64,/, '');
  }, [captureFrame]);

  return { cam, start, stop, captureFrame, captureJpeg };
}

// ── Main page ──────────────────────────────────────────────────────────────
type Tab = 'register' | 'verify' | 'scan' | 'log';

export default function VisitorPassPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('register');

  useEffect(() => {
    if (!isLoading && !user) router.push('/login?returnUrl=/gate-pass/visitors');
  }, [user, isLoading, router]);

  if (isLoading) return <PageSpinner />;
  if (!user) return null;

  const authorized = AUTHORIZED_ROLES.includes(user.role as typeof AUTHORIZED_ROLES[number]);
  if (!authorized) return <AccessDenied onBack={() => router.push('/dashboard')} />;

  const isAdmin = ['Super Admin', 'Admin', 'Staff Lead'].includes(user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Visitor Pass Management</h1>
            <p className="text-slate-300 text-sm mt-0.5">Register · Verify · Scan · Audit</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-white text-slate-700 rounded-lg text-sm hover:bg-slate-100"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex space-x-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {([
            { key: 'register', label: 'Register Visitor', icon: '👤' },
            { key: 'verify',   label: 'Verify Face',       icon: '🔍' },
            { key: 'scan',     label: 'Scan QR',           icon: '📷' },
            ...(isAdmin ? [{ key: 'log', label: 'Visitor Log', icon: '📋' }] : []),
          ] as { key: Tab; label: string; icon: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-1">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 pb-10">
          {tab === 'register' && <RegisterTab />}
          {tab === 'verify'   && <VerifyTab />}
          {tab === 'scan'     && <ScanTab />}
          {tab === 'log'      && isAdmin && <LogTab />}
        </div>
      </div>
    </div>
  );
}

// ── Register Tab ───────────────────────────────────────────────────────────
const PERMANENT_CATEGORIES: VisitorCategory[] = ['supplier', 'vendor', 'government', 'contractor'];

function RegisterTab() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { cam, start, stop, captureJpeg } = useCameraCapture(videoRef, canvasRef);

  const [form, setForm] = useState({
    name: '', phone: '', purpose: '', host_staff_id: '', valid_hours: '8',
    visitor_category: 'individual' as VisitorCategory, organisation: '',
  });
  const [isPermanent, setIsPermanent] = useState(false);
  const [capturedImageB64, setCapturedImageB64] = useState<string | null>(null);
  const [captureStatus, setCaptureStatus] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<VisitorPassResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-set is_permanent when category changes to a commercial type
  useEffect(() => {
    setIsPermanent(PERMANENT_CATEGORIES.includes(form.visitor_category));
  }, [form.visitor_category]);

  const handleCaptureFace = () => {
    const jpeg = captureJpeg();
    if (!jpeg) { setCaptureStatus('⚠️ No frame captured — start camera first'); return; }
    setCapturedImageB64(jpeg);
    setCaptureStatus('✅ Face image captured — will be enrolled via AWS Rekognition');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Visitor name is required'); return; }
    setSubmitting(true);
    setError(null);

    const payload: Parameters<typeof clamflowAPI.registerVisitor>[0] = {
      name: form.name.trim(),
      ...(form.phone && { phone: form.phone.trim() }),
      ...(form.purpose && { purpose: form.purpose.trim() }),
      visitor_category: form.visitor_category,
      ...(form.organisation.trim() && { organisation: form.organisation.trim() }),
      is_permanent: isPermanent,
      ...(form.host_staff_id.trim() && { host_staff_id: form.host_staff_id.trim() }),
      ...(!isPermanent && { valid_hours: Number(form.valid_hours) || 8 }),
      ...(capturedImageB64 && { face_image_b64: capturedImageB64 }),
    };

    const res = await clamflowAPI.registerVisitor(payload);
    setSubmitting(false);

    if (res.success && res.data) {
      setResult(res.data);
      stop();
    } else {
      setError(res.error || res.message || 'Registration failed');
    }
  };

  const reset = () => {
    setResult(null);
    setForm({ name: '', phone: '', purpose: '', host_staff_id: '', valid_hours: '8', visitor_category: 'individual', organisation: '' });
    setCapturedImageB64(null);
    setCaptureStatus('');
    setError(null);
  };

  if (result) {
    return (
      <div className="bg-white rounded-xl border border-green-200 p-8 max-w-lg mx-auto text-center">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-green-700 mb-1">Pass Issued</h2>
        <p className="text-gray-600 mb-4">
          {result.valid_until
            ? `Valid until ${new Date(result.valid_until).toLocaleString()}`
            : 'Permanent pass — no expiry'}
        </p>
        <PassTokenDisplay token={result.pass_token} />
        <div className="mt-4 text-sm text-gray-500 space-y-1">
          <p><span className="font-medium">Name:</span> {result.name}</p>
          {result.organisation && <p><span className="font-medium">Organisation:</span> {result.organisation}</p>}
          {result.visitor_category && <p><span className="font-medium">Category:</span> {result.visitor_category}</p>}
          {result.purpose && <p><span className="font-medium">Purpose:</span> {result.purpose}</p>}
          <p><span className="font-medium">Status:</span> {result.status}</p>
        </div>
        <button onClick={reset} className="mt-6 px-6 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-800">
          Register Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mx-auto space-y-5">
      <h2 className="text-lg font-semibold text-gray-900">Register New Visitor</h2>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            required value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            placeholder="+91-XXXXX-XXXXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={form.visitor_category}
            onChange={e => setForm(f => ({ ...f, visitor_category: e.target.value as VisitorCategory }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="individual">Individual</option>
            <option value="supplier">Supplier</option>
            <option value="vendor">Vendor</option>
            <option value="government">Government</option>
            <option value="contractor">Contractor</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organisation</label>
          <input
            value={form.organisation}
            onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            placeholder="Company or agency name"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit</label>
          <input
            value={form.purpose}
            onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            placeholder="Delivery inspection, Meeting, Audit…"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isPermanent}
              onChange={e => setIsPermanent(e.target.checked)}
              className="rounded border-gray-300"
            />
            Permanent visitor (no expiry)
          </label>
          <p className="text-xs text-gray-400 mt-1">Auto-enabled for supplier / vendor / government / contractor</p>
        </div>
        {!isPermanent && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid Hours (1–168)</label>
            <input
              type="number" min={1} max={168} value={form.valid_hours}
              onChange={e => setForm(f => ({ ...f, valid_hours: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Host Staff ID (optional)</label>
          <input
            value={form.host_staff_id}
            onChange={e => setForm(f => ({ ...f, host_staff_id: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            placeholder="UUID of host person record"
          />
        </div>
      </div>

      {/* Face capture — JPEG sent to AWS Rekognition server-side; no client-side ML */}
      <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Face Registration
          <span className="ml-2 font-normal text-gray-400 text-xs">(optional — enables face recognition at gate)</span>
        </h3>
        <p className="text-xs text-gray-500">
          Point rear camera at visitor and tap Capture. Image is enrolled via AWS Rekognition — no client-side ML needed.
        </p>

        <video
          ref={videoRef}
          className={`w-full max-w-xs rounded-lg border border-gray-200 ${cam.streaming ? '' : 'hidden'}`}
          autoPlay muted playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {captureStatus && <p className="text-xs text-gray-600">{captureStatus}</p>}

        <div className="flex flex-wrap gap-2">
          {!cam.streaming ? (
            <button type="button" onClick={start}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs hover:bg-slate-200">
              Start Camera
            </button>
          ) : (
            <>
              <button type="button" onClick={handleCaptureFace}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                Capture Face
              </button>
              <button type="button" onClick={stop}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-200">
                Stop Camera
              </button>
            </>
          )}
        </div>

        {cam.error && <p className="text-xs text-red-600">{cam.error}</p>}
      </div>

      <button
        type="submit" disabled={submitting}
        className="w-full py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Registering…' : 'Issue Visitor Pass'}
      </button>
    </form>
  );
}

// ── Verify Tab ─────────────────────────────────────────────────────────────
function VerifyTab() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { cam, start, stop, captureJpeg } = useCameraCapture(videoRef, canvasRef);

  const [gate, setGate] = useState('main_gate');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    matched: boolean;
    confidence: number | null;
    visitor: VisitorPassResponse | null;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    const jpeg = captureJpeg();
    if (!jpeg) { setError('No camera frame captured — start camera first'); return; }
    setVerifying(true);
    setError(null);
    setVerifyResult(null);

    // Backend calls AWS Rekognition SearchFacesByImage against clamflow-visitors collection
    const res = await clamflowAPI.verifyVisitorFace({ face_image_b64: jpeg, gate });
    setVerifying(false);

    if (res.success && res.data) {
      setVerifyResult(res.data);
    } else {
      setError(res.error || res.message || 'Verification request failed');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg mx-auto space-y-5">
      <h2 className="text-lg font-semibold text-gray-900">Verify Visitor by Face</h2>
      <p className="text-xs text-gray-500">
        Capture a JPEG frame — matched against clamflow-visitors collection via AWS Rekognition.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
      )}

      {verifyResult && (
        <div className={`rounded-lg p-4 border ${verifyResult.matched ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`font-bold text-lg ${verifyResult.matched ? 'text-green-700' : 'text-red-700'}`}>
            {verifyResult.matched ? '✅ Verified' : '❌ Not Matched'}
          </p>
          <p className="text-sm mt-1 text-gray-600">{verifyResult.message}</p>
          {verifyResult.matched && verifyResult.visitor && (
            <div className="mt-2 text-sm space-y-0.5 text-gray-700">
              <p><span className="font-medium">Name:</span> {verifyResult.visitor.name}</p>
              {verifyResult.visitor.organisation && (
                <p><span className="font-medium">Organisation:</span> {verifyResult.visitor.organisation}</p>
              )}
              {verifyResult.visitor.visitor_category && (
                <p><span className="font-medium">Category:</span> {verifyResult.visitor.visitor_category}</p>
              )}
              {verifyResult.visitor.purpose && (
                <p><span className="font-medium">Purpose:</span> {verifyResult.visitor.purpose}</p>
              )}
              <p>
                <span className="font-medium">Valid until:</span>{' '}
                {verifyResult.visitor.valid_until
                  ? new Date(verifyResult.visitor.valid_until).toLocaleString()
                  : '∞ Permanent — no expiry'}
              </p>
              {/* Rekognition confidence is already 0–100 */}
              <p><span className="font-medium">Confidence:</span> {verifyResult.confidence !== null ? `${verifyResult.confidence.toFixed(1)}%` : '—'}</p>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gate / Location</label>
        <input
          value={gate}
          onChange={e => setGate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          placeholder="main_gate"
        />
      </div>

      <video
        ref={videoRef}
        className={`w-full rounded-lg border border-gray-200 ${cam.streaming ? '' : 'hidden'}`}
        autoPlay muted playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-wrap gap-2">
        {!cam.streaming ? (
          <button onClick={start} type="button"
            className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-sm hover:bg-slate-200">
            Start Camera
          </button>
        ) : (
          <>
            <button onClick={handleVerify} type="button" disabled={verifying}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {verifying ? 'Verifying…' : 'Verify Face'}
            </button>
            <button onClick={stop} type="button"
              className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-200">
              Stop Camera
            </button>
          </>
        )}
        {verifyResult && (
          <button onClick={() => { setVerifyResult(null); setError(null); }} type="button"
            className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-200">
            Clear
          </button>
        )}
      </div>
      {cam.error && <p className="text-sm text-red-600">{cam.error}</p>}
    </div>
  );
}

// ── Scan Tab ───────────────────────────────────────────────────────────────
function ScanTab() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<VisitorScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exitLoading, setExitLoading] = useState(false);
  const [exitDone, setExitDone] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    setScanResult(null);
    setExitDone(false);

    const res = await clamflowAPI.scanVisitorPass(token.trim());
    setLoading(false);

    if (res.success && res.data) {
      setScanResult(res.data);
    } else {
      setError(res.error || res.message || 'Pass not found');
    }
  };

  const handleLogExit = async () => {
    if (!scanResult) return;
    setExitLoading(true);
    await clamflowAPI.logVisitorExit(scanResult.visitor.pass_token);
    setExitLoading(false);
    setExitDone(true);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg mx-auto space-y-5">
      <h2 className="text-lg font-semibold text-gray-900">Scan Visitor Pass</h2>

      <form onSubmit={handleScan} className="flex gap-2">
        <input
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Paste pass token or scan QR code"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        <button
          type="submit" disabled={loading || !token.trim()}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? '…' : 'Look Up'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
      )}

      {scanResult && (
        <div className="space-y-4">
          <div className={`rounded-lg p-4 border ${scanResult.is_valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <p className={`font-bold text-lg ${scanResult.is_valid ? 'text-green-700' : 'text-red-700'}`}>
                {scanResult.is_valid ? '✅ Valid Pass' : '❌ Invalid Pass'}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                scanResult.visitor.status === 'active' ? 'bg-green-100 text-green-700' :
                scanResult.visitor.status === 'expired' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {scanResult.visitor.status}
              </span>
            </div>
            <div className="mt-2 text-sm space-y-0.5 text-gray-700">
              <p><span className="font-medium">Visitor:</span> {scanResult.visitor.name}</p>
              {scanResult.visitor.purpose && (
                <p><span className="font-medium">Purpose:</span> {scanResult.visitor.purpose}</p>
              )}
              <p><span className="font-medium">Valid from:</span> {new Date(scanResult.visitor.valid_from).toLocaleString()}</p>
              <p>
                <span className="font-medium">Valid until:</span>{' '}
                {scanResult.visitor.valid_until
                  ? new Date(scanResult.visitor.valid_until).toLocaleString()
                  : '\u221e Permanent'}
              </p>
            </div>
          </div>

          {scanResult.events.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Pass Events</h4>
              <div className="space-y-1">
                {scanResult.events.slice(0, 5).map(ev => (
                  <div key={ev.id} className="flex justify-between text-xs text-gray-600 bg-gray-50 rounded px-3 py-1.5">
                    <span className="font-medium capitalize">{ev.event_type.replace('_', ' ')}</span>
                    <span>{ev.gate || '—'}</span>
                    <span>{new Date(ev.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {scanResult.is_valid && !exitDone && (
            <button
              onClick={handleLogExit} disabled={exitLoading}
              className="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              {exitLoading ? 'Logging exit…' : 'Log Visitor Exit'}
            </button>
          )}
          {exitDone && (
            <p className="text-green-700 text-sm font-medium text-center">Exit logged ✅</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Log Tab ────────────────────────────────────────────────────────────────
function LogTab() {
  const [statusFilter, setStatusFilter] = useState<'active' | 'expired' | 'revoked' | ''>('');
  const [visitors, setVisitors] = useState<VisitorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisitors = useCallback(async (status?: 'active' | 'expired' | 'revoked') => {
    setLoading(true);
    setError(null);
    const res = await clamflowAPI.listVisitors({ ...(status && { status }), limit: 100 });
    setLoading(false);
    if (res.success && res.data) {
      setVisitors(Array.isArray(res.data) ? res.data : []);
    } else {
      setError(res.error || res.message || 'Failed to load visitors');
    }
  }, []);

  useEffect(() => { fetchVisitors(statusFilter || undefined); }, [fetchVisitors, statusFilter]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Visitor Log</h2>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
          <button onClick={() => fetchVisitors(statusFilter || undefined)}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-sm hover:bg-slate-200">
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
        </div>
      ) : visitors.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No visitors found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Purpose</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Valid Until</th>
                <th className="pb-2">Events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visitors.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="py-2 pr-4 font-medium text-gray-900">{v.name}</td>
                  <td className="py-2 pr-4 text-gray-600">{v.purpose || '—'}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      v.status === 'active'  ? 'bg-green-100 text-green-700' :
                      v.status === 'expired' ? 'bg-yellow-100 text-yellow-700' :
                                               'bg-red-100 text-red-700'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-600 text-xs">
                    {v.valid_until ? new Date(v.valid_until).toLocaleString() : '\u221e Permanent'}
                  </td>
                  <td className="py-2 text-gray-600">{v.event_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Utility components ─────────────────────────────────────────────────────
const PageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
  </div>
);

const AccessDenied = ({ onBack }: { onBack: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-600">
    <div className="text-center text-white max-w-md p-8">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
      <p className="mb-4">You do not have permission to access visitor pass management.</p>
      <button onClick={onBack} className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100">
        Return to Dashboard
      </button>
    </div>
  </div>
);
