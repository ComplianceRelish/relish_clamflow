'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://clamflowbackend-production.up.railway.app';

type ScanState = 'idle' | 'scanning' | 'processing-image' | 'submitting' | 'success' | 'error' | 'expired';

export default function MobileScanPage() {
  const params = useParams();
  const token = params?.token as string;

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedText, setScannedText] = useState('');
  const [cancelLabel, setCancelLabel] = useState('');
  const scannerRef = useRef<{ clear: () => void; stop?: () => Promise<void> } | null>(null);
  const hasSubmitted = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          body: JSON.stringify({ qr_data: rawText }),
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

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop?.().catch(() => {});
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  };

  // Start live camera scanner
  const startScanner = async () => {
    setScanState('scanning');
    setCancelLabel('');

    const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

    const qrScanner = new Html5Qrcode('qr-reader', {
      // Only look for QR codes — faster and avoids false positives
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      // Use the native BarcodeDetector API where available (handles dense
      // Aadhaar QR codes much better than the WASM fallback)
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      verbose: false,
    });
    scannerRef.current = qrScanner;

    try {
      await qrScanner.start(
        { facingMode: 'environment' },
        {
          fps: 20,
          // Percentage-based box: 85% of the shorter side, so the user doesn't have
          // to perfectly align a tiny fixed box over the Aadhaar QR in the corner.
          qrbox: (w: number, h: number) => {
            const size = Math.floor(Math.min(w, h) * 0.85);
            return { width: size, height: size };
          },
        },
        async (decodedText) => {
          await stopScanner();
          await submitQRText(decodedText);
        },
        () => {
          // Per-frame failure — normal, just keep scanning
        }
      );
    } catch (err) {
      await stopScanner();
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Camera access denied. Please allow camera permissions and try again.'
      );
      setScanState('error');
    }
  };

  // Scan QR from an image file entirely client-side (no backend, no JWT needed)
  const handleImageFile = async (file: File) => {
    if (!file) return;
    setScanState('processing-image');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      // scanFile decodes QR from an image entirely in the browser
      const decoder = new Html5Qrcode('qr-file-reader', { verbose: false });
      const decodedText = await decoder.scanFile(file, /* showImage */ false);
      decoder.clear();
      await submitQRText(decodedText);
    } catch {
      setErrorMsg(
        'Could not find a QR code in this photo.\n' +
        'Tips: photograph just the BACK of the Aadhaar card in good light, keep the QR fully in frame, and avoid blur.'
      );
      setScanState('error');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <p className="text-red-600 text-center">Invalid scan link — missing token.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start pt-8 px-4 pb-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">🦪</div>
        <h1 className="text-xl font-bold text-gray-900">ClamFlow</h1>
        <p className="text-sm text-blue-700 font-medium">Aadhaar Verification</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-6">

        {/* IDLE — choose method */}
        {scanState === 'idle' && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="text-4xl mb-2">📷</div>
              <h2 className="text-lg font-semibold text-gray-800">Scan Aadhaar QR</h2>
              <p className="text-sm text-gray-500 mt-1">
                Use the <strong>back of the Aadhaar card</strong>. The QR code is in the bottom-right corner.
              </p>
            </div>

            {/* Option 1: Live camera */}
            <button
              onClick={startScanner}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              📸 Open Camera
            </button>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Option 2: Upload photo from gallery */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors border border-gray-300"
            >
              🖼️ Upload Photo from Gallery
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
                e.target.value = '';
              }}
            />

            <p className="text-xs text-gray-400 text-center">This link expires in 10 minutes.</p>
          </div>
        )}

        {/* SCANNING — live camera */}
        {scanState === 'scanning' && (
          <div className="space-y-3">
            <p className="text-center text-sm font-medium text-gray-700">
              Point at the QR on the <strong>back</strong> of the Aadhaar card
            </p>
            <p className="text-center text-xs text-gray-400">
              Keep steady · good light · QR fully in frame
            </p>
            {/* html5-qrcode mounts the video element here */}
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-1">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600" />
              Scanning…
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={async () => {
                  await stopScanner();
                  fileInputRef.current?.click();
                }}
                className="flex-1 py-2 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
              >
                🖼️ Upload Photo Instead
              </button>
              <button
                onClick={async () => { await stopScanner(); setScanState('idle'); }}
                className="flex-1 py-2 text-xs text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
            {/* Hidden file input for mid-scan fallback */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
                e.target.value = '';
              }}
            />
          </div>
        )}

        {/* PROCESSING IMAGE */}
        {scanState === 'processing-image' && (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Reading QR from photo…</p>
          </div>
        )}

        {/* SUBMITTING */}
        {scanState === 'submitting' && (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Sending QR data to PC…</p>
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
            <p className="text-sm text-gray-600 whitespace-pre-line">{errorMsg}</p>
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

      {/* Hidden div needed for Html5Qrcode.scanFile() — must be in the DOM */}
      <div id="qr-file-reader" className="hidden" />

      <p className="mt-6 text-xs text-gray-400 text-center">
        ClamFlow · Powered by Relish Compliance
      </p>
    </div>
  );
}
