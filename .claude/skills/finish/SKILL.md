---
name: finish
description: Use after a Spicy Spanish feature or significant change is implemented, before it ships, to check conventions, lint, build and tests, migrations, env vars, docs, lessons, and the changelog for consistency.
---

# /finish — Post-implementation sweep (Spicy Spanish)

Runs after implementation is complete. Determines what changed, then sweeps every surface that may be stale.

> Finishing is **not** committing, pushing, or opening a PR. Never commit unless the user asks. Never `git add -A` (the root holds untracked dumps such as `spicy-prod.sql` that must never be committed).

## Step 1 — Scope the diff

```bash
git status --short
git diff main --name-only        # on a feature branch; on main: git diff origin/main --name-only plus git diff HEAD --name-only
```

Map changed paths to surfaces:

| Changed path | Surface | Look at |
|---|---|---|
| `backend/src/<module>/*.service.ts`, `*.controller.ts`, `dto/**` | backend (name the module: auth, users, courses, scheduling, payments, email, admin, ebook, contact) | the module's `*.spec.ts`; guards and `@Roles()` on every new route |
| `backend/src/**/entities/*.entity.ts` | schema | Step 4 |
| `backend/src/migrations/**` | migration | Step 4; flag for `deploy-steps` |
| `backend/src/scheduling/lesson-generator.service.ts`, `schedule-timezone.ts`, any `@Cron` | cron / lesson generation | timezone rule in root `CLAUDE.md` |
| `backend/src/payments/**` | Stripe | webhook idempotency, test-mode keys only |
| `backend/src/email/**` | email | templates and the 5-minute email cron |
| `backend/.env.example`, `ConfigService.get` / `process.env` reads | env | Step 5; flag for `deploy-steps` |
| `frontend/src/app/**` | web app | contexts in `frontend/src/app/contexts/`, API util in `frontend/src/app/utils/` |
| `frontend/.env.local.example`, `NEXT_PUBLIC_*` reads | frontend env | build-time vars; flag for `deploy-steps` |
| `docker-compose.yml`, `*/Dockerfile`, `.github/workflows/**` | infra / CI | flag for `deploy-steps` |

## Step 2 — Conventions + simplify

Review every changed file against root `CLAUDE.md` and the patterns of the surrounding module:

- Every new or changed route has `JwtAuthGuard` + `RolesGuard` + `@Roles()` as appropriate, and a tutor or student can only reach their own courses, lessons, and attendance.
- Hours balances change only through attendance or an explicit admin adjustment; no path double-debits or double-credits.
- Schedule times stay wall-clock in `SCHEDULE_TIMEZONE`; lesson instants are computed with `date-fns-tz`, never the server's local zone. The frontend displays in the viewer's local zone.
- DTOs validate input; no secrets, tokens, or Stripe keys logged.

Skim `docs/lessons/` (if it exists) so a recorded mistake is not reintroduced.

Then simplify the changed code: dead code, `any`, verbose patterns, leftover `console.log`. Match surrounding idioms.

## Step 3 — Lint, build, test (evidence before "done")

Mirror CI (`.github/workflows/ci.yml`):

- Backend: `cd backend && npm run lint && npm run test && npm run build`.
- Frontend: `cd frontend && npm run lint && npm run build`.

Note that backend `npm run lint` runs `--fix`; report any files it rewrote. If the unit-test count changed, update the count in root `CLAUDE.md` (CI/CD section) and `AGENTS.md`.

Show the output. A step skipped is a step reported as skipped.

## Step 4 — Migration (when an entity changed)

Schema changes ship as MikroORM migrations in `backend/src/migrations/`. If `backend/src/**/entities/*.entity.ts` changed and the diff has no new migration:

1. `cd backend && npm run migration:create` against the local dev DB.
2. **Read the generated file and trim it to this feature's delta.** The dev DB drifts; never ship statements for entities outside the diff.
3. Check that `down()` reverses `up()`, and note any backfill a new NOT NULL column needs on existing production rows.

An entity change with no migration is a deploy gap. A data fix (not schema) goes in `backend/scripts/<slug>.sql`, idempotent, in the style of `remediate-schedule-data.sql`.

## Step 5 — Docs and config

- Root `CLAUDE.md` **and** `AGENTS.md` (currently a near-copy of it; keep them in step): if a command, module, convention, env var, or architecture fact they state changed.
- `memory/MEMORY.md`: if a key file, endpoint, or rule it records changed.
- `backend/.env.example`, `frontend/.env.local.example`, and the `backend` env block in `docker-compose.yml`: every new or renamed env var appears in all that apply.
- `README.md`, `backend/README.md`, `frontend/README.md`: only if setup or commands changed.
- Skip `docs/plans/` and `planning/` (records, not living docs).

## Step 6 — Lessons

If this change fixed a bug or reversed a wrong approach with a reusable lesson, add the next numbered `docs/lessons/NNN-<slug>.md` (create the folder on the first one): a header with Date, Affected, Severity; then Symptom, Root Cause, Fix, and the lesson learned. Skip for routine features. (Example of lesson-worthy: the schedule timezone bug in `docs/schedule-data-remediation.md`.)

## Step 7 — Changelog (`planning/changelog.md`)

Only for meaningful additions a student, tutor, or admin will notice (new page, capability, email, payment option). Skip bug fixes, refactors, internal-only changes. Create the file on its first entry. Prepend:

```markdown
## YYYY-MM-DD — Short feature title

One paragraph: what it does and why it matters.

**What changed:**
- Concrete change 1
```

## Summary checklist

- [ ] Scoped the diff → surfaces
- [ ] Conventions (guards/roles, hours integrity, timezone, DTOs); lessons skimmed; simplified
- [ ] Lint, test, build for backend and frontend; output shown
- [ ] Migration written and trimmed if an entity changed
- [ ] `CLAUDE.md` / `AGENTS.md` / `MEMORY.md` / env examples updated
- [ ] Lesson recorded (if this followed a bug or correction)
- [ ] Changelog (features only)
- [ ] Did **not** commit or push
