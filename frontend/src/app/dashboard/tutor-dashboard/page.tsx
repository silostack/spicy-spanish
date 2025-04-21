'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, addDays, isSameDay } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

// Placeholder until the real data is connected
const MOCK_APPOINTMENTS = [
  {
    id: '1',
    student: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    startTime: new Date(2025, 3, 17, 10, 0),
    endTime: new Date(2025, 3, 17, 11, 0),
    status: 'scheduled',
  },
  {
    id: '2',
    student: { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    startTime: new Date(2025, 3, 18, 14, 30),
    endTime: new Date(2025, 3, 18, 15, 30),
    status: 'scheduled',
  },
  {
    id: '3',
    student: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    startTime: new Date(2025, 3, 15, 15, 0),
    endTime: new Date(2025, 3, 15, 16, 0),
    status: 'completed',
  },
  {
    id: '4',
    student: { id: '3', firstName: 'Michael', lastName: 'Johnson', email: 'michael@example.com' },
    startTime: new Date(2025, 3, 14, 11, 0),
    endTime: new Date(2025, 3, 14, 12, 30),
    status: 'completed',
  },
  {
    id: '5',
    student: { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    startTime: new Date(2025, 3, 20, 9, 0),
    endTime: new Date(2025, 3, 20, 10, 0),
    status: 'scheduled',
  },
];

const MOCK_AVAILABILITY = [
  { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', isRecurring: true },
  { id: '2', dayOfWeek: 3, startTime: '14:00', endTime: '17:00', isRecurring: true },
  { id: '3', dayOfWeek: 5, startTime: '10:00', endTime: '15:00', isRecurring: true },
];

export default function TutorDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [availabilities, setAvailabilities] = useState(MOCK_AVAILABILITY);
  const [stats, setStats] = useState({
    totalHours: 0,
    totalEarned: 0,
    totalStudents: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
  });

  useEffect(() => {
    // In a real app, we would fetch this data from the API
    calculateStats();
    calculateWeekDates(selectedDate);
  }, []);

  const calculateWeekDates = (date: Date) => {
    const dates = [];
    // Get the current day of the week (0-6, where 0 is Sunday)
    const currentDay = date.getDay();
    
    // Calculate the date of the previous Sunday (start of the week)
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - currentDay);
    
    // Generate an array of the 7 days of the week
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(startDate, i));
    }
    
    setWeekDates(dates);
  };

  const calculateStats = () => {
    // Calculate total hours taught (from completed appointments)
    const completedAppts = appointments.filter(
      appointment => appointment.status === 'completed'
    );
    
    let totalHours = 0;
    completedAppts.forEach(appointment => {
      const start = new Date(appointment.startTime);
      const end = new Date(appointment.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      totalHours += hours;
    });

    // Calculate earnings (assuming $30/hour - in a real app, this would come from the tutor profile)
    const hourlyRate = 30;
    const totalEarned = totalHours * hourlyRate;

    // Calculate total unique students
    const uniqueStudentIds = new Set(appointments.map(appointment => appointment.student.id));

    // Count upcoming appointments
    const now = new Date();
    const upcomingAppts = appointments.filter(
      appointment => 
        appointment.startTime > now && 
        appointment.status === 'scheduled'
    );

    setStats({
      totalHours,
      totalEarned,
      totalStudents: uniqueStudentIds.size,
      upcomingAppointments: upcomingAppts.length,
      completedAppointments: completedAppts.length,
    });
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(appointment => {
      return isSameDay(new Date(appointment.startTime), date);
    });
  };

  const getAvailabilityForDay = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0-6 (Sunday-Saturday)
    
    return availabilities.filter(availability => {
      // Check if it's a recurring availability for this day of week
      if (availability.isRecurring && availability.dayOfWeek === dayOfWeek) {
        return true;
      }
      
      return false;
    });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">You need to be logged in to view this page</h1>
        <Link 
          href="/login" 
          className="px-4 py-2 bg-spicy-red text-white rounded-md hover:bg-spicy-orange transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-spicy-dark">Tutor Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your teaching schedule.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-1">Total Hours Taught</h2>
          <p className="text-2xl font-bold text-spicy-dark">{stats.totalHours.toFixed(1)}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-1">Total Earned</h2>
          <p className="text-2xl font-bold text-spicy-dark">${stats.totalEarned.toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-1">Students</h2>
          <p className="text-2xl font-bold text-spicy-dark">{stats.totalStudents}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-1">Upcoming Classes</h2>
          <p className="text-2xl font-bold text-spicy-dark">{stats.upcomingAppointments}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-1">Classes Completed</h2>
          <p className="text-2xl font-bold text-spicy-dark">{stats.completedAppointments}</p>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-spicy-dark">Weekly Schedule</h2>
          <div className="flex space-x-4">
            <button 
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 7);
                setSelectedDate(newDate);
                calculateWeekDates(newDate);
              }}
              className="text-spicy-red hover:text-spicy-orange transition-colors"
            >
              Previous Week
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                calculateWeekDates(today);
              }}
              className="px-3 py-1 bg-spicy-red hover:bg-spicy-orange text-white rounded-md text-sm transition-colors"
            >
              Today
            </button>
            <button 
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 7);
                setSelectedDate(newDate);
                calculateWeekDates(newDate);
              }}
              className="text-spicy-red hover:text-spicy-orange transition-colors"
            >
              Next Week
            </button>
          </div>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div key={day} className="text-center font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const isToday = isSameDay(date, new Date());
            const dayAppointments = getAppointmentsForDay(date);
            const dayAvailability = getAvailabilityForDay(date);
            
            return (
              <div 
                key={i} 
                className={`border rounded-lg min-h-[150px] p-2 ${
                  isToday ? 'border-spicy-red bg-spicy-red bg-opacity-5' : ''
                }`}
              >
                <div className="text-right text-sm mb-2">
                  {format(date, 'd')}
                </div>
                
                {/* Show appointments for this day */}
                <div className="space-y-1">
                  {dayAppointments.map((appointment) => (
                    <div 
                      key={appointment.id}
                      className={`text-xs p-1 rounded ${
                        appointment.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {format(new Date(appointment.startTime), 'h:mm a')}: {appointment.student.firstName}
                    </div>
                  ))}
                  
                  {/* Show availability blocks */}
                  {dayAvailability.map((avail) => (
                    <div 
                      key={avail.id}
                      className="text-xs p-1 rounded bg-gray-100 text-gray-800"
                    >
                      {avail.startTime} - {avail.endTime} <span className="text-gray-500">(Available)</span>
                    </div>
                  ))}
                  
                  {dayAppointments.length === 0 && dayAvailability.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-2">
                      No events
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 flex justify-end">
          <Link 
            href="/dashboard/availability" 
            className="text-spicy-red hover:text-spicy-orange transition-colors text-sm"
          >
            Manage availability
          </Link>
        </div>
      </div>

      {/* Upcoming Classes */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-spicy-dark">Upcoming Classes</h2>
          <Link 
            href="/dashboard/schedule" 
            className="text-spicy-red hover:text-spicy-orange transition-colors text-sm"
          >
            View all
          </Link>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
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
              {appointments
                .filter(appointment => {
                  const now = new Date();
                  return appointment.startTime > now && appointment.status === 'scheduled';
                })
                .sort((a, b) => {
                  return a.startTime.getTime() - b.startTime.getTime();
                })
                .slice(0, 5) // Show only the next 5 appointments
                .map((appointment) => {
                  const startTime = new Date(appointment.startTime);
                  const endTime = new Date(appointment.endTime);
                  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
                  
                  return (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {format(startTime, 'EEE, MMM d, yyyy')} at {format(startTime, 'h:mm a')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.student.firstName} {appointment.student.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {durationMinutes} minutes
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          href={`/dashboard/schedule/${appointment.id}`}
                          className="text-spicy-red hover:text-spicy-orange transition-colors mr-3"
                        >
                          Details
                        </Link>
                        <button className="text-gray-600 hover:text-gray-900 transition-colors">
                          Notes
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
              {appointments.filter(appointment => {
                const now = new Date();
                return appointment.startTime > now && appointment.status === 'scheduled';
              }).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No upcoming appointments scheduled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-spicy-dark">Your Students</h2>
          <Link 
            href="/dashboard/students" 
            className="text-spicy-red hover:text-spicy-orange transition-colors text-sm"
          >
            View all
          </Link>
        </div>
        
        {/* Extract unique students from appointments */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(new Set(appointments.map(a => a.student.id)))
            .slice(0, 6) // Show up to 6 students
            .map((studentId) => {
              const student = appointments.find(
                (a) => a.student.id === studentId
              )?.student;

              if (!student) return null;

              // Calculate how many sessions were completed with this student
              const completedSessions = appointments.filter(
                (a) => a.student.id === studentId && a.status === 'completed'
              ).length;
              
              // Calculate total hours with this student
              const totalHoursWithStudent = appointments
                .filter((a) => a.student.id === studentId && a.status === 'completed')
                .reduce((total, appointment) => {
                  const start = new Date(appointment.startTime);
                  const end = new Date(appointment.endTime);
                  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  return total + hours;
                }, 0);

              return (
                <div key={studentId} className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-spicy-red flex items-center justify-center text-white font-bold">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-spicy-dark">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Classes completed:</span>
                      <span className="font-medium">{completedSessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total hours:</span>
                      <span className="font-medium">{totalHoursWithStudent.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <Link 
                      href={`/dashboard/students/${studentId}`}
                      className="text-spicy-red hover:text-spicy-orange transition-colors text-sm"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}