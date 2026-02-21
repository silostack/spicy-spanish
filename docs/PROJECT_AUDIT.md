# Spicy Spanish — Full Project Audit

> Generated: February 20, 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Domain Model](#3-domain-model)
4. [Backend Deep Dive](#4-backend-deep-dive)
5. [Frontend Deep Dive](#5-frontend-deep-dive)
6. [API Surface](#6-api-surface)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Integrations](#8-integrations)
9. [What's Implemented](#9-whats-implemented)
10. [What's Missing or Incomplete](#10-whats-missing-or-incomplete)
11. [Technical Debt](#11-technical-debt)
12. [Infrastructure & Deployment](#12-infrastructure--deployment)

---

## 1. Executive Summary

Spicy Spanish is a full-stack language school platform built as a monorepo. It serves three user roles — **Admin** (the school owner, Carla), **Tutors** (invited by admin), and **Students** (self-register). The platform handles scheduling, payments, course management, and email notifications.

**Tech stack:** Next.js 13+ frontend, NestJS backend, PostgreSQL with MikroORM, JWT auth.

**Current state:** The project is a functional MVP with most core modules scaffolded and partially integrated. Stripe payments work end-to-end. Google Calendar and Solana crypto payments are stubbed but non-functional. There are no tests, no migrations, no deployment configuration, and several UI pages rely on mock/hardcoded data.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                    │
│                      Port 8008                           │
│                                                          │
│  Pages: Public (home, about, contact, packages, tutors,  │
│         login, register) + Protected (/dashboard/*)      │
│                                                          │
│  State: React Context (Auth, App, Courses, Scheduling,   │
│         Payments)                                        │
│                                                          │
│  API Client: Axios with JWT interceptor                  │
│  Styling: Tailwind CSS + custom theme                    │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTP (Axios)
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                       │
│                      Port 3001                           │
│                   Prefix: /api                           │
│                                                          │
│  Modules: Auth, Users, Courses, Scheduling, Payments,    │
│           Email, Admin, Seeder                           │
│                                                          │
│  Auth: JWT + Passport (local + jwt strategies)           │
│  Guards: JwtAuthGuard, RolesGuard                        │
│  Validation: class-validator (global ValidationPipe)     │
│  Cron: @nestjs/schedule (email reminders)                │
└──────────────────────┬───────────────────────────────────┘
                       │ MikroORM
                       ▼
┌──────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                     │
│                                                          │
│  Tables: user, course, course_lesson, student_course,    │
│          appointment, availability, attendance,           │
│          class_report, package, transaction               │
└──────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
spicy-spanish/
├── frontend/          Next.js app
│   ├── src/
│   │   ├── app/       Pages (App Router)
│   │   ├── components/
│   │   ├── contexts/
│   │   └── utils/
│   └── public/
├── backend/           NestJS app
│   └── src/
│       ├── auth/
│       ├── users/
│       ├── courses/
│       ├── scheduling/
│       ├── payments/
│       ├── email/
│       ├── admin/
│       └── common/    Guards, decorators, middleware
├── PRD.md
├── PROJECT_STATUS.md
├── CLAUDE.md
└── docs/
```

---

## 3. Domain Model

### Entity Relationship Diagram (Textual)

```
User (1) ──── (N) StudentCourse ──── (1) Course
  │                    │
  │                    └──── (1) User (tutor)
  │
  ├── (1) ──── (N) Appointment ──── (1) User (tutor)
  │                    │
  │                    ├──── (1) Course (optional)
  │                    ├──── (N) Attendance
  │                    └──── (1) ClassReport
  │
  ├── (1) ──── (N) Availability (tutors only)
  │
  └── (1) ──── (N) Transaction ──── (1) Package (optional)

Course (1) ──── (N) CourseLesson
```

### Entities in Detail

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID v4 | Primary key |
| firstName | string | Required |
| lastName | string | Required |
| email | string | Unique |
| password | string | Bcrypt hashed, excluded from serialization |
| role | enum | ADMIN, TUTOR, STUDENT |
| profilePicture | string? | URL |
| bio | string? | |
| timezone | string? | |
| phoneNumber | string? | |
| dateOfBirth | string? | |
| nationality | string? | |
| profession | string? | |
| address | string? | |
| isActive | boolean | Default true |
| tutorExperience | string? | Tutor-only field |
| invitationToken | string? | For tutor invite flow |
| resetPasswordToken | string? | For password reset |
| resetPasswordExpires | Date? | Token expiry |
| stripeCustomerId | string? | Stripe integration |
| googleCalendarId | string? | Google Calendar |
| createdAt / updatedAt | Date | Auto-managed |

#### Course
| Field | Type | Notes |
|-------|------|-------|
| id | UUID v4 | Primary key |
| title | string | |
| description | string | |
| learningLevel | enum | BEGINNER, INTERMEDIATE, ADVANCED |
| isActive | boolean | Default true |
| lessons | Collection | One-to-many → CourseLesson |
| createdAt / updatedAt | Date | |

#### CourseLesson
| Field | Type | Notes |
|-------|------|-------|
| id | UUID v4 | Primary key |
| course | Course | Many-to-one |
| title | string | |
| content | text | Lesson content |
| order | number | Sequence within course |
| createdAt / updatedAt | Date | |

#### StudentCourse (Junction)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID v4 | Primary key |
| student | User | Many-to-one (STUDENT) |
| tutor | User | Many-to-one (TUTOR) |
| course | Course | Many-to-one |
| progress | number | 0-100 percentage, default 0 |
| createdAt / updatedAt | Date | |

#### Appointment
| Field | Type | Notes |
|-------|------|-------|
| id | UUID v4 | Primary key |
| student | User | Many-to-one |
| tutor | User | Many-to-one |
| course | Course? | Many-to-one, optional |
| startTime / endTime | Date | |
| status | enum | SCHEDULED, COMPLETED, CANCELLED, NO_SHOW |
| googleCalendarEventId | string? | For calendar sync |
| notes | string? | |
| reminderSent | boolean | 1-hour reminder flag |
| dayBeforeReminderSent | boolean | 24-hour reminder flag |
| confirmationEmailSent | boolean | |
| createdAt / updatedAt | Date | |

#### Availability
| Field | Type | Notes |
|-------|------|-------|
| id | UUID v4 | Primary key |
| tutor | User | Many-to-one |
| dayOfWeek | number | 0-6 (Sunday=0) |
| startTime / endTime | string | "HH:MM" 24-hour format |
| isRecurring | boolean | Default true |
| specificDate | Date? | For one-off slots |
| createdAt / updatedAt | Date | |

#### Attendance
| Field | Type | Notes |
|-------|------|-------|
| id | UUID v4 | Primary key |
| appointment | Appointment | Many-to-one |
| student | User | Many-to-one |
| status | enum | PRESENT, ABSENT, ON_TIME_CANCELLATION |
| notes | string? | |
| markedByTutor | boolean? | |
| markedAt | Date | Default now |
| createdAt / updatedAt | Date | |

#### ClassReport
| Field | Type | Notes |
|-------|------|-------|
| id | UUID v4 | Primary key |
| appointment | Appointment | Many-to-one |
| tutor | User | Many-to-one |
| subject | string | |
| content | text | |
| homeworkAssigned | string? | |
| studentProgress | string? | |
| nextLessonNotes | string? | |
| createdAt / updatedAt | Date | |

#### Package
| Field | Type | Notes |
|-------|------|-------|
| id | UUID v4 | Primary key |
| name | string | |
| description | string | |
| hours | number | Lesson hours included |
| priceUsd | number | |
| isActive | boolean | Default true |
| stripeProductId | string? | Synced with Stripe |
| stripePriceId | string? | Synced with Stripe |
| createdAt / updatedAt | Date | |

#### Transaction
| Field | Type | Notes |
|-------|------|-------|
| id | UUID v4 | Primary key |
| student | User | Many-to-one |
| package | Package? | Many-to-one, optional |
| amountUsd | number | |
| hours | number | |
| paymentMethod | enum | CREDIT_CARD, CRYPTO, ZELLE, PAYPAL, MANUAL |
| status | enum | PENDING, COMPLETED, FAILED, REFUNDED |
| stripePaymentId | string? | |
| cryptoTransactionId | string? | |
| notes | string? | |
| invoiceUrl | string? | |
| createdAt / updatedAt | Date | |

### Seeded Data

On first run, the **SeederModule** creates 4 default packages:
- Starter: 4 hours / $49
- Popular: 8 hours / $89
- Intensive: 16 hours / $159
- Premium: 32 hours / $299

Running `npm run seed` creates the admin user:
- Email: `carla@spicyspanish.com`, Password: `carla`

---

## 4. Backend Deep Dive

### Module Architecture

**AppModule** imports:
- `ConfigModule` (global)
- `MikroOrmModule` (database)
- `ScheduleModule` (cron jobs)
- All feature modules

Each feature module follows the pattern: `module.ts` → `controller.ts` → `service.ts` → `entity.ts`

### Global Configuration

**Validation** — Global `ValidationPipe` with:
- `whitelist: true` — strips unknown properties
- `forbidNonWhitelisted: true` — throws on unknown properties
- `transform: true` — auto-transforms to DTO types
- `skipMissingProperties: true` — allows optional fields

**CORS** — Development: any origin. Production: only `FRONTEND_URL`.

**Global Prefix** — `/api`

**Middleware** — `RawBodyMiddleware` on `/api/payments/stripe/webhook` for Stripe signature validation.

### Email Service

Uses Nodemailer with Handlebars templates. Sends:
1. New student registration notification (to admin)
2. Tutor invitation with registration link
3. Class reminder — 1 hour before (to student)
4. Day-before reminder — 24 hours before (to student)
5. Class confirmation — on booking (to student + tutor)
6. Class cancellation — on cancel (to student + tutor)
7. Payment notification — on completion (to admin)

**Scheduled Reminders**: Cron job runs every 5 minutes, checks for appointments needing reminders, updates reminder flags in DB.

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | development / production |
| `PORT` | Backend port (3001) |
| `JWT_SECRET` | JWT signing key |
| `JWT_EXPIRATION` | Token TTL (default 1h) |
| `FRONTEND_URL` | CORS allowed origin |
| `MIKRO_ORM_DB_NAME` | Database name |
| `MIKRO_ORM_USER` | Database user |
| `MIKRO_ORM_PASSWORD` | Database password |
| `MIKRO_ORM_HOST` | Database host |
| `MIKRO_ORM_PORT` | Database port |
| `EMAIL_HOST` | SMTP host |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASSWORD` | SMTP password |
| `EMAIL_FROM` | Sender address |
| `ADMIN_EMAIL` | Admin notification email |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `DEFAULT_SOLANA_WALLET` | Crypto wallet address |

---

## 5. Frontend Deep Dive

### Pages

**Public:**
| Route | Purpose |
|-------|---------|
| `/` | Landing page — hero, features, testimonials, CTA |
| `/about` | Company story, values, teaching methodology |
| `/contact` | Contact form (local state only, no backend) |
| `/packages` | Browse 4 pricing tiers |
| `/tutors` | Browse tutors (hardcoded data) |
| `/login` | Email/password login |
| `/register` | Student registration |

**Dashboard (protected):**
| Route | Purpose | Role |
|-------|---------|------|
| `/dashboard` | Main dashboard with role-based views | All |
| `/dashboard/profile` | Edit user profile | All |
| `/dashboard/schedule` | Book and manage lessons | All |
| `/dashboard/courses` | Browse courses | All |
| `/dashboard/courses/new` | Create course | Admin |
| `/dashboard/payments` | View packages and transactions | All |
| `/dashboard/availability` | Manage tutor availability | Tutor |
| `/dashboard/students` | Student management | Admin |
| `/dashboard/students/new` | Add student | Admin |
| `/dashboard/tutors` | Tutor management | Admin |
| `/dashboard/tutors/invite` | Invite tutors | Admin |
| `/dashboard/tutors/[id]` | Tutor detail | Admin |
| `/dashboard/attendance` | Attendance tracking | Admin/Tutor |
| `/dashboard/attendance-overview` | Attendance overview | Admin |
| `/dashboard/class-reports` | Class reports | Admin/Tutor |
| `/dashboard/tutor-dashboard` | Tutor-specific dashboard | Tutor |
| `/dashboard/settings` | System settings | Admin |
| `/dashboard/email-templates` | Email template management | Admin |

### State Management (React Context)

All contexts wrapped in `AppContextProvider` in order:

1. **AuthContext** — `user`, `token`, `isAuthenticated`, `isLoading`
   - Actions: `login()`, `register()`, `logout()`, `updateUser()`
   - Stores JWT in localStorage, auto-validates on mount

2. **AppContext** — `notifications`, `isSidebarOpen`
   - Actions: `addNotification()`, `removeNotification()`, `toggleSidebar()`
   - Notifications auto-dismiss after 5 seconds

3. **CoursesContext** — `courses`, `studentCourses`, `currentCourse`, `currentLesson`
   - Actions: `fetchCourses()`, `fetchStudentCourses()`, `enrollInCourse()`, `updateLessonProgress()`
   - Auto-fetches on user login

4. **SchedulingContext** — `tutors`, `availabilities`, `appointments`, `selectedTutor/Day/TimeSlot/Course`
   - Actions: `fetchTutors()`, `fetchTutorAvailability()`, `bookAppointment()`, `cancelAppointment()`
   - Multi-step booking flow: select tutor → select day → select time → book

5. **PaymentsContext** — `packages`, `transactions`, `selectedPackage`
   - Actions: `fetchPackages()`, `initiateStripeCheckout()`, `initiateCryptoPayment()`, `completeManualPayment()`
   - Auto-fetches on user login

### API Client

Axios instance with:
- Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`)
- Request interceptor: auto-attaches `Authorization: Bearer {token}` from localStorage
- `authService` helper with `login()`, `registerStudent()`, `getProfile()`, `testConnection()`

### Styling & Theming

**Custom Colors:**
- `spicy-red: #FF5C5C` — primary brand
- `spicy-orange: #FF9F5C` — hover/secondary
- `spicy-light: #FFF0E8` — light backgrounds
- `spicy-dark: #482C2D` — dark text

**Fonts:**
- `sans`: Poppins (300–700)
- `display`: Montserrat (400–700)

**UI Components:**
- `Button` — variants: default, outline, ghost, link, destructive; sizes: default, sm, lg, icon
- `Card` — CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `Tabs` — Radix UI based
- `Calendar` — React Calendar

---

## 6. API Surface

### Auth (`/api/auth`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/test` | None | Health check |
| POST | `/login` | None | Email/password login → JWT |
| POST | `/register/student` | None | Student self-registration |
| POST | `/register/tutor` | None | Tutor registration (requires invitation token) |
| POST | `/invite/tutor` | Admin | Send tutor invitation email |
| GET | `/profile` | JWT | Get current user profile |

### Users (`/api/users`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | Admin | List all users |
| GET | `/students` | Admin | Paginated student list (search, filter) |
| GET | `/tutors` | Admin, Student | List tutors |
| GET | `/tutors/:id/students` | Admin, Tutor | Students of a tutor |
| GET | `/students/:id` | Admin, Tutor | Student detail |
| GET | `/count` | Admin | User counts by role |
| GET | `/:id` | Admin | User detail |
| PATCH | `/:id` | All | Update user |
| DELETE | `/:id` | Admin | Delete user |

### Courses (`/api/courses`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | JWT | List all courses |
| GET | `/active` | JWT | Active courses only |
| GET | `/level/:level` | JWT | Courses by learning level |
| GET | `/:id` | JWT | Course with lessons |
| POST | `/` | Admin | Create course |
| PATCH | `/:id` | Admin | Update course |
| DELETE | `/:id` | Admin | Delete course |
| GET | `/lessons/:id` | JWT | Get lesson |
| POST | `/lessons` | Admin | Create lesson |
| PATCH | `/lessons/:id` | Admin | Update lesson |
| DELETE | `/lessons/:id` | Admin | Delete lesson |
| GET | `/assignments/:id` | JWT | Get student-course |
| GET | `/assignments/student/:id` | JWT | Student's courses |
| GET | `/assignments/tutor/:id` | JWT | Tutor's assignments |
| POST | `/assignments` | Admin | Assign course to student |
| PATCH | `/assignments/:id/progress` | JWT | Update progress |
| DELETE | `/assignments/:id` | Admin | Remove assignment |
| GET | `/stats` | Admin | Course statistics |

### Scheduling (`/api/scheduling`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/appointments` | Admin | All appointments |
| GET | `/appointments/:id` | JWT | Single appointment |
| GET | `/students/:id/appointments` | JWT | Student's appointments |
| GET | `/tutors/:id/appointments` | JWT | Tutor's appointments |
| GET | `/students/:id/upcoming-appointments` | JWT | Upcoming for student |
| GET | `/tutors/:id/upcoming-appointments` | JWT | Upcoming for tutor |
| POST | `/appointments` | JWT | Create appointment |
| PATCH | `/appointments/:id` | JWT | Update appointment |
| PATCH | `/appointments/:id/cancel` | JWT | Cancel appointment |
| PATCH | `/appointments/:id/complete` | Tutor, Admin | Complete appointment |
| GET | `/availability/:id` | JWT | Single availability |
| GET | `/tutors/:id/availability` | JWT | Tutor's availability |
| POST | `/availability` | Tutor, Admin | Create availability |
| PATCH | `/availability/:id` | Tutor, Admin | Update availability |
| DELETE | `/availability/:id` | Tutor, Admin | Delete availability |
| POST | `/attendance` | Tutor, Admin | Record attendance |
| GET | `/attendance/appointment/:id` | JWT | Attendance by appointment |
| GET | `/attendance/student/:id` | Tutor, Admin | Student attendance |
| PATCH | `/attendance/:id` | Tutor, Admin | Update attendance |
| GET | `/attendance/stats` | Admin | Attendance stats |
| POST | `/class-reports` | Tutor | Create class report |
| GET | `/class-reports/appointment/:id` | JWT | Report by appointment |
| PATCH | `/class-reports/:id` | Tutor | Update report |
| DELETE | `/class-reports/:id` | Tutor, Admin | Delete report |
| GET | `/class-reports/tutor/:id` | Tutor, Admin | Tutor's reports |
| GET | `/stats` | Admin | Scheduling dashboard stats |

### Payments (`/api/payments`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/packages` | None | All packages |
| GET | `/packages/active` | None | Active packages |
| GET | `/packages/:id` | None | Single package |
| POST | `/packages` | Admin | Create package |
| PATCH | `/packages/:id` | Admin | Update package |
| DELETE | `/packages/:id` | Admin | Delete package |
| GET | `/transactions` | Admin | All transactions |
| GET | `/transactions/:id` | JWT | Single transaction |
| GET | `/transactions/student/:id` | JWT | Student transactions |
| POST | `/transactions` | Admin | Create transaction |
| PATCH | `/transactions/:id` | Admin | Update transaction |
| DELETE | `/transactions/:id` | Admin | Delete transaction |
| POST | `/stripe/checkout` | JWT | Create Stripe session |
| POST | `/stripe/webhook` | None | Stripe webhook |
| POST | `/crypto/checkout` | JWT | Create crypto transaction |
| POST | `/transactions/:id/complete` | Admin | Complete manual payment |
| GET | `/stats` | Admin | Payment stats |

### Admin (`/api/admin`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/dashboard-stats` | Admin | Aggregated dashboard stats |

---

## 7. Authentication & Authorization

### Flow

```
1. User submits email + password
2. LocalStrategy validates credentials (bcrypt compare)
3. AuthService issues JWT: { sub: userId, email, role }
4. Client stores token in localStorage
5. Axios interceptor adds "Authorization: Bearer <token>" to all requests
6. JwtStrategy extracts token, loads full User entity
7. RolesGuard checks user.role against @Roles() decorator
```

### Guards

- **JwtAuthGuard** — Validates JWT, attaches user to request
- **RolesGuard** — Checks user role against `@Roles()` metadata. Passes if no roles required.

### Registration Flows

- **Students** — Self-register at `/register` → POST `/api/auth/register/student`
- **Tutors** — Admin sends invitation email → tutor clicks link → registers with token → POST `/api/auth/register/tutor`

### Token Details
- Signed with `JWT_SECRET` env var
- Default expiration: 1 hour (`JWT_EXPIRATION`)
- Frontend decodes token to check expiry on app load
- Expired tokens cleared, user redirected to login

---

## 8. Integrations

### Stripe (Working)

**Checkout flow:**
1. Frontend calls `POST /api/payments/stripe/checkout` with `packageId`, `studentId`, success/cancel URLs
2. Backend creates or retrieves Stripe customer from user
3. Creates Stripe checkout session linked to package
4. Returns session URL → frontend redirects to Stripe
5. After payment, Stripe hits webhook at `/api/payments/stripe/webhook`
6. `checkout.session.completed` event → transaction marked COMPLETED
7. `payment_intent.payment_failed` event → transaction marked FAILED

**Product sync:** Backend creates Stripe products/prices when packages are created via admin. Deactivates on delete.

### Google Calendar (Not Functional)

- All methods stubbed: `createGoogleCalendarEvent()` returns null, update/cancel return true without action
- Comment in code: "can't install these" for googleapis
- Entity fields exist (`googleCalendarEventId` on Appointment, `googleCalendarId` on User)
- Env vars defined but unused

### Solana/Crypto (Stub Only)

- `@solana/web3.js` installed but not used for actual blockchain operations
- `createCryptoCheckout()` creates a PENDING transaction in DB, returns wallet address
- `completeManualPayment()` is a manual admin action that flips status to COMPLETED
- No on-chain validation, no wallet verification, no transaction listening

### Email (Working)

- Provider: Nodemailer with SMTP configuration
- Templates: Handlebars for HTML rendering
- Cron-based reminders: Every 5 minutes, checks for upcoming appointments
- Non-blocking: email failures are caught and logged, don't break operations

---

## 9. What's Implemented

### Backend — Fully Implemented
- All entity definitions with proper relationships
- JWT authentication with local + JWT Passport strategies
- Role-based authorization (Admin, Tutor, Student)
- Complete CRUD for all resources (users, courses, lessons, student-courses, appointments, availability, attendance, class reports, packages, transactions)
- Stripe checkout and webhook handling
- Email notifications with 7 template types
- Cron-based appointment reminders
- Admin dashboard stats aggregation
- Database seeding (packages + admin user)
- Global validation pipe with class-validator
- CORS configuration

### Frontend — Fully Implemented
- Public marketing pages (home, about, contact, packages, tutors)
- Login and student registration
- Dashboard with role-based views (admin, tutor, student)
- Profile editing
- Lesson scheduling with multi-step booking flow
- Course browsing with search and filtering
- Package browsing and Stripe checkout initiation
- Transaction history
- Student management (admin)
- Tutor management (admin)
- Tutor invitation flow (admin)
- Responsive layout with mobile support
- Custom brand theming (colors, fonts)
- JWT token management with auto-refresh

---

## 10. What's Missing or Incomplete

### High Priority

| Feature | Status | Details |
|---------|--------|---------|
| **Google Calendar sync** | Stubbed | All methods return null/true. No actual Google API calls. |
| **Crypto payments** | Stub | Creates DB records only. No blockchain interaction. |
| **Password reset** | Fields exist | `resetPasswordToken` and `resetPasswordExpires` on User entity, but no endpoints or UI. |
| **Tests** | None | Zero test files despite Jest config in package.json. |
| **Database migrations** | None | Schema managed only through ORM auto-sync. No version control for schema changes. |
| **Deployment config** | None | No Docker, no CI/CD, no production configs. |

### Medium Priority

| Feature | Status | Details |
|---------|--------|---------|
| **Contact form submission** | UI only | Form renders but submits to local state, no backend endpoint. |
| **Forgot password page** | Missing | Referenced in login UI but page doesn't exist. |
| **Terms of Service page** | Missing | Referenced in registration but page doesn't exist. |
| **Privacy Policy page** | Missing | Referenced in registration but page doesn't exist. |
| **Tutors page** | Hardcoded | Uses static mock data instead of API. |
| **Course content display** | Missing | Course browsing works but actual lesson content rendering is not implemented. |
| **Profile picture upload** | Missing | Field exists but no upload mechanism. |
| **Zelle/PayPal payments** | Enum only | Payment methods defined in enum but no endpoints or UI. |
| **Invoice generation** | Field only | `invoiceUrl` field on Transaction but no generation logic. |

### Low Priority

| Feature | Status | Details |
|---------|--------|---------|
| **Real-time notifications** | Local only | AppContext manages notifications in memory, no WebSocket/SSE. |
| **Google Analytics** | Not set up | Env var defined but no tracking code. |
| **Email template admin UI** | Page exists | Dashboard page scaffolded but functionality unclear. |
| **Tutor dashboard** | Page exists | Separate tutor dashboard page but may overlap with main dashboard. |
| **Progress auto-calculation** | Manual only | Progress is a manually-set percentage, not derived from completed lessons. |

---

## 11. Technical Debt

### Code Quality

- **Inline DTOs** — Many DTOs defined as interfaces inside controllers instead of separate files with proper class-validator decorators. Affects: courses, scheduling, payments controllers.
- **Console.log pollution** — Debug logging (`console.log`) scattered throughout services and controllers. Should be replaced with structured logging (Winston/Pino).
- **`any` types** — EntityManager and several service methods use `any`. Reduces type safety.
- **Large components** — Some frontend pages (e.g., SchedulePage) exceed 700 lines. Should be decomposed.
- **Repeated patterns** — Context files share similar fetch/error/loading patterns that could be abstracted.

### Architecture Concerns

- **No global exception filter** — Errors return raw NestJS error objects. Should have structured error responses.
- **No request logging** — No middleware to log requests/responses for debugging.
- **No rate limiting** — API endpoints are unprotected against brute force.
- **Hour calculation assumes 1 hour** — `scheduling.service.ts` assumes every appointment is 1 hour instead of calculating from start/end times.
- **JWT in localStorage** — Vulnerable to XSS attacks. HttpOnly cookies would be more secure.
- **No CSRF protection** — No anti-CSRF tokens.
- **Mock data fallbacks** — Frontend courses and payments pages have hardcoded fallback data that may mask API failures in production.

### Missing Validation

- Many DTOs lack min/max length validators, email format validators, timezone format validation, and numeric range validation.
- Availability times stored as strings with no format enforcement.
- No request size limits configured.

---

## 12. Infrastructure & Deployment

### Current State: Not Production-Ready

| Component | Status |
|-----------|--------|
| Docker | Not configured |
| CI/CD | Not configured |
| Production hosting | Not configured |
| SSL/TLS | Not configured |
| Database backups | Not configured |
| Monitoring/Alerting | Not configured |
| Logging infrastructure | Not configured |
| Environment management | .env files only |
| Secrets management | Plaintext in .env |

### What Would Be Needed for Production

1. **Containerization** — Dockerfiles for frontend and backend, docker-compose for local dev
2. **CI/CD** — GitHub Actions or similar for build, test, deploy pipeline
3. **Database migrations** — MikroORM migration system for versioned schema changes
4. **Hosting** — Options: Vercel (frontend) + Railway/Render (backend + DB), or AWS/GCP
5. **Secrets** — Move to a secrets manager or encrypted env
6. **Monitoring** — Error tracking (Sentry), uptime monitoring, log aggregation
7. **SSL** — HTTPS for both frontend and backend
8. **Backups** — Automated PostgreSQL backups
9. **CDN** — For static assets and images

---

*End of audit.*
