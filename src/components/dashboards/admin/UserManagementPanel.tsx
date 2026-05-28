'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Search, Plus, Edit2, Trash2, UserPlus, AlertTriangle, Camera, CreditCard, CheckCircle, XCircle, Fingerprint } from 'lucide-react';
import { sendWelcomeMessage } from '@/services/whatsapp-service';
import { useAuth } from '@/context/AuthContext';
import clamflowAPI, { AadhaarParsedResult } from '@/lib/clamflow-api';

// Use environment variable for API URL - standardized to NEXT_PUBLIC_API_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app';

// Custom Select component
const FormSelect: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ value, onValueChange, children, className = "" }) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </select>
  );
};

const FormSelectItem: React.FC<{
  value: string;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <option value={value}>{children}</option>;
};

// Production: No mock data - all users come from API

interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
  station?: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  // Onboarding status fields
  aadhar_verified?: boolean;
  face_registered?: boolean;
  bank_details_added?: boolean;
  onboarding_complete?: boolean;
}

interface UserManagementPanelProps {
  currentUser?: {
    id: string;
    username: string;
    role: string;
  } | null;
}

export default function UserManagementPanel({ currentUser }: UserManagementPanelProps) {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    role: 'Production Staff',
    station: '',
    password: '',
    phone_number: ''
  });
  const [formError, setFormError] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState<string>('');

  // Onboarding state
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingUser, setOnboardingUser] = useState<User | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<'aadhar' | 'face'>('aadhar');
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharOtp, setAadharOtp] = useState('');
  const [aadharOtpSent, setAadharOtpSent] = useState(false);
  const [aadharVerifying, setAadharVerifying] = useState(false);
  const [aadharVerified, setAadharVerified] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [capturingFace, setCapturingFace] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [onboardingSuccess, setOnboardingSuccess] = useState<string | null>(null);

  // Aadhaar scan state (mobile handoff + image upload)
  type AadhaarScanMode = 'manual' | 'mobile' | 'upload';
  const [aadhaarScanMode, setAadhaarScanMode] = useState<AadhaarScanMode>('manual');
  const [aadhaarParsed, setAadhaarParsed] = useState<AadhaarParsedResult | null>(null);
  const [aadhaarQrText, setAadhaarQrText] = useState('');
  const [aadhaarScanError, setAadhaarScanError] = useState('');
  const [mobileQRImage, setMobileQRImage] = useState('');
  const [mobileScanToken, setMobileScanToken] = useState('');
  const [mobileScanStatus, setMobileScanStatus] = useState<'idle' | 'waiting' | 'done'>('idle');
  const [aadhaarUploadLoading, setAadhaarUploadLoading] = useState(false);
  const mobilePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const roles = [
    'IT Staff',
    'Production Lead',
    'QC Lead',
    'Staff Lead',
    'QC Staff',
    'Production Staff',
    'Maintenance Staff',
    'Security Guard',
    'Gate Staff',
  ];

  const USERNAME_PREFIXES: { [key: string]: string } = {
    'IT Staff':         'IT',
    'Production Lead':  'PL',
    'QC Lead':          'QL',
    'Staff Lead':       'SL',
    'QC Staff':         'QA',
    'Production Staff': 'PS',
    'Maintenance Staff':'MT',
    'Security Guard':   'SG',
    'Gate Staff':       'GS',
  };

  const getRolePrefix = (role: string): string => {
    return USERNAME_PREFIXES[role] || 'PS';
  };

  const generateUsername = (role: string, fullName: string): string => {
    const prefix = USERNAME_PREFIXES[role] || 'PS';
    const firstName = fullName.split(' ')[0] || 'User';
    return `${prefix}_${firstName}`;
  };

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users from API
      const response = await fetch(`${API_BASE_URL}/api/users/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Users API Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Users API Raw Response:', data);
        
        // Handle various response formats from backend
        let usersArray: User[] = [];
        
        if (Array.isArray(data)) {
          // Direct array response
          usersArray = data;
        } else if (data && typeof data === 'object') {
          // Check for common wrapper keys
          if (Array.isArray(data.items)) {
            usersArray = data.items;
          } else if (Array.isArray(data.data)) {
            usersArray = data.data;
          } else if (Array.isArray(data.users)) {
            usersArray = data.users;
          }
        }
        
        console.log('👥 Parsed users count:', usersArray.length);
        setUsers(usersArray);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch users:', response.status, errorText);
        setError(`Failed to load users from server (${response.status})`);
        setUsers([]);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Unable to connect to user service');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const createUser = async (userData: any) => {
    try {
      // Use the auto-assigned prefix and generate username
      const username = generateUsername(userData.role, userData.full_name);

      // Generate secure random password
      const generatedPassword = userData.password || `Clam${Math.random().toString(36).slice(2, 10)}!`;

      const response = await fetch(`${API_BASE_URL}/api/users/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...userData,
          username,
          password: generatedPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.detail || errorData?.message || `Server error (${response.status})`;
        setFormError(`Failed to create user: ${errorMsg}`);
        return false;
      }

      const createdUser = await response.json();
      setUsers(prev => [...prev, createdUser]);
      
      // 🔔 Send WhatsApp welcome message (best-effort, non-blocking)
      if (userData.phone_number) {
        try {
          setWhatsappStatus('Sending WhatsApp welcome message...');
          const whatsappResult = await sendWelcomeMessage({
            username,
            password: generatedPassword,
            full_name: userData.full_name,
            role: userData.role,
            phone_number: userData.phone_number
          });
          
          if (whatsappResult.success) {
            setWhatsappStatus('✅ WhatsApp welcome message sent successfully!');
          } else if (whatsappResult.error === 'WhatsApp service is disabled' || whatsappResult.error === 'Twilio credentials not configured') {
            setWhatsappStatus('✅ User created successfully. WhatsApp notifications are not configured — please share credentials manually.');
          } else {
            setWhatsappStatus(`⚠️ User created but WhatsApp delivery failed. Please share credentials manually.`);
            console.warn('WhatsApp delivery failed:', whatsappResult.error);
          }
        } catch (whatsappErr) {
          console.warn('WhatsApp service unavailable:', whatsappErr);
          setWhatsappStatus('✅ User created successfully. WhatsApp notifications are not available — please share credentials manually.');
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error creating user:', err);
      setFormError('Failed to create user. Check network connection.');
      return false;
    }
  };

  const updateUser = async (userId: string, userData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.detail || errorData?.message || `Server error (${response.status})`;
        setFormError(`Failed to update user: ${errorMsg}`);
        return false;
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      setFormError('Failed to update user. Check network connection.');
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.detail || errorData?.message || `Server error (${response.status})`;
        setFormError(`Failed to delete user: ${errorMsg}`);
        return false;
      }

      setUsers(prev => prev.filter(u => u.id !== userId));
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      setFormError('Failed to delete user. Check network connection.');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.full_name) {
      setFormError('Full name is required');
      return;
    }

    let success = false;
    if (editingUser) {
      // Update existing user
      const updateData: any = {
        full_name: formData.full_name,
        role: formData.role,
        station: formData.station
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      success = await updateUser(editingUser.id, updateData);
    } else {
      // Create new user
      success = await createUser(formData);
    }

    if (success) {
      setShowCreateForm(false);
      setEditingUser(null);
      setFormData({
        username: '',
        full_name: '',
        role: 'Production Staff',
        station: '',
        password: '',
        phone_number: ''
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      station: user.station || '',
      password: '', // Don't populate password for security
      phone_number: ''
    });
    setShowCreateForm(true);
    setFormError('');
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return;
    }

    const success = await deleteUser(userId);
    if (!success) {
      alert('Failed to delete user');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setShowCreateForm(false);
    setFormData({
      username: '',
      full_name: '',
      role: 'Production Staff',
      station: '',
      password: '',
      phone_number: ''
    });
    setFormError('');
  };

  // ============================================
  // ONBOARDING FUNCTIONS
  // ============================================

  const stopMobilePoll = useCallback(() => {
    if (mobilePollRef.current) {
      clearInterval(mobilePollRef.current);
      mobilePollRef.current = null;
    }
  }, []);

  const applyAadhaarParsed = useCallback((parsed: AadhaarParsedResult, qrText: string) => {
    setAadhaarParsed(parsed);
    setAadhaarQrText(qrText);
    // Auto-fill the 12-digit UID into the aadhar number field
    if (parsed.uid) {
      const uid = parsed.uid.replace(/\s/g, '');
      const formatted = uid.match(/.{1,4}/g)?.join(' ') ?? uid;
      setAadharNumber(formatted);
    }
  }, []);

  const handleMobileScanStart = useCallback(async () => {
    setAadhaarScanMode('mobile');
    setAadhaarScanError('');
    setMobileScanStatus('idle');
    setMobileQRImage('');
    setMobileScanToken('');

    const res = await clamflowAPI.createMobileScan();
    if (!res.success || !res.data) {
      setAadhaarScanError(res.error || 'Failed to create mobile scan session');
      setAadhaarScanMode('manual');
      return;
    }

    const { qr_image_base64, session_token, token } = res.data;
    const scanToken = token || session_token;
    if (!scanToken) {
      setAadhaarScanError('No scan token returned from server');
      setAadhaarScanMode('manual');
      return;
    }
    setMobileQRImage(qr_image_base64);
    setMobileScanToken(scanToken);
    setMobileScanStatus('waiting');

    mobilePollRef.current = setInterval(async () => {
      const pollRes = await clamflowAPI.getMobileScanResult(scanToken);
      if (!pollRes.success) return;
      if (pollRes.data?.status === 'completed' && pollRes.data.parsed_result) {
        stopMobilePoll();
        setMobileScanStatus('done');
        applyAadhaarParsed(pollRes.data.parsed_result, pollRes.data.parsed_result.raw_text ?? '');
      }
    }, 2000);
  }, [applyAadhaarParsed, stopMobilePoll]);

  const handleAadhaarImageUpload = useCallback(async (file: File) => {
    setAadhaarScanError('');
    setAadhaarUploadLoading(true);
    const res = await clamflowAPI.scanAadhaarImage(file);
    setAadhaarUploadLoading(false);
    if (!res.success || !res.data?.parsed_result) {
      setAadhaarScanError(res.error || res.data?.message || 'Could not extract QR from image. Try a clearer photo.');
      return;
    }
    applyAadhaarParsed(res.data.parsed_result, res.data.parsed_result.raw_text ?? '');
  }, [applyAadhaarParsed]);

  const handleStartOnboarding = (user: User) => {
    setOnboardingUser(user);
    setShowOnboardingModal(true);
    setOnboardingStep(user.aadhar_verified ? 'face' : 'aadhar');
    setAadharNumber('');
    setAadharOtp('');
    setAadharOtpSent(false);
    setAadharVerified(user.aadhar_verified || false);
    setFaceImage(null);
    setFaceRegistered(user.face_registered || false);
    setOnboardingError(null);
    setOnboardingSuccess(null);
    setAadhaarScanMode('manual');
    setAadhaarParsed(null);
    setAadhaarQrText('');
    setAadhaarScanError('');
    setMobileQRImage('');
    setMobileScanToken('');
    setMobileScanStatus('idle');
    stopMobilePoll();
  };

  const handleCloseOnboarding = () => {
    stopCamera();
    stopMobilePoll();
    setShowOnboardingModal(false);
    setOnboardingUser(null);
    setOnboardingStep('aadhar');
    setAadharNumber('');
    setAadharOtp('');
    setAadharOtpSent(false);
    setAadharVerified(false);
    setFaceImage(null);
    setFaceRegistered(false);
    setOnboardingError(null);
    setOnboardingSuccess(null);
    setAadhaarScanMode('manual');
    setAadhaarParsed(null);
    setAadhaarQrText('');
    setAadhaarScanError('');
    setMobileQRImage('');
    setMobileScanToken('');
    setMobileScanStatus('idle');
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

  // Admin manually confirms the Aadhar number after physically checking the document.
  // Backend does not expose an Aadhar OTP endpoint; verification is admin-attested.
  const confirmAadhar = () => {
    const cleaned = aadharNumber.replace(/\s/g, '');
    if (cleaned.length !== 12) {
      setOnboardingError('Please enter a valid 12-digit Aadhar number');
      return;
    }
    setOnboardingError(null);
    setAadharVerified(true);
    setOnboardingSuccess('Aadhar number confirmed.');
    if (onboardingUser) {
      setUsers(prev => prev.map(u =>
        u.id === onboardingUser.id ? { ...u, aadhar_verified: true } : u
      ));
    }
    setTimeout(() => {
      setOnboardingStep('face');
      setOnboardingSuccess(null);
    }, 1200);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        setOnboardingError(null);
      }
    } catch (err) {
      setOnboardingError('Camera access denied. Please allow camera permissions.');
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
    if (!videoRef.current || !canvasRef.current || !onboardingUser) return;
    
    setCapturingFace(true);
    setOnboardingError(null);
    
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
      const response = await fetch(`${API_BASE_URL}/biometric/register-face`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          face_data: imageData,
          person_name: onboardingUser.full_name,
          person_type: 'staff',
          user_id: onboardingUser.id,
          username: onboardingUser.username,
          timestamp: new Date().toISOString()
        })
      });
      
      const result = await response.json();
      
      if (result.success || result.face_id) {
        setFaceRegistered(true);
        setOnboardingSuccess('Face registered successfully! Onboarding complete.');
        // Update user in list
        setUsers(prev => prev.map(u => 
          u.id === onboardingUser.id ? { ...u, face_registered: true, onboarding_complete: true } : u
        ));
        stopCamera();
      } else {
        throw new Error(result.message || 'Face registration failed');
      }
    } catch (err: unknown) {
      console.error('Face Registration Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Face registration failed. Please try again.';
      setOnboardingError(errorMessage);
    } finally {
      setCapturingFace(false);
    }
  };

  const getOnboardingStatus = (user: User): { complete: boolean; missing: string[] } => {
    const missing: string[] = [];
    if (!user.aadhar_verified) missing.push('Aadhar');
    if (!user.face_registered) missing.push('Face');
    return { complete: missing.length === 0, missing };
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'All Roles' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Super Admin': return 'destructive';
      case 'Admin': return 'default';
      case 'IT Staff': return 'secondary';
      case 'QC Lead': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Backend API unavailable. Using offline mode. {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add New User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <FormSelect
          value={selectedRole}
          onValueChange={setSelectedRole}
          className="w-48"
        >
          <FormSelectItem value="All Roles">All Roles</FormSelectItem>
          {roles.map(role => (
            <FormSelectItem key={role} value={role}>{role}</FormSelectItem>
          ))}
        </FormSelect>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedRole !== 'All Roles' ? 'No users match your filters' : 'No users found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">USER</th>
                    <th className="text-left py-2">ROLE</th>
                    <th className="text-left py-2">LOCATION</th>
                    <th className="text-left py-2">ONBOARDING</th>
                    <th className="text-left py-2">STATUS</th>
                    <th className="text-left py-2">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const onboardingStatus = getOnboardingStatus(user);
                    return (
                    <tr key={user.id} className="border-b">
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.username}</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3">{user.station || 'Unassigned'}</td>
                      <td className="py-3">
                        {onboardingStatus.complete ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Missing: {onboardingStatus.missing.join(', ')}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartOnboarding(user)}
                              className="hover:bg-blue-50 hover:border-blue-500 text-blue-600"
                              title="Complete Onboarding"
                            >
                              <Fingerprint className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                            className="hover:bg-blue-50 hover:border-blue-500"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={user.username === currentUser?.username}
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            className="hover:bg-red-50 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-white shadow-xl max-h-[90vh] flex flex-col">
            <CardHeader className="bg-white border-b shrink-0">
              <CardTitle>{editingUser ? 'Edit User' : 'Create New User'}</CardTitle>
            </CardHeader>
            <CardContent className="bg-white pt-4 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <Alert>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <FormSelect
                    value={formData.role}
                    onValueChange={(value) => {
                      const newUsername = formData.full_name ? generateUsername(value, formData.full_name) : '';
                      setFormData(prev => ({ ...prev, role: value, username: newUsername }));
                    }}
                  >
                    {roles.map(role => (
                      <FormSelectItem key={role} value={role}>{role}</FormSelectItem>
                    ))}
                  </FormSelect>
                  {editingUser && <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>}
                </div>

                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => {
                      const newFullName = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        full_name: newFullName,
                        username: editingUser ? prev.username : generateUsername(formData.role, newFullName)
                      }));
                    }}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {editingUser && (
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                  </div>
                )}

                {!editingUser && (
                  <div>
                    <Label htmlFor="generated_username">Generated Username *</Label>
                    <Input
                      id="generated_username"
                      value={formData.username}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-generated: {USERNAME_PREFIXES[formData.role]}_FirstName</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="station">Location (Optional)</Label>
                  <select
                    id="station"
                    value={formData.station}
                    onChange={(e) => setFormData(prev => ({ ...prev, station: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select location (optional)</option>
                    <option value="System">System</option>
                    <option value="Main Office">Main Office</option>
                    <option value="ClamFlow Unit">ClamFlow Unit</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="password">Password {editingUser && '(optional)'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    required={!editingUser}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingUser ? 'Leave blank to keep current password' : 'Leave blank to auto-generate'}
                  </p>
                </div>

                {/* Onboarding Status Section - Only for Edit Mode */}
                {editingUser && (
                  <div className="pt-4 border-t">
                    <Label className="text-base font-semibold">Onboarding Status</Label>
                    {(() => {
                      const status = getOnboardingStatus(editingUser);
                      return (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-gray-600" />
                              <span>Aadhar Verification</span>
                            </div>
                            {editingUser.aadhar_verified ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" /> Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                <XCircle className="w-3 h-3 mr-1" /> Pending
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Camera className="w-4 h-4 text-gray-600" />
                              <span>Face Recognition</span>
                            </div>
                            {editingUser.face_registered ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" /> Registered
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                <XCircle className="w-3 h-3 mr-1" /> Pending
                              </Badge>
                            )}
                          </div>
                          {!status.complete && (
                            <Button
                              type="button"
                              onClick={() => {
                                setShowCreateForm(false);
                                handleStartOnboarding(editingUser);
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                            >
                              <Fingerprint className="w-4 h-4 mr-2" />
                              Complete Onboarding
                            </Button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {!editingUser && (
                  <div>
                    <Label htmlFor="phone_number">Phone Number (WhatsApp) *</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="+91 XXXXXXXXXX"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Login credentials will be sent via WhatsApp</p>
                  </div>
                )}

                {whatsappStatus && (
                  <Alert>
                    <AlertDescription>{whatsappStatus}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingUser ? 'Update User' : 'Create User'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboardingModal && onboardingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5" />
                Complete Onboarding - {onboardingUser.full_name}
              </CardTitle>
              <p className="text-blue-100 text-sm mt-1">
                Aadhar Verification & Face Registration
              </p>
            </CardHeader>
            <CardContent className="bg-white pt-4 space-y-4">
              {/* Onboarding Progress */}
              <div className="flex items-center justify-center gap-4 pb-4 border-b">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  onboardingStep === 'aadhar' ? 'bg-blue-100 text-blue-800' : 
                  aadharVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">1. Aadhar</span>
                  {aadharVerified && <CheckCircle className="w-4 h-4" />}
                </div>
                <div className="w-8 h-0.5 bg-gray-300" />
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  onboardingStep === 'face' ? 'bg-blue-100 text-blue-800' : 
                  faceRegistered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-medium">2. Face</span>
                  {faceRegistered && <CheckCircle className="w-4 h-4" />}
                </div>
              </div>

              {/* Alerts */}
              {onboardingError && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">{onboardingError}</AlertDescription>
                </Alert>
              )}
              {onboardingSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">{onboardingSuccess}</AlertDescription>
                </Alert>
              )}

              {/* Aadhar Verification Step */}
              {onboardingStep === 'aadhar' && !aadharVerified && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Aadhar Verification
                  </h3>

                  {aadhaarScanError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                      {aadhaarScanError}
                    </div>
                  )}

                  {/* Parsed result preview */}
                  {aadhaarParsed && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-green-800 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Aadhaar Scanned
                        </span>
                        <button
                          type="button"
                          onClick={() => { setAadhaarParsed(null); setAadhaarQrText(''); setAadhaarScanMode('manual'); stopMobilePoll(); setMobileScanStatus('idle'); }}
                          className="text-xs text-gray-500 hover:text-red-600"
                        >
                          Clear
                        </button>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                        {aadhaarParsed.name && <><dt className="font-medium">Name</dt><dd>{aadhaarParsed.name}</dd></>}
                        {aadhaarParsed.uid && <><dt className="font-medium">UID</dt><dd>{aadhaarParsed.uid}</dd></>}
                        {aadhaarParsed.dob && <><dt className="font-medium">DOB</dt><dd>{aadhaarParsed.dob}</dd></>}
                        {aadhaarParsed.gender && <><dt className="font-medium">Gender</dt><dd>{aadhaarParsed.gender}</dd></>}
                        {aadhaarParsed.state && <><dt className="font-medium">State</dt><dd>{aadhaarParsed.state}</dd></>}
                      </dl>
                    </div>
                  )}

                  {/* Scan option buttons (show when no parsed result yet) */}
                  {!aadhaarParsed && aadhaarScanMode === 'manual' && (
                    <div className="grid grid-cols-2 gap-2 pb-1">
                      <button
                        type="button"
                        onClick={handleMobileScanStart}
                        className="flex flex-col items-center gap-1.5 p-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                      >
                        <span className="text-xl">📱</span>
                        <span className="text-xs font-semibold text-blue-700">Scan with Phone</span>
                        <span className="text-xs text-gray-400 leading-tight">Staff scans QR on Aadhaar via phone</span>
                      </button>
                      <label className="flex flex-col items-center gap-1.5 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-gray-50 transition-colors text-center cursor-pointer">
                        <span className="text-xl">🖼️</span>
                        <span className="text-xs font-semibold text-gray-700">Upload Photo</span>
                        <span className="text-xs text-gray-400 leading-tight">Upload a photo of the Aadhaar card</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) { setAadhaarScanMode('upload'); handleAadhaarImageUpload(file); }
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {/* Upload loading indicator */}
                  {aadhaarScanMode === 'upload' && aadhaarUploadLoading && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Extracting QR from image…</span>
                    </div>
                  )}

                  {/* Mobile QR display + polling indicator */}
                  {aadhaarScanMode === 'mobile' && mobileScanStatus === 'waiting' && (
                    <div className="space-y-3 text-center">
                      <p className="text-sm font-medium text-gray-700">Scan this QR with a phone:</p>
                      {mobileQRImage && (
                        <div className="inline-block p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`data:image/png;base64,${mobileQRImage}`}
                            alt="Mobile scan QR"
                            className="w-40 h-40 object-contain"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600" />
                        Waiting for phone scan…
                      </div>
                      <button
                        type="button"
                        onClick={() => { stopMobilePoll(); setAadhaarScanMode('manual'); setMobileScanStatus('idle'); }}
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Divider between scan options and manual input */}
                  {!aadhaarParsed && aadhaarScanMode === 'manual' && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400">or enter manually</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}

                  {/* Manual Aadhar input (always visible, auto-filled from scan) */}
                  {(aadhaarScanMode === 'manual' || aadhaarParsed) && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">Enter the 12-digit Aadhar number after physically verifying the document.</p>
                      <div>
                        <Label htmlFor="aadhar">Aadhar Number *</Label>
                        <Input
                          id="aadhar"
                          value={aadharNumber}
                          onChange={handleAadharChange}
                          placeholder="XXXX XXXX XXXX"
                          maxLength={14}
                          className="font-mono text-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter 12-digit Aadhar number</p>
                      </div>
                      <Button
                        onClick={confirmAadhar}
                        disabled={aadharNumber.replace(/\s/g, '').length !== 12}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Confirm Aadhar
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Aadhar Already Verified */}
              {aadharVerified && onboardingStep === 'aadhar' && (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Aadhar Verified Successfully!</p>
                  <Button
                    onClick={() => setOnboardingStep('face')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to Face Registration →
                  </Button>
                </div>
              )}

              {/* Face Registration Step */}
              {onboardingStep === 'face' && !faceRegistered && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-600" />
                    Face Registration
                  </h3>

                  <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[4/3]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${isCameraActive ? '' : 'hidden'}`}
                    />
                    {isCameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-4 border-white border-dashed rounded-full opacity-50" />
                      </div>
                    )}
                    {!isCameraActive && faceImage && (
                      <img src={faceImage} alt="Captured face" className="w-full h-full object-cover" />
                    )}
                    {!isCameraActive && !faceImage && (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Camera className="w-16 h-16 mb-2" />
                        <p>Click Start Camera to begin</p>
                      </div>
                    )}
                  </div>
                  
                  <canvas ref={canvasRef} className="hidden" />

                  <div className="flex gap-2">
                    {!isCameraActive && !faceImage && (
                      <Button onClick={startCamera} className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    )}
                    {isCameraActive && (
                      <>
                        <Button variant="outline" onClick={stopCamera} className="flex-1">
                          Cancel
                        </Button>
                        <Button 
                          onClick={captureFace} 
                          disabled={capturingFace}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {capturingFace ? 'Registering...' : 'Capture & Register'}
                        </Button>
                      </>
                    )}
                    {faceImage && !faceRegistered && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setFaceImage(null);
                            startCamera();
                          }} 
                          className="flex-1"
                        >
                          Retake
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Face Already Registered - Onboarding Complete */}
              {faceRegistered && (
                <div className="text-center py-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-bold text-lg">Onboarding Complete!</p>
                  <p className="text-gray-600 mt-1">
                    {onboardingUser.full_name} is now fully onboarded with Aadhar verification and Face registration.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseOnboarding}
                  className="flex-1"
                >
                  {faceRegistered ? 'Close' : 'Cancel'}
                </Button>
                {!aadharVerified && onboardingStep === 'face' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOnboardingStep('aadhar')}
                    className="flex-1"
                  >
                    ← Back to Aadhar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}