import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/auth';

export interface UseAuthGuardProps {
  allowedRoles: UserRole[];
}

export interface UseAuthGuardReturn {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: boolean;
}

export const useAuthGuard = (props: UseAuthGuardProps): UseAuthGuardReturn => {
  const { allowedRoles } = props;
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Get user and token from localStorage (matches your auth system)
        const storedUser = localStorage.getItem('clamflow_user');
        const token = localStorage.getItem('clamflow_token');
        
        if (storedUser && token) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const isAuthenticated = !!user;
  const userRole = user?.role as UserRole | undefined;
  const hasPermission = isAuthenticated && userRole ? allowedRoles.includes(userRole) : false;

  // Redirect logic for unauthorized access
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      
      if (userRole && !allowedRoles.includes(userRole)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, isLoading, userRole, allowedRoles, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    hasPermission
  };
};

export default useAuthGuard;