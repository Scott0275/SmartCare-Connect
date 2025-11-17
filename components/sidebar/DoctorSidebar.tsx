"use client";
import Link from "next/link";
import React from "react";

export function DoctorSidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r">
      <div className="px-6 py-4 font-bold text-xl">Doctor</div>
      <nav className="flex-1 px-4 space-y-1 pb-6">
        <Link href="/doctor/dashboard" className="block px-3 py-2 rounded hover:bg-gray-100">Dashboard</Link>
        <Link href="/doctor/patients/search" className="block px-3 py-2 rounded hover:bg-gray-100">Search Patients</Link>
        <Link href="/doctor/consultations/start" className="block px-3 py-2 rounded hover:bg-gray-100">Start Consultation</Link>
        <Link href="/triage" className="block px-3 py-2 rounded hover:bg-gray-100">🏥 Triage Queue</Link>
        <Link href="/doctor/appointments" className="block px-3 py-2 rounded hover:bg-gray-100">📅 My Appointments</Link>
        <Link href="/doctor/records" className="block px-3 py-2 rounded hover:bg-gray-100">📋 Medical Records</Link>
        <Link href="/doctor/scan" className="block px-3 py-2 rounded hover:bg-gray-100">Scan QR Code</Link>
        <Link href="/doctor/prescriptions" className="block px-3 py-2 rounded hover:bg-gray-100">Prescriptions</Link>
        <Link href="/sync-status" className="block px-3 py-2 rounded hover:bg-gray-100">Sync Status</Link>
      </nav>
    </aside>
  );
}
