'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../utils/api';

interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  lastActive?: string;
  bio?: string;
  totalStudents?: number;
  totalHours?: number;
  invitationStatus?: 'pending' | 'accepted' | 'expired';
  isActive?: boolean;
  phoneNumber?: string;
  timezone?: string;
  tutorExperience?: string;
  dateOfBirth?: string;
  nationality?: string;
  profession?: string;
  address?: string;
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTutors();
  }, [currentPage, filter, searchTerm]);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/tutors');
      
      // Backend returns array directly, not paginated response
      const tutorsData = response.data || [];
      
      // Apply client-side filtering if needed
      let filteredTutors = tutorsData;
      if (filter !== 'all') {
        filteredTutors = tutorsData.filter((tutor: Tutor) => {
          switch (filter) {
            case 'active':
              return tutor.isActive !== false;
            case 'pending':
              return tutor.invitationStatus === 'pending';
            case 'new':
              const oneMonthAgo = new Date();
              oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
              return new Date(tutor.createdAt) > oneMonthAgo;
            default:
              return true;
          }
        });
      }
      
      // Apply search filter if needed
      if (searchTerm) {
        filteredTutors = filteredTutors.filter((tutor: Tutor) =>
          tutor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tutor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tutor.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply pagination
      const limit = 10;
      const total = filteredTutors.length;
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTutors = filteredTutors.slice(startIndex, endIndex);
      
      setTutors(paginatedTutors);
      setTotalPages(Math.ceil(total / limit));
      setLoading(false);
    } catch (error) {

      setError('Failed to load tutors');
      setTutors([]);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    // fetchTutors will be called by useEffect when searchTerm changes
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const resendInvitation = async (tutorId: string) => {
    try {
      await api.post(`/users/tutors/${tutorId}/resend-invitation`);
      alert('Invitation resent successfully');
    } catch (error) {

      alert('Failed to resend invitation');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${userId}`, { isActive: !currentStatus });
      // Refresh the tutors list
      fetchTutors();
    } catch (error) {

      alert('Failed to update user status');
    }
  };

  if (loading && tutors.length === 0) {
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
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-spicy-dark">Tutors</h1>
          <p className="text-gray-600">Manage all tutors and invitations</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/tutors/invite"
            className="btn-primary bg-white border border-spicy-red text-spicy-red hover:bg-red-50 font-bold py-2 px-4 rounded-lg flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Invite Tutor
          </Link>
          <Link
            href="/dashboard/tutors/new"
            className="btn-primary bg-spicy-red hover:bg-spicy-orange text-white font-bold py-2 px-4 rounded-lg flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Tutor
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'all'
                  ? 'bg-spicy-red text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Tutors
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'active'
                  ? 'bg-spicy-red text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'pending'
                  ? 'bg-spicy-red text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending Invitations
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'new'
                  ? 'bg-spicy-red text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              New (This Month)
            </button>
          </div>
          
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search tutors..."
              className="px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="bg-spicy-red text-white px-4 py-2 rounded-r-lg hover:bg-spicy-orange"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Tutors Table */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tutors.length > 0 ? (
                tutors.map((tutor) => (
                  <tr key={tutor.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-spicy-red flex items-center justify-center text-white font-bold">
                          {tutor.firstName[0]}{tutor.lastName[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {tutor.firstName} {tutor.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tutor.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(tutor.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {tutor.invitationStatus === 'pending' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Invitation Pending
                          </span>
                        ) : tutor.invitationStatus === 'expired' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Invitation Expired
                          </span>
                        ) : (
                          <>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              tutor.isActive !== false
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {tutor.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => toggleUserStatus(tutor.id, tutor.isActive !== false)}
                              className={`text-xs px-2 py-1 rounded ${
                                tutor.isActive !== false
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                              }`}
                            >
                              {tutor.isActive !== false ? 'Deactivate' : 'Activate'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tutor.totalStudents || 0} students
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {tutor.invitationStatus === 'pending' || tutor.invitationStatus === 'expired' ? (
                          <button 
                            onClick={() => resendInvitation(tutor.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Resend Invitation
                          </button>
                        ) : (
                          <>
                            <Link href={`/dashboard/tutors/${tutor.id}`} className="text-spicy-red hover:text-spicy-orange">
                              View
                            </Link>
                            <Link href={`/dashboard/tutors/${tutor.id}/edit`} className="text-blue-600 hover:text-blue-900">
                              Edit
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No tutors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}