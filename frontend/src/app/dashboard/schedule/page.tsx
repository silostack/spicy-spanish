'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';

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
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  tutorId: string;
  tutorName: string;
}

export default function SchedulePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  // View appointment details modal
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    // Get the user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        if (parsedUser.role === 'student') {
          fetchStudentAppointments(parsedUser.id);
          fetchAllTutors();
        } else if (parsedUser.role === 'tutor') {
          fetchTutorAppointments(parsedUser.id);
        } else if (parsedUser.role === 'admin') {
          fetchAllAppointments();
          fetchAllTutors();
        } else {
          setError('Invalid user role');
          setLoading(false);
        }
      } catch (e) {
        console.error('Error parsing user data', e);
        setError('Error loading user data');
        setLoading(false);
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchStudentAppointments = async (studentId: string) => {
    try {
      const response = await api.get(`/scheduling/students/${studentId}/appointments`);
      setAppointments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student appointments:', error);
      setError('Failed to load appointments');
      setLoading(false);
      
      // Fallback mock data
      setAppointments([
        {
          id: '1',
          student: {
            id: studentId,
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com'
          },
          tutor: {
            id: '101',
            firstName: 'Maria',
            lastName: 'Garcia',
            email: 'maria.garcia@example.com'
          },
          startTime: '2025-04-15T14:00:00Z',
          endTime: '2025-04-15T15:00:00Z',
          status: 'scheduled'
        },
        {
          id: '2',
          student: {
            id: studentId,
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com'
          },
          tutor: {
            id: '102',
            firstName: 'Carlos',
            lastName: 'Rodriguez',
            email: 'carlos.r@example.com'
          },
          startTime: '2025-04-17T15:30:00Z',
          endTime: '2025-04-17T17:00:00Z',
          status: 'scheduled'
        }
      ]);
      setLoading(false);
      setError(null);
    }
  };

  const fetchTutorAppointments = async (tutorId: string) => {
    try {
      const response = await api.get(`/scheduling/tutors/${tutorId}/appointments`);
      setAppointments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tutor appointments:', error);
      setError('Failed to load appointments');
      setLoading(false);
      
      // Fallback mock data
      setAppointments([
        {
          id: '1',
          student: {
            id: '201',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com'
          },
          tutor: {
            id: tutorId,
            firstName: 'Maria',
            lastName: 'Garcia',
            email: 'maria.garcia@example.com'
          },
          startTime: '2025-04-15T14:00:00Z',
          endTime: '2025-04-15T15:00:00Z',
          status: 'scheduled'
        },
        {
          id: '2',
          student: {
            id: '202',
            firstName: 'Emily',
            lastName: 'Johnson',
            email: 'emily.j@example.com'
          },
          tutor: {
            id: tutorId,
            firstName: 'Maria',
            lastName: 'Garcia',
            email: 'maria.garcia@example.com'
          },
          startTime: '2025-04-16T10:00:00Z',
          endTime: '2025-04-16T11:30:00Z',
          status: 'scheduled'
        }
      ]);
      setLoading(false);
      setError(null);
    }
  };

  const fetchAllAppointments = async () => {
    try {
      const response = await api.get('/scheduling/appointments');
      setAppointments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching all appointments:', error);
      setError('Failed to load appointments');
      setLoading(false);
    }
  };

  const fetchAllTutors = async () => {
    try {
      const response = await api.get('/users/tutors');
      setTutors(response.data.items || response.data);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      
      // Fallback mock data
      setTutors([
        {
          id: '101',
          firstName: 'Maria',
          lastName: 'Garcia',
          email: 'maria.garcia@example.com'
        },
        {
          id: '102',
          firstName: 'Carlos',
          lastName: 'Rodriguez',
          email: 'carlos.r@example.com'
        }
      ]);
    }
  };

  const handleTutorChange = async (tutorId: string) => {
    setSelectedTutor(tutorId);
    setSelectedTimeSlot('');
    
    if (tutorId && selectedDate) {
      await fetchAvailableTimeSlots(tutorId, selectedDate);
    }
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
    
    if (selectedTutor && date) {
      await fetchAvailableTimeSlots(selectedTutor, date);
    }
  };

  const fetchAvailableTimeSlots = async (tutorId: string, date: string) => {
    try {
      const response = await api.get(`/scheduling/tutors/${tutorId}/availability`);
      const availabilities: Availability[] = response.data;
      
      // Calculate available time slots based on tutor's availability and existing appointments
      const selectedDay = new Date(date).getDay();
      const formattedDate = date.split('T')[0]; // Get just the date part
      
      const matchingAvailabilities = availabilities.filter(a => 
        (a.isRecurring && a.dayOfWeek === selectedDay) || 
        (!a.isRecurring && a.specificDate && a.specificDate.startsWith(formattedDate))
      );
      
      if (matchingAvailabilities.length === 0) {
        setAvailableSlots([]);
        return;
      }
      
      // Generate time slots in 30-minute increments based on availability
      const slots: TimeSlot[] = [];
      const tutor = tutors.find(t => t.id === tutorId);
      const tutorName = tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unknown Tutor';
      
      matchingAvailabilities.forEach(availability => {
        const [startHour, startMinute] = availability.startTime.split(':').map(Number);
        const [endHour, endMinute] = availability.endTime.split(':').map(Number);
        
        const startDate = new Date(date);
        startDate.setHours(startHour, startMinute, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(endHour, endMinute, 0, 0);
        
        // Generate slots in 30-minute increments
        const slotDuration = 30; // minutes
        let currentSlotStart = new Date(startDate);
        
        while (currentSlotStart.getTime() + slotDuration * 60 * 1000 <= endDate.getTime()) {
          const slotStart = new Date(currentSlotStart);
          const slotEnd = new Date(currentSlotStart.getTime() + 60 * 60 * 1000); // 1 hour
          
          // Don't add slots that end after the availability end time
          if (slotEnd.getTime() <= endDate.getTime()) {
            slots.push({
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              tutorId,
              tutorName
            });
          }
          
          // Move to next slot
          currentSlotStart.setMinutes(currentSlotStart.getMinutes() + slotDuration);
        }
      });
      
      // Remove slots that conflict with existing appointments
      const tutorAppointmentsResponse = await api.get(`/scheduling/tutors/${tutorId}/appointments`);
      const tutorAppointments: Appointment[] = tutorAppointmentsResponse.data;
      
      const filteredSlots = slots.filter(slot => {
        const slotStart = new Date(slot.startTime).getTime();
        const slotEnd = new Date(slot.endTime).getTime();
        
        // Check if this slot conflicts with any existing appointment
        return !tutorAppointments.some(appointment => {
          const appointmentStart = new Date(appointment.startTime).getTime();
          const appointmentEnd = new Date(appointment.endTime).getTime();
          
          // Check for overlap
          return (
            (slotStart >= appointmentStart && slotStart < appointmentEnd) || // Slot starts during appointment
            (slotEnd > appointmentStart && slotEnd <= appointmentEnd) || // Slot ends during appointment
            (slotStart <= appointmentStart && slotEnd >= appointmentEnd) // Slot contains appointment
          );
        });
      });
      
      setAvailableSlots(filteredSlots);
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      
      // Fallback mock data for demonstration
      const tutor = tutors.find(t => t.id === tutorId);
      const tutorName = tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unknown Tutor';
      const dateObj = new Date(date);
      
      // Generate mock slots
      const mockSlots = [];
      for (let hour = 9; hour < 17; hour++) {
        const slotStart = new Date(dateObj);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(dateObj);
        slotEnd.setHours(hour + 1, 0, 0, 0);
        
        mockSlots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          tutorId,
          tutorName
        });
      }
      
      setAvailableSlots(mockSlots);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedTutor || !selectedTimeSlot) {
      setBookingError('Please select a tutor and time slot');
      return;
    }
    
    const [startTime, endTime] = selectedTimeSlot.split('|');
    
    try {
      await api.post('/scheduling/appointments', {
        studentId: user.id,
        tutorId: selectedTutor,
        startTime,
        endTime,
        notes: bookingNotes || undefined
      });
      
      // Refresh appointments
      if (user.role === 'student') {
        fetchStudentAppointments(user.id);
      }
      
      // Reset form
      setSelectedTutor('');
      setSelectedDate('');
      setSelectedTimeSlot('');
      setBookingNotes('');
      setShowBookingForm(false);
      setBookingError(null);
    } catch (error) {
      console.error('Error booking appointment:', error);
      setBookingError('Failed to book appointment. Please try again.');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await api.patch(`/scheduling/appointments/${appointmentId}/cancel`);
        
        // Refresh appointments
        if (user.role === 'student') {
          fetchStudentAppointments(user.id);
        } else if (user.role === 'tutor') {
          fetchTutorAppointments(user.id);
        } else if (user.role === 'admin') {
          fetchAllAppointments();
        }
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        setError('Failed to cancel appointment');
      }
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    if (window.confirm('Mark this appointment as completed?')) {
      try {
        await api.patch(`/scheduling/appointments/${appointmentId}/complete`);
        
        // Refresh appointments
        if (user.role === 'student') {
          fetchStudentAppointments(user.id);
        } else if (user.role === 'tutor') {
          fetchTutorAppointments(user.id);
        } else if (user.role === 'admin') {
          fetchAllAppointments();
        }
      } catch (error) {
        console.error('Error completing appointment:', error);
        setError('Failed to mark appointment as completed');
      }
    }
  };

  const handleViewAppointmentDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMinutes = (end - start) / (1000 * 60);
    
    if (durationMinutes >= 60) {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`;
    }
    
    return `${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}`;
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

  const upcomingAppointments = appointments.filter(
    appointment => 
      new Date(appointment.startTime) > new Date() && 
      appointment.status === 'scheduled'
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  const pastAppointments = appointments.filter(
    appointment => 
      new Date(appointment.startTime) <= new Date() || 
      appointment.status !== 'scheduled'
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-spicy-dark">
            {user.role === 'admin' ? 'All Appointments' : 'My Schedule'}
          </h1>
          <p className="text-gray-600">
            {user.role === 'student' 
              ? 'Book and manage your Spanish lessons' 
              : user.role === 'tutor'
              ? 'View and manage your teaching schedule'
              : 'View and manage all appointments'}
          </p>
        </div>
        
        {user.role === 'student' && (
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-spicy-red hover:bg-spicy-orange text-white font-bold py-2 px-4 rounded-lg flex items-center"
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
            Book Lesson
          </button>
        )}
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-spicy-dark">Upcoming Lessons</h2>
        
        {upcomingAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  {(user.role === 'admin' || user.role === 'tutor') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                  )}
                  {(user.role === 'admin' || user.role === 'student') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutor
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDateTime(appointment.startTime)}
                    </td>
                    {(user.role === 'admin' || user.role === 'tutor') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.student.firstName} {appointment.student.lastName}
                      </td>
                    )}
                    {(user.role === 'admin' || user.role === 'student') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.tutor.firstName} {appointment.tutor.lastName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calculateDuration(appointment.startTime, appointment.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewAppointmentDetails(appointment)}
                          className="text-spicy-red hover:text-spicy-orange"
                        >
                          Details
                        </button>
                        {/* Students and admins can cancel any appointment */}
                        {(user.role === 'student' || user.role === 'admin') && (
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        )}
                        {/* Tutors can complete and cancel appointments */}
                        {user.role === 'tutor' && (
                          <>
                            <button
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleCompleteAppointment(appointment.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Complete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              {user.role === 'student' 
                ? "You don't have any upcoming lessons scheduled." 
                : user.role === 'tutor'
                ? "You don't have any upcoming lessons scheduled."
                : "There are no upcoming lessons scheduled."}
            </p>
            {user.role === 'student' && (
              <button
                onClick={() => setShowBookingForm(true)}
                className="bg-spicy-red hover:bg-spicy-orange text-white font-medium py-2 px-4 rounded-lg"
              >
                Book a Lesson
              </button>
            )}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-spicy-dark">Past Lessons</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  {(user.role === 'admin' || user.role === 'tutor') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                  )}
                  {(user.role === 'admin' || user.role === 'student') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutor
                    </th>
                  )}
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
                {pastAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDateTime(appointment.startTime)}
                    </td>
                    {(user.role === 'admin' || user.role === 'tutor') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.student.firstName} {appointment.student.lastName}
                      </td>
                    )}
                    {(user.role === 'admin' || user.role === 'student') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.tutor.firstName} {appointment.tutor.lastName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calculateDuration(appointment.startTime, appointment.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : appointment.status === 'no_show'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewAppointmentDetails(appointment)}
                        className="text-spicy-red hover:text-spicy-orange"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Book a Lesson</h2>
            
            {bookingError && (
              <div className="bg-red-50 p-3 rounded-lg mb-4">
                <p className="text-red-600 text-sm">{bookingError}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="tutor" className="block text-sm font-medium text-gray-700 mb-1">
                  Select a Tutor
                </label>
                <select
                  id="tutor"
                  value={selectedTutor}
                  onChange={(e) => handleTutorChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                >
                  <option value="">-- Select Tutor --</option>
                  {tutors.map((tutor) => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.firstName} {tutor.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Select a Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                />
              </div>
              
              {availableSlots.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Time Slots
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTimeSlot(`${slot.startTime}|${slot.endTime}`)}
                        className={`py-2 px-3 text-sm font-medium rounded-md ${
                          selectedTimeSlot === `${slot.startTime}|${slot.endTime}`
                            ? 'bg-spicy-red text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : selectedTutor && selectedDate ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">No available time slots for this tutor on the selected date.</p>
                </div>
              ) : null}
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  placeholder="Any specific topics or questions for this lesson?"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBookAppointment}
                  disabled={!selectedTutor || !selectedTimeSlot}
                  className={`px-4 py-2 rounded-md ${
                    !selectedTutor || !selectedTimeSlot
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-spicy-red text-white hover:bg-spicy-orange'
                  }`}
                >
                  Book Lesson
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showAppointmentDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Lesson Details</h2>
              <button 
                onClick={() => setShowAppointmentDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                <p className="text-base font-medium">{formatDateTime(selectedAppointment.startTime)}</p>
                <p className="text-sm text-gray-600">
                  Duration: {calculateDuration(selectedAppointment.startTime, selectedAppointment.endTime)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Student</h3>
                  <p className="text-base font-medium">
                    {selectedAppointment.student.firstName} {selectedAppointment.student.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedAppointment.student.email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tutor</h3>
                  <p className="text-base font-medium">
                    {selectedAppointment.tutor.firstName} {selectedAppointment.tutor.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedAppointment.tutor.email}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedAppointment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : selectedAppointment.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : selectedAppointment.status === 'no_show'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </span>
                </p>
              </div>
              
              {selectedAppointment.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedAppointment.notes}</p>
                </div>
              )}
              
              {selectedAppointment.status === 'scheduled' && new Date(selectedAppointment.startTime) > new Date() && (
                <div className="flex justify-end space-x-3 mt-6">
                  {/* Students and admins can cancel any appointment */}
                  {(user.role === 'student' || user.role === 'admin') && (
                    <button
                      onClick={() => {
                        handleCancelAppointment(selectedAppointment.id);
                        setShowAppointmentDetails(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Cancel Lesson
                    </button>
                  )}
                  
                  {/* Tutors can cancel and complete appointments */}
                  {user.role === 'tutor' && (
                    <>
                      <button
                        onClick={() => {
                          handleCancelAppointment(selectedAppointment.id);
                          setShowAppointmentDetails(false);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Cancel Lesson
                      </button>
                      <button
                        onClick={() => {
                          handleCompleteAppointment(selectedAppointment.id);
                          setShowAppointmentDetails(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Mark as Completed
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}