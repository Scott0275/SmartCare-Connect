"use client";
import Link from "next/link";
import React from "react";

export function NurseSidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r">
      <div className="px-6 py-4 font-bold text-xl">Nurse</div>
      <nav className="flex-1 px-4 space-y-1 pb-6">
        <Link href="/nurse/dashboard" className="block px-3 py-2 rounded hover:bg-gray-100">Dashboard</Link>
        <Link href="/nurse/patients/search" className="block px-3 py-2 rounded hover:bg-gray-100">Search Patients</Link>
        <Link href="/nurse/patients/register" className="block px-3 py-2 rounded hover:bg-gray-100">Register Patient</Link>
        <Link href="/nurse/scan" className="block px-3 py-2 rounded hover:bg-gray-100">Scan QR Code</Link>
        <Link href="/nurse/reports/shift" className="block px-3 py-2 rounded hover:bg-gray-100">Shift Report</Link>
        <Link href="/sync-status" className="block px-3 py-2 rounded hover:bg-gray-100">Sync Status</Link>
      </nav>
    </aside>
  );
}
