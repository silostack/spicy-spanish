'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

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

interface Course {
  id: string;
  title: string;
  tutor: CourseUser;
  students: CourseUser[];
  schedules: CourseSchedule[];
  startDate: string;
  isActive: boolean;
  hoursBalance: number;
  needsRenewal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateCoursePayload {
  title: string;
  tutorId: string;
  studentIds: string[];
  startDate: string;
  schedules: { dayOfWeek: number; startTime: string; endTime: string }[];
}

interface CoursesContextType {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  fetchCourses: () => Promise<void>;
  fetchCourseById: (id: string) => Promise<void>;
  createCourse: (dto: CreateCoursePayload) => Promise<void>;
  updateCourse: (id: string, dto: Partial<{ title: string; isActive: boolean }>) => Promise<void>;
  addStudent: (courseId: string, studentId: string) => Promise<void>;
  removeStudent: (courseId: string, studentId: string) => Promise<void>;
  addSchedule: (courseId: string, dto: { dayOfWeek: number; startTime: string; endTime: string }) => Promise<void>;
  removeSchedule: (scheduleId: string) => Promise<void>;
  adjustHours: (courseId: string, hours: number) => Promise<void>;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export const CoursesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchCourses = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get('/courses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCourses(response.data);
    } catch {
      setError('Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseById = async (id: string) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get(`/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCurrentCourse(response.data);
    } catch {
      setError('Failed to fetch course details');
    } finally {
      setIsLoading(false);
    }
  };

  const createCourse = async (dto: CreateCoursePayload) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/courses', dto, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCourses((prev) => [...prev, response.data]);
    } catch {
      setError('Failed to create course');
      throw new Error('Failed to create course');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCourse = async (id: string, dto: Partial<{ title: string; isActive: boolean }>) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.patch(`/courses/${id}`, dto, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCourses((prev) => prev.map((c) => (c.id === id ? response.data : c)));
      if (currentCourse?.id === id) {
        setCurrentCourse(response.data);
      }
    } catch {
      setError('Failed to update course');
      throw new Error('Failed to update course');
    } finally {
      setIsLoading(false);
    }
  };

  const addStudent = async (courseId: string, studentId: string) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post(
        `/courses/${courseId}/students`,
        { studentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setCourses((prev) => prev.map((c) => (c.id === courseId ? response.data : c)));
      if (currentCourse?.id === courseId) {
        setCurrentCourse(response.data);
      }
    } catch {
      setError('Failed to add student to course');
      throw new Error('Failed to add student to course');
    } finally {
      setIsLoading(false);
    }
  };

  const removeStudent = async (courseId: string, studentId: string) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.delete(`/courses/${courseId}/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { studentId },
      });
      setCourses((prev) => prev.map((c) => (c.id === courseId ? response.data : c)));
      if (currentCourse?.id === courseId) {
        setCurrentCourse(response.data);
      }
    } catch {
      setError('Failed to remove student from course');
      throw new Error('Failed to remove student from course');
    } finally {
      setIsLoading(false);
    }
  };

  const addSchedule = async (
    courseId: string,
    dto: { dayOfWeek: number; startTime: string; endTime: string },
  ) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post(`/courses/${courseId}/schedules`, dto, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCourses((prev) => prev.map((c) => (c.id === courseId ? response.data : c)));
      if (currentCourse?.id === courseId) {
        setCurrentCourse(response.data);
      }
    } catch {
      setError('Failed to add schedule');
      throw new Error('Failed to add schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSchedule = async (scheduleId: string) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.delete(`/courses/schedules/${scheduleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Refresh current course if loaded to reflect removed schedule
      if (currentCourse) {
        setCurrentCourse((prev) =>
          prev
            ? {
                ...prev,
                schedules: prev.schedules.filter((s) => s.id !== scheduleId),
              }
            : null,
        );
      }
    } catch {
      setError('Failed to remove schedule');
      throw new Error('Failed to remove schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const adjustHours = async (courseId: string, hours: number) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.patch(
        `/courses/${courseId}/hours`,
        { hours },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setCourses((prev) => prev.map((c) => (c.id === courseId ? response.data : c)));
      if (currentCourse?.id === courseId) {
        setCurrentCourse(response.data);
      }
    } catch {
      setError('Failed to adjust hours');
      throw new Error('Failed to adjust hours');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial data if user is logged in
  useEffect(() => {
    if (token) {
      fetchCourses();
    }
  }, [token]);

  return (
    <CoursesContext.Provider
      value={{
        courses,
        currentCourse,
        isLoading,
        error,
        fetchCourses,
        fetchCourseById,
        createCourse,
        updateCourse,
        addStudent,
        removeStudent,
        addSchedule,
        removeSchedule,
        adjustHours,
      }}
    >
      {children}
    </CoursesContext.Provider>
  );
};

export const useCourses = (): CoursesContextType => {
  const context = useContext(CoursesContext);

  if (context === undefined) {
    throw new Error('useCourses must be used within a CoursesProvider');
  }

  return context;
};
