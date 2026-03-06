# Lesson Attendance & Rename Design

**Goal:** Rename Appointment to Lesson throughout the stack, simplify attendance logging, and give tutors a unified flow for marking attendance + writing reports from the course detail page.

**Date:** 2026-03-05

---

## Summary of Changes

1. Rename Appointment -> Lesson (entity, DB table, routes, DTOs, frontend)
2. Simplify attendance (remove on_time_cancellation, fix duplicate check, move hour deduction to lesson completion)
3. New `completeLesson` endpoint (attendance + optional report in one call)
4. Course detail page gets lessons section (tutor's hub for logging attendance)
5. Fix navigation (remove Tutors from tutor nav, filter courses by role)
6. Remove standalone attendance/class-reports pages

---

## 1. Rename Appointment -> Lesson

### Backend

**Entity rename:**
- `Appointment` -> `Lesson`
- `AppointmentStatus` -> `LessonStatus` (values: `scheduled`, `completed`, `cancelled`, `no_show`)
- File: `appointment.entity.ts` -> `lesson.entity.ts`

**DB migration:**
- Rename table `appointment` -> `lesson`
- Rename pivot table `appointment_students` -> `lesson_students`
- Rename FK columns referencing `appointment` in `attendance` and `class_report` tables

**Related entities updated:**
- `Attendance.appointment` -> `Attendance.lesson`
- `ClassReport.appointment` -> `ClassReport.lesson`

**Service/Controller/DTOs:**
- `SchedulingService`: all `*Appointment*` methods -> `*Lesson*`
- `SchedulingController`: routes change from `/scheduling/appointments/...` -> `/scheduling/lessons/...`
- DTOs: `CreateAppointmentDto` -> `CreateLessonDto`, etc.
- `AppointmentGeneratorService` -> `LessonGeneratorService`

### Frontend

- `SchedulingContext`: `Appointment` interface -> `Lesson`, all method names updated
- All API calls: `/scheduling/appointments/...` -> `/scheduling/lessons/...`
- All page components: type names and variable names updated
- Google Calendar event titles: "Spanish Class" stays (no need to say "Lesson" there)

---

## 2. Simplify Attendance Model

### Remove ON_TIME_CANCELLATION status

`AttendanceStatus` becomes:
```typescript
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
}
```

Cancellation is a lesson-level action handled by the existing cancel flow with `creditHoursBack`.

### Fix duplicate check

Current (buggy): checks `{ appointment }` — allows only one attendance per lesson.
Fixed: checks `{ lesson, student }` — allows one attendance per student per lesson.

### Move hour deduction

Current: hours deducted in `createAttendance` per-student call.
New: hours deducted once when lesson is marked complete via `completeLesson`.

---

## 3. New `completeLesson` Endpoint

### `POST /scheduling/lessons/:id/complete`

**Request body:**
```typescript
export class CompleteLessonDto {
  attendances: {
    studentId: string;
    status: AttendanceStatus; // 'present' | 'absent'
  }[];

  report?: {
    subject: string;
    content: string;
    homeworkAssigned?: string;
    studentProgress?: string;
    nextLessonNotes?: string;
  };
}
```

**Behavior:**
1. Validate lesson exists and is in `SCHEDULED` status
2. Validate all studentIds belong to the lesson's course
3. Create `Attendance` record for each student
4. If report provided, create `ClassReport` record
5. Set lesson status to `COMPLETED`
6. Deduct hours from course balance (based on lesson duration)
7. Update `needsRenewal` flag if balance <= 0
8. Update Google Calendar event title to include "(Completed)"
9. Return the updated lesson with attendance and report

**Access:** Tutor (own lessons) and Admin (any lesson).

---

## 4. Course Detail Page — Lessons Section

### Tutor/Admin view on `/dashboard/courses/[id]`

Add a **Lessons** section below the existing course details showing:

**Upcoming lessons** (status = `scheduled`, startTime > now):
- Date/time, student names, "Log Attendance" button

**Recent lessons** (last 10, any status):
- Date/time, student names, status badge, attendance summary
- Completed: "View Report" link
- Cancelled: greyed out

### "Log Attendance" form (inline or modal)

When tutor clicks "Log Attendance" on a scheduled lesson:
- List each student with present/absent toggle (default: present)
- Optional class report section (collapsible):
  - Subject (text input)
  - Content (textarea)
  - Homework assigned (textarea, optional)
  - Student progress (textarea, optional)
  - Notes for next lesson (textarea, optional)
- Submit button -> calls `POST /scheduling/lessons/:id/complete`

### Student view

Students see their courses' lesson history (read-only): date, status, and any class report content relevant to them.

---

## 5. Navigation & Filtering Fixes

### Tutor nav items (in `layout.tsx`)

Remove "Tutors" and "Students" tabs. New tutor nav:
- Dashboard
- Availability
- Courses
- Profile

### Course filtering by role

Frontend `fetchCourses` changes:
- **Admin:** `GET /courses` (all)
- **Tutor:** `GET /courses/tutor/:tutorId` (assigned only)
- **Student:** `GET /courses/student/:studentId` (enrolled only)

Backend endpoints already exist for these.

---

## 6. Remove Standalone Pages

Delete or repurpose:
- `/dashboard/attendance/page.tsx` — replaced by course detail lesson flow
- `/dashboard/class-reports/page.tsx` — replaced by course detail lesson flow
- `/dashboard/attendance-overview/page.tsx` — fold stats into admin dashboard if needed

Remove from admin nav if present as separate items.

---

## What's NOT Changing

- Lesson generator cron job (renamed, same logic)
- Google Calendar integration
- Email notifications (confirmation, cancellation, reminders)
- Availability entity/management
- Cancel lesson flow with `creditHoursBack`
- Course CRUD (create, edit, adjust hours, add/remove students/schedules)
- Payments module
- ClassReport entity structure (just FK rename)
