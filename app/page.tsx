'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl mx-auto text-center p-8">
        <h1 className="text-5xl font-extrabold text-primary sm:text-6xl md:text-7xl">
          SmartCare Connect
        </h1>
        <p className="mt-6 text-xl text-secondary max-w-2xl mx-auto">
          A revolutionary platform for modern healthcare. Connect, collaborate, and care with confidence.
        </p>
        <div className="mt-10 flex justify-center gap-x-6">
          <Link
            href="/login"
            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            Login
          </Link>
        </div>
      </div>
      <div className="w-full mt-12">
        <Image
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
          alt="A team of medical professionals collaborating in a modern hospital environment."
          width={2070}
          height={1380}
          className="rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
}
