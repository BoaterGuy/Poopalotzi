import React, { createContext, useEffect, useState } from 'react';
// Removed Supabase import - now using backend API authentication
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { useLocation } from 'wouter';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'employee' | 'admin';
  serviceLevelId?: number;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithApple: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  loginWithGoogle: async () => {},
  loginWithFacebook: async () => {},
  loginWithApple: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check for existing session on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // First check if we have a valid session with our API
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext: Error fetching user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    // No longer using Supabase auth listeners - backend handles all authentication
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Login to our API using direct fetch to avoid apiRequest issues
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Login failed');
      }

      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.firstName}!`,
      });
      
      // Navigate using React Router after state is updated
      if (userData.role === 'admin') {
        setLocation('/admin/dashboard');
      } else if (userData.role === 'employee') {
        setLocation('/employee/schedule');
      } else {
        setLocation('/member/dashboard');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      
      // Register with our API
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      const newUser = await response.json();
      setUser(newUser);
      
      toast({
        title: "Registration successful",
        description: `Welcome to Poopalotzi, ${newUser.firstName}!`,
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Logout from our API
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      // Logout handled by backend API only
      
      setUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Navigate to auth page using React Router
      setLocation('/auth');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear the frontend state and redirect
      setUser(null);
      setLocation('/auth');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    // OAuth not implemented with current backend - redirect to manual login
    toast({
      title: "OAuth not available",
      description: "Please use email and password to login.",
      variant: "destructive",
    });
  };

  const loginWithFacebook = async () => {
    // OAuth not implemented with current backend - redirect to manual login
    toast({
      title: "OAuth not available",
      description: "Please use email and password to login.",
      variant: "destructive",
    });
  };

  const loginWithApple = async () => {
    // OAuth not implemented with current backend - redirect to manual login
    toast({
      title: "OAuth not available",
      description: "Please use email and password to login.",
      variant: "destructive",
    });
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithFacebook,
    loginWithApple,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
