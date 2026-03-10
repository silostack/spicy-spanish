# Lesson Cancellation from Course Page

## Summary

Add lesson cancellation with hour-debit control to the course detail page and improve the existing schedule page cancellation flow.

## Current State

- **Backend**: Fully implemented. `PATCH /scheduling/lessons/:id/cancel` accepts `{ creditHoursBack: boolean }`. The service sets status to CANCELLED, optionally credits hours back, deletes Google Calendar event, and sends email notification.
- **Schedule page**: Has a cancel button but uses `window.confirm` and hardcodes `creditHoursBack = false` (always debits hours).
- **Course detail page**: No cancel button. Only "Reschedule" and "Log Attendance" for upcoming lessons.

## Design

### Cancellation Modal

A confirmation modal shown when a tutor or admin clicks "Cancel" on a lesson. Contains:

- Text: "Are you sure you want to cancel this lesson?" with the lesson date/time
- Checkbox: **"Debit hours from student"** (unchecked by default)
  - Unchecked = hours credited back to course (`creditHoursBack: true`)
  - Checked = hours deducted from course balance (`creditHoursBack: false`)
- Buttons: "Cancel Lesson" (destructive/red) and "Go Back"

### Changes Required

**Frontend only — no backend changes.**

1. **Course detail page** (`frontend/src/app/dashboard/courses/[id]/page.tsx`):
   - Add "Cancel" button to upcoming lessons for admin and tutor roles
   - Show cancellation modal on click
   - Call `cancelAppointment(lessonId, creditHoursBack)` on confirm

2. **Schedule page** (`frontend/src/app/dashboard/schedule/page.tsx`):
   - Replace `window.confirm` with the same cancellation modal
   - Remove hardcoded `creditHoursBack = false`

The modal can be implemented inline in each page or as a shared component if the markup is identical.
