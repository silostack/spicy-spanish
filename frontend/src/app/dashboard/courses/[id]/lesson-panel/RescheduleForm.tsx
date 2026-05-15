'use client';

import { useState } from 'react';
import api from '../../../../utils/api';
import { Lesson } from '../types';

interface Props {
  lesson: Lesson;
  onDone: () => void;
  onCancel: () => void;
}

export default function RescheduleForm({ lesson, onDone, onCancel }: Props) {
  const start = new Date(lesson.startTime);
  const end = new Date(lesson.endTime);

  const [date, setDate] = useState(start.toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(start.toTimeString().slice(0, 5));
  const [endTime, setEndTime] = useState(end.toTimeString().slice(0, 5));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!date || !startTime || !endTime) return;
    const newStart = new Date(`${date}T${startTime}:00`);
    const newEnd = new Date(`${date}T${endTime}:00`);
    if (newEnd <= newStart) {
      setError('End time must be after start time');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/scheduling/lessons/${lesson.id}/reschedule`, {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
      });
      onDone();
    } catch {
      setError('Failed to reschedule. There may be a time conflict.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-spicy-dark/60">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-spicy-dark/15 bg-white px-3 py-2 text-sm text-spicy-dark focus:border-spicy-red focus:outline-none focus:ring-2 focus:ring-spicy-red/20"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-spicy-dark/60">
            Start
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-spicy-dark/15 bg-white px-3 py-2 text-sm text-spicy-dark focus:border-spicy-red focus:outline-none focus:ring-2 focus:ring-spicy-red/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-spicy-dark/60">
            End
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border border-spicy-dark/15 bg-white px-3 py-2 text-sm text-spicy-dark focus:border-spicy-red focus:outline-none focus:ring-2 focus:ring-spicy-red/20"
          />
        </div>
      </div>
      {error && (
        <p className="rounded-md bg-spicy-red/10 px-3 py-2 text-sm text-spicy-red">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm text-spicy-dark/60 hover:text-spicy-dark"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="rounded-full bg-spicy-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-spicy-red/90 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save new time'}
        </button>
      </div>
    </div>
  );
}
