# Changelog

## 2026-11-25 — Switch a course's tutor

Admins can now hand a running course to a different tutor from the course edit page, instead of
creating a new course and splitting the student's hours and history. Upcoming classes move to the new
tutor; classes already taught stay on the old tutor's record; the hours balance is untouched.

**What changed:**
- New "Tutor" section on the course edit page: pick an active tutor, preview how many upcoming lessons
  will move, how many past lessons still need attendance (they stay with the old tutor), and any clashes
  with the new tutor's other lessons, then confirm.
- The new tutor sees the course and its upcoming lessons on their dashboard straight away; students see
  the new tutor on the course and in class reminders.
- Calendar events of moved lessons are retitled and their guest list updated; updating a lesson's
  calendar event no longer drops its guests and reminders.
