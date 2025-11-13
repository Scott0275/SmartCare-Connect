import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const useRoleGuard = (allowedRoles: string[]) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; 
    }

    if (!user) {
      router.push('/login'); 
      return;
    }

    if (!role || !allowedRoles.includes(role)) {
      router.push('/unauthorized');
    }
  }, [user, role, loading, router, allowedRoles]);

  const isAuthorized = !loading && user && role && allowedRoles.includes(role);
  
  return { loading: loading || !isAuthorized, isAuthorized };
};

export default useRoleGuard;
