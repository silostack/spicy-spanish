# Admin "Login As" Impersonation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let the admin impersonate any tutor or student, seeing exactly what they see, with one-click return to admin.

**Architecture:** New `POST /api/auth/impersonate/:userId` backend endpoint (admin-only) issues a JWT for the target user with an `impersonatedBy` audit claim. Frontend stores the admin token separately, swaps to the impersonation token, and shows a persistent banner to return.

**Tech Stack:** NestJS, MikroORM, JWT, Next.js, React Context, Tailwind CSS

---

### Task 1: Backend — impersonate service method + tests

**Files:**
- Modify: `backend/src/auth/auth.service.ts:44-61` (reference login method pattern)
- Test: `backend/src/auth/auth.service.spec.ts`

**Step 1: Write the failing tests**

Add to `backend/src/auth/auth.service.spec.ts` at the end, before the final closing `});`:

```typescript
// ---------------------------------------------------------------------------
// impersonate
// ---------------------------------------------------------------------------
describe("impersonate", () => {
  it("should return access_token and user for a valid active user", async () => {
    const targetUser = mockUser();
    targetUser.isActive = true;
    em.findOne.mockResolvedValue(targetUser);

    const result = await service.impersonate("user-id-123", "admin-id-456");

    expect(em.findOne).toHaveBeenCalledWith(User, { id: "user-id-123" });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: "user-id-123",
      email: "john@example.com",
      role: UserRole.STUDENT,
      impersonatedBy: "admin-id-456",
    });
    expect(result.access_token).toBe("mock-jwt-token");
    expect(result.user).toEqual({
      id: "user-id-123",
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.STUDENT,
    });
  });

  it("should throw NotFoundException when user does not exist", async () => {
    em.findOne.mockResolvedValue(null);

    await expect(
      service.impersonate("nonexistent-id", "admin-id-456"),
    ).rejects.toThrow(NotFoundException);
  });

  it("should throw NotFoundException when user is inactive", async () => {
    const inactiveUser = mockUser();
    inactiveUser.isActive = false;
    em.findOne.mockResolvedValue(inactiveUser);

    await expect(
      service.impersonate("user-id-123", "admin-id-456"),
    ).rejects.toThrow(NotFoundException);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd backend && npm run test -- --testPathPattern=auth.service.spec.ts`
Expected: FAIL — `service.impersonate is not a function`

**Step 3: Write the implementation**

Add to `backend/src/auth/auth.service.ts` after the `login` method (after line 61):

```typescript
async impersonate(userId: string, adminId: string) {
  const user = await this.em.findOne(User, { id: userId });
  if (!user || !user.isActive) {
    throw new NotFoundException("User not found or inactive");
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    impersonatedBy: adminId,
  };

  return {
    access_token: this.jwtService.sign(payload),
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd backend && npm run test -- --testPathPattern=auth.service.spec.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add backend/src/auth/auth.service.ts backend/src/auth/auth.service.spec.ts
git commit -m "feat: add impersonate method to AuthService with tests"
```

---

### Task 2: Backend — impersonate controller endpoint

**Files:**
- Modify: `backend/src/auth/auth.controller.ts:1,67-79` (add new endpoint following existing admin-guarded pattern)

**Step 1: Add the endpoint**

Add import for `Param` to the `@nestjs/common` imports on line 1 of `backend/src/auth/auth.controller.ts`:

Change:
```typescript
import { Controller, Post, Body, UseGuards, Req, Get } from "@nestjs/common";
```
To:
```typescript
import { Controller, Post, Body, UseGuards, Req, Get, Param } from "@nestjs/common";
```

Add the endpoint after the `registerTutorDirect` method (after line 79), before the `getProfile` method:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Post("impersonate/:userId")
async impersonate(@Param("userId") userId: string, @Req() req) {
  return this.authService.impersonate(userId, req.user.id);
}
```

**Step 2: Verify the build compiles**

Run: `cd backend && npm run build`
Expected: Build succeeds with no errors

**Step 3: Run all auth tests**

Run: `cd backend && npm run test -- --testPathPattern=auth`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add backend/src/auth/auth.controller.ts
git commit -m "feat: add POST /auth/impersonate/:userId admin endpoint"
```

