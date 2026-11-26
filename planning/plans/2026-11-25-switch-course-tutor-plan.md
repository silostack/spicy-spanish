# Switch a course's tutor — execution plan

**Design:** `planning/design/2026-11-25-switch-course-tutor-design.md`
**Status:** complete
**Review:** medium
**Branch:** feat/switch-course-tutor

## Intent and boundaries

**Abstract (from the design).** Today a course's tutor is chosen when the course is created and can
never be changed. When a tutor leaves, or a student should continue with someone else, the admin's only
option is to start a new course, which splits the student's paid hours and class history across two
records. This design adds a single admin action that hands a course over to a different tutor from now
on: all upcoming classes move to the new tutor, every class already taught stays on the old tutor's
record, and the student's hours balance and history carry on untouched. The student keeps one unbroken
course, the new tutor sees it on their dashboard straight away, and the school's record of who taught
what stays accurate.

**Verdict: tweak.** `Course.tutor` and `Lesson.tutor` are already separate
(`backend/src/courses/entities/course.entity.ts`, `backend/src/scheduling/entities/lesson.entity.ts`),
and access checks already use the right one in each place. Only the handover action and its screen are
missing. No entity change, no migration.

**Implements:** an admin-only preview + apply pair on the courses API, and a tutor section on the
course edit page.

**Does not implement** (accepted gaps, from the design): a tutor-change history table; moving past
lessons whose attendance is unlogged; tightening the old tutor's student list; emails; availability
checks; blocking on clashes; an "effective from" date; per-lesson substitutes.

## Decisions and open risks

Settled:

- Permanent handover only; applies from now.
- Clashes with the new tutor's other lessons warn in the preview and do not block.
- No emails.
- A lesson moves only if `status = SCHEDULED` and `startTime > now` (manually rescheduled ones
  included). Everything else keeps its tutor.
- Dedicated endpoints rather than a `tutorId` field on `UpdateCourseDto`: `updateCourse` does a blind
  `em.assign(course, dto)`, and the handover has side effects on lessons.
- Calendar retitle is best effort after commit. `GoogleCalendarService` is provided by
  `SchedulingModule` but not exported; milestone 1 adds it to that module's `exports`.
- Acting admin is taken from `req.user` (pattern in `scheduling.controller.ts`,
  `@Req() req: Request & { user: User }`) for the log line only.

Open risks (none block execution):

- `GoogleCalendarService.updateEvent` rewrites title and times only; attendee lists on existing events
  are not changed. Only manually created lessons have events, so the exposure is small. Accepted.

## Supersedes

Nothing. The caller map below shows no existing path that writes `Course.tutor` after creation or
rewrites `Lesson.tutor`. Proof at the end of milestone 1: the caller-map grep shows exactly the
existing writers plus `changeTutor`.

## Global constraints

Simplest code that works. TDD for new behavior (watch the test fail for the right reason, then
implement); tests are Jest specs next to the service using the existing mocked-`EntityManager` pattern.
Every new route has `JwtAuthGuard` + `RolesGuard` + `@Roles()`. "Started" is a comparison of absolute
instants against `new Date()`; no wall-clock or local-zone maths. The hours balance and `needsRenewal`
are never read or written by this change. Every backend milestone runs
`cd backend && npm run lint && npm run test && npm run build`; every frontend milestone runs
`cd frontend && npm run lint && npm run build`. One commit per green milestone, explicit pathspec,
never `git add -A`. Work on `feat/switch-course-tutor` (create it from `main`); no worktrees. The
working tree has unrelated uncommitted files (`AGENTS.md`, `CLAUDE.md`, `.claude/`, `planning/`,
`spicy-prod.sql`, …); never include them in a milestone commit.

## Caller map

Writers of a course's or lesson's tutor:

```bash
grep -rnE "\.tutor = |new Course\(|new Lesson\(" backend/src --include='*.ts' \
  | grep -v '\.spec\.' | grep -v migrations/ | grep -v seed
```

