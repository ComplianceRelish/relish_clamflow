'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// API Configuration for ClamFlow Backend
const API_CONFIG = {
  baseURL: 'https://clamflowbackend-production.up.railway.app',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const router = useRouter();

  // Backend JWT Authentication
  const loginWithCredentials = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store JWT token for future API calls
      localStorage.setItem('jwt_token', data.access_token);
      localStorage.setItem('user_role', data.user?.role || '');
      
      return {
        success: true,
        token: data.access_token,
        tokenType: data.token_type,
        user: data.user
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await loginWithCredentials(username, password);
      
      if (result.success) {
        // Successful login - redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-logo flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-24 w-24 flex items-center justify-center">
            <Image
              src="/logo_relish.png"
              alt="Relish Logo"
              width={96}
              height={96}
              className="rounded-lg"
              priority
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ClamFlow
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Quality • Productivity • Assured
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="card">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-relish-purple focus:border-relish-purple sm:text-sm"
                  placeholder="Username (e.g., SA_Motty for Super Admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-relish-purple focus:border-relish-purple sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            {/* Face Recognition Option */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowFaceAuth(!showFaceAuth)}
                className="w-full text-sm text-relish-purple hover:text-relish-purple-dark font-medium"
              >
                {showFaceAuth ? 'Use Username/Password Instead' : 'Use Face Recognition Instead'}
              </button>
            </div>

            {/* Super Admin Hint */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-600">
                <strong>Super Admin:</strong> Username: SA_Motty
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}