---
name: deploy-steps
description: Use after a Spicy Spanish feature is finished (ideally after finish) when the user needs to know everything required to ship it to production. Writes planning/deployment/YYYY-MM-DD-<slug>-deployment.md; it does not deploy.
---

# /deploy-steps — Generate a deploy runbook (Spicy Spanish)

Turn the branch diff into an **ordered, copy-pasteable deploy runbook** for a human operator. Write it to `planning/deployment/YYYY-MM-DD-<slug>-deployment.md` (same slug as the feature's `planning/plans/` file when one exists; otherwise a slug from the branch). Do not leave the runbook only in chat.

Shape: summary, what's changing, pre-deployment checklist, deploy, post-deploy verification, rollback, appendix of verified values. For tone on a data-sensitive change, see [`docs/schedule-data-remediation.md`](../../../docs/schedule-data-remediation.md).

> **Guardrail:** this skill **produces a runbook; it does not deploy.** Never run production commands, never connect to the production database, never touch live Stripe or real Calendar events, never commit or push. Fill placeholders (`<DATABASE_URL>`, `<STRIPE_SECRET_KEY>`, host names); never write a secret as a literal.

> **Production runs under pm2.** A deploy is: get the new code onto the server, build, run any pending MikroORM migrations, then restart the pm2 service. The Dockerfiles and `docker-compose.yml` are for local use only. Server app dir: `/home/si/projects/spicy-spanish`. pm2 processes: `spicy-backend` (backend), `spicy-frontend` (frontend).
>
> Standard backend sequence (run on the server):
> ```bash
> cd /home/si/projects/spicy-spanish && git pull origin main
> cd backend && npm ci && npm run build
> npm run migration:pending          # confirm exactly the expected migrations are listed
> npm run migration:up               # uses production MIKRO_ORM_* from backend/.env
> pm2 restart spicy-backend --update-env
> pm2 logs spicy-backend --lines 100 # watch boot
> ```
> Frontend, when it changed: `cd /home/si/projects/spicy-spanish/frontend && npm ci && npm run build && pm2 restart spicy-frontend --update-env`.

## Step 1 — Scope the diff

```bash
git status --short
git fetch origin && git diff origin/main --name-only     # on a feature branch: what it adds over production
git log origin/main..HEAD --oneline
```

If the work is already on `main`, ask the user which commit production currently runs and diff from there. Read the linked design and plan when they exist.

## Step 2 — Derive the deploy delta

Emit a step only when its category is triggered. For the load-bearing ones (migrations, env, data) say **"no change"** explicitly when untriggered.

| # | Category | Trigger | What to emit |
|---|---|---|---|
| A | **Merge** | always | PR to `main`; CI (lint → test → build for backend, lint → build for frontend) must be green. |
| B | **Pull + build** | always | On the server: `git pull origin main`, then backend `npm ci && npm run build`; frontend `npm ci && npm run build` when it changed — `NEXT_PUBLIC_*` vars are baked in at build time, so they must be set in `frontend/.env.local` **before** the frontend build. |
| C | **Migration** | new `backend/src/migrations/*.ts`, or changed `*.entity.ts` | Back up the production DB first (`pg_dump <DATABASE_URL> > backup-<date>.sql`). Then, after the build and **before** `pm2 restart`: `npm run migration:pending` (name the migrations it must list) and `npm run migration:up`. Paste the migration's SQL into the appendix for review. Entity changed with no migration → flag a gap and send them to `finish`. Note backfills and whether `down()` is safe. Untriggered → "no migrations; skip `migration:up`" (still run `migration:pending` to confirm nothing is unexpectedly pending). |
| D | **Data script** | new `backend/scripts/*.sql` | Run order relative to the migration and the backend restart; whether it is safe to re-run; the verification query. |
| E | **Env** | `backend/.env.example`, `frontend/.env.local.example`, `docker-compose.yml` env, new `process.env` / `ConfigService.get` reads | Each var that became required, new-optional, renamed, or removable, per app. Call out secrets to rotate. `SCHEDULE_TIMEZONE` changes shift every generated lesson; flag loudly. |
| F | **Cron / startup** | `@Cron` jobs (lesson generation at 2 AM, email queue every 5 min), `OnModuleInit` | What runs automatically after restart and when; whether the deploy should avoid the 2 AM lesson-generation window; what it will create or send. |
| G | **Stripe** | `backend/src/payments/**`, webhook handlers, products/prices | Webhook endpoint or event list changes in the Stripe dashboard, new products/prices, live vs test keys. |
| H | **Google Calendar / email** | `google-calendar.service.ts`, `backend/src/email/**` | Service-account or calendar-sharing changes; new or changed templates; whether real emails will go out on deploy. |
| I | **pm2 restart** | apps changed | Migration → `pm2 restart spicy-backend --update-env` → `pm2 restart spicy-frontend --update-env` (when the frontend changed). `--update-env` matters whenever env changed. Then `pm2 status` and `pm2 logs spicy-backend --lines 100`. |
| J | **Smoke test** | the feature's surface | `curl <BACKEND_URL>/api/health` first, then a concrete check derived from this feature: an API call, a dashboard flow as admin / tutor / student, a log line. A real-payment test is an explicit operator decision, never a default. |
| K | **Rollback** | always | Per part: env toggle + `pm2 restart --update-env` first (fastest); code: `git checkout <PREVIOUS_SHA>`, rebuild, `pm2 restart`; migration: `npm run migration:down` (once per migration, **before** checking out the old code, while the migration files still exist) if `down()` is safe, otherwise restore the backup; data script reversal. Note lessons or attendance created between deploy and rollback. |

## Step 3 — Emit the runbook

Order: merge → DB backup → env → pull + build → `migration:pending` / `migration:up` → data scripts → Stripe / Calendar config → `pm2 restart` (backend, then frontend) → health check → smoke test → post-deploy watch (`pm2 logs` lines and the next cron run to watch) → rollback at the bottom.

End with a one-line **Delta summary** (for example *"1 migration (adds `lesson.notes`); 1 new backend env var; no Stripe change"*). Keep it to what this diff needs. Report the file path.

## Not in scope

Running the deploy (including `migration:up` or `pm2 restart`), touching production data, committing, or pushing. CI (`.github/workflows/ci.yml`) runs lint, tests, and builds on `main`; it does not deploy.
