"use client";
import LabTechSidebar from "@/components/sidebar/LabTechSidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LabTechLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== "labtech")) {
      router.push("/unauthorized");
    }
  }, [user, loading, role, router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user || role !== "labtech") return null;

  return (
    <div className="flex">
      <LabTechSidebar />
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}