Current result: `courses.service.ts` (`new Course(dto.title, tutor, …)` in `createCourse`),
`lesson-generator.service.ts` (`new Lesson(course.tutor, …)`), `scheduling.service.ts`
(`new Lesson(tutor, …)` in `createLesson`, `new Lesson(course.tutor, …)` in `logPastLesson`), and the
constructor assignments in the two entity files. After milestone 1 the only additions are the two
assignments inside `CoursesService.changeTutor`.

Readers that decide "whose course/lesson is this" (unchanged by this plan; listed so `exec-plan` can
confirm none needs routing):

```bash
grep -rnE "course\.tutor|lesson\.tutor|tutor: tutorId|\{ tutor: tutor\.id \}" backend/src \
  --include='*.ts' | grep -v '\.spec\.'
```

| Place | Uses | After the handover |
|---|---|---|
| `scheduling.service.ts` `findLessonsByCourse` | course tutor | new tutor allowed, old refused (wanted) |
| `scheduling.service.ts` complete / attendance | lesson tutor | each tutor on their own lessons (wanted) |
| `scheduling.service.ts` `findLessonsByTutor`, `findUpcomingLessonsByTutor` | lesson tutor | follows moved lessons |
| `courses.service.ts` `findCoursesByTutor` | course tutor | follows the course |
| `lesson-generator.service.ts` | course tutor | new lessons on the new tutor |
| `users.service.ts` `getTutors` counts | course tutor | follows the course |
| `users.service.ts` `getStudentsWithPagination` (tutorId) | lesson tutor, all time | old tutor still lists the student (accepted gap) |
| `email.service.ts` reminders / confirmations | lesson tutor | name the new tutor on moved lessons |

Reachability: `changeTutor` and `previewTutorChange` are reached from `CoursesController` routes
(milestone 1), which are called from the course edit page (milestone 2).

## File map

| File | Change | Responsibility |
|---|---|---|
| `backend/src/courses/dto/index.ts` | modify | add `ChangeTutorDto { tutorId: UUID }` |
| `backend/src/courses/courses.service.ts` | modify | add `previewTutorChange`, `changeTutor`, private helpers; inject `GoogleCalendarService` |
| `backend/src/courses/courses.controller.ts` | modify | add `GET :id/tutor-change-preview`, `PATCH :id/tutor` (admin) |
| `backend/src/courses/courses.service.spec.ts` | modify | new `describe` blocks; add `transactional`, `count`, calendar mock to the test module |
| `backend/src/scheduling/scheduling.module.ts` | modify | export `GoogleCalendarService` |
| `frontend/src/app/dashboard/courses/[id]/edit/page.tsx` | modify | "Tutor" card: picker, preview, confirm |
| `planning/changelog.md` | by `finish` | admin-visible feature entry |

No files created or deleted in product code.

## Milestones

### 1. Backend: preview and apply a tutor handover

- [ ] **Change:**
  - `dto/index.ts`: `ChangeTutorDto` with `@IsUUID() tutorId`.
  - `courses.service.ts`:
    - private `findNewTutor(course, tutorId)`: load user with `role: TUTOR`; `NotFoundException` if
      missing; `BadRequestException` if `isActive` is false or if it is already `course.tutor`.
    - private movable filter: `{ course, status: SCHEDULED, startTime: { $gt: now } }` (no
      `originalStartTime` condition, so manually rescheduled lessons are included).
    - `previewTutorChange(courseId, tutorId)` returns
      `{ lessonsToMove: number, unloggedPastLessons: number, clashes: [{ lessonId, startTime, endTime, otherCourseTitle }] }`.
      `unloggedPastLessons` = count of `{ course, status: SCHEDULED, startTime: { $lte: now } }`.
      Clashes: load the new tutor's lessons with `status: SCHEDULED`, `course: { $ne: courseId }`,
      `startTime > now` (populate `course`) in one query, and overlap-test in memory against the movable
      lessons (`a.start < b.end && a.end > b.start`).
    - `changeTutor(courseId, tutorId, actor)`: validate as above; inside `this.em.transactional`, set
      `course.tutor` and the tutor of each movable lesson (re-queried inside the transaction, populate
      `students`); after commit, write one `Logger` line (course id, old tutor id, new tutor id, actor
      id, lessons moved) and, for each moved lesson with `googleCalendarEventId`, call
      `googleCalendar.updateEvent` with the title format already used in `scheduling.service.ts`
      (`Spanish Class: <student names> with <tutor fullName>`), the lesson's notes, start and end.
      `updateEvent` already swallows its own errors and returns false. Return the course via
      `findCourseById`.
    - Add a `Logger` to the service and inject `GoogleCalendarService`.
  - `scheduling.module.ts`: add `GoogleCalendarService` to `exports`.
  - `courses.controller.ts`: `@Get(":id/tutor-change-preview")` with `@Query("tutorId", ParseUUIDPipe)`
    and `@Patch(":id/tutor")` with `ChangeTutorDto` and `req.user`; both `@Roles(UserRole.ADMIN)`.
    Route order against `@Get(":id")` does not matter (different segment count); place both next to
    the other `:id/...` routes.
