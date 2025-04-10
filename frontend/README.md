# Spicy Spanish - Frontend

This is the frontend application for the Spicy Spanish language school platform. It's built with Next.js and styled with Tailwind CSS.

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Update the values with your specific configuration

### Development

Run the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

- `/src/app` - Main application code
  - `/components` - Reusable React components
  - `/contexts` - React context providers
  - `/hooks` - Custom React hooks
  - `/styles` - Global styles
  - `/utils` - Utility functions
  - `/dashboard` - Dashboard pages for authenticated users
  - Page components for public routes

## Features

### Public Pages

- Home page with information about the language school
- About page with details about the teaching approach
- Tutors listing page
- Contact page
- Login and registration forms

### Student Dashboard

- Overview of scheduled classes and course progress
- Calendar for scheduling classes with tutors
- Course materials and progress tracking
- Payment system for purchasing class packages
- Profile management

### Tutor Dashboard

- Availability management
- Calendar of scheduled classes
- Student information
- Course materials access

### Admin Dashboard (Carla)

- Student management
- Tutor management and invitation system
- Course creation and assignment
- Transaction management
- Email template customization
- Analytics dashboard

## Technologies

- Next.js
- TypeScript
- Tailwind CSS
- React Context for state management
- Axios for API requests
- Date-fns for date manipulation
- Formik and Yup for form handling and validation
- Stripe.js for payment processing
- Solana Web3.js for crypto payments

## Theming

The application uses a warm, fun design with a focus on reds and oranges to match the "Spicy Spanish" brand. The color palette is defined in the Tailwind configuration:

- Primary color: spicy-red (#FF5C5C)
- Secondary color: spicy-orange (#FF9F5C)
- Light background: spicy-light (#FFF0E8)
- Dark text: spicy-dark (#482C2D)