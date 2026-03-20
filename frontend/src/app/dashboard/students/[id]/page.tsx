'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../utils/api';

interface StudentDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  timezone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
  availableHours?: number;
  coursesEnrolled?: number;
}

export default function StudentViewPage() {
  const params = useParams();
  const { user } = useAuth();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${studentId}`);
      setStudent(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load student details');
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
              href="/dashboard/students"
              className="text-spicy-red hover:text-spicy-orange underline"
            >
              &larr; Back to Students
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl text-gray-700">Student not found</h2>
          <Link
            href="/dashboard/students"
            className="text-spicy-red hover:text-spicy-orange underline mt-4 inline-block"
          >
            &larr; Back to Students
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
            href="/dashboard/students"
            className="text-spicy-red hover:text-spicy-orange mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-spicy-dark">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-600">Student Details</p>
          </div>
        </div>
        {user?.role === 'admin' && (
          <Link
            href={`/dashboard/students/${student.id}/edit`}
            className="bg-spicy-red hover:bg-spicy-orange text-white px-4 py-2 rounded-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Student
          </Link>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          student.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {student.isActive ? 'Active' : 'Inactive'}
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
              <p className="text-gray-900">{student.firstName} {student.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900">{student.email}</p>
            </div>
            {student.phoneNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <p className="text-gray-900">{student.phoneNumber}</p>
              </div>
            )}
            {student.timezone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <p className="text-gray-900">{student.timezone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Learning Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-spicy-dark mb-4">Learning Information</h2>
          <div className="space-y-4">
            {student.availableHours !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Hours</label>
                <p className="text-gray-900">{student.availableHours} hours</p>
              </div>
            )}
            {student.coursesEnrolled !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courses Enrolled</label>
                <p className="text-gray-900">{student.coursesEnrolled} courses</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <p className="text-gray-900 capitalize">{student.role}</p>
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
            <p className="text-gray-900">{formatDate(student.createdAt)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
            <p className="text-gray-900">{formatDate(student.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
