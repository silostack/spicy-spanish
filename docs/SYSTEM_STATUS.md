# Spicy Spanish — System Status Document

> **Generated:** February 20, 2026
> **Purpose:** Complete technical reference for the current state of the platform

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [Backend API Reference](#4-backend-api-reference)
5. [Backend Services](#5-backend-services)
6. [Frontend Pages & Routes](#6-frontend-pages--routes)
7. [Frontend State Management](#7-frontend-state-management)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [External Integrations](#9-external-integrations)
10. [Email System](#10-email-system)
11. [Infrastructure & DevOps](#11-infrastructure--devops)
12. [Test Coverage](#12-test-coverage)
13. [What's Still Missing / Known Gaps](#13-whats-still-missing--known-gaps)

---

## 1. Platform Overview

Spicy Spanish is a full-stack language school platform connecting Colombian Spanish tutors with students worldwide. It handles scheduling, payments, course management, attendance tracking, and automated email notifications.

**Tech Stack:**

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | latest (13+) |
| Frontend Language | TypeScript | 5.1 |
| Styling | Tailwind CSS | 3.3 |
| Backend | NestJS | 10.x |
| Backend Language | TypeScript | 5.1 |
| Database | PostgreSQL | 16 |
| ORM | MikroORM | 5.9 |
| Payments | Stripe | 12.x |
| Calendar | Google Calendar API (googleapis) | 126.x |
| Email | Nodemailer + Handlebars | 6.9 |
| Auth | Passport.js + JWT | 10.x |
| Rate Limiting | @nestjs/throttler | latest |
| Containerization | Docker + Docker Compose | — |
| CI/CD | GitHub Actions | — |

**Ports:**
- Frontend dev: `8008` / Docker production: `3000`
- Backend: `3001`
- PostgreSQL: `5432`

---

## 2. Architecture

### Monorepo Structure

```
spicy-spanish/
├── frontend/                    # Next.js 13+ App Router
│   ├── src/app/                 # Pages and layouts
│   │   ├── contexts/            # React Context providers (5)
│   │   ├── components/          # Shared UI components
│   │   ├── utils/               # API client (Axios)
│   │   ├── dashboard/           # Authenticated dashboard pages
│   │   └── [public pages]/      # Login, register, about, etc.
│   ├── public/                  # Static assets
│   ├── Dockerfile               # Multi-stage Next.js standalone build
│   └── next.config.js           # output: 'standalone'
├── backend/                     # NestJS
│   ├── src/
│   │   ├── auth/                # Authentication module
│   │   ├── users/               # User management module
│   │   ├── courses/             # Course & lesson module
│   │   ├── scheduling/          # Appointments, availability, attendance, reports
│   │   ├── payments/            # Stripe, packages, transactions
│   │   ├── email/               # Nodemailer + Handlebars templates
│   │   ├── admin/               # Dashboard stats aggregation
│   │   ├── contact/             # Public contact form
│   │   ├── health/              # Health check endpoint
│   │   ├── seeders/             # Database seeders
│   │   ├── common/              # Guards, filters, middleware, decorators
│   │   └── migrations/          # MikroORM migrations
│   ├── Dockerfile               # Multi-stage NestJS build
│   └── test/                    # E2E test config
├── docker-compose.yml           # Full-stack local development
├── .github/workflows/ci.yml    # GitHub Actions CI pipeline
└── docs/                        # Project documentation
```

### Backend Module Dependency Graph

```
AppModule
├── ConfigModule (global)
├── ThrottlerModule (100 req/min)
├── MikroOrmModule (PostgreSQL, autoLoadEntities)
├── ScheduleModule (cron jobs)
├── AuthModule
│   ├── MikroOrmModule.forFeature([User])
│   ├── PassportModule
│   ├── JwtModule
│   ├── EmailModule
│   └── UsersModule
├── UsersModule
│   └── MikroOrmModule.forFeature([User, StudentCourse, Transaction, Appointment])
├── CoursesModule
│   └── MikroOrmModule.forFeature([Course, CourseLesson, StudentCourse, User])
├── SchedulingModule
│   ├── MikroOrmModule.forFeature([Availability, Appointment, Attendance, ClassReport, User, Course])
│   ├── EmailModule
│   └── GoogleCalendarService
├── PaymentsModule
│   └── MikroOrmModule.forFeature([Package, Transaction, User, Appointment])
├── EmailModule
│   └── MikroOrmModule.forFeature([Appointment])
├── AdminModule
│   ├── UsersModule
│   ├── PaymentsModule
│   └── CoursesModule
├── ContactModule
│   └── EmailModule
├── HealthModule
└── SeederModule
    └── MikroOrmModule.forFeature([Package])
```

### Frontend Context Provider Stack

```
AppContextProvider
└── AuthProvider          # JWT token, user state, login/logout/register
    └── AppProvider       # Notifications, sidebar toggle
        └── CoursesProvider    # Courses, lessons, enrollment
            └── SchedulingProvider  # Tutors, availability, appointments
                └── PaymentsProvider    # Packages, transactions, Stripe checkout
```

### Request Flow

```
Browser → Next.js (port 8008/3000)
  ├── Static pages (SSG/SSR)
  └── API calls via Axios →
        Backend (port 3001)
          ├── Global prefix: /api
          ├── ValidationPipe (whitelist, transform)
          ├── ThrottlerGuard (100 req/min)
          ├── JwtAuthGuard → JWT Strategy → DB lookup
          ├── RolesGuard → @Roles() metadata check
          ├── Controller → Service → EntityManager → PostgreSQL
          └── AllExceptionsFilter (structured error responses)
```

---

## 3. Database Schema

### Entities & Relationships

10 entities across 4 domain modules:

```
User ──────────────┬── StudentCourse (student) ──── Course
  │                ├── StudentCourse (tutor)
  │                ├── Appointment (student)
  │                ├── Appointment (tutor) ──── Course (optional)
  │                ├── Availability (tutor)
  │                ├── Attendance (student) ──── Appointment
  │                ├── ClassReport (tutor) ──── Appointment
  │                └── Transaction (student) ── Package (optional)
  │
Course ────────────── CourseLesson (1:many, orphanRemoval)
```

### Entity: User

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| id | string (UUID) | PK | uuid v4 |
| firstName | string | required | — |
| lastName | string | required | — |
| email | string | unique, required | — |
| password | string | required, excluded from serialization | — |
| role | UserRole enum | required | — |
| profilePicture | string | nullable | null |
| bio | string | nullable | null |
| timezone | string | nullable | null |
| phoneNumber | string | nullable | null |
| invitationToken | string | nullable | null |
| resetPasswordToken | string | nullable | null |
| resetPasswordExpires | Date | nullable | null |
| stripeCustomerId | string | nullable | null |
| googleCalendarId | string | nullable | null |
| dateOfBirth | Date | nullable | null |
| nationality | string | nullable | null |
| profession | string | nullable | null |
| address | string | nullable | null |
| isActive | boolean | required | true |
| tutorExperience | string | nullable | null |
| createdAt | Date | required | now |
| updatedAt | Date | required, auto-update | now |

**Computed:** `get fullName()` → `${firstName} ${lastName}`

**UserRole enum:** `admin`, `tutor`, `student`

### Entity: Course

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| id | string (UUID) | PK | uuid v4 |
| title | string | required | — |
| description | string (text) | required | — |
| learningLevel | LearningLevel enum | required | — |
| lessons | Collection\<CourseLesson\> | 1:many, orphanRemoval | [] |
| isActive | boolean | required | true |
| createdAt | Date | required | now |
| updatedAt | Date | required, auto-update | now |

**LearningLevel enum:** `beginner`, `intermediate`, `advanced`

### Entity: CourseLesson

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| id | string (UUID) | PK | uuid v4 |
| course | Course | ManyToOne, required | — |
| title | string | required | — |
| content | string (text) | required | — |
| order | number | required | — |
| createdAt / updatedAt | Date | auto | now |

### Entity: StudentCourse

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| id | string (UUID) | PK | uuid v4 |
| student | User | ManyToOne, required | — |
| tutor | User | ManyToOne, required | — |
| course | Course | ManyToOne, required | — |
| progress | number | 0–100 | 0 |
| createdAt / updatedAt | Date | auto | now |

### Entity: Appointment

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| id | string (UUID) | PK | uuid v4 |
| student | User | ManyToOne, required | — |
| tutor | User | ManyToOne, required | — |
| course | Course | ManyToOne, nullable | null |
| startTime | Date | required | — |
| endTime | Date | required | — |
| status | AppointmentStatus enum | required | SCHEDULED |
| googleCalendarEventId | string | nullable | null |
| notes | string | nullable | null |
| reminderSent | boolean | | false |
| reminderSentAt | Date | nullable | null |
| dayBeforeReminderSent | boolean | | false |
| dayBeforeReminderSentAt | Date | nullable | null |
| confirmationEmailSent | boolean | | false |
| createdAt / updatedAt | Date | auto | now |

**AppointmentStatus enum:** `scheduled`, `completed`, `cancelled`, `no_show`

### Entity: Availability

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| id | string (UUID) | PK | uuid v4 |
| tutor | User | ManyToOne, required | — |
| dayOfWeek | number | 0–6 (Sun–Sat) | — |
| startTime | string | HH:MM 24h format | — |
| endTime | string | HH:MM 24h format | — |
| isRecurring | boolean | | true |
| specificDate | Date | nullable (used when isRecurring=false) | null |
| createdAt / updatedAt | Date | auto | now |

### Entity: Attendance

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| id | string (UUID) | PK | uuid v4 |
| appointment | Appointment | ManyToOne, required | — |
| student | User | ManyToOne, required | — |
| status | AttendanceStatus enum | required | — |
| notes | string | nullable | null |
| markedByTutor | boolean | nullable | null |
| markedAt | Date | | now |
| createdAt / updatedAt | Date | auto | now |

**AttendanceStatus enum:** `present`, `absent`, `on_time_cancellation`

### Entity: ClassReport

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| id | string (UUID) | PK | uuid v4 |
| appointment | Appointment | ManyToOne, required | — |
| tutor | User | ManyToOne, required | — |
| subject | string | required | — |
| content | string (text) | required | — |
| homeworkAssigned | string | nullable | null |
| studentProgress | string | nullable | null |
| nextLessonNotes | string | nullable | null |
| createdAt / updatedAt | Date | auto | now |

### Entity: Package

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| id | string (UUID) | PK | uuid v4 |
| name | string | required | — |
| description | string | required | — |
| hours | number | required | — |
| priceUsd | number | required | — |
| isActive | boolean | | true |
| stripeProductId | string | nullable | null |
| stripePriceId | string | nullable | null |
| createdAt / updatedAt | Date | auto | now |

### Entity: Transaction

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| id | string (UUID) | PK | uuid v4 |
| student | User | ManyToOne, required | — |
| package | Package | ManyToOne, nullable | null |
| amountUsd | number | required | — |
| hours | number | required | — |
| paymentMethod | PaymentMethod enum | required | — |
| status | TransactionStatus enum | | PENDING |
| stripePaymentId | string | nullable | null |
| cryptoTransactionId | string | nullable | null |
| notes | string | nullable | null |
| invoiceUrl | string | nullable | null |
| createdAt / updatedAt | Date | auto | now |

**PaymentMethod enum:** `credit_card`, `crypto`, `zelle`, `paypal`, `manual`
**TransactionStatus enum:** `pending`, `completed`, `failed`, `refunded`

---

## 4. Backend API Reference

All routes prefixed with `/api`. Authentication via Bearer JWT token where noted.

### Auth (`/api/auth`)

| Method | Route | Auth | Roles | Description |
|--------|-------|------|-------|-------------|
| GET | `/test` | — | — | Health check for auth module |
| POST | `/login` | — | — | Returns `{ access_token, user }` |
| POST | `/register/student` | — | — | Creates student account |
| POST | `/register/tutor` | — | — | Registers tutor via invitation token |
| POST | `/forgot-password` | — | — | Sends password reset email (always returns success) |
| POST | `/reset-password` | — | — | Validates token, updates password |
| GET | `/public-tutors` | — | — | Returns active tutors with safe public fields only |
| POST | `/invite/tutor` | JWT | ADMIN | Sends tutor invitation email |
| GET | `/profile` | JWT | — | Returns current user profile |

### Users (`/api/users`)

| Method | Route | Auth | Roles | Description |
|--------|-------|------|-------|-------------|
| GET | `/` | JWT | ADMIN | All users |
| GET | `/students` | JWT | ADMIN | Paginated students with search/filter |
| GET | `/tutors` | JWT | ADMIN, STUDENT | All tutors |
| GET | `/tutors/:tutorId/students` | JWT | ADMIN, TUTOR | Students assigned to tutor |
| GET | `/students/:id` | JWT | ADMIN, TUTOR | Student with courses, hours, transactions |
| GET | `/count` | JWT | ADMIN | User count statistics |
| GET | `/:id` | JWT | ADMIN | Single user by ID |
| PATCH | `/:id` | JWT | ADMIN, TUTOR, STUDENT | Update user profile |
| DELETE | `/:id` | JWT | ADMIN | Delete user |

### Courses (`/api/courses`)

| Method | Route | Auth | Roles | Description |
|--------|-------|------|-------|-------------|
| GET | `/` | JWT | — | All courses |
| GET | `/active` | JWT | — | Active courses only |
| GET | `/level/:learningLevel` | JWT | — | Courses by learning level |
| GET | `/:id` | JWT | — | Single course with lessons |
| POST | `/` | JWT | ADMIN | Create course |
| PATCH | `/:id` | JWT | ADMIN | Update course |
| DELETE | `/:id` | JWT | ADMIN | Delete course |
| GET | `/lessons/:id` | JWT | — | Single lesson with course |
| POST | `/lessons` | JWT | ADMIN | Create lesson |
| PATCH | `/lessons/:id` | JWT | ADMIN | Update lesson |
| DELETE | `/lessons/:id` | JWT | ADMIN | Delete lesson |
| GET | `/assignments/:id` | JWT | — | Single student-course assignment |
| GET | `/assignments/student/:studentId` | JWT | — | All assignments for student |
| GET | `/assignments/tutor/:tutorId` | JWT | — | All assignments for tutor |
| POST | `/assignments` | JWT | ADMIN | Assign student to course |
| PATCH | `/assignments/:id/progress` | JWT | — | Update progress (0–100) |
| DELETE | `/assignments/:id` | JWT | ADMIN | Remove assignment |
| GET | `/stats` | JWT | ADMIN | Course statistics |

### Scheduling (`/api/scheduling`)

| Method | Route | Auth | Roles | Description |
|--------|-------|------|-------|-------------|
| GET | `/appointments` | JWT | ADMIN | All appointments |
| GET | `/appointments/:id` | JWT | — | Single appointment |
| GET | `/students/:id/appointments` | JWT | — | Student's appointments |
| GET | `/tutors/:id/appointments` | JWT | — | Tutor's appointments |
| GET | `/students/:id/upcoming-appointments` | JWT | — | Student's upcoming only |
| GET | `/tutors/:id/upcoming-appointments` | JWT | — | Tutor's upcoming only |
| POST | `/appointments` | JWT | — | Book appointment (validates availability, checks conflicts, syncs Google Calendar, sends emails) |
| PATCH | `/appointments/:id` | JWT | — | Update appointment |
| PATCH | `/appointments/:id/cancel` | JWT | — | Cancel (updates calendar, sends emails) |
| PATCH | `/appointments/:id/complete` | JWT | TUTOR, ADMIN | Mark completed |
| GET | `/availability/:id` | JWT | — | Single availability slot |
| GET | `/tutors/:id/availability` | JWT | — | Tutor's all availability |
| POST | `/availability` | JWT | TUTOR, ADMIN | Create availability slot |
| PATCH | `/availability/:id` | JWT | TUTOR, ADMIN | Update slot |
| DELETE | `/availability/:id` | JWT | TUTOR, ADMIN | Delete slot |
| POST | `/attendance` | JWT | ADMIN, TUTOR | Record attendance |
| GET | `/attendance/appointment/:appointmentId` | JWT | — | Attendance for appointment |
| GET | `/attendance/student/:studentId` | JWT | ADMIN, TUTOR | Student attendance history |
| PATCH | `/attendance/:id` | JWT | ADMIN, TUTOR | Update attendance |
| GET | `/attendance/stats` | JWT | ADMIN | Attendance statistics |
| POST | `/class-reports` | JWT | TUTOR | Create class report |
| GET | `/class-reports/appointment/:appointmentId` | JWT | — | Report for appointment |
| GET | `/class-reports/tutor/:tutorId` | JWT | ADMIN, TUTOR | Tutor's reports |
| PATCH | `/class-reports/:id` | JWT | TUTOR | Update report |
| DELETE | `/class-reports/:id` | JWT | TUTOR, ADMIN | Delete report |
| GET | `/stats` | JWT | ADMIN | Scheduling statistics |

### Payments (`/api/payments`)

| Method | Route | Auth | Roles | Description |
|--------|-------|------|-------|-------------|
| GET | `/packages` | — | — | All packages |
| GET | `/packages/active` | — | — | Active packages only |
| GET | `/packages/:id` | — | — | Single package |
| POST | `/packages` | JWT | ADMIN | Create package (+ Stripe product/price) |
| PATCH | `/packages/:id` | JWT | ADMIN | Update package (+ Stripe sync) |
| DELETE | `/packages/:id` | JWT | ADMIN | Deactivate Stripe + delete |
| GET | `/transactions` | JWT | ADMIN | All transactions |
| GET | `/transactions/student/:studentId` | JWT | — | Student's transactions |
| GET | `/transactions/:id` | JWT | — | Single transaction |
| POST | `/transactions` | JWT | ADMIN | Create manual transaction |
| PATCH | `/transactions/:id` | JWT | ADMIN | Update transaction |
| DELETE | `/transactions/:id` | JWT | ADMIN | Delete transaction |
| POST | `/stripe/checkout` | JWT | — | Create Stripe checkout session |
| POST | `/stripe/webhook` | — | — | Stripe webhook handler (raw body) |
| POST | `/transactions/:id/complete` | JWT | ADMIN | Complete manual payment |
| GET | `/balance/:studentId` | JWT | — | `{ totalHoursPurchased, hoursUsed, availableHours }` |
| GET | `/stats` | JWT | ADMIN | Payment statistics |

### Admin (`/api/admin`)

| Method | Route | Auth | Roles | Description |
|--------|-------|------|-------|-------------|
| GET | `/dashboard-stats` | JWT | ADMIN | `{ users, payments, courses }` aggregated stats |

### Contact (`/api/contact`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/` | — | Sends contact form email to admin |

### Health (`/api/health`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | — | `{ status: 'ok', timestamp }` |

**Total: 70+ API endpoints**

---

## 5. Backend Services

### Middleware & Filters

| Component | Location | Purpose |
|-----------|----------|---------|
| AllExceptionsFilter | `common/filters/` | Global exception handler, returns `{ statusCode, timestamp, path, method, message }` |
| RawBodyMiddleware | `common/middleware/` | Preserves raw body on `POST /api/payments/stripe/webhook` for Stripe signature verification |
| JwtAuthGuard | `common/guards/` | Validates Bearer JWT token via Passport |
| RolesGuard | `common/guards/` | Checks `@Roles()` metadata against `req.user.role` |
| @Roles() decorator | `common/decorators/` | Attaches required roles metadata to route handlers |
| ThrottlerModule | `app.module.ts` | 100 requests per 60 seconds per IP |

### Cron Jobs

| Job | Schedule | Service | Description |
|-----|----------|---------|-------------|
| Email Reminders | Every 5 minutes | EmailService | Queries for appointments within 1-hour and 24-hour windows, sends reminders, marks flags |

### Database Seeders

| Seeder | Trigger | Creates |
|--------|---------|---------|
| seed.ts | Manual (`npm run seed`) | Admin user: `carla@spicyspanish.com` / `carla` |
| SeederService | Auto on module init | 4 packages (Starter $49/4hr, Popular $89/8hr, Intensive $159/16hr, Premium $299/32hr) if none exist |

### Validation

Global `ValidationPipe` configured with:
- `whitelist: true` — strips unknown properties
- `forbidNonWhitelisted: true` — rejects requests with unknown properties
- `transform: true` — auto-transforms DTO types
- `skipMissingProperties: true` — allows partial updates

15+ DTO classes with class-validator decorators: `@IsUUID`, `@IsEmail`, `@IsString`, `@IsNumber`, `@Min`, `@Max`, `@IsEnum`, `@IsDateString`, `@IsOptional`, `@IsBoolean`, `@MinLength`, `@Matches`, `@IsPhoneNumber`.

---

## 6. Frontend Pages & Routes

### Public Pages (no auth required)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero, features grid, testimonials, CTAs |
| `/about` | About | Company story, values, teaching method |
| `/tutors` | Tutors | Public tutor listing with search, fetches from `/api/auth/public-tutors`, falls back to 3 hardcoded tutors |
| `/packages` | Packages | Pricing cards with monthly/yearly toggle, fetches from `/api/payments/packages/active`, falls back to 4 hardcoded packages |
| `/contact` | Contact | Contact form (name, email, subject, message), posts to `/api/contact` |
| `/login` | Login | Email/password form, posts to `/api/auth/login` |
| `/register` | Register | Student registration (firstName, lastName, email, password, phone, timezone) |
| `/forgot-password` | Forgot Password | Email input, posts to `/api/auth/forgot-password` |
| `/reset-password` | Reset Password | Token from URL, new password form, posts to `/api/auth/reset-password` |
| `/terms` | Terms of Service | 9-section legal page |
| `/privacy` | Privacy Policy | 7-section privacy page mentioning Stripe, Google Calendar |

### Dashboard Pages (JWT auth required)

| Route | Access | Description |
|-------|--------|-------------|
| `/dashboard` | All | Role-based dashboard: admin sees stats cards + tables, student/tutor sees quick summary |
| `/dashboard/profile` | All | Edit personal profile (name, email, phone, bio, timezone, etc.) |
| `/dashboard/schedule` | All | Book appointments: select tutor → date → time slot → confirm. View upcoming/past lessons. |
| `/dashboard/courses` | All | Course listing with search, filters (level, active), pagination. Admin: table view with toggle. Student/tutor: card grid. |
| `/dashboard/payments` | Admin, Student | **Admin tab**: package management (CRUD), transaction list, mark complete. **Student tab**: hour balance, active packages, Stripe checkout, transaction history. |
| `/dashboard/payments/success` | Student | Post-Stripe success page with animated checkmark, links to schedule/history |
| `/dashboard/payments/cancel` | Student | Post-Stripe cancel page with message and navigation |
| `/dashboard/students` | Admin, Tutor | Paginated student table with search, filters (active/inactive/new), status toggle |
| `/dashboard/students/new` | Admin | Create student form with personal info, account settings, learning preferences |
| `/dashboard/tutors` | Admin | Tutor table with search, filters, invite resend, status toggle |
| `/dashboard/tutors/invite` | Admin | Invitation form with live email preview |
| `/dashboard/tutors/[id]` | Admin | Read-only tutor profile view |
| `/dashboard/tutors/[id]/edit` | Admin | Edit tutor profile (personal, professional, system settings) |
| `/dashboard/tutors/[id]/availability` | Admin | Manage tutor availability (recurring weekly + specific dates) |
| `/dashboard/availability` | Tutor | Self-manage availability (same UI as admin version but scoped to current tutor) |
| `/dashboard/attendance` | Admin, Tutor | Mark attendance for completed lessons (present/absent/on-time cancellation) |
| `/dashboard/attendance-overview` | Admin | Stats dashboard: attendance rate, breakdown charts, recent records, filter by student/tutor |
| `/dashboard/class-reports` | Tutor | Create/edit lesson reports (subject, content, homework, progress, next lesson notes) |
| `/dashboard/tutor-dashboard` | Tutor | Weekly calendar view, upcoming classes, student cards (currently uses mock data) |
| `/dashboard/email-templates` | Admin | Template editor with preview, variable reference, test send (falls back to mock templates) |
| `/dashboard/settings` | All | Profile settings form (mirrors `/dashboard/profile`) |

### Layout Structure

- **Public pages**: `MainLayout` (Header + content + Footer)
- **Dashboard pages**: `DashboardLayout` (fixed sidebar + content area)
  - Sidebar: role-based navigation, user avatar, logout
  - Mobile: hamburger toggle with full-width overlay
  - Auth guard: redirects to `/login` if not authenticated

### UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Header | `components/Header.tsx` | Logo, nav links, mobile hamburger menu |
| Footer | `components/Footer.tsx` | 4-column footer: info, quick links, resources, contact + social |
| MainLayout | `components/MainLayout.tsx` | Wraps Header + children + Footer |
| Button | `components/ui/button.tsx` | Variants: default, outline, ghost, link, destructive. Sizes: default, sm, lg, icon |
| Card | `components/ui/card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| Calendar | `components/ui/calendar.tsx` | react-day-picker wrapper with spicy-red theme |
| Tabs | `components/ui/tabs.tsx` | Radix UI tabs wrapper: Tabs, TabsList, TabsTrigger, TabsContent |

### Error Boundaries

| File | Scope | Behavior |
|------|-------|----------|
| `app/error.tsx` | Global | Full-screen centered error card with "Try Again" |
| `app/dashboard/error.tsx` | Dashboard | In-context error card with "Try Again" |

### Design System

| Token | Value |
|-------|-------|
| `spicy-red` | #FF5C5C |
| `spicy-orange` | #FF9F5C |
| `spicy-light` | #FFF0E8 |
| `spicy-dark` | #482C2D |
| Font (body) | Poppins (300–700) |
| Font (display) | Montserrat (400–700) |

---

## 7. Frontend State Management

### AuthContext

**State:** `user`, `token`, `isLoading`, `isAuthenticated`

| Method | API Call | Description |
|--------|----------|-------------|
| `login(email, password)` | POST `/auth/login` | Stores token + user in localStorage and context |
| `register(userData)` | POST `/auth/register/student` or `/tutor` | Creates account, stores token |
| `logout()` | — | Clears localStorage, redirects to `/login` |
| `updateUser(userData)` | PATCH `/users/{id}` | Updates profile |
| `fetchUserData(token)` | GET `/auth/profile` | Validates JWT expiry, fetches user |

### AppContext

**State:** `notifications[]`, `isSidebarOpen`

| Method | Description |
|--------|-------------|
| `addNotification({ message, type })` | Shows toast, auto-removes after 5s |
| `removeNotification(id)` | Manual dismiss |
| `toggleSidebar()` | Mobile sidebar toggle |

### CoursesContext

**State:** `courses[]`, `studentCourses[]`, `currentCourse`, `currentLesson`, `isLoading`, `error`

| Method | API Call | Description |
|--------|----------|-------------|
| `fetchCourses()` | GET `/courses` | All courses |
| `fetchStudentCourses()` | GET `/courses/assignments/student/{id}` | Student's enrolled courses |
| `fetchCourseById(id)` | GET `/courses/{id}` | Single course with lessons |
| `fetchLessonById(courseId, lessonId)` | GET `/courses/{courseId}/lessons/{lessonId}` | Single lesson |
| `enrollInCourse(courseId)` | POST `/courses/assignments` | Assign student to course |
| `updateLessonProgress(lessonId, completed)` | PATCH `/courses/lessons/{id}/progress` | Update completion |

### SchedulingContext

**State:** `tutors[]`, `availabilities[]`, `appointments[]`, `courses[]`, `selectedTutor`, `selectedDay`, `selectedTimeSlot`, `selectedCourse`, `isLoading`, `error`

| Method | API Call | Description |
|--------|----------|-------------|
| `fetchTutors()` | GET `/users/tutors` | All tutors |
| `fetchTutorAvailability(tutorId)` | GET `/scheduling/tutors/{id}/availability` | Tutor slots |
| `fetchAppointments()` | GET `/scheduling/{role}/{id}/appointments` | Role-based appointment fetch |
| `fetchCourses()` | GET `/courses/active` | Active courses for booking |
| `bookAppointment(notes)` | POST `/scheduling/appointments` | Book with selected tutor/day/time/course |
| `cancelAppointment(id)` | PATCH `/scheduling/appointments/{id}/cancel` | Cancel appointment |

### PaymentsContext

**State:** `packages[]`, `transactions[]`, `selectedPackage`, `isLoading`, `error`

| Method | API Call | Description |
|--------|----------|-------------|
| `fetchPackages()` | GET `/payments/packages/active` | Active packages |
| `fetchTransactions()` | GET `/payments/transactions` or `/student/{id}` | Role-based |
| `selectPackage(pkg)` | — | Sets selected package |
| `initiateStripeCheckout()` | POST `/payments/stripe/checkout` | Redirects to Stripe |
| `completeManualPayment(id)` | POST `/payments/transactions/{id}/complete` | Admin manual complete |

### API Client (`utils/api.ts`)

Axios instance with:
- Base URL: `NEXT_PUBLIC_API_URL` or `http://localhost:3001/api`
- Request interceptor: auto-attaches `Authorization: Bearer {token}` from localStorage
- Content-Type: `application/json`

---

## 8. Authentication & Authorization

### Flow

1. **Registration**: Student self-registers at `/register`. Tutors are invited by admin (email with token) and register at `/register` with their invitation token.
2. **Login**: `POST /api/auth/login` → validates email/password via bcrypt → returns JWT with `{ sub: userId, email, role }` in payload.
3. **Token Storage**: JWT stored in `localStorage` under key `'token'`. User object under `'user'`.
4. **Request Auth**: Axios interceptor reads token from localStorage and attaches `Authorization: Bearer {token}` header.
5. **Backend Validation**: `JwtAuthGuard` extracts token → `JwtStrategy` validates against `JWT_SECRET` → looks up user by `payload.sub` in DB → attaches to `req.user`.
6. **Role Check**: `RolesGuard` reads `@Roles()` metadata → compares against `req.user.role` → 403 if no match.
7. **Password Reset**: `POST /forgot-password` generates UUID token + 1hr expiry → sends email. `POST /reset-password` validates token + expiry → bcrypt hashes new password.

### Roles & Permissions

| Feature | Admin | Tutor | Student |
|---------|-------|-------|---------|
| View all users | Yes | — | — |
| Manage students | Yes | View own | — |
| Manage tutors | Yes | — | — |
| Invite tutors | Yes | — | — |
| Create/edit courses | Yes | — | — |
| Assign courses | Yes | — | — |
| Book appointments | Yes | Yes | Yes |
| Cancel appointments | Yes | Yes | Yes |
| Complete appointments | Yes | Yes | — |
| Manage availability | Yes | Own only | — |
| Record attendance | Yes | Yes | — |
| Write class reports | — | Yes | — |
| Manage packages | Yes | — | — |
| View transactions | Yes (all) | — | Own only |
| Manual payment complete | Yes | — | — |
| Stripe checkout | — | — | Yes |
| View dashboard stats | Yes | — | — |
| Edit own profile | Yes | Yes | Yes |

---

## 9. External Integrations

### Stripe

**Configuration:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**Package Sync:**
- Creating a package → creates Stripe Product + Price
- Updating package price → creates new Stripe Price, deactivates old
- Deleting package → deactivates Stripe Product and Price

**Checkout Flow:**
1. Frontend calls `POST /api/payments/stripe/checkout` with `{ packageId, studentId, successUrl, cancelUrl }`
2. Backend creates/retrieves Stripe Customer for student
3. Creates Stripe Checkout Session with `line_items` from package's `stripePriceId`
4. Creates pending Transaction in DB
5. Returns `{ sessionId, sessionUrl, transactionId }`
6. Frontend redirects to `sessionUrl`
7. On payment completion, Stripe sends webhook to `POST /api/payments/stripe/webhook`
8. Backend verifies signature, handles events:
   - `checkout.session.completed` → marks Transaction as COMPLETED, stores invoice URL
   - `payment_intent.payment_failed` → marks Transaction as FAILED with error message

**Raw Body:** Stripe webhooks require raw body for signature verification. `RawBodyMiddleware` is applied only to the webhook route.

### Google Calendar

**Configuration:** `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`

**Service Account Auth:** Uses JWT auth with service account credentials. The `GoogleCalendarService` checks `isEnabled()` before any operation — if credentials are missing, calendar operations are silently skipped.

**Integration Points:**
- `createAppointment()` → creates Google Calendar event, stores `googleCalendarEventId` on Appointment
- `updateAppointment()` (time change) → updates existing Calendar event
- `cancelAppointment()` → deletes Calendar event
- `completeAppointment()` → updates event summary with "(Completed)" suffix

**Non-blocking:** All calendar operations are wrapped in try/catch. Failures are logged but never prevent appointment CRUD from completing.

### Nodemailer

**Configuration:** `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`, `ADMIN_EMAIL`

Creates SMTP transport on service initialization. All email sends are non-blocking (failures logged, not thrown).

---

## 10. Email System

### Templates (10 total, inline Handlebars HTML)

| # | Template | Recipients | Trigger |
|---|----------|-----------|---------|
| 1 | New Student Registration | Admin | Student registers |
| 2 | Tutor Invitation | Tutor email | Admin invites tutor |
| 3 | Password Reset | User email | Forgot password request |
| 4 | Class Reminder (1hr) | Student | Cron: 1 hour before class |
| 5 | Day-Before Reminder | Student | Cron: 24 hours before class |
| 6 | Payment Notification | Admin | Stripe payment completes |
| 7 | Class Confirmation (Student) | Student | Appointment booked |
| 8 | Class Confirmation (Tutor) | Tutor | Appointment booked |
| 9 | Class Cancellation | Student + Tutor | Appointment cancelled |
| 10 | Contact Form | Admin (replyTo: sender) | Contact form submitted |

### Cron-Based Reminders

The `sendScheduledReminders()` method runs every 5 minutes via `@nestjs/schedule`:

1. Forks a fresh EntityManager
2. Queries for appointments where `startTime` is within 55–65 minutes from now AND `reminderSent = false`
3. Sends 1-hour reminders, marks `reminderSent = true`
4. Queries for appointments where `startTime` is within 23.5–24.5 hours from now AND `dayBeforeReminderSent = false`
5. Sends day-before reminders, marks `dayBeforeReminderSent = true`
6. All sends are individually try/caught — one failure doesn't block others

---

## 11. Infrastructure & DevOps

### Docker

**Backend Dockerfile** (multi-stage):
1. **Builder stage**: `node:20-alpine`, `npm ci`, `npm run build`
2. **Production stage**: `node:20-alpine`, `npm ci --omit=dev`, copies `dist/`, runs `node dist/main`

**Frontend Dockerfile** (multi-stage):
1. **Deps stage**: `node:20-alpine`, `npm ci`
2. **Builder stage**: copies node_modules, `npm run build` (standalone output)
3. **Production stage**: `node:20-alpine`, creates `nextjs` user (UID 1001), copies `.next/standalone` + `.next/static` + `public`, runs `node server.js`

**docker-compose.yml:**
- `postgres`: PostgreSQL 16 Alpine with health check (`pg_isready`)
- `backend`: depends on postgres (healthy), health check via `wget /api/health`
- `frontend`: depends on backend (healthy)
- Volume: `pgdata` for PostgreSQL persistence
- Environment variables sourced from `.env` at repo root with sensible defaults

### GitHub Actions CI

**Trigger:** Push to `main` or PR to `main`

**Jobs:**
1. `backend-lint-test`: `npm ci` → `npm run lint` → `npm test` (198 tests)
2. `backend-build`: depends on lint-test, `npm ci` → `npm run build`
3. `frontend-lint-build`: `npm ci` → `npm run lint` → `npm run build`

Node 20, npm caching enabled per workspace.

### Environment Variables

**Backend (`backend/.env.example`):**

| Variable | Required | Description |
|----------|----------|-------------|
| NODE_ENV | Yes | `development` or `production` |
| PORT | Yes | Backend port (default: 3001) |
| JWT_SECRET | Yes | Secret for JWT signing |
| JWT_EXPIRATION | Yes | Token TTL in seconds (default: 3600) |
| DATABASE_URL | Yes | PostgreSQL connection string |
| MIKRO_ORM_DB_NAME | Yes | Database name |
| MIKRO_ORM_USER | Yes | Database user |
| MIKRO_ORM_PASSWORD | Yes | Database password |
| MIKRO_ORM_HOST | Yes | Database host |
| MIKRO_ORM_PORT | Yes | Database port (default: 5432) |
| EMAIL_HOST | Yes | SMTP host |
| EMAIL_PORT | Yes | SMTP port (default: 587) |
| EMAIL_USER | Yes | SMTP username |
| EMAIL_PASSWORD | Yes | SMTP password |
| EMAIL_FROM | Yes | Sender email address |
| ADMIN_EMAIL | Yes | Admin notification recipient |
| STRIPE_SECRET_KEY | Yes | Stripe secret key |
| STRIPE_WEBHOOK_SECRET | Yes | Stripe webhook signing secret |
| FRONTEND_URL | Yes | Frontend URL for CORS and email links |
| GOOGLE_CLIENT_EMAIL | No | Google service account email |
| GOOGLE_PRIVATE_KEY | No | Google service account private key |
| GOOGLE_CALENDAR_ID | No | Google Calendar ID |

**Frontend (`frontend/.env.local.example`):**

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_API_URL | Yes | Backend API URL (default: http://localhost:3001) |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Yes | Stripe publishable key |
| NEXT_PUBLIC_GA_MEASUREMENT_ID | No | Google Analytics ID |

---

## 12. Test Coverage

**6 test suites, 198 unit tests, all passing.**

| Suite | File | Tests | Coverage |
|-------|------|-------|----------|
| Auth | `auth.service.spec.ts` | 23 | login, register, password reset, tutor invitation, graceful email failures |
| Users | `users.service.spec.ts` | 33 | CRUD, pagination, search/filter, role queries, student details with hours calc |
| Courses | `courses.service.spec.ts` | 43 | Course/Lesson/StudentCourse CRUD, progress tracking, stats |
| Email | `email.service.spec.ts` | 11 | All 10 email templates + cron reminder logic |
| Scheduling | `scheduling.service.spec.ts` | 51 | Appointment CRUD with calendar/email integration, availability, attendance, class reports, stats |
| Payments | `payments.service.spec.ts` | 37 | Package CRUD with Stripe sync, transactions, checkout sessions, webhooks, manual payment, balance calc, stats |

**Mocking Strategy:**
- MikroORM: `Test.createTestingModule` with `getRepositoryToken()` mocks
- Stripe: `jest.mock('stripe')` with full API surface mock
- Nodemailer: `jest.mock('nodemailer')` with mock transport
- Google Calendar: Mock `GoogleCalendarService` methods
- bcrypt/uuid: Module-level mocks with deterministic returns

---

## 13. What's Still Missing / Known Gaps

### Not Yet Implemented

| Gap | Severity | Notes |
|-----|----------|-------|
| **E2E tests** | Medium | Gameplan 6.8 lists auth, payments, scheduling, courses, admin E2E specs — not yet written |
| **Tutor dashboard live data** | Medium | `/dashboard/tutor-dashboard` uses mock data, not wired to API |
| **Email template CRUD backend** | Low | `/dashboard/email-templates` page exists but no backend CRUD for templates — they're inline Handlebars in code. Page falls back to mock data. |
| **Profile picture upload** | Low | Entity field exists (`profilePicture`), no upload endpoint (Multer/S3) implemented |
| **Per-tutor Google Calendar OAuth** | Low | Uses service account for one shared calendar. Per-tutor OAuth flow is not built. |
| **Database migrations** | Low | Migration tooling is configured (`npm run migration:*`) but no migration files have been generated. Uses `autoLoadEntities` which auto-syncs schema. |
| **Actual deployment** | Medium | Docker + CI/CD config exists but the app has not been deployed to Railway/Render yet |
| **Error tracking** | Low | No Sentry or equivalent configured |
| **JWT in HttpOnly cookies** | Low | JWT is stored in localStorage (XSS risk). Documented as accepted tradeoff. |

### Known Technical Debt

| Item | Notes |
|------|-------|
| `strictNullChecks: false` | Backend tsconfig has strict checks disabled |
| Frontend fallback data | Tutors page and packages page use hardcoded fallback arrays when API fails |
| Console.log removal | Phase 1 addressed most, but some may remain in frontend components |
| Student page mock fallback | `/dashboard/students` has 5 mock students as fallback |
| `CRYPTO` enum value | Kept in `PaymentMethod` for historical records, Solana integration was removed |
| `skipMissingProperties: true` | ValidationPipe skips missing props, which can mask incomplete requests |

### Production Readiness Checklist

- [x] Multi-stage Docker builds
- [x] Docker Compose for local full-stack dev
- [x] GitHub Actions CI (lint + test + build)
- [x] Health check endpoint (`/api/health`)
- [x] Rate limiting (100 req/min via @nestjs/throttler)
- [x] Production CORS (restricts to `FRONTEND_URL`)
- [x] Global exception filter (structured errors)
- [x] Input validation (class-validator DTOs)
- [x] 198 passing unit tests
- [x] Error boundaries (global + dashboard)
- [ ] E2E tests
- [ ] Database migrations generated
- [ ] Deployed to hosting platform
- [ ] Error tracking (Sentry)
- [ ] Secure token storage (HttpOnly cookies)
- [ ] Automated database backups
- [ ] Custom domain configured

---

*This document reflects the codebase as of commit `6eaee1802` on `main`, February 20, 2026.*
