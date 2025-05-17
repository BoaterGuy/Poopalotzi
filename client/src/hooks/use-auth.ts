import { useQuery } from "@tanstack/react-query";
import { User } from '@shared/schema';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  isMember: boolean;
}

export function useAuth(): UseAuthReturn {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  
  const isLoggedIn = !!user;
  const isAdmin = isLoggedIn && user?.role === 'admin';
  const isEmployee = isLoggedIn && (user?.role === 'employee' || user?.role === 'admin');
  const isMember = isLoggedIn && user?.role === 'member';
  
  const login = () => {
    window.location.href = '/api/login';
  };
  
  const logout = () => {
    window.location.href = '/api/logout';
  };
  
  return { 
    user, 
    isLoading, 
    login,
    logout,
    isLoggedIn, 
    isAdmin, 
    isEmployee, 
    isMember 
  };
}
