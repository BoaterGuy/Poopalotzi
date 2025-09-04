import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ServiceRequestForm from "@/components/member/ServiceRequestForm";
import { Boat } from "@shared/schema";
import { useQuery } from "@/lib/queryClient";

export default function RequestServiceSimple() {
  const { user } = useAuth();

  // Fetch boats owned by the user
  const { data: boats, isLoading: isLoadingBoats } = useQuery<Boat[]>({
    queryKey: ['/api/boats'],
    queryFn: async () => {
      const response = await fetch('/api/boats', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch boats');
      }
      return response.json();
    },
  });

  // Get available credits
  const { data: creditsData, isLoading: isLoadingCredits } = useQuery({
    queryKey: ['/api/users/me/credits'],
    queryFn: async () => {
      const response = await fetch('/api/users/me/credits', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const handleServiceSuccess = (request: any) => {
    // Simple success handling - redirect to dashboard
    setTimeout(() => {
      window.location.href = '/member/dashboard';
    }, 1000);
  };

  if (isLoadingBoats || isLoadingCredits) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#0B1F3A] mb-8">Request Pump-Out Service</h1>
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Check if user has boats
  if (boats && boats.length === 0) {
    return (
      <>
        <Helmet>
          <title>Request Service - Poopalotzi</title>
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A] mb-8">Request Pump-Out Service</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <Ship className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">No Boats Found</h2>
              <p className="text-gray-600 mb-6">
                You need to register a boat before you can request pump-out services.
              </p>
              <Link to="/member/boats">
                <Button className="bg-[#38B2AC]">Add Your Boat</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Check if user has available credits
  if (creditsData && creditsData.availableCredits === 0) {
    return (
      <>
        <Helmet>
          <title>Request Service - Poopalotzi</title>
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A] mb-8">Request Pump-Out Service</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">No Credits Available</h2>
              <p className="text-gray-600 mb-6">
                You have used all your available pump-out service credits. Purchase additional services to continue.
              </p>
              <Link to="/member/service-plans">
                <Button className="bg-[#38B2AC]">Purchase Service Credits</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Request Service - Poopalotzi</title>
        <meta name="description" content="Schedule your boat pump-out service" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#0B1F3A] mb-4">Request Pump-Out Service</h1>
        <p className="text-gray-600 mb-8">Schedule a pump-out service for your boat</p>

        {creditsData && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Credits Available</AlertTitle>
            <AlertDescription>
              You have {creditsData.availableCredits} pump-out service{creditsData.availableCredits > 1 ? 's' : ''} available.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle>Schedule a Pump-Out</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ServiceRequestForm
                  boats={boats || []}
                  serviceLevel={{ type: 'one-time', name: 'One Time Service' }}
                  onSuccess={handleServiceSuccess}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Service Summary */}
            <Card>
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle>Service Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Credits:</span>
                    <span className="font-semibold">{creditsData?.availableCredits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registered Boats:</span>
                    <span className="font-semibold">{boats?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <Link to="/member/boats" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Ship className="mr-2 h-4 w-4" />
                    Manage Boats
                  </Button>
                </Link>
                <Link to="/member/service-plans" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Service Plans
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}