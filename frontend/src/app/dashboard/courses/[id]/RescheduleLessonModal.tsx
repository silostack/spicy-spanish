'use client';

import { useState } from 'react';
import api from '../../../utils/api';
import { Lesson, formatDateTime } from './types';

interface Props {
  lesson: Lesson;
  onClose: () => void;
  onRescheduled: () => void;
}

export default function RescheduleLessonModal({ lesson, onClose, onRescheduled }: Props) {
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
      onRescheduled();
    } catch {
      setError('Failed to reschedule lesson. There may be a time conflict.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-spicy-dark">Reschedule Lesson</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            Close
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Original: {formatDateTime(lesson.startTime)}
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
              />
            </div>
          </div>
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
            {loading ? 'Saving...' : 'Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
