# Execution plan contract

`write-plan` stores each plan at `planning/plans/YYYY-MM-DD-<slug>-plan.md`, paired with
`planning/design/YYYY-MM-DD-<slug>-design.md`. The plan must stand alone for a fresh agent context.
A routine one-file fix doesn't need this template.

A design is **what and why**, with no file paths. A plan is **what files, what proof, what commit**.

```markdown
# <Feature> — execution plan

**Design:** `planning/design/YYYY-MM-DD-<slug>-design.md`
**Status:** proposed | approved | in progress | complete
**Review:** medium   # or low | high; default medium if omitted
**Branch:** feat/<slug>

## Intent and boundaries

The design's abstract, copied verbatim. The verdict (rewrite / converge / tweak) and the gap it leaves
open. What outcome this implements, what it deliberately does not, and the repository evidence
grounding it.

## Decisions and open risks

Settled decisions. Only material unresolved decisions and their owner. Never start implementation
while a material architecture or scope decision is unresolved; return to `brainstorm`.

## Supersedes

Every item the design retires. *Deleted in this change:* the milestone that deletes it and the grep
that proves it is gone. *Deleted later:* the trigger that schedules it.

## Global constraints

Simplest code that works. TDD for new behavior and bugfixes (watch the test fail for the right reason,
then implement); tests are Jest specs next to the service (`backend/src/<module>/*.spec.ts`) using the
existing mocked-`EntityManager` pattern. Every new route has `JwtAuthGuard` + `RolesGuard` +
`@Roles()` and scopes tutor/student data to the caller. Schedule time math goes through the
`SCHEDULE_TIMEZONE` helpers, never the server's local zone. Entity changes ship with a trimmed MikroORM
migration. Every backend milestone runs `cd backend && npm run lint && npm run test && npm run build`;
every frontend milestone runs `cd frontend && npm run lint && npm run build`. One commit per green
milestone, explicit pathspec, never `git add -A`. Work on the feature branch; no worktrees.
Every milestone inherits this section.

## Caller map

The grep(s) that find every place the concern is decided, and the current result.
`exec-plan` re-runs them after each milestone.

## File map

Which files are created, modified, or deleted, and what each is responsible for.

## Milestones

A milestone is the smallest unit that carries its own test cycle and that a reviewer could reject
while approving its neighbor. Fold setup, config, and docs into the milestone that needs them.

### 1. <Outcome>

- [ ] **Change:** exact files, symbols, and behavior to add, change, or remove.
- [ ] **Data/API:** entity + migration, endpoint, DTO, email template, or env delta, or "none" with
  evidence. An entity change lists each column (name, type, null, default) and the migration file.
- [ ] **Negative cases:** wrong role, another user's record, invalid input, zero balance — whichever apply.
- [ ] **Verification:** exact commands, the manual smoke path (dev servers: backend
  `npm run start:dev` on 3001, frontend `npm run dev` on 8008, as which role), and the expected proof.
  Name the test file and the behavior; don't paste test source.

## Cross-cutting checks

- `finish` and `deploy-steps` requirements (`deploy-steps` writes
  `planning/deployment/YYYY-MM-DD-<slug>-deployment.md`).

## Progress and decision log

Append dated entries while executing: completed milestone, commit SHA, review depth and verdict,
deviation, and verification result. This log is the compaction-recovery map. Do not re-run a
milestone that has a completion line.
```

## Plan self-review

1. **Spec coverage.** Every requirement in the design points at a milestone, and so does every
   *deleted in this change* retirement.
2. **Direction.** No milestone moves away from the design's optimal (for example, extending a
   mechanism the design retires).
3. **Placeholder scan.** No TBD, "add validation", "similar to milestone N".
4. **Name consistency.** Symbols in later milestones match earlier ones.
5. **YAGNI.** Nothing that was not requested.
6. **Data model.** Every entity change names its migration and any backfill for existing rows.

## Revise vs execute

"Revise the plan" means edit the plan file only. "Execute the plan" means switch to `exec-plan`.
Before acting on a plan-related request, say which of the two the next action is.

## Commit rule

One commit per milestone after lint, tests, and build are green **and** `/code-review` Critical and
Important findings are fixed. Pathspec only; confirm with `git show --stat HEAD`. Invoking
`exec-plan` on an approved plan is the consent for these milestone commits. Outside `exec-plan`,
never commit without asking. Always ask before push or PR.
