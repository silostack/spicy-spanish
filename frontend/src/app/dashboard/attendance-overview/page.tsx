'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

interface AttendanceStats {
  totalAttendance: number;
  presentCount: number;
  absentCount: number;
  onTimeCancellationCount: number;
  attendanceRate: number;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Attendance {
  id: string;
  appointment: {
    id: string;
    student: Student;
    tutor: Tutor;
    startTime: string;
    course?: {
      title: string;
      learningLevel: string;
    };
  };
  student: Student;
  status: 'present' | 'absent' | 'on_time_cancellation';
  notes?: string;
  markedAt: string;
  markedByTutor?: boolean;
}

const AttendanceOverviewPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTutor, setSelectedTutor] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'tutor') {
      fetchInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'tutor') {
      fetchStats();
    }
  }, [selectedStudent, selectedTutor, user]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch students and tutors for filter dropdowns (admin only)
      if (user?.role === 'admin') {
        const [studentsResponse, tutorsResponse] = await Promise.all([
          api.get('/users?role=student'),
          api.get('/users?role=tutor'),
        ]);
        setStudents(studentsResponse.data || []);
        setTutors(tutorsResponse.data || []);
      }

      await fetchStats();
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setError('');
      
      const params: any = {};
      if (selectedStudent) params.studentId = selectedStudent;
      if (selectedTutor) params.tutorId = selectedTutor;
      
      // For tutors, only show their own stats
      if (user?.role === 'tutor' && !selectedTutor) {
        params.tutorId = user.id;
      }

      const statsResponse = await api.get('/scheduling/attendance/stats', { params });
      setStats(statsResponse.data);

      // Fetch recent attendance records
      await fetchRecentAttendance();
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setError('Failed to load attendance statistics');
    }
  };

  const fetchRecentAttendance = async () => {
    try {
      let attendanceData: Attendance[] = [];

      if (selectedStudent) {
        const response = await api.get(`/scheduling/attendance/student/${selectedStudent}`);
        attendanceData = response.data || [];
      } else if (user?.role === 'tutor') {
        // For tutors, fetch their appointments and then attendance
        const appointmentsResponse = await api.get(`/scheduling/tutors/${user.id}/appointments`);
        const appointments = appointmentsResponse.data || [];
        
        // Get attendance for completed appointments
        const attendancePromises = appointments
          .filter((apt: any) => apt.status === 'completed')
          .slice(0, 10) // Limit to recent 10
          .map(async (apt: any) => {
            try {
              const attendanceResponse = await api.get(`/scheduling/attendance/appointment/${apt.id}`);
              return attendanceResponse.data;
            } catch {
              return null;
            }
          });
        
        const attendanceResults = await Promise.all(attendancePromises);
        attendanceData = attendanceResults.filter(Boolean);
      } else if (user?.role === 'admin') {
        // For admin, we'd need a general endpoint - for now, show message
        attendanceData = [];
      }

      setRecentAttendance(attendanceData.slice(0, 10));
    } catch (error: any) {
      console.error('Error fetching recent attendance:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'on_time_cancellation':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'on_time_cancellation':
        return 'On-time Cancellation';
      default:
        return 'Unknown';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (user?.role !== 'admin' && user?.role !== 'tutor') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Access Denied</h3>
          <p className="text-red-700">Only administrators and tutors can access attendance overview.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Overview</h1>
        <p className="text-gray-600">Track student attendance patterns and statistics</p>
      </div>

      {/* Filters - Admin Only */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Student
              </label>
              <select
                id="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tutor" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Tutor
              </label>
              <select
                id="tutor"
                value={selectedTutor}
                onChange={(e) => setSelectedTutor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tutors</option>
                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.firstName} {tutor.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Lessons
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalAttendance}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Present
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.presentCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Absent
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.absentCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Attendance Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.attendanceRate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Rate Visual */}
      {stats && stats.totalAttendance > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Attendance Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-600">Present</span>
              <span className="text-sm text-gray-500">
                {stats.presentCount} ({((stats.presentCount / stats.totalAttendance) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${(stats.presentCount / stats.totalAttendance) * 100}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-600">Absent</span>
              <span className="text-sm text-gray-500">
                {stats.absentCount} ({((stats.absentCount / stats.totalAttendance) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full" 
                style={{ width: `${(stats.absentCount / stats.totalAttendance) * 100}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-600">On-time Cancellation</span>
              <span className="text-sm text-gray-500">
                {stats.onTimeCancellationCount} ({((stats.onTimeCancellationCount / stats.totalAttendance) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${(stats.onTimeCancellationCount / stats.totalAttendance) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Attendance Records */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Attendance Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutor
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marked By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                    Loading attendance records...
                  </td>
                </tr>
              ) : recentAttendance.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                recentAttendance.map((attendance) => (
                  <tr key={attendance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDateTime(attendance.appointment.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attendance.student.firstName} {attendance.student.lastName}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {attendance.appointment.tutor.firstName} {attendance.appointment.tutor.lastName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attendance.appointment.course ? 
                        `${attendance.appointment.course.title} (${attendance.appointment.course.learningLevel.charAt(0).toUpperCase() + attendance.appointment.course.learningLevel.slice(1)})` 
                        : 'No course assigned'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(attendance.status)}`}>
                        {getStatusLabel(attendance.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attendance.markedByTutor ? 'Tutor' : 'Admin'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceOverviewPage;