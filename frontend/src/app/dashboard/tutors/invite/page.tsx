'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../utils/api';

export default function InviteTutorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/auth/invite/tutor', { email: formData.email });
      
      setSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        message: '',
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/tutors');
      }, 3000);
      
    } catch (error: any) {

      setError(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link 
            href="/dashboard/tutors" 
            className="text-spicy-red hover:text-spicy-orange mr-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-spicy-dark">Invite a New Tutor</h1>
        </div>
        <p className="text-gray-600">Send an invitation to join Spicy Spanish as a tutor</p>
      </div>

      {success ? (
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl text-green-700 font-semibold">Invitation Sent!</h2>
          <p className="text-green-600">
            The invitation has been sent to {formData.email}. You will be redirected to the tutors page.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <h2 className="text-xl text-red-700 font-semibold">Error</h2>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  placeholder="Add a personal message to your invitation..."
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Invitation Preview</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Dear {formData.firstName || '[First Name]'} {formData.lastName || '[Last Name]'},
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  You have been invited to join Spicy Spanish as a tutor. Please click the link below to create your account and complete your profile.
                </p>
                {formData.message && (
                  <p className="text-sm text-gray-600 mb-2 italic">
                    "{formData.message}"
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Best regards,<br />
                  The Spicy Spanish Team
                </p>
              </div>
              
              <div className="flex justify-end">
                <Link
                  href="/dashboard/tutors"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 mr-2 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-spicy-red text-white rounded-lg hover:bg-spicy-orange flex items-center"
                >
                  {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}