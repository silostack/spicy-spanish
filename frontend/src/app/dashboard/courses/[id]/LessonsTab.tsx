'use client';

import { useMemo, useState } from 'react';
import {
  endOfMonth,
  endOfWeek,
  max as maxDate,
  min as minDate,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import LessonsCalendar from './lessons-calendar/LessonsCalendar';
import RangePicker, {
  ResolvedRange,
  presetRange,
} from './lessons-calendar/RangePicker';
import TotalsStrip from './lessons-calendar/TotalsStrip';
import LessonDetailPanel from './lesson-panel/LessonDetailPanel';
import LogPastClassPanel from './lesson-panel/LogPastClassPanel';
import { useLessons } from './hooks/useLessons';
import { Course, Lesson } from './types';

interface Props {
  courseId: string;
  course: Course;
  userRole: string;
  onCourseDataChanged: () => void;
}

const WEEK_OPTS = { weekStartsOn: 1 as const };

export default function LessonsTab({
  courseId,
  course,
  userRole,
  onCourseDataChanged,
}: Props) {
  const isAdmin = userRole === 'admin';
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => new Date());
  const [range, setRange] = useState<ResolvedRange>(() => {
    const { start, end } = presetRange('this-month');
    return { start, end, preset: 'this-month' };
  });
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    null,
  );
  // yyyy-MM-dd ('' = no date yet) while the "log past class" panel is open.
  const [pastClassDate, setPastClassDate] = useState<string | null>(null);

  // Fetch lessons covering both the visible month grid and the selected range,
  // so chips appear everywhere they should.
  const fetchStart = useMemo(
    () =>
      minDate([
        startOfWeek(startOfMonth(visibleMonth), WEEK_OPTS),
        range.start,
      ]),
    [visibleMonth, range.start],
  );
  const fetchEnd = useMemo(
    () =>
      maxDate([endOfWeek(endOfMonth(visibleMonth), WEEK_OPTS), range.end]),
    [visibleMonth, range.end],
  );

  const { lessons, attendanceByLesson, reportByLesson, loading, error, refetch } =
    useLessons(courseId, fetchStart, fetchEnd);

  const selectedLesson = selectedLessonId
    ? lessons.find((l) => l.id === selectedLessonId) ?? null
    : null;

  const handleChanged = async () => {
    await refetch();
    onCourseDataChanged();
  };

  const handlePastClassLogged = async (lesson: Lesson) => {
    setPastClassDate(null);
    setVisibleMonth(new Date(lesson.startTime));
    await handleChanged();
    setSelectedLessonId(lesson.id);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.16em] text-spicy-dark/45">
          {loading ? 'Loading lessons…' : `${lessons.length} lessons in view`}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setPastClassDate('')}
              className="rounded-full border border-spicy-dark/15 bg-white px-4 py-2 text-sm font-medium text-spicy-dark transition-colors hover:border-spicy-dark/40"
            >
              + Log past class
            </button>
          )}
          <RangePicker
            value={range}
            onChange={(next) => {
              setRange(next);
              setVisibleMonth(next.end);
            }}
          />
        </div>
      </div>

      <TotalsStrip
        lessons={lessons}
        rangeStart={range.start}
        rangeEnd={range.end}
      />

      {error ? (
        <p className="mt-6 rounded-md bg-spicy-red/10 px-3 py-2 text-sm text-spicy-red">
          {error}
        </p>
      ) : (
        <div className="mt-6">
          <LessonsCalendar
            visibleMonth={visibleMonth}
            onChangeMonth={setVisibleMonth}
            lessons={lessons}
            rangeStart={range.start}
            rangeEnd={range.end}
            selectedLessonId={selectedLessonId}
            onSelectLesson={setSelectedLessonId}
            onSelectPastDay={isAdmin ? setPastClassDate : undefined}
          />
        </div>
      )}

      <LessonDetailPanel
        lesson={selectedLesson}
        userRole={userRole}
        attendance={
          selectedLesson ? attendanceByLesson[selectedLesson.id] || [] : []
        }
        report={
          selectedLesson ? reportByLesson[selectedLesson.id] || null : null
        }
        onClose={() => setSelectedLessonId(null)}
        onChanged={handleChanged}
      />

      {isAdmin && (
        <LogPastClassPanel
          initialDate={pastClassDate}
          courseId={courseId}
          students={course.students}
          lessons={lessons}
          onClose={() => setPastClassDate(null)}
          onDone={handlePastClassLogged}
        />
      )}
    </div>
  );
}
