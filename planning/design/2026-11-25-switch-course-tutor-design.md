# Switch a Course's Tutor — Design

**Abstract.** Today a course's tutor is chosen when the course is created and can never be changed. When
a tutor leaves, or a student should continue with someone else, the admin's only option is to start a
new course, which splits the student's paid hours and class history across two records. This design
adds a single admin action that hands a course over to a different tutor from now on: all upcoming
classes move to the new tutor, every class already taught stays on the old tutor's record, and the
student's hours balance and history carry on untouched. The student keeps one unbroken course, the new
tutor sees it on their dashboard straight away, and the school's record of who taught what stays
accurate.

---

## 1. Goal

**Request as stated:** "I need to be able to switch the tutor for a course. Right now the tutor is only
set when the course is created."

**Whys:**

1. Why switch a course's tutor? A tutor leaves, or the student or school wants a different tutor from
   now on (confirmed with the user: permanent handover, not one-off cover, not a data fix).
2. Why is that a problem today? The only workaround is a new course, which splits the student's hours
   balance and lesson history.
3. Why does that matter? The student's paid hours and record must continue unbroken; the new tutor must
   see the course and be on its lessons; the old tutor must stay credited for the classes they taught.
4. That is the school's purpose itself: students get taught, tutors get scheduled and credited for their
   hours, the school keeps an accurate record.

**Goal:** an admin can hand a running course to a different tutor in one step, with future lessons
moving and past lessons, hours and history left exactly as they were.

**Scenarios:**

| Scenario | Today | Desired |
|---|---|---|
| A tutor leaves mid-course; the student has 12 hours left | Admin creates a new course and re-enters hours by hand; history is split | Admin picks the new tutor on the course; upcoming lessons move, the 12 hours and past lessons stay |
| The new tutor already teaches another course at one of the same times | Not applicable | Admin sees the clashing lessons before confirming and can go ahead and reschedule afterwards |
| The old tutor taught 20 lessons before the switch | Not applicable | Those 20 lessons still show the old tutor; the old tutor's taught-class record is unchanged |

## 2. Optimal Design

Written before reading the implementation.

A course has one *current* tutor. Each lesson carries the tutor who teaches it, so "who taught this
class" is a fact of the lesson and does not depend on who holds the course today. A handover is one
admin action that:

- sets the course's current tutor;
- moves every lesson that has not yet happened to the new tutor;
- leaves every lesson that has happened with the tutor who taught it;
- does not touch the hours balance;
- shows the admin any overlap with the new tutor's existing lessons before it is applied;
- leaves a trace of who was switched to whom, and when.

Access follows from the data: the new tutor sees the course and its lessons; the old tutor keeps their
own taught lessons but no longer sees the course.

## 3. Current Design

All of the following was verified in the code.

- **Structure.** A course holds a tutor. Every lesson also holds its own tutor, copied from the course
  at the moment the lesson is generated (by the nightly generator, on demand when a course has no
  future lessons, and when an admin logs a past class).
- **No way to change it.** Course creation is the only place a course's tutor is set. The course update
  action accepts only the title and the active flag. The course edit page has no tutor field; the
  course detail page shows the tutor read-only.
- **Where "whose course/lesson is this" is decided today:**
  - Listing a course's lessons: allowed for the *course's* tutor.
  - Completing a lesson / logging attendance: allowed for the *lesson's* tutor (or admin).
  - A tutor's dashboard: upcoming lessons by *lesson* tutor, courses by *course* tutor.
  - A tutor's student list: every student who appears on any lesson with that tutor.
  - Tutor student counts on the admin tutor list: from courses by *course* tutor.
  - Reminder, confirmation and cancellation emails: name the *lesson's* tutor.
- **Clash checks.** Manual lesson creation and rescheduling check the tutor's other scheduled lessons.
  Generated lessons are not checked against anything.
- **Calendar.** Only manually created lessons have a calendar event; its title contains the tutor's
  name. Generated lessons have none. The calendar update call rewrites title and times only.
- **History.** No change log exists for courses. Hours adjustments are not logged either.
- **Schedule edits** already follow the pattern this design needs: a course-level change followed by a
  resync of future, not-yet-started lessons.

## 4. Gap and Verdict

**Gap.** The data model already matches the optimal design: course tutor and per-lesson tutor are
separate, and access checks already use the right one in each place. The only thing missing is the
handover action and its screen.

**Verdict: tweak.** Add the one action; change no structure.

- *Cost of closing the gap:* one new admin action in the courses area, one small addition to the course
  edit page. No schema change, no migration, no effect on hours balances, Stripe, or sent emails.
- *Cost of leaving it open:* every tutor change keeps splitting a student's hours and history across
  two courses, by hand.

**Gaps deliberately accepted:**

1. **No dedicated history of tutor changes.** Past lessons already record who taught them, which is the
   history that matters for crediting tutors; the switch itself is written to the server log.
2. **Unlogged past lessons stay with the old tutor**, who can no longer open the course's lesson list.
   The admin logs attendance for those. The confirmation shows how many there are.
3. **The old tutor still sees the student in their student list**, because that list is built from
   lesson history. Unchanged by this design.

## 5. Proposed Solution

**Principles**

- A lesson that has started belongs to the tutor who was on it. Only lessons that are still scheduled
  and have not started move.
- The hours balance is never read or written by a handover.
- The admin sees the consequences before confirming; clashes warn, they do not block (user decision,
  consistent with generated lessons never being blocked by clashes).
- No emails are sent (user decision). The new tutor sees the course on their dashboard; the students'
  usual class reminders name the new tutor from the next lesson on.

**Flow**

