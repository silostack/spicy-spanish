'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

type AttendanceStatus = 'present' | 'absent' | 'on_time_cancellation';

interface Appointment {
  id: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tutor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    learningLevel: string;
  };
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
}

interface Attendance {
  id: string;
  appointment: Appointment;
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
  status: AttendanceStatus;
  notes?: string;
  markedByTutor?: boolean;
  markedAt: string;
}

const AttendancePage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, Attendance>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'tutor') {
      fetchAppointments();
    }
  }, [user, selectedDate, filter]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch completed appointments for the selected date
      const response = await api.get('/scheduling/appointments', {
        params: {
          status: 'completed',
          date: selectedDate,
        },
      });

      const appointmentsList = response.data || [];
      setAppointments(appointmentsList);

      // Fetch attendance records for these appointments
      const attendanceMap = new Map<string, Attendance>();
      await Promise.all(
        appointmentsList.map(async (appointment: Appointment) => {
          try {
            const attendanceResponse = await api.get(`/scheduling/attendance/appointment/${appointment.id}`);
            if (attendanceResponse.data) {
              attendanceMap.set(appointment.id, attendanceResponse.data);
            }
          } catch (error) {
            // Attendance not recorded yet
          }
        })
      );

      setAttendanceRecords(attendanceMap);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const markAttendance = async (appointmentId: string, status: AttendanceStatus, notes?: string) => {
    try {
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) return;

      const existingAttendance = attendanceRecords.get(appointmentId);

      if (existingAttendance) {
        // Update existing attendance
        const response = await api.patch(`/scheduling/attendance/${existingAttendance.id}`, {
          status,
          notes,
        });
        
        const updatedAttendance = response.data;
        setAttendanceRecords(prev => new Map(prev.set(appointmentId, updatedAttendance)));
      } else {
        // Create new attendance record
        const response = await api.post('/scheduling/attendance', {
          appointmentId,
          studentId: appointment.student.id,
          status,
          notes,
          markedByTutor: user?.role === 'tutor',
        });

        const newAttendance = response.data;
        setAttendanceRecords(prev => new Map(prev.set(appointmentId, newAttendance)));
      }
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      setError('Failed to mark attendance');
    }
  };

  const getAttendanceStatusColor = (status: AttendanceStatus) => {
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

  const getAttendanceStatusLabel = (status: AttendanceStatus) => {
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
          <p className="text-red-700">Only administrators and tutors can access attendance management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Lessons</option>
                  <option value="marked">Attendance Marked</option>
                  <option value="unmarked">Attendance Not Marked</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Appointments/Lessons Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
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
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                      Loading lessons...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                      No completed lessons found for this date
                    </td>
                  </tr>
                ) : (
                  appointments
                    .filter((appointment) => {
                      const hasAttendance = attendanceRecords.has(appointment.id);
                      if (filter === 'marked') return hasAttendance;
                      if (filter === 'unmarked') return !hasAttendance;
                      return true;
                    })
                    .map((appointment) => {
                      const attendance = attendanceRecords.get(appointment.id);
                      
                      return (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDateTime(appointment.startTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {appointment.student.firstName} {appointment.student.lastName}
                          </td>
                          {user?.role === 'admin' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {appointment.tutor.firstName} {appointment.tutor.lastName}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {appointment.course ? 
                              `${appointment.course.title} (${appointment.course.learningLevel.charAt(0).toUpperCase() + appointment.course.learningLevel.slice(1)})` 
                              : 'No course assigned'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {attendance ? (
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getAttendanceStatusColor(attendance.status)}`}>
                                {getAttendanceStatusLabel(attendance.status)}
                              </span>
                            ) : (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Not Marked
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => markAttendance(appointment.id, 'present')}
                                className={`px-3 py-1 text-xs rounded ${
                                  attendance?.status === 'present'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => markAttendance(appointment.id, 'absent')}
                                className={`px-3 py-1 text-xs rounded ${
                                  attendance?.status === 'absent'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => markAttendance(appointment.id, 'on_time_cancellation')}
                                className={`px-3 py-1 text-xs rounded ${
                                  attendance?.status === 'on_time_cancellation'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                }`}
                              >
                                Cancelled
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;