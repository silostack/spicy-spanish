'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

interface Course {
  id: string;
  name: string;
  description: string;
  level: string;
  imageUrl?: string;
  price: number;
  durationWeeks: number;
  lessonCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CourseLesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  content: string;
  materials?: string[];
  createdAt: string;
  updatedAt: string;
}

interface StudentCourse {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: string;
  completionPercentage: number;
  isCompleted: boolean;
  lastAccessed?: string;
  course: Course;
}

interface CoursesContextType {
  courses: Course[];
  studentCourses: StudentCourse[];
  currentCourse: Course | null;
  currentLesson: CourseLesson | null;
  isLoading: boolean;
  error: string | null;
  fetchCourses: () => Promise<void>;
  fetchStudentCourses: () => Promise<void>;
  fetchCourseById: (id: string) => Promise<void>;
  fetchLessonById: (courseId: string, lessonId: string) => Promise<void>;
  enrollInCourse: (courseId: string) => Promise<void>;
  updateLessonProgress: (lessonId: string, isCompleted: boolean) => Promise<void>;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export const CoursesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentCourses = async () => {
    if (!token || !user || user.role !== 'student') return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/courses/student/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setStudentCourses(response.data);
    } catch (error) {
      console.error('Error fetching student courses:', error);
      setError('Failed to fetch your enrolled courses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseById = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/courses/${id}`);
      setCurrentCourse(response.data);
    } catch (error) {
      console.error('Error fetching course details:', error);
      setError('Failed to fetch course details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLessonById = async (courseId: string, lessonId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/courses/${courseId}/lessons/${lessonId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setCurrentLesson(response.data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      setError('Failed to fetch lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!token || !user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await api.post('/courses/enroll', { courseId }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh student courses after enrollment
      await fetchStudentCourses();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError('Failed to enroll in course');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLessonProgress = async (lessonId: string, isCompleted: boolean) => {
    if (!token || !user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await api.patch(`/courses/lessons/${lessonId}/progress`, { isCompleted }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh student courses to update progress
      await fetchStudentCourses();
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      setError('Failed to update lesson progress');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial data if user is logged in
  useEffect(() => {
    if (token && user) {
      fetchCourses();
      if (user.role === 'student') {
        fetchStudentCourses();
      }
    }
  }, [token, user]);

  return (
    <CoursesContext.Provider
      value={{
        courses,
        studentCourses,
        currentCourse,
        currentLesson,
        isLoading,
        error,
        fetchCourses,
        fetchStudentCourses,
        fetchCourseById,
        fetchLessonById,
        enrollInCourse,
        updateLessonProgress,
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