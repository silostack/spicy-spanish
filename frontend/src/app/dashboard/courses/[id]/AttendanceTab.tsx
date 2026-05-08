'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar } from '../../../components/ui/calendar';
import { DateRange } from 'react-day-picker';
import api from '../../../utils/api';
import { Course, Lesson, AttendanceRecord, ClassReport, formatDateTime } from './types';

type Preset = 'last-2-weeks' | 'this-month' | 'last-month' | 'custom';

function getPresetRange(preset: Exclude<Preset, 'custom'>): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (preset === 'last-2-weeks') {
    const start = new Date(today);
    start.setDate(start.getDate() - 14);
    start.setHours(0, 0, 0, 0);
    return { start, end: today };
  }
  if (preset === 'this-month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start, end: today };
  }
  // last-month
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
  return { start, end };
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function calcHours(startTime: string, endTime: string): number {
  return (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
}

interface Props {
  courseId: string;
  course: Course;
}

export default function AttendanceTab({ courseId, course }: Props) {
  const [activePreset, setActivePreset] = useState<Preset>('last-2-weeks');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord[]>>({});
  const [reportMap, setReportMap] = useState<Record<string, ClassReport | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  const getDateRange = useCallback((): { start: string; end: string } | null => {
    if (activePreset !== 'custom') {
      const range = getPresetRange(activePreset);
      return { start: toDateString(range.start), end: toDateString(range.end) };
    }
    if (customRange?.from && customRange?.to) {
      return { start: toDateString(customRange.from), end: toDateString(customRange.to) };
    }
    return null;
  }, [activePreset, customRange]);

  const fetchAttendanceData = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);
    setExpandedLessonId(null);

    try {
      const res = await api.get(
        `/scheduling/courses/${courseId}/lessons?category=date-range&startDate=${startDate}&endDate=${endDate}`,
      );
      const fetchedLessons: Lesson[] = res.data || [];
      setLessons(fetchedLessons);

      const [attEntries, reportEntries] = await Promise.all([
        Promise.all(
          fetchedLessons.map(async (lesson) => {
            try {
              const r = await api.get(`/scheduling/attendance/lesson/${lesson.id}`);
              return [lesson.id, r.data || []] as const;
            } catch {
              return [lesson.id, []] as const;
            }
          }),
        ),
        Promise.all(
          fetchedLessons.map(async (lesson) => {
            try {
              const r = await api.get(`/scheduling/class-reports/lesson/${lesson.id}`);
              return [lesson.id, r.data || null] as const;
            } catch {
              return [lesson.id, null] as const;
            }
          }),
        ),
      ]);

      setAttendanceMap(Object.fromEntries(attEntries));
      setReportMap(Object.fromEntries(reportEntries));
    } catch {
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    const range = getDateRange();
    if (!range) return;
    fetchAttendanceData(range.start, range.end);
  }, [getDateRange, fetchAttendanceData]);

  const selectPreset = (preset: Exclude<Preset, 'custom'>) => {
    setActivePreset(preset);
    setShowCalendar(false);
  };

  const toggleCustom = () => {
    if (activePreset === 'custom' && showCalendar) {
      setShowCalendar(false);
    } else {
      setActivePreset('custom');
      setShowCalendar(true);
    }
  };

  const handleCustomRangeSelect = (
    range: DateRange | undefined,
  ) => {
    setCustomRange(range);
  };

  const formatColumnDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
  };

  const getStudentAttendanceForLesson = (studentId: string, lessonId: string): 'present' | 'absent' | null => {
    const records = attendanceMap[lessonId] || [];
    const record = records.find((r) => r.student.id === studentId);
    return record ? record.status : null;
  };

  const getStudentTotalHours = (studentId: string): number => {
    return lessons.reduce((total, lesson) => {
      const status = getStudentAttendanceForLesson(studentId, lesson.id);
      if (status === 'present') {
        return total + calcHours(lesson.startTime, lesson.endTime);
      }
      return total;
    }, 0);
  };

  const getTutorTotalHours = (): number => {
    return lessons.reduce((total, lesson) => {
      if (lesson.status === 'completed') {
        return total + calcHours(lesson.startTime, lesson.endTime);
      }
      return total;
    }, 0);
  };

  const expandedLesson = expandedLessonId ? lessons.find((l) => l.id === expandedLessonId) : null;

  const presets: { key: Exclude<Preset, 'custom'>; label: string }[] = [
    { key: 'last-2-weeks', label: 'Last 2 weeks' },
    { key: 'this-month', label: 'This month' },
    { key: 'last-month', label: 'Last month' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => selectPreset(p.key)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              activePreset === p.key
                ? 'bg-spicy-red text-white border-spicy-red'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={toggleCustom}
          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            activePreset === 'custom'
              ? 'bg-spicy-red text-white border-spicy-red'
              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
          }`}
        >
          Custom
        </button>
      </div>

      {showCalendar && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 inline-block">
          <Calendar
            mode="range"
            selected={customRange}
            onSelect={handleCustomRangeSelect}
            numberOfMonths={2}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500 py-4">Loading attendance...</p>
      ) : error ? (
        <p className="text-sm text-red-600 py-4">{error}</p>
      ) : lessons.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">No lessons in this period.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-white">Student</th>
                  {lessons.map((lesson) => (
                    <th key={lesson.id} className="px-3 py-2 text-center">
                      <button
                        onClick={() => setExpandedLessonId(expandedLessonId === lesson.id ? null : lesson.id)}
                        className={`text-xs font-medium hover:text-spicy-red transition-colors ${expandedLessonId === lesson.id ? 'text-spicy-red' : 'text-gray-600'}`}
                      >
                        {formatColumnDate(lesson.startTime)}
                      </button>
                    </th>
                  ))}
                  <th className="pl-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {course.students.map((student) => (
                  <tr key={student.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-900 font-medium whitespace-nowrap sticky left-0 bg-white">
                      {student.firstName} {student.lastName}
                    </td>
                    {lessons.map((lesson) => {
                      const status = getStudentAttendanceForLesson(student.id, lesson.id);
                      return (
                        <td key={lesson.id} className="px-3 py-2 text-center">
                          {status === 'present' && <span className="inline-block w-3 h-3 rounded-full bg-green-500" title="Present" />}
                          {status === 'absent' && <span className="inline-block w-3 h-3 rounded-full bg-red-500" title="Absent" />}
                          {status === null && <span className="text-gray-300">&mdash;</span>}
                        </td>
                      );
                    })}
                    <td className="pl-4 py-2 text-right font-medium text-gray-900">
                      {getStudentTotalHours(student.id).toFixed(1)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300">
                  <td className="py-2 pr-4 text-gray-600 font-medium sticky left-0 bg-white">
                    {course.tutor.firstName} {course.tutor.lastName} (tutor)
                  </td>
                  {lessons.map((lesson) => (
                    <td key={lesson.id} className="px-3 py-2 text-center">
                      {lesson.status === 'completed' && <span className="inline-block w-3 h-3 rounded-full bg-green-500" title="Taught" />}
                      {lesson.status !== 'completed' && <span className="text-gray-300">&mdash;</span>}
                    </td>
                  ))}
                  <td className="pl-4 py-2 text-right font-semibold text-spicy-dark">
                    {getTutorTotalHours().toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {expandedLesson && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-800">{formatDateTime(expandedLesson.startTime)}</h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  expandedLesson.status === 'completed' ? 'bg-green-100 text-green-700' :
                  expandedLesson.status === 'cancelled' ? 'bg-gray-200 text-gray-700' :
                  expandedLesson.status === 'no_show' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {expandedLesson.status}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                {(attendanceMap[expandedLesson.id] || []).map((record) => (
                  <div key={record.id} className="flex items-center gap-2 text-sm">
                    <span className={`inline-block w-2 h-2 rounded-full ${record.status === 'present' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-gray-700">{record.student.firstName} {record.student.lastName}</span>
                    <span className="text-gray-400 text-xs">{record.status}</span>
                  </div>
                ))}
              </div>

              {reportMap[expandedLesson.id] && (() => {
                const report = reportMap[expandedLesson.id]!;
                return (
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="text-sm font-semibold text-gray-800">{report.subject}</div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{report.content}</p>
                    {report.homeworkAssigned && <p className="text-xs text-gray-600 mt-2"><strong>Homework:</strong> {report.homeworkAssigned}</p>}
                    {report.studentProgress && <p className="text-xs text-gray-600 mt-1"><strong>Progress:</strong> {report.studentProgress}</p>}
                    {report.nextLessonNotes && <p className="text-xs text-gray-600 mt-1"><strong>Next lesson:</strong> {report.nextLessonNotes}</p>}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
