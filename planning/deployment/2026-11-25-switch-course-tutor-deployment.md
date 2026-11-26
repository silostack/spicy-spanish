# Deploy runbook — Switch a course's tutor

**Design:** `planning/design/2026-11-25-switch-course-tutor-design.md`
**Plan:** `planning/plans/2026-11-25-switch-course-tutor-plan.md`
**Branch:** `feat/switch-course-tutor` (4 commits over `origin/main`: `44d84e830`, `27fc99547`, `9c9851796`, `93f916bb6`)

> This is a runbook for a human operator. Nothing here has been run.

## Summary

Adds an admin-only tutor handover for a course: two new backend endpoints and a "Tutor" section on the
course edit page. There are no schema changes, no migrations, no environment variables, and no Stripe
changes. One behaviour change ships alongside it: updating a lesson's Google Calendar event now uses
`events.patch` instead of `events.update`, so the guests and reminders on existing events are kept.

## What's changing

| Area | Change |
|---|---|
| Backend: courses | `GET /api/courses/:id/tutor-change-preview?tutorId=` and `PATCH /api/courses/:id/tutor` (admin only) |
| Backend: scheduling | `GoogleCalendarService` is exported; `updateEvent` patches instead of replacing and accepts `attendeeEmails` |
| Frontend | Tutor card on `/dashboard/courses/[id]/edit` |
| Migrations | **None.** No entity changed. |
| Data scripts | **None.** |
| Env (backend/frontend) | **No change.** |
| Stripe | **No change.** |
| Cron | **No change.** The 2 AM lesson generator now generates lessons for the course's current tutor, which is the same code as before. |
| Email | **No change.** No new templates. Nothing is sent on deploy or on a handover. |
| Google Calendar | No config change. A handover rewrites the title and guest list of moved lessons that already have an event, and only manually created lessons have events. |

## Pre-deployment checklist

- [ ] PR `feat/switch-course-tutor` → `main` reviewed and merged.
- [ ] CI is green on `main`. **Known blocker:** `backend/src/scheduling/lesson-generator.service.spec.ts`
      has 7 failures that predate this branch (`this.em.fork is not a function`; the service started
      calling `em.fork()` in `ec7a2c31a` and the spec mock was never updated). Fix that spec, or decide
      to ship with the backend test job red. Either way, record the decision.
- [ ] Note the SHA production runs now, for rollback: on the server, `git -C /home/si/projects/spicy-spanish rev-parse HEAD` → `<PREVIOUS_SHA>`.
- [ ] Database backup: not required (no schema or data change). Take the usual one if that is routine.
- [ ] Avoid deploying across the 2 AM (school time) lesson-generation run. A handover made at the same
      moment as generation could leave newly generated lessons on the old tutor (a known minor race).

## Deploy

Run on the server:

```bash
cd /home/si/projects/spicy-spanish && git pull origin main

# Backend
cd backend && npm ci && npm run build
npm run migration:pending          # expect: no pending migrations
# no migration:up needed for this change
pm2 restart spicy-backend --update-env
pm2 logs spicy-backend --lines 100 # watch boot: Nest app started, no DI errors for GoogleCalendarService

# Frontend
cd /home/si/projects/spicy-spanish/frontend && npm ci && npm run build
pm2 restart spicy-frontend --update-env

pm2 status
```

If `migration:pending` lists anything, stop. It did not come from this change, so find out where it
came from before going further.

## Post-deploy verification

1. Health: `curl <BACKEND_URL>/api/health` → `{"status":"ok",...}`.
2. Role guard: with a **tutor** token,
   `curl -X PATCH -H "Authorization: Bearer <TUTOR_TOKEN>" -H "Content-Type: application/json" -d '{"tutorId":"<ANY_TUTOR_ID>"}' <BACKEND_URL>/api/courses/<COURSE_ID>/tutor`
   → `403`.
3. Preview only (changes nothing): as admin, open `/dashboard/courses/<COURSE_ID>/edit`, choose another
   tutor in the Tutor section and click **Change tutor**. The panel shows the counts. Click **Cancel**.
4. Real handover: do this only on a course whose tutor actually needs changing. It changes production
   data and the attendees of calendar events. Confirm the change, then check:
   - The course page shows the new tutor. Upcoming lessons show the new tutor and past lessons the old one.
   - `pm2 logs spicy-backend | grep "tutor changed"` shows one line with the course, the old and new
     tutor, the admin, and the number of lessons moved.
   - The new tutor's dashboard lists the course. The old tutor's dashboard no longer does.
5. Watch the next 2 AM lesson-generation run in `pm2 logs spicy-backend`. Lessons generated for a
   handed-over course are on the new tutor.

## Rollback

No migration or env change, so rolling back is code only:

```bash
cd /home/si/projects/spicy-spanish && git checkout <PREVIOUS_SHA>
cd backend && npm ci && npm run build && pm2 restart spicy-backend --update-env
cd ../frontend && npm ci && npm run build && pm2 restart spicy-frontend --update-env
```

Data created between deploy and rollback: handovers already made stay in place. The course and its
moved lessons keep the new tutor, which is a valid state that the old code reads fine. To undo a
handover after a rollback, change the tutor back on the new code before rolling back, or ask a
developer for a targeted SQL fix. Calendar events that were patched keep their new title and guests.

## Appendix — verified values

- Diff over `origin/main`: `backend/src/courses/{courses.controller.ts,courses.service.ts,courses.service.spec.ts,dto/index.ts}`,
  `backend/src/scheduling/{google-calendar.service.ts,scheduling.module.ts}`,
  `frontend/src/app/dashboard/courses/[id]/edit/page.tsx` (plus `CLAUDE.md`/`AGENTS.md` docs).
- No files under `backend/src/migrations/`, `backend/scripts/`, `*.env*`, `docker-compose.yml`, or
  `.github/workflows/` changed.
- Local verification on the branch: backend lint clean, build OK, tests 214 pass / 7 fail (the
  pre-existing lesson-generator failures); frontend lint and build OK.

**Delta summary:** no migrations; no env change; no Stripe change; backend and frontend rebuild and
restart; calendar updates now patch and keep guests.
