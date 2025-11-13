# Project Blueprint

## Overview

This is a Next.js application with Firebase authentication and role-based access control. It includes separate dashboards for doctors, nurses, and patients, as well as a modern landing page.

## Features

* **Authentication:** User registration and login with Firebase.
* **Role-based access:** Different dashboards for doctors, nurses, and patients.
* **Modern UI:** A visually appealing and responsive design built with Tailwind CSS.
* **Component-based architecture:** Reusable components for UI elements and authentication.

## Design

* **Styling:** Tailwind CSS for a modern, utility-first approach.
* **Components:** Reusable components for authentication forms and dashboards.
* **Landing Page:** A professional landing page with a clear call to action and a hero image.

## Plan

* **Initial Setup:** The initial request was to fix a 404 error. This was caused by several issues related to Firebase authentication in a Next.js App Router environment.
* **Fixes Implemented:**
    * Added `"use client"` directive to `Login.tsx`, `Register.tsx`, and `withAuth.tsx`.
    * Configured Firebase MCP by creating `.idx/mcp.json`.
    * Modified `lib/firebaseAdmin.ts` to use `admin.initializeApp()` without arguments.
    * Deleted the legacy API route `pages/api/auth/signup.ts`.
    * Deleted the empty and conflicting `next.config.js` file.
    * Corrected server-side data fetching in `app/page.tsx` to use the Firebase Admin SDK.
    * Installed the `@tailwindcss/postcss` package and updated `postcss.config.js` to resolve a Tailwind CSS v4 build error.
    * Corrected the invalid Next.js version in `package.json` from `16.0.1` to `14.2.3`.
    * Downgraded React and React-DOM to `^18.2.0` to resolve dependency conflicts with Next.js.
    * **Dependency Reset:** Performed a full dependency reset by deleting `node_modules` and `package-lock.json` and running `npm install` to resolve persistent dependency conflicts.
    * **Refactored Firebase Admin:** Centralized Firebase Admin SDK initialization in `lib/firebaseAdmin.ts` and updated `app/page.tsx` to use the new setup. This resolved the `p is not a function` error during server-side rendering.
* **New Features and Bugfixes:**
    * **Patient Dashboard:** Created a new dashboard for patients, with a custom sidebar and relevant information.
    * **Landing Page:** Designed a new landing page with a modern UI, a hero image, and clear login/register buttons.
    * **Link Component Fix:** Corrected the usage of the Next.js `<Link>` component on the `login`, `register`, and main pages to resolve the `React.Children.only` error.