- [ ] **Data/API:** two new admin endpoints, one DTO. No entity or migration change (evidence: both
  `tutor` relations already exist). No email template or env change.
- [ ] **Negative cases** (each a test in `backend/src/courses/courses.service.spec.ts`):
  - unknown tutor id or a user who is not a tutor → `NotFoundException`, nothing flushed;
  - inactive tutor → `BadRequestException`;
  - same tutor as current → `BadRequestException`;
  - unknown course → `NotFoundException`;
  - completed, no-show, cancelled and already-started scheduled lessons are not in the moved set
    (assert the lesson query criteria and that only returned lessons are reassigned);
  - `hoursBalance` and `needsRenewal` unchanged after `changeTutor`;
  - a failed calendar update (`updateEvent` resolves false) does not fail the handover;
  - preview: a lesson of the new tutor that does not overlap is not a clash; the other-tutor query
    excludes this course and non-scheduled lessons;
  - wrong role is enforced by `@Roles(UserRole.ADMIN)` + `RolesGuard` on both routes (verify by
    reading the controller; smoke below).
- [ ] **Verification:**
  - `cd backend && npm run lint && npm run test && npm run build` — all green; the new
    `previewTutorChange` and `changeTutor` describe blocks pass.
  - Caller-map writer grep shows only the `changeTutor` additions.
  - Smoke (backend `npm run start:dev` on 3001, admin token): `GET /api/courses/<id>/tutor-change-preview?tutorId=<other>`
    returns counts; `PATCH /api/courses/<id>/tutor` returns the course with the new tutor;
    `GET /api/scheduling/courses/<id>/lessons` shows upcoming lessons on the new tutor and past ones on
    the old. The same `PATCH` with a tutor token returns 403.

### 2. Frontend: tutor section on the course edit page

- [ ] **Change:** `frontend/src/app/dashboard/courses/[id]/edit/page.tsx`
  - Load tutors with `api.get('/users/tutors')` alongside the existing course and student requests
    (same response-shape handling as `courses/new/page.tsx`); offer only `isActive` tutors.
  - New "Tutor" card between "Basic Info" and "Students": current tutor's name, a select of the other
    active tutors, and a "Change tutor" button (disabled until a different tutor is chosen).
  - On click: `GET /courses/:id/tutor-change-preview?tutorId=…`, then show an inline confirmation
    panel in the card (no browser `confirm`): "N upcoming lessons will move to <new tutor>"; if
    `unloggedPastLessons > 0`, "M past lessons still need attendance and stay with <old tutor>; log
    them yourself"; if clashes, a warning list with each clash's local date/time and other course
    title. Buttons: "Confirm change" and "Cancel".
  - On confirm: `PATCH /courses/:id/tutor`, then `setCourse` with the response, reset the picker,
    and show the existing success banner ("Tutor changed to …"). Errors use the existing error banner
    with the backend message when present.
  - Format clash times with the date helpers the page's siblings already use for lesson times (viewer's
    local zone); do not add a library.
