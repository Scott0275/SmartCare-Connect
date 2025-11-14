"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-6">You do not have permission to view this page.</p>
        <div className="flex justify-center gap-4">
          <Link href="/login" className="px-4 py-2 bg-teal-600 text-white rounded-md">Login</Link>
          <Link href="/" className="px-4 py-2 border rounded-md">Home</Link>
        </div>
      </div>
    </div>
  );
}
'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">Unauthorized Access</h1>
          <p className="text-secondary mt-2">You are not authorized to view this page.</p>
          <div className="mt-6">
            <Link
              href="/login"
              className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
