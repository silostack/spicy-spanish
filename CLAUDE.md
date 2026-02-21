# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spicy Spanish is a full-stack language school platform built as a monorepo with:
- **Frontend**: Next.js 13+ with TypeScript, Tailwind CSS, running on port 8008
- **Backend**: NestJS with TypeScript, PostgreSQL, MikroORM, running on port 3001

## Common Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm run dev           # Start development server (port 8008)
npm run build         # Build for production
npm run lint          # Run ESLint
```

### Backend (NestJS)
```bash
cd backend
npm run start:dev     # Start development server with hot reload
npm run build         # Build the application
npm run lint          # Run ESLint with auto-fix
npm run test          # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:e2e      # Run end-to-end tests
npm run seed          # Seed the database
npm run migration:create  # Create a new migration from schema changes
npm run migration:up      # Run pending migrations
npm run migration:down    # Revert last migration
npm run migration:pending # List pending migrations
```

## Architecture Overview

### Database & ORM
- Uses MikroORM with PostgreSQL
- Configuration in `backend/src/mikro-orm.config.ts`
- Entities follow the pattern `*.entity.ts`
- Database seeding via `npm run seed`
- Migrations in `backend/src/migrations/` — run `npm run migration:create` after entity changes

### Authentication & Authorization
- JWT-based authentication with Passport strategies
- Role-based access control (Admin, Tutor, Student)
- Guards: `jwt-auth.guard.ts`, `roles.guard.ts`
- Decorators: `@Roles()` for authorization

### Module Structure
The backend follows NestJS module architecture:
- `auth/` - Authentication and user registration
- `users/` - User management
- `courses/` - Course and lesson management
- `scheduling/` - Appointments and availability
- `payments/` - Stripe payment processing
- `email/` - Email notifications with Handlebars templates
- `admin/` - Administrative functions

### Frontend Context Architecture
- Uses React Context for state management
- Main contexts: `AuthContext`, `CoursesContext`, `PaymentsContext`, `SchedulingContext`
- All contexts exported through `contexts/index.tsx`

### Key Integrations
- **Payments**: Stripe for credit cards
- **Calendar**: Google Calendar integration for scheduling
- **Email**: Nodemailer with Handlebars templates
- **Styling**: Tailwind CSS with custom components in `components/ui/`

## Database Setup
Run the database setup script:
```bash
cd backend
./setup-db.sh
```

## Important Notes
- Frontend runs on port 8008 (not default 3000)
- Backend expects PostgreSQL with environment variables for MikroORM
- No existing CLAUDE.md file was found, so this is the initial version
- No Cursor or Copilot rules were found in the codebase