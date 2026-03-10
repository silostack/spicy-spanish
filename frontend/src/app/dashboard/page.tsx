'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface LessonUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface LessonCourse {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  students: LessonUser[];
  tutor: LessonUser;
  course: LessonCourse;
  startTime: string;
  endTime: string;
  status: string;
}

interface CourseSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface CourseInfo {
  id: string;
  title: string;
  tutor: LessonUser;
  students: LessonUser[];
  schedules: CourseSchedule[];
  startDate: string;
  isActive: boolean;
  hoursBalance: number;
  needsRenewal: boolean;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const durationMinutes = (start: string, end: string) =>
  Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60));

// ---------------------------------------------------------------------------
// Admin dashboard (unchanged — already fetches real data)
// ---------------------------------------------------------------------------

interface AdminData {
  users: { totalStudents: number; totalTutors: number; activeStudents: number; newUsersThisMonth: number };
  payments: { totalRevenue: number; revenueThisMonth: number; averagePackageValue: number; totalTransactions: number };
  courses: { totalCourses: number; totalLessons: number; activeCourseAssignments: number; completedLessons: number };
}

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/dashboard-stats')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  if (loading) return <DashboardSpinner />;
  if (error || !data) return <DashboardError message={error ?? 'Unknown error'} />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-spicy-dark">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of Spicy Spanish School.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Users">
          <StatRow label="Total Students" value={data.users.totalStudents} />
          <StatRow label="Total Tutors" value={data.users.totalTutors} />
          <StatRow label="Active Students" value={data.users.activeStudents} />
          <StatRow label="New This Month" value={data.users.newUsersThisMonth} />
          <Link href="/dashboard/students" className="text-sm text-spicy-red hover:underline mt-3 inline-block">Manage Users</Link>
        </StatCard>

        <StatCard title="Payments">
          <StatRow label="Total Revenue" value={fmt(data.payments.totalRevenue)} />
          <StatRow label="This Month" value={fmt(data.payments.revenueThisMonth)} />
          <StatRow label="Avg Package" value={fmt(data.payments.averagePackageValue)} />
          <StatRow label="Transactions" value={data.payments.totalTransactions} />
          <Link href="/dashboard/payments" className="text-sm text-spicy-red hover:underline mt-3 inline-block">Manage Payments</Link>
        </StatCard>

        <StatCard title="Courses">
          <StatRow label="Total Courses" value={data.courses.totalCourses} />
          <StatRow label="Total Lessons" value={data.courses.totalLessons} />
          <StatRow label="Active" value={data.courses.activeCourseAssignments} />
          <StatRow label="Completed" value={data.courses.completedLessons} />
          <Link href="/dashboard/courses" className="text-sm text-spicy-red hover:underline mt-3 inline-block">Manage Courses</Link>
        </StatCard>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-spicy-dark">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction href="/dashboard/students/new" label="Add Student" icon="M12 4v16m8-8H4" />
          <QuickAction href="/dashboard/tutors/invite" label="Invite Tutor" icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          <QuickAction href="/dashboard/courses/new" label="Create Course" icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          <QuickAction href="/dashboard/settings" label="Settings" icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tutor dashboard
// ---------------------------------------------------------------------------

