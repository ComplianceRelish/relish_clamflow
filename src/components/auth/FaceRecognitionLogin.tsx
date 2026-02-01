// src/components/auth/FaceRecognitionLogin.tsx
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app';

interface FaceRecognitionLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: FaceAuthResult) => void;
  onError?: (error: string) => void;
}

interface FaceAuthResult {
  success: boolean;
  access_token: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    role: string;
    station?: string;
    is_active: boolean;
    requires_password_change?: boolean;
    first_login?: boolean;
  };
  message?: string;
}

export const FaceRecognitionLogin: React.FC<FaceRecognitionLoginProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const resetState = useCallback(() => {
    setError(null);
    setStatus('');
    setCapturedImage(null);
    setRetryCount(0);
    setIsCapturing(false);
    setIsAuthenticating(false);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setStatus('Initializing camera...');
      setError(null);
      
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front camera for face login
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        setStatus('Camera ready. Position your face and click Capture.');
      }
    } catch (err) {
      console.error('Camera access error:', err);
      const errorMessage = 'Camera access denied or unavailable. Please allow camera access and try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError]);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      resetState();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera, resetState]);

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Return base64 image data
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const authenticateWithFace = async (imageData: string): Promise<FaceAuthResult> => {
    // Convert base64 to blob for multipart/form-data
    const base64Response = await fetch(imageData);
    const blob = await base64Response.blob();
    
    const formData = new FormData();
    formData.append('image', blob, 'face_capture.jpg');

    const response = await fetch(`${API_BASE_URL}/auth/face-login`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Face authentication failed');
    }

    return await response.json();
  };

  const handleCapture = async () => {
    setIsCapturing(true);
    setError(null);
    setStatus('Capturing face...');

    try {
      const imageData = captureImage();
      if (!imageData) {
        throw new Error('Failed to capture image');
      }

      setCapturedImage(imageData);
      setStatus('Authenticating...');
      setIsAuthenticating(true);

      // Authenticate with backend
      const result = await authenticateWithFace(imageData);

      if (result.success) {
        setStatus('Authentication successful!');
        stopCamera();
        onSuccess(result);
      } else {
        throw new Error(result.message || 'Authentication failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Face authentication failed';
      setError(errorMessage);
      setStatus('');
      setCapturedImage(null);
      setRetryCount(prev => prev + 1);
      onError?.(errorMessage);
    } finally {
      setIsCapturing(false);
      setIsAuthenticating(false);
    }
  };

  const handleRetry = () => {
    resetState();
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-lg mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            🔐 Face Recognition Login
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <div className="flex flex-col">
              <span>{error}</span>
              {retryCount >= 3 && (
                <span className="text-sm mt-1">
                  Tip: Ensure good lighting and look directly at the camera.
                </span>
              )}
            </div>
          </Alert>
        )}

        {status && !error && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700 flex items-center">
              {isAuthenticating && <LoadingSpinner size="sm" className="mr-2" />}
              {status}
            </p>
          </div>
        )}

        <div className="camera-container relative mb-4">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured face"
              className="w-full rounded-lg border-2 border-green-500"
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full rounded-lg border-2 border-gray-300"
              autoPlay
              muted
              playsInline
              style={{ 
                transform: 'scaleX(-1)', // Mirror for selfie view
                maxHeight: '350px',
                objectFit: 'cover'
              }}
            />
          )}
          
          {/* Face guide overlay */}
          {isStreaming && !capturedImage && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="border-4 border-dashed border-blue-400 rounded-full opacity-50"
                style={{ width: '200px', height: '250px' }}
              />
            </div>
          )}
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="flex flex-col gap-3">
          {!isStreaming && !capturedImage && (
            <Button onClick={startCamera} className="w-full">
              📹 Start Camera
            </Button>
          )}

          {isStreaming && !capturedImage && (
            <Button
              onClick={handleCapture}
              disabled={isCapturing || isAuthenticating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isCapturing ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Capturing...
                </span>
              ) : (
                '📸 Capture & Authenticate'
              )}
            </Button>
          )}

          {error && (
            <Button 
              onClick={handleRetry} 
              variant="outline" 
              className="w-full"
            >
              🔄 Try Again
            </Button>
          )}

          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full"
          >
            ← Back to Password Login
          </Button>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tips for successful recognition:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✅ Ensure good, even lighting on your face</li>
            <li>✅ Position your face within the oval guide</li>
            <li>✅ Look directly at the camera</li>
            <li>✅ Remove glasses or hats if having issues</li>
            <li>✅ Keep a neutral expression</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default FaceRecognitionLogin;
