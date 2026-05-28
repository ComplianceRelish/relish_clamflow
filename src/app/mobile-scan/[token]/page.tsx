'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://clamflowbackend-production.up.railway.app';

type ScanState = 'idle' | 'scanning' | 'submitting' | 'success' | 'error' | 'expired';

export default function MobileScanPage() {
  const params = useParams();
  const token = params?.token as string;

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedText, setScannedText] = useState('');
  const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSubmitted = useRef(false);

  // Submit raw QR text to the backend (no JWT required)
  const submitQRText = async (rawText: string) => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;

    setScanState('submitting');
    setScannedText(rawText);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/onboarding/mobile-scan/${token}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_text: rawText }),
        }
      );

      if (res.status === 404 || res.status === 410) {
        setScanState('expired');
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || `HTTP ${res.status}`);
      }

      setScanState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed');
      setScanState('error');
    }
  };

  // Start html5-qrcode scanner
  const startScanner = async () => {
    setScanState('scanning');

    // Dynamic import — html5-qrcode manipulates the DOM and must run client-side only
    const { Html5Qrcode } = await import('html5-qrcode');

    const qrScanner = new Html5Qrcode('qr-reader');
    scannerRef.current = qrScanner;

    try {
      await qrScanner.start(
        { facingMode: 'environment' }, // rear camera on phones
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Stop scanner on first successful decode
          await qrScanner.stop().catch(() => {});
          await submitQRText(decodedText);
        },
        () => {
          // Scan failure callback — ignore per-frame failures
        }
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Camera access denied. Please allow camera permissions and try again.'
      );
      setScanState('error');
    }
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, []);

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <p className="text-red-600 text-center">Invalid scan link — missing token.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start pt-8 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">🦪</div>
        <h1 className="text-xl font-bold text-gray-900">ClamFlow</h1>
        <p className="text-sm text-blue-700 font-medium">Aadhaar Verification</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-6">

        {/* IDLE */}
        {scanState === 'idle' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">📱</div>
            <h2 className="text-lg font-semibold text-gray-800">Scan Aadhaar QR</h2>
            <p className="text-sm text-gray-500">
              Point your phone camera at the QR code on the back of the Aadhaar card.
            </p>
            <button
              onClick={startScanner}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              Open Camera
            </button>
            <p className="text-xs text-gray-400">This link expires in 10 minutes.</p>
          </div>
        )}

        {/* SCANNING */}
        {scanState === 'scanning' && (
          <div className="space-y-4">
            <p className="text-center text-sm font-medium text-gray-700">
              Hold the Aadhaar card steady in the frame
            </p>
            {/* html5-qrcode mounts the video into this div */}
            <div
              id="qr-reader"
              ref={containerRef}
              className="w-full rounded-lg overflow-hidden"
            />
            <p className="text-center text-xs text-gray-400">
              Looking for QR code…
            </p>
          </div>
        )}

        {/* SUBMITTING */}
        {scanState === 'submitting' && (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Sending QR data…</p>
          </div>
        )}

        {/* SUCCESS */}
        {scanState === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-lg font-semibold text-green-700">Scan Complete!</h2>
            <p className="text-sm text-gray-600">
              The Aadhaar data has been sent to the PC. You can close this page.
            </p>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-left">
              <p className="text-xs text-gray-400 font-mono break-all">
                {scannedText.slice(0, 60)}
                {scannedText.length > 60 ? '…' : ''}
              </p>
            </div>
          </div>
        )}

        {/* EXPIRED */}
        {scanState === 'expired' && (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">⏰</div>
            <h2 className="text-lg font-semibold text-orange-600">Session Expired</h2>
            <p className="text-sm text-gray-600">
              This scan link has expired or already been used. Please ask staff to generate a new QR code.
            </p>
          </div>
        )}

        {/* ERROR */}
        {scanState === 'error' && (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">❌</div>
            <h2 className="text-lg font-semibold text-red-600">Scan Failed</h2>
            <p className="text-sm text-gray-600">{errorMsg}</p>
            <button
              onClick={() => {
                hasSubmitted.current = false;
                setScanState('idle');
                setErrorMsg('');
              }}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center">
        ClamFlow · Powered by Relish Compliance
      </p>
    </div>
  );
}
