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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clamflowbackend-production.up.railway.app';

// Your Naming Convention Enterprise Credentials (with default passwords requiring change)
const enterpriseDefaultCredentials = [
  { 
    username: 'SA_Motty', 
    password: 'Phes0061', 
    role: 'Super Admin' as const, 
    fullName: 'Super Admin - Motty',
    requiresPasswordChange: true 
  },
  // Add other default role accounts as needed
  { 
    username: 'AD_Admin', 
    password: 'DefaultAdmin123!', 
    role: 'Admin' as const, 
    fullName: 'Admin - Default',
    requiresPasswordChange: true 
  },
  { 
    username: 'QC_Lead', 
    password: 'DefaultQC123!', 
    role: 'QC Lead' as const, 
    fullName: 'QC Lead - Default',
    requiresPasswordChange: true 
  },
  { 
    username: 'PL_Lead', 
    password: 'DefaultPL123!', 
    role: 'Production Lead' as const, 
    fullName: 'Production Lead - Default',
    requiresPasswordChange: true 
  },
  { 
    username: 'SL_Staff', 
    password: 'DefaultSL123!', 
    role: 'Staff Lead' as const, 
    fullName: 'Staff Lead - Default',
    requiresPasswordChange: true 
  },
  { 
    username: 'QS_Staff', 
    password: 'DefaultQS123!', 
    role: 'QC Staff' as const, 
    fullName: 'QC Staff - Default',
    requiresPasswordChange: true 
  },
  { 
    username: 'PS_Staff', 
    password: 'DefaultPS123!', 
    role: 'Production Staff' as const, 
    fullName: 'Production Staff - Default',
    requiresPasswordChange: true 
  },
  { 
    username: 'SG_Guard', 
    password: 'DefaultSG123!', 
    role: 'Security Guard' as const, 
    fullName: 'Security Guard - Default',
    requiresPasswordChange: true 
  }
];

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
        const storedToken = localStorage.getItem('clamflow_token');
        const storedUser = localStorage.getItem('clamflow_user');

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          setRequiresPasswordChange(userData.requires_password_change || false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('clamflow_token');
        localStorage.removeItem('clamflow_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function with password change detection
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string; requiresPasswordChange?: boolean }> => {
    try {
      setIsLoading(true);
      
      // First, try API authentication
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

          setToken(authToken);
          setUser(userData);
          setRequiresPasswordChange(userData.requires_password_change || false);

          localStorage.setItem('clamflow_token', authToken);
          localStorage.setItem('clamflow_user', JSON.stringify(userData));

          if (userData.requires_password_change) {
            return { success: true, requiresPasswordChange: true };
          } else {
            router.push('/dashboard');
            return { success: true };
          }
        }
      } catch (apiError) {
        console.warn('API authentication failed, trying enterprise credentials:', apiError);
      }

      // Fallback to enterprise credentials (for development/initial setup)
      const matchedCredential = enterpriseDefaultCredentials.find(
        cred => cred.username.toLowerCase() === username.toLowerCase() && cred.password === password
      );

      if (matchedCredential) {
        // Check if password has been changed before
        const hasChangedPassword = localStorage.getItem(`password_changed_${username.toLowerCase()}`);
        
        const fallbackToken = `enterprise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const userData: User = {
          id: `enterprise_${matchedCredential.username.toLowerCase()}`,
          username: matchedCredential.username,
          full_name: matchedCredential.fullName,
          role: matchedCredential.role,
          station: 'Enterprise',
          is_active: true,
          last_login: new Date().toISOString(),
          requires_password_change: !hasChangedPassword || matchedCredential.requiresPasswordChange,
          first_login: !hasChangedPassword
        };

        setToken(fallbackToken);
        setUser(userData);
        setRequiresPasswordChange(userData.requires_password_change || false);

        localStorage.setItem('clamflow_token', fallbackToken);
        localStorage.setItem('clamflow_user', JSON.stringify(userData));

        if (userData.requires_password_change) {
          return { success: true, requiresPasswordChange: true };
        } else {
          router.push('/dashboard');
          return { success: true };
        }
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);
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
          // Update user state to remove password change requirement
          const updatedUser = { ...user, requires_password_change: false, first_login: false };
          setUser(updatedUser);
          setRequiresPasswordChange(false);
          localStorage.setItem('clamflow_user', JSON.stringify(updatedUser));
          
          router.push('/dashboard');
          return { success: true };
        } else {
          const errorData = await response.json();
          return { success: false, error: errorData.message || 'Failed to change password' };
        }
      } catch (apiError) {
        console.warn('API password change failed, using local storage for enterprise accounts');
      }

      // For enterprise accounts, store that password was changed
      if (user.id.startsWith('enterprise_')) {
        // Validate current password matches what they used to login
        const matchedCredential = enterpriseDefaultCredentials.find(
          cred => cred.username.toLowerCase() === user.username.toLowerCase()
        );

        if (!matchedCredential || matchedCredential.password !== currentPassword) {
          return { success: false, error: 'Current password is incorrect' };
        }

        // Mark password as changed for this user
        localStorage.setItem(`password_changed_${user.username.toLowerCase()}`, 'true');
        localStorage.setItem(`new_password_${user.username.toLowerCase()}`, newPassword);

        // Update user state
        const updatedUser = { ...user, requires_password_change: false, first_login: false };
        setUser(updatedUser);
        setRequiresPasswordChange(false);
        localStorage.setItem('clamflow_user', JSON.stringify(updatedUser));

        router.push('/dashboard');
        return { success: true };
      }

      return { success: false, error: 'Password change not supported for this account type' };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: 'An error occurred while changing password' };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    setRequiresPasswordChange(false);
    localStorage.removeItem('clamflow_token');
    localStorage.removeItem('clamflow_user');
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
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  };

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
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;