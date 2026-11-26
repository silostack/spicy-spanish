'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../utils/api';
import { format } from 'date-fns';
import { sortSchedules } from '../../scheduleUtils';
import { formatDateTime } from '../types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
}

interface TutorOption extends CourseUser {
  isActive: boolean;
}

interface TutorChangePreview {
  lessonsToMove: number;
  unloggedPastLessons: number;
  clashes: Array<{ lessonId: string; startTime: string; endTime: string; otherCourseTitle: string }>;
}

const apiErrorMessage = (err: unknown, fallback: string) => {
  const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || fallback;
};

const fullName = (u: CourseUser) => `${u.firstName} ${u.lastName}`;

interface ScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function CourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);

  // New schedule slot form
  const [newSlot, setNewSlot] = useState<ScheduleSlot>({ dayOfWeek: 1, startTime: '10:00', endTime: '11:00' });
  const [addingSlot, setAddingSlot] = useState(false);

  // Available students
  const [allStudents, setAllStudents] = useState<CourseUser[]>([]);

  // Tutor handover
  const [allTutors, setAllTutors] = useState<TutorOption[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [tutorPreview, setTutorPreview] = useState<TutorChangePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [changingTutor, setChangingTutor] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [courseRes, studentsRes, tutorsRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get('/users/students'),
          // A failing tutor list must not block editing the rest of the course.
          api.get('/users/tutors').catch(() => ({ data: [] })),
        ]);
        const c: Course = courseRes.data;
        setCourse(c);
        setTitle(c.title);
        setIsActive(c.isActive);
        setEnrolledStudentIds(c.students.map((s) => s.id));
        setSchedules(c.schedules);

        const studentsData = Array.isArray(studentsRes.data)
          ? studentsRes.data
          : studentsRes.data?.items || [];
        setAllStudents(studentsData);

        const tutorsData = Array.isArray(tutorsRes.data)
          ? tutorsRes.data
          : tutorsRes.data?.items || [];
        setAllTutors(tutorsData);
      } catch {
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId]);

  const handleSaveBasics = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/courses/${courseId}`, { title, isActive });
      setSuccess('Course updated successfully');
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const resetTutorPicker = () => {
    setSelectedTutorId('');
    setTutorPreview(null);
  };

  const handlePreviewTutorChange = async () => {
    if (!selectedTutorId || loadingPreview) return;
    setLoadingPreview(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.get(`/courses/${courseId}/tutor-change-preview`, {
        params: { tutorId: selectedTutorId },
      });
      setTutorPreview(response.data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to preview tutor change'));
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmTutorChange = async () => {
    if (!selectedTutorId || changingTutor) return;
    setChangingTutor(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.patch(`/courses/${courseId}/tutor`, { tutorId: selectedTutorId });
      const updated: Course = response.data;
      setCourse(updated);
      resetTutorPicker();
      setSuccess(`Tutor changed to ${fullName(updated.tutor)}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to change tutor'));
    } finally {
      setChangingTutor(false);
    }
  };

  const handleToggleStudent = async (student: CourseUser) => {
    const isEnrolled = enrolledStudentIds.includes(student.id);
    try {
      if (isEnrolled) {
        await api.delete(`/courses/${courseId}/students`, { data: { studentId: student.id } });
        setEnrolledStudentIds((prev) => prev.filter((id) => id !== student.id));
      } else {
        await api.post(`/courses/${courseId}/students`, { studentId: student.id });
        setEnrolledStudentIds((prev) => [...prev, student.id]);
      }
    } catch {
      setError(`Failed to ${isEnrolled ? 'remove' : 'add'} student`);
    }
  };

  const handleAddSchedule = async () => {
    setAddingSlot(true);
    setError(null);
    try {
      const response = await api.post(`/courses/${courseId}/schedules`, newSlot);
      setTutorPreview(null);
      setSchedules((prev) => [...prev, response.data]);
      setNewSlot({ dayOfWeek: 1, startTime: '10:00', endTime: '11:00' });
    } catch {
      setError('Failed to add schedule slot');
    } finally {
      setAddingSlot(false);
    }
  };

  const handleRemoveSchedule = async (scheduleId: string) => {
    try {
      await api.delete(`/courses/schedules/${scheduleId}`);
      setTutorPreview(null);
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } catch {
      setError('Failed to remove schedule slot');
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

  if (error && !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="text-xl text-red-700 font-semibold">Error</h2>
          <p className="text-red-600">{error}</p>
          <Link href="/dashboard/courses" className="mt-4 inline-block text-spicy-red hover:underline">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const tutorOptions = allTutors.filter((t) => t.isActive && t.id !== course?.tutor?.id);
  const selectedTutor = tutorOptions.find((t) => t.id === selectedTutorId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/courses/${courseId}`} className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-spicy-dark">Edit Course</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{success}</div>
      )}

      <div className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-spicy-dark mb-4">Basic Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-spicy-red focus:ring-spicy-red border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveBasics}
                disabled={saving}
                className="px-4 py-2 bg-spicy-red text-white rounded-md text-sm font-medium hover:bg-spicy-orange disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Tutor */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-spicy-dark mb-4">Tutor</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Current tutor:{' '}
              <span className="font-medium">{course?.tutor ? fullName(course.tutor) : '—'}</span>
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedTutorId}
                onChange={(e) => {
                  setSelectedTutorId(e.target.value);
                  setTutorPreview(null);
                }}
                disabled={changingTutor}
                className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
              >
                <option value="">Select a new tutor…</option>
                {tutorOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {fullName(t)} ({t.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handlePreviewTutorChange}
                disabled={!selectedTutor || loadingPreview || changingTutor || tutorPreview !== null}
                className="px-3 py-1.5 bg-spicy-red text-white rounded-md text-sm font-medium hover:bg-spicy-orange disabled:opacity-50"
              >
                {loadingPreview ? 'Checking...' : 'Change tutor'}
              </button>
            </div>

            {tutorPreview && selectedTutor && course && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3 text-sm text-gray-700">
                <p>
                  {tutorPreview.lessonsToMove} upcoming{' '}
                  {tutorPreview.lessonsToMove === 1 ? 'lesson' : 'lessons'} will move to{' '}
                  <span className="font-medium">{fullName(selectedTutor)}</span>.
                </p>
                {tutorPreview.unloggedPastLessons > 0 && (
                  <p>
                    {tutorPreview.unloggedPastLessons} past{' '}
                    {tutorPreview.unloggedPastLessons === 1 ? 'lesson still needs' : 'lessons still need'}{' '}
                    attendance and stay with{' '}
                    <span className="font-medium">{fullName(course.tutor)}</span>; log them yourself.
                  </p>
                )}
                {tutorPreview.clashes.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                    <p className="font-medium mb-1">
                      {fullName(selectedTutor)} already has lessons at these times:
                    </p>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {tutorPreview.clashes.map((c, i) => (
                        <li key={`${c.lessonId}-${i}`}>
                          {formatDateTime(c.startTime)} – {format(new Date(c.endTime), 'h:mm a')}{' '}
                          (clashes with {c.otherCourseTitle})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={resetTutorPicker}
                    disabled={changingTutor}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmTutorChange}
                    disabled={changingTutor}
                    className="px-3 py-1.5 bg-spicy-red text-white rounded-md text-sm font-medium hover:bg-spicy-orange disabled:opacity-50"
                  >
                    {changingTutor ? 'Changing...' : 'Confirm change'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Students */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-spicy-dark mb-1">Students</h2>
          <p className="text-xs text-gray-500 mb-4">Check to enroll, uncheck to remove.</p>
          <div className="border border-gray-200 rounded-md divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {allStudents.map((s) => {
              const enrolled = enrolledStudentIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={enrolled}
                    onChange={() => handleToggleStudent(s)}
                    className="h-4 w-4 text-spicy-red focus:ring-spicy-red border-gray-300 rounded mr-3"
                  />
                  <span className="text-sm text-gray-700">
                    {s.firstName} {s.lastName}{' '}
                    <span className="text-gray-400 text-xs">({s.email})</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-spicy-dark mb-4">Weekly Schedule</h2>

          {/* Existing slots */}
          {schedules.length > 0 ? (
            <ul className="space-y-2 mb-4">
              {sortSchedules(schedules).map((slot) => (
                <li
                  key={slot.id}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                >
                  <span className="text-sm text-gray-700">
                    {DAY_NAMES[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
                  </span>
                  <button
                    onClick={() => handleRemoveSchedule(slot.id)}
                    className="text-red-400 hover:text-red-600 ml-4"
                    aria-label="Remove slot"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No schedule slots set.</p>
          )}

          {/* Add new slot */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Add a slot</p>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={newSlot.dayOfWeek}
                onChange={(e) => setNewSlot((s) => ({ ...s, dayOfWeek: Number(e.target.value) }))}
                className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
              >
                {DAY_NAMES.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
              <input
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot((s) => ({ ...s, startTime: e.target.value }))}
                className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot((s) => ({ ...s, endTime: e.target.value }))}
                className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
              />
              <button
                onClick={handleAddSchedule}
                disabled={addingSlot}
                className="px-3 py-1.5 bg-spicy-red text-white rounded-md text-sm font-medium hover:bg-spicy-orange disabled:opacity-50"
              >
                {addingSlot ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => router.push(`/dashboard/courses/${courseId}`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
