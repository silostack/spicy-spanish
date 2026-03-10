# Spicy Spanish - Project Memory

## Project Structure
- **Frontend**: Next.js 13+ (App Router), port 8008, in `frontend/src/app/`
- **Backend**: NestJS + MikroORM + PostgreSQL, port 3001, in `backend/src/`

## Key Files
- Backend courses: `backend/src/courses/courses.service.ts`, `courses.controller.ts`, `dto/index.ts`
- Backend scheduling: `backend/src/scheduling/scheduling.service.ts`, `scheduling.controller.ts`
- Frontend course pages: `frontend/src/app/dashboard/courses/`
- Auth context: `frontend/src/app/contexts/AuthContext.tsx`
- API util: `frontend/src/app/utils/api`

## Course / Hours System
- `Course` entity has `hoursBalance: number` and `needsRenewal: boolean`
- Admin manually adds hours: `PATCH /courses/:id/hours` with `{ hours: number }` (uses `AdjustHoursDto`)
- Hours auto-debit: triggered in `scheduling.service.ts createAttendance` when status is PRESENT or ABSENT (not ON_TIME_CANCELLATION)
- Hours credit-back: `cancelAppointment` with `creditHoursBack: true` credits duration back

## Attendance Logic
- One attendance record per appointment (enforced in `createAttendance`)
- Statuses: PRESENT, ABSENT, ON_TIME_CANCELLATION
- PRESENT or ABSENT → debit course hours by appointment duration
- ON_TIME_CANCELLATION → no debit

## Frontend Pages (courses)
- List: `/dashboard/courses/page.tsx`
- New: `/dashboard/courses/new/page.tsx`
- View: `/dashboard/courses/[id]/page.tsx` — shows details + admin hours adjustment
- Edit: `/dashboard/courses/[id]/edit/page.tsx` — edit title/active, add/remove students/schedules

## Backend Tests
- 198 unit tests total; run with `npm run test` in `backend/`
- Scheduling tests: 58 tests in `scheduling.service.spec.ts`
- `createMockAppointment` helper has `course` with `hoursBalance: 5`, times 10:00-11:00 UTC

## User Roles
- admin, tutor, student
- Role guard: `@Roles(UserRole.ADMIN)` decorator on sensitive routes
