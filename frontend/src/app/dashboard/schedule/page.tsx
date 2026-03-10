'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useScheduling, useApp } from '../../contexts';
import api from '../../utils/api';

// ---------------------------------------------------------------------------
// Shared types & helpers
// ---------------------------------------------------------------------------

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CourseSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface CourseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CourseInfo {
  id: string;
  title: string;
  tutor: CourseUser;
  students: CourseUser[];
  schedules: CourseSchedule[];
  startDate: string;
  isActive: boolean;
  hoursBalance: number;
  needsRenewal: boolean;
}

interface LessonInfo {
  id: string;
  students: CourseUser[];
  tutor: CourseUser;
  course: { id: string; title: string };
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

const calcDuration = (startTime: string, endTime: string) => {
  const mins = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  }
  return `${mins}m`;
};

const statusBadge = (status: string) => {
  if (status === 'completed') return 'bg-green-100 text-green-700';
  if (status === 'cancelled') return 'bg-gray-200 text-gray-600';
  if (status === 'no_show') return 'bg-red-100 text-red-700';
  return 'bg-blue-100 text-blue-700';
};

// ---------------------------------------------------------------------------
// Student schedule — combined course info + lessons
// ---------------------------------------------------------------------------

function StudentSchedule({ userId }: { userId: string }) {
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [lessonsByCourse, setLessonsByCourse] = useState<Record<string, LessonInfo[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const coursesRes = await api.get(`/courses/student/${userId}`);
      const studentCourses: CourseInfo[] = coursesRes.data || [];
      setCourses(studentCourses);

      // Fetch lessons per course
      const entries = await Promise.all(
        studentCourses.map(async (course) => {
          try {
            const res = await api.get(`/scheduling/courses/${course.id}/lessons`);
            return [course.id, res.data || []] as const;
          } catch {
            return [course.id, []] as const;
          }
        }),
      );
      setLessonsByCourse(Object.fromEntries(entries));
    } catch {
      setError('Failed to load your schedule');
    } finally {
      setLoading(false);
    }
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
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-spicy-dark mb-2">My Lessons</h1>
        <p className="text-gray-600 mb-8">Your Spanish learning schedule.</p>
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-500">You are not enrolled in any courses yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-spicy-dark mb-2">My Lessons</h1>
      <p className="text-gray-600 mb-8">Your Spanish learning schedule.</p>

      {courses.map((course) => {
        const lessons = lessonsByCourse[course.id] || [];
        const now = new Date();
        const upcoming = lessons
          .filter((l) => l.status === 'scheduled' && new Date(l.startTime) > now)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        const past = lessons
          .filter((l) => l.status !== 'scheduled' || new Date(l.startTime) <= now)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        return (
          <div key={course.id} className="mb-10">
            {/* Course header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-spicy-dark">{course.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    with {course.tutor.firstName} {course.tutor.lastName}
                  </p>
                  {course.schedules.length > 0 && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {course.schedules
                        .map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}–${s.endTime}`)
                        .join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${Number(course.hoursBalance) <= 0 ? 'text-red-500' : Number(course.hoursBalance) <= 2 ? 'text-orange-500' : 'text-green-600'}`}>
                      {Number(course.hoursBalance).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">hours left</div>
                  </div>
                  {course.needsRenewal && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                      Needs Renewal
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming lessons */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-4">
              <h3 className="text-lg font-semibold text-spicy-dark mb-4">Upcoming Lessons</h3>
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming lessons scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{formatDateTime(lesson.startTime)}</div>
                        <div className="text-xs text-gray-500">{calcDuration(lesson.startTime, lesson.endTime)} lesson</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(lesson.status)}`}>
                        Scheduled
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past lessons */}
            {past.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-spicy-dark mb-4">Past Lessons</h3>
                <div className="space-y-3">
                  {past.slice(0, 10).map((lesson) => (
                    <div key={lesson.id} className={`flex items-center justify-between border rounded-lg p-4 ${lesson.status === 'cancelled' ? 'opacity-60 bg-gray-50 border-gray-200' : 'border-gray-100'}`}>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{formatDateTime(lesson.startTime)}</div>
                        <div className="text-xs text-gray-500">{calcDuration(lesson.startTime, lesson.endTime)} lesson</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(lesson.status)}`}>
                        {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin / Tutor schedule (original behavior, minus student-specific bits)
// ---------------------------------------------------------------------------

function StaffSchedule() {
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
    cancelAppointment,
  } = useScheduling();
  const { addNotification } = useApp();

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState<string | null>(null);
  const [cancelAppointmentTime, setCancelAppointmentTime] = useState<string>('');
  const [cancelDebitHours, setCancelDebitHours] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchCourses();
      if (user.role === 'admin') {
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
    const tutor = tutors.find((t) => t.id === tutorId);
    if (tutor) {
      selectTutor(tutor);
      fetchTutorAvailability(tutorId);
    }
    setAvailableSlots([]);
  };

  const handleDateChange = (dateStr: string) => {
    setDate(dateStr);
    selectDay(new Date(dateStr));
    setAvailableSlots([]);
  };

  const generateAvailableTimeSlots = () => {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    const dayAvailabilities = availabilities.filter(
      (avail) =>
        (avail.isRecurring && avail.dayOfWeek === dayOfWeek) ||
        (!avail.isRecurring &&
          avail.specificDate &&
          new Date(avail.specificDate).toDateString() === selectedDate.toDateString()),
    );

    if (dayAvailabilities.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const slots: { start: string; end: string }[] = [];

    dayAvailabilities.forEach((availability) => {
      const [startHour, startMinute] = availability.startTime.split(':').map(Number);
      const [endHour, endMinute] = availability.endTime.split(':').map(Number);

      const startDate = new Date(selectedDate);
      startDate.setHours(startHour, startMinute, 0, 0);

      const endDate = new Date(selectedDate);
      endDate.setHours(endHour, endMinute, 0, 0);

      const slotDuration = 30;
      const currentSlotStart = new Date(startDate);

      while (currentSlotStart.getTime() + slotDuration * 60 * 1000 <= endDate.getTime()) {
        const slotStart = new Date(currentSlotStart);
        const slotEnd = new Date(currentSlotStart.getTime() + 60 * 60 * 1000);

        if (slotEnd.getTime() <= endDate.getTime()) {
          slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
        }

        currentSlotStart.setMinutes(currentSlotStart.getMinutes() + slotDuration);
      }
    });

    const tutorId = selectedTutor?.id;
    const filteredSlots = slots.filter((slot) => {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();

      return !appointments.some((appointment) => {
        if (appointment.tutor.id !== tutorId || appointment.status === 'cancelled') return false;
        const aStart = new Date(appointment.startTime).getTime();
        const aEnd = new Date(appointment.endTime).getTime();
        return (
          (slotStart >= aStart && slotStart < aEnd) ||
          (slotEnd > aStart && slotEnd <= aEnd) ||
          (slotStart <= aStart && slotEnd >= aEnd)
        );
      });
    });

    setAvailableSlots(filteredSlots);
  };

  const handleBookAppointment = async () => {
    if (!selectedTutor || !selectedTimeSlot || !selectedCourse) {
      setBookingError('Please select a tutor, course, and time slot');
      return;
    }

    try {
      await bookAppointment(bookingNotes);
      setShowBookingForm(false);
      setBookingNotes('');
      setDate('');
      setBookingError(null);
      addNotification({ message: 'Lesson booked successfully!', type: 'success' });
    } catch {
      setBookingError('Failed to book lesson. Please try again.');
    }
  };

  const handleCancelAppointmentClick = (appointmentId: string, startTime: string) => {
    setCancelAppointmentId(appointmentId);
    setCancelAppointmentTime(startTime);
    setCancelDebitHours(false);
    setShowCancelModal(true);
  };

  const submitCancelAppointment = async () => {
    if (!cancelAppointmentId) return;

    setCancelLoading(true);
    try {
      await cancelAppointment(cancelAppointmentId, !cancelDebitHours);
      setShowCancelModal(false);
      setCancelAppointmentId(null);
      if (showAppointmentDetails) setShowAppointmentDetails(false);
      addNotification({ message: 'Lesson cancelled successfully', type: 'success' });
    } catch {
      addNotification({ message: 'Failed to cancel lesson', type: 'error' });
    } finally {
      setCancelLoading(false);
    }
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

  const now = new Date();
  const upcomingAppointments = appointments
    .filter((a) => new Date(a.startTime) > now && a.status === 'scheduled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const pastAppointments = appointments
    .filter((a) => new Date(a.startTime) <= now || a.status !== 'scheduled')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-spicy-dark">
            {user?.role === 'admin' ? 'All Lessons' : 'My Schedule'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'tutor' ? 'View and manage your teaching schedule' : 'View and manage all lessons'}
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-spicy-red hover:bg-spicy-orange text-white font-bold py-2 px-4 rounded-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Book Lesson
          </button>
        )}
      </div>

      {/* Upcoming Lessons */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-spicy-dark">Upcoming Lessons</h2>

        {upcomingAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  {(user?.role === 'admin' || user?.role === 'tutor') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  )}
                  {user?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                        {appointment.students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                      </td>
                    )}
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.tutor.firstName} {appointment.tutor.lastName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appointment.course.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calcDuration(appointment.startTime, appointment.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowAppointmentDetails(true);
                          }}
                          className="text-spicy-red hover:text-spicy-orange"
                        >
                          Details
                        </button>
                        <button onClick={() => handleCancelAppointmentClick(appointment.id, appointment.startTime)} className="text-red-600 hover:text-red-900">
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
            <p className="text-gray-600">No upcoming lessons scheduled.</p>
          </div>
        )}
      </div>

      {/* Past Lessons */}
      {pastAppointments.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-spicy-dark">Past Lessons</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  {(user?.role === 'admin' || user?.role === 'tutor') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  )}
                  {user?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                        {appointment.students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                      </td>
                    )}
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.tutor.firstName} {appointment.tutor.lastName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calcDuration(appointment.startTime, appointment.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowAppointmentDetails(true);
                        }}
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

      {/* Booking Modal (admin only) */}
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
                <label htmlFor="tutor" className="block text-sm font-medium text-gray-700 mb-1">Select a Tutor</label>
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
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">Select a Course</label>
                <select
                  id="course"
                  value={selectedCourse?.id || ''}
                  onChange={(e) => selectCourse(e.target.value ? courses.find((c) => c.id === e.target.value) || null : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Select a Date</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Time Slots</label>
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
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  id="notes"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  placeholder="Any specific topics or questions for this lesson?"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowBookingForm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBookAppointment}
                  disabled={!selectedTutor || !selectedTimeSlot || !selectedCourse}
                  className={`px-4 py-2 rounded-md ${
                    !selectedTutor || !selectedTimeSlot || !selectedCourse
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

      {/* Lesson Details Modal */}
      {showAppointmentDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Lesson Details</h2>
              <button onClick={() => setShowAppointmentDetails(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                <p className="text-base font-medium">{formatDateTime(selectedAppointment.startTime)}</p>
                <p className="text-sm text-gray-600">Duration: {calcDuration(selectedAppointment.startTime, selectedAppointment.endTime)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Student</h3>
                  <p className="text-base font-medium">
                    {selectedAppointment.students?.map((s: any) => `${s.firstName} ${s.lastName}`).join(', ')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tutor</h3>
                  <p className="text-base font-medium">{selectedAppointment.tutor.firstName} {selectedAppointment.tutor.lastName}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(selectedAppointment.status)}`}>
                  {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1).replace('_', ' ')}
                </span>
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
                    onClick={() => handleCancelAppointmentClick(selectedAppointment.id, selectedAppointment.startTime)}
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

      {/* Cancel Lesson Modal */}
      {showCancelModal && cancelAppointmentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-spicy-dark">Cancel Lesson</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-gray-500 hover:text-gray-700">
                Close
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel the lesson on{' '}
              <span className="font-medium">{formatDateTime(cancelAppointmentTime)}</span>?
            </p>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={cancelDebitHours}
                onChange={(e) => setCancelDebitHours(e.target.checked)}
              />
              Debit hours from student
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm"
              >
                Go Back
              </button>
              <button
                onClick={submitCancelAppointment}
                disabled={cancelLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export default function SchedulePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-spicy-red"></div>
        </div>
      </div>
    );
  }

  if (user?.role === 'student') {
    return <StudentSchedule userId={user.id} />;
  }

  return <StaffSchedule />;
}
