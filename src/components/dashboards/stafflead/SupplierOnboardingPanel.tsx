'use client';

// ============================================
// COMPREHENSIVE SUPPLIER ONBOARDING PANEL
// Features: Aadhar OTP, Bank Details, Face Registration, Agent Linking
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../../types/auth';
import clamflowAPI from '../../../lib/clamflow-api';
import { offlineSyncService } from '../../../lib/offline-sync';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app';

// ============================================
// INTERFACES
// ============================================

interface SupplierOnboardingPanelProps {
  currentUser: User | null;
}

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
}

interface SupplierOnboardingData {
  id?: string;
  type: 'boat_owner' | 'agent';
  first_name: string;
  last_name: string;
  address: string;
  contact_number: string;
  email?: string;
  boat_registration_number?: string;
  gst_number?: string;
  linked_boat_owner_id?: string;
  linked_boat_owner_name?: string;
  aadhar_details?: AadharDetails;
  bank_details?: BankDetails;
  face_registration?: FaceRegistrationData;
  agent_declarations?: AgentDeclaration[];
  onboarding_status: 'incomplete' | 'pending_verification' | 'complete';
  missing_fields?: string[];
  status: 'pending' | 'approved' | 'rejected';
  submitted_by?: string;
  created_at?: string;
}

interface ExistingSupplier {
  id: string;
  name: string;
  contact_info?: { phone?: string; email?: string; address?: string };
  boat_details?: { boat_name?: string; registration_number?: string };
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  onboarding_complete?: boolean;
  aadhar_verified?: boolean;
  bank_details_present?: boolean;
  face_registered?: boolean;
}

// ============================================
// SUPPLIER ONBOARDING PANEL COMPONENT
// ============================================

