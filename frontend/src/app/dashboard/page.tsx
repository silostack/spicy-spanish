'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, these would come from API calls
  const upcomingClasses = [
    {
      id: 1,
      tutorName: 'Maria Garcia',
      date: '2025-04-15T14:00:00',
      duration: 60,
    },
    {
      id: 2,
      tutorName: 'Carlos Rodriguez',
      date: '2025-04-17T15:30:00',
      duration: 90,
    },
  ];

  const courseProgress = [
    {
      id: 1,
      title: 'Spanish for Beginners',
      progress: 60,
      lessons: 10,
      completedLessons: 6,
    },
    {
      id: 2,
      title: 'Conversational Spanish',
      progress: 30,
      lessons: 8,
      completedLessons: 2,
    },
  ];

  const availableHours = 15.5;

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
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
            <span className="text-3xl font-bold text-spicy-red">{availableHours}</span>
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
          {upcomingClasses.length > 0 ? (
            <div>
              <p className="font-medium">{formatDate(upcomingClasses[0].date)}</p>
              <p className="text-gray-600">with {upcomingClasses[0].tutorName}</p>
              <p className="text-sm text-gray-500">{upcomingClasses[0].duration} minutes</p>
              <div className="mt-4">
                <Link href="/dashboard/schedule" className="text-sm text-spicy-red hover:underline">
                  View all scheduled classes
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600">No upcoming classes scheduled</p>
              <div className="mt-4">
                <Link href="/dashboard/schedule" className="text-sm text-spicy-red hover:underline">
                  Schedule a class
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Course Progress */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2 text-spicy-dark">Course Progress</h2>
          {courseProgress.length > 0 ? (
            <div>
              <p className="font-medium">{courseProgress[0].title}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
                <div 
                  className="bg-spicy-red h-2.5 rounded-full" 
                  style={{ width: `${courseProgress[0].progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {courseProgress[0].completedLessons} of {courseProgress[0].lessons} lessons completed
              </p>
              <div className="mt-4">
                <Link href="/dashboard/courses" className="text-sm text-spicy-red hover:underline">
                  Continue learning
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600">No active courses</p>
              <div className="mt-4">
                <Link href="/dashboard/courses" className="text-sm text-spicy-red hover:underline">
                  Browse courses
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Classes Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-spicy-dark">Upcoming Classes</h2>
        
        {upcomingClasses.length > 0 ? (
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
                {upcomingClasses.map((classItem) => (
                  <tr key={classItem.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(classItem.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classItem.tutorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classItem.duration} minutes
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-spicy-red hover:text-spicy-orange transition-colors">
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You don't have any upcoming classes scheduled.</p>
            <Link href="/dashboard/schedule" className="btn-primary inline-block">
              Schedule a Class
            </Link>
          </div>
        )}
        
        {upcomingClasses.length > 0 && (
          <div className="mt-4 text-right">
            <Link href="/dashboard/schedule" className="text-sm text-spicy-red hover:underline">
              View all scheduled classes
            </Link>
          </div>
        )}
      </div>

      {/* Course Progress Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-spicy-dark">Your Courses</h2>
        
        {courseProgress.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courseProgress.map((course) => (
              <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-spicy-red h-2.5 rounded-full" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {course.completedLessons} of {course.lessons} lessons completed
                </p>
                <button className="text-spicy-red hover:underline text-sm">
                  Continue Course
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't been assigned any courses yet.</p>
            <p className="text-sm text-gray-500">
              Courses will be assigned to you after your first class with a tutor.
            </p>
          </div>
        )}
        
        {courseProgress.length > 0 && (
          <div className="mt-6 text-right">
            <Link href="/dashboard/courses" className="text-sm text-spicy-red hover:underline">
              View all courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}