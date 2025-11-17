"use client";
import PharmacySidebar from "@/components/sidebar/PharmacySidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== "pharmacy")) {
      router.push("/unauthorized");
    }
  }, [user, loading, role, router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user || role !== "pharmacy") return null;

  return (
    <div className="flex">
      <PharmacySidebar />
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}