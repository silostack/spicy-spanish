'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';

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
}

interface UpdateStudentForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  timezone: string;
  isActive: boolean;
  password: string;
}

export default function StudentEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<UpdateStudentForm>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    timezone: '',
    isActive: true,
    password: '',
  });

  useEffect(() => {
    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${studentId}`);
      const studentData = response.data;
      setStudent(studentData);

      setFormData({
        firstName: studentData.firstName || '',
        lastName: studentData.lastName || '',
        email: studentData.email || '',
        phoneNumber: studentData.phoneNumber || '',
        timezone: studentData.timezone || '',
        isActive: studentData.isActive,
        password: '',
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const updateData: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          updateData[key] = value;
        }
      });

      await api.patch(`/users/${studentId}`, updateData);

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/students/${studentId}`);
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-600">Only administrators can edit students.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-spicy-red"></div>
        </div>
      </div>
    );
  }

  if (error && !student) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link
          href={`/dashboard/students/${studentId}`}
          className="text-spicy-red hover:text-spicy-orange mr-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-spicy-dark">
            Edit Student: {student?.firstName} {student?.lastName}
          </h1>
          <p className="text-gray-600">Update student information</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl text-green-700 font-semibold">Success!</h2>
          <p className="text-green-600">
            Student information has been updated successfully. Redirecting...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl text-red-700 font-semibold">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-spicy-dark mb-4">Personal Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
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
                Last Name *
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

          <div className="mt-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                value={formData.timezone}
                onChange={handleChange}
              >
                <option value="">Select timezone</option>
                <option value="America/New_York">Eastern Time (EST/EDT)</option>
                <option value="America/Chicago">Central Time (CST/CDT)</option>
                <option value="America/Denver">Mountain Time (MST/MDT)</option>
                <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="Europe/Paris">Paris (CET/CEST)</option>
                <option value="Europe/Madrid">Madrid (CET/CEST)</option>
                <option value="America/Mexico_City">Mexico City (CST/CDT)</option>
                <option value="America/Bogota">Bogota (COT)</option>
                <option value="America/Lima">Lima (PET)</option>
                <option value="America/Buenos_Aires">Buenos Aires (ART)</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-spicy-dark mb-4">System Settings</h2>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Set New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
              placeholder="Leave blank to keep current password"
              value={formData.password}
              onChange={handleChange}
            />
            <p className="mt-1 text-sm text-gray-500">Only fill this if you want to change the password.</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              className="h-4 w-4 text-spicy-red focus:ring-spicy-red border-gray-300 rounded"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active student (can book lessons and login)
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href={`/dashboard/students/${studentId}`}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-spicy-red text-white rounded-lg hover:bg-spicy-orange disabled:bg-gray-400 flex items-center"
          >
            {saving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
