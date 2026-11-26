---
name: write-plan
description: Use when the user provides an approved Spicy Spanish design in planning/design or asks for a build plan before changing production code.
---

# /write-plan — Execution plan

Do not implement product code in this skill.

1. Read the design in full, [`docs/guides/exec-plan-contract.md`](../../../docs/guides/exec-plan-contract.md), root `CLAUDE.md`, and the backend modules and frontend pages the implementation touches, including their existing `*.spec.ts` files (the tests show the mocking pattern to follow). Skim `docs/lessons/` if it exists. The plan must not schedule work that reintroduces a recorded lesson. If the design is not approved, or it lacks the abstract, the optimal design, a gap verdict, or a supersedes list, return to `brainstorm`.

2. Write `planning/plans/YYYY-MM-DD-<slug>-plan.md` (same slug as the design) from the contract. Replace every placeholder with repository-specific evidence and commands. Default `**Review:** medium` unless the user asked for `low` or `high`.

3. **Carry the design's caller map into the file map.** For every place the design found the concern decided, name the file and whether this plan routes it through the new mechanism or deletes it. Walk each seam to something reachable (a controller route, a cron job, a Stripe webhook, a frontend page or context action); a milestone against an unreached seam ships green and changes nothing. Record the grep that produces the map; `exec-plan` re-runs it.

4. File map, then milestones. Each milestone is independently verifiable: exact files and symbols, entity/migration/endpoint/DTO/email-template deltas or "none" with evidence, negative cases (wrong role, other user's data, zero hours balance), the smallest validation command set. An entity change names the MikroORM migration it generates (`npm run migration:create`). Name the test file and behavior; TDD is an execution constraint, not pasted code.

5. **Carry the verdict and the retirements.** Copy the design's abstract and verdict into **Intent and boundaries**. Every milestone moves the code toward the design's optimal, never away from it. A milestone that bends new code around a shape the design marked for replacement is a finding, not a shortcut. Each *deleted in this change* item gets a milestone (or a named step inside one) and a grep that proves it is gone, on every surface it lived on (backend, frontend, email templates, docs). *Deleted later* items go in **Supersedes** with their trigger. If planning shows the verdict was wrong (a "tweak" that touches every caller, a "rewrite" that keeps most of the current code), stop and return to `brainstorm`. Don't quietly re-scope.

6. Put material unresolved decisions at the top. If they change architecture or scope, stop and ask.

7. Self-review: spec coverage (including every retirement), direction, placeholder scan, name consistency, YAGNI.

8. Handoff: plan path, verdict, scope, retirements, risks, review depth, next command (`exec-plan planning/plans/YYYY-MM-DD-<slug>-plan.md`).

No worktrees. Commit the plan only if the user asks (pathspec).
