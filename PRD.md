# Spicy Spanish Language School Platform
## Product Requirements Document (PRD)

### Document Information

---

## 1. Executive Summary

### 1.1 Product Overview
Spicy Spanish is a unified web platform for managing a Spanish language school. It combines a public-facing website with a comprehensive administrative dashboard, centralizing scheduling, payments, course management, and communications into a single system.

### 1.2 Business Objectives
- **Centralization**: Consolidate scheduling, payments, and course management into one integrated platform
- **Automation**: Reduce manual administrative work through automated notifications and workflows
- **Scalability**: Support growth in student and tutor base while maintaining ease of use
- **User Experience**: Provide an intuitive, warm, and engaging interface for all user types

### 1.3 Success Metrics
- Reduction in administrative overhead for school owner
- Increased student enrollment and retention
- Improved scheduling efficiency and reduced no-shows
- Positive user feedback on platform usability

---

## 2. User Roles & Permissions

### 2.1 Administrator (Carla)
**Description**: School owner with full system access and control

**Core Capabilities**:
- Complete CRUD operations on all users (students and tutors)
- Full access to financial data and transaction management
- Course creation, modification, and assignment
- System configuration and settings management
- Analytics and reporting dashboard access
- Email template customization

**Detailed Permissions**:
- **User Management**:
  - View all user profiles (students and tutors)
  - Create, edit, and delete user accounts
  - Assign students to tutors
  - Send tutor invitation emails
  - Override any user settings

- **Financial Operations**:
  - View all transaction history
  - Manually add, edit, or delete transaction records
  - Create and modify class packages and pricing
  - Manually adjust student purchased hours
  - Generate and send invoices
  - Process refunds or adjustments

- **Scheduling**:
  - View all schedules across tutors and students
  - Create, modify, or cancel any appointment
  - Override tutor availability

- **Course Management**:
  - Create and edit course curricula
  - Assign courses to students
  - Associate courses with specific tutors
  - Track student progress across courses

- **System Administration**:
  - Configure email notification templates
  - Customize notification triggers and timing
  - Access analytics dashboard
  - Manage system-wide settings
  - Configure payment package options

### 2.2 Tutor
**Description**: Language instructor with limited administrative capabilities

**Core Capabilities**:
- Manage personal profile and settings
- Set and update availability schedule
- View assigned students and their schedules
- Access course materials for assigned students

**Detailed Permissions**:
- **Profile Management**:
  - Edit own profile information (bio, photo, qualifications)
  - Update contact information
  - Change password and authentication settings
  - View own profile as students see it

- **Scheduling**:
  - Create recurring or one-off availability slots
  - Mark availability as unavailable (time off)
  - View calendar of scheduled classes with assigned students
  - Sync calendar with external calendar services
  - Cannot modify or cancel student appointments (admin only)

- **Student Information**:
  - View list of assigned students
  - Access assigned students' course assignments
  - View scheduled appointment times with students
  - Cannot view financial information or transaction history

- **Restrictions**:
  - Cannot access other tutors' information
  - Cannot modify student profiles or assignments
  - Cannot access payment or financial data
  - Cannot access system settings or analytics

### 2.3 Student
**Description**: Language learner with self-service capabilities

**Core Capabilities**:
- Self-registration and profile management
- Purchase class packages
- Schedule classes (after tutor assignment)
- View transaction history and download invoices
- Access assigned course materials

**Detailed Permissions**:
- **Registration & Profile**:
  - Self-register for an account
  - Edit own profile information (name, contact, timezone, preferences)
  - Upload profile photo
  - Change password
  - Cannot view or modify other students' information

- **Financial**:
  - Purchase class packages via available payment methods
  - View own transaction history
  - Download invoices for own purchases
  - View remaining purchased hours balance
  - Cannot modify transaction records or pricing

- **Scheduling**:
  - View assigned tutor's availability (only after admin assigns tutor)
  - Book classes within available time slots
  - View own scheduled classes in calendar
  - Receive class reminders
  - Sync personal calendar with class schedule
  - Cannot schedule until tutor is assigned by admin

- **Course Access**:
  - View assigned courses and curriculum
  - Track own progress through courses
  - Cannot modify course content or assignments

- **Restrictions**:
  - Cannot access other students' information or schedules
  - Cannot access tutor information beyond assigned tutor
  - Cannot access admin functions or analytics
  - Cannot modify payment package options or pricing

### 2.4 Permission Summary Matrix

| Capability | Admin | Tutor | Student |
|-----------|-------|-------|---------|
| Edit own profile | ✓ | ✓ | ✓ |
| Edit other profiles | ✓ | ✗ | ✗ |
| View all users | ✓ | ✗ | ✗ |
| Set own availability | ✓ | ✓ | N/A |
| View assigned schedules | ✓ | ✓ | ✓ |
| View all schedules | ✓ | ✗ | ✗ |
| Create/edit courses | ✓ | ✗ | ✗ |
| View assigned courses | ✓ | ✓ | ✓ |
| Process payments | ✓ | ✗ | ✓ (own only) |
| View all transactions | ✓ | ✗ | ✗ |
| View own transactions | ✓ | N/A | ✓ |
| Modify transactions | ✓ | ✗ | ✗ |
| Send invitations | ✓ | ✗ | ✗ |
| System settings | ✓ | ✗ | ✗ |
| Analytics access | ✓ | ✗ | ✗ |

