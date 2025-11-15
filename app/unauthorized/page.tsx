"use client";

import Link from "next/link";

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
