# Spicy Spanish — Gameplan to Address Gaps

> Created: February 20, 2026
> Executor: Owner + Claude Code (session-based)
> Goal: Feature completion per PRD, production deployment on Railway/Render

---

## Overview

7 phases, roughly ordered by dependency. Each phase is scoped to be tackled in 1–3 Claude Code sessions. Earlier phases unblock later ones.

```
Phase 1: Clean Up & Fix Foundations
Phase 2: Stripe Payments E2E
Phase 3: Google Calendar Integration
Phase 4: Missing Pages & Flows
Phase 5: Frontend/Backend Alignment
Phase 6: Full Backend Test Coverage
Phase 7: Docker, CI/CD & Deployment
```

---

## Phase 1: Clean Up & Fix Foundations

**Why first:** Removes dead code, fixes type safety, and establishes patterns that all later work depends on.

### 1.1 Remove Solana/Crypto Integration
- Delete `@solana/web3.js` from `backend/package.json`
- Remove `createCryptoCheckout()` from `payments.service.ts`
- Remove `POST /crypto/checkout` endpoint from `payments.controller.ts`
- Remove crypto-related UI from frontend payments page
- Remove `DEFAULT_SOLANA_WALLET` from env files and docs
- Keep the `CRYPTO` value in `PaymentMethod` enum for historical transaction records, but remove it from any user-facing selection
- Remove `frontend/test-payments.html`

### 1.2 Extract DTOs to Separate Files
- Create proper DTO classes with `class-validator` decorators for:
  - `courses/dto/` — CreateCourseDto, UpdateCourseDto, CreateLessonDto, UpdateLessonDto, AssignCourseDto, UpdateProgressDto
  - `scheduling/dto/` — CreateAppointmentDto, UpdateAppointmentDto, CreateAvailabilityDto, UpdateAvailabilityDto, CreateAttendanceDto, UpdateAttendanceDto, CreateClassReportDto, UpdateClassReportDto
  - `payments/dto/` — CreatePackageDto, UpdatePackageDto, CreateTransactionDto, UpdateTransactionDto, StripeCheckoutDto
- Add proper validation: `@IsString()`, `@IsEmail()`, `@IsNumber()`, `@Min()`, `@Max()`, `@IsEnum()`, `@IsOptional()`, `@IsUUID()`, `@IsDateString()`, etc.

### 1.3 Replace Console.log with Structured Logging
- Install and configure `@nestjs/common` Logger or a library like `nestjs-pino`
- Replace all `console.log` / `console.error` throughout backend with the logger
- Add request logging middleware
- Remove all `console.log` from frontend code (especially payments page)

### 1.4 Add Global Exception Filter
- Create `common/filters/http-exception.filter.ts`
- Return structured error responses: `{ statusCode, message, error, timestamp, path }`
- Register globally in `main.ts`

### 1.5 Fix Hour Calculation
- In `scheduling.service.ts`: calculate appointment duration from `endTime - startTime` instead of assuming 1 hour

### 1.6 Set Up Database Migrations
- Initialize MikroORM migrations: `npx mikro-orm migration:create --initial`
- Add migration scripts to `package.json`
- Document migration workflow in CLAUDE.md

---

## Phase 2: Stripe Payments E2E

**Why:** Payments are the revenue engine. Everything else is secondary if students can't pay.

### 2.1 Verify Stripe Checkout Flow
- Test full flow: frontend package selection → checkout session creation → Stripe redirect → webhook → transaction completed
- Fix any broken links in the chain (the audit noted the frontend "just shows alert" for checkout)
- Ensure `successUrl` and `cancelUrl` route to proper frontend pages

### 2.2 Build Payment Success/Cancel Pages
- Create `/payments/success` page — shows confirmation, transaction details, next steps
- Create `/payments/cancel` page — shows message, link back to packages

### 2.3 Wire Frontend Payments Page to Real API
- Remove hardcoded/mock transaction data from frontend payments page
- Ensure admin view shows real transactions from API
- Ensure student view shows their real transaction history

### 2.4 Add Student Hour Balance
- Backend: Add endpoint or field to track remaining purchased hours per student
- Frontend: Display remaining hours on student dashboard
- Logic: hours purchased (from completed transactions) minus hours used (from completed appointments)

### 2.5 Stripe Product Sync Verification
- Ensure creating/updating/deleting packages in admin UI syncs correctly with Stripe products/prices
- Test webhook handling for edge cases (duplicate events, out-of-order delivery)

