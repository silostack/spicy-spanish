'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../utils/api';

interface DashboardData {
  users: {
    totalStudents: number;
    totalTutors: number;
    activeStudents: number;
    newUsersThisMonth: number;
  };
  payments: {
    totalRevenue: number;
    revenueThisMonth: number;
    averagePackageValue: number;
    totalTransactions: number;
  };
  courses: {
    totalCourses: number;
    totalLessons: number;
    activeCourseAssignments: number;
    completedLessons: number;
  };
}

const defaultData: DashboardData = {
  users: {
    totalStudents: 0,
    totalTutors: 0,
    activeStudents: 0,
    newUsersThisMonth: 0,
  },
  payments: {
    totalRevenue: 0,
    revenueThisMonth: 0,
    averagePackageValue: 0,
    totalTransactions: 0,
  },
  courses: {
    totalCourses: 0,
    totalLessons: 0,
    activeCourseAssignments: 0,
    completedLessons: 0,
  },
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>(defaultData);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState({ role: '' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          if (parsedUser.role === 'admin') {
            fetchAdminDashboardData();
          } else {
            fetchUserDashboardData();
          }
        } catch (e) {
          setLoading(false);
          setError('Error loading user data');
        }
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchAdminDashboardData = async () => {
    try {
      const response = await api.get('/admin/dashboard-stats');
      setData(response.data);
      setLoading(false);
    } catch (error) {
      setError('Error loading dashboard data');
      setLoading(false);
    }
  };

  const fetchUserDashboardData = async () => {
    // This is placeholder for student/tutor dashboard data
    // In a real app, we would fetch different data based on role
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
        </div>
      </div>
    );
  }

  if (user.role === 'admin') {
    // Admin dashboard view
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-spicy-dark">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, Carla! Here's an overview of Spicy Spanish School.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-spicy-dark">Users</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-spicy-dark">{data.users.totalStudents}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Tutors</p>
                <p className="text-2xl font-bold text-spicy-dark">{data.users.totalTutors}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Students</p>
                <p className="text-2xl font-bold text-spicy-dark">{data.users.activeStudents}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">New This Month</p>
                <p className="text-2xl font-bold text-spicy-dark">{data.users.newUsersThisMonth}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/dashboard/students" className="text-sm text-spicy-red hover:underline">
                Manage Users
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-spicy-dark">Payments</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-spicy-dark">{formatCurrency(data.payments.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue This Month</p>
                <p className="text-2xl font-bold text-spicy-dark">{formatCurrency(data.payments.revenueThisMonth)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Package Value</p>
                <p className="text-2xl font-bold text-spicy-dark">{formatCurrency(data.payments.averagePackageValue)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold text-spicy-dark">{data.payments.totalTransactions}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/dashboard/payments" className="text-sm text-spicy-red hover:underline">
                Manage Payments
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-spicy-dark">Courses</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold text-spicy-dark">{data.courses.totalCourses}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Lessons</p>
                <p className="text-2xl font-bold text-spicy-dark">{data.courses.totalLessons}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Assignments</p>
                <p className="text-2xl font-bold text-spicy-dark">{data.courses.activeCourseAssignments}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed Lessons</p>
                <p className="text-2xl font-bold text-spicy-dark">{data.courses.completedLessons}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/dashboard/courses" className="text-sm text-spicy-red hover:underline">
                Manage Courses
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Students */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-spicy-dark">Recent Students</h2>
              <Link href="/dashboard/students" className="text-sm text-spicy-red hover:underline">
                View All
              </Link>
            </div>
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Placeholder recent students - would come from API */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      John Smith
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      john.smith@example.com
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      April 8, 2025
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Emily Johnson
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      emily.j@example.com
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      April 5, 2025
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-spicy-dark">Recent Transactions</h2>
              <Link href="/dashboard/payments" className="text-sm text-spicy-red hover:underline">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Placeholder transactions - would come from API */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Michael Brown
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      $199.00
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      April 9, 2025
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Sarah Wilson
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      $149.00
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      April 7, 2025
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-spicy-dark">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/dashboard/students/new" 
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors"
            >
              <div className="h-10 w-10 mx-auto mb-2 bg-spicy-red rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-medium text-spicy-dark">Add Student</h3>
            </Link>
            
            <Link 
              href="/dashboard/tutors/invite" 
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors"
            >
              <div className="h-10 w-10 mx-auto mb-2 bg-spicy-red rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-spicy-dark">Invite Tutor</h3>
            </Link>
            
            <Link 
              href="/dashboard/courses/new" 
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors"
            >
              <div className="h-10 w-10 mx-auto mb-2 bg-spicy-red rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-medium text-spicy-dark">Create Course</h3>
            </Link>
            
            <Link 
              href="/dashboard/settings" 
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors"
            >
              <div className="h-10 w-10 mx-auto mb-2 bg-spicy-red rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-spicy-dark">Settings</h3>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Student/Tutor dashboard view - this is the default dashboard that was already implemented
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-spicy-dark">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your Spanish learning journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Available Hours */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2 text-spicy-dark">Available Hours</h2>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-spicy-red">15.5</span>
            <span className="ml-2 text-gray-600">hours</span>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/payments" className="text-sm text-spicy-red hover:underline">
              Purchase more hours
            </Link>
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2 text-spicy-dark">Next Class</h2>
          <div>
            <p className="font-medium">Wed, Apr 15, 2:00 PM</p>
            <p className="text-gray-600">with Maria Garcia</p>
            <p className="text-sm text-gray-500">60 minutes</p>
            <div className="mt-4">
              <Link href="/dashboard/schedule" className="text-sm text-spicy-red hover:underline">
                View all scheduled classes
              </Link>
            </div>
          </div>
        </div>

        {/* Course Progress */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2 text-spicy-dark">Course Progress</h2>
          <div>
            <p className="font-medium">Spanish for Beginners</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
              <div 
                className="bg-spicy-red h-2.5 rounded-full" 
                style={{ width: `60%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              6 of 10 lessons completed
            </p>
            <div className="mt-4">
              <Link href="/dashboard/courses" className="text-sm text-spicy-red hover:underline">
                Continue learning
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Classes Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-spicy-dark">Upcoming Classes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Wed, Apr 15, 2:00 PM
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Maria Garcia
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  60 minutes
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-spicy-red hover:text-spicy-orange transition-colors">
                    Details
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Fri, Apr 17, 3:30 PM
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Carlos Rodriguez
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  90 minutes
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-spicy-red hover:text-spicy-orange transition-colors">
                    Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-right">
          <Link href="/dashboard/schedule" className="text-sm text-spicy-red hover:underline">
            View all scheduled classes
          </Link>
        </div>
      </div>
    </div>
  );
}