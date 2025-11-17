"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LabTechPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/labtech/dashboard");
  }, [router]);

  return <div>Redirecting...</div>;
}