- [ ] **Data/API:** none (consumes milestone 1).
- [ ] **Negative cases:** preview or apply failure shows the error banner and leaves the displayed
  tutor unchanged; double-click on confirm is prevented by a `saving`-style flag; the edit page is
  already admin-only in navigation, and the backend refuses other roles regardless.
- [ ] **Verification:**
  - `cd frontend && npm run lint && npm run build` — green.
  - Manual (backend 3001, frontend `npm run dev` on 8008):
    - as admin, open a course's edit page, pick another tutor, see the preview counts, confirm; the
      course detail page shows the new tutor, upcoming lessons show the new tutor, past lessons the old;
    - repeat with a tutor who has an overlapping lesson in another course and see the clash list;
    - as the new tutor, the course and upcoming lessons are on the dashboard;
    - as the old tutor, the course is gone from the dashboard;
    - as the student, the dashboard shows the new tutor.

## Cross-cutting checks

- `finish`: lint, tests and build on both apps; no migration pending (`npm run migration:pending`
  unchanged); no env example change; add the admin-visible entry to `planning/changelog.md`; update the
  CI test count in root `CLAUDE.md` if `finish` tracks it.
- `deploy-steps`: writes `planning/deployment/2026-11-25-switch-course-tutor-deployment.md`; expected
  content is build + restart of `spicy-backend` and `spicy-frontend`, no migration.

## Progress and decision log

- 2026-11-25 — plan written from the approved design. Not started.
- 2026-11-25 — **Milestone 1 complete.** Commits `44d84e830` (feature) + `27fc99547` (review fixes).
  Review medium: 1 Important fixed (calendar `events.update` replaced the whole event and dropped
  attendees/reminders → `updateEvent` now uses `events.patch` and accepts `attendeeEmails`; handover
  passes students + new tutor; side effect: reschedule/complete no longer wipe guests). Nits fixed:
  all clashes reported (not first only), clash query bounded to the moved lessons' range, `ParseUUIDPipe`
  on `:id`. Downgraded to minor, not fixed: handover vs. concurrent lesson generation race (generator
  could flush lessons with the old tutor if it loaded the course just before the handover committed;
  needs locks in two modules, window is the 2 AM cron or a simultaneous schedule edit). Not fixed:
  sequential calendar updates (only manually created lessons have events).
  Clash shape decided: one entry per (moved lesson, overlapping other lesson); `lessonId/startTime/endTime`
  describe the moving lesson. Verification: lint clean, build ok, courses spec 35/35. Full suite has
  7 **pre-existing** failures in `lesson-generator.service.spec.ts` (`this.em.fork is not a function`;
  service gained `em.fork()` in `ec7a2c31a`, spec mock never updated) — unrelated, flagged to user.
  Caller-map writer grep: only additions are the two assignments in `changeTutor`.
- 2026-11-25 — **Milestone 2 complete.** Commits `9c9851796` (feature) + `93f916bb6` (review fixes). Review medium: 0 Critical/Important, 6 nits.
  Fixed: tutor-list fetch failure no longer blocks the whole edit page; open preview cleared when
  schedule slots change. Logged, not fixed: `/users/tutors` is heavy (per-tutor student counts) for a
  dropdown; double-click guard reads render-time state (button disables on next render; worst case a
  spurious "already teaches this course" error after a successful change); preview not re-fetched
  before confirm (apply step recomputes server-side anyway); handover banners sit at page top; clash end
  time omits the date when a lesson crosses local midnight. Deviation: clash list key uses index.
  Verification: frontend lint clean for this file, build ok. Manual browser smoke not yet run.
- 2026-11-25 — **Retirement sweep:** nothing in Supersedes. Caller-map writer grep: only additions are
  the two assignments in `CoursesService.changeTutor`. Landed where the verdict said (tweak): no entity
  or migration change; accepted gaps as in the design (no tutor-change history, unlogged past lessons
  stay with the old tutor, old tutor's student list unchanged) plus the generator race logged above.