---

## 3. Core Features & Requirements

### 3.1 User Authentication & Registration

#### 3.1.1 Student Registration
**Requirement**: Self-service registration flow

**User Flow**:
1. Student visits public website and clicks "Sign Up" or "Register"
2. Completes registration form with:
   - Full name
   - Email address
   - Password (with strength requirements)
   - Phone number (optional)
   - Timezone (auto-detected, manually adjustable)
   - Preferred learning goals (optional)
3. Receives email verification link
4. Confirms email to activate account
5. Redirected to student dashboard

**System Behavior**:
- Validate email uniqueness
- Enforce strong password requirements (minimum length, complexity)
- Auto-detect timezone from browser settings
- Send automated notification to administrator upon new registration
- Create student user account with appropriate role assignment

**Validation Rules**:
- Email must be valid format and unique in system
- Password minimum 8 characters with at least one number and special character
- Phone number format validation if provided

#### 3.1.2 Tutor Registration
**Requirement**: Invitation-only registration flow

**Admin Workflow**:
1. Admin creates tutor invitation in system
2. Enters tutor's email address and optional personal message
3. System generates unique invitation token with expiration
4. Automated invitation email sent to tutor

**Tutor Workflow**:
1. Tutor receives invitation email with registration link
2. Clicks link (contains secure token)
3. Completes tutor profile form:
   - Full name
   - Password creation
   - Bio/description
   - Qualifications/certifications
   - Profile photo upload
   - Timezone
   - Contact information
4. Submits profile and account is activated

**System Behavior**:
- Generate secure, time-limited invitation tokens (e.g., 7-day expiration)
- Validate token before allowing registration
- Send confirmation to admin when tutor completes registration
- Automatically assign tutor role and permissions

**Security Requirements**:
- Invitation links expire after set period
- One-time use tokens (cannot be reused)
- Secure token generation (cryptographically random)

#### 3.1.3 Authentication
**Requirements**:
- Secure login for all user types
- Session management
- Password recovery flow
- Optional "remember me" functionality

**Login Flow**:
1. User enters email and password
2. System validates credentials
3. On success, creates authenticated session
4. Redirects to appropriate dashboard based on role

**Password Recovery**:
1. User clicks "Forgot Password"
2. Enters email address
3. Receives password reset link (time-limited token)
4. Clicks link and enters new password
5. Password updated and user can log in

**Security Requirements**:
- Passwords must be hashed (not stored in plain text)
- Implement rate limiting on login attempts
- Lock account after multiple failed login attempts
- Password reset tokens expire after reasonable period (e.g., 1 hour)
- HTTPS required for all authentication endpoints

### 3.2 Scheduling & Calendar System

#### 3.2.1 Tutor Availability Management
**Requirement**: Tutors can define when they are available for classes

**Features**:
- **Recurring Availability**: Set regular weekly schedule (e.g., "Every Monday 9 AM - 5 PM")
- **One-off Availability**: Add specific available time slots
- **Blackout Periods**: Mark periods as unavailable (vacation, time off)
- **Availability Templates**: Save and reuse common availability patterns