1. On the course edit page the admin picks a different tutor from the list of active tutors.
2. The system returns a preview: how many upcoming lessons will move, how many past lessons still need
   attendance and will stay with the old tutor, and the list of upcoming lessons that overlap a
   scheduled lesson the new tutor already has in another course.
3. The admin confirms.
4. The system applies the handover in one transaction and the page shows the new tutor.

**Which lessons move**

| Lesson | Moves? |
|---|---|
| Scheduled, start time in the future (including manually rescheduled ones) | Yes |
| Scheduled, already started or past (attendance not yet logged) | No |
| Completed, no-show | No |
| Cancelled | No |

**Integration points**

- **Lesson generator:** no change. It copies the course's current tutor, so lessons generated after the
  switch are on the new tutor.
- **Google Calendar:** for moved lessons that have a calendar event, rewrite the event title with the
  new tutor's name, best effort, after the transaction commits. A calendar failure is logged and does
  not undo the handover.
- **Email, Stripe, cron jobs:** no change.

**How the outcome is observed**

- *Admin:* the course detail and edit pages show the new tutor; upcoming lessons in the course show the
  new tutor; past lessons show the old one.
- *New tutor:* the course and its upcoming lessons appear on their dashboard.
- *Old tutor:* the course and its upcoming lessons disappear from their dashboard; their taught lessons
  remain in their history.
- *Student:* the dashboard and the next class reminder show the new tutor.
- *Logs:* one line per handover with course, old tutor, new tutor, acting admin and lessons moved.

## 6. Supersedes

Nothing is retired. The caller map in section 3 shows that no existing code path, endpoint, page or
email changes a course's tutor, so the new action is the first and only mechanism for this concern.
The manual workaround (create a second course and re-enter hours) is a practice, not code; it stops
being needed.

## 7. Implementation Overview

The courses area gains two operations, both admin only. No entity changes.

```
previewTutorChange(course, newTutor):
  1. Reject if newTutor is not an active tutor
  2. Reject if newTutor is already the course's tutor
  3. movable   = course lessons that are scheduled and start after now
  4. unlogged  = course lessons that are scheduled and started at or before now
  5. clashes   = for each movable lesson, any scheduled lesson of newTutor in another
                 course whose time overlaps it
  6. Return { movable count, unlogged count, clashes (lesson time + other course title) }

changeTutor(course, newTutor, actingAdmin):
  1. Same validation as the preview
  2. In one transaction:
       a. set the course's tutor to newTutor
       b. set the tutor of every movable lesson (recomputed now) to newTutor
  3. Log: course, old tutor, new tutor, acting admin, number of lessons moved
  4. For each moved lesson with a calendar event: rewrite the event title (best effort)
  5. Return the updated course
```

The course edit page gains a tutor picker (active tutors), and a confirmation step that shows the
preview and applies the change.

## 8. Edge Cases & Error Handling

- **Same tutor selected:** rejected with a clear message; nothing changes.
- **New tutor is inactive or not a tutor:** rejected.
- **Lesson in progress at the moment of the switch:** it has started, so it stays with the old tutor.
- **Clashes with the new tutor's other lessons:** shown in the preview; the admin may proceed and
  reschedule afterwards. Lessons can change between preview and confirm, so the apply step recomputes
  the movable set and does not rely on the preview.
- **Past lessons without attendance:** stay with the old tutor; the admin logs them. The old tutor can
  no longer list the course's lessons.
- **Inactive course:** allowed. It has no future lessons to move; the course's tutor still changes.
- **Course with no upcoming lessons:** allowed; zero lessons move, later generated lessons use the new
  tutor.
- **Zero or negative hours balance:** irrelevant; the balance is not touched.
- **Timezones:** "started" is a comparison of absolute instants against now; no wall-clock maths.
- **Calendar API failure:** logged; the handover stands.
- **Wrong role:** a tutor or student calling either operation is refused on the backend.
- **Class reports and attendance records on past lessons:** untouched; they keep the old tutor.

## 9. Testing Strategy

Unit scenarios (Jest, mocked entity manager, alongside the existing course service tests):

- Handover moves future scheduled lessons, including manually rescheduled ones, to the new tutor.
- Completed, no-show, cancelled, and already-started scheduled lessons keep the old tutor.
- The hours balance and renewal flag are unchanged after a handover.
- Same tutor, unknown user, non-tutor user, and inactive tutor are each rejected with no changes.
- Preview reports the correct movable count, unlogged count, and clashes; a lesson of the new tutor in
  the *same* course, a cancelled lesson, and a non-overlapping lesson are not reported as clashes.
- A calendar failure does not fail the handover.
- Lessons generated after the handover are on the new tutor.

Manual flows:

- *Admin:* switch a course's tutor with and without clashes; check the course pages and the lesson list
  before and after.
- *New tutor:* the course and upcoming lessons appear; attendance can be logged on a moved lesson.
- *Old tutor:* the course is gone from the dashboard; opening the course's lessons is refused; past
  lessons are still in their history.
- *Student:* dashboard shows the new tutor on the course and the next lesson.

## 10. Minimality and Future Considerations

**Removed in the minimality pass**

- A tutor-history table or "previous tutors" list on the course: past lessons already carry it.
- An "effective from" date for the switch: the handover applies from now.
- Per-lesson substitute tutors: the need is permanent handover only.
- Checking the new tutor's availability slots: lesson generation does not use them either.
- Blocking on clashes: warn only.
- Emails to the new tutor, old tutor or students: the admin arranges the handover personally.
- Moving unlogged past lessons to the new tutor: who taught a class does not change after the fact.

**Out of scope**

- Tightening the old tutor's student list after a handover.
- An audit log for course changes in general (hours adjustments have the same gap).

**Open questions:** none.
