'use client';

import { useState } from 'react';
import api from '../../../../utils/api';
import { Lesson } from '../types';
import AttendanceFields, { useAttendanceDraft } from './AttendanceFields';

interface Props {
  lesson: Lesson;
  onDone: () => void;
}

export default function LogAttendanceForm({ lesson, onDone }: Props) {
  const draft = useAttendanceDraft(lesson.students);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post(
        `/scheduling/lessons/${lesson.id}/complete`,
        draft.buildPayload(),
      );
      onDone();
    } catch {
      setError('Failed to log attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <AttendanceFields draft={draft} />

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
