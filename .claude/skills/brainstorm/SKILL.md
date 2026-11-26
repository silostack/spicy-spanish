---
name: brainstorm
description: Use when the user asks to explore, design, or clarify a non-trivial Spicy Spanish feature, bug fix, integration, refactor, or product decision before implementation and wants a settled design document without code changes.
---

# /brainstorm — Design before code

Turn an idea or a bug into an approved design at `planning/design/YYYY-MM-DD-<slug>-design.md`, following [`docs/guides/design-document-guide.md`](../../../docs/guides/design-document-guide.md). Do **not** implement product code or write an execution plan in this skill.

<HARD-GATE>
Do not invoke `write-plan`, `exec-plan`, `finish`, or any implementation skill, and do not scaffold or edit product code, until the user has approved the **written** design file.
</HARD-GATE>

A tiny change can be a few sentences. It still gets approval. "Too simple to design" is where unexamined assumptions waste the most work.

**Design from the goal, then walk back to the code.** The optimal design is drawn from what the work is trying to accomplish, before the current implementation is allowed to anchor it. Only then does the current code come in, to decide how far to close the gap. Skipping this is how a feature ends up as a patch on a structure that should have been replaced.

## Process (in order)

1. **Scope check.** If the request is several independent subsystems, decompose first (what are the pieces, what order). Brainstorm only the first. Each gets its own design → plan → implementation cycle.

2. **Goal — 5 whys.** Start from the request as stated and ask "why?" until you reach the outcome a student, tutor, or the school admin actually needs (usually 3–5 levels; stop when the next "why" is the school's purpose itself: students get taught, tutors get scheduled and paid for their hours, the school gets paid and keeps an accurate record). For a bug, the chain runs from the symptom to the design decision that allowed it, not just the line that produced it. Read the purpose sources only: root `CLAUDE.md` (Project Overview), `PRD.md`. Ask the user where the chain needs their knowledge, one question at a time, multiple choice preferred. The chain's last answer is the **goal**. When it differs from the literal request, confirm it with the user.

3. **Optimal design — from first principles.** Describe what you would build if nothing existed: no current code, no migration, no backward compatibility, no sunk cost. Derive it from the goal and the platform invariants: hours balances change only through attendance and explicit admin adjustments (every change traceable), role-scoped access (a tutor sees their own courses and students, a student sees their own), schedule times are wall-clock in the school timezone (`SCHEDULE_TIMEZONE`) and lessons are absolute instants, Stripe is the payment source of truth (webhooks idempotent), and nothing double-books or double-debits. Do **not** read implementation code before writing this down; it describes what *is*, and reading it first anchors you to it. A few sentences to a short sketch.

4. **Current design.** Now explore: repo state, recent commits, root `CLAUDE.md`, the backend module(s) the area touches (`backend/src/<module>/` — entities, service, controller, DTOs, `*.spec.ts`), the matching frontend pages under `frontend/src/app/dashboard/` and contexts in `frontend/src/app/contexts/`, earlier designs in `docs/plans/` and `planning/design/`, and `docs/lessons/` if it exists. Find every place the concern is decided today (services, cron jobs, controllers, frontend pages and contexts, email templates): grep the entity property, the enum, the endpoint. More than one place deciding one thing is a finding. A design that repeats a recorded lesson is not settled.

5. **Gap and verdict.** Compare optimal against current and name the verdict:
   - **Rewrite:** the current structure can't reach the goal without fighting it. Build the optimal design and migrate onto it.
   - **Converge:** keep what is sound and replace the parts that diverge. Name the meeting point: which current pieces survive and which optimal pieces replace the rest.
   - **Tweak:** the current design is already close to optimal. Make the smallest change.

   Justify the verdict against the gap: what closing it fully would cost (schema and data migration on the production database, existing lessons and hours balances, live Stripe products and webhooks, Google Calendar events, emails already sent) and what leaving it open would cost (the next feature that fights the same structure, recurring bugs, two mechanisms for one concern). "The code already exists" is not a reason on its own. A converge or tweak states which remaining gap is accepted. Confirm the verdict with the user.

6. **Supersedes — what retires.** List what this design makes obsolete: code paths, services, cron jobs, endpoints, DTOs, entities/columns, email templates, frontend pages and components, context methods, env vars, docs, vocabulary. For each, choose *deleted in this change* or *deleted later, with its trigger* (for example, once existing data is backfilled). "Nothing is superseded" has to be shown with the caller map from step 4. It is not a default.

7. **Questions and 2–3 approaches** within the chosen verdict. Ask only questions whose answers change the design; do not mistake a detailed prompt for approval of unspoken tradeoffs. Trade-offs, recommended option first, YAGNI on every approach. Distinguish verified facts from inferences.

8. **Present the design in sections**, scaled to complexity (a few sentences to ~300 words each). Approve per section. Cover architecture, state machines, data flow, effects on hours balances and payments, error handling, test scenarios. Say **how the outcome is observed and by whom** (student, tutor, or admin dashboard, an email, logs). Unobservable → not settled.

9. **Minimality pass — what can be removed?** Before writing, take the settled design and list every part it *introduces*: each component, state, option, field, config flag, layer, and code path. For each, ask whether the design still reaches the goal without it — the default for a new part is *cut it* until the goal proves it load-bearing. As simple as possible, as complex as necessary: necessary complexity stays (the invariants in step 3 are never argued away), and under-building past what the goal needs is the same failure as over-building. This is subtraction from the *new* design; step 6 retires *old* things. Record what you removed in the design, so the cut is on the record and not silently re-added. Confirm the trimmed design with the user.

10. **Write** the design per the guide. It **opens with a one-paragraph abstract**: plain language, no code names, readable by someone new to the area, saying what the problem or feature is, the goal, and how the school is better afterward. Then goal, optimal design, current design, gap and verdict, proposed solution, supersedes, pseudo-code (not TypeScript), edge cases, testing. **No exact file paths**; those belong to `write-plan`.

11. **Self-review.** Placeholders, contradictions, ambiguity, scope. Check that the abstract reads for an outsider, that the verdict follows from the gap and not from convenience, that the supersedes list is present, and that the minimality pass ran. Fix inline.

12. **User reviews the file.** Commit it only if the user asks (pathspec, that file only). Then stop. Next skill is **only** `write-plan`.

For a genuinely visual question (a dashboard layout), use browser tools just-in-time against the dev server (`cd frontend && npm run dev`, port 8008). Do not stand up a companion server.
