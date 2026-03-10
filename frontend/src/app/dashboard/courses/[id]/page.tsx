'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../utils/api';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CourseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CourseSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
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
}

interface Lesson {
  id: string;
  students: CourseUser[];
  tutor: CourseUser;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

interface AttendanceRecord {
  id: string;
  student: CourseUser;
  status: 'present' | 'absent';
}

interface ClassReport {
  id: string;
  subject: string;
  content: string;
  homeworkAssigned?: string;
  studentProgress?: string;
  nextLessonNotes?: string;
}

type AttendanceDraft = Record<string, 'present' | 'absent'>;

export default function CourseViewPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonAttendanceMap, setLessonAttendanceMap] = useState<Record<string, AttendanceRecord[]>>({});
  const [lessonReportMap, setLessonReportMap] = useState<Record<string, ClassReport | null>>({});

  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonsError, setLessonsError] = useState<string | null>(null);

  const [hoursInput, setHoursInput] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [attendanceDraft, setAttendanceDraft] = useState<AttendanceDraft>({});
  const [withReport, setWithReport] = useState(false);
  const [reportSubject, setReportSubject] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportHomework, setReportHomework] = useState('');
  const [reportProgress, setReportProgress] = useState('');
  const [reportNextNotes, setReportNextNotes] = useState('');
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const [expandedReportLessonIds, setExpandedReportLessonIds] = useState<Set<string>>(new Set());

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleLesson, setRescheduleLesson] = useState<Lesson | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLesson, setCancelLesson] = useState<Lesson | null>(null);
  const [cancelDebitHours, setCancelDebitHours] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourse();
    fetchLessons();
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

  const fetchLessons = async () => {
    try {
      setLessonsLoading(true);
      setLessonsError(null);
      const response = await api.get(`/scheduling/courses/${courseId}/lessons`);
      const lessonsData: Lesson[] = response.data || [];
      setLessons(lessonsData);

      const recentLessons = [...lessonsData]
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 10);

      const attendanceEntries = await Promise.all(
        recentLessons.map(async (lesson) => {
          try {
            const attendanceResponse = await api.get(`/scheduling/attendance/lesson/${lesson.id}`);
            return [lesson.id, attendanceResponse.data || []] as const;
          } catch {
            return [lesson.id, []] as const;
          }
        }),
      );

      const reportEntries = await Promise.all(
        recentLessons.map(async (lesson) => {
          try {
            const reportResponse = await api.get(`/scheduling/class-reports/lesson/${lesson.id}`);
            return [lesson.id, reportResponse.data || null] as const;
          } catch {
            return [lesson.id, null] as const;
          }
        }),
      );

      setLessonAttendanceMap(Object.fromEntries(attendanceEntries));
      setLessonReportMap(Object.fromEntries(reportEntries));
    } catch {
      setLessonsError('Failed to load lessons');
    } finally {
      setLessonsLoading(false);
    }
  };

  const handleAdjustHours = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours === 0) {
      setAdjustError('Enter a non-zero number of hours (use negative to deduct)');
      return;
    }

    setAdjusting(true);
    setAdjustError(null);
    setAdjustSuccess(null);

    try {
      const response = await api.patch(`/courses/${courseId}/hours`, { hours });
      setCourse(response.data);
      setHoursInput('');
      setAdjustSuccess(`Hours balance updated to ${Number(response.data.hoursBalance).toFixed(1)}`);
    } catch {
      setAdjustError('Failed to adjust hours');
    } finally {
      setAdjusting(false);
    }
  };

  const openCompleteLessonModal = (lesson: Lesson) => {
    const draft: AttendanceDraft = {};
    lesson.students.forEach((student) => {
      draft[student.id] = 'present';
    });

    setSelectedLesson(lesson);
    setAttendanceDraft(draft);
    setWithReport(false);
    setReportSubject('');
    setReportContent('');
    setReportHomework('');
    setReportProgress('');
    setReportNextNotes('');
    setCompleteError(null);
    setShowCompleteModal(true);
  };

  const submitCompleteLesson = async () => {
    if (!selectedLesson) return;

    const attendances = selectedLesson.students.map((student) => ({
      studentId: student.id,
      status: attendanceDraft[student.id] || 'present',
    }));

    const payload: Record<string, unknown> = { attendances };
    if (withReport && reportSubject.trim() && reportContent.trim()) {
      payload.report = {
        subject: reportSubject.trim(),
        content: reportContent.trim(),
        homeworkAssigned: reportHomework.trim() || undefined,
        studentProgress: reportProgress.trim() || undefined,
        nextLessonNotes: reportNextNotes.trim() || undefined,
      };
    }

    setCompleteLoading(true);
    setCompleteError(null);

    try {
      await api.post(`/scheduling/lessons/${selectedLesson.id}/complete`, payload);
      setShowCompleteModal(false);
      setSelectedLesson(null);
      await fetchLessons();
      if (course) {
        await fetchCourse();
      }
    } catch {
      setCompleteError('Failed to complete lesson');
    } finally {
      setCompleteLoading(false);
    }
  };

  const openRescheduleModal = (lesson: Lesson) => {
    const start = new Date(lesson.startTime);
    const end = new Date(lesson.endTime);
    setRescheduleLesson(lesson);
    setRescheduleDate(start.toISOString().split('T')[0]);
    setRescheduleStartTime(start.toTimeString().slice(0, 5));
    setRescheduleEndTime(end.toTimeString().slice(0, 5));
    setRescheduleError(null);
    setShowRescheduleModal(true);
  };

  const submitReschedule = async () => {
    if (!rescheduleLesson || !rescheduleDate || !rescheduleStartTime || !rescheduleEndTime) return;

    const startTime = new Date(`${rescheduleDate}T${rescheduleStartTime}:00`);
    const endTime = new Date(`${rescheduleDate}T${rescheduleEndTime}:00`);

    if (endTime <= startTime) {
      setRescheduleError('End time must be after start time');
      return;
    }

    setRescheduleLoading(true);
    setRescheduleError(null);

    try {
      await api.patch(`/scheduling/lessons/${rescheduleLesson.id}/reschedule`, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      setShowRescheduleModal(false);
      setRescheduleLesson(null);
      await fetchLessons();
    } catch {
      setRescheduleError('Failed to reschedule lesson. There may be a time conflict.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const openCancelModal = (lesson: Lesson) => {
    setCancelLesson(lesson);
    setCancelDebitHours(false);
    setCancelError(null);
    setShowCancelModal(true);
  };

  const submitCancelLesson = async () => {
    if (!cancelLesson) return;

    setCancelLoading(true);
    setCancelError(null);

    try {
      await api.patch(`/scheduling/lessons/${cancelLesson.id}/cancel`, {
        creditHoursBack: !cancelDebitHours,
      });
      setShowCancelModal(false);
      setCancelLesson(null);
      await fetchLessons();
      if (course) {
        await fetchCourse();
      }
    } catch {
      setCancelError('Failed to cancel lesson');
    } finally {
      setCancelLoading(false);
    }
  };

  const toggleReportExpanded = (lessonId: string) => {
    setExpandedReportLessonIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const statusBadgeClass = (status: Lesson['status']) => {
    if (status === 'completed') return 'bg-green-100 text-green-700';
    if (status === 'cancelled') return 'bg-gray-200 text-gray-700';
    if (status === 'no_show') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
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

  const upcomingLessons = lessons
    .filter((lesson) => lesson.status === 'scheduled' && new Date(lesson.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const recentLessons = [...lessons]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 10);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-spicy-dark mb-4">Hours Balance</h2>
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold ${course.hoursBalance <= 0 ? 'text-red-500' : course.hoursBalance <= 2 ? 'text-orange-500' : 'text-green-600'}`}>
                {Number(course.hoursBalance).toFixed(1)}
              </div>
              <div className="text-gray-500 text-sm">hours remaining</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-spicy-dark mb-4">Course Details</h2>
            <dl className="space-y-3">
              <div className="flex gap-2">
                <dt className="text-sm font-medium text-gray-500 w-28 shrink-0">Tutor</dt>
                <dd className="text-sm text-gray-900">{course.tutor ? `${course.tutor.firstName} ${course.tutor.lastName}` : '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-sm font-medium text-gray-500 w-28 shrink-0">Start Date</dt>
                <dd className="text-sm text-gray-900">{new Date(course.startDate).toLocaleDateString()}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-sm font-medium text-gray-500 w-28 shrink-0">Schedule</dt>
                <dd className="text-sm text-gray-900">
                  {course.schedules && course.schedules.length > 0 ? (
                    <ul className="space-y-1">
                      {course.schedules.map((schedule) => (
                        <li key={schedule.id}>{DAY_NAMES[schedule.dayOfWeek]} {schedule.startTime}-{schedule.endTime}</li>
                      ))}
                    </ul>
                  ) : (
                    'No schedule set'
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-spicy-dark mb-4">Students ({course.students?.length ?? 0})</h2>
            {course.students && course.students.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {course.students.map((student) => (
                  <li key={student.id} className="py-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-spicy-red flex items-center justify-center text-white text-xs font-bold">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No students enrolled</p>
            )}
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-spicy-dark mb-1">Adjust Hours</h2>
              <p className="text-xs text-gray-500 mb-4">
                Add hours when a package is purchased, or deduct to manually correct the balance.
              </p>

              {adjustSuccess && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                  {adjustSuccess}
                </div>
              )}
              {adjustError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {adjustError}
                </div>
              )}

              <form onSubmit={handleAdjustHours} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hours to add / deduct</label>
                  <input
                    type="number"
                    step="0.5"
                    value={hoursInput}
                    onChange={(event) => setHoursInput(event.target.value)}
                    placeholder="e.g. 10 or -2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="w-full py-2 bg-spicy-red text-white rounded-md text-sm font-medium hover:bg-spicy-orange disabled:opacity-50"
                >
                  {adjusting ? 'Saving...' : 'Apply Adjustment'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-spicy-dark mb-4">Upcoming Lessons</h2>
          {lessonsLoading ? (
            <p className="text-sm text-gray-500">Loading lessons...</p>
          ) : lessonsError ? (
            <p className="text-sm text-red-600">{lessonsError}</p>
          ) : upcomingLessons.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming lessons.</p>
          ) : (
            <div className="space-y-3">
              {upcomingLessons.map((lesson) => (
                <div key={lesson.id} className="border border-gray-100 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{formatDateTime(lesson.startTime)}</div>
                    <div className="text-xs text-gray-500">
                      {lesson.students.map((student) => `${student.firstName} ${student.lastName}`).join(', ')}
                    </div>
                  </div>
                  {(user?.role === 'tutor' || user?.role === 'admin') && lesson.status === 'scheduled' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openRescheduleModal(lesson)}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => openCompleteLessonModal(lesson)}
                        className="px-3 py-1.5 bg-spicy-red text-white text-sm rounded-md hover:bg-spicy-orange"
                      >
                        Log Attendance
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-spicy-dark mb-4">Recent Lessons</h2>
          {lessonsLoading ? (
            <p className="text-sm text-gray-500">Loading lessons...</p>
          ) : lessonsError ? (
            <p className="text-sm text-red-600">{lessonsError}</p>
          ) : recentLessons.length === 0 ? (
            <p className="text-sm text-gray-500">No lesson history.</p>
          ) : (
            <div className="space-y-3">
              {recentLessons.map((lesson) => {
                const attendance = lessonAttendanceMap[lesson.id] || [];
                const presentCount = attendance.filter((item) => item.status === 'present').length;
                const absentCount = attendance.filter((item) => item.status === 'absent').length;
                const report = lessonReportMap[lesson.id];
                const showReport = expandedReportLessonIds.has(lesson.id) && report;

                return (
                  <div key={lesson.id} className={`border rounded-lg p-4 ${lesson.status === 'cancelled' ? 'opacity-70 bg-gray-50 border-gray-200' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{formatDateTime(lesson.startTime)}</div>
                        <div className="text-xs text-gray-500">
                          {lesson.students.map((student) => `${student.firstName} ${student.lastName}`).join(', ')}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(lesson.status)}`}>
                        {lesson.status}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-gray-600">
                      Attendance: {attendance.length > 0 ? `${presentCount} present / ${absentCount} absent` : 'Not recorded'}
                    </div>

                    {report && (
                      <button
                        onClick={() => toggleReportExpanded(lesson.id)}
                        className="mt-2 text-xs text-spicy-red hover:underline"
                      >
                        {showReport ? 'Hide Report' : 'View Report'}
                      </button>
                    )}

                    {showReport && report && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                        <div className="text-sm font-semibold text-gray-800">{report.subject}</div>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{report.content}</p>
                        {report.homeworkAssigned && <p className="text-xs text-gray-600 mt-2"><strong>Homework:</strong> {report.homeworkAssigned}</p>}
                        {report.studentProgress && <p className="text-xs text-gray-600 mt-1"><strong>Progress:</strong> {report.studentProgress}</p>}
                        {report.nextLessonNotes && <p className="text-xs text-gray-600 mt-1"><strong>Next lesson notes:</strong> {report.nextLessonNotes}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showRescheduleModal && rescheduleLesson && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-spicy-dark">Reschedule Lesson</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="text-gray-500 hover:text-gray-700">
                Close
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Original: {formatDateTime(rescheduleLesson.startTime)}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={rescheduleStartTime}
                    onChange={(e) => setRescheduleStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={rescheduleEndTime}
                    onChange={(e) => setRescheduleEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  />
                </div>
              </div>
            </div>

            {rescheduleError && (
              <div className="mt-4 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                {rescheduleError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitReschedule}
                disabled={rescheduleLoading}
                className="px-4 py-2 bg-spicy-red text-white rounded-md text-sm hover:bg-spicy-orange disabled:opacity-50"
              >
                {rescheduleLoading ? 'Saving...' : 'Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && selectedLesson && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-spicy-dark">Complete Lesson</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-gray-500 hover:text-gray-700">
                Close
              </button>
            </div>

            <div className="space-y-3">
              {selectedLesson.students.map((student) => (
                <div key={student.id} className="flex items-center justify-between border border-gray-200 rounded p-3">
                  <div className="text-sm text-gray-900">{student.firstName} {student.lastName}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAttendanceDraft((prev) => ({ ...prev, [student.id]: 'present' }))}
                      className={`px-3 py-1 text-xs rounded ${attendanceDraft[student.id] === 'present' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => setAttendanceDraft((prev) => ({ ...prev, [student.id]: 'absent' }))}
                      className={`px-3 py-1 text-xs rounded ${attendanceDraft[student.id] === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t pt-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={withReport}
                  onChange={(event) => setWithReport(event.target.checked)}
                />
                Add class report
              </label>

              {withReport && (
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    value={reportSubject}
                    onChange={(event) => setReportSubject(event.target.value)}
                    placeholder="Subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <textarea
                    value={reportContent}
                    onChange={(event) => setReportContent(event.target.value)}
                    placeholder="Content"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <textarea
                    value={reportHomework}
                    onChange={(event) => setReportHomework(event.target.value)}
                    placeholder="Homework assigned (optional)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <textarea
                    value={reportProgress}
                    onChange={(event) => setReportProgress(event.target.value)}
                    placeholder="Student progress (optional)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <textarea
                    value={reportNextNotes}
                    onChange={(event) => setReportNextNotes(event.target.value)}
                    placeholder="Notes for next lesson (optional)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              )}
            </div>

            {completeError && (
              <div className="mt-4 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                {completeError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitCompleteLesson}
                disabled={completeLoading}
                className="px-4 py-2 bg-spicy-red text-white rounded-md text-sm hover:bg-spicy-orange disabled:opacity-50"
              >
                {completeLoading ? 'Saving...' : 'Complete Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
