# Course Detail Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the course detail page into a tabbed layout with a new attendance tab that supports date-range filtering and a summary table for tutor payout calculation.

**Architecture:** Add a `date-range` category to the existing backend lessons endpoint with `startDate`/`endDate` query params. Decompose the 884-line monolith page into a shell with three tab components plus extracted modal components. The Attendance tab fetches lessons + attendance for a date range and renders a summary grid.

**Tech Stack:** Next.js 13+ (App Router), TypeScript, Tailwind CSS, Radix UI Tabs, react-day-picker Calendar, NestJS, MikroORM, PostgreSQL.

---

### Task 1: Backend — Add date-range lesson query

**Files:**
- Modify: `backend/src/scheduling/scheduling.controller.ts:50-57`
- Modify: `backend/src/scheduling/scheduling.service.ts:77-147`
- Modify: `backend/src/scheduling/scheduling.service.spec.ts` (add tests)

**Step 1: Write the failing test**

In `backend/src/scheduling/scheduling.service.spec.ts`, add a new `describe` block after the existing lesson tests:

```typescript
describe("findLessonsByCourse with date-range category", () => {
  it("should return lessons within the given date range", async () => {
    const startDate = "2026-04-01";
    const endDate = "2026-04-15";

    mockLessonRepository.find.mockResolvedValue([mockLesson]);

    const result = await service.findLessonsByCourse(
      "course-1",
      mockAdmin,
      "date-range",
      startDate,
      endDate,
    );

    expect(mockLessonRepository.find).toHaveBeenCalledWith(
      {
        course: "course-1",
        startTime: {
          $gte: new Date(`${startDate}T00:00:00`),
          $lte: new Date(`${endDate}T23:59:59.999`),
        },
      },
      {
        populate: ["students", "tutor", "course"],
        orderBy: { startTime: "ASC" },
      },
    );

    expect(result).toEqual([mockLesson]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx jest --testPathPattern scheduling.service.spec --no-coverage -t "date-range" --verbose`
Expected: FAIL — `findLessonsByCourse` does not accept `startDate`/`endDate` params.

**Step 3: Implement the backend changes**

In `backend/src/scheduling/scheduling.service.ts`, update the `findLessonsByCourse` signature and add the new category branch:

```typescript
async findLessonsByCourse(
  courseId: string,
  actor: User,
  category?: "upcoming" | "needs-attendance" | "recent" | "date-range",
  startDate?: string,
  endDate?: string,
) {
  // ... existing course lookup and auth checks unchanged ...

  const now = new Date();
  const populate = ["students", "tutor", "course"] as const;

  if (category === "date-range" && startDate && endDate) {
    return this.lessonRepository.find(
      {
        course: courseId,
        startTime: {
          $gte: new Date(`${startDate}T00:00:00`),
          $lte: new Date(`${endDate}T23:59:59.999`),
        },
      },
      { populate, orderBy: { startTime: "ASC" } },
    );
  }

  // ... rest of existing category handling unchanged ...
}
```

In `backend/src/scheduling/scheduling.controller.ts`, update the route handler:

```typescript
@Get("courses/:courseId/lessons")
async findLessonsByCourse(
  @Param("courseId") courseId: string,
  @Query("category") category: "upcoming" | "needs-attendance" | "recent" | "date-range" | undefined,
  @Query("startDate") startDate: string | undefined,
  @Query("endDate") endDate: string | undefined,
  @Req() req: Request & { user: User },
) {
  return this.schedulingService.findLessonsByCourse(courseId, req.user, category, startDate, endDate);
}
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npx jest --testPathPattern scheduling.service.spec --no-coverage -t "date-range" --verbose`
Expected: PASS

**Step 5: Run full test suite to check for regressions**

Run: `cd backend && npx jest --no-coverage --verbose`
Expected: All existing tests still pass.

**Step 6: Commit**

```bash
git add backend/src/scheduling/scheduling.controller.ts backend/src/scheduling/scheduling.service.ts backend/src/scheduling/scheduling.service.spec.ts
git commit -m "feat: add date-range category to course lessons endpoint"
```

---

### Task 2: Extract modal components from the page

**Files:**
- Create: `frontend/src/app/dashboard/courses/[id]/CompleteLessonModal.tsx`
- Create: `frontend/src/app/dashboard/courses/[id]/RescheduleLessonModal.tsx`
- Create: `frontend/src/app/dashboard/courses/[id]/CancelLessonModal.tsx`

