'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface LoginState {
  username: string;
  password: string;
  loading: boolean;
  error: string | null;
}

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [state, setState] = useState<LoginState>({
    username: '',
    password: '',
    loading: false,
    error: null,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.username || !state.password) {
      setState(prev => ({ ...prev, error: 'Please enter both username and password' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const success = await login(state.username, state.password);
      
      if (!success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Invalid username or password',
        }));
      }
      // If successful, the AuthContext will handle the redirect
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Login failed. Please try again.',
      }));
    }
  };

  const handleInputChange = (field: keyof LoginState, value: string) => {
    setState(prev => ({
      ...prev,
      [field]: value,
      error: null, // Clear error when user starts typing
    }));
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingSpinner size="lg" className="text-relish-purple" />
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-200">
              <img 
                src="/logo-relish.png" 
                alt="Relish Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">ClamFlow</h2>
          <p className="mt-2 text-sm text-gray-600">Quality • Productivity • Assured</p>
        </div>

        {/* Login Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <FormField
                label="Username"
                type="text"
                value={state.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter your username"
                required
                disabled={state.loading}
                className="text-lg"
              />
            </div>

            <div>
              <FormField
                label="Password"
                type="password"
                value={state.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password"
                required
                disabled={state.loading}
                className="text-lg"
              />
            </div>

            {/* Error Message */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                disabled={state.loading || !state.username || !state.password}
                className="w-full py-3 text-lg"
              >
                {state.loading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>

            {/* Face Recognition Option */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
                disabled={state.loading}
                onClick={() => {
                  // Future: Implement face recognition
                  alert('Face Recognition will be available soon!');
                }}
              >
                🔍 Use Face Recognition Instead
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800 font-medium">Super Admin Demo:</p>
            <p className="text-xs text-blue-600">Username: SA_Motty</p>
            <p className="text-xs text-blue-600">Password: Phes0061</p>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Powered by ClamFlow Enterprise Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;