const SupplierOnboardingPanel: React.FC<SupplierOnboardingPanelProps> = ({ currentUser }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // View state
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
  
  // Existing data for lists and agent linking
  const [existingBoatOwners, setExistingBoatOwners] = useState<ExistingSupplier[]>([]);
  const [selectedBoatOwner, setSelectedBoatOwner] = useState<string>('');
  const [suppliers, setSuppliers] = useState<ExistingSupplier[]>([]);
  const [incompleteRecords, setIncompleteRecords] = useState<ExistingSupplier[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setDataLoading(true);
      
      const response = await clamflowAPI.getSuppliers();
      
      if (response.success && response.data) {
        const supplierList = Array.isArray(response.data) ? response.data : [];
        const mapped = supplierList.map((s: any) => ({
          id: s.id || s.supplier_id || String(Math.random()),
          name: s.name || s.supplier_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown',
          contact_info: s.contact_info || { phone: s.contact_number, email: s.email, address: s.address },
          boat_details: s.boat_details || { registration_number: s.boat_registration_number },
          status: s.status || 'approved',
          created_at: s.created_at || new Date().toISOString(),
          onboarding_complete: s.onboarding_status === 'complete',
          aadhar_verified: s.aadhar_details?.verified || false,
          bank_details_present: !!s.bank_details,
          face_registered: s.face_registration?.registered || false,
        }));
        
        setSuppliers(mapped);
        setExistingBoatOwners(mapped.filter((s: ExistingSupplier) => s.status === 'approved'));
        setIncompleteRecords(mapped.filter((s: ExistingSupplier) => !s.onboarding_complete));
      } else {
        setSuppliers([]);
        setExistingBoatOwners([]);
      }
    } catch (err) {
      console.error('Supplier fetch error:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // ============================================
  // FORM HANDLERS
  // ============================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleTypeChange = (type: 'boat_owner' | 'agent') => {
    setSupplierType(type);
    setFormData(prev => ({
      ...prev,
      type,
      boat_registration_number: type === 'agent' ? undefined : prev.boat_registration_number,
    }));
    setCurrentStep('basic');
  };

  // ============================================
  // AADHAR VERIFICATION
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
      if (!navigator.onLine) {
        setError('Cannot connect to server. Please check your internet connection to initiate Aadhar verification.');
      } else {
        console.error('Aadhar OTP API Error:', err);
        setError(err.message || 'Aadhar verification service temporarily unavailable.');
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
        body: JSON.stringify({ aadhar_number: cleaned, otp: aadharOtp })
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
      if (!navigator.onLine) {
        setError('Cannot connect to server. Please check your internet connection to verify OTP.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setAadharVerifying(false);
    }
  };

  // ============================================
  // BANK DETAILS
  // ============================================

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({ ...prev, [name]: value }));
  };

  // ============================================
  // FACE REGISTRATION
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
      
      // Try to register with backend
      const token = localStorage.getItem('clamflow_token');
      try {
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
      } catch (apiErr: any) {
        // OFFLINE-FIRST: Queue for sync when online
        if (!navigator.onLine || apiErr.message?.includes('Failed to fetch')) {
          if (offlineSyncService) {
            offlineSyncService.queueOperation(
              'face_registration',
              `${API_BASE_URL}/biometric/register-face`,
              'POST',
              {
                face_data: imageData,
                person_name: `${formData.first_name} ${formData.last_name}`,
                person_type: supplierType,
                timestamp: new Date().toISOString()
              },
              currentUser?.id
            );
          }
          
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
          throw apiErr;
        }
      }
    } catch (err: any) {
      console.error('Face Registration Error:', err);
      setError(err.message || 'Face registration failed. Please try again.');
    } finally {
      setCapturingFace(false);
    }
  };

  // ============================================
  // AGENT DECLARATIONS (For Boat Owners)
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
    };
    
    setAgentDeclarations(prev => [...prev, declaration]);
    setFormData(prev => ({
      ...prev,
      agent_declarations: [...(prev.agent_declarations || []), declaration]
    }));
    
    setNewAgent({ agent_name: '', agent_phone: '', relationship: '', authorized_activities: [], consent_given: false });
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
        submitted_by: currentUser?.id,
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
        if (!result.success && response.status !== 201) {
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
              currentUser?.id
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
      resetForm();
      fetchSuppliers();
      
    } catch (err: any) {
      setError(err.message || 'Failed to submit onboarding');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
    setAadharOtp('');
    setBankDetails({ bank_name: '', account_number: '', ifsc_code: '', account_holder_name: '', upi_id: '' });
    setFaceImage(null);
    setFaceRegistered(false);
    setAgentDeclarations([]);
    setCurrentStep('basic');
    setSelectedBoatOwner('');
  };

  // ============================================
  // STATUS BADGE HELPER
  // ============================================

  const getStatusBadge = (status: string, isComplete?: boolean) => {
    if (status === 'approved' && isComplete === false) {
      return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Incomplete</span>;
    }
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP COMPONENTS
  // ============================================

  const getSteps = () => supplierType === 'boat_owner' 
    ? ['basic', 'aadhar', 'bank', 'face', 'agents', 'review']
    : ['basic', 'aadhar', 'bank', 'face', 'review'];

  const stepIndex = getSteps().indexOf(currentStep);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🚚 Supplier Onboarding</h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete onboarding with Aadhar, Bank Details &amp; Face Registration
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto">
          {[
            { id: 'new', label: '➕ New Registration' },
            { id: 'pending', label: `⏳ Pending (${suppliers.filter(s => s.status === 'pending').length})` },
            { id: 'incomplete', label: `⚠️ Incomplete (${incompleteRecords.length})` },
            { id: 'approved', label: `✅ Approved (${suppliers.filter(s => s.status === 'approved').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex justify-between items-center">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">×</button>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex justify-between items-center">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">×</button>
        </div>
      )}

      {/* NEW REGISTRATION TAB */}
      {activeTab === 'new' && (
        <div className="bg-white rounded-lg shadow p-6">
          {/* Type Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Registration Type</h3>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleTypeChange('boat_owner')}
                className={`flex-1 p-4 rounded-lg border-2 text-center transition-colors ${
                  supplierType === 'boat_owner'
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <span className="text-3xl">🚤</span>
                <p className="font-medium mt-2">Boat Owner / Supplier</p>
                <p className="text-sm text-gray-500">Primary supplier registration</p>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('agent')}
                className={`flex-1 p-4 rounded-lg border-2 text-center transition-colors ${
                  supplierType === 'agent'
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
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
              {getSteps().map((step, index) => (
                <div key={step} className="flex items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      currentStep === step 
                        ? 'bg-orange-600 text-white' 
                        : stepIndex > index
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepIndex > index ? '✓' : index + 1}
                  </div>
                  {index < getSteps().length - 1 && (
                    <div className={`w-8 sm:w-12 h-1 mx-1 ${stepIndex > index ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Basic</span>
              <span>Aadhar</span>
              <span>Bank</span>
              <span>Face</span>
              {supplierType === 'boat_owner' && <span>Agents</span>}
              <span>Review</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* STEP 1: Basic Information */}
            {currentStep === 'basic' && (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800">
                    📋 Step 1: Basic Information - {supplierType === 'boat_owner' ? 'Boat Owner/Supplier' : 'Agent'}
                  </h3>
                </div>

                {/* Agent: Select Boat Owner */}
                {supplierType === 'agent' && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">🔗 Link to Boat Owner</h4>
                    <select
                      value={selectedBoatOwner}
                      onChange={(e) => setSelectedBoatOwner(e.target.value)}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="">Select Boat Owner...</option>
                      {existingBoatOwners.map(owner => (
                        <option key={owner.id} value={owner.id}>
                          {owner.name} - {owner.boat_details?.registration_number || 'No Reg'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Full address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                    <input
                      type="tel"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {supplierType === 'boat_owner' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Boat Registration Number</label>
                      <input
                        type="text"
                        name="boat_registration_number"
                        value={formData.boat_registration_number}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="TN-XXX-1234"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                      <input
                        type="text"
                        name="gst_number"
                        value={formData.gst_number}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Next: Aadhar Verification →
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: Aadhar Verification */}
            {currentStep === 'aadhar' && (
              <>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-medium text-orange-800">🆔 Step 2: Aadhar Verification (Mandatory)</h3>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number *</label>
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
                      <button type="button" onClick={sendAadharOtp} className="w-full text-sm text-orange-600 hover:underline">
                        Resend OTP
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
                  <button type="button" onClick={() => setCurrentStep('basic')} className="px-6 py-2 border border-gray-300 rounded-lg">← Back</button>
                  <button type="button" onClick={() => setCurrentStep('bank')} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    {aadharVerified ? 'Next: Bank Details →' : 'Skip for Now →'}
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: Bank Details */}
            {currentStep === 'bank' && (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800">🏦 Step 3: Bank Account Details (Mandatory)</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                      <input type="text" name="bank_name" value={bankDetails.bank_name} onChange={handleBankDetailsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Bank name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name *</label>
                      <input type="text" name="account_holder_name" value={bankDetails.account_holder_name} onChange={handleBankDetailsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="As per bank records" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                      <input type="text" name="account_number" value={bankDetails.account_number} onChange={handleBankDetailsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code *</label>
                      <input type="text" name="ifsc_code" value={bankDetails.ifsc_code}
                        onChange={(e) => handleBankDetailsChange({ ...e, target: { ...e.target, value: e.target.value.toUpperCase() } } as React.ChangeEvent<HTMLInputElement>)}
                        maxLength={11} className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase" placeholder="SBIN0001234" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (Recommended)</label>
                    <input type="text" name="upi_id" value={bankDetails.upi_id} onChange={handleBankDetailsChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="username@upi" />
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button type="button" onClick={() => setCurrentStep('aadhar')} className="px-6 py-2 border border-gray-300 rounded-lg">← Back</button>
                  <button type="button" onClick={() => {
                    if (bankDetails.bank_name && bankDetails.account_number) {
                      setFormData(prev => ({ ...prev, bank_details: bankDetails }));
                    }
                    setCurrentStep('face');
                  }} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    Next: Face Registration →
                  </button>
                </div>
              </>
            )}

            {/* STEP 4: Face Registration */}
            {currentStep === 'face' && (
              <>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800">👤 Step 4: Face Registration (Mandatory)</h3>
                </div>

                <div className="max-w-lg mx-auto">
                  {!faceRegistered ? (
                    <div className="space-y-4">
                      <div className="bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                        {isCameraActive ? (
                          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
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
                          <button type="button" onClick={startCamera} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">📹 Start Camera</button>
                        ) : (
                          <>
                            <button type="button" onClick={captureFace} disabled={capturingFace} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                              {capturingFace ? '📸 Capturing...' : '📸 Capture Face'}
                            </button>
                            <button type="button" onClick={stopCamera} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">⏹️ Stop</button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      {faceImage && <img src={faceImage} alt="Registered face" className="w-48 h-48 mx-auto rounded-full object-cover border-4 border-green-500" />}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <span className="text-4xl">✅</span>
                        <p className="font-medium text-green-800 mt-2">Face Registered!</p>
                      </div>
                      <button type="button" onClick={() => { setFaceRegistered(false); setFaceImage(null); }} className="text-sm text-blue-600 hover:underline">Re-capture</button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6">
                  <button type="button" onClick={() => setCurrentStep('bank')} className="px-6 py-2 border border-gray-300 rounded-lg">← Back</button>
                  <button type="button" onClick={() => setCurrentStep(supplierType === 'boat_owner' ? 'agents' : 'review')} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    {supplierType === 'boat_owner' ? 'Next: Agent Declarations →' : 'Next: Review →'}
                  </button>
                </div>
              </>
            )}

            {/* STEP 5: Agent Declarations (Boat Owners Only) */}
            {currentStep === 'agents' && supplierType === 'boat_owner' && (
              <>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-medium text-purple-800">👥 Step 5: Agent Declarations (Optional)</h3>
                  <p className="text-sm text-purple-600 mt-1">Declare authorized agents who can act on your behalf</p>
                </div>

                {agentDeclarations.length > 0 && (
                  <div className="space-y-2">
                    {agentDeclarations.map((agent) => (
                      <div key={agent.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium">{agent.agent_name}</p>
                          <p className="text-sm text-gray-500">{agent.agent_phone} • {agent.relationship}</p>
                        </div>
                        <button type="button" onClick={() => removeAgentDeclaration(agent.id)} className="text-red-600 hover:text-red-800">❌</button>
                      </div>
                    ))}
                  </div>
                )}

                {showAgentForm ? (
                  <div className="p-4 border border-purple-200 rounded-lg space-y-4">
                    <h4 className="font-medium">Add New Agent Declaration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" value={newAgent.agent_name} onChange={(e) => setNewAgent(prev => ({ ...prev, agent_name: e.target.value }))} placeholder="Agent Name *" className="px-3 py-2 border rounded-lg" />
                      <input type="tel" value={newAgent.agent_phone} onChange={(e) => setNewAgent(prev => ({ ...prev, agent_phone: e.target.value }))} placeholder="Agent Phone *" className="px-3 py-2 border rounded-lg" />
                    </div>
                    <input type="text" value={newAgent.relationship} onChange={(e) => setNewAgent(prev => ({ ...prev, relationship: e.target.value }))} placeholder="Relationship (e.g., Son, Brother, Agent)" className="w-full px-3 py-2 border rounded-lg" />
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" checked={newAgent.consent_given} onChange={(e) => setNewAgent(prev => ({ ...prev, consent_given: e.target.checked }))} className="w-4 h-4" />
                      <label className="text-sm">I authorize this person to act as my agent</label>
                    </div>
                    <div className="flex space-x-2">
                      <button type="button" onClick={addAgentDeclaration} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Add Agent</button>
                      <button type="button" onClick={() => setShowAgentForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAgentForm(true)} className="w-full py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50">
                    ➕ Add Agent Declaration
                  </button>
                )}

                <div className="flex justify-between mt-6">
                  <button type="button" onClick={() => setCurrentStep('face')} className="px-6 py-2 border border-gray-300 rounded-lg">← Back</button>
                  <button type="button" onClick={() => setCurrentStep('review')} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Next: Review →</button>
                </div>
              </>
            )}

            {/* STEP 6: Review & Submit */}
            {currentStep === 'review' && (
              <>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-medium text-orange-800">📝 Review &amp; Submit</h3>
                </div>

                {/* Status Summary */}
                {(() => {
                  const status = getOnboardingStatus();
                  return (
                    <div className={`p-4 rounded-lg ${status.status === 'complete' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                      <span className={`font-medium ${status.status === 'complete' ? 'text-green-800' : 'text-yellow-800'}`}>
                        {status.status === 'complete' ? '✅' : '⚠️'} Status: {status.status.toUpperCase()}
                      </span>
                      {status.missing.length > 0 && <p className="text-sm text-yellow-700 mt-1">Missing: {status.missing.join(', ')}</p>}
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
                      {formData.boat_registration_number && <p><span className="text-gray-500">Boat:</span> {formData.boat_registration_number}</p>}
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${aadharVerified ? 'bg-green-50' : 'bg-red-50'}`}>
                    <h4 className="font-medium mb-2">{aadharVerified ? '✅' : '❌'} Aadhar</h4>
                    <p className="text-sm">{aadharVerified ? `Verified: ${aadharNumber}` : 'Not verified'}</p>
                  </div>

                  <div className={`p-4 rounded-lg ${formData.bank_details ? 'bg-green-50' : 'bg-red-50'}`}>
                    <h4 className="font-medium mb-2">{formData.bank_details ? '✅' : '❌'} Bank Details</h4>
                    {formData.bank_details ? (
                      <p className="text-sm">{formData.bank_details.bank_name} - ****{formData.bank_details.account_number.slice(-4)}</p>
                    ) : <p className="text-sm">Not provided</p>}
                  </div>

                  <div className={`p-4 rounded-lg ${faceRegistered ? 'bg-green-50' : 'bg-red-50'}`}>
                    <h4 className="font-medium mb-2">{faceRegistered ? '✅' : '❌'} Face Registration</h4>
                    <div className="flex items-center">
                      {faceImage && <img src={faceImage} alt="Face" className="w-12 h-12 rounded-full object-cover mr-2" />}
                      <p className="text-sm">{faceRegistered ? 'Registered' : 'Not registered'}</p>
                    </div>
                  </div>

                  {agentDeclarations.length > 0 && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium mb-2">👥 Agent Declarations ({agentDeclarations.length})</h4>
                      {agentDeclarations.map(a => <p key={a.id} className="text-sm">{a.agent_name} - {a.agent_phone}</p>)}
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6">
                  <button type="button" onClick={() => setCurrentStep(supplierType === 'boat_owner' ? 'agents' : 'face')} className="px-6 py-2 border border-gray-300 rounded-lg">← Back</button>
                  <button type="submit" disabled={loading} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
                    {loading ? 'Submitting...' : 'Submit Registration'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* PENDING TAB */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Pending Registrations</h3></div>
          {suppliers.filter(s => s.status === 'pending').length === 0 ? (
            <div className="p-8 text-center text-gray-500"><span className="text-4xl">📋</span><p className="mt-2">No pending registrations</p></div>
          ) : (
            <div className="divide-y">
              {suppliers.filter(s => s.status === 'pending').map(s => (
                <div key={s.id} className="p-4 flex justify-between items-center">
                  <div><p className="font-medium">{s.name}</p><p className="text-sm text-gray-500">{s.contact_info?.phone}</p></div>
                  {getStatusBadge(s.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INCOMPLETE TAB */}
      {activeTab === 'incomplete' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Incomplete Registrations</h3>
            <p className="text-sm text-gray-500">Suppliers pending Aadhar, Bank, or Face verification</p>
          </div>
          {incompleteRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500"><span className="text-4xl">✅</span><p className="mt-2">No incomplete records</p></div>
          ) : (
            <div className="divide-y">
              {incompleteRecords.map(s => (
                <div key={s.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {!s.aadhar_verified && <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Missing Aadhar</span>}
                      {!s.bank_details_present && <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Missing Bank</span>}
                      {!s.face_registered && <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Missing Face</span>}
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">Complete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* APPROVED TAB */}
      {activeTab === 'approved' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Approved Suppliers</h3></div>
          <div className="overflow-x-auto">
            {suppliers.filter(s => s.status === 'approved').length === 0 ? (
              <div className="p-8 text-center text-gray-500"><span className="text-4xl">🚚</span><p className="mt-2">No approved suppliers</p></div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suppliers.filter(s => s.status === 'approved').map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{s.name}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{s.contact_info?.phone || '-'}</div>
                        <div className="text-xs text-gray-500">{s.contact_info?.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{s.boat_details?.registration_number || '-'}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(s.status, s.onboarding_complete)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${s.aadhar_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>🆔</span>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${s.bank_details_present ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>🏦</span>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${s.face_registered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>👤</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierOnboardingPanel;
