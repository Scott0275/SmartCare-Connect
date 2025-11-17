"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PharmacyPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/pharmacy/dashboard");
  }, [router]);

  return <div>Redirecting...</div>;
}