'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CourseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CourseSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Course {
  id: string;
  title: string;
  tutor: CourseUser;
  students: CourseUser[];
  schedules: CourseSchedule[];
  startDate: string;
  isActive: boolean;
  hoursBalance: number;
  needsRenewal: boolean;
  createdAt: string;
}

function formatScheduleSlots(schedules: CourseSchedule[]): string {
  if (!schedules || schedules.length === 0) return 'No schedule';
  return schedules
    .map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}-${s.endTime}`)
    .join(', ');
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchCourses();
  }, [currentPage, filter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/courses');

      let allCourses: Course[] = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];

      // Client-side filtering
      if (filter === 'active') {
        allCourses = allCourses.filter((c) => c.isActive);
      } else if (filter === 'inactive') {
        allCourses = allCourses.filter((c) => !c.isActive);
      } else if (filter === 'renewal') {
        allCourses = allCourses.filter((c) => c.needsRenewal);
      }

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        allCourses = allCourses.filter(
          (c) =>
            c.title.toLowerCase().includes(search) ||
            `${c.tutor?.firstName} ${c.tutor?.lastName}`.toLowerCase().includes(search),
        );
      }

      setCourses(allCourses);
      setTotalPages(Math.ceil(allCourses.length / 10));
      setLoading(false);
    } catch (err: unknown) {
      setError('Failed to load courses');
      setCourses([]);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCourses();
  };

  const toggleCourseStatus = async (courseId: string, isActive: boolean) => {
    try {
      await api.patch(`/courses/${courseId}`, {
        isActive: !isActive,
      });

      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === courseId ? { ...course, isActive: !isActive } : course,
        ),
      );
    } catch {
      alert('Failed to update course status');
    }
  };

  if (loading && courses.length === 0) {
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
          <h1 className="text-3xl font-bold text-spicy-dark">Courses</h1>
          <p className="text-gray-600">
            {user?.role === 'admin'
              ? 'Manage all courses and class groups'
              : user?.role === 'tutor'
                ? 'View your assigned courses'
                : 'View your enrolled courses'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <Link
            href="/dashboard/courses/new"
            className="btn-primary bg-spicy-red hover:bg-spicy-orange text-white font-bold py-2 px-4 rounded-lg flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Course
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
              All Courses
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
              onClick={() => setFilter('renewal')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'renewal'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Needs Renewal
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search courses..."
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

      {/* Courses Table or Grid */}
      {user?.role === 'admin' ? (
        // Admin view - Table
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses && courses.length > 0 ? (
                  courses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                        {course.needsRenewal && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                            Renewal Needed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {course.tutor
                          ? `${course.tutor.firstName} ${course.tutor.lastName}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>{course.students?.length ?? 0} student(s)</div>
                        {course.students && course.students.length > 0 && (
                          <div className="text-xs text-gray-400">
                            {course.students
                              .map((s) => `${s.firstName} ${s.lastName}`)
                              .join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatScheduleSlots(course.schedules)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {course.hoursBalance} hrs remaining
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            course.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {course.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/courses/${course.id}`}
                            className="text-spicy-red hover:text-spicy-orange"
                          >
                            View
                          </Link>
                          <Link
                            href={`/dashboard/courses/${course.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => toggleCourseStatus(course.id, course.isActive)}
                            className={
                              course.isActive
                                ? 'text-yellow-600 hover:text-yellow-900'
                                : 'text-green-600 hover:text-green-900'
                            }
                          >
                            {course.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No courses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Student/Tutor view - Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {courses && courses.length > 0 ? (
            courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="h-20 bg-spicy-red flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-spicy-dark">{course.title}</h3>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          course.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {course.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {course.needsRenewal && (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                          Renewal Needed
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Tutor:{' '}
                    {course.tutor
                      ? `${course.tutor.firstName} ${course.tutor.lastName}`
                      : '—'}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    {course.students?.length ?? 0} student(s)
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    {formatScheduleSlots(course.schedules)}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {course.hoursBalance} hrs remaining
                  </p>
                  <Link
                    href={`/dashboard/courses/${course.id}`}
                    className="block w-full text-center py-2 px-4 bg-spicy-red text-white rounded-lg hover:bg-spicy-orange transition-colors"
                  >
                    View Course Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl shadow-md p-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600">
                No courses match your current filters or search terms.
              </p>
            </div>
          )}
        </div>
      )}

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
