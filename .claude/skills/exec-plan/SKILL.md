---
name: exec-plan
description: Use when the user asks to execute an approved Spicy Spanish plan in planning/plans or provides an approved implementation-plan path.
---

# /exec-plan — Execute an approved plan

Default: **subagent-driven development in the current checkout.** No worktrees. Use `--inline` only when the user asks or the work is a single tightly coupled milestone.

`--review low|medium|high` overrides the plan's `**Review:**` field. Default **medium**.

Leave plan-only mode before changing code. `main` is the production branch and CI runs on every push to it: never start on `main` without explicit consent (offer a `feat/<slug>` branch). Invoking this skill on an approved plan is consent for its per-milestone commits; always ask before push or PR.

## Controller loop

1. **Drift check.** Re-read the plan, the linked design (abstract, optimal design, verdict, supersedes), and the working tree. Flag drift that changes scope, architecture, hours/payment behavior, or access control before dispatching.

2. **Ledger.** The plan's **Progress and decision log** is the recovery map. A milestone with a completion line is DONE; do not re-dispatch it. Resume at the first milestone without one.

3. For each remaining milestone, in order:

   **a. Implementer subagent.** Fresh subagent. Brief = that milestone + global constraints + interfaces earlier milestones produced, not the session history. Instruct it to:
   - Read root `CLAUDE.md` and the module it touches (entities, service, controller, DTOs, existing `*.spec.ts`) before changing that boundary; follow the existing patterns (`@Roles()` + guards on routes, DTO validation, `EntityManager` usage, mocks in the existing specs).
   - TDD: write the failing test, watch it fail for the right reason, then implement. Scaffolding, config, and docs ride with the milestone.
   - Entity changed → generate the migration with `cd backend && npm run migration:create` against a local dev DB, read the generated file, and trim it to this milestone's delta (the dev DB drifts). Never run migrations against production.
   - Run the milestone's verification commands: backend `cd backend && npm run lint && npm run test -- <spec path> && npm run build` (`nest build` type-checks); frontend `cd frontend && npm run lint && npm run build`. Report actual output. Do not commit.
   - **Stop and report if the milestone needs to extend, call, or work around something the design retires,** or to decide the same thing in a second place. Either is a plan finding, not an implementation detail.

   **b. Controller verifies.** Read the diff. Re-run or inspect the reported commands if the report is thin. No "done" without evidence in this turn. Re-run the plan's caller-map grep: a count that grew means a duplicate path was just created. For a retirement milestone, run its proof-of-absence grep; the retired thing must actually be gone from every surface, not just unused.

   **c. Commit.** One commit, explicit pathspec, never `git add -A` (the root has untracked dumps like `spicy-prod.sql` that must never be committed). Confirm `git show --stat HEAD`.

   **d. `/code-review`** on `BASE..HEAD` for this milestone at the plan's review depth. The reviewer is a subagent; do not review the diff yourself as a substitute.

   **e. Act on findings:** verify against the code; do not rubber-stamp; YAGNI on "implement it properly"; clarify unclear items before touching any. **Critical** and **Important** block the next milestone. **Minor** goes in the log.

   **f. Log.** Append: milestone, commit SHA, review depth and verdict, deviations, verification. Then the next milestone.

   Do not pause to ask "should I continue?" Stop only for a blocker, an unsafe or destructive action (anything touching the production database, live Stripe, real Google Calendar events, or sending real emails), an external dependency, or a finding that changes architecture.

4. **Retirement sweep.** Re-run every *deleted in this change* proof from the plan's **Supersedes** section. Anything still present is a blocker, not a follow-up. Check the result against the design's optimal: say in the log whether it landed where the verdict said, or name the gap that remains.

5. Then `/finish`, and `/deploy-steps` if production is affected (writes `planning/deployment/YYYY-MM-DD-<slug>-deployment.md`).

**`--inline`:** the controller implements the milestones itself with the same TDD / commit / code-review / log rules.

## Subagents

One implementer per milestone, then one reviewer. No parallel implementers. Do not use a subagent to verify your own work; that is the reviewer's job. Integration decisions stay on the controller thread.

Dispatch the implementer with `model: "opus"`. The reviewer inherits the session model.
