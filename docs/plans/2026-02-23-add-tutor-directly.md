# Add Tutor Directly Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an admin-only "Add Tutor" flow at `/dashboard/tutors/new` that creates a tutor account immediately (no invitation email), mirroring the existing `/dashboard/students/new` pattern.

**Architecture:** New admin-only backend endpoint `POST /auth/register/tutor/direct` (JWT + Admin role guards) + a new frontend page. The backend follows the exact same shape as `registerStudent` but sets `UserRole.TUTOR`. No email is sent — admin hands credentials to the tutor out-of-band.

**Tech Stack:** NestJS + MikroORM (backend), Next.js 13+ App Router + Tailwind CSS (frontend), Jest (backend tests), class-validator DTOs.

**Worktree:** `.worktrees/add-tutor-directly` on branch `feature/add-tutor-directly`

---

## Task 1: Create the DTO

**Files:**
- Create: `backend/src/auth/dto/register-tutor-direct.dto.ts`

**Step 1: Create the file**

```typescript
// backend/src/auth/dto/register-tutor-direct.dto.ts
import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength } from 'class-validator';

export class RegisterTutorDirectDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
```

**Step 2: Commit**

```bash
git add backend/src/auth/dto/register-tutor-direct.dto.ts
git commit -m "feat: add RegisterTutorDirectDto"
```

---

## Task 2: Add `registerTutorDirect` service method (TDD)

**Files:**
- Modify: `backend/src/auth/auth.service.spec.ts`
- Modify: `backend/src/auth/auth.service.ts`

**Step 1: Write the failing tests**

Open `backend/src/auth/auth.service.spec.ts`. Add an import at the top alongside the existing DTO imports:

```typescript
import { RegisterTutorDirectDto } from './dto/register-tutor-direct.dto';
```

Then add this describe block after the `createTutorInvitation` describe block (before the closing `});` of the outer `describe('AuthService', ...)`):

```typescript
// ---------------------------------------------------------------------------
// registerTutorDirect
// ---------------------------------------------------------------------------
describe('registerTutorDirect', () => {
  const dto: RegisterTutorDirectDto = {
    firstName: 'Maria',
    lastName: 'Lopez',
    email: 'maria@example.com',
    password: 'tutorpass123',
    timezone: 'Europe/Madrid',
    phoneNumber: '+34600000000',
  };

  it('should create a tutor account and return user without password', async () => {
    em.findOne.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-tutor-pass');

    const result = await service.registerTutorDirect(dto);

    expect(em.findOne).toHaveBeenCalledWith(User, { email: 'maria@example.com' });
    expect(bcrypt.hash).toHaveBeenCalledWith('tutorpass123', 10);
    expect(em.persistAndFlush).toHaveBeenCalled();
    expect(result.email).toBe('maria@example.com');
    expect(result.firstName).toBe('Maria');
    expect(result.lastName).toBe('Lopez');
    expect(result).not.toHaveProperty('password');
  });

  it('should set role to TUTOR, isActive true, no invitationToken', async () => {
    em.findOne.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    await service.registerTutorDirect(dto);

    const persistedUser = (em.persistAndFlush as jest.Mock).mock.calls[0][0] as User;
    expect(persistedUser.role).toBe(UserRole.TUTOR);
    expect(persistedUser.isActive).toBe(true);
    expect(persistedUser.invitationToken).toBeUndefined();
  });

  it('should set timezone and phoneNumber on the new user', async () => {
    em.findOne.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    await service.registerTutorDirect(dto);

    const persistedUser = (em.persistAndFlush as jest.Mock).mock.calls[0][0] as User;
    expect(persistedUser.timezone).toBe('Europe/Madrid');
    expect(persistedUser.phoneNumber).toBe('+34600000000');
  });

  it('should throw ConflictException if email already in use', async () => {
    em.findOne.mockResolvedValue(mockUser());

    await expect(service.registerTutorDirect(dto)).rejects.toThrow(ConflictException);
    expect(em.persistAndFlush).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd .worktrees/add-tutor-directly/backend
npm test -- --testPathPattern=auth.service.spec --verbose 2>&1 | grep -E "(PASS|FAIL|✓|✗|×|registerTutorDirect)"
```

Expected: Tests fail with `service.registerTutorDirect is not a function` (or similar).

**Step 3: Implement the method in `auth.service.ts`**

Add this import at the top of `backend/src/auth/auth.service.ts` alongside the other DTO imports:

```typescript
import { RegisterTutorDirectDto } from './dto/register-tutor-direct.dto';
```

Add this method to the `AuthService` class, after `createTutorInvitation`:

```typescript
async registerTutorDirect(dto: RegisterTutorDirectDto) {
  const existingUser = await this.em.findOne(User, { email: dto.email });
  if (existingUser) {
    throw new ConflictException('Email already exists');
  }

  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const user = new User(
    dto.firstName,
    dto.lastName,
    dto.email,
    hashedPassword,
    UserRole.TUTOR,
  );

  user.timezone = dto.timezone;
  user.phoneNumber = dto.phoneNumber;
  user.isActive = true;

  await this.em.persistAndFlush(user);

  const { password: _, ...result } = user;
  return result;
}
```

**Step 4: Run tests to verify they pass**

```bash
cd .worktrees/add-tutor-directly/backend
npm test -- --testPathPattern=auth.service.spec --verbose 2>&1 | tail -15
```

Expected: All tests pass (202 total — previous 198 + 4 new).

**Step 5: Commit**

```bash
git add backend/src/auth/auth.service.spec.ts backend/src/auth/auth.service.ts
git commit -m "feat: add registerTutorDirect service method with tests"
```

---

## Task 3: Add the controller endpoint

**Files:**
- Modify: `backend/src/auth/auth.controller.ts`

**Step 1: Add import and route**

In `backend/src/auth/auth.controller.ts`, add the DTO import alongside the existing ones:

```typescript
import { RegisterTutorDirectDto } from './dto/register-tutor-direct.dto';
```

Add this route after the existing `inviteTutor` route (around line 69):

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Post('register/tutor/direct')
async registerTutorDirect(@Body() dto: RegisterTutorDirectDto) {
  return this.authService.registerTutorDirect(dto);
}
```

**Step 2: Run the full test suite to confirm nothing is broken**

```bash
cd .worktrees/add-tutor-directly/backend
npm test 2>&1 | tail -8
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add backend/src/auth/auth.controller.ts
git commit -m "feat: add POST /auth/register/tutor/direct controller endpoint"
```

---

## Task 4: Add the "Add Tutor" button to the tutors list page

**Files:**
- Modify: `frontend/src/app/dashboard/tutors/page.tsx`

**Step 1: Update the header section**

In `frontend/src/app/dashboard/tutors/page.tsx`, find the header section (around line 152–172). Replace:

```tsx
        <Link
          href="/dashboard/tutors/invite"
          className="btn-primary bg-spicy-red hover:bg-spicy-orange text-white font-bold py-2 px-4 rounded-lg flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Invite Tutor
        </Link>
```

With:

```tsx
        <div className="flex gap-2">
          <Link
            href="/dashboard/tutors/invite"
            className="btn-primary bg-white border border-spicy-red text-spicy-red hover:bg-red-50 font-bold py-2 px-4 rounded-lg flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Invite Tutor
          </Link>
          <Link
            href="/dashboard/tutors/new"
            className="btn-primary bg-spicy-red hover:bg-spicy-orange text-white font-bold py-2 px-4 rounded-lg flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Tutor
          </Link>
        </div>
```

**Step 2: Commit**

```bash
git add frontend/src/app/dashboard/tutors/page.tsx
git commit -m "feat: add 'Add Tutor' button to tutors list header"
```

---

## Task 5: Create the `/dashboard/tutors/new` page

**Files:**
- Create: `frontend/src/app/dashboard/tutors/new/page.tsx`

**Step 1: Create the file**

```tsx
// frontend/src/app/dashboard/tutors/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../utils/api';

export default function AddTutorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    timezone: 'America/New_York',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { confirmPassword, phoneNumber, ...submitData } = formData;
      const requestData = {
        ...submitData,
        ...(phoneNumber.trim() ? { phoneNumber: phoneNumber.trim() } : {}),
      };

      await api.post('/auth/register/tutor/direct', requestData);

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/tutors');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create tutor account');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-600">Only administrators can add new tutors.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/tutors" className="text-spicy-red hover:text-spicy-orange">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Add New Tutor</h1>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                Tutor account created successfully! Redirecting...
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  placeholder="Maria"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  placeholder="Garcia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  placeholder="maria.garcia@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="col-span-2 mt-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  placeholder="Re-enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Europe/Madrid">Madrid (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/dashboard/tutors"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-spicy-red text-white rounded-md hover:bg-spicy-orange disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Tutor Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/app/dashboard/tutors/new/page.tsx
git commit -m "feat: add /dashboard/tutors/new page for direct tutor creation"
```

---

## Task 6: Final verification

**Step 1: Run full backend test suite**

```bash
cd .worktrees/add-tutor-directly/backend
npm test 2>&1 | tail -8
```

Expected output:
```
Test Suites: 6 passed, 6 total
Tests:       202 passed, 202 total
```

**Step 2: Verify frontend builds cleanly**

```bash
cd .worktrees/add-tutor-directly/frontend
npm run build 2>&1 | tail -10
```

Expected: Build succeeds with no errors.

**Step 3: Final commit if any lint fixes were needed (otherwise skip)**

```bash
git add -A
git commit -m "fix: lint cleanup after final verification"
```

---

## Done

Use `superpowers:finishing-a-development-branch` to merge or PR this branch.
