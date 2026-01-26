// src/context/AuthContext.tsx - Production-Ready & Lint-Free Version
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Types
interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'Super Admin' | 'Admin' | 'Production Lead' | 'QC Lead' | 'Staff Lead' | 'QC Staff' | 'Production Staff' | 'Security Guard';
  station?: string;
  is_active: boolean;
  last_login?: string;
  requires_password_change?: boolean;
  first_login?: boolean;
}

// Define AuthContextType with hasPermission
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; requiresPasswordChange?: boolean }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshToken: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL - standardized to NEXT_PUBLIC_API_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app';

// Production: All authentication is handled by the backend API
// No fallback credentials - ensures security compliance

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        console.log('AuthContext: Initializing from localStorage');
        const storedToken = localStorage.getItem('clamflow_token');
        const storedUser = localStorage.getItem('clamflow_user');

        console.log('AuthContext: Found stored data:', { hasToken: !!storedToken, hasUser: !!storedUser });

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          setRequiresPasswordChange(userData.requires_password_change || false);
          console.log('AuthContext: Auth state restored for user:', userData.username);
        } else {
          console.log('AuthContext: No stored auth data found');
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        localStorage.removeItem('clamflow_token');
        localStorage.removeItem('clamflow_user');
      } finally {
        setIsLoading(false);
        console.log('AuthContext: Initialization complete');
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string; requiresPasswordChange?: boolean }> => {
    try {
      setIsLoading(true);
      
      console.log('🔐 Starting login process for:', username);
      
      // Try API authentication
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend login response:', data);
          
          const authToken = data.access_token;
          const userData: User = {
            id: data.user.id,
            username: data.user.username,
            full_name: data.user.full_name,
            role: data.user.role,
            station: data.user.station,
            is_active: data.user.is_active,
            last_login: new Date().toISOString(),
            requires_password_change: data.user.requires_password_change || false,
            first_login: data.user.first_login || false
          };

          console.log('📝 Setting user with requires_password_change:', userData.requires_password_change);

          // CRITICAL: Save to localStorage FIRST before setting state
          try {
            localStorage.setItem('clamflow_token', authToken);
            localStorage.setItem('clamflow_user', JSON.stringify(userData));
            console.log('✅ AuthContext: Successfully saved token and user to localStorage');
            
            // Verify it was saved
            const savedToken = localStorage.getItem('clamflow_token');
            const savedUser = localStorage.getItem('clamflow_user');
            console.log('🔍 Verification - Token saved:', !!savedToken, 'User saved:', !!savedUser);
            
            if (!savedToken || !savedUser) {
              throw new Error('localStorage verification failed');
            }
          } catch (err) {
            console.error('❌ AuthContext: Failed to save to localStorage:', err);
            return { success: false, error: 'Failed to save authentication data. Please check your browser settings.' };
          }

          // Now set React state
          setToken(authToken);
          setUser(userData);
          setRequiresPasswordChange(userData.requires_password_change || false);

          if (userData.requires_password_change) {
            return { success: true, requiresPasswordChange: true };
          } else {
            // Add delay to ensure state propagation before navigation
            await new Promise(resolve => setTimeout(resolve, 200));
            router.push('/dashboard');
            return { success: true };
          }
        } else {
          // API returned non-OK response
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Authentication failed:', errorData);
          return { success: false, error: errorData.detail || 'Invalid credentials' };
        }
      } catch (err) {
        console.error('❌ API authentication failed:', err);
        return { success: false, error: 'Authentication service unavailable. Please try again later.' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Network error. Please check your connection.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Password change function
  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'No user logged in' };

      // Validate new password strength
      if (newPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters long' };
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(newPassword)) {
        return { success: false, error: 'Password must contain uppercase, lowercase, number, and special character' };
      }

      // Try API password change first
      try {
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
          }),
        });

        if (response.ok) {
          const updatedUser = { ...user, requires_password_change: false, first_login: false };
          setUser(updatedUser);
          setRequiresPasswordChange(false);
          
          // Try to save updated user to localStorage
          try {
            localStorage.setItem('clamflow_user', JSON.stringify(updatedUser));
            console.log('✅ AuthContext: Successfully updated user in localStorage after password change');
          } catch (err) {
            console.error('❌ AuthContext: Failed to update user in localStorage:', err);
          }
          
          // Add small delay to ensure state propagation before navigation
          await new Promise(resolve => setTimeout(resolve, 100));
          router.push('/dashboard');
          return { success: true };
        } else {
          const errorData = await response.json();
          return { success: false, error: errorData.message || 'Failed to change password' };
        }
      } catch (err) {
        console.error('❌ API password change failed:', err);
        return { success: false, error: 'Password change service unavailable. Please try again later.' };
      }
    } catch (err) {
      console.error('Password change error:', err);
      return { success: false, error: 'An error occurred while changing password' };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    setRequiresPasswordChange(false);
    
    // Try to remove from localStorage
    try {
      localStorage.removeItem('clamflow_token');
      localStorage.removeItem('clamflow_user');
      console.log('✅ AuthContext: Successfully cleared localStorage on logout');
    } catch (err) {
      console.error('❌ AuthContext: Failed to clear localStorage on logout:', err);
    }
    
    router.push('/login');
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        logout();
        return false;
      }

      const data = await response.json();
      const newToken = data.access_token;
      
      setToken(newToken);
      localStorage.setItem('clamflow_token', newToken);
      
      return true;
    } catch (err) {
      console.error('Token refresh error:', err);
      logout();
      return false;
    }
  };

  // ✅ Define contextValue correctly
  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    requiresPasswordChange,
    login,
    logout,
    changePassword,
    refreshToken,
    // ✅ Provide hasPermission function
    hasPermission: (permission: string): boolean => {
      if (!user) return false;
      const permissionsMap: Record<string, string[]> = {
        'RFID_READ': ['Super Admin', 'Admin', 'Production Lead', 'QC Lead', 'Staff Lead', 'QC Staff', 'Production Staff', 'Security Guard'],
        'RFID_SCAN': ['Super Admin', 'Admin', 'QC Lead', 'QC Staff'],
        'RFID_BATCH_SCAN': ['Super Admin', 'Admin', 'QC Lead'],
        'RFID_CONTINUOUS_SCAN': ['Super Admin', 'Admin']
      };
      return permissionsMap[permission]?.includes(user.role) || false;
    },
  };

  // ✅ Return JSX.Element, not void
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Export useAuth properly
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;