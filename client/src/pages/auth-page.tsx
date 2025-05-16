import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'employee') {
        navigate('/employee/schedule');
      } else {
        navigate('/member/dashboard');
      }
    }
  }, [user, navigate]);

  const handleLogin = () => {
    setIsLoading(true);
    // Redirect to Replit Auth login endpoint
    window.location.href = '/api/login';
  };

  return (
    <div className="container mx-auto flex flex-col md:flex-row min-h-[calc(100vh-12rem)] items-center justify-center p-4 gap-8">
      {/* Left column - Auth card */}
      <div className="w-full md:w-1/2 max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Welcome to Poopalotzi
            </CardTitle>
            <CardDescription className="text-center">
              The premium marina pump-out service
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <p className="text-center text-muted-foreground">
              Sign in with your account to access premium pump-out services
            </p>
            
            <Button 
              className="w-full" 
              onClick={handleLogin} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                'Sign in / Register'
              )}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col text-center">
            <p className="text-sm text-gray-600">
              By continuing, you agree to Poopalotzi's Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right column - Hero section */}
      <div className="w-full md:w-1/2 hidden md:block">
        <div className="p-6 space-y-6">
          <h2 className="text-3xl font-bold">Premium Pump-Out Service for Your Boat</h2>
          <p className="text-lg text-gray-700">
            Join Poopalotzi today and experience hassle-free, reliable pump-out services for your boat.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="rounded-full bg-blue-100 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">Convenient Scheduling</h3>
                <p className="text-gray-600">Schedule pump-outs at your convenience with our easy-to-use platform.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="rounded-full bg-blue-100 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">Multiple Service Plans</h3>
                <p className="text-gray-600">Choose from our single service, monthly, or seasonal subscription plans.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="rounded-full bg-blue-100 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">Professional Service</h3>
                <p className="text-gray-600">Our experienced team ensures clean and efficient pump-outs every time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;