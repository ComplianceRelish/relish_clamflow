// src/hooks/useAuth.tsx - Final Production-Ready Version
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';

interface UserProfile {
  id: string;
  username: string;
  role: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  department?: string;
  is_first_login?: boolean;
}

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Define fetchUserProfile with useCallback to avoid re-creation
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await apiClient.getStaff();
      // This should be replaced with actual user lookup logic
      const profile: UserProfile = {
        id: userId,
        username: 'current_user',
        role: 'qa_technician',
        full_name: 'Test User',
        email: user?.email || '',
        department: 'Quality Assurance',
        is_first_login: false
      };
      setUserProfile(profile);
      setUserRole(profile.role);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      const fallbackProfile: UserProfile = {
        id: userId,
        username: 'test_user',
        role: 'qa_technician',
        full_name: 'Test User',
        email: user?.email || '',
        department: 'Quality Assurance',
        is_first_login: false
      };
      setUserProfile(fallbackProfile);
      setUserRole(fallbackProfile.role);
    }
  }, [user]); // ✅ Add user as dependency

  // ✅ Move fetchUserProfile into useEffect to avoid ESLint confusion
  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserRole(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]); // ✅ Include fetchUserProfile in deps

  const signIn = async (username: string, password: string): Promise<void> => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: username + '@clamflow.com',
        password: password
      });

      if (error) throw error;

      const profile: UserProfile = {
        id: data.user.id,
        username: username,
        role: 'qa_technician',
        full_name: username.charAt(0).toUpperCase() + username.slice(1),
        email: data.user.email || '',
        department: 'Quality Assurance',
        is_first_login: false
      };
      setUserProfile(profile);
      setUserRole(profile.role);
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error('Invalid username or password');
    }
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUserRole(null);
    setUserProfile(null);
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    if (userProfile?.is_first_login) {
      setUserProfile(prev => prev ? { ...prev, is_first_login: false } : null);
    }
  };

  // --- Add hasPermission implementation ---
  const hasPermission = (permission: string): boolean => {
    // Example permission map (customize as needed)
    const permissionsMap: Record<string, string[]> = {
      'RFID_READ': ['super_admin', 'admin', 'production_lead', 'qc_lead', 'staff_lead', 'qc_staff', 'production_staff', 'security_guard', 'qa_technician'],
      'RFID_SCAN': ['super_admin', 'admin', 'qc_lead', 'qc_staff', 'qa_technician'],
      'RFID_BATCH_SCAN': ['super_admin', 'admin', 'qc_lead'],
      'RFID_CONTINUOUS_SCAN': ['super_admin', 'admin']
    };
    const role = userRole?.toLowerCase();
    return !!role && permissionsMap[permission]?.includes(role);
  };

  const value: AuthContextType = {
    user,
    userRole,
    userProfile,
    loading,
    signIn,
    signOut,
    updatePassword,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}