'use client';

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AdminDashboard = () => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      router.push("/unauthorized");
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== 'admin') {
    return <div>Loading...</div>; // Or a proper loading component
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
    </div>
  );
};

export default AdminDashboard;
