"use client";
import Link from "next/link";
import React from "react";

export function NurseSidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r">
      <div className="px-6 py-4 font-bold text-xl">Nurse</div>
      <nav className="flex-1 px-4 space-y-1 pb-6">
        <Link href="/nurse/dashboard" className="block px-3 py-2 rounded hover:bg-gray-100">Dashboard</Link>
        <Link href="#" className="block px-3 py-2 rounded hover:bg-gray-100">Appointments</Link>
        <Link href="/nurse/patients" className="block px-3 py-2 rounded hover:bg-gray-100">Patients</Link>
        <Link href="#" className="block px-3 py-2 rounded hover:bg-gray-100">Messages</Link>
        <Link href="#" className="block px-3 py-2 rounded hover:bg-gray-100">Settings</Link>
      </nav>
    </aside>
  );
}
