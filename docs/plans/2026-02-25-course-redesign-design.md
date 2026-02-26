# Course Redesign: Scheduled Class Groups

## Summary

Replace the current catalog-style course concept with a **scheduled class group**. A course becomes a recurring class schedule for one or more students with a tutor, with a pool of credited hours that get debited as classes happen.

**Example:** Jim and Bob are taught by Melissa. They meet Monday 10am-11am and Thursday 2pm-3pm. Bob purchases hours for the course. Each session debits 1 hour from the course balance regardless of attendance.

## Course Entity

A Course represents a recurring group class.

**Fields:**
- `id` — primary key
- `title` — e.g., "Jim & Bob - Conversational Spanish"
- `tutor` — ManyToOne to User (tutor role)
- `students` — ManyToMany to User (student role)
- `startDate` — when the course begins
- `isActive` — boolean, deactivate to stop generating appointments
- `hoursBalance` — decimal, remaining credited hours
- `needsRenewal` — boolean, flagged when balance hits 0 or below
- `createdAt`, `updatedAt`

## CourseSchedule Entity

Each course has one or more recurring time slots.

**Fields:**
- `id` — primary key
- `course` — ManyToOne to Course
- `dayOfWeek` — integer 0-6
- `startTime` — string HH:MM
- `endTime` — string HH:MM

## Appointment Changes

- Remove `student` ManyToOne field
- Add `students` ManyToMany to User (student role)
- `course` becomes **required** (no longer optional)
- Add `creditedBack` — nullable boolean, set on cancellation to record whether hours were returned
- Keep: `tutor`, `startTime`, `endTime`, `status`, `notes`, `googleCalendarEventId`

When an appointment is generated from a course, all the course's current students are attached.

## Auto-Generation

A cron job runs daily. For each active course:

1. Look at the course's schedule slots
2. Generate appointments for the next **4 weeks** from today
3. Skip dates that already have an appointment for that course + time slot
4. Attach all current course students to each new appointment
5. Deduct hours from `hoursBalance` based on slot duration
6. Set `needsRenewal = true` if balance reaches 0 or below (but keep generating)

## Cancellation & Hour Crediting

When a tutor cancels an appointment:

1. Status set to `CANCELLED`
2. System calculates whether cancellation is 24+ hours before start time
3. Tutor sees a **"Credit hours back to course"** toggle, pre-filled based on the 24-hour rule but overridable
4. If credited back: `course.hoursBalance` increases by appointment duration
5. If balance goes positive again: `needsRenewal` set back to false

Hours are deducted at **generation time** (not when class happens), so the balance reflects committed future hours. Cancellation with credit returns hours to the pool.

## Entities Removed

- `CourseLesson` — no more ordered lesson content
- `StudentCourse` — replaced by course's direct `students` relationship

## Entities Unchanged

- `Availability` — tutor availability stays as-is
- `Attendance` — already per-student per-appointment
- `ClassReport` — still tied to appointment

## Frontend Changes

- `CoursesContext` — rewritten for new course structure
- `SchedulingContext` — simplified, appointments are auto-generated
- Course creation: pick tutor, pick students, set schedule slots, set start date
- Course detail: upcoming appointments, hour balance, student list, renewal status

## Deferred

- Payment/package purchasing
- "Cancel all future appointments" bulk action
- Student self-service (add/remove themselves)
- Notifications for low balance or renewal
