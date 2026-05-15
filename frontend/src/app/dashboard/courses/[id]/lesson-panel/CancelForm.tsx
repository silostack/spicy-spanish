'use client';

import { useState } from 'react';
import api from '../../../../utils/api';
import { Lesson } from '../types';

interface Props {
  lesson: Lesson;
  onDone: () => void;
  onCancel: () => void;
}

export default function CancelForm({ lesson, onDone, onCancel }: Props) {
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
      onDone();
    } catch {
      setError('Failed to cancel lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-spicy-dark/70">
        This will mark the lesson as cancelled. By default, hours are returned
        to the student.
      </p>
      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-spicy-dark/15 bg-white p-3 text-sm text-spicy-dark hover:border-spicy-dark/30">
        <input
          type="checkbox"
          checked={debitHours}
          onChange={(e) => setDebitHours(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-spicy-red"
        />
        <span>
          <span className="font-medium">Debit hours from student</span>
          <span className="mt-0.5 block text-xs text-spicy-dark/55">
            Use this for late cancellations where the student should be charged.
          </span>
        </span>
      </label>
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
          Go back
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Cancelling…' : 'Cancel lesson'}
        </button>
      </div>
    </div>
  );
}
