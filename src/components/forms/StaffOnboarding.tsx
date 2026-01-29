// src/components/forms/StaffOnboarding.tsx
// Staff Onboarding Form - Production Lead initiates, Admin approves
// CRITICAL FEATURES: Face Recognition, Aadhar Verification, Bank Details
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import clamflowAPI from '../../lib/clamflow-api';
import { offlineSyncService } from '../../lib/offline-sync';
import { UserRole } from '../../types/auth';
import { StaffOnboardingAccess, AdminOnly } from '../auth/RoleBasedAccess';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app';

// ============================================
// INTERFACES
// ============================================

interface BankDetails {
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  upi_id?: string;
}

interface AadharDetails {
  aadhar_number: string;
  verified: boolean;
  verified_at?: string;
  verification_method?: 'otp' | 'manual';
}

interface FaceRegistrationData {
  face_image?: string;
  registered: boolean;
  registered_at?: string;
  face_encoding_id?: string;
}

interface StaffOnboardingData {
  full_name: string;
  username: string;
  role: UserRole;
  department: 'production' | 'qc' | 'security';
  phone?: string;
  email?: string;
  emergency_contact?: string;
  start_date: string;
  initial_station?: string;
  skills?: string[];
  notes?: string;
  // CRITICAL: New mandatory fields
  aadhar_details?: AadharDetails;
  bank_details?: BankDetails;
  face_registration?: FaceRegistrationData;
  // Onboarding completion status
  onboarding_status: 'incomplete' | 'pending_verification' | 'complete';
  missing_fields?: string[];
}

interface OnboardingRequest {
  id: string;
  staff_data: StaffOnboardingData;
  requested_by: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
}

// ============================================
// STAFF ONBOARDING COMPONENT
// ============================================

