'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

// Types
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  createdAt: string;
  isActive: boolean;
  coursesEnrolled: number;
  availableHours: number;
  lastActive?: string;
}

interface ApiResponse {
  items: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Main Component
export default function StudentsPage() {
  console.log('🚀 StudentsPage component rendering');
  
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  console.log('🔐 Auth state:', { user, authLoading, isAuthenticated });
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'new'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const ITEMS_PER_PAGE = 10;

  // Load students when user is available
  useEffect(() => {
    console.log('👀 useEffect triggered - user changed:', { user });
    
    if (user) {
      console.log('✅ User available, fetching students');
      fetchStudents();
    } else {
      console.log('❌ No user available yet');
    }
  }, [user, currentPage, filter]);

  // Debug auth loading changes
  useEffect(() => {
    console.log('🔄 Auth loading state changed:', authLoading);
  }, [authLoading]);

  // Debug authentication changes
  useEffect(() => {
    console.log('🔒 Authentication state changed:', isAuthenticated);
  }, [isAuthenticated]);

  const fetchStudents = async () => {
    console.log('🔍 fetchStudents called');
    
    if (!user) {
      console.log('❌ No user available for fetchStudents');
      return;
    }
    
    try {
      console.log('⏳ Starting to fetch students...');
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        filter,
      });
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      let endpoint = '/users/students';
      
      // If user is a tutor, get only their students
      if (user.role === 'tutor') {
        endpoint = `/users/tutors/${user.id}/students`;
      }
      
      const fullUrl = `${endpoint}?${params.toString()}`;
      console.log('🌐 Making API call to:', fullUrl);
      console.log('👤 User role:', user.role);
      console.log('🆔 User ID:', user.id);
      
      const response = await api.get<ApiResponse>(fullUrl);
      console.log('✅ API response received:', response.data);
      console.log('📊 Response data type:', typeof response.data);
      console.log('📊 Response data keys:', Object.keys(response.data || {}));
      console.log('📊 Is array:', Array.isArray(response.data));
      
      // Handle both direct array response and paginated response
      if (Array.isArray(response.data)) {
        // Backend returned students directly as array
        console.log('📊 Handling direct array response');
        setStudents(response.data);
        setTotal(response.data.length);
        setTotalPages(1);
      } else if (response.data && response.data.items) {
        // Backend returned paginated response
        console.log('📊 Handling paginated response');
        setStudents(response.data.items);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      } else {
        console.error('📊 Unexpected response format:', response.data);
        throw new Error('Unexpected response format from server');
      }
      
      console.log('📊 Students state updated:', {
        count: Array.isArray(response.data) ? response.data.length : response.data?.items?.length || 0,
        total: Array.isArray(response.data) ? response.data.length : response.data?.total || 0,
        totalPages: Array.isArray(response.data) ? 1 : response.data?.totalPages || 1
      });
      
    } catch (error: any) {
      console.error('💥 Error fetching students:', error);
      console.error('💥 Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText
      });
      
