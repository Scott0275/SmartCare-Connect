"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const useRoleGuard = (allowedRoles: string[]) => {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!role) {
      router.push("/login");
      return;
    }

    if (!allowedRoles.includes(role)) {
      // Redirect to their own dashboard
      switch (role) {
        case "admin":
          router.push("/admin/dashboard");
          break;
        case "doctor":
          router.push("/doctor/dashboard");
          break;
        case "nurse":
          router.push("/nurse/dashboard");
          break;
        case "patient":
          router.push("/patient/dashboard");
          break;
        default:
          router.push("/unauthorized");
      }
    }
  }, [role, loading, router, allowedRoles]);

  const isAuthorized = role ? allowedRoles.includes(role) : false;

  return { loading, isAuthorized };
};

export default useRoleGuard;
