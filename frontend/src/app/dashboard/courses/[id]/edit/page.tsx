'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../utils/api';

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [courseRes, studentsRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get('/users/students'),
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
              {schedules.map((slot) => (
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