**User Interface Requirements**:
- Visual calendar interface for setting availability
- Drag-to-create time blocks
- Color coding for different availability states
- Timezone display (show tutor's local time)

**Constraints**:
- Minimum slot duration configurable (e.g., 30 minutes, 1 hour)
- Cannot set availability in the past
- Must respect time boundaries (cannot create overlapping slots)

#### 3.2.2 Student Scheduling
**Requirement**: Students can book classes with their assigned tutor

**Prerequisites**:
- Admin must assign student to a tutor before scheduling is enabled
- Student must have purchased hours available

**Booking Flow**:
1. Student navigates to scheduling/calendar page
2. Views assigned tutor's available time slots
3. Selects desired time slot(s)
4. Confirms booking
5. Appointment created and both parties notified

**Features**:
- View tutor availability in student's local timezone
- Book single or multiple sessions
- Visual calendar showing:
  - Booked classes
  - Available slots
  - Past classes
- Cancellation policy and options (configurable)

**Business Rules**:
- Students can only book if they have available purchased hours
- Each booking decrements available hours
- Scheduling only available after tutor assignment by admin
- Minimum notice period for bookings (e.g., 24 hours in advance)

#### 3.2.3 Calendar Views & Timezone Handling
**Critical Requirement**: All times must be displayed in user's local timezone

**Timezone Features**:
- Auto-detect timezone from browser on registration
- Manual timezone selection in user profile
- Display all times in user's selected timezone
- Handle Daylight Saving Time transitions automatically
- Show timezone indicator in all time displays (e.g., "3:00 PM EST")

**Calendar Views**:
- **Week View**: Default view showing 7-day schedule
- **Month View**: Overview of the month with class indicators
- **Day View**: Detailed view of a single day
- **List View**: Chronological list of upcoming classes

**Calendar Functionality**:
- Navigate between dates (today, prev/next week, specific date)
- Filter by student/tutor (admin view)
- Color-coded events by status (scheduled, completed, cancelled)
- Click event to view details

**Key Timezone Scenarios to Handle**:
- Tutor in Colombia (UTC-5), Student in US Eastern (UTC-5/UTC-4 with DST)
- Display conflicts when DST transitions occur
- Maintain appointment integrity across timezone changes
- Clearly communicate timezone in all confirmations and reminders

#### 3.2.4 External Calendar Integration
**Requirement**: Sync with external calendar services (Google Calendar preferred)

**Features**:
- Export scheduled classes to Google Calendar
- Two-way sync option (view external calendar availability)
- Calendar subscription link (iCal format)
- Sync individual appointments or entire schedule

**Integration Points**:
- OAuth authentication for calendar access
- Create calendar events automatically upon booking
- Update events when appointments change
- Delete events when appointments cancelled

**User Controls**:
- Enable/disable calendar sync in profile settings
- Choose which calendar to sync to (if multiple)
- Privacy options (what details to include in calendar events)

### 3.3 Payment Processing & Transaction Management

#### 3.3.1 Payment Methods
**Primary Method**: Credit card processing via Stripe

**Additional Methods** (manual entry by admin):
- PayPal
- Zelle
- Bank transfer
- Cash

**Stripe Integration Requirements**:
- Custom checkout page (not Stripe-hosted)
- PCI compliance for card data handling
- Support for saved payment methods
- Secure payment processing flow

#### 3.3.2 Class Packages
**Requirement**: Admin can create and manage class package offerings

**Package Definition**:
- Package name (e.g., "10 Hour Package", "Beginner Bundle")
- Number of hours included
- Price
- Description (optional)
- Active/inactive status

**Package Management**:
- Admin can create new packages
- Edit existing packages (price changes, hours, descriptions)
- Deactivate packages (hide from purchase but keep historical records)
- Set default or featured packages

**Display Requirements**:
- Show available packages on checkout/pricing page
- Clear presentation of price per hour
- Highlight best value or recommended packages

#### 3.3.3 Purchase Flow
**Student Purchase Process**:

1. **Package Selection**:
   - Student views available class packages
   - Selects desired package
   - Proceeds to checkout

2. **Checkout**:
   - Review package details and price
   - Enter payment method (credit card via Stripe)
   - Apply any discount codes (if applicable)
   - Review terms and conditions
   - Submit payment

3. **Payment Processing**:
   - Validate payment information
   - Process payment via Stripe
   - On success:
     - Create transaction record
     - Add purchased hours to student account
     - Generate invoice
     - Send confirmation email to student
     - Send notification to admin

4. **Confirmation**:
   - Display purchase confirmation
   - Show updated hours balance
   - Provide invoice download link
   - Option to schedule classes (if tutor assigned)

**Error Handling**:
- Clear error messages for payment failures
- Option to retry payment
- Support contact information if issues persist

#### 3.3.4 Manual Payment Entry
**Requirement**: Admin can manually record payments made outside the system

**Use Cases**:
- Student pays via PayPal, Zelle, or cash
- Refunds or adjustments
- Promotional credits or discounts

**Admin Workflow**:
1. Access transaction management interface
2. Select student
3. Enter transaction details:
   - Amount
   - Payment method
   - Number of hours to add
   - Date of payment
   - Notes/reference number
   - Whether to send notification to student
4. Save transaction

**System Behavior**:
- Create transaction record with manual entry flag
- Update student's available hours
- Optionally send confirmation email to student
- Admin receives no notification (they're creating it)

**Transaction Record Fields**:
- Transaction ID (auto-generated)
- Student ID
- Amount
- Payment method
- Hours purchased
- Transaction date
- Created by (admin user)
- Notes
- Status (completed, pending, refunded)

#### 3.3.5 Transaction History & Invoicing
**Student Transaction View**:
- Chronological list of all purchases
- Each transaction shows:
  - Date
  - Package/hours purchased
  - Amount paid
  - Payment method
  - Invoice download button
  - Status

**Admin Transaction View**:
- All transactions across all students
- Filtering by:
  - Student
  - Date range
  - Payment method
  - Status
- Export to CSV functionality
- Total revenue analytics

**Invoice Requirements**:
- Auto-generated upon successful payment
- Downloadable as PDF
- Contains:
  - Invoice number (unique)
  - Transaction date
  - Student name and email
  - Itemized charges (package name, hours, price)
  - Payment method
  - Total amount
  - School contact information
  - School logo

**Invoice Delivery**:
- Automatically attached to purchase confirmation email
- Available for download from transaction history
- Admin can manually regenerate or resend invoices

#### 3.3.6 Hours Balance Tracking
**Requirement**: System tracks purchased vs. used hours for each student

**Balance Calculation**:
- Starting balance: 0 hours
- Increases when:
  - Student purchases class package
  - Admin manually adds hours
- Decreases when:
  - Class appointment is completed
  - Admin manually deducts hours (adjustments)

**Display Requirements**:
- Prominent display of current balance in student dashboard
- Balance shown during scheduling (cannot book without available hours)
- Warning when balance is low (e.g., < 2 hours)
- Transaction log showing all balance changes

**Business Rules**:
- Cannot schedule classes if balance is zero
- Hours expire after set period (configurable, e.g., 1 year)
- Expiring hours notification sent to student
- Admin can override expiration or extend hours

### 3.4 Course & Curriculum Management

#### 3.4.1 Course Creation
**Requirement**: Admin can create structured course curricula

**Course Structure**:
- **Course** (top level):
  - Course title
  - Description
  - Difficulty level (Beginner, Intermediate, Advanced)
  - Estimated hours to complete
  - Active/inactive status

- **Lessons** (within course):
  - Lesson title
  - Lesson number/order
  - Description/objectives
  - Materials or resources (text, links, files)
  - Estimated duration
  - Completion criteria

**Course Builder Interface Requirements**:
- Drag-and-drop lesson ordering
- Rich text editor for descriptions and content
- File upload for course materials
- Preview course as student would see it

#### 3.4.2 Course Assignment
**Requirement**: Admin assigns courses to students

**Assignment Workflow**:
1. Admin selects student
2. Selects course from available courses
3. Optionally assigns specific tutor for the course
4. Sets start date (optional)
5. Confirms assignment

**System Behavior**:
- Course appears in student's dashboard
- Student can view curriculum and lessons
- Track progress through lessons
- Tutor can view which courses are assigned to their students

**Assignment Rules**:
- Student can have multiple courses assigned
- Course can be assigned to multiple students
- Same course can be reassigned if student wants to retake

#### 3.4.3 Progress Tracking
**Requirement**: Track student progress through assigned courses

**Progress Indicators**:
- Lessons completed vs. total lessons
- Percentage completion
- Current lesson
- Estimated completion date based on pace

**Student View**:
- Visual progress bar
- List of lessons with completion status
- Mark lessons as complete
- Notes or feedback on lessons

**Admin/Tutor View**:
- See all students' course progress
- Identify struggling students (behind pace)
- Course completion rates
- Time spent on each lesson

#### 3.4.4 Curriculum Flexibility
**Design Consideration**: System should support future expansion

**Current Requirements**:
- Simple course structure (courses → lessons)
- Text-based content and resource links
- Manual progress tracking

**Future-Proofing**:
- Architecture should allow for:
  - Quizzes or assessments
  - Video/audio content
  - Interactive exercises
  - Automatic progress tracking
  - Prerequisite courses
  - Certificates upon completion

### 3.5 Email Notification System

#### 3.5.1 Automated Email Triggers
**Requirement**: System sends automated emails for key events

**Email Types**:

1. **New Student Registration**
   - **Recipient**: Admin
   - **Trigger**: Student completes registration
   - **Content**:
     - Student name and email
     - Registration date
     - Link to student profile in admin dashboard
     - Quick action to assign tutor

2. **Tutor Invitation**
   - **Recipient**: Invited tutor
   - **Trigger**: Admin sends tutor invitation
   - **Content**:
     - Welcome message
     - Invitation link with secure token
     - Instructions for completing registration
     - Link expiration notice
     - Contact information for questions

3. **Payment Notification**
   - **Recipient**: Admin
   - **Trigger**: Student completes payment (Stripe or manual entry with notification enabled)
   - **Content**:
     - Student name
     - Amount paid
     - Payment method
     - Hours purchased
     - Link to transaction details

4. **Purchase Confirmation**
   - **Recipient**: Student
   - **Trigger**: Successful payment
   - **Content**:
     - Thank you message
     - Purchase details (package, hours, amount)
     - Updated hours balance
     - Invoice attachment (PDF)
     - Link to schedule classes

5. **Class Reminder**
   - **Recipient**: Student
   - **Trigger**: Configurable time before class (default: 1 hour)
   - **Content**:
     - Class date and time (in student's timezone)
     - Tutor name
     - Duration
     - Calendar join/link (if virtual)
     - Cancellation policy reminder

6. **Tutor Assignment**
   - **Recipient**: Student
   - **Trigger**: Admin assigns student to tutor
   - **Content**:
     - Tutor introduction (name, bio, photo)
     - Next steps for scheduling
     - Link to view tutor profile
     - Link to schedule first class

7. **Class Cancellation** (if implemented)
   - **Recipient**: Student and Tutor
   - **Trigger**: Class is cancelled
   - **Content**:
     - Cancelled class details
     - Reason (if provided)
     - Hours refunded/not deducted
     - Link to reschedule

#### 3.5.2 Email Template System
**Requirement**: Admin can customize email templates

**Template Management Interface**:
- List of all email types
- Edit template content
- Preview template with sample data
- Reset to default template
- Enable/disable specific email types

**Template Capabilities**:
- **Dynamic Fields**: Insert variables like:
  - `{{studentName}}`
  - `{{tutorName}}`
  - `{{amount}}`
  - `{{classDateTime}}`
  - `{{hoursBalance}}`
- **Rich Text Editing**: Format emails with:
  - Headings
  - Bold/italic text
  - Links
  - Bullet lists
- **Subject Line**: Customize email subject
- **From Name**: Configure sender name (e.g., "Spicy Spanish Team")

**Language**:
- All templates in English only
- No multi-language support required initially

**Default Templates**:
- System should include sensible default templates for all email types
- Professional yet warm and friendly tone
- Mobile-responsive HTML email formatting

#### 3.5.3 Email Delivery Configuration
**System Requirements**:
- SMTP configuration for sending emails
- From email address configuration
- Support for HTML and plain text fallback
- Delivery failure handling and logging
- Bounce and complaint tracking (basic)

**Admin Settings**:
- Configure class reminder timing (30 min, 1 hour, 2 hours, etc.)
- Enable/disable specific notification types
- Set daily email limits (prevent spam)
- Test email functionality (send test email)

---

## 4. User Interface & Experience Requirements

### 4.1 Design Aesthetic & Brand Guidelines

#### 4.1.1 Overall Look & Feel
**Design Philosophy**: Warm, fun, engaging, and energetic

**Tone**: The interface should feel:
- Welcoming and approachable
- Energetic without being overwhelming
- Professional yet playful
- Confident and vibrant

**Target Emotion**: Users should feel excited and motivated to learn Spanish, with an interface that reflects the energy and passion of the language.

#### 4.1.2 Color Palette
**Primary Colors**:
- **Spicy Red**: Deep, warm reds as primary action color
  - Use for: Primary buttons, important CTAs, selected states
  - Examples: Buttons like "Book Class", "Purchase", "Sign Up"

- **Vibrant Orange**: Energetic oranges as secondary/accent color
  - Use for: Highlights, hover states, secondary actions
  - Examples: Links, icons, badges, notifications

**Supporting Colors**:
- **Neutral Base**: Warm grays and off-whites for backgrounds
  - Light warm gray for page backgrounds
  - Off-white or cream for content containers
  - Dark charcoal for primary text

- **Accent Tones**:
  - Warm yellows for highlights or success states
  - Coral or salmon tones for softer accents

**Color Usage Guidelines**:
- Maintain strong contrast ratios for accessibility (WCAG AA minimum)
- Use color sparingly and purposefully - avoid overwhelming the user
- Red/orange should pop against neutral backgrounds
- Ensure text readability on all background colors

#### 4.1.3 Typography
**Font Selection Criteria**:
- Modern, clean, and friendly
- Excellent legibility at all sizes
- Professional but not corporate
- Good support for web and mobile

**Recommended Characteristics**:
- **Headings**: Bold, confident, slightly rounded
- **Body Text**: Clean, highly legible, comfortable for reading
- **UI Elements**: Clear, modern, space-efficient

**Type Scale**:
- Clear hierarchy from large headings to small labels
- Consistent sizing and spacing
- Line heights optimized for readability

#### 4.1.4 Visual Elements
**Imagery Style**:
- Warm, bright photography (when used)
- Images that convey joy, learning, connection
- Diverse representation of students and instructors
- High quality, well-lit photos

**Iconography**:
- Simple, clean, consistent style
- Filled or outlined style (consistent throughout)
- Use sparingly to support understanding
- Primary color treatment for active/selected states

**Graphics & Illustrations**:
- Playful but not childish
- Can incorporate chili pepper motifs subtly
- Smooth, organic shapes
- Minimal, purposeful use

**Logo Treatment**:
- Prominent but not overwhelming
- Update/refresh logo to align with warm color scheme
- Consistent placement across all pages

### 4.2 Layout & Structure

#### 4.2.1 Responsive Design
**Requirements**: Mobile-first, responsive design approach

**Breakpoints** (suggested):
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- Large Desktop: > 1440px

**Mobile Considerations**:
- Touch-friendly tap targets (minimum 44x44px)
- Simplified navigation (hamburger menu)
- Single-column layouts
- Condensed information density
- Easily accessible primary actions

**Tablet Considerations**:
- Two-column layouts where appropriate
- Expandable/collapsible navigation
- Optimized for both portrait and landscape

**Desktop Considerations**:
- Full navigation visible
- Multi-column layouts
- Sidebar navigation or content
- Hover states and interactions

#### 4.2.2 Navigation
**Primary Navigation Structure**:

**Public Website** (non-authenticated):
- Home
- About
- Our Tutors (Team)
- Pricing
- Contact
- Login
- Sign Up

**Student Dashboard**:
- Dashboard (home/overview)
- Schedule / Calendar
- My Classes
- My Courses
- Purchase Hours
- Transaction History
- Profile / Settings
- Logout

**Tutor Dashboard**:
- Dashboard (home/overview)
- My Schedule
- Availability
- My Students
- Courses (assigned to students)
- Profile / Settings
- Logout

**Admin Dashboard**:
- Dashboard (overview/analytics)
- Students
- Tutors
- Scheduling
- Courses
- Transactions
- Settings
  - Email Templates
  - Packages
  - System Settings
- Logout

**Navigation UX Requirements**:
- Current page clearly indicated
- Breadcrumbs for deep navigation
- Persistent primary navigation
- Quick access to frequently used features
- Search functionality (admin dashboard)

#### 4.2.3 Page Layouts
**Card-Based Design**:
- Use cards for grouped content (course cards, tutor profiles, transaction records)
- Consistent card styling with subtle shadows or borders
- Clear card hierarchy and spacing
- Hover states for interactive cards

**Grid Layouts**:
- Tutor listing page: Grid of tutor profile cards
- Course library: Grid of course cards
- Transaction history: Table or list view with filters

**Form Layouts**:
- Clear visual grouping of related fields
- Inline validation with helpful error messages
- Progress indicators for multi-step forms
- Clear, prominent submit buttons

**Dashboard Widgets**:
- Key metrics in easy-to-scan cards
- Recent activity feeds
- Quick action buttons
- Responsive widget sizing

### 4.3 Interactive Elements & Animations

#### 4.3.1 Transitions & Micro-interactions
**Purpose**: Enhance user experience without slowing down interactions

**Appropriate Use Cases**:
- Page transitions (subtle fade-ins)
- Button hover and click states
- Form field focus states
- Dropdown and modal opening/closing
- Success confirmations (checkmarks, success messages)
- Loading states

**Guidelines**:
- Keep animations fast (< 300ms typically)
- Use easing functions for natural motion
- Ensure animations don't block user interaction
- Provide instant feedback for user actions
- Reduce or eliminate animations on slower devices

#### 4.3.2 Loading States
**Requirements**:
- Clear loading indicators for asynchronous operations
- Skeleton screens for content-heavy pages
- Progress bars for multi-step processes
- Spinner or loading animation for quick operations
- Disable buttons during submission to prevent double-clicks

#### 4.3.3 Calendar Interactions
**Requirements**: Intuitive, visual scheduling interface

**Tutor Availability Setting**:
- Drag to create availability blocks
- Click to edit existing blocks
- Color-coded states (available, booked, unavailable)
- Easy switching between days/weeks

**Student Booking**:
- Visual grid of available times
- Clearly indicate tutor's timezone and student's timezone
- Click to select available slot
- Confirm booking with modal/dialog
- Immediate visual feedback when slot is booked

**Admin Calendar**:
- Overview of all tutors/students
- Filter and search capabilities
- Drill down into specific appointments
- Quick edit/cancel options

### 4.4 Accessibility Requirements

**WCAG 2.1 Level AA Compliance**:
- Sufficient color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation support (all interactive elements accessible via keyboard)
- ARIA labels for screen readers
- Focus indicators clearly visible
- Form inputs with proper labels and error messaging

**Additional Considerations**:
- Alt text for all images
- Semantic HTML structure
- Skip navigation links
- Resizable text without breaking layout
- No time limits on interactions (or easy to extend)

### 4.5 Page-Specific Requirements

#### 4.5.1 Public Home Page
**Purpose**: Convert visitors into students

**Key Sections**:
1. **Hero Section**:
   - Compelling headline
   - Brief value proposition
   - Primary CTA (Sign Up or Learn More)
   - Eye-catching visual or background

2. **Benefits/Features**:
   - Why choose Spicy Spanish
   - Key differentiators
   - Visual icons or illustrations

3. **Tutor Highlights**:
   - Feature 2-3 tutors with photos and brief bios
   - Link to full team page

4. **Pricing Overview**:
   - Brief summary of packages
   - Link to detailed pricing/packages page

5. **Testimonials** (if available):
   - Student success stories
   - Quotes and photos

6. **Call to Action**:
   - Sign up CTA
   - Contact information

#### 4.5.2 Team/Tutors Page
**Purpose**: Showcase tutors

**Layout**:
- Grid layout of tutor profile cards
- Carla's profile prominently at the top (founder/owner)
- Simple, clean presentation

**Tutor Card Contents**:
- Profile photo
- Name
- Brief bio or tagline
- Qualifications (optional)
- No booking functionality (that happens after login/assignment)

#### 4.5.3 Student Dashboard
**Purpose**: Student home base

**Key Widgets**:
- Hours balance (prominent display)
- Upcoming classes (next 3-5)
- Assigned tutor info (if assigned)
- Quick actions:
  - Schedule a class
  - Purchase hours
  - View courses
- Recent activity or progress summary

#### 4.5.4 Admin Dashboard
**Purpose**: At-a-glance system overview and quick access to admin tasks

**Key Metrics**:
- Total active students
- Total active tutors
- Upcoming classes today/this week
- Recent transactions
- Revenue summary (week/month)
- Pending items (new registrations, low balance students)

**Quick Actions**:
- Add new student
- Invite tutor
- Record manual payment
- Assign student to tutor
- View today's schedule

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Page load times < 2 seconds on standard broadband
- API response times < 500ms for typical requests
- Support for concurrent users (minimum 100 simultaneous)
- Optimize images and assets for fast loading
- Implement caching strategies where appropriate

### 5.2 Security
- All data transmission over HTTPS
- Secure password storage (hashed and salted)
- Protection against common vulnerabilities:
  - SQL injection
  - Cross-site scripting (XSS)
  - Cross-site request forgery (CSRF)
  - Session hijacking
- Regular security updates for dependencies
- PCI compliance for payment processing
- Role-based access control strictly enforced on backend
- Secure API authentication (token-based recommended)

### 5.3 Data Privacy
- Compliance with relevant data protection regulations (GDPR if applicable)
- Clear privacy policy
- User data accessible only to authorized roles
- Secure payment information handling (delegate to Stripe, do not store card details)
- Regular data backups
- Data retention policies

### 5.4 Reliability & Availability
- Target uptime: 99.5%
- Graceful error handling and user-friendly error messages
- Database backups (daily minimum)
- Disaster recovery plan
- Monitoring and alerting for system issues

### 5.5 Scalability
- Architecture should support growth to:
  - 500+ students
  - 20+ tutors
  - Thousands of monthly transactions
- Database design optimized for queries and indexing
- Ability to handle traffic spikes (e.g., during promotions)

### 5.6 Maintainability
- Clean, modular code architecture
- Code documentation for key interfaces and complex logic
- Consistent coding standards and style guides
- Version control with meaningful commit messages
- Automated testing for critical features
- Easy configuration management (environment variables)

### 5.7 Browser & Device Support
**Browsers** (latest 2 versions):
- Chrome
- Firefox
- Safari
- Edge

**Mobile Browsers**:
- Safari (iOS)
- Chrome (Android)

**Devices**:
- Desktop/laptop computers
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)

---

## 6. Third-Party Integrations

### 6.1 Stripe Payment Processing
**Purpose**: Credit card payment processing

**Required Functionality**:
- Customer creation
- Payment processing via Stripe Checkout or Elements
- Webhook handling for payment events
- Invoice generation
- Subscription support (if recurring payments needed)
- Refund processing

**Security**:
- PCI DSS compliance through Stripe
- Tokenization of payment information
- Secure API key management

### 6.2 Google Calendar Integration
**Purpose**: Sync scheduled classes with external calendars

**Required Functionality**:
- OAuth authentication for calendar access
- Create calendar events for scheduled classes
- Update events when appointments change
- Delete events when appointments cancelled
- Read calendar availability (optional advanced feature)

**User Experience**:
- Simple one-click authorization
- Clear indication of sync status
- Option to disconnect calendar

### 6.3 Google Analytics / Google Tag Manager
**Purpose**: Track user behavior and site analytics

**Required Functionality**:
- Page view tracking
- Event tracking for key actions:
  - Sign ups
  - Purchases
  - Class bookings
  - Button clicks on CTAs
- Goal conversion tracking
- User flow analysis

**Privacy**:
- Cookie consent notice
- GDPR compliance if applicable
- Option to opt-out of tracking

### 6.4 Email Service Provider
**Purpose**: Send transactional and notification emails

**Required Functionality**:
- SMTP or API-based email sending
- HTML email support
- Template rendering
- Delivery tracking
- Bounce and complaint handling

**Suggested Providers** (implementation choice):
- SendGrid
- Mailgun
- AWS SES
- Any SMTP-compatible service

---

## 7. Data Model Overview

**Note**: This is a conceptual data model to guide implementation. Actual database schema and relationships should be designed by the implementing engineer based on their chosen stack.

### 7.1 Core Entities

#### User
- User ID (unique)
- Email (unique)
- Password (hashed)
- Role (Admin, Tutor, Student)
- First Name
- Last Name
- Phone Number
- Timezone
- Profile Photo URL
- Created Date
- Last Login
- Active/Inactive Status

#### Student (extends/related to User)
- Student ID
- User ID (reference)
- Assigned Tutor ID (reference, nullable)
- Hours Balance
- Registration Date
- Notes (admin notes)

#### Tutor (extends/related to User)
- Tutor ID
- User ID (reference)
- Bio/Description
- Qualifications
- Hourly Rate (if applicable)
- Active/Inactive Status

#### Course
- Course ID
- Title
- Description
- Difficulty Level
- Estimated Hours
- Created By (admin user)
- Created Date
- Active/Inactive Status

#### Lesson
- Lesson ID
- Course ID (reference)
- Lesson Number/Order
- Title
- Description
- Content/Materials
- Estimated Duration

#### Course Assignment
- Assignment ID
- Student ID (reference)
- Course ID (reference)
- Tutor ID (reference, nullable)
- Assigned Date
- Start Date
- Completion Status
- Progress Percentage

#### Appointment/Scheduled Class
- Appointment ID
- Student ID (reference)
- Tutor ID (reference)
- Start DateTime (UTC)
- End DateTime (UTC)
- Duration (hours)
- Status (Scheduled, Completed, Cancelled)
- Created Date
- Calendar Event ID (Google Calendar, nullable)

#### Tutor Availability
- Availability ID
- Tutor ID (reference)
- Day of Week (for recurring)
- Start Time
- End Time
- Recurrence Type (one-off, weekly, daily)
- Specific Date (for one-off)
- Active/Inactive

#### Transaction
- Transaction ID
- Student ID (reference)
- Amount
- Payment Method (Stripe, PayPal, Zelle, Cash, etc.)
- Hours Purchased
- Transaction Date
- Status (Completed, Pending, Refunded)
- Stripe Transaction ID (if applicable)
- Invoice Number
- Created By (admin user if manual, null if automatic)
- Notes

#### Class Package
- Package ID
- Name
- Description
- Hours Included
- Price
- Active/Inactive Status
- Created Date

#### Email Template
- Template ID
- Template Name/Type (NewStudentRegistration, TutorInvitation, etc.)
- Subject Line
- Email Body (HTML)
- Active/Inactive Status
- Last Modified Date

#### System Settings
- Setting Key
- Setting Value
- Description
- Updated Date

### 7.2 Key Relationships
- Student belongs to one User, User can be one Student
- Tutor belongs to one User, User can be one Tutor
- Student has many Transactions
- Student has many Course Assignments
- Student has many Appointments
- Tutor has many Appointments
- Tutor has many Availability slots
- Course has many Lessons
- Course has many Course Assignments
- Transaction references one Student
- Appointment references one Student and one Tutor
- Course Assignment references Student, Course, and optionally Tutor

---

## 8. Future Enhancements (Out of Scope for MVP)

**Note**: These features are not required for the initial release but should be considered in the system architecture to allow for future expansion.

### 8.1 Advanced Curriculum Features
- Quizzes and assessments
- Video/audio content integration
- Interactive exercises
- Student note-taking within lessons
- Automatic progress tracking based on lesson completion

### 8.2 Enhanced Communication
- In-app messaging between students and tutors
- Video conferencing integration (Zoom, Google Meet)
- Group classes support
- Discussion forums or student community

### 8.3 Advanced Scheduling
- Recurring class bookings (e.g., "Every Tuesday at 3 PM")
- Waitlist functionality for popular time slots
- Automated rescheduling suggestions
- Buffer time between classes

### 8.4 Reporting & Analytics
- Detailed admin reports (revenue, student retention, tutor utilization)
- Student progress reports
- Export data to various formats
- Customizable dashboards

### 8.5 Marketing & Growth
- Referral program
- Discount/promo code system
- Email marketing campaigns
- Blog or resources section
- Multilingual support (Spanish interface option)

### 8.6 Mobile Applications
- Native iOS app
- Native Android app
- Push notifications

### 8.7 Additional Payment Options
- Cryptocurrency payments (if desired in future)
- Subscription/recurring billing
- Split payments or payment plans
- Gift cards or credits

---

## 9. Success Criteria & Validation

### 9.1 MVP Launch Criteria
The system is ready for launch when:
- All three user roles can register/login
- Students can purchase class packages via Stripe
- Admin can assign students to tutors
- Students can schedule classes with assigned tutor
- Timezone handling works correctly
- All automated emails are sending
- Basic course assignment and viewing is functional
- Transaction history and invoices are available
- Admin dashboard provides key metrics
- Public website is live with all informational pages
- Mobile responsiveness is tested and working

### 9.2 User Acceptance Testing
**Admin (Carla) should be able to**:
- Invite a tutor and see them register successfully
- Receive notification when a new student signs up
- Assign a student to a tutor
- Create a course and assign it to a student
- Manually enter a transaction and see hours update
- View all schedules across tutors and students
- Customize an email template and send a test email
- Create a class package and see it appear on the checkout page

**Tutor should be able to**:
- Complete registration from invitation link
- Set recurring weekly availability
- Mark specific dates as unavailable
- View list of assigned students
- See scheduled classes on calendar in their local timezone
- Sync calendar to Google Calendar

**Student should be able to**:
- Self-register for an account
- Purchase a class package via credit card
- View updated hours balance
- Download invoice for purchase
- View assigned tutor (after admin assignment)
- Book a class with assigned tutor in available time slots
- View upcoming classes on calendar in local timezone
- Receive class reminder email 1 hour before class
- View assigned courses and course content

---

## 10. Appendix

### 10.1 Glossary
- **Admin**: The school owner (Carla) with full system access
- **Tutor**: Language instructor who teaches students
- **Student**: Language learner who purchases and books classes
- **Class Package**: A purchasable bundle of class hours
- **Hours Balance**: The number of unused class hours a student has purchased
- **Appointment**: A scheduled class session between a student and tutor
- **Course**: A structured curriculum consisting of multiple lessons
- **Lesson**: An individual unit of learning within a course
- **Transaction**: A financial record of payment or adjustment
- **Invoice**: A PDF document detailing a purchase

### 10.2 Assumptions
- All users have internet access and a modern web browser or mobile device
- Students are comfortable with self-service technology
- Payment is primarily via credit card (Stripe)
- All communication is in English
- Classes are conducted one-on-one (not group classes)
- Timezone handling is critical due to geographic distribution of users
- Admin (Carla) is the sole administrator initially

### 10.3 Constraints
- Budget constraints may limit third-party service usage
- Timeline expectations for MVP launch
- Single administrator may limit advanced admin features initially
- Email templates in English only
- PCI compliance requirements for payment handling

### 10.4 Open Questions for Implementation Team
1. Preferred technology stack and frameworks?
2. Hosting and deployment environment?
3. Database choice and scalability approach?
4. Specific email service provider?
5. Approach to calendar integration (full two-way sync or one-way export)?
6. Timezone library/approach for handling DST and timezone conversions?
7. Testing strategy and frameworks?
8. CI/CD pipeline preferences?
9. Monitoring and logging tools?
10. Backup and disaster recovery strategy?

---

## Document Version History
- **v1.0** - 2025-11-24 - Initial PRD created based on spec.txt and README.md

---

**End of Product Requirements Document**
