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
  
  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const roles = [
    'Production Lead',
    'QC Lead',
    'Staff Lead',
    'QC Staff',
    'Production Staff',
    'Security Guard'
  ];

  const USERNAME_PREFIXES: { [key: string]: string } = {
    'Production Lead': 'PL',
    'QC Lead': 'QA',
    'Staff Lead': 'SL',
    'QC Staff': 'QC',
    'Production Staff': 'PS',
    'Security Guard': 'SG'
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

      const newUser: User = {
        id: `user_${Date.now()}`,
        username,
        full_name: userData.full_name,
        role: userData.role,
        station: userData.station || 'Unassigned',
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: undefined
      };

      // Try API first
      try {
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

        if (response.ok) {
          const createdUser = await response.json();
          setUsers(prev => [...prev, createdUser]);
          
          // 🔔 Send WhatsApp welcome message
          if (userData.phone_number) {
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
              console.log('✅ Welcome message sent to:', userData.phone_number);
            } else {
              setWhatsappStatus(`⚠️ User created but WhatsApp failed: ${whatsappResult.error}`);
              console.warn('WhatsApp delivery failed:', whatsappResult.error);
            }
          }
          
          return true;
        }
      } catch (err) {
        console.warn('API failed, using local fallback:', err);
      }

      // Fallback to local storage
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('clamflow_users', JSON.stringify(updatedUsers));
      
      // 🔔 Send WhatsApp for fallback users too
      if (userData.phone_number) {
        setWhatsappStatus('Sending WhatsApp welcome message...');
        const whatsappResult = await sendWelcomeMessage({
          username,
          password: generatedPassword,
          full_name: userData.full_name,
          role: userData.role,
          phone_number: userData.phone_number
        });
        
        if (whatsappResult.success) {
          setWhatsappStatus('✅ WhatsApp welcome message sent!');
        } else {
          setWhatsappStatus(`⚠️ User created but WhatsApp failed: ${whatsappResult.error}`);
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error creating user:', err);
      setFormError('Failed to create user');
      return false;
    }
  };

  const updateUser = async (userId: string, userData: any) => {
    try {
      // Try API first
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });

        if (response.ok) {
          const updatedUser = await response.json();
          setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
          return true;
        }
      } catch (err) {
        console.warn('API failed, using local fallback:', err);
      }

      // Fallback to local storage
      const updatedUsers = users.map(u => u.id === userId ? { ...u, ...userData } : u);
      setUsers(updatedUsers);
      localStorage.setItem('clamflow_users', JSON.stringify(updatedUsers));
      
      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      setFormError('Failed to update user');
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Try API first
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setUsers(prev => prev.filter(u => u.id !== userId));
          return true;
        }
      } catch (err) {
        console.warn('API failed, using local fallback:', err);
      }

      // Fallback to local storage
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('clamflow_users', JSON.stringify(updatedUsers));
      
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      setFormError('Failed to delete user');
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
  };

  const handleCloseOnboarding = () => {
    stopCamera();
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
    if (cleaned.length !== 12) {
      setOnboardingError('Please enter a valid 12-digit Aadhar number');
      return;
    }
    
    setAadharVerifying(true);
    setOnboardingError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/aadhar/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhar_number: cleaned })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAadharOtpSent(true);
        setOnboardingSuccess('OTP sent to registered mobile number');
      } else {
        setOnboardingError(result.message || 'Failed to send OTP');
      }
    } catch (err: unknown) {
      console.error('Aadhar OTP API Error:', err);
      setOnboardingError('Aadhar verification service temporarily unavailable. Please try again.');
    } finally {
      setAadharVerifying(false);
    }
  };

  const verifyAadharOtp = async () => {
    if (aadharOtp.length !== 6) {
      setOnboardingError('Please enter the 6-digit OTP');
      return;
    }
    
    setAadharVerifying(true);
    setOnboardingError(null);
    
    try {
      const cleaned = aadharNumber.replace(/\s/g, '');
      const response = await fetch(`${API_BASE_URL}/aadhar/verify-otp`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          aadhar_number: cleaned,
          otp: aadharOtp,
          user_id: onboardingUser?.id
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAadharVerified(true);
        setOnboardingSuccess('Aadhar verified successfully!');
        // Update user in list
        if (onboardingUser) {
          setUsers(prev => prev.map(u => 
            u.id === onboardingUser.id ? { ...u, aadhar_verified: true } : u
          ));
        }
        // Move to face registration
        setTimeout(() => {
          setOnboardingStep('face');
          setOnboardingSuccess(null);
        }, 1500);
      } else {
        setOnboardingError(result.message || 'Invalid OTP. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Aadhar OTP Verification Error:', err);
      setOnboardingError('Verification failed. Please try again.');
    } finally {
      setAadharVerifying(false);
    }
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
                    <th className="text-left py-2">STATION</th>
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
                              className="hover:bg-purple-50 hover:border-purple-500 text-purple-600"
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
          <Card className="w-full max-w-md mx-4 bg-white shadow-xl">
            <CardHeader className="bg-white border-b">
              <CardTitle>{editingUser ? 'Edit User' : 'Create New User'}</CardTitle>
            </CardHeader>
            <CardContent className="bg-white pt-4">
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
                  <Label htmlFor="station">Station (Optional)</Label>
                  <Input
                    id="station"
                    value={formData.station}
                    onChange={(e) => setFormData(prev => ({ ...prev, station: e.target.value }))}
                    placeholder="Enter station (optional)"
                  />
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
                              className="w-full bg-purple-600 hover:bg-purple-700 mt-2"
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
            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5" />
                Complete Onboarding - {onboardingUser.full_name}
              </CardTitle>
              <p className="text-purple-100 text-sm mt-1">
                Aadhar Verification & Face Registration
              </p>
            </CardHeader>
            <CardContent className="bg-white pt-4 space-y-4">
              {/* Onboarding Progress */}
              <div className="flex items-center justify-center gap-4 pb-4 border-b">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  onboardingStep === 'aadhar' ? 'bg-purple-100 text-purple-800' : 
                  aadharVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">1. Aadhar</span>
                  {aadharVerified && <CheckCircle className="w-4 h-4" />}
                </div>
                <div className="w-8 h-0.5 bg-gray-300" />
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  onboardingStep === 'face' ? 'bg-purple-100 text-purple-800' : 
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
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    Aadhar Verification
                  </h3>
                  
                  {!aadharOtpSent ? (
                    <div className="space-y-3">
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
                        onClick={sendAadharOtp}
                        disabled={aadharVerifying || aadharNumber.replace(/\s/g, '').length !== 12}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {aadharVerifying ? 'Sending OTP...' : 'Send OTP'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="otp">Enter OTP *</Label>
                        <Input
                          id="otp"
                          value={aadharOtp}
                          onChange={(e) => setAadharOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          className="font-mono text-lg text-center tracking-widest"
                        />
                        <p className="text-xs text-gray-500 mt-1">OTP sent to registered mobile number</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAadharOtpSent(false);
                            setAadharOtp('');
                          }}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={verifyAadharOtp}
                          disabled={aadharVerifying || aadharOtp.length !== 6}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          {aadharVerifying ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                      </div>
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
                    className="mt-4 bg-purple-600 hover:bg-purple-700"
                  >
                    Continue to Face Registration →
                  </Button>
                </div>
              )}

              {/* Face Registration Step */}
              {onboardingStep === 'face' && !faceRegistered && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-purple-600" />
                    Face Registration
                  </h3>

                  <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[4/3]">
                    {isCameraActive ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-48 h-48 border-4 border-white border-dashed rounded-full opacity-50" />
                        </div>
                      </>
                    ) : faceImage ? (
                      <img src={faceImage} alt="Captured face" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Camera className="w-16 h-16 mb-2" />
                        <p>Click Start Camera to begin</p>
                      </div>
                    )}
                  </div>
                  
                  <canvas ref={canvasRef} className="hidden" />

                  <div className="flex gap-2">
                    {!isCameraActive && !faceImage && (
                      <Button onClick={startCamera} className="flex-1 bg-purple-600 hover:bg-purple-700">
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