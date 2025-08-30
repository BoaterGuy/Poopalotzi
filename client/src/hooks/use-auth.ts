import { useContext } from 'react';
import { AuthContext, User } from '../context/AuthContext';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  isMember: boolean;

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  
  const { user, isLoading, login, register, logout, loginWithGoogle, loginWithFacebook, loginWithApple } = context;
  
  const isLoggedIn = !!user;
  const isAdmin = isLoggedIn && user?.role === 'admin';
  const isEmployee = isLoggedIn && (user?.role === 'employee' || user?.role === 'admin');
  const isMember = isLoggedIn && user?.role === 'member';
  
  return { 
    user, 
    isLoading, 
    login, 
    register, 
    logout, 
    loginWithGoogle, 
    loginWithFacebook, 
    loginWithApple, 
    isLoggedIn, 
    isAdmin, 
    isEmployee, 
    isMember 
  };
