'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../../../../utils/api';
import { CourseUser, Lesson, lessonHours } from '../types';
import AttendanceFields, { useAttendanceDraft } from './AttendanceFields';

interface Props {
  // yyyy-MM-dd to open the panel with that date prefilled ('' for no date);
  // null keeps the panel closed.
  initialDate: string | null;
  courseId: string;
  students: CourseUser[];
  // Lessons already loaded for the calendar, used to suggest start/end times.
  lessons: Lesson[];
  onClose: () => void;
  onDone: (lesson: Lesson) => void;
}

const inputClass =
  'w-full rounded-lg border border-spicy-dark/15 bg-white px-3 py-2 text-sm text-spicy-dark focus:border-spicy-red focus:outline-none focus:ring-2 focus:ring-spicy-red/20';
const labelClass =
  'mb-1 block text-[11px] font-semibold uppercase tracking-wider text-spicy-dark/60';

export default function LogPastClassPanel({
  initialDate,
  courseId,
  students,
  lessons,
  onClose,
  onDone,
}: Props) {
  const open = initialDate !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-30 bg-spicy-dark/15 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-label="Log past class"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[440px] flex-col bg-spicy-light shadow-[-24px_0_60px_-20px_rgba(72,44,45,0.25)] transition-transform duration-[220ms] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {open && (
          // Keyed so each opening starts from a fresh draft.
          <PastClassForm
            key={initialDate}
            initialDate={initialDate}
            courseId={courseId}
            students={students}
            lessons={lessons}
            onClose={onClose}
            onDone={onDone}
          />
        )}
      </aside>
    </>
  );
}

// Suggest times from the closest loaded lesson on the same weekday, read in the
// viewer's local time — the same zone the form submits in.
function suggestTimes(date: string, lessons: Lesson[]) {
  if (!date) return null;
  const target = new Date(`${date}T12:00:00`);
  const candidates = lessons
    .filter((l) => l.status !== 'cancelled')
    .filter((l) => new Date(l.startTime).getDay() === target.getDay())
    .sort(
      (a, b) =>
        Math.abs(new Date(a.startTime).getTime() - target.getTime()) -
        Math.abs(new Date(b.startTime).getTime() - target.getTime()),
    );
  const nearest = candidates[0];
  if (!nearest) return null;
  return {
    start: format(new Date(nearest.startTime), 'HH:mm'),
    end: format(new Date(nearest.endTime), 'HH:mm'),
  };
}

function PastClassForm({
  initialDate,
  courseId,
  students,
  lessons,
  onClose,
  onDone,
}: Omit<Props, 'initialDate'> & { initialDate: string }) {
  const draft = useAttendanceDraft(students);
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(
    () => suggestTimes(initialDate, lessons)?.start ?? '',
  );
  const [endTime, setEndTime] = useState(
    () => suggestTimes(initialDate, lessons)?.end ?? '',
  );
  const [timesTouched, setTimesTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  const changeDate = (next: string) => {
    setDate(next);
    if (timesTouched) return;
    const suggested = suggestTimes(next, lessons);
    if (suggested) {
      setStartTime(suggested.start);
      setEndTime(suggested.end);
    }
  };

  const start = date && startTime ? new Date(`${date}T${startTime}:00`) : null;
  const end = date && endTime ? new Date(`${date}T${endTime}:00`) : null;
  const hours =
    start && end && end > start
      ? lessonHours({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        })
      : null;

  const submit = async () => {
    if (!start || !end) {
      setError('Pick a date, start and end time');
      return;
    }
    if (end <= start) {
      setError('End time must be after start time');
      return;
    }
    if (start >= new Date()) {
      setError('Past classes must start in the past');
      return;
    }
    if (draft.includedCount === 0) {
      setError('Include at least one student');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(
        `/scheduling/courses/${courseId}/past-lessons`,
        {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          ...draft.buildPayload(),
        },
      );
      onDone(res.data.lesson);
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(
        (Array.isArray(message) ? message[0] : message) ||
          'Failed to log past class',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-spicy-dark/10 px-6 py-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-spicy-dark/45">
            Unscheduled class
          </div>
          <div className="font-display text-2xl font-bold text-spicy-dark">
            Log past class
          </div>
          <p className="mt-1 text-sm text-spicy-dark/60">
            Adds a completed class and its attendance in one step.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 text-spicy-dark/55 transition-colors hover:bg-spicy-dark/5 hover:text-spicy-dark"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => changeDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => {
                setTimesTouched(true);
                setStartTime(e.target.value);
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => {
                setTimesTouched(true);
                setEndTime(e.target.value);
              }}
              className={inputClass}
            />
          </div>
        </div>

        <AttendanceFields draft={draft} selectable />

        {hours !== null && (
          <p className="text-xs text-spicy-dark/55">
            This will deduct {hours.toFixed(1)}h from the course balance.
          </p>
        )}

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
          {loading ? 'Saving…' : 'Save class & attendance'}
        </button>
      </div>
    </>
  );
}
