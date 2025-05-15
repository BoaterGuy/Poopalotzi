import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import ServiceRequestForm from "@/components/member/ServiceRequestForm";
import PaymentForm from "@/components/member/PaymentForm";
import { Boat, PumpOutRequest, ServiceLevel } from "@shared/schema";
import { formatCurrency, formatWeekRange } from "@/lib/utils";

export default function RequestService() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"request" | "payment">("request");
  const [selectedRequest, setSelectedRequest] = useState<PumpOutRequest | null>(null);

  // Fetch boats owned by the user
  const { data: boats, isLoading: isLoadingBoats } = useQuery<Boat[]>({
    queryKey: ['/api/boats'],
    queryFn: undefined,
  });

  // Fetch user's service level
  const { data: serviceLevel, isLoading: isLoadingServiceLevel } = useQuery<ServiceLevel>({
    queryKey: user?.serviceLevelId ? [`/api/service-levels/${user.serviceLevelId}`] : [],
    queryFn: undefined,
    enabled: !!user?.serviceLevelId,
  });

  // Get pending payment requests
  const { data: pendingPaymentRequests, isLoading: isLoadingPendingPayments } = useQuery<PumpOutRequest[]>({
    queryKey: ['/api/pump-out-requests/payment/pending'],
    queryFn: undefined,
  });

  const hasPendingPayments = pendingPaymentRequests && pendingPaymentRequests.length > 0;

  const handleServiceRequested = (request: PumpOutRequest) => {
    setSelectedRequest(request);
    
    // If it's a one-time service or requires payment, go to payment step
    if (
      (serviceLevel?.type === "one-time") ||
      (request.paymentStatus === "Pending")
    ) {
      setStep("payment");
    } else {
      // Otherwise, just show confirmation
      toast({
        title: "Service Requested",
        description: "Your pump-out service has been scheduled. You can view it in your dashboard.",
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/pump-out-requests'] });
    }
  };

  const handlePaymentComplete = () => {
    toast({
      title: "Payment Successful",
      description: "Your service has been scheduled and payment has been processed.",
    });
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/pump-out-requests'] });
    setStep("request");
    setSelectedRequest(null);
  };

  if (isLoadingBoats || isLoadingServiceLevel) {
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
              <Link href="/member/boats">
                <Button className="bg-[#38B2AC]">Add Your Boat</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Check if user has a service plan
  if (!serviceLevel) {
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
              <h2 className="text-2xl font-bold text-gray-700 mb-2">No Service Plan</h2>
              <p className="text-gray-600 mb-6">
                You need to select a service plan before you can request pump-out services.
              </p>
              <Link href="/services">
                <Button className="bg-[#38B2AC]">Choose a Plan</Button>
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

        {hasPendingPayments && (
          <Alert variant="warning" className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Payment Required</AlertTitle>
            <AlertDescription>
              You have {pendingPaymentRequests.length} pending service request{pendingPaymentRequests.length > 1 ? 's' : ''} that require payment.
              <Button 
                variant="link" 
                className="text-amber-600 p-0 h-auto" 
                onClick={() => setStep("payment")}
              >
                Complete payment now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={step} onValueChange={(value) => setStep(value as "request" | "payment")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="request">Request Service</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="request">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="bg-[#F4EBD0]">
                    <CardTitle>Schedule a Pump-Out</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ServiceRequestForm 
                      boats={boats || []}
                      serviceLevel={serviceLevel}
                      onSuccess={handleServiceRequested}
                    />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader className="bg-[#F4EBD0]">
                    <CardTitle>Your Service Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-[#0B1F3A]">{serviceLevel.name}</h3>
                      <p className="text-gray-600">{serviceLevel.description}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Price:</span>
                        <span className="font-bold text-[#38B2AC]">
                          {formatCurrency(serviceLevel.price)}
                          <span className="text-gray-500 text-sm">
                            /{serviceLevel.type === 'one-time' ? 'service' : 
                              serviceLevel.type === 'monthly' ? 'month' : 'season'}
                          </span>
                        </span>
                      </div>
                      
                      {serviceLevel.type === 'monthly' && serviceLevel.monthlyQuota && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Monthly Quota:</span>
                          <span>{serviceLevel.monthlyQuota} services</span>
                        </div>
                      )}

                      {serviceLevel.type === 'seasonal' && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Season:</span>
                          <span>
                            {serviceLevel.seasonStart && serviceLevel.seasonEnd ? 
                              `${new Date(serviceLevel.seasonStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(serviceLevel.seasonEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` 
                              : 'May 1 - Oct 31'}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="font-medium">Heads Supported:</span>
                        <span>{serviceLevel.headCount === 1 ? 'Single Head' : `Up to ${serviceLevel.headCount} Heads`}</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p className="mb-2">
                        <strong>Note:</strong> Pump-out services are available Monday through Friday during the boating season.
                      </p>
                      <p>
                        Requests must be submitted at least 24 hours in advance and are subject to availability.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <PaymentForm 
                  selectedRequest={selectedRequest}
                  pendingPaymentRequests={pendingPaymentRequests}
                  serviceLevel={serviceLevel}
                  onSuccess={handlePaymentComplete}
                  onCancel={() => {
                    setStep("request");
                    setSelectedRequest(null);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
