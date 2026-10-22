'use client';

import { useState } from 'react';
import { CourseUser } from '../types';

type AttendanceStatus = 'present' | 'absent';

export interface AttendancePayload {
  attendances: { studentId: string; status: AttendanceStatus }[];
  report?: {
    subject: string;
    content: string;
    homeworkAssigned?: string;
    studentProgress?: string;
    nextLessonNotes?: string;
  };
}

export interface AttendanceDraft {
  students: CourseUser[];
  statuses: Record<string, AttendanceStatus>;
  setStatus: (studentId: string, status: AttendanceStatus) => void;
  included: Record<string, boolean>;
  toggleIncluded: (studentId: string) => void;
  withReport: boolean;
  setWithReport: (next: boolean) => void;
  report: {
    subject: string;
    content: string;
    homework: string;
    progress: string;
    nextNotes: string;
  };
  setReportField: (field: keyof AttendanceDraft['report'], value: string) => void;
  includedCount: number;
  buildPayload: () => AttendancePayload;
}

// Draft state for marking attendance (and an optional class report) for a set
// of students. Shared by the "log attendance" and "log past class" forms.
export function useAttendanceDraft(students: CourseUser[]): AttendanceDraft {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(
    () => Object.fromEntries(students.map((s) => [s.id, 'present'])),
  );
  const [included, setIncluded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(students.map((s) => [s.id, true])),
  );
  const [withReport, setWithReport] = useState(false);
  const [report, setReport] = useState({
    subject: '',
    content: '',
    homework: '',
    progress: '',
    nextNotes: '',
  });

  const includedStudents = students.filter((s) => included[s.id] !== false);

  return {
    students,
    statuses,
    setStatus: (studentId, status) =>
      setStatuses((p) => ({ ...p, [studentId]: status })),
    included,
    toggleIncluded: (studentId) =>
      setIncluded((p) => ({ ...p, [studentId]: p[studentId] === false })),
    withReport,
    setWithReport,
    report,
    setReportField: (field, value) =>
      setReport((p) => ({ ...p, [field]: value })),
    includedCount: includedStudents.length,
    buildPayload: () => {
      const payload: AttendancePayload = {
        attendances: includedStudents.map((student) => ({
          studentId: student.id,
          status: statuses[student.id] || 'present',
        })),
      };
      if (withReport && report.subject.trim() && report.content.trim()) {
        payload.report = {
          subject: report.subject.trim(),
          content: report.content.trim(),
          homeworkAssigned: report.homework.trim() || undefined,
          studentProgress: report.progress.trim() || undefined,
          nextLessonNotes: report.nextNotes.trim() || undefined,
        };
      }
      return payload;
    },
  };
}

interface Props {
  draft: AttendanceDraft;
  // When true, each student gets a checkbox so only some of them can be
  // included (e.g. a past class only part of the group attended).
  selectable?: boolean;
}

const fieldClass =
  'w-full rounded-lg border border-spicy-dark/15 bg-white px-3 py-2 text-sm focus:border-spicy-red focus:outline-none focus:ring-2 focus:ring-spicy-red/20';

export default function AttendanceFields({ draft, selectable = false }: Props) {
  const { report, setReportField } = draft;

  return (
    <>
      <div>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-spicy-dark/55">
          Who was there?
        </h4>
        <div className="space-y-1.5">
          {draft.students.map((student) => {
            const status = draft.statuses[student.id] || 'present';
            const isIncluded = draft.included[student.id] !== false;
            return (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-lg border border-spicy-dark/10 bg-white px-3 py-2"
              >
                <label
                  className={`flex items-center gap-2 text-sm font-medium ${
                    isIncluded ? 'text-spicy-dark' : 'text-spicy-dark/40'
                  }`}
                >
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={isIncluded}
                      onChange={() => draft.toggleIncluded(student.id)}
                      className="h-4 w-4 rounded border-spicy-dark/30 text-spicy-red focus:ring-spicy-red/30"
                    />
                  )}
                  {student.firstName} {student.lastName}
                </label>
                {isIncluded && (
                  <div className="flex rounded-full bg-spicy-dark/5 p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => draft.setStatus(student.id, 'present')}
                      className={`rounded-full px-3 py-1 transition-colors ${
                        status === 'present'
                          ? 'bg-[#7a8f4a] text-white'
                          : 'text-spicy-dark/60 hover:text-spicy-dark'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => draft.setStatus(student.id, 'absent')}
                      className={`rounded-full px-3 py-1 transition-colors ${
                        status === 'absent'
                          ? 'bg-spicy-red text-white'
                          : 'text-spicy-dark/60 hover:text-spicy-dark'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => draft.setWithReport(!draft.withReport)}
          className="flex w-full items-center justify-between rounded-lg border border-spicy-dark/10 bg-white px-3 py-2 text-left text-sm font-medium text-spicy-dark hover:border-spicy-dark/25"
        >
          <span className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.12em] text-spicy-dark/55">
              Class report
            </span>
            <span className="text-spicy-dark/45">optional</span>
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${draft.withReport ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {draft.withReport && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              value={report.subject}
              onChange={(e) => setReportField('subject', e.target.value)}
              placeholder="Subject (e.g. Past tense ser/estar)"
              className={fieldClass}
            />
            <textarea
              value={report.content}
              onChange={(e) => setReportField('content', e.target.value)}
              placeholder="What did we cover?"
              rows={3}
              className={fieldClass}
            />
            <textarea
              value={report.homework}
              onChange={(e) => setReportField('homework', e.target.value)}
              placeholder="Homework (optional)"
              rows={2}
              className={fieldClass}
            />
            <textarea
              value={report.progress}
              onChange={(e) => setReportField('progress', e.target.value)}
              placeholder="Student progress (optional)"
              rows={2}
              className={fieldClass}
            />
            <textarea
              value={report.nextNotes}
              onChange={(e) => setReportField('nextNotes', e.target.value)}
              placeholder="Notes for next lesson (optional)"
              rows={2}
              className={fieldClass}
            />
          </div>
        )}
      </div>
    </>
  );
}
