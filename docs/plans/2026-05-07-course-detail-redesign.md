# Course Detail Page Redesign

## Problem

The course detail page (`courses/[id]/page.tsx`) is 884 lines in a single component with excessive vertical scrolling. The admin needs to view attendance for arbitrary date ranges to calculate tutor payouts — functionality that doesn't exist today.

## Users

Admin and tutors share this page. Admin gets extra powers (edit course, adjust hours). Students do not use this page.

## Design

### Page Structure

**Persistent header** at top: course title, active/renewal badges, "Edit Course" button (admin only). Below that, a **compact stats bar** with hours balance and tutor name side by side.

Three tabs below, with selection persisted in URL query param (`?tab=attendance`):

1. **Schedule** (default)
2. **Attendance**
3. **Details**

### Schedule Tab

Combines current "Upcoming Lessons" and "Needs Attendance" into one actionable view.

**Needs Attendance** at top when lessons are awaiting completion. Compact rows with left-border accent: date/time, student names, "Log Attendance" button. Disappears entirely when empty.

**Upcoming Lessons** below. Rows with date/time, student names, Cancel/Reschedule buttons (tutor/admin). Single line "No upcoming lessons scheduled" when empty.

No historical lesson data on this tab — all history moves to Attendance.

### Attendance Tab

**Date range controls**: preset chips ("Last 2 weeks" default, "This month", "Last month") plus "Custom" chip that expands a dual calendar panel via `react-calendar`. Selecting a preset or confirming custom range triggers a fetch.

**Summary table**:
- Columns: one per lesson date in range (formatted "Mon 4/28"), plus "Total Hours" column
- Rows: one per enrolled student
- Cells: green dot (present), red dot (absent), gray dash (no record)
- Total Hours column: sum of lesson durations where student was present
- Tutor row at bottom: tutor name + total teaching hours for the period

**Drill-down**: clicking a lesson column header expands a detail panel below the table showing that lesson's full info — time, attendance list, class report if one exists.

Empty state: "No lessons in this period."

### Details Tab

Reference info and admin tools — low frequency access.

- **Course Info**: tutor, start date, weekly schedule inline (e.g., "Mon 10:00–11:00, Wed 14:00–15:00"). No card wrappers.
- **Students**: enrolled list with avatar initials, name, email.
- **Adjust Hours** (admin only): input + apply button + feedback. Positioned at bottom.

### Modals

Three existing modals (complete lesson, reschedule, cancel) remain as modals but extracted into separate components.

## Technical Notes

- `date-fns` and `react-calendar` already installed
- Backend already has `GET /scheduling/courses/:courseId/lessons?category=` endpoint — will need a new `?startDate=&endDate=` query param for arbitrary date ranges
- Attendance data: `GET /scheduling/attendance/lesson/:lessonId` (already exists)
- Tab state via URL query param for bookmarkability
