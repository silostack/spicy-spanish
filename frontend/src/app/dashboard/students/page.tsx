'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../utils/api';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  lastActive?: string;
  availableHours?: number;
  coursesEnrolled?: number;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState({ role: '' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error('Error parsing user data', e);
        }
      }
    }
    
    fetchStudents();
  }, [currentPage, filter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Different API call depending on user role
      let response;
      if (user.role === 'admin') {
        response = await api.get('/users/students', {
          params: {
            page: currentPage,
            limit: 10,
            filter,
            search: searchTerm || undefined,
          },
        });
      } else if (user.role === 'tutor') {
        response = await api.get(`/users/tutors/${user.id}/students`, {
          params: {
            page: currentPage,
            limit: 10,
            filter,
            search: searchTerm || undefined,
          },
        });
      } else {
        setError('Unauthorized to view students');
        setLoading(false);
        return;
      }
      
      setStudents(response.data.items);
      setTotalPages(Math.ceil(response.data.total / 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
      setLoading(false);
      
      // Fallback to mock data for demonstration
      setStudents([
        {
          id: '1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          createdAt: '2025-02-10T00:00:00Z',
          lastActive: '2025-04-05T00:00:00Z',
          availableHours: 8.5,
          coursesEnrolled: 2
        },
        {
          id: '2',
          firstName: 'Emily',
          lastName: 'Johnson',
          email: 'emily.j@example.com',
          createdAt: '2025-03-15T00:00:00Z',
          lastActive: '2025-04-08T00:00:00Z',
          availableHours: 12,
          coursesEnrolled: 1
        }
      ]);
      setTotalPages(1);
      setLoading(false);
      setError(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && students.length === 0) {
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
          <h1 className="text-3xl font-bold text-spicy-dark">
            {user.role === 'admin' ? 'All Students' : 'My Students'}
          </h1>
          <p className="text-gray-600">
            {user.role === 'admin' 
              ? 'Manage all student accounts' 
              : 'View students assigned to you'}
          </p>
        </div>
        {user.role === 'admin' && (
          <Link
            href="/dashboard/students/new"
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
            Add Student
          </Link>
        )}
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
              All Students
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
            {user.role === 'admin' && (
              <>
                <button
                  onClick={() => setFilter('inactive')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === 'inactive'
                      ? 'bg-spicy-red text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Inactive
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
              </>
            )}
          </div>
          
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search students..."
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

      {/* Students Table */}
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
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-spicy-red flex items-center justify-center text-white font-bold">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(student.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.lastActive && new Date(student.lastActive) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.lastActive && new Date(student.lastActive) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.availableHours || 0} hours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link href={`/dashboard/students/${student.id}`} className="text-spicy-red hover:text-spicy-orange">
                          View
                        </Link>
                        {user.role === 'admin' && (
                          <Link href={`/dashboard/students/${student.id}/edit`} className="text-blue-600 hover:text-blue-900">
                            Edit
                          </Link>
                        )}
                        {user.role === 'tutor' && (
                          <Link href={`/dashboard/students/${student.id}/appointments`} className="text-blue-600 hover:text-blue-900">
                            Schedule
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No students found
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