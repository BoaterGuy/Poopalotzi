import React, { createContext, useEffect, useState } from 'react';
import { supabase, getCurrentUser, signInWithEmail, signUpWithEmail, signOut, signInWithOAuth } from '../lib/supabase';
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
        console.log('AuthContext: Response headers:', [...response.headers.entries()]);

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
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Attempting login for:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('AuthContext: Login response:', response.status, data);

      if (response.ok) {
        setUser(data.user);
        console.log('AuthContext: Login successful, user set:', data.user.email);
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.firstName}!`,
        });
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || 'Please check your credentials',
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
      console.log('AuthContext: Attempting registration for:', userData.email);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('AuthContext: Registration response:', response.status, data);

      if (response.ok) {
        setUser(data.user);
        console.log('AuthContext: Registration successful, user set:', data.user.email);
        toast({
          title: "Registration successful",
          description: `Welcome to Poopalotzi, ${data.user.firstName}!`,
        });
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('AuthContext: Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || 'Please try again',
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
      console.log('AuthContext: Attempting logout...');
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      console.log('AuthContext: Logout response:', response.status);
      
      // Always clear user state, even if server request fails
      setUser(null);
      console.log('AuthContext: User state cleared');
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      // Still clear user state on error
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Attempting Google login...');
      await signInWithOAuth('google');
    } catch (error: any) {
      console.error('AuthContext: Google login error:', error);
      toast({
        title: "Google login failed",
        description: error.message || 'Please try again',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithFacebook = async () => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Attempting Facebook login...');
      await signInWithOAuth('facebook');
    } catch (error: any) {
      console.error('AuthContext: Facebook login error:', error);
      toast({
        title: "Facebook login failed",
        description: error.message || 'Please try again',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithApple = async () => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Attempting Apple login...');
      await signInWithOAuth('apple');
    } catch (error: any) {
      console.error('AuthContext: Apple login error:', error);
      toast({
        title: "Apple login failed",
        description: error.message || 'Please try again',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};