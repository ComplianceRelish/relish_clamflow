// src/components/forms/SupplierOnboarding.tsx
// Supplier & Agent Onboarding Form
// CRITICAL FEATURES: Face Recognition, Aadhar Verification, Bank Details, Agent Linking
'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { offlineSyncService } from '../../lib/offline-sync';
import { AdminOnly } from '../auth/RoleBasedAccess';

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

interface AgentDeclaration {
  id: string;
  agent_name: string;
  agent_phone: string;
  relationship: string;
  authorized_activities: string[];
  declaration_date: string;
  consent_given: boolean;
  consent_date?: string;
}

interface SupplierOnboardingData {
  id?: string;
  type: 'boat_owner' | 'agent';
  first_name: string;
  last_name: string;
  address: string;
  contact_number: string;
  email?: string;
  // Boat owner specific
  boat_registration_number?: string;
  gst_number?: string;
  // Agent specific
  linked_boat_owner_id?: string;
  linked_boat_owner_name?: string;
  // Mandatory verification
  aadhar_details?: AadharDetails;
  bank_details?: BankDetails;
  face_registration?: FaceRegistrationData;
  // Agent declarations (for boat owners)
  agent_declarations?: AgentDeclaration[];
  // Onboarding completion status
  onboarding_status: 'incomplete' | 'pending_verification' | 'complete';
  missing_fields?: string[];
  // Approval workflow
  status: 'pending' | 'approved' | 'rejected';
  submitted_by?: string;
  approved_by?: string;
  created_at?: string;
}

// ============================================
// SUPPLIER ONBOARDING COMPONENT
// ============================================

