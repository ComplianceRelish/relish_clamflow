'use client';

import { useState, useEffect, useCallback } from "react";
import { Fingerprint, CheckCircle, XCircle, Loader2 } from "lucide-react";

type BiometricStatus = "idle" | "scanning" | "success" | "error" | "timeout";

interface BiometricAuthProps {
  onAuthenticated: (userId: string) => void;
  onError?: (error: string) => void;
  label?: string;
  description?: string;
  timeoutMs?: number;
  disabled?: boolean;
  simulateSuccess?: boolean;
  className?: string;
}

export function BiometricAuth({
  onAuthenticated,
  onError,
  label = "Biometric Authentication",
  description = "Place your finger on the scanner to authenticate",
  timeoutMs = 15000,
  disabled = false,
  simulateSuccess = false,
  className = "",
}: BiometricAuthProps) {
  const [status, setStatus] = useState<BiometricStatus>("idle");
  const [countdown, setCountdown] = useState(0);
  const [manualId, setManualId] = useState("");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (status === "scanning" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (simulateSuccess) {
              setStatus("success");
              onAuthenticated("SIM-" + Date.now());
            } else {
              setStatus("timeout");
              onError?.("Scan timed out. Please try again.");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, countdown, simulateSuccess, onAuthenticated, onError]);

  const startScan = useCallback(() => {
    if (disabled) return;
    setStatus("scanning");
    setCountdown(Math.ceil(timeoutMs / 1000));
  }, [disabled, timeoutMs]);

  const handleManualSubmit = () => {
    if (!manualId.trim()) return;
    setStatus("success");
    onAuthenticated(manualId.trim());
  };

  const reset = () => {
    setStatus("idle");
    setCountdown(0);
    setManualId("");
  };

  const statusConfig: Record<BiometricStatus, { icon: React.ReactNode; color: string; bgColor: string; text: string }> = {
    idle: {
      icon: <Fingerprint className="h-12 w-12" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200",
      text: description,
    },
    scanning: {
      icon: <Loader2 className="h-12 w-12 animate-spin" />,
      color: "text-amber-600",
      bgColor: "bg-amber-50 border-amber-200",
      text: `Scanning... ${countdown}s remaining`,
    },
    success: {
      icon: <CheckCircle className="h-12 w-12" />,
      color: "text-green-600",
      bgColor: "bg-green-50 border-green-200",
      text: "Authentication successful",
    },
    error: {
      icon: <XCircle className="h-12 w-12" />,
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
      text: "Authentication failed. Please try again.",
    },
    timeout: {
      icon: <XCircle className="h-12 w-12" />,
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
      text: "Scan timed out. Please try again.",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
      
      <div className={`flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl ${config.bgColor} transition-colors`}>
        <div className={config.color}>{config.icon}</div>
        <p className={`text-sm font-medium text-center ${config.color}`}>
          {config.text}
        </p>
        
        {status === "idle" && (
          <button
            onClick={startScan}
            disabled={disabled}
            className="min-h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
          >
            Start Scan
          </button>
        )}
        
        {(status === "error" || status === "timeout") && (
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="min-h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="min-h-[44px] px-6 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Enter Manually
            </button>
          </div>
        )}
      </div>
      
      {showManual && status !== "success" && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
          <label className="block text-sm font-medium text-gray-900">
            Manual Employee ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Enter employee ID..."
              className="flex-1 min-h-[44px] px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualId.trim()}
              className="min-h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
