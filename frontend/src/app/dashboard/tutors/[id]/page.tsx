'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../utils/api';

interface TutorDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  timezone?: string;
  bio?: string;
  dateOfBirth?: string;
  nationality?: string;
  profession?: string;
  address?: string;
  tutorExperience?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
}

export default function TutorViewPage() {
  const params = useParams();
  const router = useRouter();
  const tutorId = params.id as string;
  
  const [tutor, setTutor] = useState<TutorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tutorId) {
      fetchTutor();
    }
  }, [tutorId]);

  const fetchTutor = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${tutorId}`);
      setTutor(response.data);
    } catch (error: any) {
      console.error('Error fetching tutor:', error);
      setError(error.response?.data?.message || 'Failed to load tutor details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-spicy-red"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="text-xl text-red-700 font-semibold">Error</h2>
          <p className="text-red-600">{error}</p>
          <div className="mt-4">
            <Link
              href="/dashboard/tutors"
              className="text-spicy-red hover:text-spicy-orange underline"
            >
              ← Back to Tutors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl text-gray-700">Tutor not found</h2>
          <Link
            href="/dashboard/tutors"
            className="text-spicy-red hover:text-spicy-orange underline mt-4 inline-block"
          >
            ← Back to Tutors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link
            href="/dashboard/tutors"
            className="text-spicy-red hover:text-spicy-orange mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-spicy-dark">
              {tutor.firstName} {tutor.lastName}
            </h1>
            <p className="text-gray-600">Tutor Details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link
            href={`/dashboard/tutors/${tutor.id}/availability`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Manage Availability
          </Link>
          <Link
            href={`/dashboard/tutors/${tutor.id}/edit`}
            className="bg-spicy-red hover:bg-spicy-orange text-white px-4 py-2 rounded-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Tutor
          </Link>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          tutor.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {tutor.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-spicy-dark mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <p className="text-gray-900">{tutor.firstName} {tutor.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900">{tutor.email}</p>
            </div>
            {tutor.phoneNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <p className="text-gray-900">{tutor.phoneNumber}</p>
              </div>
            )}
            {tutor.dateOfBirth && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <p className="text-gray-900">{formatDateOnly(tutor.dateOfBirth)}</p>
              </div>
            )}
            {tutor.nationality && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <p className="text-gray-900">{tutor.nationality}</p>
              </div>
            )}
            {tutor.profession && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                <p className="text-gray-900">{tutor.profession}</p>
              </div>
            )}
            {tutor.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-gray-900">{tutor.address}</p>
              </div>
            )}
            {tutor.timezone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <p className="text-gray-900">{tutor.timezone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-spicy-dark mb-4">Professional Information</h2>
          <div className="space-y-4">
            {tutor.bio && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <p className="text-gray-900 whitespace-pre-line">{tutor.bio}</p>
              </div>
            )}
            {tutor.tutorExperience && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Experience</label>
                <p className="text-gray-900 whitespace-pre-line">{tutor.tutorExperience}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <p className="text-gray-900 capitalize">{tutor.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold text-spicy-dark mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
            <p className="text-gray-900">{formatDate(tutor.createdAt)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
            <p className="text-gray-900">{formatDate(tutor.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 