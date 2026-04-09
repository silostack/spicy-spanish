# Admin "Login As" Impersonation

## Summary

Allow the admin to impersonate any tutor or student to see exactly what they see, for debugging purposes. The admin clicks "Login As" on a user list page, gets a real JWT for that user (with an audit trail), and can return to their admin account via a persistent banner.

## Backend

### New endpoint: `POST /api/auth/impersonate/:userId`

- **Guards:** `JwtAuthGuard`, `RolesGuard` — `ADMIN` only
- **Logic:**
  1. Look up target user by ID; verify they exist and are active
  2. Issue a new JWT with: `{ sub: user.id, email: user.email, role: user.role, impersonatedBy: admin.id }`
  3. Return `{ access_token, user }` — same shape as login response
- **File:** `backend/src/auth/auth.controller.ts` (new endpoint) + `backend/src/auth/auth.service.ts` (new method)

No changes needed to `JwtStrategy.validate()` — it already reads `sub` and fetches the user. The `impersonatedBy` claim is carried in the token for audit purposes.

## Frontend

### Initiating impersonation

- Add "Login As" button to the admin's Students and Tutors list pages
- On click: `POST /api/auth/impersonate/:userId`
- On success:
  1. Save current admin token to `localStorage` as `adminToken`
  2. Replace `token` in `localStorage` with the impersonation token
  3. Update `AuthContext` state with impersonated user
  4. Redirect to `/dashboard`

### Returning to admin

- New `ImpersonationBanner` component in the dashboard layout
- Renders when `adminToken` exists in `localStorage`
- Shows: "Viewing as {firstName} {lastName} ({role})" + "Back to Admin" button
- On click "Back to Admin":
  1. Restore `token` from `adminToken`
  2. Remove `adminToken` from `localStorage`
  3. Refresh user profile via `/api/auth/profile`
  4. Redirect to `/dashboard`

### Files to modify

- `frontend/src/app/contexts/AuthContext.tsx` — add `impersonate()` and `stopImpersonating()` methods
- `frontend/src/app/dashboard/layout.tsx` — add `ImpersonationBanner`
- Admin Students list page — add "Login As" button
- Admin Tutors list page — add "Login As" button
- New component: `frontend/src/app/components/ImpersonationBanner.tsx`

## Security

- Endpoint restricted to `ADMIN` role only
- `impersonatedBy` in JWT provides audit trail
- Admin's original token preserved in `localStorage` for safe return
- Full access while impersonating (no restrictions)