---

## Phase 3: Google Calendar Integration

**Why:** The PRD requires calendar sync for scheduling. The code is stubbed — need to make it real.

### 3.1 Install and Configure googleapis
- `npm install googleapis` in backend
- Troubleshoot any install issues (the previous attempt failed)
- Set up Google Cloud project with Calendar API enabled
- Generate OAuth2 credentials and refresh token
- Add credentials to `.env`

### 3.2 Implement Calendar Service
- Un-stub the methods in `scheduling.service.ts`:
  - `createGoogleCalendarEvent()` — create event on appointment booking
  - `updateGoogleCalendarEvent()` — update on appointment changes
  - `cancelGoogleCalendarEvent()` — delete on appointment cancellation
- Use tutor's `googleCalendarId` if set, otherwise use default calendar
- Store `googleCalendarEventId` on the Appointment entity (field already exists)

### 3.3 Handle Calendar Auth Flow
- Decide: service account (simpler, one calendar) vs OAuth per-tutor (more complex, tutor-specific calendars)
- Recommendation: Start with a **service account** that manages one shared calendar. Per-tutor OAuth can come later.

### 3.4 Error Handling
- Calendar sync should be non-blocking (like email) — log failures, don't break appointment creation
- Add retry logic or flag for failed syncs

---

## Phase 4: Missing Pages & Flows

**Why:** Dead links and missing flows hurt trust. These are quick wins.

### 4.1 Password Reset Flow
- **Backend:**
  - `POST /api/auth/forgot-password` — generates reset token, sends email
  - `POST /api/auth/reset-password` — validates token, updates password
  - Use existing `resetPasswordToken` and `resetPasswordExpires` fields on User
- **Frontend:**
  - `/forgot-password` page — email input form
  - `/reset-password?token=xxx` page — new password form
- **Email:**
  - Add password reset email template

### 4.2 Terms of Service Page
- Create `/terms` page with placeholder legal text
- Simple static page matching site design

### 4.3 Privacy Policy Page
- Create `/privacy` page with placeholder legal text
- Simple static page matching site design

### 4.4 Contact Form Backend
- `POST /api/contact` endpoint (can be unguarded)
- Sends email to ADMIN_EMAIL with form contents
- Add success/error feedback in frontend

### 4.5 Profile Picture Upload
- **Backend:** File upload endpoint (`POST /api/users/:id/avatar`) using Multer
- Store locally or in S3/Cloudinary (start with local, switch to cloud in deployment phase)
- **Frontend:** Add upload widget to profile page
- Update User entity `profilePicture` with URL

### 4.6 Fix Tutors Public Page
- Replace hardcoded tutor data with API call to `GET /api/users/tutors`
- This endpoint exists but the frontend page doesn't use it (it's behind auth — may need a public-facing endpoint or make tutors list public)

---

## Phase 5: Frontend/Backend Alignment

**Why:** The audit found several places where frontend and backend are out of sync.

### 5.1 Remove Mock Data Fallbacks
- Courses page: Remove hardcoded course data, rely on API
- Payments page: Remove hardcoded transaction data
- Schedule page: Ensure time slots reflect actual tutor availability (not client-side generation without conflict checking)

### 5.2 Fix Course Context API Calls
- `fetchStudentCourses()` calls `/courses/student/{id}` but backend expects `/courses/assignments/student/{id}` — fix the mismatch
- Verify all context API paths match actual backend routes

### 5.3 Wire Up Remaining Admin Pages
- Verify these dashboard pages actually call the backend and aren't just scaffolded shells:
  - `/dashboard/attendance` and `/dashboard/attendance-overview`
  - `/dashboard/class-reports`
  - `/dashboard/email-templates`
  - `/dashboard/settings`
  - `/dashboard/availability`

### 5.4 Add Error Boundaries
- Create a React error boundary component
- Wrap major page sections so one failing component doesn't crash the page

### 5.5 Fix Hydration Issues
- Audit date formatting across components (the audit noted explicit hydration workarounds)
- Ensure server/client rendering produces consistent output

---

## Phase 6: Full Backend Test Coverage

**Why:** No tests exist. Need coverage before deployment to catch regressions.

### 6.1 Set Up Test Infrastructure
- Verify Jest config works (`npm test`)
- Set up test database configuration (use in-memory SQLite or test PostgreSQL)
- Create test utilities: mock factories for entities, auth helpers
- Set up `beforeEach` / `afterEach` patterns for DB cleanup