Extract the three modals from the current page into standalone components. Each modal manages its own local state and calls a callback on success.

**Step 1: Create CompleteLessonModal**

Create `frontend/src/app/dashboard/courses/[id]/CompleteLessonModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import api from '../../../../utils/api';

interface CourseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Lesson {
  id: string;
  students: CourseUser[];
  tutor: CourseUser;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

type AttendanceDraft = Record<string, 'present' | 'absent'>;

interface Props {
  lesson: Lesson;
  onClose: () => void;
  onCompleted: () => void;
}

export default function CompleteLessonModal({ lesson, onClose, onCompleted }: Props) {
  const [attendanceDraft, setAttendanceDraft] = useState<AttendanceDraft>(() => {
    const draft: AttendanceDraft = {};
    lesson.students.forEach((s) => { draft[s.id] = 'present'; });
    return draft;
  });
  const [withReport, setWithReport] = useState(false);
  const [reportSubject, setReportSubject] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportHomework, setReportHomework] = useState('');
  const [reportProgress, setReportProgress] = useState('');
  const [reportNextNotes, setReportNextNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const attendances = lesson.students.map((student) => ({
      studentId: student.id,
      status: attendanceDraft[student.id] || 'present',
    }));

    const payload: Record<string, unknown> = { attendances };
    if (withReport && reportSubject.trim() && reportContent.trim()) {
      payload.report = {
        subject: reportSubject.trim(),
        content: reportContent.trim(),
        homeworkAssigned: reportHomework.trim() || undefined,
        studentProgress: reportProgress.trim() || undefined,
        nextLessonNotes: reportNextNotes.trim() || undefined,
      };
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`/scheduling/lessons/${lesson.id}/complete`, payload);
      onCompleted();
    } catch {
      setError('Failed to complete lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-spicy-dark">Complete Lesson</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
        </div>

        <div className="space-y-3">
          {lesson.students.map((student) => (
            <div key={student.id} className="flex items-center justify-between border border-gray-200 rounded p-3">
              <div className="text-sm text-gray-900">{student.firstName} {student.lastName}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAttendanceDraft((prev) => ({ ...prev, [student.id]: 'present' }))}
                  className={`px-3 py-1 text-xs rounded ${attendanceDraft[student.id] === 'present' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Present
                </button>
                <button
                  onClick={() => setAttendanceDraft((prev) => ({ ...prev, [student.id]: 'absent' }))}
                  className={`px-3 py-1 text-xs rounded ${attendanceDraft[student.id] === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t pt-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={withReport} onChange={(e) => setWithReport(e.target.checked)} />
            Add class report
          </label>

          {withReport && (
            <div className="mt-3 space-y-3">
              <input type="text" value={reportSubject} onChange={(e) => setReportSubject(e.target.value)} placeholder="Subject" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              <textarea value={reportContent} onChange={(e) => setReportContent(e.target.value)} placeholder="Content" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              <textarea value={reportHomework} onChange={(e) => setReportHomework(e.target.value)} placeholder="Homework assigned (optional)" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              <textarea value={reportProgress} onChange={(e) => setReportProgress(e.target.value)} placeholder="Student progress (optional)" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              <textarea value={reportNextNotes} onChange={(e) => setReportNextNotes(e.target.value)} placeholder="Notes for next lesson (optional)" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
          )}
        </div>

        {error && <div className="mt-4 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm">Cancel</button>
          <button onClick={submit} disabled={loading} className="px-4 py-2 bg-spicy-red text-white rounded-md text-sm hover:bg-spicy-orange disabled:opacity-50">
            {loading ? 'Saving...' : 'Complete Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create RescheduleLessonModal**

Create `frontend/src/app/dashboard/courses/[id]/RescheduleLessonModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import api from '../../../../utils/api';

interface CourseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Lesson {
  id: string;
  students: CourseUser[];
  tutor: CourseUser;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

interface Props {
  lesson: Lesson;
  onClose: () => void;
  onRescheduled: () => void;
  formatDateTime: (value: string) => string;
}

export default function RescheduleLessonModal({ lesson, onClose, onRescheduled, formatDateTime }: Props) {
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">Original: {formatDateTime(lesson.startTime)}</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red" />
            </div>
          </div>
        </div>

        {error && <div className="mt-4 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm">Cancel</button>
          <button onClick={submit} disabled={loading} className="px-4 py-2 bg-spicy-red text-white rounded-md text-sm hover:bg-spicy-orange disabled:opacity-50">
            {loading ? 'Saving...' : 'Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create CancelLessonModal**

Create `frontend/src/app/dashboard/courses/[id]/CancelLessonModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import api from '../../../../utils/api';

interface CourseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Lesson {
  id: string;
  students: CourseUser[];
  tutor: CourseUser;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

interface Props {
  lesson: Lesson;
  onClose: () => void;
  onCancelled: () => void;
  formatDateTime: (value: string) => string;
}

export default function CancelLessonModal({ lesson, onClose, onCancelled, formatDateTime }: Props) {
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to cancel the lesson on{' '}
          <span className="font-medium">{formatDateTime(lesson.startTime)}</span>?
        </p>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={debitHours} onChange={(e) => setDebitHours(e.target.checked)} />
          Debit hours from student
        </label>

        {error && <div className="mt-4 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm">Go Back</button>
          <button onClick={submit} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Cancelling...' : 'Cancel Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Verify the files compile**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors related to the new modal files.

**Step 5: Commit**

```bash
git add frontend/src/app/dashboard/courses/\[id\]/CompleteLessonModal.tsx frontend/src/app/dashboard/courses/\[id\]/RescheduleLessonModal.tsx frontend/src/app/dashboard/courses/\[id\]/CancelLessonModal.tsx
git commit -m "refactor: extract lesson modals into standalone components"
```

---

### Task 3: Create shared types file

**Files:**
- Create: `frontend/src/app/dashboard/courses/[id]/types.ts`

Extract duplicated interfaces into a shared types file used by the page and all tab/modal components.

**Step 1: Create the types file**

Create `frontend/src/app/dashboard/courses/[id]/types.ts`:

```typescript
export interface CourseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CourseSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Course {
  id: string;
  title: string;
  tutor: CourseUser;
  students: CourseUser[];
  schedules: CourseSchedule[];
  startDate: string;
  isActive: boolean;
  hoursBalance: number;
  needsRenewal: boolean;
  createdAt: string;
}

export interface Lesson {
  id: string;
  students: CourseUser[];
  tutor: CourseUser;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  student: CourseUser;
  status: 'present' | 'absent';
}

export interface ClassReport {
  id: string;
  subject: string;
  content: string;
  homeworkAssigned?: string;
  studentProgress?: string;
  nextLessonNotes?: string;
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
```

**Step 2: Update modal components to import from types**

In each of the three modal files, remove the local `CourseUser` and `Lesson` interfaces and replace with:
```typescript
import { Lesson, formatDateTime } from './types';
```

For `RescheduleLessonModal` and `CancelLessonModal`, remove the `formatDateTime` prop since they can import it directly. Update their `Props` interfaces accordingly.

**Step 3: Verify compilation**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors.

**Step 4: Commit**

```bash
git add frontend/src/app/dashboard/courses/\[id\]/types.ts frontend/src/app/dashboard/courses/\[id\]/CompleteLessonModal.tsx frontend/src/app/dashboard/courses/\[id\]/RescheduleLessonModal.tsx frontend/src/app/dashboard/courses/\[id\]/CancelLessonModal.tsx
git commit -m "refactor: extract shared types for course detail components"
```

---

### Task 4: Create the Schedule tab component

**Files:**
- Create: `frontend/src/app/dashboard/courses/[id]/ScheduleTab.tsx`

**Step 1: Create ScheduleTab**

Create `frontend/src/app/dashboard/courses/[id]/ScheduleTab.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Lesson, formatDateTime } from './types';
import CompleteLessonModal from './CompleteLessonModal';
import RescheduleLessonModal from './RescheduleLessonModal';
import CancelLessonModal from './CancelLessonModal';

interface Props {
  upcomingLessons: Lesson[];
  needsAttendanceLessons: Lesson[];
  lessonsLoading: boolean;
  lessonsError: string | null;
  userRole: string;
  onLessonChanged: () => void;
}

export default function ScheduleTab({
  upcomingLessons,
  needsAttendanceLessons,
  lessonsLoading,
  lessonsError,
  userRole,
  onLessonChanged,
}: Props) {
  const [completeLesson, setCompleteLesson] = useState<Lesson | null>(null);
  const [rescheduleLesson, setRescheduleLesson] = useState<Lesson | null>(null);
  const [cancelLesson, setCancelLesson] = useState<Lesson | null>(null);

  if (lessonsLoading) {
    return <p className="text-sm text-gray-500 py-4">Loading lessons...</p>;
  }

  if (lessonsError) {
    return <p className="text-sm text-red-600 py-4">{lessonsError}</p>;
  }

  return (
    <div className="space-y-6">
      {(userRole === 'tutor' || userRole === 'admin') && needsAttendanceLessons.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-spicy-dark uppercase tracking-wide mb-3">Needs Attendance</h3>
          <div className="space-y-2">
            {needsAttendanceLessons.map((lesson) => (
              <div key={lesson.id} className="border-l-4 border-spicy-red bg-white rounded-r-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{formatDateTime(lesson.startTime)}</div>
                  <div className="text-xs text-gray-500">
                    {lesson.students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => setCompleteLesson(lesson)}
                  className="px-3 py-1.5 bg-spicy-red text-white text-sm rounded-md hover:bg-spicy-orange"
                >
                  Log Attendance
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-spicy-dark uppercase tracking-wide mb-3">Upcoming</h3>
        {upcomingLessons.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming lessons scheduled.</p>
        ) : (
          <div className="space-y-2">
            {upcomingLessons.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{formatDateTime(lesson.startTime)}</div>
                  <div className="text-xs text-gray-500">
                    {lesson.students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                  </div>
                </div>
                {(userRole === 'tutor' || userRole === 'admin') && lesson.status === 'scheduled' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCancelLesson(lesson)}
                      className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-md hover:bg-red-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setRescheduleLesson(lesson)}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                    >
                      Reschedule
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {completeLesson && (
        <CompleteLessonModal
          lesson={completeLesson}
          onClose={() => setCompleteLesson(null)}
          onCompleted={() => { setCompleteLesson(null); onLessonChanged(); }}
        />
      )}
      {rescheduleLesson && (
        <RescheduleLessonModal
          lesson={rescheduleLesson}
          onClose={() => setRescheduleLesson(null)}
          onRescheduled={() => { setRescheduleLesson(null); onLessonChanged(); }}
        />
      )}
      {cancelLesson && (
        <CancelLessonModal
          lesson={cancelLesson}
          onClose={() => setCancelLesson(null)}
          onCancelled={() => { setCancelLesson(null); onLessonChanged(); }}
        />
      )}
    </div>
  );
}
```

**Step 2: Verify compilation**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors.

**Step 3: Commit**

```bash
git add frontend/src/app/dashboard/courses/\[id\]/ScheduleTab.tsx
git commit -m "feat: create ScheduleTab component for course detail page"
```

---

### Task 5: Create the Attendance tab component

**Files:**
- Create: `frontend/src/app/dashboard/courses/[id]/AttendanceTab.tsx`

This is the largest new component — the date range picker, summary table, and drill-down.

**Step 1: Create AttendanceTab**

Create `frontend/src/app/dashboard/courses/[id]/AttendanceTab.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '../../../components/ui/calendar';
import { DateRange } from 'react-day-picker';
import api from '../../../../utils/api';
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

  const getDateRange = (): { start: string; end: string } | null => {
    if (activePreset !== 'custom') {
      const range = getPresetRange(activePreset);
      return { start: toDateString(range.start), end: toDateString(range.end) };
    }
    if (customRange?.from && customRange?.to) {
      return { start: toDateString(customRange.from), end: toDateString(customRange.to) };
    }
    return null;
  };

  useEffect(() => {
    const range = getDateRange();
    if (!range) return;
    fetchAttendanceData(range.start, range.end);
  }, [activePreset, customRange]);

  const fetchAttendanceData = async (startDate: string, endDate: string) => {
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
  };

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

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
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
                          {status === null && <span className="text-gray-300">—</span>}
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
                      {lesson.status === 'cancelled' && <span className="text-gray-300">—</span>}
                      {lesson.status !== 'completed' && lesson.status !== 'cancelled' && <span className="text-gray-300">—</span>}
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
```

**Step 2: Verify compilation**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors.

**Step 3: Commit**

```bash
git add frontend/src/app/dashboard/courses/\[id\]/AttendanceTab.tsx
git commit -m "feat: create AttendanceTab with date range picker and summary table"
```

---

### Task 6: Create the Details tab component

**Files:**
- Create: `frontend/src/app/dashboard/courses/[id]/DetailsTab.tsx`

**Step 1: Create DetailsTab**

Create `frontend/src/app/dashboard/courses/[id]/DetailsTab.tsx`:

```tsx
'use client';

import { useState } from 'react';
import api from '../../../../utils/api';
import { Course, DAY_NAMES } from './types';

interface Props {
  course: Course;
  courseId: string;
  userRole: string;
  onCourseUpdated: (course: Course) => void;
}

export default function DetailsTab({ course, courseId, userRole, onCourseUpdated }: Props) {
  const [hoursInput, setHoursInput] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  const handleAdjustHours = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours === 0) {
      setAdjustError('Enter a non-zero number of hours (use negative to deduct)');
      return;
    }

    setAdjusting(true);
    setAdjustError(null);
    setAdjustSuccess(null);

    try {
      const response = await api.patch(`/courses/${courseId}/hours`, { hours });
      onCourseUpdated(response.data);
      setHoursInput('');
      setAdjustSuccess(`Hours balance updated to ${Number(response.data.hoursBalance).toFixed(1)}`);
    } catch {
      setAdjustError('Failed to adjust hours');
    } finally {
      setAdjusting(false);
    }
  };

  const scheduleDisplay = course.schedules && course.schedules.length > 0
    ? course.schedules.map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}–${s.endTime}`).join(', ')
    : 'No schedule set';

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-spicy-dark uppercase tracking-wide mb-3">Course Info</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500 w-24 shrink-0">Tutor</dt>
            <dd className="text-gray-900">{course.tutor ? `${course.tutor.firstName} ${course.tutor.lastName}` : '—'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500 w-24 shrink-0">Start Date</dt>
            <dd className="text-gray-900">{new Date(course.startDate).toLocaleDateString()}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500 w-24 shrink-0">Schedule</dt>
            <dd className="text-gray-900">{scheduleDisplay}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-spicy-dark uppercase tracking-wide mb-3">
          Students ({course.students?.length ?? 0})
        </h3>
        {course.students && course.students.length > 0 ? (
          <ul className="space-y-2">
            {course.students.map((student) => (
              <li key={student.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-spicy-red flex items-center justify-center text-white text-xs font-bold">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                  <div className="text-xs text-gray-500">{student.email}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No students enrolled</p>
        )}
      </div>

      {userRole === 'admin' && (
        <div>
          <h3 className="text-sm font-semibold text-spicy-dark uppercase tracking-wide mb-1">Adjust Hours</h3>
          <p className="text-xs text-gray-500 mb-3">
            Add hours when a package is purchased, or deduct to manually correct the balance.
          </p>

          {adjustSuccess && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{adjustSuccess}</div>
          )}
          {adjustError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{adjustError}</div>
          )}

          <form onSubmit={handleAdjustHours} className="flex gap-2">
            <input
              type="number"
              step="0.5"
              value={hoursInput}
              onChange={(e) => setHoursInput(e.target.value)}
              placeholder="e.g. 10 or -2"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red"
              required
            />
            <button
              type="submit"
              disabled={adjusting}
              className="px-4 py-2 bg-spicy-red text-white rounded-md text-sm font-medium hover:bg-spicy-orange disabled:opacity-50"
            >
              {adjusting ? 'Saving...' : 'Apply'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify compilation**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors.

**Step 3: Commit**

```bash
git add frontend/src/app/dashboard/courses/\[id\]/DetailsTab.tsx
git commit -m "feat: create DetailsTab component for course detail page"
```

---

### Task 7: Rewrite the main page with tabbed layout

**Files:**
- Modify: `frontend/src/app/dashboard/courses/[id]/page.tsx`

Replace the entire page with the new tabbed layout that uses the extracted components.

**Step 1: Rewrite page.tsx**

Replace the full contents of `frontend/src/app/dashboard/courses/[id]/page.tsx` with:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../../utils/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Course } from './types';
import ScheduleTab from './ScheduleTab';
import AttendanceTab from './AttendanceTab';
import DetailsTab from './DetailsTab';

interface Lesson {
  id: string;
  students: { id: string; firstName: string; lastName: string; email: string }[];
  tutor: { id: string; firstName: string; lastName: string; email: string };
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

export default function CourseViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [needsAttendanceLessons, setNeedsAttendanceLessons] = useState<Lesson[]>([]);

  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonsError, setLessonsError] = useState<string | null>(null);

  const activeTab = searchParams.get('tab') || 'schedule';

  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'schedule') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const qs = params.toString();
    router.replace(`/dashboard/courses/${courseId}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  useEffect(() => {
    fetchCourse();
    fetchScheduleLessons();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data);
    } catch {
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleLessons = async () => {
    try {
      setLessonsLoading(true);
      setLessonsError(null);
      const base = `/scheduling/courses/${courseId}/lessons`;

      const [upcomingRes, needsAttendanceRes] = await Promise.all([
        api.get(`${base}?category=upcoming`),
        api.get(`${base}?category=needs-attendance`),
      ]);

      setUpcomingLessons(upcomingRes.data || []);
      setNeedsAttendanceLessons(needsAttendanceRes.data || []);
    } catch {
      setLessonsError('Failed to load lessons');
    } finally {
      setLessonsLoading(false);
    }
  };

  const handleLessonChanged = () => {
    fetchScheduleLessons();
    fetchCourse();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-spicy-red"></div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="text-xl text-red-700 font-semibold">Error</h2>
          <p className="text-red-600">{error ?? 'Course not found'}</p>
          <Link href="/dashboard/courses" className="mt-4 inline-block text-spicy-red hover:underline">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/courses" className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-spicy-dark">{course.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {course.isActive ? 'Active' : 'Inactive'}
              </span>
              {course.needsRenewal && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  Needs Renewal
                </span>
              )}
            </div>
          </div>
        </div>
        {user?.role === 'admin' && (
          <Link
            href={`/dashboard/courses/${courseId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Edit Course
          </Link>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${course.hoursBalance <= 0 ? 'text-red-500' : course.hoursBalance <= 2 ? 'text-orange-500' : 'text-green-600'}`}>
            {Number(course.hoursBalance).toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">hours remaining</span>
        </div>
        <div className="text-sm text-gray-500">
          Tutor: <span className="text-gray-900 font-medium">{course.tutor ? `${course.tutor.firstName} ${course.tutor.lastName}` : '—'}</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <ScheduleTab
            upcomingLessons={upcomingLessons}
            needsAttendanceLessons={needsAttendanceLessons}
            lessonsLoading={lessonsLoading}
            lessonsError={lessonsError}
            userRole={user?.role || ''}
            onLessonChanged={handleLessonChanged}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab courseId={courseId} course={course} />
        </TabsContent>

        <TabsContent value="details">
          <DetailsTab
            course={course}
            courseId={courseId}
            userRole={user?.role || ''}
            onCourseUpdated={setCourse}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Step 2: Verify compilation**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors.

**Step 3: Run dev server and test in browser**

Run: `cd frontend && npm run dev`

Test the following:
1. Navigate to a course detail page — should show tabbed layout with header and stats bar
2. **Schedule tab**: verify upcoming lessons and needs-attendance section render
3. Click **Attendance tab**: verify preset chips, default "Last 2 weeks" loads, summary table renders with dots
4. Click a lesson column header — detail panel expands below table
5. Click "Custom" chip — dual calendar appears, select a range, data reloads
6. Click **Details tab**: verify course info, students, and adjust hours (admin) render
7. Test modal flows: Log Attendance, Cancel, Reschedule from the Schedule tab
8. Verify the `?tab=` query param updates in the URL when switching tabs
9. Verify direct navigation to `?tab=attendance` lands on the Attendance tab

**Step 4: Commit**

```bash
git add frontend/src/app/dashboard/courses/\[id\]/page.tsx
git commit -m "feat: rewrite course detail page with tabbed layout"
```

---

### Task 8: Visual polish and testing

**Files:**
- Possibly modify: any of the tab components for styling fixes

**Step 1: Test edge cases in browser**

1. Course with zero students — Details tab should show "No students enrolled"
2. Course with no lessons in a date range — Attendance tab should show "No lessons in this period."
3. Course with no schedule — Details tab should show "No schedule set"
4. Tutor view (non-admin) — "Edit Course" button and "Adjust Hours" section should be hidden
5. Needs attendance with empty list — section should not appear at all on Schedule tab
6. Test on narrow viewport (mobile) — attendance table should scroll horizontally

**Step 2: Fix any issues found**

Apply fixes as needed.

**Step 3: Run lint**

Run: `cd frontend && npm run lint`
Expected: No errors.

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: visual polish and edge case fixes for course detail redesign"
```
