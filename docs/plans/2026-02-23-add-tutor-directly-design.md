# Add Tutor Directly — Design

**Date:** 2026-02-23
**Status:** Validated

## Summary

Add a "direct create" path for tutors on the `/dashboard/tutors` page, mirroring the existing `students/new` flow. An admin fills in all fields (including an initial password) and the tutor account is immediately active — no invitation email required.

## Changes

### Frontend

**`/dashboard/tutors/page.tsx`**
- Add an "Add Tutor" button in the page header alongside the existing "Invite Tutor" button
- "Add Tutor" links to `/dashboard/tutors/new`

**`/dashboard/tutors/new/page.tsx`** _(new file)_
- Admin-only guard: redirect if `user.role !== 'admin'`
- Fields:
  | Field | Required |
  |---|---|
  | First Name | Yes |
  | Last Name | Yes |
  | Email | Yes |
  | Phone Number | No |
  | Timezone | Yes (default: `America/New_York`) |
  | Password | Yes (min 8 chars) |
  | Confirm Password | Yes (client-side match validation) |
- On submit: `POST /auth/register/tutor/direct`
- On success: brief success message, redirect to `/dashboard/tutors` after 2s
- On error: inline error banner with backend message

### Backend

**`backend/src/auth/dto/register-tutor-direct.dto.ts`** _(new file)_
```typescript
{ firstName, lastName, email, password, timezone?, phoneNumber? }
```
No `token` field (unlike `RegisterTutorDto`).

**`backend/src/auth/auth.controller.ts`**
- New route: `POST /auth/register/tutor/direct`
- Guards: `JwtAuthGuard` + `RolesGuard` with `@Roles(UserRole.ADMIN)`

**`backend/src/auth/auth.service.ts`**
- New method: `registerTutorDirect(dto: RegisterTutorDirectDto)`
  1. Check email not already in use → `ConflictException` if taken
  2. Hash password
  3. Create user: `role: UserRole.TUTOR`, `isActive: true`, no invitation token
  4. Return created user (without password hash)

## Out of Scope

- No email sent to tutor on creation (admin hands credentials out-of-band)
- No tutor profile fields (bio, experience, nationality) at creation time — tutor fills these in post-login
- Existing invite flow is unchanged
