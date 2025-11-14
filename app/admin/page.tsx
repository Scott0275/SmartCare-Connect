'use client';

import useRoleGuard from '@/hooks/useRoleGuard';

const AdminDashboard = () => {
  const { loading } = useRoleGuard(['admin']);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
    </div>
  );
};

export default AdminDashboard;