const SupplierOnboarding: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activeTab, setActiveTab] = useState<'new' | 'pending' | 'incomplete' | 'approved'>('new');
  const [supplierType, setSupplierType] = useState<'boat_owner' | 'agent'>('boat_owner');
  const [currentStep, setCurrentStep] = useState<'basic' | 'aadhar' | 'bank' | 'face' | 'agents' | 'review'>('basic');
  
  // Form data
  const [formData, setFormData] = useState<SupplierOnboardingData>({
    type: 'boat_owner',
    first_name: '',
    last_name: '',
    address: '',
    contact_number: '',
    email: '',
    boat_registration_number: '',
    gst_number: '',
    onboarding_status: 'incomplete',
    status: 'pending',
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
  
  // Agent declarations state (for boat owners)
  const [agentDeclarations, setAgentDeclarations] = useState<AgentDeclaration[]>([]);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [newAgent, setNewAgent] = useState<Partial<AgentDeclaration>>({
    agent_name: '',
    agent_phone: '',
    relationship: '',
    authorized_activities: [],
    consent_given: false,
  });
  
  // Existing suppliers for agent linking
  const [existingBoatOwners, setExistingBoatOwners] = useState<any[]>([]);
  const [selectedBoatOwner, setSelectedBoatOwner] = useState<string>('');
  
  // Lists
  const [pendingSuppliers, setPendingSuppliers] = useState<SupplierOnboardingData[]>([]);
  const [incompleteRecords, setIncompleteRecords] = useState<SupplierOnboardingData[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FORM HANDLERS
  // ============================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (type: 'boat_owner' | 'agent') => {
    setSupplierType(type);
    setFormData(prev => ({
      ...prev,
      type,
      boat_registration_number: type === 'agent' ? undefined : prev.boat_registration_number,
    }));
  };

  // ============================================
  // AADHAR VERIFICATION FUNCTIONS
  // ============================================

  const validateAadharNumber = (number: string): boolean => {
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
      // Need internet to reach backend API (OTP is sent via SMS)
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
          person_name: `${formData.first_name} ${formData.last_name}`,
          person_type: supplierType,
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
            person_name: `${formData.first_name} ${formData.last_name}`,
            person_type: supplierType,
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
          
          // Store face image locally
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
  // AGENT DECLARATION FUNCTIONS (For Boat Owners)
  // ============================================

  const addAgentDeclaration = () => {
    if (!newAgent.agent_name || !newAgent.agent_phone) {
      setError('Agent name and phone are required');
      return;
    }
    
    const declaration: AgentDeclaration = {
      id: `agent_${Date.now()}`,
      agent_name: newAgent.agent_name || '',
      agent_phone: newAgent.agent_phone || '',
      relationship: newAgent.relationship || 'Agent',
      authorized_activities: newAgent.authorized_activities || ['Delivery', 'Weighing'],
      declaration_date: new Date().toISOString(),
      consent_given: newAgent.consent_given || false,
      consent_date: newAgent.consent_given ? new Date().toISOString() : undefined,
    };
    
    setAgentDeclarations(prev => [...prev, declaration]);
    setFormData(prev => ({
      ...prev,
      agent_declarations: [...(prev.agent_declarations || []), declaration]
    }));
    
    // Reset form
    setNewAgent({
      agent_name: '',
      agent_phone: '',
      relationship: '',
      authorized_activities: [],
      consent_given: false,
    });
    setShowAgentForm(false);
    setSuccess('Agent declaration added');
  };

  const removeAgentDeclaration = (id: string) => {
    setAgentDeclarations(prev => prev.filter(a => a.id !== id));
    setFormData(prev => ({
      ...prev,
      agent_declarations: prev.agent_declarations?.filter(a => a.id !== id)
    }));
  };

  // ============================================
  // ONBOARDING STATUS CHECK
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

  // ============================================
  // FORM SUBMISSION
  // ============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const onboardingCheck = getOnboardingStatus();
      
      const requestData: SupplierOnboardingData = {
        ...formData,
        onboarding_status: onboardingCheck.status,
        missing_fields: onboardingCheck.missing,
        bank_details: bankDetails.bank_name ? bankDetails : undefined,
        linked_boat_owner_id: supplierType === 'agent' ? selectedBoatOwner : undefined,
        submitted_by: user?.id,
        created_at: new Date().toISOString(),
      };

      // Submit to backend
      const token = localStorage.getItem('clamflow_token');
      try {
        const response = await fetch(`${API_BASE_URL}/suppliers/onboarding`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to submit');
        }
      } catch (apiErr: any) {
        // OFFLINE-FIRST: Queue submission for sync when online
        if (!navigator.onLine || apiErr.message?.includes('Failed to fetch')) {
          if (offlineSyncService) {
            offlineSyncService.queueOperation(
              'supplier_onboarding',
              `${API_BASE_URL}/suppliers/onboarding`,
              'POST',
              JSON.parse(JSON.stringify(requestData)),
              user?.id
            );
            console.log('[Offline] Supplier onboarding queued for sync');
          }
        } else {
          console.error('Supplier Onboarding API Error:', apiErr);
          throw new Error(apiErr.message || 'Failed to submit. Please try again.');
        }
      }
      
      if (onboardingCheck.status === 'complete') {
        setSuccess(`${supplierType === 'boat_owner' ? 'Supplier' : 'Agent'} ${formData.first_name} ${formData.last_name} onboarded successfully (COMPLETE).`);
      } else {
        setSuccess(`${supplierType === 'boat_owner' ? 'Supplier' : 'Agent'} onboarded with INCOMPLETE status. Missing: ${onboardingCheck.missing.join(', ')}`);
      }
      
      // Reset form
      setFormData({
        type: 'boat_owner',
        first_name: '',
        last_name: '',
        address: '',
        contact_number: '',
        onboarding_status: 'incomplete',
        status: 'pending',
      });
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
      setAgentDeclarations([]);
      setCurrentStep('basic');
      
    } catch (err: any) {
      setError(err.message || 'Failed to submit onboarding');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access supplier onboarding.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Supplier & Agent Onboarding</h1>
              <p className="text-teal-100 mt-1">
                Register Boat Owners, Suppliers & their Agents
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-teal-50"
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
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ➕ New Registration
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-teal-600 text-teal-600'
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
                  ? 'border-teal-600 text-teal-600'
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

        {/* New Registration Tab */}
        {activeTab === 'new' && (
          <div className="bg-white rounded-lg shadow p-6">
            {/* Type Selection */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Registration Type</h2>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleTypeChange('boat_owner')}
                  className={`flex-1 p-4 rounded-lg border-2 text-center ${
                    supplierType === 'boat_owner'
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <span className="text-3xl">🚤</span>
                  <p className="font-medium mt-2">Boat Owner / Supplier</p>
                  <p className="text-sm text-gray-500">Primary supplier registration</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('agent')}
                  className={`flex-1 p-4 rounded-lg border-2 text-center ${
                    supplierType === 'agent'
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <span className="text-3xl">👤</span>
                  <p className="font-medium mt-2">Agent</p>
                  <p className="text-sm text-gray-500">Linked to existing supplier</p>
                </button>
              </div>
            </div>

            {/* Step Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {(supplierType === 'boat_owner' 
                  ? ['basic', 'aadhar', 'bank', 'face', 'agents', 'review']
                  : ['basic', 'aadhar', 'bank', 'face', 'review']
                ).map((step, index, arr) => (
                  <div key={step} className="flex items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep === step 
                          ? 'bg-teal-600 text-white' 
                          : arr.indexOf(currentStep) > index
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {arr.indexOf(currentStep) > index ? '✓' : index + 1}
                    </div>
                    {index < arr.length - 1 && (
                      <div className={`w-8 sm:w-16 h-1 mx-1 ${
                        arr.indexOf(currentStep) > index
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* STEP 1: Basic Information */}
              {currentStep === 'basic' && (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <h3 className="font-medium text-blue-800">
                      📋 Step 1: Basic Information - {supplierType === 'boat_owner' ? 'Boat Owner/Supplier' : 'Agent'}
                    </h3>
                  </div>

                  {/* Agent: Select Boat Owner */}
                  {supplierType === 'agent' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                      <h4 className="font-medium text-yellow-800 mb-2">🔗 Link to Boat Owner</h4>
                      <p className="text-sm text-yellow-600 mb-3">
                        Agents must be linked to an existing registered Boat Owner. 
                        The Boat Owner&apos;s consent is required for this linkage.
                      </p>
                      <select
                        value={selectedBoatOwner}
                        onChange={(e) => setSelectedBoatOwner(e.target.value)}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">Select Boat Owner...</option>
                        {existingBoatOwners.map(owner => (
                          <option key={owner.id} value={owner.id}>
                            {owner.first_name} {owner.last_name} - {owner.boat_registration_number}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="First name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Full address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  {/* Boat Owner specific fields */}
                  {supplierType === 'boat_owner' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Boat Registration Number
                        </label>
                        <input
                          type="text"
                          name="boat_registration_number"
                          value={formData.boat_registration_number}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          placeholder="TN-XXX-1234"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GST Number
                        </label>
                        <input
                          type="text"
                          name="gst_number"
                          value={formData.gst_number}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          placeholder="22XXXXX1234X1Z5"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.first_name && formData.contact_number) {
                          setCurrentStep('aadhar');
                          setError(null);
                        } else {
                          setError('Please fill required fields');
                        }
                      }}
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
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
                        className="w-full px-4 py-3 text-lg tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                        placeholder="1234 5678 9012"
                      />
                    </div>

                    {!aadharVerified && !aadharOtpSent && (
                      <button
                        type="button"
                        onClick={sendAadharOtp}
                        disabled={aadharVerifying || !validateAadharNumber(aadharNumber.replace(/\s/g, ''))}
                        className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                      >
                        {aadharVerifying ? '⏳ Sending OTP...' : '📱 Send OTP'}
                      </button>
                    )}

                    {aadharOtpSent && !aadharVerified && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={aadharOtp}
                          onChange={(e) => setAadharOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                          className="w-full px-4 py-3 text-2xl tracking-[1em] text-center border rounded-lg"
                          placeholder="● ● ● ● ● ●"
                        />
                        <button
                          type="button"
                          onClick={verifyAadharOtp}
                          disabled={aadharVerifying || aadharOtp.length !== 6}
                          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {aadharVerifying ? '⏳ Verifying...' : '✅ Verify OTP'}
                        </button>
                      </div>
                    )}

                    {aadharVerified && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                        <span className="text-4xl">✅</span>
                        <p className="font-medium text-green-800 mt-2">Aadhar Verified!</p>
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
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Next: Bank Details →
                    </button>
                  </div>
                </>
              )}

              {/* STEP 3: Bank Details */}
              {currentStep === 'bank' && (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <h3 className="font-medium text-blue-800">🏦 Step 3: Bank Account Details (Mandatory)</h3>
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
                          placeholder="Bank name"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase"
                          placeholder="SBIN0001234"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UPI ID (Recommended)
                      </label>
                      <input
                        type="text"
                        name="upi_id"
                        value={bankDetails.upi_id}
                        onChange={handleBankDetailsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="username@upi"
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
                        if (bankDetails.bank_name && bankDetails.account_number) {
                          setFormData(prev => ({ ...prev, bank_details: bankDetails }));
                        }
                        setCurrentStep('face');
                      }}
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
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
                              <p className="text-gray-500 mt-2">Camera preview</p>
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
                                {capturingFace ? '📸 Capturing...' : '📸 Capture Face'}
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
                          <p className="font-medium text-green-800 mt-2">Face Registered!</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFaceRegistered(false);
                            setFaceImage(null);
                          }}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Re-capture
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
                      onClick={() => setCurrentStep(supplierType === 'boat_owner' ? 'agents' : 'review')}
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      {supplierType === 'boat_owner' ? 'Next: Agent Declarations →' : 'Next: Review →'}
                    </button>
                  </div>
                </>
              )}

              {/* STEP 5: Agent Declarations (Boat Owners Only) */}
              {currentStep === 'agents' && supplierType === 'boat_owner' && (
                <>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-4">
                    <h3 className="font-medium text-purple-800">👥 Step 5: Agent Declarations (Optional)</h3>
                    <p className="text-sm text-purple-600 mt-1">
                      Declare authorized agents who can act on your behalf
                    </p>
                  </div>

                  {/* Existing Declarations */}
                  {agentDeclarations.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {agentDeclarations.map((agent) => (
                        <div key={agent.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium">{agent.agent_name}</p>
                            <p className="text-sm text-gray-500">{agent.agent_phone} • {agent.relationship}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              agent.consent_given ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {agent.consent_given ? 'Consent Given' : 'Pending Consent'}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAgentDeclaration(agent.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ❌
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Agent Form */}
                  {showAgentForm ? (
                    <div className="p-4 border border-purple-200 rounded-lg space-y-4">
                      <h4 className="font-medium">Add New Agent Declaration</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={newAgent.agent_name}
                          onChange={(e) => setNewAgent(prev => ({ ...prev, agent_name: e.target.value }))}
                          placeholder="Agent Name *"
                          className="px-3 py-2 border rounded-lg"
                        />
                        <input
                          type="tel"
                          value={newAgent.agent_phone}
                          onChange={(e) => setNewAgent(prev => ({ ...prev, agent_phone: e.target.value }))}
                          placeholder="Agent Phone *"
                          className="px-3 py-2 border rounded-lg"
                        />
                      </div>
                      
                      <input
                        type="text"
                        value={newAgent.relationship}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, relationship: e.target.value }))}
                        placeholder="Relationship (e.g., Son, Brother, Agent)"
                        className="w-full px-3 py-2 border rounded-lg"
                      />

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newAgent.consent_given}
                          onChange={(e) => setNewAgent(prev => ({ ...prev, consent_given: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <label className="text-sm">
                          I hereby authorize this person to act as my agent for ClamFlow transactions
                        </label>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={addAgentDeclaration}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Add Agent
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAgentForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAgentForm(true)}
                      className="w-full py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50"
                    >
                      ➕ Add Agent Declaration
                    </button>
                  )}

                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('face')}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep('review')}
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Next: Review →
                    </button>
                  </div>
                </>
              )}

              {/* STEP 6: Review & Submit */}
              {currentStep === 'review' && (
                <>
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg mb-4">
                    <h3 className="font-medium text-teal-800">📝 Review & Submit</h3>
                  </div>

                  {/* Status Summary */}
                  {(() => {
                    const status = getOnboardingStatus();
                    return (
                      <div className={`p-4 rounded-lg mb-6 ${
                        status.status === 'complete' 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-yellow-50 border border-yellow-200'
                      }`}>
                        <span className={`font-medium ${
                          status.status === 'complete' ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                          {status.status === 'complete' ? '✅' : '⚠️'} 
                          Status: {status.status.toUpperCase()}
                        </span>
                        {status.missing.length > 0 && (
                          <p className="text-sm text-yellow-700 mt-1">
                            Missing: {status.missing.join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Review Data */}
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">📋 Basic Info</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><span className="text-gray-500">Type:</span> {supplierType}</p>
                        <p><span className="text-gray-500">Name:</span> {formData.first_name} {formData.last_name}</p>
                        <p><span className="text-gray-500">Phone:</span> {formData.contact_number}</p>
                        {formData.boat_registration_number && (
                          <p><span className="text-gray-500">Boat:</span> {formData.boat_registration_number}</p>
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg ${aadharVerified ? 'bg-green-50' : 'bg-red-50'}`}>
                      <h4 className="font-medium mb-2">{aadharVerified ? '✅' : '❌'} Aadhar</h4>
                      <p className="text-sm">{aadharVerified ? `Verified: ${aadharNumber}` : 'Not verified'}</p>
                    </div>

                    <div className={`p-4 rounded-lg ${formData.bank_details ? 'bg-green-50' : 'bg-red-50'}`}>
                      <h4 className="font-medium mb-2">{formData.bank_details ? '✅' : '❌'} Bank Details</h4>
                      {formData.bank_details ? (
                        <p className="text-sm">
                          {formData.bank_details.bank_name} - ****{formData.bank_details.account_number.slice(-4)}
                        </p>
                      ) : (
                        <p className="text-sm">Not provided</p>
                      )}
                    </div>

                    <div className={`p-4 rounded-lg ${faceRegistered ? 'bg-green-50' : 'bg-red-50'}`}>
                      <h4 className="font-medium mb-2">{faceRegistered ? '✅' : '❌'} Face Registration</h4>
                      <div className="flex items-center">
                        {faceImage && (
                          <img src={faceImage} alt="Face" className="w-12 h-12 rounded-full object-cover mr-2" />
                        )}
                        <p className="text-sm">{faceRegistered ? 'Registered' : 'Not registered'}</p>
                      </div>
                    </div>

                    {agentDeclarations.length > 0 && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium mb-2">👥 Agent Declarations ({agentDeclarations.length})</h4>
                        {agentDeclarations.map(a => (
                          <p key={a.id} className="text-sm">{a.agent_name} - {a.agent_phone}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(supplierType === 'boat_owner' ? 'agents' : 'face')}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                    >
                      {loading ? 'Submitting...' : 'Submit Registration'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        )}

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Pending Registrations</h2>
            </div>
            <div className="text-center py-12 text-gray-500">
              <span className="text-6xl">📋</span>
              <p className="mt-4">No pending registrations</p>
            </div>
          </div>
        )}

        {/* Incomplete Tab */}
        {activeTab === 'incomplete' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Incomplete Registrations</h2>
              <p className="text-gray-500 text-sm">Suppliers pending Aadhar, Bank, or Face verification</p>
            </div>
            <div className="text-center py-12 text-gray-500">
              <span className="text-6xl">✅</span>
              <p className="mt-4">No incomplete records</p>
            </div>
          </div>
        )}

        {/* Approved Tab */}
        {activeTab === 'approved' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Approved Suppliers & Agents</h2>
            </div>
            <div className="text-center py-12 text-gray-500">
              <span className="text-6xl">✅</span>
              <p className="mt-4">Approved suppliers will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierOnboarding;
