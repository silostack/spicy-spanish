'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../utils/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Course, Lesson } from './types';
import ScheduleTab from './ScheduleTab';
import AttendanceTab from './AttendanceTab';
import DetailsTab from './DetailsTab';

export default function CourseViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [needsAttendanceLessons, setNeedsAttendanceLessons] = useState<Lesson[]>([]);

  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonsError, setLessonsError] = useState<string | null>(null);

  const activeTab = searchParams.get('tab') || 'schedule';

  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'schedule') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const qs = params.toString();
    router.replace(`/dashboard/courses/${courseId}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  useEffect(() => {
    fetchCourse();
    fetchScheduleLessons();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data);
    } catch {
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleLessons = async () => {
    try {
      setLessonsLoading(true);
      setLessonsError(null);
      const base = `/scheduling/courses/${courseId}/lessons`;

      const [upcomingRes, needsAttendanceRes] = await Promise.all([
        api.get(`${base}?category=upcoming`),
        api.get(`${base}?category=needs-attendance`),
      ]);

      setUpcomingLessons(upcomingRes.data || []);
      setNeedsAttendanceLessons(needsAttendanceRes.data || []);
    } catch {
      setLessonsError('Failed to load lessons');
    } finally {
      setLessonsLoading(false);
    }
  };

  const handleLessonChanged = () => {
    fetchScheduleLessons();
    fetchCourse();
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

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="text-xl text-red-700 font-semibold">Error</h2>
          <p className="text-red-600">{error ?? 'Course not found'}</p>
          <Link href="/dashboard/courses" className="mt-4 inline-block text-spicy-red hover:underline">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/courses" className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-spicy-dark">{course.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {course.isActive ? 'Active' : 'Inactive'}
              </span>
              {course.needsRenewal && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  Needs Renewal
                </span>
              )}
            </div>
          </div>
        </div>
        {user?.role === 'admin' && (
          <Link
            href={`/dashboard/courses/${courseId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Edit Course
          </Link>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${course.hoursBalance <= 0 ? 'text-red-500' : course.hoursBalance <= 2 ? 'text-orange-500' : 'text-green-600'}`}>
            {Number(course.hoursBalance).toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">hours remaining</span>
        </div>
        <div className="text-sm text-gray-500">
          Tutor: <span className="text-gray-900 font-medium">{course.tutor ? `${course.tutor.firstName} ${course.tutor.lastName}` : '—'}</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <ScheduleTab
            upcomingLessons={upcomingLessons}
            needsAttendanceLessons={needsAttendanceLessons}
            lessonsLoading={lessonsLoading}
            lessonsError={lessonsError}
            userRole={user?.role || ''}
            onLessonChanged={handleLessonChanged}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab courseId={courseId} course={course} />
        </TabsContent>

        <TabsContent value="details">
          <DetailsTab
            course={course}
            courseId={courseId}
            userRole={user?.role || ''}
            onCourseUpdated={setCourse}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
