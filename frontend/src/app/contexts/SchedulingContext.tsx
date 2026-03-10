'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
}

interface Availability {
  id: string;
  tutorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate?: string;
}

interface Course {
  id: string;
  title: string;
}

interface Appointment {
  id: string;
  students: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  tutor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course: Course;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: string;
}

interface SchedulingContextType {
  tutors: Tutor[];
  availabilities: Availability[];
  appointments: Appointment[];
  courses: Course[];
  selectedTutor: Tutor | null;
  selectedDay: Date | null;
  selectedTimeSlot: { start: string; end: string } | null;
  selectedCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  fetchTutors: () => Promise<void>;
  fetchTutorAvailability: (tutorId: string) => Promise<void>;
  fetchAppointments: () => Promise<void>;
  fetchCourses: () => Promise<void>;
  selectTutor: (tutor: Tutor) => void;
  selectDay: (day: Date) => void;
  selectTimeSlot: (timeSlot: { start: string; end: string }) => void;
  selectCourse: (course: Course | null) => void;
  bookAppointment: (notes?: string) => Promise<void>;
  cancelAppointment: (appointmentId: string, creditHoursBack: boolean) => Promise<void>;
}

const SchedulingContext = createContext<SchedulingContextType | undefined>(undefined);

export const SchedulingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string } | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { token, user } = useAuth();
  const { addNotification } = useApp();

  const fetchTutors = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/users/tutors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setTutors(response.data);
    } catch (error) {

      setError('Failed to fetch tutors');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTutorAvailability = async (tutorId: string) => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/scheduling/tutors/${tutorId}/availability`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setAvailabilities(response.data);
    } catch (error) {

      setError('Failed to fetch tutor availability');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!token || !user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = '';
      
      if (user.role === 'student') {
        endpoint = `/scheduling/students/${user.id}/lessons`;
      } else if (user.role === 'tutor') {
        endpoint = `/scheduling/tutors/${user.id}/lessons`;
      } else if (user.role === 'admin') {
        endpoint = '/scheduling/lessons';
      }
      
      const response = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setAppointments(response.data);
    } catch (error) {

      setError('Failed to fetch lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const selectTutor = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    fetchTutorAvailability(tutor.id);
  };

  const selectDay = (day: Date) => {
    setSelectedDay(day);
  };

  const fetchCourses = async () => {
    if (!token || !user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = '/courses';
      if (user.role === 'tutor') {
        endpoint = `/courses/tutor/${user.id}`;
      } else if (user.role === 'student') {
        endpoint = `/courses/student/${user.id}`;
      }

      const response = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setCourses(response.data);
    } catch (error) {

      setError('Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  const selectCourse = (course: Course | null) => {
    setSelectedCourse(course);
  };

  const selectTimeSlot = (timeSlot: { start: string; end: string }) => {
    setSelectedTimeSlot(timeSlot);
  };

  const bookAppointment = async (notes?: string) => {
    if (!token || !user || !selectedTutor || !selectedDay || !selectedTimeSlot || !selectedCourse) {
      setError('Missing required booking information');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await api.post('/scheduling/lessons', {
        studentIds: [user.id],
        tutorId: selectedTutor.id,
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        courseId: selectedCourse?.id,
        notes,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Reset selection and refresh appointments
      setSelectedTutor(null);
      setSelectedDay(null);
      setSelectedTimeSlot(null);
      setSelectedCourse(null);
      
      await fetchAppointments();
      
      addNotification({
        message: 'Lesson booked successfully',
        type: 'success',
      });
    } catch (error) {

      setError('Failed to book lesson');
      
      addNotification({
        message: 'Failed to book lesson',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string, creditHoursBack: boolean) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.patch(`/scheduling/lessons/${appointmentId}/cancel`, { creditHoursBack }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh appointments
      await fetchAppointments();
      
      addNotification({
        message: 'Lesson cancelled successfully',
        type: 'success',
      });
    } catch (error) {

      setError('Failed to cancel lesson');
      
      addNotification({
        message: 'Failed to cancel lesson',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial data if user is logged in
  useEffect(() => {
    if (token && user) {
      if (user.role === 'student' || user.role === 'admin') {
        fetchTutors();
      }
      fetchAppointments();
    }
  }, [token, user]);

  return (
    <SchedulingContext.Provider
      value={{
        tutors,
        availabilities,
        appointments,
        courses,
        selectedTutor,
        selectedDay,
        selectedTimeSlot,
        selectedCourse,
        isLoading,
        error,
        fetchTutors,
        fetchTutorAvailability,
        fetchAppointments,
        fetchCourses,
        selectTutor,
        selectDay,
        selectTimeSlot,
        selectCourse,
        bookAppointment,
        cancelAppointment,
      }}
    >
      {children}
    </SchedulingContext.Provider>
  );
};

export const useScheduling = (): SchedulingContextType => {
  const context = useContext(SchedulingContext);
  
  if (context === undefined) {
    throw new Error('useScheduling must be used within a SchedulingProvider');
  }
  
  return context;
};
