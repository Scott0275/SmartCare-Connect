"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const useRoleGuard = (allowedRoles: string[]) => {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!userProfile) {
      router.push("/login");
      return;
    }

    if (!allowedRoles.includes(userProfile.role)) {
      // Redirect to their own dashboard
      switch (userProfile.role) {
        case "admin":
          router.push("/admin/dashboard");
          break;
        case "doctor":
          router.push("/doctor/dashboard");
          break;
        case "nurse":
          router.push("/nurse/dashboard");
          break;
        case "receptionist":
          router.push("/reception/dashboard");
          break;
        case "accountant":
          router.push("/account/dashboard");
          break;
        case "pharmacy":
          router.push("/pharmacy/dashboard");
          break;
        case "lab":
          router.push("/lab/dashboard");
          break;
        default:
          router.push("/login");
      }
    }
  }, [userProfile, loading, router, allowedRoles]);
};

export default useRoleGuard;
