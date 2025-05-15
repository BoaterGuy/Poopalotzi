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
      setIsLoading(true);
      try {
        // First check if we have a valid session with our API
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // When a user signs in with Supabase, we need to create/verify them in our system
        if (event === 'SIGNED_IN' && session) {
          try {
            const supaUser = session.user;
            
            // Check if the user exists in our system
            const response = await fetch('/api/auth/me', {
              credentials: 'include',
            });

            if (!response.ok) {
              // User doesn't exist in our system, create them
              const registerResponse = await apiRequest('POST', '/api/auth/register', {
                email: supaUser.email,
                firstName: supaUser.user_metadata?.full_name?.split(' ')[0] || 'User',
                lastName: supaUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                role: 'member',
                oauthProvider: supaUser.app_metadata.provider,
                oauthId: supaUser.id,
                password: Math.random().toString(36).slice(2, 10), // Generate random password for OAuth users
              });

              if (registerResponse.ok) {
                const userData = await registerResponse.json();
                setUser(userData);
              }
            } else {
              // User exists, get their data
              const userData = await response.json();
              setUser(userData);
            }
          } catch (error) {
            console.error('Error syncing user after auth state change:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Login to our API
      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password,
      });

      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.firstName}!`,
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
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
      const response = await apiRequest('POST', '/api/auth/register', userData);
      
      const newUser = await response.json();
      setUser(newUser);
      
      toast({
        title: "Registration successful",
        description: `Welcome to Poopalazi, ${newUser.firstName}!`,
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
      await apiRequest('POST', '/api/auth/logout', {});
      
      // Also logout from Supabase if we're using it
      await signOut();
      
      setUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithOAuth('google');
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
      await signInWithOAuth('facebook');
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
      await signInWithOAuth('apple');
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
