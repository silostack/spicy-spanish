'use client';

import { useState } from 'react';
import api from '../../../../utils/api';
import { Lesson } from '../types';

type AttendanceDraft = Record<string, 'present' | 'absent'>;

interface Props {
  lesson: Lesson;
  onDone: () => void;
}

export default function LogAttendanceForm({ lesson, onDone }: Props) {
  const [attendanceDraft, setAttendanceDraft] = useState<AttendanceDraft>(
    () => {
      const draft: AttendanceDraft = {};
      lesson.students.forEach((s) => {
        draft[s.id] = 'present';
      });
      return draft;
    },
  );
  const [withReport, setWithReport] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [homework, setHomework] = useState('');
  const [progress, setProgress] = useState('');
  const [nextNotes, setNextNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const attendances = lesson.students.map((student) => ({
      studentId: student.id,
      status: attendanceDraft[student.id] || 'present',
    }));
    const payload: Record<string, unknown> = { attendances };
    if (withReport && subject.trim() && content.trim()) {
      payload.report = {
        subject: subject.trim(),
        content: content.trim(),
        homeworkAssigned: homework.trim() || undefined,
        studentProgress: progress.trim() || undefined,
        nextLessonNotes: nextNotes.trim() || undefined,
      };
    }
    setLoading(true);
    setError(null);
    try {
      await api.post(`/scheduling/lessons/${lesson.id}/complete`, payload);
      onDone();
    } catch {
      setError('Failed to log attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-spicy-dark/55">
          Who was there?
        </h4>
        <div className="space-y-1.5">
          {lesson.students.map((student) => {
            const status = attendanceDraft[student.id] || 'present';
            return (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-lg border border-spicy-dark/10 bg-white px-3 py-2"
              >
                <span className="text-sm font-medium text-spicy-dark">
                  {student.firstName} {student.lastName}
                </span>
                <div className="flex rounded-full bg-spicy-dark/5 p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() =>
                      setAttendanceDraft((p) => ({
                        ...p,
                        [student.id]: 'present',
                      }))
                    }
                    className={`rounded-full px-3 py-1 transition-colors ${
                      status === 'present'
                        ? 'bg-[#7a8f4a] text-white'
                        : 'text-spicy-dark/60 hover:text-spicy-dark'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAttendanceDraft((p) => ({
                        ...p,
                        [student.id]: 'absent',
                      }))
                    }
                    className={`rounded-full px-3 py-1 transition-colors ${
                      status === 'absent'
                        ? 'bg-spicy-red text-white'
                        : 'text-spicy-dark/60 hover:text-spicy-dark'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setWithReport((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-spicy-dark/10 bg-white px-3 py-2 text-left text-sm font-medium text-spicy-dark hover:border-spicy-dark/25"
        >
          <span className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.12em] text-spicy-dark/55">
              Class report
            </span>
            <span className="text-spicy-dark/45">optional</span>
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${withReport ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {withReport && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (e.g. Past tense ser/estar)"
              className="w-full rounded-lg border border-spicy-dark/15 bg-white px-3 py-2 text-sm focus:border-spicy-red focus:outline-none focus:ring-2 focus:ring-spicy-red/20"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did we cover?"
              rows={3}
              className="w-full rounded-lg border border-spicy-dark/15 bg-white px-3 py-2 text-sm focus:border-spicy-red focus:outline-none focus:ring-2 focus:ring-spicy-red/20"
            />
            <textarea
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder="Homework (optional)"
              rows={2}
              className="w-full rounded-lg border border-spicy-dark/15 bg-white px-3 py-2 text-sm focus:border-spicy-red focus:outline-none focus:ring-2 focus:ring-spicy-red/20"
            />
            <textarea
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder="Student progress (optional)"
              rows={2}
              className="w-full rounded-lg border border-spicy-dark/15 bg-white px-3 py-2 text-sm focus:border-spicy-red focus:outline-none focus:ring-2 focus:ring-spicy-red/20"
            />
            <textarea
              value={nextNotes}
              onChange={(e) => setNextNotes(e.target.value)}
              placeholder="Notes for next lesson (optional)"
              rows={2}
              className="w-full rounded-lg border border-spicy-dark/15 bg-white px-3 py-2 text-sm focus:border-spicy-red focus:outline-none focus:ring-2 focus:ring-spicy-red/20"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-spicy-red/10 px-3 py-2 text-sm text-spicy-red">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full rounded-full bg-spicy-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-spicy-red/90 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save attendance'}
      </button>
    </div>
  );
}
