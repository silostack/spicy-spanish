'use client';

import { useState } from 'react';
import api from '../../../utils/api';
import { Lesson, formatDateTime } from './types';

interface Props {
  lesson: Lesson;
  onClose: () => void;
  onCancelled: () => void;
}

export default function CancelLessonModal({ lesson, onClose, onCancelled }: Props) {
  const [debitHours, setDebitHours] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.patch(`/scheduling/lessons/${lesson.id}/cancel`, {
        creditHoursBack: !debitHours,
      });
      onCancelled();
    } catch {
      setError('Failed to cancel lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-spicy-dark">Cancel Lesson</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            Close
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to cancel the lesson on{' '}
          <span className="font-medium">{formatDateTime(lesson.startTime)}</span>?
        </p>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={debitHours}
            onChange={(e) => setDebitHours(e.target.checked)}
          />
          Debit hours from student
        </label>

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
            Go Back
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Cancelling...' : 'Cancel Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
}
