'use client';

import { useState } from 'react';
import api from '../../../utils/api';
import { Course, DAY_NAMES } from './types';

interface Props {
  course: Course;
  courseId: string;
  userRole: string;
  onCourseUpdated: (course: Course) => void;
}

export default function DetailsTab({ course, courseId, userRole, onCourseUpdated }: Props) {
  const [hoursInput, setHoursInput] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

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
      onCourseUpdated(response.data);
      setHoursInput('');
      setAdjustSuccess(`Hours balance updated to ${Number(response.data.hoursBalance).toFixed(1)}`);
    } catch {
      setAdjustError('Failed to adjust hours');
    } finally {
      setAdjusting(false);
    }
  };

  const scheduleDisplay = course.schedules && course.schedules.length > 0
    ? course.schedules.map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}–${s.endTime}`).join(', ')
    : 'No schedule set';

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-spicy-dark uppercase tracking-wide mb-3">Course Info</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500 w-24 shrink-0">Tutor</dt>
            <dd className="text-gray-900">{course.tutor ? `${course.tutor.firstName} ${course.tutor.lastName}` : '—'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500 w-24 shrink-0">Start Date</dt>
            <dd className="text-gray-900">{new Date(course.startDate).toLocaleDateString()}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500 w-24 shrink-0">Schedule</dt>
            <dd className="text-gray-900">{scheduleDisplay}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-spicy-dark uppercase tracking-wide mb-3">
          Students ({course.students?.length ?? 0})
        </h3>
        {course.students && course.students.length > 0 ? (
          <ul className="space-y-2">
            {course.students.map((student) => (
              <li key={student.id} className="flex items-center gap-3">
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

      {userRole === 'admin' && (
        <div>
          <h3 className="text-sm font-semibold text-spicy-dark uppercase tracking-wide mb-1">Adjust Hours</h3>
          <p className="text-xs text-gray-500 mb-3">
            Add hours when a package is purchased, or deduct to manually correct the balance.
          </p>

          {adjustSuccess && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{adjustSuccess}</div>
          )}
          {adjustError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{adjustError}</div>
          )}

          <form onSubmit={handleAdjustHours} className="flex gap-2">
            <input
              type="number"
              step="0.5"
              value={hoursInput}
              onChange={(e) => setHoursInput(e.target.value)}
              placeholder="e.g. 10 or -2"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
              required
            />
            <button
              type="submit"
              disabled={adjusting}
              className="px-4 py-2 bg-spicy-red text-white rounded-md text-sm font-medium hover:bg-spicy-orange disabled:opacity-50"
            >
              {adjusting ? 'Saving...' : 'Apply'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