---

### Task 3: Frontend — add impersonate/stopImpersonating to AuthContext

**Files:**
- Modify: `frontend/src/app/contexts/AuthContext.tsx`

**Step 1: Add `isImpersonating`, `impersonate`, and `stopImpersonating` to the context type**

In `frontend/src/app/contexts/AuthContext.tsx`, update the `AuthContextType` interface (lines 28-37):

Change:
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}
```
To:
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  impersonate: (userId: string) => Promise<void>;
  stopImpersonating: () => Promise<void>;
}
```

**Step 2: Add `isImpersonating` state**

After the existing state declarations (after line 44), add:

```typescript
const [isImpersonating, setIsImpersonating] = useState(false);
```

**Step 3: Initialize `isImpersonating` from localStorage on load**

Inside the existing `useEffect` (around line 47), after `const storedToken = localStorage.getItem('token');`, add:

```typescript
const adminToken = localStorage.getItem('adminToken');
if (adminToken) {
  setIsImpersonating(true);
}
```

**Step 4: Add `impersonate` function**

Add after the `updateUser` function (before the `return` statement):

```typescript
const impersonate = async (userId: string) => {
  try {
    setIsLoading(true);
    const currentToken = localStorage.getItem('token');
    const response = await api.post(`/auth/impersonate/${userId}`);
    const { access_token } = response.data;

    // Save admin token for later restoration
    localStorage.setItem('adminToken', currentToken!);
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setIsImpersonating(true);

    await fetchUserData(access_token);
    router.push('/dashboard');
  } catch (error) {
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

**Step 5: Add `stopImpersonating` function**

Add after the `impersonate` function:

```typescript
const stopImpersonating = async () => {
  try {
    setIsLoading(true);
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;

    localStorage.setItem('token', adminToken);
    localStorage.removeItem('adminToken');
    setToken(adminToken);
    setIsImpersonating(false);

    await fetchUserData(adminToken);
    router.push('/dashboard');
  } catch (error) {
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

**Step 6: Add new values to the context provider**

Update the `value` prop of `AuthContext.Provider` (around line 216-228):

Change:
```typescript
value={{
  user,
  token,
  isLoading,
  isAuthenticated: !!user,
  login,
  register,
  logout,
  updateUser,
}}
```
To:
```typescript
value={{
  user,
  token,
  isLoading,
  isAuthenticated: !!user,
  isImpersonating,
  login,
  register,
  logout,
  updateUser,
  impersonate,
  stopImpersonating,
}}
```

**Step 7: Verify frontend builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 8: Commit**

```bash
git add frontend/src/app/contexts/AuthContext.tsx
git commit -m "feat: add impersonate/stopImpersonating to AuthContext"
```

---

### Task 4: Frontend — ImpersonationBanner component + dashboard layout

**Files:**
- Create: `frontend/src/app/components/ImpersonationBanner.tsx`
- Modify: `frontend/src/app/dashboard/layout.tsx:67,117-118`

**Step 1: Create the ImpersonationBanner component**

Create `frontend/src/app/components/ImpersonationBanner.tsx`:

```typescript
'use client';

import { useAuth } from '../contexts/AuthContext';

export default function ImpersonationBanner() {
  const { user, isImpersonating, stopImpersonating } = useAuth();

  if (!isImpersonating || !user) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-3">
      <span>
        Viewing as {user.firstName} {user.lastName} ({user.role})
      </span>
      <button
        onClick={stopImpersonating}
        className="bg-white text-amber-700 px-3 py-1 rounded text-xs font-bold hover:bg-amber-100 transition-colors"
      >
        Back to Admin
      </button>
    </div>
  );
}
```

**Step 2: Add the banner to dashboard layout**

In `frontend/src/app/dashboard/layout.tsx`, add the import at the top (after existing imports around line 7):

```typescript
import ImpersonationBanner from '../components/ImpersonationBanner';
```

Then add the banner inside the layout return, right after the opening `<div className="min-h-screen bg-gray-100">` on line 118. Change:

```typescript
return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar for desktop */}
```

To:

```typescript
return (
    <div className="min-h-screen bg-gray-100">
      <ImpersonationBanner />
      {/* Sidebar for desktop */}
```

**Step 3: Verify frontend builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/app/components/ImpersonationBanner.tsx frontend/src/app/dashboard/layout.tsx
git commit -m "feat: add ImpersonationBanner to dashboard layout"
```

---

### Task 5: Frontend — "Login As" button on Students list

**Files:**
- Modify: `frontend/src/app/dashboard/students/page.tsx:5,496-518`

**Step 1: Add useAuth import for impersonate**

The file already imports `useAuth` on line 5. We need to destructure `impersonate` from it. Change line 32:

```typescript
const { user, isLoading: authLoading, isAuthenticated } = useAuth();
```
To:
```typescript
const { user, isLoading: authLoading, isAuthenticated, impersonate } = useAuth();
```

**Step 2: Add "Login As" button to the actions column**

In the actions `<td>` (around lines 496-518), add the Login As button inside the admin-only block. Change:

```typescript
{user?.role === 'admin' && (
  <>
    <Link
      href={`/dashboard/students/${student.id}/edit`}
      className="text-blue-600 hover:text-blue-900"
    >
      Edit
    </Link>
    <button
      onClick={() => deleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
      className="text-red-600 hover:text-red-900"
    >
      Delete
    </button>
  </>
)}
```

To:

```typescript
{user?.role === 'admin' && (
  <>
    <button
      onClick={() => impersonate(student.id)}
      className="text-amber-600 hover:text-amber-800"
    >
      Login As
    </button>
    <Link
      href={`/dashboard/students/${student.id}/edit`}
      className="text-blue-600 hover:text-blue-900"
    >
      Edit
    </Link>
    <button
      onClick={() => deleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
      className="text-red-600 hover:text-red-900"
    >
      Delete
    </button>
  </>
)}
```

**Step 3: Verify frontend builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/app/dashboard/students/page.tsx
git commit -m "feat: add Login As button to admin students list"
```

---

### Task 6: Frontend — "Login As" button on Tutors list

**Files:**
- Modify: `frontend/src/app/dashboard/tutors/page.tsx:29,367-393`

**Step 1: Destructure impersonate from useAuth**

Change line 30:

```typescript
const { user } = useAuth();
```
To:
```typescript
const { user, impersonate } = useAuth();
```

**Step 2: Add "Login As" button to the actions column**

In the tutor actions area (around lines 377-391), add the Login As button. Change:

```typescript
<>
  <Link href={`/dashboard/tutors/${tutor.id}`} className="text-spicy-red hover:text-spicy-orange">
    View
  </Link>
  <Link href={`/dashboard/tutors/${tutor.id}/edit`} className="text-blue-600 hover:text-blue-900">
    Edit
  </Link>
  {user?.role === 'admin' && (
    <button
      onClick={() => deleteTutor(tutor.id, `${tutor.firstName} ${tutor.lastName}`)}
      className="text-red-600 hover:text-red-900"
    >
      Delete
    </button>
  )}
</>
```

To:

```typescript
<>
  <Link href={`/dashboard/tutors/${tutor.id}`} className="text-spicy-red hover:text-spicy-orange">
    View
  </Link>
  <Link href={`/dashboard/tutors/${tutor.id}/edit`} className="text-blue-600 hover:text-blue-900">
    Edit
  </Link>
  {user?.role === 'admin' && (
    <>
      <button
        onClick={() => impersonate(tutor.id)}
        className="text-amber-600 hover:text-amber-800"
      >
        Login As
      </button>
      <button
        onClick={() => deleteTutor(tutor.id, `${tutor.firstName} ${tutor.lastName}`)}
        className="text-red-600 hover:text-red-900"
      >
        Delete
      </button>
    </>
  )}
</>
```

**Step 3: Verify frontend builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/app/dashboard/tutors/page.tsx
git commit -m "feat: add Login As button to admin tutors list"
```

---

### Task 7: Final verification

**Step 1: Run backend tests**

Run: `cd backend && npm run test`
Expected: ALL PASS

**Step 2: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 3: Final commit with design doc**

```bash
git add docs/plans/
git commit -m "docs: add admin impersonation design and implementation plan"
```
