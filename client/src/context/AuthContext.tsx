import React, { createContext, useEffect, useState } from 'react';
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
        // Simple auth check without extensive logging to prevent blocking
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
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
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
      
      // Direct API logout - no external auth needed
      // No Supabase signout needed for direct API approach
      
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
    try {
      // OAuth with Google will be handled by redirect to server endpoint
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Google login failed",
        description: "There was an error logging in with Google.",
        variant: "destructive",
      });
    }
  };

  const loginWithFacebook = async () => {
    try {
      // OAuth with Facebook will be handled by redirect to server endpoint
      window.location.href = '/api/auth/facebook';
    } catch (error) {
      console.error('Facebook login error:', error);
      toast({
        title: "Facebook login failed",
        description: "There was an error logging in with Facebook.",
        variant: "destructive",
      });
    }
  };

  const loginWithApple = async () => {
    try {
      // OAuth with Apple will be handled by redirect to server endpoint
      window.location.href = '/api/auth/apple';
    } catch (error) {
      console.error('Apple login error:', error);
      toast({
        title: "Apple login failed",
        description: "There was an error logging in with Apple.",
        variant: "destructive",
      });
    }
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
