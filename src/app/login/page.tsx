'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;  // ✅ ADDED: disables static generation & prevents revalidate errors
export const fetchCache = 'force-no-store';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import PasswordChangeForm from '../../components/auth/PasswordChangeForm';

interface LoginState {
  username: string;
  password: string;
  loading: boolean;
  error: string | null;
}

const LoginPage: React.FC = () => {
  const { login, user, requiresPasswordChange, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [state, setState] = useState<LoginState>({
    username: '',
    password: '',
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading && !requiresPasswordChange) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, requiresPasswordChange, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.username || !state.password) {
      setState(prev => ({ ...prev, error: 'Please enter both username and password' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await login(state.username, state.password);
      
      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Invalid username or password',
        }));
      } else if (result.requiresPasswordChange) {
        setState(prev => ({ ...prev, loading: false }));
      }
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
      error: null,
    }));
  };

  if (user && requiresPasswordChange) {
    return <PasswordChangeForm />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" className="text-relish-purple" />
      </div>
    );
  }

  if (isAuthenticated && !requiresPasswordChange) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo-relish.png" 
              alt="Relish Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">ClamFlow</h2>
          <p className="mt-2 text-sm text-gray-600">Quality • Productivity • Assured</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <FormField
                label="Username"
                type="text"
                value={state.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="relishfoodsalby@gmail.com"
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
                placeholder="••••••"
                required
                disabled={state.loading}
                className="text-lg"
              />
            </div>

            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

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

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
                disabled={state.loading}
                onClick={() => {
                  alert('Face Recognition will be available soon!');
                }}
              >
                🔐 Use Face Recognition Instead
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Enterprise Login</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>Super Admin:</strong> SA_Motty</div>
              <div><strong>Admin:</strong> AD_Admin</div>
              <div><strong>QC Lead:</strong> QC_Lead</div>
              <div className="text-xs text-blue-600 mt-2">
                * Default passwords require change on first login
              </div>
            </div>
          </div>
        </Card>

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