function TutorDashboard({ userId }: { userId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/scheduling/tutors/${userId}/upcoming-lessons`).then((r) => r.data).catch(() => []),
      api.get(`/courses/tutor/${userId}`).then((r) => r.data).catch(() => []),
    ]).then(([lessonData, courseData]) => {
      setLessons(lessonData);
      setCourses(courseData);
    }).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <DashboardSpinner />;

  const activeCourses = courses.filter((c) => c.isActive);
  const totalStudents = new Set(activeCourses.flatMap((c) => c.students.map((s) => s.id))).size;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-spicy-dark">Tutor Dashboard</h1>
        <p className="text-gray-600">Your teaching overview at a glance.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-1">Upcoming Lessons</h2>
          <p className="text-3xl font-bold text-spicy-dark">{lessons.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-1">Active Courses</h2>
          <p className="text-3xl font-bold text-spicy-dark">{activeCourses.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-1">Students</h2>
          <p className="text-3xl font-bold text-spicy-dark">{totalStudents}</p>
        </div>
      </div>

      {/* Upcoming lessons */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-spicy-dark">Upcoming Lessons</h2>
          <Link href="/dashboard/schedule" className="text-sm text-spicy-red hover:underline">View all</Link>
        </div>

        {lessons.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming lessons scheduled.</p>
        ) : (
          <div className="space-y-3">
            {lessons.slice(0, 8).map((lesson) => (
              <div key={lesson.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">{formatDateTime(lesson.startTime)}</div>
                  <div className="text-xs text-gray-500">
                    {lesson.course.title} — {lesson.students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                  </div>
                </div>
                <div className="text-xs text-gray-400">{durationMinutes(lesson.startTime, lesson.endTime)} min</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Courses */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-spicy-dark">Your Courses</h2>
          <Link href="/dashboard/courses" className="text-sm text-spicy-red hover:underline">View all</Link>
        </div>

        {activeCourses.length === 0 ? (
          <p className="text-sm text-gray-500">No active courses assigned.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCourses.map((course) => (
              <Link key={course.id} href={`/dashboard/courses/${course.id}`} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">{course.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {course.students.length} student{course.students.length !== 1 ? 's' : ''}
                  {course.schedules.length > 0 && (
                    <> — {course.schedules.map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}`).join(', ')}</>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-xs font-medium ${course.hoursBalance <= 0 ? 'text-red-500' : course.hoursBalance <= 2 ? 'text-orange-500' : 'text-green-600'}`}>
                    {Number(course.hoursBalance).toFixed(1)}h remaining
                  </span>
                  {course.needsRenewal && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">Needs renewal</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-spicy-dark">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <QuickAction href="/dashboard/schedule" label="Full Schedule" icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          <QuickAction href="/dashboard/availability" label="Manage Availability" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          <QuickAction href="/dashboard/profile" label="My Profile" icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Student dashboard
// ---------------------------------------------------------------------------

function StudentDashboard({ userId }: { userId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/scheduling/students/${userId}/upcoming-lessons`).then((r) => r.data).catch(() => []),
      api.get(`/courses/student/${userId}`).then((r) => r.data).catch(() => []),
    ]).then(([lessonData, courseData]) => {
      setLessons(lessonData);
      setCourses(courseData);
    }).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <DashboardSpinner />;

  const activeCourses = courses.filter((c) => c.isActive);
  const totalHours = activeCourses.reduce((sum, c) => sum + Number(c.hoursBalance), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-spicy-dark">My Dashboard</h1>
        <p className="text-gray-600">Your Spanish learning at a glance.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-1">Hours Remaining</h2>
          <p className={`text-3xl font-bold ${totalHours <= 0 ? 'text-red-500' : totalHours <= 3 ? 'text-orange-500' : 'text-green-600'}`}>
            {totalHours.toFixed(1)}
          </p>
          <p className="text-xs text-gray-400 mt-1">across all courses</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-1">Next Lesson</h2>
          {lessons.length > 0 ? (
            <>
              <p className="text-lg font-bold text-spicy-dark">{formatDateTime(lessons[0].startTime)}</p>
              <p className="text-xs text-gray-500 mt-1">
                with {lessons[0].tutor.firstName} {lessons[0].tutor.lastName}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1">No upcoming lessons</p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-1">Active Courses</h2>
          <p className="text-3xl font-bold text-spicy-dark">{activeCourses.length}</p>
        </div>
      </div>

      {/* Upcoming lessons */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-spicy-dark">Upcoming Lessons</h2>
          <Link href="/dashboard/schedule" className="text-sm text-spicy-red hover:underline">View all</Link>
        </div>

        {lessons.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming lessons scheduled.</p>
        ) : (
          <div className="space-y-3">
            {lessons.slice(0, 8).map((lesson) => (
              <div key={lesson.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">{formatDateTime(lesson.startTime)}</div>
                  <div className="text-xs text-gray-500">
                    {lesson.course.title} — with {lesson.tutor.firstName} {lesson.tutor.lastName}
                  </div>
                </div>
                <div className="text-xs text-gray-400">{durationMinutes(lesson.startTime, lesson.endTime)} min</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Courses */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-spicy-dark">My Courses</h2>
          <Link href="/dashboard/courses" className="text-sm text-spicy-red hover:underline">View all</Link>
        </div>

        {activeCourses.length === 0 ? (
          <p className="text-sm text-gray-500">You are not enrolled in any active courses.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCourses.map((course) => (
              <Link key={course.id} href={`/dashboard/courses/${course.id}`} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">{course.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Tutor: {course.tutor.firstName} {course.tutor.lastName}
                  {course.schedules.length > 0 && (
                    <> — {course.schedules.map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}`).join(', ')}</>
                  )}
                </div>
                <div className="mt-2">
                  <span className={`text-xs font-medium ${Number(course.hoursBalance) <= 0 ? 'text-red-500' : Number(course.hoursBalance) <= 2 ? 'text-orange-500' : 'text-green-600'}`}>
                    {Number(course.hoursBalance).toFixed(1)}h remaining
                  </span>
                  {course.needsRenewal && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">Needs renewal</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared UI pieces
// ---------------------------------------------------------------------------

function DashboardSpinner() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-spicy-red"></div>
      </div>
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-red-50 p-4 rounded-lg">
        <h2 className="text-xl text-red-700 font-semibold">Error</h2>
        <p className="text-red-600">{message}</p>
      </div>
    </div>
  );
}

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 text-spicy-dark">{title}</h2>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-spicy-dark">{value}</p>
    </div>
  );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors">
      <div className="h-10 w-10 mx-auto mb-2 bg-spicy-red rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <h3 className="font-medium text-spicy-dark text-sm">{label}</h3>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Router — pick dashboard by role
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <DashboardSpinner />;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-600">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'tutor') return <TutorDashboard userId={user.id} />;
  return <StudentDashboard userId={user.id} />;
}
