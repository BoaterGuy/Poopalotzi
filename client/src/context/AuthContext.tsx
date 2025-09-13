import React, { createContext, useEffect, useState } from 'react';
// Removed Supabase import - now using backend API authentication
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';

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

  // Check for existing session on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('AuthContext: Checking authentication status...');
        console.log('AuthContext: Document cookies:', document.cookie);
        
        // First check if we have a valid session with our API
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        console.log('AuthContext: /api/auth/me response status:', response.status);
        console.log('AuthContext: Response headers:', Array.from(response.headers.entries()));

        if (response.ok) {
          const userData = await response.json();
          console.log('AuthContext: User authenticated:', userData.email, userData.role);
          setUser(userData);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log('AuthContext: No valid session found, error:', errorData);
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
      console.log('AuthContext: Attempting login with email:', email);
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
        console.error('AuthContext: Login failed with status:', response.status, 'Error:', errorData);
        throw new Error(errorData.message || 'Login failed');
      }

      const userData = await response.json();
      console.log('AuthContext: Login successful, user data:', userData);
      setUser(userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.firstName}!`,
      });
      
      // Use setTimeout to ensure state is set before redirect
      setTimeout(() => {
        if (userData.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else if (userData.role === 'employee') {
          window.location.href = '/employee/schedule';
        } else {
          window.location.href = '/member/dashboard';
        }
      }, 100);
      
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
      
      // Force a page refresh to clear any cached session data
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000); // Give toast time to show
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear the frontend state and redirect
      setUser(null);
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
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
