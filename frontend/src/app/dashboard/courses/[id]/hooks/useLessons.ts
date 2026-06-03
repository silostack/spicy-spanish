'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '../../../../utils/api';
import {
  AttendanceRecord,
  ClassReport,
  Lesson,
} from '../types';

interface UseLessonsResult {
  lessons: Lesson[];
  attendanceByLesson: Record<string, AttendanceRecord[]>;
  reportByLesson: Record<string, ClassReport | null>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Send precise ISO instants for the visible grid's start/end so the backend
// query window matches exactly what is rendered (no timezone-boundary drift
// that could drop lessons at the edges of the range).
const fmt = (d: Date) => d.toISOString();

export function useLessons(
  courseId: string,
  start: Date,
  end: Date,
): UseLessonsResult {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendanceByLesson, setAttendanceByLesson] = useState<
    Record<string, AttendanceRecord[]>
  >({});
  const [reportByLesson, setReportByLesson] = useState<
    Record<string, ClassReport | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startKey = fmt(start);
  const endKey = fmt(end);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/scheduling/courses/${courseId}/lessons?category=date-range&startDate=${encodeURIComponent(
          startKey,
        )}&endDate=${encodeURIComponent(endKey)}`,
      );
      const fetched: Lesson[] = res.data || [];
      setLessons(fetched);

      const pastOrToday = fetched.filter(
        (l) => new Date(l.startTime) <= new Date(),
      );

      const [attEntries, reportEntries] = await Promise.all([
        Promise.all(
          pastOrToday.map(async (lesson) => {
            try {
              const r = await api.get(
                `/scheduling/attendance/lesson/${lesson.id}`,
              );
              return [lesson.id, r.data || []] as const;
            } catch {
              return [lesson.id, []] as const;
            }
          }),
        ),
        Promise.all(
          pastOrToday.map(async (lesson) => {
            try {
              const r = await api.get(
                `/scheduling/class-reports/lesson/${lesson.id}`,
              );
              return [lesson.id, r.data || null] as const;
            } catch {
              return [lesson.id, null] as const;
            }
          }),
        ),
      ]);

      setAttendanceByLesson(Object.fromEntries(attEntries));
      setReportByLesson(Object.fromEntries(reportEntries));
    } catch {
      setError('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  }, [courseId, startKey, endKey]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    lessons,
    attendanceByLesson,
    reportByLesson,
    loading,
    error,
    refetch: fetchAll,
  };
}
