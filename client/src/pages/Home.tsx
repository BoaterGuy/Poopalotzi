import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthModal } from "@/components/auth/AuthModal";
import { useState } from "react";

export default function Home() {
  const { user, isAdmin, isEmployee } = useAuth();
  const [location, setLocation] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        setLocation("/admin/dashboard");
      } else if (isEmployee) {
        setLocation("/employee/schedule");
      } else {
        setLocation("/member/dashboard");
      }
    }
  }, [user, isAdmin, isEmployee, setLocation]);

  return (
    <>
      <Helmet>
        <title>Poopalotzi - Boat Pump-Out Service</title>
        <meta 
          name="description" 
          content="Professional boat pump-out service for marinas and boat owners. Schedule pump-outs, track services, and maintain your vessel with ease." 
        />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy/95 to-navy/90 flex items-center justify-center px-4">
        <div className="max-w-4xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-white mb-4">
              Poopalotzi
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Professional Boat Pump-Out Service
            </p>
          </div>

          {/* Login Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Admin Login */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Admin Portal</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage pump-out operations and customer accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-400">
                  <p>• Customer & boat management</p>
                  <p>• Schedule pump-out services</p>
                  <p>• Track service history & analytics</p>
                  <p>• Process payments & manage accounts</p>
                </div>
                <Button 
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  Access Admin Portal
                </Button>
              </CardContent>
            </Card>

            {/* Member Login */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Member Portal</CardTitle>
                <CardDescription className="text-gray-300">
                  Service requests and account management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-400">
                  <p>• Request pump-out services</p>
                  <p>• Track service history</p>
                  <p>• Manage boat information</p>
                  <p>• View service plans</p>
                </div>
                <Button 
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                >
                  Member Login
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-400 text-sm">
            <p>© 2025 Poopalotzi LLC - Professional Boat Pump-Out Services</p>
          </div>
        </div>
      </div>

      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
      />
    </>
  );
}
