import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';

// Use environment variable for API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflow-backend-production.up.railway.app';

interface FaceCaptureProps {
  mode?: 'attendance' | 'registration';
  onCapture?: (imageData: string, result?: any) => void;
  onError?: (error: string) => void;
}

export const FaceCapture: React.FC<FaceCaptureProps> = ({
  mode = 'attendance',
  onCapture,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');
  }, []);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: deviceType === 'mobile' ? 'user' : 'environment'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        setError(null);
      }
    } catch (error) {
      const errorMessage = 'Camera access denied or unavailable';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const captureAttendance = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (!context) throw new Error('Canvas context unavailable');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Capture current frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      if (mode === 'attendance') {
        // Send to backend for authentication
        const response = await fetch(`${API_BASE_URL}/biometric/authenticate-face`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            face_data: imageData,
            capture_method: `${deviceType}_camera`,
            timestamp: new Date().toISOString()
          })
        });

        const result = await response.json();

        if (result.authenticated) {
          // Record attendance - Backend: /attendance/ (POST)
          const token = localStorage.getItem('clamflow_token');
          await fetch(`${API_BASE_URL}/attendance/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              person_id: result.staff_id,
              method: 'face',
              device_type: deviceType
            })
          });

          onCapture?.(imageData, result);
        } else {
          setError('Face authentication failed');
        }
      } else {
        // Registration mode
        onCapture?.(imageData);
      }

    } catch (error) {
      const errorMessage = 'Capture failed: ' + (error as Error).message;
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Card className="face-capture-container">
      <div className="face-capture-header">
        <h3>{mode === 'attendance' ? 'Face Attendance' : 'Face Registration'}</h3>
        <div className="device-indicator">
          <span className={`device-badge ${deviceType}`}>
            {deviceType === 'mobile' ? '📱' : '🖥️'} {deviceType}
          </span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="camera-container">
        <video
          ref={videoRef}
          className="camera-feed"
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            maxWidth: '640px',
            height: 'auto',
            border: '2px solid #ddd',
            borderRadius: '8px'
          }}
        />
        
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>

      <div className="camera-controls">
        {!isStreaming ? (
          <Button 
            onClick={startCamera}
            className="start-camera-btn"
          >
            📹 Start Camera
          </Button>
        ) : (
          <div className="active-controls">
            <Button
              onClick={captureAttendance}
              disabled={isCapturing}
              className="capture-btn"
            >
              {isCapturing ? '📸 Capturing...' : '📸 Capture Face'}
            </Button>
            
            <Button
              onClick={stopCamera}
              variant="outline"
              className="stop-camera-btn"
            >
              ⏹️ Stop Camera
            </Button>
          </div>
        )}
      </div>

      <div className="capture-instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>📱 Position face in center of camera view</li>
          <li>💡 Ensure good lighting on face</li>
          <li>😊 Look directly at camera</li>
          <li>🚫 Remove glasses if possible</li>
        </ul>
      </div>
    </Card>
  );
};