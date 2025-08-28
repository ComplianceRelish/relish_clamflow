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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clamflowbackend-production.up.railway.app';

// AuthProvider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('clamflow_token');
        const storedUser = localStorage.getItem('clamflow_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('clamflow_token');
        localStorage.removeItem('clamflow_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
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
          
          // Store auth data from API
          const authToken = data.access_token;
          const userData: User = {
            id: data.user.id,
            username: data.user.username,
            full_name: data.user.full_name,
            role: data.user.role,
            station: data.user.station,
            is_active: data.user.is_active,
            last_login: new Date().toISOString(),
          };

          // Update state
          setToken(authToken);
          setUser(userData);

          // Store in localStorage
          localStorage.setItem('clamflow_token', authToken);
          localStorage.setItem('clamflow_user', JSON.stringify(userData));

          // Redirect to dashboard
          router.push('/dashboard');
          
          return true;
        }
      } catch (apiError) {
        console.warn('API authentication failed, trying fallback:', apiError);
      }

      // Fallback authentication for enterprise credentials
      const enterpriseCredentials = [
        { username: 'SA_Motty', password: 'Phes0061', role: 'Super Admin' as const, fullName: 'Super Admin - Motty' },
        { username: 'admin', password: 'admin123', role: 'Admin' as const, fullName: 'System Administrator' },
        { username: 'demo', password: 'demo123', role: 'QC Lead' as const, fullName: 'Demo User' },
      ];

      const matchedCredential = enterpriseCredentials.find(
        cred => cred.username.toLowerCase() === username.toLowerCase() && cred.password === password
      );

      if (matchedCredential) {
        // Generate fallback token and user data
        const fallbackToken = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const userData: User = {
          id: `fallback_${matchedCredential.username.toLowerCase()}`,
          username: matchedCredential.username,
          full_name: matchedCredential.fullName,
          role: matchedCredential.role,
          station: 'Enterprise',
          is_active: true,
          last_login: new Date().toISOString(),
        };

        // Update state
        setToken(fallbackToken);
        setUser(userData);

        // Store in localStorage
        localStorage.setItem('clamflow_token', fallbackToken);
        localStorage.setItem('clamflow_user', JSON.stringify(userData));

        // Redirect to dashboard
        router.push('/dashboard');
        
        return true;
      }

      // Authentication failed
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
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
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;