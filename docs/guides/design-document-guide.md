# Design Document Guide

Standards for technical design documents in Spicy Spanish. `brainstorm` writes designs to
`planning/design/YYYY-MM-DD-<slug>-design.md`. Exact files, tests, and commits belong to `write-plan`
(`planning/plans/`, see [`exec-plan-contract.md`](exec-plan-contract.md)).

---

## Core Principles

### 1. Architecture, Not Implementation

A design says **what** to build and **why**, not how to implement it.

- ✅ Describe the problem and the solution approach
- ✅ Show high-level flows and integration points
- ✅ Reference existing modules and patterns
- ❌ Write actual TypeScript
- ❌ Specify exact file paths or routes
- ❌ Make implementation decisions for the engineer

**Rule of thumb:** if the engineer could implement it several valid ways, you're at the right level.

### 2. Pseudo-Code Over TypeScript

**❌ BAD:**
```typescript
async markAttendance(lessonId: string, status: AttendanceStatus) {
  const lesson = await this.em.findOneOrFail(Appointment, lessonId)
  lesson.course.hoursBalance -= lesson.durationHours
  ...
}
```

**✅ GOOD:**
```
markAttendance(lesson, status):
  1. Reject if the lesson already has an attendance record
  2. Record attendance
  3. If status is PRESENT or ABSENT → debit the course's hours by the lesson duration
  4. If the balance drops to zero or below → flag the course for renewal
```

### 3. Extend Existing Modules

Before creating a new module, service, or controller, check whether `courses`, `scheduling`,
`payments`, `users`, `email`, or `admin` should own it. Create new only when it is a truly independent
domain or would cause a circular dependency.

### 4. As Simple As Possible, As Complex As Necessary

Before the design is settled, take every part it *introduces* — each component, state, option, field,
config flag, layer, code path — and ask **what can be removed while the design still reaches the
goal?** The default for a new part is *cut it* until the goal proves it load-bearing. This is
subtraction from the *new* design, distinct from Supersedes (which retires *old* things). Necessary
complexity stays — the invariants below are never argued away — and under-building past what the goal
needs is the same failure as over-building. Record what you removed.

### Platform invariants

- **Hours integrity:** a course's hours balance changes only through attendance (PRESENT / ABSENT
  debit, ON_TIME_CANCELLATION does not) and explicit admin adjustments or credit-backs. Nothing
  double-debits or double-credits.
- **Role-scoped access:** admin sees all; a tutor sees their own courses, lessons, and students; a
  student sees their own. Enforced on the backend, not only hidden in the UI.
- **Time:** schedule times are wall-clock in the school timezone (`SCHEDULE_TIMEZONE`, default
  `America/Bogota`); lessons are absolute instants; each viewer sees their own local time.
- **Payments:** Stripe is the source of truth; webhook handling is idempotent.

---

## Document Structure

### Abstract (required, first thing under the title)

One paragraph in plain language for a reader new to this area: no code names, table names, or jargon.
Say what the problem or feature is, the goal, and how the school is better afterward for students,
tutors, or the admin. If the abstract can't be written simply, the goal is not yet clear.

### 1. Goal

- The request as stated, then the **5 whys** chain down to the outcome someone actually needs. For a
  bug, the chain runs from the symptom to the design decision that allowed it.
- 2–3 concrete scenarios with current vs desired behavior.

### 2. Optimal Design

What we would build if nothing existed: no current code, no migration, no compatibility constraints.
Derived from the goal and the invariants above. Written before the current implementation is studied.

### 3. Current Design

- Relevant modules, entities, and pages
- Key fields and methods impacted
- Every place the concern is decided today (services, cron jobs, controllers, frontend pages and
  contexts, email templates), and every caller of what changes

### 4. Gap and Verdict

- Where current diverges from optimal, and why that matters for the goal.
- The verdict: **rewrite**, **converge** (name the meeting point), or **tweak**.
- The reasoning: what closing the gap fully would cost (migration of production data, existing lessons
  and hours balances, Stripe and Calendar state) vs what leaving it open would cost. For converge or
  tweak, the gap you are deliberately leaving open.

### 5. Proposed Solution

Principles, state machines (if new states), high-level flow, integration points (Stripe, Google
Calendar, email, cron).

### 6. Supersedes

What this design makes obsolete: code paths, services, cron jobs, endpoints, entities/columns, email
templates, pages, components, env vars, docs, vocabulary. For each: *deleted in this change* or
*deleted later* with its trigger. "Nothing" is a claim backed by the caller map.

### 7. Implementation Overview

Pseudo-code for key flows; which services gain methods; which entities change.

### 8. Edge Cases & Error Handling

Brief description + approach each. Think: timezone boundaries, zero or negative hours balance,
cancelled or rescheduled lessons, wrong role, Stripe webhook retries, Calendar API failure.

### 9. Testing Strategy

Scenarios, not test code. Unit tests (Jest, mocked `EntityManager`, as in the existing `*.spec.ts`) and
any manual flows per role.

### 10. Minimality and Future Considerations

What the minimality pass removed, what is explicitly out of scope, open questions.

---

## Common Pitfalls

1. Writing implementation code instead of pseudo-code
2. Specifying exact file paths
3. Designing from the code outward — optimal design first, current second
4. Additive-only design — a new mechanism with nothing retired usually means two mechanisms for one concern
5. Enforcing access only in the frontend
6. Doing time math in the server's local zone
7. Skipping the minimality pass

## Review Checklist

- [ ] Abstract is one plain-language paragraph a newcomer could follow
- [ ] Whys chain reaches a real outcome, not a restatement of the request
- [ ] Optimal design stands on its own, without referring to current code
- [ ] Verdict follows from the gap; the accepted gap is named
- [ ] Supersedes list present, each item scheduled
- [ ] Minimality pass done
- [ ] Invariants hold (hours, roles, time, payments)
- [ ] Edge cases and test scenarios defined; no TypeScript, no file paths
