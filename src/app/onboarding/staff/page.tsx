'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import clamflowAPI from '@/lib/clamflow-api';
import Image from 'next/image';

interface StaffOnboardingData {
  first_name: string;
  last_name: string;
  address: string;
  contact_number: string;
  aadhar_number: string;
  face_image?: string;
  designation: string;
  start_date?: string;
  status: string;
}

export default function StaffOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const authorizedRoles = ['Super Admin', 'Admin', 'Production Lead', 'Staff Lead'];

    if (!user?.role || !authorizedRoles.includes(user.role)) {
      alert('Access Denied: Only Super Admin, Admin, Production Lead, or Staff Lead can onboard staff.');
      router.push('/dashboard');
      return;
    }
  }, [user?.role, router]);

  const [formData, setFormData] = useState<StaffOnboardingData>({
    first_name: '',
    last_name: '',
    address: '',
    contact_number: '',
    aadhar_number: '',
    face_image: '',
    designation: '',
    start_date: '',
    status: 'pending'
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Face capture state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setCameraError('Camera access denied or unavailable. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.85);

    setCapturedImage(imageData);
    setFormData(prev => ({ ...prev, face_image: imageData }));
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setFormData(prev => ({ ...prev, face_image: '' }));
    startCamera();
  }, [startCamera]);

  // Cleanup camera on unmount
  useEffect(() => {
    const videoEl = videoRef.current;
    return () => {
      if (videoEl?.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const designationOptions = [
    { value: 'Super Admin', label: 'Super Admin' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Production Lead', label: 'Production Lead' },
    { value: 'Staff Lead', label: 'Staff Lead' },
    { value: 'QC Lead', label: 'QC Lead' },
    { value: 'QC Staff', label: 'QC Staff' },
    { value: 'Production Staff', label: 'Production Staff' },
    { value: 'Security Guard', label: 'Security Guard' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submissionData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        address: formData.address,
        contact_number: formData.contact_number,
        aadhar_number: formData.aadhar_number,
        face_image: formData.face_image || null,
        designation: formData.designation,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        status: 'pending'
      };

      await clamflowAPI.post('/api/onboarding/staff', submissionData);

      setSuccess(true);

      setTimeout(() => {
        setFormData({
          first_name: '',
          last_name: '',
          address: '',
          contact_number: '',
          aadhar_number: '',
          face_image: '',
          designation: '',
          start_date: '',
          status: 'pending'
        });
        setSuccess(false);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit staff onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors"
          >
            <span className="mr-1">←</span> Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo-relish.png"
              alt="Relish Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ClamFlow</h1>
          <p className="text-lg text-purple-700 font-semibold mb-2">Quality &bull; Productivity &bull; Assured</p>
          <h2 className="text-2xl font-bold text-gray-800">Staff Onboarding</h2>
          <p className="text-gray-600">Add new team member to ClamFlow system</p>
          <div className="mt-2 text-sm text-gray-500">
            Submitted by: {user?.full_name || user?.username} ({user?.role})
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Staff onboarding submitted successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>The request has been sent to admin for approval. Staff member will be notified once approved.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                    placeholder="Enter full address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      id="contact_number"
                      name="contact_number"
                      required
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  <div>
                    <label htmlFor="aadhar_number" className="block text-sm font-medium text-gray-700 mb-2">
                      Aadhar Number *
                    </label>
                    <input
                      type="text"
                      id="aadhar_number"
                      name="aadhar_number"
                      required
                      pattern="[0-9]{12}"
                      value={formData.aadhar_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                      placeholder="XXXX XXXX XXXX"
                      maxLength={12}
                    />
                    <p className="text-xs text-gray-500 mt-1">12-digit Aadhar number</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                    Designation *
                  </label>
                  <select
                    id="designation"
                    name="designation"
                    required
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                  >
                    <option value="">Select Designation</option>
                    {designationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Face Recognition Capture */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-1">Face Registration</h3>
              <p className="text-sm text-gray-500 mb-4">Capture staff member&apos;s face for attendance recognition</p>

              {cameraError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {cameraError}
                </div>
              )}

              {/* Captured preview */}
              {capturedImage && !cameraActive && (
                <div className="space-y-3">
                  <div className="relative w-full max-w-sm mx-auto">
                    <img
                      src={capturedImage}
                      alt="Captured face"
                      className="w-full rounded-lg border-2 border-green-400 shadow-md"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      ✓ Captured
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      🔄 Retake Photo
                    </button>
                  </div>
                </div>
              )}

              {/* Camera feed */}
              {cameraActive && !capturedImage && (
                <div className="space-y-3">
                  <div className="relative w-full max-w-sm mx-auto">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full rounded-lg border-2 border-blue-400 shadow-md bg-black"
                    />
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                      ● LIVE
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      📸 Capture Face
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      ⏹ Cancel
                    </button>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-3 max-w-sm mx-auto">
                    <p className="text-xs text-blue-700 font-medium mb-1">Tips for a good capture:</p>
                    <ul className="text-xs text-blue-600 space-y-0.5">
                      <li>• Position face in center of frame</li>
                      <li>• Ensure good, even lighting</li>
                      <li>• Look directly at the camera</li>
                      <li>• Remove glasses if possible</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Start camera button (initial state) */}
              {!cameraActive && !capturedImage && (
                <div className="text-center">
                  <div className="w-full max-w-sm mx-auto border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                    <div className="text-4xl mb-3">📷</div>
                    <p className="text-sm text-gray-600 mb-4">No face photo captured yet</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-5 py-2.5 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
                    >
                      📹 Open Camera
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Required for face recognition attendance</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-purple-600 text-white rounded-md shadow-sm text-base font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit for Approval'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Next Steps
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Your submission will be reviewed by an administrator</li>
                  <li>Once approved, the staff member will be added to the system</li>
                  <li>Face data will be registered for attendance recognition</li>
                  <li>Login credentials will be assigned automatically</li>
                  <li>The staff member will receive notification upon approval</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
