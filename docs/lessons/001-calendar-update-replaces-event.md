# 001 — Google Calendar `events.update` replaces the whole event

- **Date:** 2026-11-25
- **Affected:** `GoogleCalendarService.updateEvent` and its callers (lesson reschedule, lesson complete, course tutor handover)
- **Severity:** medium (silent data loss on calendar events; no effect on lessons, hours or payments)

## Symptom

Found in code review of the course tutor handover. Any lesson calendar event that was updated
(rescheduled, marked completed, or retitled on a tutor change) lost its guest list and its custom
reminders: students and tutors silently dropped off the event.

## Root cause

`updateEvent` called `calendar.events.update`, which is a full replace (PUT). The request body only
carried summary, description, start and end, so `attendees` and `reminders` set by `createEvent` were
cleared.

## Fix

`updateEvent` uses `calendar.events.patch`, which changes only the fields sent, and accepts an optional
`attendeeEmails` to replace the guest list deliberately (the handover passes students + new tutor).

## Lesson

When updating an external resource, check whether the API call is a replace or a patch. Prefer patch
semantics, and send a field only when you mean to change it.
