# Project Blueprint

## Overview

This document outlines the plan for implementing a full role-based authentication system with protected routes and correct redirects in a Next.js application.

## Current State

The application has a basic login system, but it lacks role-based access control. Public registration is enabled, and there is no mechanism to prevent users from accessing pages outside of their designated roles.

## Plan

### 1. Disable Public Registration

- **Action:** Remove the "Register" button from the login UI.
- **File to modify:** `app/login/page.tsx`, `components/auth/Login.tsx`
- **Action:** Delete the registration page.
- **File to delete:** `app/register-disabled/page.tsx` (Already done)

### 2. Implement Admin-Only User Creation

- **Action:** Create a form in `/admin/create-user` for admins to create new users.
- **File to modify:** `app/admin/create-user/page.tsx`
- **Action:** Update the backend to handle user creation.
- **File to modify:** `app/api/createUser/route.ts`
  - Create a Firebase Authentication user with email and password.
  - Save the user's role and UID in Firestore under the `/users/{uid}` collection.
  - Return a success or error response.

### 3. Update the Login Process

- **Action:** Simplify the login page to only include email and password fields.
- **File to modify:** `app/login/page.tsx`, `components/auth/Login.tsx`
- **Action:** After a user logs in, fetch their role from Firestore.
- **File to modify:** `context/AuthContext.tsx`
- **Action:** Redirect users to their respective dashboards based on their roles.
- **File to modify:** `context/AuthContext.tsx`, `components/auth/Login.tsx`

### 4. Implement Route Protection

- **Action:** Create a mechanism to protect routes based on user roles.
- **File to create/modify:** `hooks/useRoleGuard.ts`
- **Action:** Apply the route protection to all role-specific pages.
- **Files to modify:** All dashboard pages (e.g., `app/admin/dashboard/page.tsx`, `app/doctor/dashboard/page.tsx`, etc.)

### 5. Role-Based Redirects

- **Action:** Implement logic to redirect users to their own dashboards if they try to access a page they are not authorized to view.
- **File to modify:** `hooks/useRoleGuard.ts`

### 6. Code Cleanup and Review

- **Action:** Review all changes to ensure they meet the requirements and that no server-only code is exposed to the client.
- **Action:** Run `npm run lint -- --fix` to ensure code quality.
