'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import MainLayout from '../components/MainLayout';
import api from '../utils/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-spicy-dark">Reset Password</h1>
              <p className="text-gray-600 mt-2">
                {submitted
                  ? 'Check your email for reset instructions'
                  : 'Enter your email to receive a password reset link'}
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                <span>{error}</span>
              </div>
            )}

            {submitted ? (
              <div>
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                  <p>If an account with that email exists, we&apos;ve sent a password reset link. Please check your inbox and spam folder.</p>
                </div>
                <div className="text-center">
                  <Link href="/login" className="text-spicy-red hover:underline">
                    Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-spicy-red hover:bg-spicy-orange text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <div className="text-center mt-6">
                  <Link href="/login" className="text-gray-600 hover:text-spicy-red">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
