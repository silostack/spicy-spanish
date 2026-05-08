'use client';

import { useState } from 'react';
import api from '../../../utils/api';
import { Lesson } from './types';

type AttendanceDraft = Record<string, 'present' | 'absent'>;

interface Props {
  lesson: Lesson;
  onClose: () => void;
  onCompleted: () => void;
}

export default function CompleteLessonModal({ lesson, onClose, onCompleted }: Props) {
  const [attendanceDraft, setAttendanceDraft] = useState<AttendanceDraft>(() => {
    const draft: AttendanceDraft = {};
    lesson.students.forEach((s) => { draft[s.id] = 'present'; });
    return draft;
  });
  const [withReport, setWithReport] = useState(false);
  const [reportSubject, setReportSubject] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportHomework, setReportHomework] = useState('');
  const [reportProgress, setReportProgress] = useState('');
  const [reportNextNotes, setReportNextNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const attendances = lesson.students.map((student) => ({
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

    setLoading(true);
    setError(null);

    try {
      await api.post(`/scheduling/lessons/${lesson.id}/complete`, payload);
      onCompleted();
    } catch {
      setError('Failed to complete lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-spicy-dark">Complete Lesson</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            Close
          </button>
        </div>

        <div className="space-y-3">
          {lesson.students.map((student) => (
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

        {error && (
          <div className="mt-4 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 bg-spicy-red text-white rounded-md text-sm hover:bg-spicy-orange disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Complete Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
}
