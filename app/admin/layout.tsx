"use client";
import React from "react";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useRoleGuard(["admin"]);
  const { logout } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between bg-white px-6 py-4 border-b">
          <div className="text-lg font-semibold">Admin Panel</div>
          <div>
            <button
              onClick={() => logout()}
              className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="p-6 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