### 6.2 Unit Tests — Auth Module
- `auth.service.spec.ts` — login, register student, register tutor, validate user, JWT generation
- Test password hashing, token validation, role assignment
- Test invitation flow (token generation, token validation)

### 6.3 Unit Tests — Users Module
- `users.service.spec.ts` — CRUD operations, pagination, role-based queries
- Test student count, tutor listing, user deactivation

### 6.4 Unit Tests — Courses Module
- `courses.service.spec.ts` — CRUD for courses, lessons, student-course assignments
- Test progress updates, stats calculation

### 6.5 Unit Tests — Scheduling Module
- `scheduling.service.spec.ts` — appointments, availability, attendance, class reports
- Test appointment status transitions (scheduled → completed, scheduled → cancelled)
- Test availability conflict detection
- Test reminder flag logic

### 6.6 Unit Tests — Payments Module
- `payments.service.spec.ts` — packages, transactions, Stripe integration
- Mock Stripe SDK for checkout session creation
- Test webhook event handling (completed, failed)
- Test transaction status transitions

### 6.7 Unit Tests — Email Module
- `email.service.spec.ts` — template rendering, email sending
- Mock Nodemailer transport
- Test cron-based reminder selection logic

### 6.8 E2E Tests
- `auth.e2e-spec.ts` — registration, login, profile retrieval
- `payments.e2e-spec.ts` — package listing, checkout flow, webhook
- `scheduling.e2e-spec.ts` — create availability, book appointment, cancel
- `courses.e2e-spec.ts` — create course, assign to student, update progress
- `admin.e2e-spec.ts` — dashboard stats

---

## Phase 7: Docker, CI/CD & Deployment

**Why:** Last phase — everything is tested and working, now ship it.

### 7.1 Dockerize
- `backend/Dockerfile` — multi-stage build (build → production)
- `frontend/Dockerfile` — Next.js standalone output
- `docker-compose.yml` at root — backend, frontend, PostgreSQL for local dev
- `.dockerignore` files

### 7.2 CI/CD Pipeline
- GitHub Actions workflow:
  - On PR: lint + test (backend unit + E2E)
  - On merge to main: build Docker images, deploy
- Cache node_modules and Docker layers for speed

### 7.3 Deploy to Railway/Render
- **Backend service:** NestJS app from Docker image
  - Set all env vars (DB, JWT, Stripe, Email, etc.)
  - Configure health check endpoint
- **PostgreSQL:** Managed database on Railway/Render
  - Run migrations on deploy
  - Set up automated backups
- **Frontend service:** Next.js app
  - Set `NEXT_PUBLIC_API_URL` to backend URL
  - Configure custom domain if ready

### 7.4 Production Hardening
- Switch JWT storage from localStorage to HttpOnly cookies (or accept the tradeoff and document it)
- Add rate limiting (`@nestjs/throttler`)
- Configure production CORS (only allow frontend domain)
- Set up error tracking (Sentry free tier)
- Add health check endpoint (`GET /api/health`)
- Review and rotate any hardcoded secrets

### 7.5 Documentation
- Update CLAUDE.md with migration and deployment commands
- Update README with setup instructions for new developers
- Document environment variable requirements

---

## Phase Dependency Map

```
Phase 1 (Foundations)
  ├── Phase 2 (Payments) ─────────┐
  ├── Phase 3 (Google Calendar)    │
  └── Phase 4 (Missing Pages)     ├── Phase 5 (Alignment) ── Phase 6 (Tests) ── Phase 7 (Deploy)
                                   │
                                   │
```

Phases 2, 3, and 4 can run in parallel after Phase 1. Phase 5 depends on 2–4. Phase 6 depends on 5. Phase 7 depends on 6.

---

## Estimated Effort

| Phase | Sessions | Notes |
|-------|----------|-------|
| 1. Foundations | 2–3 | Mostly mechanical refactoring |
| 2. Payments E2E | 1–2 | Stripe already mostly works |
| 3. Google Calendar | 2–3 | Depends on googleapis install issues |
| 4. Missing Pages | 2–3 | Multiple small features |
| 5. Alignment | 1–2 | Bug fixes and wiring |
| 6. Testing | 3–5 | Largest phase by volume |
| 7. Deployment | 2–3 | Docker + Railway setup |
| **Total** | **~13–21 sessions** | |

---

*This plan is a living document. Update it as phases complete and priorities shift.*
