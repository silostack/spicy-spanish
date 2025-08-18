'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useScheduling, useApp } from '../../contexts';

export default function SchedulePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    appointments, 
    tutors, 
    availabilities,
    courses,
    selectedTutor,
    selectedDay,
    selectedTimeSlot,
    selectedCourse,
    isLoading,
    error,
    fetchTutors,
    fetchAppointments,
    fetchTutorAvailability,
    fetchCourses,
    selectTutor,
    selectDay,
    selectTimeSlot,
    selectCourse,
    bookAppointment,
    cancelAppointment
  } = useScheduling();
  const { addNotification } = useApp();
  
  // Local state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{start: string, end: string}[]>([]);
  
  // View appointment details modal
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchCourses();
      if (user.role === 'student' || user.role === 'admin') {
        fetchTutors();
      }
    } else {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (selectedTutor && date) {
      generateAvailableTimeSlots();
    }
  }, [selectedTutor, date, availabilities]);

  const handleTutorChange = (tutorId: string) => {
    const tutor = tutors.find(t => t.id === tutorId);
    if (tutor) {
      selectTutor(tutor);
      fetchTutorAvailability(tutorId);
    }
    setAvailableSlots([]);
  };

  const handleDateChange = (dateStr: string) => {
    setDate(dateStr);
    const selectedDate = new Date(dateStr);
    selectDay(selectedDate);
    setAvailableSlots([]);
  };

  const generateAvailableTimeSlots = () => {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0-6 (Sunday-Saturday)
    
    // Filter availabilities for this day
    const dayAvailabilities = availabilities.filter(avail => 
      (avail.isRecurring && avail.dayOfWeek === dayOfWeek) ||
      (!avail.isRecurring && avail.specificDate && new Date(avail.specificDate).toDateString() === selectedDate.toDateString())
    );
    
    if (dayAvailabilities.length === 0) {
      setAvailableSlots([]);
      return;
    }
    
    // Generate time slots in 30-minute increments based on availability
    const slots: {start: string, end: string}[] = [];
    
    dayAvailabilities.forEach(availability => {
      const [startHour, startMinute] = availability.startTime.split(':').map(Number);
      const [endHour, endMinute] = availability.endTime.split(':').map(Number);
      
      const startDate = new Date(selectedDate);
      startDate.setHours(startHour, startMinute, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(endHour, endMinute, 0, 0);
      
      // Generate slots in 30-minute increments
      const slotDuration = 30; // minutes
      let currentSlotStart = new Date(startDate);
      
      while (currentSlotStart.getTime() + slotDuration * 60 * 1000 <= endDate.getTime()) {
        const slotStart = new Date(currentSlotStart);
        const slotEnd = new Date(currentSlotStart.getTime() + 60 * 60 * 1000); // 1 hour lessons
        
        // Don't add slots that end after the availability end time
        if (slotEnd.getTime() <= endDate.getTime()) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString()
          });
        }
        
        // Move to next slot
        currentSlotStart.setMinutes(currentSlotStart.getMinutes() + slotDuration);
      }
    });
    
    // Filter out slots that conflict with existing appointments
    const tutorId = selectedTutor?.id;
    const filteredSlots = slots.filter(slot => {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();
      
      // Check if this slot conflicts with any existing appointment
      return !appointments.some(appointment => {
        if (appointment.tutor.id !== tutorId || appointment.status === 'cancelled') {
          return false;
        }
        
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
  };

  const handleBookAppointment = async () => {
    if (!selectedTutor || !selectedTimeSlot) {
      setBookingError('Please select a tutor and time slot');
      return;
    }
    
    try {
      await bookAppointment(bookingNotes);
      
      // Reset form and close modal
      setShowBookingForm(false);
      setBookingNotes('');
      setDate('');
      setBookingError(null);
      
      // Show success notification
      addNotification({
        message: 'Lesson booked successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
      setBookingError('Failed to book appointment. Please try again.');
    }
  };

  const handleCancelAppointmentClick = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await cancelAppointment(appointmentId);
        
        if (showAppointmentDetails) {
          setShowAppointmentDetails(false);
        }
        
        // Show success notification
        addNotification({
          message: 'Lesson cancelled successfully',
          type: 'success'
        });
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        addNotification({
          message: 'Failed to cancel lesson',
          type: 'error'
        });
      }
    }
  };

  const handleViewAppointmentDetails = (appointment: any) => {
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

  if (isLoading) {
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
            {user?.role === 'admin' ? 'All Appointments' : 'My Schedule'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'student' 
              ? 'Book and manage your Spanish lessons' 
              : user?.role === 'tutor'
              ? 'View and manage your teaching schedule'
              : 'View and manage all appointments'}
          </p>
        </div>
        
        {user?.role === 'student' && (
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
                  {(user?.role === 'admin' || user?.role === 'tutor') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                  )}
                  {(user?.role === 'admin' || user?.role === 'student') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutor
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
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
                {upcomingAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDateTime(appointment.startTime)}
                    </td>
                    {(user?.role === 'admin' || user?.role === 'tutor') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.student.firstName} {appointment.student.lastName}
                      </td>
                    )}
                    {(user?.role === 'admin' || user?.role === 'student') && (
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
                        <button
                          onClick={() => handleCancelAppointmentClick(appointment.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
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
              {user?.role === 'student' 
                ? "You don't have any upcoming lessons scheduled." 
                : user?.role === 'tutor'
                ? "You don't have any upcoming lessons scheduled."
                : "There are no upcoming lessons scheduled."}
            </p>
            {user?.role === 'student' && (
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
                  {(user?.role === 'admin' || user?.role === 'tutor') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                  )}
                  {(user?.role === 'admin' || user?.role === 'student') && (
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
                    {(user?.role === 'admin' || user?.role === 'tutor') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.student.firstName} {appointment.student.lastName}
                      </td>
                    )}
                    {(user?.role === 'admin' || user?.role === 'student') && (
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
                  value={selectedTutor?.id || ''}
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
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                  Select a Course (Optional)
                </label>
                <select
                  id="course"
                  value={selectedCourse?.id || ''}
                  onChange={(e) => selectCourse(e.target.value ? courses.find(c => c.id === e.target.value) || null : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                >
                  <option value="">-- Select Course (Optional) --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.learningLevel.charAt(0).toUpperCase() + course.learningLevel.slice(1)})
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
                  value={date}
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
                        onClick={() => selectTimeSlot(slot)}
                        className={`py-2 px-3 text-sm font-medium rounded-md ${
                          selectedTimeSlot?.start === slot.start && selectedTimeSlot?.end === slot.end
                            ? 'bg-spicy-red text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : selectedTutor && date ? (
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
                  <button
                    onClick={() => {
                      handleCancelAppointmentClick(selectedAppointment.id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Cancel Lesson
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}