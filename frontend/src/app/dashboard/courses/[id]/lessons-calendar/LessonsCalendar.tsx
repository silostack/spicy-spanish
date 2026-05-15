'use client';

import { useMemo } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Lesson } from '../types';
import LessonChip from './LessonChip';

interface Props {
  visibleMonth: Date;
  onChangeMonth: (next: Date) => void;
  lessons: Lesson[];
  rangeStart: Date;
  rangeEnd: Date;
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string) => void;
}

const WEEK_OPTS = { weekStartsOn: 1 as const };
const HEAD_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function LessonsCalendar({
  visibleMonth,
  onChangeMonth,
  lessons,
  rangeStart,
  rangeEnd,
  selectedLessonId,
  onSelectLesson,
}: Props) {
  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(visibleMonth), WEEK_OPTS);
    const gridEnd = endOfWeek(endOfMonth(visibleMonth), WEEK_OPTS);
    const out: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [visibleMonth]);

  const lessonsByDay = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const lesson of lessons) {
      const key = format(new Date(lesson.startTime), 'yyyy-MM-dd');
      const list = map.get(key) ?? [];
      list.push(lesson);
      map.set(key, list);
    }
    Array.from(map.values()).forEach((list) =>
      list.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    );
    return map;
  }, [lessons]);

  const today = new Date();
  const rangeStartKey = format(rangeStart, 'yyyy-MM-dd');
  const rangeEndKey = format(rangeEnd, 'yyyy-MM-dd');

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-spicy-dark">
          {format(visibleMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => onChangeMonth(subMonths(visibleMonth, 1))}
            className="rounded-full p-2 text-spicy-dark/70 transition-colors hover:bg-spicy-dark/5 hover:text-spicy-dark"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onChangeMonth(new Date())}
            className="rounded-full border border-spicy-dark/15 px-3 py-1 text-xs font-medium text-spicy-dark/70 transition-colors hover:border-spicy-dark/30 hover:text-spicy-dark"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => onChangeMonth(addMonths(visibleMonth, 1))}
            className="rounded-full p-2 text-spicy-dark/70 transition-colors hover:bg-spicy-dark/5 hover:text-spicy-dark"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-px border-b border-spicy-dark/10 pb-2 text-[11px] uppercase tracking-[0.12em] text-spicy-dark/50">
        {HEAD_DAYS.map((d) => (
          <div key={d} className="px-2">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-spicy-dark/10 mt-2">
        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, visibleMonth);
          const inRange = dayKey >= rangeStartKey && dayKey <= rangeEndKey;
          const isRangeStart = dayKey === rangeStartKey;
          const isRangeEnd = dayKey === rangeEndKey;
          const isToday = isSameDay(day, today);

          const dayLessons = lessonsByDay.get(dayKey) ?? [];
          const visibleLessons = dayLessons.slice(0, 3);
          const overflow = dayLessons.length - visibleLessons.length;

          return (
            <div
              key={dayKey}
              className={`relative min-h-[96px] bg-white px-1.5 pb-1.5 pt-1 ${
                inMonth ? '' : 'bg-spicy-light/30'
              }`}
              style={
                inRange
                  ? {
                      backgroundColor: inMonth
                        ? 'color-mix(in oklch, #FFF0E8 60%, white)'
                        : 'color-mix(in oklch, #FFF0E8 40%, white)',
                    }
                  : undefined
              }
            >
              {/* Range edge accents */}
              {isRangeStart && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-1 left-0 w-[2px] bg-spicy-red/55"
                />
              )}
              {isRangeEnd && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-1 right-0 w-[2px] bg-spicy-red/55"
                />
              )}

              {/* Day number */}
              <div className="mb-1 flex items-baseline justify-between">
                <span
                  className={`font-display text-[15px] leading-none ${
                    !inMonth
                      ? 'text-spicy-dark/25'
                      : isToday
                        ? 'font-bold text-spicy-red'
                        : 'font-semibold text-spicy-dark/80'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {isToday && (
                  <span
                    aria-hidden
                    className="block h-[2px] w-5 rounded-full bg-spicy-red/70"
                  />
                )}
              </div>

              {/* Lesson chips */}
              <div className="flex flex-col gap-[3px]">
                {visibleLessons.map((lesson) => (
                  <LessonChip
                    key={lesson.id}
                    lesson={lesson}
                    selected={selectedLessonId === lesson.id}
                    onClick={onSelectLesson}
                  />
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectLesson(dayLessons[3].id)}
                    className="self-start px-1 text-[10px] font-medium uppercase tracking-wider text-spicy-dark/45 hover:text-spicy-red"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
