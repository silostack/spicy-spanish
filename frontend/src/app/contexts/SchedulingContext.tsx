'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';
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
  createdAt: string;
}

interface SchedulingContextType {
  tutors: Tutor[];
  availabilities: Availability[];
  appointments: Appointment[];
  selectedTutor: Tutor | null;
  selectedDay: Date | null;
  selectedTimeSlot: { start: string; end: string } | null;
  isLoading: boolean;
  error: string | null;
  fetchTutors: () => Promise<void>;
  fetchTutorAvailability: (tutorId: string) => Promise<void>;
  fetchAppointments: () => Promise<void>;
  selectTutor: (tutor: Tutor) => void;
  selectDay: (day: Date) => void;
  selectTimeSlot: (timeSlot: { start: string; end: string }) => void;
  bookAppointment: (notes?: string) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
}

const SchedulingContext = createContext<SchedulingContextType | undefined>(undefined);

export const SchedulingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string } | null>(null);
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
      console.error('Error fetching tutors:', error);
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
      console.error('Error fetching tutor availability:', error);
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
        endpoint = `/scheduling/students/${user.id}/appointments`;
      } else if (user.role === 'tutor') {
        endpoint = `/scheduling/tutors/${user.id}/appointments`;
      } else if (user.role === 'admin') {
        endpoint = '/scheduling/appointments';
      }
      
      const response = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to fetch appointments');
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

  const selectTimeSlot = (timeSlot: { start: string; end: string }) => {
    setSelectedTimeSlot(timeSlot);
  };

  const bookAppointment = async (notes?: string) => {
    if (!token || !user || !selectedTutor || !selectedDay || !selectedTimeSlot) {
      setError('Missing required booking information');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Combine date and time for start and end
      const startDate = new Date(selectedDay);
      const endDate = new Date(selectedDay);
      
      const [startHour, startMinute] = selectedTimeSlot.start.split(':').map(Number);
      const [endHour, endMinute] = selectedTimeSlot.end.split(':').map(Number);
      
      startDate.setHours(startHour, startMinute, 0, 0);
      endDate.setHours(endHour, endMinute, 0, 0);
      
      await api.post('/scheduling/appointments', {
        studentId: user.id,
        tutorId: selectedTutor.id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
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
      
      await fetchAppointments();
      
      addNotification({
        message: 'Appointment booked successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Failed to book appointment');
      
      addNotification({
        message: 'Failed to book appointment',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await api.patch(`/scheduling/appointments/${appointmentId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh appointments
      await fetchAppointments();
      
      addNotification({
        message: 'Appointment cancelled successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError('Failed to cancel appointment');
      
      addNotification({
        message: 'Failed to cancel appointment',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial data if user is logged in
  useEffect(() => {
    if (token && user) {
      fetchTutors();
      fetchAppointments();
    }
  }, [token, user]);

  return (
    <SchedulingContext.Provider
      value={{
        tutors,
        availabilities,
        appointments,
        selectedTutor,
        selectedDay,
        selectedTimeSlot,
        isLoading,
        error,
        fetchTutors,
        fetchTutorAvailability,
        fetchAppointments,
        selectTutor,
        selectDay,
        selectTimeSlot,
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