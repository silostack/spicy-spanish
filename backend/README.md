# Spicy Spanish - Backend API

This is the backend API for the Spicy Spanish language school platform. It's built with Nest.js and uses PostgreSQL with Mikro-ORM for database access.

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm
- PostgreSQL database

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values with your specific configuration

3. Set up the database:

```bash
# Create database tables
npx mikro-orm schema:create

# Run migrations if needed
npm run migration:up
```

### Development

Run the development server:

```bash
npm run start:dev
```

The API will be available at http://localhost:3001

### Building for Production

```bash
npm run build
npm run start:prod
```

## Project Structure

- `/src` - Source code
  - `/auth` - Authentication modules
  - `/users` - User management
  - `/scheduling` - Calendar and scheduling functionality
  - `/payments` - Payment processing and transaction records
  - `/courses` - Course and curriculum management
  - `/email` - Email service and templates
  - `/common` - Shared utilities, decorators, guards, etc.
  - `/migrations` - Database migrations

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register/student` - Student registration
- `POST /api/auth/register/tutor` - Tutor registration with invitation token
- `POST /api/auth/invite/tutor` - Create tutor invitation (admin only)
- `GET /api/auth/profile` - Get current user profile

### Users

- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/tutors` - List all tutors for public display

### Scheduling

- `GET /api/scheduling/availability` - Get tutor availability
- `POST /api/scheduling/availability` - Create availability slot (tutor only)
- `DELETE /api/scheduling/availability/:id` - Delete availability slot
- `GET /api/scheduling/appointments` - List appointments
- `POST /api/scheduling/appointments` - Create appointment
- `PATCH /api/scheduling/appointments/:id` - Update appointment status
- `DELETE /api/scheduling/appointments/:id` - Cancel appointment

### Payments

- `GET /api/payments/packages` - List available packages
- `POST /api/payments/packages` - Create package (admin only)
- `PATCH /api/payments/packages/:id` - Update package (admin only)
- `GET /api/payments/transactions` - List transactions
- `POST /api/payments/transactions` - Create transaction
- `POST /api/payments/checkout/stripe` - Process Stripe payment
- `POST /api/payments/checkout/crypto` - Process crypto payment
- `POST /api/payments/webhook/stripe` - Stripe webhook endpoint

### Courses

- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (admin only)
- `GET /api/courses/:id` - Get course details
- `PATCH /api/courses/:id` - Update course (admin only)
- `DELETE /api/courses/:id` - Delete course (admin only)
- `GET /api/courses/student/:studentId` - Get courses assigned to a student
- `POST /api/courses/assign` - Assign course to student with tutor (admin only)

## Technologies

- Nest.js framework
- TypeScript
- PostgreSQL database
- Mikro-ORM for database access
- JWT for authentication
- Stripe API for payment processing
- Solana Web3.js for crypto payments
- Nodemailer for sending emails
- Handlebars for email templates
- Class-validator for DTO validation