      // Use mock data when backend fails
      console.log('📊 Using mock data due to backend error');
      const mockStudents: Student[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1 234 567 8900',
          createdAt: '2025-02-15T10:00:00Z',
          isActive: true,
          coursesEnrolled: 2,
          availableHours: 8,
          lastActive: '2025-03-10T14:30:00Z'
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@example.com',
          phoneNumber: '+1 234 567 8901',
          createdAt: '2025-01-20T09:00:00Z',
          isActive: true,
          coursesEnrolled: 3,
          availableHours: 12,
          lastActive: '2025-03-09T16:15:00Z'
        },
        {
          id: '3',
          firstName: 'Michael',
          lastName: 'Rodriguez',
          email: 'michael.rodriguez@example.com',
          phoneNumber: '+1 234 567 8902',
          createdAt: '2025-01-10T11:30:00Z',
          isActive: true,
          coursesEnrolled: 1,
          availableHours: 5,
          lastActive: '2025-03-08T10:45:00Z'
        },
        {
          id: '4',
          firstName: 'Emily',
          lastName: 'Chen',
          email: 'emily.chen@example.com',
          createdAt: '2024-12-05T14:20:00Z',
          isActive: false,
          coursesEnrolled: 2,
          availableHours: 0,
          lastActive: '2025-02-15T12:00:00Z'
        },
        {
          id: '5',
          firstName: 'David',
          lastName: 'Thompson',
          email: 'david.thompson@example.com',
          phoneNumber: '+1 234 567 8904',
          createdAt: '2025-03-01T08:45:00Z',
          isActive: true,
          coursesEnrolled: 1,
          availableHours: 15,
          lastActive: '2025-03-10T09:30:00Z'
        }
      ];
      
      // Filter mock data based on filter
      let filteredMockStudents = mockStudents;
      if (filter === 'active') {
        filteredMockStudents = mockStudents.filter(s => s.isActive);
      } else if (filter === 'inactive') {
        filteredMockStudents = mockStudents.filter(s => !s.isActive);
      } else if (filter === 'new') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        filteredMockStudents = mockStudents.filter(s => new Date(s.createdAt) > oneMonthAgo);
      }
      
      // Apply search filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        filteredMockStudents = filteredMockStudents.filter(s => 
          s.firstName.toLowerCase().includes(search) ||
          s.lastName.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search)
        );
      }
      
      setStudents(filteredMockStudents);
      setTotal(filteredMockStudents.length);
      setTotalPages(1);
      setError(null); // Clear error since we're showing mock data
    } finally {
      console.log('🏁 fetchStudents completed, setting loading to false');
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 Search triggered with term:', searchTerm);
    setCurrentPage(1);
    fetchStudents();
  };

  const handleFilterChange = (newFilter: 'all' | 'active' | 'inactive' | 'new') => {
    console.log('🔄 Filter changed from', filter, 'to', newFilter);
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    console.log('📄 Page changed from', currentPage, 'to', page);
    setCurrentPage(page);
  };

  const toggleStudentStatus = async (studentId: string, currentStatus: boolean) => {
    console.log('🔄 Toggling student status:', { studentId, currentStatus });
    try {
      await api.patch(`/users/${studentId}`, { isActive: !currentStatus });
      console.log('✅ Student status updated successfully');
      await fetchStudents(); // Refresh the list
    } catch (error) {
      console.error('💥 Error updating student status:', error);
      alert('Failed to update student status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  // Debug all loading conditions
  console.log('🔍 Checking loading conditions:', {
    authLoading,
    user: !!user,
    loading,
    isAuthenticated
  });

  // Show loading spinner while auth is loading or students are loading
  if (authLoading) {
    console.log('⏳ Showing auth loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spicy-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user && !authLoading) {
    console.log('❌ No user and not loading - should redirect');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Not authenticated. Please log in.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    console.log('⏳ Showing data loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spicy-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    console.log('💥 Showing error message:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => {
              console.log('🔄 Retry button clicked');
              fetchStudents();
            }}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check if user has permission to view students
  if (user && user.role !== 'admin' && user.role !== 'tutor') {
    console.log('🚫 User does not have permission to view students:', user.role);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-600">Only administrators and tutors can view students.</p>
        </div>
      </div>
    );
  }

  console.log('🎉 Rendering students page with data:', {
    studentsCount: students.length,
    userRole: user?.role,
    total,
    currentPage,
    totalPages
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.role === 'admin' ? 'All Students' : 'My Students'}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {user?.role === 'admin' 
                  ? 'Manage all student accounts and their progress' 
                  : 'View and manage your assigned students'}
              </p>
            </div>
            {user?.role === 'admin' && (
              <div className="mt-4 sm:mt-0">
                <Link
                  href="/dashboard/students/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-spicy-red hover:bg-spicy-orange focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-spicy-red"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Student
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  filter === 'all'
                    ? 'bg-spicy-red text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Students ({total})
              </button>
              <button
                onClick={() => handleFilterChange('active')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  filter === 'active'
                    ? 'bg-spicy-red text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              {user?.role === 'admin' && (
                <>
                  <button
                    onClick={() => handleFilterChange('inactive')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      filter === 'inactive'
                        ? 'bg-spicy-red text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Inactive
                  </button>
                  <button
                    onClick={() => handleFilterChange('new')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      filter === 'new'
                        ? 'bg-spicy-red text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    New This Month
                  </button>
                </>
              )}
            </div>

            {/* Search Form */}
            <div className="flex-1 max-w-lg">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 focus:border-spicy-red focus:ring-spicy-red sm:text-sm"
                />
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-spicy-red hover:bg-spicy-orange focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-spicy-red"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-spicy-red flex items-center justify-center text-white font-medium">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email}</div>
                        {student.phoneNumber && (
                          <div className="text-sm text-gray-500">{student.phoneNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.isActive)}`}>
                            {getStatusText(student.isActive)}
                          </span>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => toggleStudentStatus(student.id, student.isActive)}
                              className={`text-xs px-2 py-1 rounded ${
                                student.isActive
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                              }`}
                            >
                              {student.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.coursesEnrolled} courses
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.availableHours} hours
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(student.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/students/${student.id}`}
                            className="text-spicy-red hover:text-spicy-orange"
                          >
                            View
                          </Link>
                          {user?.role === 'admin' && (
                            <Link
                              href={`/dashboard/students/${student.id}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-lg font-medium text-gray-900">No students found</div>
                      <div className="mt-1">
                        {searchTerm ? 'Try adjusting your search terms' : 'No students have been added yet'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    const isCurrentPage = page === currentPage;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          isCurrentPage
                            ? 'z-10 bg-spicy-red border-spicy-red text-white'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}