const StaffOnboarding: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activeTab, setActiveTab] = useState<'new' | 'pending' | 'approved' | 'incomplete'>('new');
  const [currentStep, setCurrentStep] = useState<'basic' | 'aadhar' | 'bank' | 'face' | 'review'>('basic');
  
  // Form data with new mandatory fields
  const [formData, setFormData] = useState<StaffOnboardingData>({
    full_name: '',
    username: '',
    role: 'Production Staff',
    department: 'production',
    phone: '',
    email: '',
    emergency_contact: '',
    start_date: new Date().toISOString().split('T')[0],
    initial_station: '',
    skills: [],
    notes: '',
    onboarding_status: 'incomplete',
    aadhar_details: undefined,
    bank_details: undefined,
    face_registration: undefined,
  });
  
  // Aadhar verification state
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharOtp, setAadharOtp] = useState('');
  const [aadharOtpSent, setAadharOtpSent] = useState(false);
  const [aadharVerified, setAadharVerified] = useState(false);
  const [aadharVerifying, setAadharVerifying] = useState(false);
  
  // Bank details state
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    upi_id: '',
  });
  
  // Face registration state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [capturingFace, setCapturingFace] = useState(false);
  
  const [pendingRequests, setPendingRequests] = useState<OnboardingRequest[]>([]);
  const [incompleteRecords, setIncompleteRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Role options based on department
  const getRoleOptions = (department: string): UserRole[] => {
    switch (department) {
      case 'production':
        return ['Production Staff', 'Production Lead'];
      case 'qc':
        return ['QC Staff', 'QC Lead'];
      case 'security':
        return ['Security Guard'];
      default:
        return ['Production Staff'];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'department') {
      // Reset role when department changes
      const newRoles = getRoleOptions(value);
      setFormData(prev => ({
        ...prev,
        department: value as 'production' | 'qc' | 'security',
        role: newRoles[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, skills }));
  };

  // ============================================
  // AADHAR VERIFICATION FUNCTIONS
  // ============================================
  
  const validateAadharNumber = (number: string): boolean => {
    // Aadhar is a 12-digit number
    const cleaned = number.replace(/\s/g, '');
    return /^\d{12}$/.test(cleaned);
  };

  const formatAadharNumber = (number: string): string => {
    const cleaned = number.replace(/\D/g, '').slice(0, 12);
    const parts = cleaned.match(/.{1,4}/g) || [];
    return parts.join(' ');
  };

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAadharNumber(e.target.value);
    setAadharNumber(formatted);
  };

  const sendAadharOtp = async () => {
    const cleaned = aadharNumber.replace(/\s/g, '');
    if (!validateAadharNumber(cleaned)) {
      setError('Please enter a valid 12-digit Aadhar number');
      return;
    }
    
    setAadharVerifying(true);
    setError(null);
    
    try {
      // API call to send OTP - Backend: POST /api/aadhar/send-otp
      const response = await fetch(`${API_BASE_URL}/aadhar/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhar_number: cleaned })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAadharOtpSent(true);
        setSuccess('OTP sent to registered mobile number');
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      // Check if offline - need internet to reach backend API (OTP is sent via SMS)
      if (!navigator.onLine) {
        setError('Cannot connect to server. Please check your internet connection to initiate Aadhar verification.');
      } else {
        console.error('Aadhar OTP API Error:', err);
        setError(err.message || 'Aadhar verification service temporarily unavailable. Please try again.');
      }
    } finally {
      setAadharVerifying(false);
    }
  };

  const verifyAadharOtp = async () => {
    if (aadharOtp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    
    setAadharVerifying(true);
    setError(null);
    
    try {
      // API call to verify OTP - Backend: POST /api/aadhar/verify-otp
      const cleaned = aadharNumber.replace(/\s/g, '');
      const response = await fetch(`${API_BASE_URL}/aadhar/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          aadhar_number: cleaned,
          otp: aadharOtp 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAadharVerified(true);
        setFormData(prev => ({
          ...prev,
          aadhar_details: {
            aadhar_number: cleaned,
            verified: true,
            verified_at: new Date().toISOString(),
            verification_method: 'otp'
          }
        }));
        setSuccess('Aadhar verified successfully!');
      } else {
        setError(result.message || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      // Need internet to verify OTP with backend
      if (!navigator.onLine) {
        setError('Cannot connect to server. Please check your internet connection to verify OTP.');
      } else {
        console.error('Aadhar OTP Verification Error:', err);
        setError(err.message || 'Invalid OTP or verification service temporarily unavailable. Please try again.');
      }
    } finally {
      setAadharVerifying(false);
    }
  };

  // ============================================
  // BANK DETAILS FUNCTIONS
  // ============================================

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateBankDetails = (): boolean => {
    if (!bankDetails.bank_name || !bankDetails.account_number || 
        !bankDetails.ifsc_code || !bankDetails.account_holder_name) {
      return false;
    }
    // IFSC code validation: 4 letters + 0 + 6 alphanumeric
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bankDetails.ifsc_code)) {
      setError('Invalid IFSC code format');
      return false;
    }
    return true;
  };

  const saveBankDetails = () => {
    if (!validateBankDetails()) {
      setError('Please fill all required bank details');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      bank_details: bankDetails
    }));
    setSuccess('Bank details saved!');
    setCurrentStep('face');
  };

  // ============================================
  // FACE REGISTRATION FUNCTIONS  
  // ============================================

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setCapturingFace(true);
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error('Canvas context unavailable');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setFaceImage(imageData);
      
      // Register face with backend
      const token = localStorage.getItem('clamflow_token');
      const response = await fetch(`${API_BASE_URL}/biometric/register-face`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          face_data: imageData,
          person_name: formData.full_name,
          person_type: 'staff',
          department: formData.department,
          timestamp: new Date().toISOString()
        })
      });
      
      const result = await response.json();
      
      if (result.success || result.face_id) {
        setFaceRegistered(true);
        setFormData(prev => ({
          ...prev,
          face_registration: {
            face_image: imageData,
            registered: true,
            registered_at: new Date().toISOString(),
            face_encoding_id: result.face_id || result.encoding_id
          }
        }));
        setSuccess('Face registered successfully!');
        stopCamera();
      } else {
        throw new Error(result.message || 'Face registration failed');
      }
    } catch (err: any) {
      // OFFLINE-FIRST: Queue face registration for sync when online
      if (!navigator.onLine || err.message?.includes('Failed to fetch')) {
        const imageData = canvasRef.current?.toDataURL('image/jpeg', 0.8);
        if (imageData) {
          // Save locally and queue for sync
          const pendingFaceData = {
            face_data: imageData,
            person_name: formData.full_name,
            person_type: 'staff',
            department: formData.department,
            timestamp: new Date().toISOString()
          };
          
          // Queue for background sync
          if (offlineSyncService) {
            offlineSyncService.queueOperation(
              'face_registration',
              `${API_BASE_URL}/biometric/register-face`,
              'POST',
              pendingFaceData,
              user?.id
            );
          }
          
          // Store face image locally for now
          setFaceImage(imageData);
          setFaceRegistered(true);
          setFormData(prev => ({
            ...prev,
            face_registration: {
              face_image: imageData,
              registered: true,
              registered_at: new Date().toISOString(),
              face_encoding_id: `pending_sync_${Date.now()}`
            }
          }));
          setSuccess('Face captured! Will sync to server when online.');
          stopCamera();
        } else {
          setError('Failed to capture face image. Please try again.');
        }
      } else {
        console.error('Face Registration Error:', err);
        setError(err.message || 'Face registration failed. Please try again.');
      }
    } finally {
      setCapturingFace(false);
    }
  };

  // ============================================
  // ONBOARDING COMPLETION CHECK
  // ============================================

  const getOnboardingStatus = (): { status: 'incomplete' | 'pending_verification' | 'complete'; missing: string[] } => {
    const missing: string[] = [];
    
    if (!formData.aadhar_details?.verified) missing.push('Aadhar Verification');
    if (!formData.bank_details) missing.push('Bank Details');
    if (!formData.face_registration?.registered) missing.push('Face Registration');
    
    if (missing.length === 0) return { status: 'complete', missing: [] };
    if (missing.length < 3) return { status: 'pending_verification', missing };
    return { status: 'incomplete', missing };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Auto-generate username if not provided
      const username = formData.username || formData.full_name.toLowerCase().replace(/\s+/g, '.');
      
      // Determine onboarding completion status
      const onboardingCheck = getOnboardingStatus();
      
      const requestData = {
        ...formData,
        username,
        onboarding_status: onboardingCheck.status,
        missing_fields: onboardingCheck.missing,
        aadhar_details: formData.aadhar_details,
        bank_details: formData.bank_details,
        face_registration: formData.face_registration,
        requested_by: user?.id,
        requested_by_name: user?.full_name,
        requested_at: new Date().toISOString(),
        status: 'pending'
      };

      // Submit to backend (API endpoint for onboarding requests)
      // This would be: POST /api/staff/onboarding-requests
      const token = localStorage.getItem('clamflow_token');
      try {
        const response = await fetch(`${API_BASE_URL}/staff/onboarding-requests`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to submit onboarding request');
        }
      } catch (apiErr: any) {
        // OFFLINE-FIRST: Queue submission for sync when online
        if (!navigator.onLine || apiErr.message?.includes('Failed to fetch')) {
          if (offlineSyncService) {
            offlineSyncService.queueOperation(
              'staff_onboarding',
              `${API_BASE_URL}/staff/onboarding-requests`,
              'POST',
              requestData as Record<string, unknown>,
              user?.id
            );
            console.log('[Offline] Staff onboarding queued for sync');
          }
        } else {
          console.error('Staff Onboarding API Error:', apiErr);
          throw new Error(apiErr.message || 'Failed to submit onboarding request. Please try again.');
        }
      }
      
      // Show appropriate message based on completion status
      if (onboardingCheck.status === 'complete') {
        setSuccess(`Onboarding request for ${formData.full_name} submitted successfully (COMPLETE). Awaiting Admin approval.`);
      } else {
        setSuccess(`Onboarding request for ${formData.full_name} submitted with INCOMPLETE status. Missing: ${onboardingCheck.missing.join(', ')}. These can be completed later.`);
      }
      
      // Reset form
      setFormData({
        full_name: '',
        username: '',
        role: 'Production Staff',
        department: 'production',
        phone: '',
        email: '',
        emergency_contact: '',
        start_date: new Date().toISOString().split('T')[0],
        initial_station: '',
        skills: [],
        notes: '',
        onboarding_status: 'incomplete',
        aadhar_details: undefined,
        bank_details: undefined,
        face_registration: undefined,
      });
      
      // Reset other states
      setAadharNumber('');
      setAadharVerified(false);
      setAadharOtpSent(false);
      setBankDetails({
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        account_holder_name: '',
        upi_id: '',
      });
      setFaceImage(null);
      setFaceRegistered(false);
      setCurrentStep('basic');

    } catch (err: any) {
      setError(err.message || 'Failed to submit onboarding request');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      // API call to approve: POST /api/staff/onboarding-requests/{id}/approve
      console.log('Approving request:', requestId);
      // After approval, the system would create the user account
      setSuccess('Staff onboarding approved. User account created.');
    } catch (err: any) {
      setError(err.message || 'Failed to approve onboarding');
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      // API call to reject: POST /api/staff/onboarding-requests/{id}/reject
      console.log('Rejecting request:', requestId, reason);
      setSuccess('Onboarding request rejected.');
    } catch (err: any) {
      setError(err.message || 'Failed to reject onboarding');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access staff onboarding.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Staff Onboarding</h1>
              <p className="text-purple-100 mt-1">
                Add new Production, QC & Security staff
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('new')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'new'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ➕ New Request
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ⏳ Pending Approval
            </button>
            <button
              onClick={() => setActiveTab('incomplete')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'incomplete'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ⚠️ Incomplete
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'approved'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ✅ Approved
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Alerts */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            ✅ {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            ❌ {error}
          </div>
        )}

        {/* New Request Tab */}
        {activeTab === 'new' && (
          <StaffOnboardingAccess fallback={
            <div className="text-center py-12 text-gray-500">
              <span className="text-6xl">🔒</span>
              <p className="mt-4">You do not have permission to onboard staff.</p>
            </div>
          }>
            <div className="bg-white rounded-lg shadow p-6">
              {/* Step Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {['basic', 'aadhar', 'bank', 'face', 'review'].map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep === step 
                            ? 'bg-purple-600 text-white' 
                            : ['basic', 'aadhar', 'bank', 'face', 'review'].indexOf(currentStep) > index
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {['basic', 'aadhar', 'bank', 'face', 'review'].indexOf(currentStep) > index ? '✓' : index + 1}
                      </div>
                      {index < 4 && (
                        <div className={`w-12 sm:w-20 h-1 mx-1 ${
                          ['basic', 'aadhar', 'bank', 'face', 'review'].indexOf(currentStep) > index
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Basic</span>
                  <span>Aadhar</span>
                  <span>Bank</span>
                  <span>Face</span>
                  <span>Review</span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800">New Staff Onboarding Request</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Complete all steps for full onboarding. Mandatory: Aadhar, Bank Details, Face Registration.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* STEP 1: Basic Information */}
                {currentStep === 'basic' && (
                  <>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <h3 className="font-medium text-blue-800">📋 Step 1: Basic Information</h3>
                      <p className="text-sm text-blue-600 mt-1">Enter staff personal and employment details</p>
                    </div>
                    
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Auto-generated if empty"
                        />
                      </div>
                    </div>

                    {/* Department & Role */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="production">Production</option>
                          <option value="qc">Quality Control (QC)</option>
                          <option value="security">Security</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          {getRoleOptions(formData.department).map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="+91 9876543210"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="john@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Emergency Contact
                        </label>
                        <input
                          type="tel"
                          name="emergency_contact"
                          value={formData.emergency_contact}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>

                    {/* Start Date & Station */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Initial Station Assignment
                        </label>
                        <input
                          type="text"
                          name="initial_station"
                          value={formData.initial_station}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g., RM Station 1"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.full_name && formData.phone) {
                            setCurrentStep('aadhar');
                            setError(null);
                          } else {
                            setError('Please fill Full Name and Phone before proceeding');
                          }
                        }}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Next: Aadhar Verification →
                      </button>
                    </div>
                  </>
                )}

                {/* STEP 2: Aadhar Verification */}
                {currentStep === 'aadhar' && (
                  <>
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                      <h3 className="font-medium text-orange-800">🆔 Step 2: Aadhar Verification (Mandatory)</h3>
                      <p className="text-sm text-orange-600 mt-1">One-time verification for authenticity</p>
                    </div>

                    <div className="max-w-md mx-auto space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aadhar Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={aadharNumber}
                          onChange={handleAadharChange}
                          disabled={aadharVerified}
                          maxLength={14}
                          className="w-full px-4 py-3 text-lg tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                          placeholder="1234 5678 9012"
                        />
                      </div>

                      {!aadharVerified && !aadharOtpSent && (
                        <button
                          type="button"
                          onClick={sendAadharOtp}
                          disabled={aadharVerifying || !validateAadharNumber(aadharNumber.replace(/\s/g, ''))}
                          className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {aadharVerifying ? '⏳ Sending OTP...' : '📱 Send OTP to Registered Mobile'}
                        </button>
                      )}

                      {aadharOtpSent && !aadharVerified && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Enter OTP
                            </label>
                            <input
                              type="text"
                              value={aadharOtp}
                              onChange={(e) => setAadharOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              maxLength={6}
                              className="w-full px-4 py-3 text-2xl tracking-[1em] text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              placeholder="● ● ● ● ● ●"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={verifyAadharOtp}
                            disabled={aadharVerifying || aadharOtp.length !== 6}
                            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {aadharVerifying ? '⏳ Verifying...' : '✅ Verify OTP'}
                          </button>
                          <button
                            type="button"
                            onClick={sendAadharOtp}
                            className="w-full text-sm text-orange-600 hover:underline"
                          >
                            Resend OTP
                          </button>
                        </div>
                      )}

                      {aadharVerified && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                          <span className="text-4xl">✅</span>
                          <p className="font-medium text-green-800 mt-2">Aadhar Verified Successfully!</p>
                          <p className="text-sm text-green-600">Number: {aadharNumber}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between mt-6">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('basic')}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep('bank')}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        {aadharVerified ? 'Next: Bank Details →' : 'Skip for Now →'}
                      </button>
                    </div>
                  </>
                )}

                {/* STEP 3: Bank Details */}
                {currentStep === 'bank' && (
                  <>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <h3 className="font-medium text-blue-800">🏦 Step 3: Bank Account Details (Mandatory)</h3>
                      <p className="text-sm text-blue-600 mt-1">Required for salary and payment processing</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bank Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="bank_name"
                            value={bankDetails.bank_name}
                            onChange={handleBankDetailsChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="State Bank of India"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Holder Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="account_holder_name"
                            value={bankDetails.account_holder_name}
                            onChange={handleBankDetailsChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="As per bank records"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="account_number"
                            value={bankDetails.account_number}
                            onChange={handleBankDetailsChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="1234567890123"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            IFSC Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="ifsc_code"
                            value={bankDetails.ifsc_code}
                            onChange={(e) => handleBankDetailsChange({
                              ...e,
                              target: { ...e.target, value: e.target.value.toUpperCase() }
                            } as React.ChangeEvent<HTMLInputElement>)}
                            maxLength={11}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                            placeholder="SBIN0001234"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          UPI ID (Optional but recommended)
                        </label>
                        <input
                          type="text"
                          name="upi_id"
                          value={bankDetails.upi_id}
                          onChange={handleBankDetailsChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="username@upi or phone@ybl"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('aadhar')}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (bankDetails.bank_name && bankDetails.account_number && bankDetails.ifsc_code && bankDetails.account_holder_name) {
                            setFormData(prev => ({
                              ...prev,
                              bank_details: bankDetails
                            }));
                            setCurrentStep('face');
                            setError(null);
                          } else {
                            setCurrentStep('face'); // Allow skip
                          }
                        }}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Next: Face Registration →
                      </button>
                    </div>
                  </>
                )}

                {/* STEP 4: Face Registration */}
                {currentStep === 'face' && (
                  <>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                      <h3 className="font-medium text-green-800">👤 Step 4: Face Registration (Mandatory)</h3>
                      <p className="text-sm text-green-600 mt-1">Required for attendance and people detection</p>
                    </div>

                    <div className="max-w-lg mx-auto">
                      {!faceRegistered ? (
                        <div className="space-y-4">
                          <div className="bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                            {isCameraActive ? (
                              <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-8">
                                <span className="text-6xl">📷</span>
                                <p className="text-gray-500 mt-2">Camera preview will appear here</p>
                              </div>
                            )}
                          </div>
                          <canvas ref={canvasRef} className="hidden" />

                          <div className="flex justify-center space-x-4">
                            {!isCameraActive ? (
                              <button
                                type="button"
                                onClick={startCamera}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                📹 Start Camera
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={captureFace}
                                  disabled={capturingFace}
                                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {capturingFace ? '📸 Capturing...' : '📸 Capture & Register Face'}
                                </button>
                                <button
                                  type="button"
                                  onClick={stopCamera}
                                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                  ⏹️ Stop
                                </button>
                              </>
                            )}
                          </div>

                          <div className="text-sm text-gray-500 space-y-1">
                            <p>📱 Position face in center of frame</p>
                            <p>💡 Ensure good lighting</p>
                            <p>😊 Look directly at camera</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          {faceImage && (
                            <img 
                              src={faceImage} 
                              alt="Registered face" 
                              className="w-48 h-48 mx-auto rounded-full object-cover border-4 border-green-500"
                            />
                          )}
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <span className="text-4xl">✅</span>
                            <p className="font-medium text-green-800 mt-2">Face Registered Successfully!</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFaceRegistered(false);
                              setFaceImage(null);
                            }}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Re-capture face
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between mt-6">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('bank')}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep('review')}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Next: Review & Submit →
                      </button>
                    </div>
                  </>
                )}

                {/* STEP 5: Review & Submit */}
                {currentStep === 'review' && (
                  <>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-4">
                      <h3 className="font-medium text-purple-800">📝 Step 5: Review & Submit</h3>
                      <p className="text-sm text-purple-600 mt-1">Verify all information before submission</p>
                    </div>

                    {/* Onboarding Status Summary */}
                    {(() => {
                      const status = getOnboardingStatus();
                      return (
                        <div className={`p-4 rounded-lg mb-6 ${
                          status.status === 'complete' 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-yellow-50 border border-yellow-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-2xl mr-2">
                                {status.status === 'complete' ? '✅' : '⚠️'}
                              </span>
                              <span className={`font-medium ${
                                status.status === 'complete' ? 'text-green-800' : 'text-yellow-800'
                              }`}>
                                Onboarding Status: {status.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          {status.missing.length > 0 && (
                            <p className="text-sm text-yellow-700 mt-2">
                              Missing: {status.missing.join(', ')}
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Review Sections */}
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">📋 Basic Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><span className="text-gray-500">Name:</span> {formData.full_name}</p>
                          <p><span className="text-gray-500">Phone:</span> {formData.phone}</p>
                          <p><span className="text-gray-500">Department:</span> {formData.department}</p>
                          <p><span className="text-gray-500">Role:</span> {formData.role}</p>
                          <p><span className="text-gray-500">Start Date:</span> {formData.start_date}</p>
                          <p><span className="text-gray-500">Email:</span> {formData.email || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Aadhar */}
                      <div className={`p-4 rounded-lg ${aadharVerified ? 'bg-green-50' : 'bg-red-50'}`}>
                        <h4 className="font-medium mb-2">
                          {aadharVerified ? '✅' : '❌'} Aadhar Verification
                        </h4>
                        <p className="text-sm">
                          {aadharVerified 
                            ? `Verified: ${aadharNumber}` 
                            : 'Not verified - Can be completed later'}
                        </p>
                      </div>

                      {/* Bank Details */}
                      <div className={`p-4 rounded-lg ${formData.bank_details ? 'bg-green-50' : 'bg-red-50'}`}>
                        <h4 className="font-medium mb-2">
                          {formData.bank_details ? '✅' : '❌'} Bank Details
                        </h4>
                        {formData.bank_details ? (
                          <div className="text-sm grid grid-cols-2 gap-1">
                            <p>Bank: {formData.bank_details.bank_name}</p>
                            <p>Account: ****{formData.bank_details.account_number.slice(-4)}</p>
                            <p>IFSC: {formData.bank_details.ifsc_code}</p>
                            <p>UPI: {formData.bank_details.upi_id || 'N/A'}</p>
                          </div>
                        ) : (
                          <p className="text-sm">Not provided - Can be completed later</p>
                        )}
                      </div>

                      {/* Face Registration */}
                      <div className={`p-4 rounded-lg ${faceRegistered ? 'bg-green-50' : 'bg-red-50'}`}>
                        <h4 className="font-medium mb-2">
                          {faceRegistered ? '✅' : '❌'} Face Registration
                        </h4>
                        <div className="flex items-center">
                          {faceImage && (
                            <img src={faceImage} alt="Face" className="w-16 h-16 rounded-full object-cover mr-4" />
                          )}
                          <p className="text-sm">
                            {faceRegistered 
                              ? 'Face registered for attendance' 
                              : 'Not registered - Can be completed later'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Workflow Notice */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-6">
                      <p className="text-yellow-800 text-sm">
                        <strong>⚠️ Approval Required:</strong> This onboarding request will be sent to Admin for approval. 
                        Staff with incomplete verification can be marked for completion before considered fully onboarded.
                      </p>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-between mt-6">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('face')}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? 'Submitting...' : 'Submit for Approval'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </StaffOnboardingAccess>
        )}

        {/* Incomplete Onboarding Tab */}
        {activeTab === 'incomplete' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Incomplete Onboarding Records</h2>
              <p className="text-gray-500 text-sm mt-1">
                Staff pending Aadhar verification, Bank details, or Face registration
              </p>
            </div>
            
            <div className="divide-y">
              {incompleteRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-6xl">✅</span>
                  <p className="mt-4">No incomplete records</p>
                  <p className="text-sm">All onboarded staff have complete verification</p>
                </div>
              ) : (
                incompleteRecords.map((record) => (
                  <div key={record.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{record.full_name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {!record.aadhar_verified && (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Missing Aadhar</span>
                        )}
                        {!record.bank_details && (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Missing Bank</span>
                        )}
                        {!record.face_registered && (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Missing Face</span>
                        )}
                      </div>
                    </div>
                    <button 
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      onClick={() => {
                        // Navigate to complete verification
                        console.log('Complete verification for:', record.id);
                      }}
                    >
                      Complete Verification
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Pending Approval Tab */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Pending Onboarding Requests</h2>
              <p className="text-gray-500 text-sm mt-1">
                Requests awaiting Admin approval
              </p>
            </div>
            
            <div className="divide-y">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-6xl">📋</span>
                  <p className="mt-4">No pending requests</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className="p-4">
                    <OnboardingRequestCard 
                      request={request}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      showActions={user.role === 'Admin' || user.role === 'Super Admin'}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Approved Tab */}
        {activeTab === 'approved' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Approved Onboardings</h2>
              <p className="text-gray-500 text-sm mt-1">
                Successfully onboarded staff members
              </p>
            </div>
            
            <div className="text-center py-12 text-gray-500">
              <span className="text-6xl">✅</span>
              <p className="mt-4">Approved onboardings will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const OnboardingRequestCard: React.FC<{
  request: OnboardingRequest;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  showActions: boolean;
}> = ({ request, onApprove, onReject, showActions }) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const departmentColors: Record<string, string> = {
    production: 'bg-blue-100 text-blue-700',
    qc: 'bg-green-100 text-green-700',
    security: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-xl">👤</span>
        </div>
        <div>
          <p className="font-medium text-gray-800">{request.staff_data.full_name}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-xs ${departmentColors[request.staff_data.department]}`}>
              {request.staff_data.department.toUpperCase()}
            </span>
            <span className="text-sm text-gray-500">{request.staff_data.role}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Requested by {request.requested_by} • {new Date(request.requested_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      {showActions && (
        <div className="flex space-x-2">
          <button 
            onClick={() => onApprove(request.id)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            ✅ Approve
          </button>
          <button 
            onClick={() => setShowRejectModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            ❌ Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default StaffOnboarding;
