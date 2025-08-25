'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';  // Fixed import path

interface UserProfile {
  id: string;
  username: string;
  role: string;
  full_name?: string;  // Added this property
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUserRole(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Use your existing API client to get user profile
      const response = await apiClient.getStaff();
      // Find current user in staff list or create a mock profile for testing
      const profile: UserProfile = {
        id: userId,
        username: 'current_user', // This should come from your backend
        role: 'qa_technician', // This should come from your backend
        full_name: 'Test User', // This should come from your backend
        email: user?.email || '',
        department: 'Quality Assurance',
        is_first_login: false
      };
      
      setUserProfile(profile);
      setUserRole(profile.role);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Create a fallback profile for development
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
  };

  const signIn = async (username: string, password: string): Promise<void> => {
    try {
      // For now, we'll use Supabase auth directly
      // You can modify this to use your backend auth endpoint when ready
      const { error, data } = await supabase.auth.signInWithPassword({
        email: username + '@clamflow.com', // Convert username to email format
        password: password
      });

      if (error) throw error;

      // Create user profile based on successful login
      const profile: UserProfile = {
        id: data.user.id,
        username: username,
        role: 'qa_technician', // Default role, should come from backend
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
    
    // Clear user data
    setUserRole(null);
    setUserProfile(null);
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;

    // Mark first login as complete
    if (userProfile?.is_first_login) {
      setUserProfile(prev => prev ? { ...prev, is_first_login: false } : null);
    }
  };

  const value: AuthContextType = {
    user,
    userRole,
    userProfile,
    loading,
    signIn,
    signOut,
    updatePassword,
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
