'use client';

import { useState } from 'react';
import { Lesson, formatDateTime } from './types';
import CompleteLessonModal from './CompleteLessonModal';
import RescheduleLessonModal from './RescheduleLessonModal';
import CancelLessonModal from './CancelLessonModal';

interface Props {
  upcomingLessons: Lesson[];
  needsAttendanceLessons: Lesson[];
  lessonsLoading: boolean;
  lessonsError: string | null;
  userRole: string;
  onLessonChanged: () => void;
}

export default function ScheduleTab({
  upcomingLessons,
  needsAttendanceLessons,
  lessonsLoading,
  lessonsError,
  userRole,
  onLessonChanged,
}: Props) {
  const [completeLesson, setCompleteLesson] = useState<Lesson | null>(null);
  const [rescheduleLesson, setRescheduleLesson] = useState<Lesson | null>(null);
  const [cancelLesson, setCancelLesson] = useState<Lesson | null>(null);

  if (lessonsLoading) {
    return <p className="text-sm text-gray-500 py-4">Loading lessons...</p>;
  }

  if (lessonsError) {
    return <p className="text-sm text-red-600 py-4">{lessonsError}</p>;
  }

  return (
    <div className="space-y-6">
      {(userRole === 'tutor' || userRole === 'admin') && needsAttendanceLessons.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-spicy-dark uppercase tracking-wide mb-3">Needs Attendance</h3>
          <div className="space-y-2">
            {needsAttendanceLessons.map((lesson) => (
              <div key={lesson.id} className="border-l-4 border-spicy-red bg-white rounded-r-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{formatDateTime(lesson.startTime)}</div>
                  <div className="text-xs text-gray-500">
                    {lesson.students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => setCompleteLesson(lesson)}
                  className="px-3 py-1.5 bg-spicy-red text-white text-sm rounded-md hover:bg-spicy-orange"
                >
                  Log Attendance
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-spicy-dark uppercase tracking-wide mb-3">Upcoming</h3>
        {upcomingLessons.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming lessons scheduled.</p>
        ) : (
          <div className="space-y-2">
            {upcomingLessons.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{formatDateTime(lesson.startTime)}</div>
                  <div className="text-xs text-gray-500">
                    {lesson.students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                  </div>
                </div>
                {(userRole === 'tutor' || userRole === 'admin') && lesson.status === 'scheduled' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCancelLesson(lesson)}
                      className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-md hover:bg-red-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setRescheduleLesson(lesson)}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                    >
                      Reschedule
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {completeLesson && (
        <CompleteLessonModal
          lesson={completeLesson}
          onClose={() => setCompleteLesson(null)}
          onCompleted={() => { setCompleteLesson(null); onLessonChanged(); }}
        />
      )}
      {rescheduleLesson && (
        <RescheduleLessonModal
          lesson={rescheduleLesson}
          onClose={() => setRescheduleLesson(null)}
          onRescheduled={() => { setRescheduleLesson(null); onLessonChanged(); }}
        />
      )}
      {cancelLesson && (
        <CancelLessonModal
          lesson={cancelLesson}
          onClose={() => setCancelLesson(null)}
          onCancelled={() => { setCancelLesson(null); onLessonChanged(); }}
        />
      )}
    </div>
  );
}
