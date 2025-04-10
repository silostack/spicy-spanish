# Spicy Spanish Language School Platform

A unified web application for Spicy Spanish language school, featuring a public-facing website and an administrative dashboard for managing students, tutors, scheduling, payments, and course content.

## Project Structure

This is a monorepo containing both frontend and backend code:

- `/frontend` - Next.js application
- `/backend` - Nest.js REST API

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend:

```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install
```

3. Configure environment variables:
   - Copy `.env.local.example` to `.env.local` in the frontend directory
   - Copy `.env.example` to `.env` in the backend directory
   - Update the values in both files with your specific configuration

### Running the Applications

#### Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:3000

#### Backend

```bash
cd backend
npm run start:dev
```

The backend API will be available at http://localhost:3001

## Features

- **User Authentication**
  - Role-based access control (Admin, Tutor, Student)
  - Student self-registration
  - Tutor invitation system

- **Scheduling System**
  - Dynamic calendar with timezone support
  - Tutor availability management
  - Google Calendar integration

- **Payment Processing**
  - Stripe integration for credit card payments
  - Solana blockchain integration for crypto payments
  - Transaction records and invoicing

- **Course Management**
  - Course assignments and tracking
  - Curriculum building tools
  - Student progress tracking

- **Email Notifications**
  - Automated email system for various events
  - Customizable email templates

## Technologies Used

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React Calendar
- Stripe.js
- Solana Web3.js

### Backend

- Nest.js
- TypeScript
- PostgreSQL
- Mikro-ORM
- JWT Authentication
- Stripe API
- Solana Web3.js
- Nodemailer
- Handlebars

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.