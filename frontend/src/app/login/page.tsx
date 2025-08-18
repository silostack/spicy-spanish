'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '../components/MainLayout';
import { useAuth } from '../contexts/AuthContext';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if user was redirected from registration
    const registered = searchParams.get('registered');
    if (registered === 'true') {
      setSuccessMessage('Registration successful! Please log in with your credentials.');
    }
    
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [searchParams, isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      await login(email, password);
      // The redirect is handled in the AuthContext
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-spicy-dark">Welcome Back!</h1>
              <p className="text-gray-600 mt-2">Log in to your Spicy Spanish account</p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  required
                />
                <div className="text-right mt-1">
                  <Link href="/forgot-password" className="text-sm text-spicy-red hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-spicy-red hover:bg-spicy-orange text-white font-bold py-2 px-4 rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  'Log In'
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-spicy-red hover:underline">
                  Register now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}