'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  AttendanceRecord,
  ClassReport,
  Lesson,
  getLessonDisplayState,
  lessonHours,
} from '../types';
import LessonStatusBadge from './LessonStatusBadge';
import RescheduleForm from './RescheduleForm';
import CancelForm from './CancelForm';
import LogAttendanceForm from './LogAttendanceForm';

type Action = 'reschedule' | 'cancel' | null;

interface Props {
  lesson: Lesson | null;
  userRole: string;
  attendance: AttendanceRecord[];
  report: ClassReport | null;
  onClose: () => void;
  onChanged: () => void;
}

export default function LessonDetailPanel({
  lesson,
  userRole,
  attendance,
  report,
  onClose,
  onChanged,
}: Props) {
  const [action, setAction] = useState<Action>(null);
  const [logging, setLogging] = useState(false);

  // Reset inline action when switching to a different lesson
  useEffect(() => {
    setAction(null);
    setLogging(false);
  }, [lesson?.id]);

  useEffect(() => {
    if (!lesson) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lesson, onClose]);

  const open = !!lesson;
  const state = lesson ? getLessonDisplayState(lesson) : null;
  const canManage = userRole === 'tutor' || userRole === 'admin';

  return (
    <>
      {/* Backdrop — soft cream, not modal-dark */}
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-30 bg-spicy-dark/15 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-label="Lesson detail"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[440px] flex-col bg-spicy-light shadow-[-24px_0_60px_-20px_rgba(72,44,45,0.25)] transition-transform duration-[220ms] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {lesson && state && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-spicy-dark/10 px-6 py-5">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-spicy-dark/45">
                  {format(new Date(lesson.startTime), 'EEEE')}
                </div>
                <div className="font-display text-2xl font-bold text-spicy-dark">
                  {format(new Date(lesson.startTime), 'MMM d, yyyy')}
                </div>
                <div className="mt-1 text-sm text-spicy-dark/70">
                  {format(new Date(lesson.startTime), 'h:mm a')} –{' '}
                  {format(new Date(lesson.endTime), 'h:mm a')}{' '}
                  <span className="text-spicy-dark/40">
                    · {lessonHours(lesson).toFixed(1)}h
                  </span>
                </div>
                <div className="mt-3">
                  <LessonStatusBadge state={state} />
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-2 text-spicy-dark/55 transition-colors hover:bg-spicy-dark/5 hover:text-spicy-dark"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* People */}
            <div className="border-b border-spicy-dark/10 px-6 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-spicy-dark/45">
                Tutor
              </div>
              <div className="mt-1 text-sm text-spicy-dark">
                {lesson.tutor.firstName} {lesson.tutor.lastName}
              </div>
              <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-spicy-dark/45">
                Student{lesson.students.length > 1 ? 's' : ''}
              </div>
              <ul className="mt-1 space-y-0.5 text-sm text-spicy-dark">
                {lesson.students.map((s) => (
                  <li key={s.id}>
                    {s.firstName} {s.lastName}
                  </li>
                ))}
              </ul>
            </div>

            {/* Body — depends on state */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {state === 'needs-attendance' && canManage && (
                <>
                  {!logging && (
                    <button
                      type="button"
                      onClick={() => setLogging(true)}
                      className="w-full rounded-full bg-spicy-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-spicy-red/90"
                    >
                      Log attendance
                    </button>
                  )}
                  {logging && (
                    <LogAttendanceForm
                      lesson={lesson}
                      onDone={() => {
                        setLogging(false);
                        onChanged();
                      }}
                    />
                  )}
                </>
              )}

              {state === 'needs-attendance' && !canManage && (
                <p className="text-sm text-spicy-dark/70">
                  Pending — your tutor hasn&apos;t logged this lesson yet.
                </p>
              )}

              {state === 'upcoming' && (
                <>
                  {canManage ? (
                    <div className="space-y-2">
                      {action !== 'cancel' && (
                        <CollapsibleAction
                          label="Reschedule"
                          open={action === 'reschedule'}
                          onToggle={() =>
                            setAction(
                              action === 'reschedule' ? null : 'reschedule',
                            )
                          }
                        >
                          <RescheduleForm
                            lesson={lesson}
                            onCancel={() => setAction(null)}
                            onDone={() => {
                              setAction(null);
                              onChanged();
                            }}
                          />
                        </CollapsibleAction>
                      )}
                      {action !== 'reschedule' && (
                        <CollapsibleAction
                          label="Cancel lesson"
                          tone="destructive"
                          open={action === 'cancel'}
                          onToggle={() =>
                            setAction(action === 'cancel' ? null : 'cancel')
                          }
                        >
                          <CancelForm
                            lesson={lesson}
                            onCancel={() => setAction(null)}
                            onDone={() => {
                              setAction(null);
                              onChanged();
                            }}
                          />
                        </CollapsibleAction>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-spicy-dark/70">
                      Scheduled. Contact your tutor or admin if you need to
                      reschedule.
                    </p>
                  )}
                </>
              )}

              {state === 'completed' && (
                <CompletedView attendance={attendance} report={report} />
              )}

              {state === 'cancelled' && (
                <p className="text-sm text-spicy-dark/70">
                  This lesson was cancelled.
                  {lesson.notes ? ` Note: ${lesson.notes}` : ''}
                </p>
              )}

              {state === 'no_show' && (
                <p className="text-sm text-spicy-dark/70">
                  Marked as no-show.
                  {lesson.notes ? ` Note: ${lesson.notes}` : ''}
                </p>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function CollapsibleAction({
  label,
  tone = 'default',
  open,
  onToggle,
  children,
}: {
  label: string;
  tone?: 'default' | 'destructive';
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const toneClasses =
    tone === 'destructive'
      ? 'text-red-600 hover:border-red-300'
      : 'text-spicy-dark hover:border-spicy-dark/30';

  return (
    <div className="rounded-xl border border-spicy-dark/10 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors ${toneClasses}`}
      >
        <span>{label}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
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
      {open && (
        <div className="border-t border-spicy-dark/10 bg-spicy-light/50 px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

function CompletedView({
  attendance,
  report,
}: {
  attendance: AttendanceRecord[];
  report: ClassReport | null;
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-spicy-dark/55">
          Attendance
        </div>
        {attendance.length === 0 ? (
          <p className="text-sm text-spicy-dark/55">No records.</p>
        ) : (
          <ul className="space-y-1.5">
            {attendance.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-spicy-dark/10 bg-white px-3 py-2 text-sm"
              >
                <span className="text-spicy-dark">
                  {r.student.firstName} {r.student.lastName}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    r.status === 'present'
                      ? 'text-[#6b7f3f]'
                      : 'text-spicy-red'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`block h-2 w-2 rounded-full ${
                      r.status === 'present' ? 'bg-[#7a8f4a]' : 'bg-spicy-red'
                    }`}
                  />
                  {r.status === 'present' ? 'Present' : 'Absent'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {report && (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-spicy-dark/55">
            Class report
          </div>
          <div className="rounded-xl border border-spicy-dark/10 bg-white px-4 py-3">
            <div className="font-display text-base font-semibold text-spicy-dark">
              {report.subject}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-spicy-dark/80">
              {report.content}
            </p>
            {report.homeworkAssigned && (
              <ReportField label="Homework" value={report.homeworkAssigned} />
            )}
            {report.studentProgress && (
              <ReportField label="Progress" value={report.studentProgress} />
            )}
            {report.nextLessonNotes && (
              <ReportField label="Next lesson" value={report.nextLessonNotes} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 border-t border-spicy-dark/10 pt-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-spicy-dark/50">
        {label}
      </div>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-spicy-dark/80">
        {value}
      </p>
    </div>
  );
}
