# Lesson Cancellation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a cancel button with debit-hours option to the course detail page, and upgrade the schedule page cancel flow to use the same modal instead of `window.confirm`.

**Architecture:** Both pages get inline cancel modal state (no shared component — the pages use different data-fetching patterns). Course detail page uses direct `api.patch()` calls; schedule page uses `cancelAppointment()` from SchedulingContext.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS

---

### Task 1: Add cancel modal state and handler to course detail page

**Files:**
- Modify: `frontend/src/app/dashboard/courses/[id]/page.tsx`

**Step 1: Add cancel modal state variables**

After line 105 (the reschedule state block), add:

```tsx
const [showCancelModal, setShowCancelModal] = useState(false);
const [cancelLesson, setCancelLesson] = useState<Lesson | null>(null);
const [cancelDebitHours, setCancelDebitHours] = useState(false);
const [cancelLoading, setCancelLoading] = useState(false);
const [cancelError, setCancelError] = useState<string | null>(null);
```

**Step 2: Add the cancel handler function**

After the `submitReschedule` function (around line 285), add:

```tsx
const openCancelModal = (lesson: Lesson) => {
  setCancelLesson(lesson);
  setCancelDebitHours(false);
  setCancelError(null);
  setShowCancelModal(true);
};

const submitCancelLesson = async () => {
  if (!cancelLesson) return;

  setCancelLoading(true);
  setCancelError(null);

  try {
    await api.patch(`/scheduling/lessons/${cancelLesson.id}/cancel`, {
      creditHoursBack: !cancelDebitHours,
    });
    setShowCancelModal(false);
    setCancelLesson(null);
    await fetchLessons();
    if (course) {
      await fetchCourse();
    }
  } catch {
    setCancelError('Failed to cancel lesson');
  } finally {
    setCancelLoading(false);
  }
};
```

**Step 3: Commit**

```bash
git add frontend/src/app/dashboard/courses/\[id\]/page.tsx
git commit -m "feat: add cancel lesson state and handler to course detail page"
```

---

### Task 2: Add cancel button and modal UI to course detail page

**Files:**
- Modify: `frontend/src/app/dashboard/courses/[id]/page.tsx`

**Step 1: Add "Cancel" button to upcoming lessons**

In the upcoming lessons section (around line 508), find the button group inside the `{(user?.role === 'tutor' || user?.role === 'admin') && lesson.status === 'scheduled' && (` block. Add a Cancel button before the Reschedule button:

```tsx
<button
  onClick={() => openCancelModal(lesson)}
  className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-md hover:bg-red-50"
>
  Cancel
</button>
```

**Step 2: Add cancel modal markup**

After the complete lesson modal closing `)}` (end of file, before the final `</div>` and `);`), add:

```tsx
{showCancelModal && cancelLesson && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-spicy-dark">Cancel Lesson</h3>
        <button onClick={() => setShowCancelModal(false)} className="text-gray-500 hover:text-gray-700">
          Close
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Are you sure you want to cancel the lesson on{' '}
        <span className="font-medium">{formatDateTime(cancelLesson.startTime)}</span>?
      </p>

      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={cancelDebitHours}
          onChange={(e) => setCancelDebitHours(e.target.checked)}
        />
        Debit hours from student
      </label>

      {cancelError && (
        <div className="mt-4 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          {cancelError}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={() => setShowCancelModal(false)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm"
        >
          Go Back
        </button>
        <button
          onClick={submitCancelLesson}
          disabled={cancelLoading}
          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
        >
          {cancelLoading ? 'Cancelling...' : 'Cancel Lesson'}
        </button>
      </div>
    </div>
  </div>
)}
```

**Step 4: Commit**

```bash
git add frontend/src/app/dashboard/courses/\[id\]/page.tsx
git commit -m "feat: add cancel button and modal UI to course detail page"
```

---

### Task 3: Replace window.confirm with cancel modal on schedule page

**Files:**
- Modify: `frontend/src/app/dashboard/schedule/page.tsx`

**Step 1: Add cancel modal state to StaffSchedule component**

Inside the `StaffSchedule` function, after the existing state declarations (around line 292), add:

```tsx
const [showCancelModal, setShowCancelModal] = useState(false);
const [cancelAppointmentId, setCancelAppointmentId] = useState<string | null>(null);
const [cancelAppointmentTime, setCancelAppointmentTime] = useState<string>('');
const [cancelDebitHours, setCancelDebitHours] = useState(false);
const [cancelLoading, setCancelLoading] = useState(false);
```

**Step 2: Replace handleCancelAppointmentClick**

Replace the existing `handleCancelAppointmentClick` function (lines 409-419) with:

```tsx
const handleCancelAppointmentClick = (appointmentId: string, startTime: string) => {
  setCancelAppointmentId(appointmentId);
  setCancelAppointmentTime(startTime);
  setCancelDebitHours(false);
  setShowCancelModal(true);
};

const submitCancelAppointment = async () => {
  if (!cancelAppointmentId) return;

  setCancelLoading(true);
  try {
    await cancelAppointment(cancelAppointmentId, !cancelDebitHours);
    setShowCancelModal(false);
    setCancelAppointmentId(null);
    if (showAppointmentDetails) setShowAppointmentDetails(false);
    addNotification({ message: 'Lesson cancelled successfully', type: 'success' });
  } catch {
    addNotification({ message: 'Failed to cancel lesson', type: 'error' });
  } finally {
    setCancelLoading(false);
  }
};
```

**Step 3: Update cancel button call sites**

There are two places that call `handleCancelAppointmentClick`. Update both:

1. **Upcoming lessons table** (around line 528): Change from `handleCancelAppointmentClick(appointment.id)` to `handleCancelAppointmentClick(appointment.id, appointment.startTime)`

2. **Lesson details modal** (around line 776): Change from `handleCancelAppointmentClick(selectedAppointment.id)` to `handleCancelAppointmentClick(selectedAppointment.id, selectedAppointment.startTime)`

**Step 4: Add cancel modal markup**

Before the closing `</div>` of the StaffSchedule return (just before the lesson details modal's closing `)}` or after it), add:

```tsx
{showCancelModal && cancelAppointmentId && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-spicy-dark">Cancel Lesson</h3>
        <button onClick={() => setShowCancelModal(false)} className="text-gray-500 hover:text-gray-700">
          Close
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Are you sure you want to cancel the lesson on{' '}
        <span className="font-medium">{formatDateTime(cancelAppointmentTime)}</span>?
      </p>

      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={cancelDebitHours}
          onChange={(e) => setCancelDebitHours(e.target.checked)}
        />
        Debit hours from student
      </label>

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={() => setShowCancelModal(false)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm"
        >
          Go Back
        </button>
        <button
          onClick={submitCancelAppointment}
          disabled={cancelLoading}
          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
        >
          {cancelLoading ? 'Cancelling...' : 'Cancel Lesson'}
        </button>
      </div>
    </div>
  </div>
)}
```

**Step 5: Commit**

```bash
git add frontend/src/app/dashboard/schedule/page.tsx
git commit -m "feat: replace window.confirm with cancel modal on schedule page"
```

---

### Task 4: Verify build passes

**Step 1: Run lint**

```bash
cd frontend && npm run lint
```

Expected: No errors.

**Step 2: Run build**

```bash
cd frontend && npm run build
```

Expected: Build succeeds with no type errors.

**Step 3: Commit any lint fixes if needed**

```bash
git add -A && git commit -m "fix: lint fixes for cancel modal"
```
