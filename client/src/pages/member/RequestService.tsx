import { useState, useEffect, useMemo } from "react";
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
import { useServiceSubscription } from "@/hooks/use-service-subscription";

export default function RequestService() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"request" | "payment">("request");
  const [selectedRequest, setSelectedRequest] = useState<PumpOutRequest | null>(null);

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

  // Fetch all service levels to find the one for this subscription
  const { data: allServiceLevels, isLoading: isLoadingAllLevels } = useQuery<ServiceLevel[]>({
    queryKey: ['/api/service-levels'],
    queryFn: undefined,
  });

  // Get subscription from local storage
  const [localSubscription, setLocalSubscription] = useState<any>(null);
  
  // Check for local storage data on component mount
  useEffect(() => {
    import("@/lib/utils").then(utils => {
      const savedSubscription = utils.getSubscriptionFromLocal();
      if (savedSubscription) {
        setLocalSubscription(savedSubscription);
      }
    });
  }, []);

  // Use the subscription hook to get the user's current service level
  const { currentServiceLevel, isLoading: isLoadingSubscription } = useServiceSubscription();

  // Get the service level from various sources (API, subscription hook, or local storage)
  const serviceLevel = useMemo(() => {
    // First check if we have a service level from the subscription hook
    if (currentServiceLevel) return currentServiceLevel;
    
    // Otherwise check service levels and local storage
    if (allServiceLevels && Array.isArray(allServiceLevels)) {
      // If we have a local subscription, use that first
      if (localSubscription && localSubscription.serviceLevelId) {
        const found = allServiceLevels.find(level => level.id === localSubscription.serviceLevelId);
        if (found) return found;
      }
      
      // Fallback to finding Monthly Plan
      return allServiceLevels.find(level => 
        level.id === 5 || 
        (level.name && level.name.includes("Monthly Plan"))
      );
    }
    return null;
  }, [allServiceLevels, localSubscription, currentServiceLevel]);
  
  const isLoadingServiceLevel = isLoadingAllLevels;

  // Get pending payment requests
  const { data: pendingPaymentRequests, isLoading: isLoadingPendingPayments } = useQuery<PumpOutRequest[]>({
    queryKey: ['/api/pump-out-requests/payment/pending'],
    queryFn: undefined,
  });
  
  // Get all pump-out requests for quota checking (for when user has boats)
  const { data: allRequests, isLoading: isLoadingRequests } = useQuery<PumpOutRequest[]>({
    queryKey: ['/api/pump-out-requests'],
    queryFn: undefined,
    enabled: !!boats && boats.length > 0,
  });

  const hasPendingPayments = pendingPaymentRequests && pendingPaymentRequests.length > 0;
  
  // Calculate remaining quota for monthly plans
  const calculateRemainingQuota = () => {
    if (!serviceLevel || !allRequests || serviceLevel.type !== 'monthly' || !serviceLevel.monthlyQuota) {
      return null;
    }
    
    // Get current month's requests
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthRequests = allRequests.filter(r => {
      // Make sure to handle null createdAt values
      if (!r.createdAt) return false;
      const requestDate = new Date(r.createdAt);
      return requestDate >= firstDayOfMonth && requestDate <= lastDayOfMonth;
    });
    
    const used = monthRequests.length;
    const total = serviceLevel.monthlyQuota;
    const remaining = total - used;
    
    return { used, total, remaining };
  };
  
  const quotaInfo = calculateRemainingQuota();

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
      
      // Refresh all relevant data to update dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/pump-out-requests'] });
      queryClient.invalidateQueries({ queryKey: [`/api/pump-out-requests/boat/${request.boatId}`] });
      
      // If we have a boat ID, invalidate any queries related to that boat
      if (request.boatId) {
        queryClient.invalidateQueries({ queryKey: [`/api/boats`] });
        queryClient.invalidateQueries({ queryKey: [`/api/slip-assignments/boat/${request.boatId}`] });
      }
      
      // Redirect to dashboard after successful request with subscription
      setTimeout(() => {
        window.location.href = '/member/dashboard';
      }, 1000); // Short delay to allow toast to be seen
    }
  };

  const handlePaymentComplete = () => {
    toast({
      title: "Payment Successful",
      description: "Your service has been scheduled and payment has been processed.",
    });
    
    // Save service plan to local storage for persistence
    if (serviceLevel) {
      import("@/lib/utils").then(utils => {
        utils.saveSubscriptionToLocal({
          userId: user?.id,
          serviceLevelId: serviceLevel.id,
          name: serviceLevel.name,
          price: serviceLevel.price,
          type: serviceLevel.type,
          description: serviceLevel.description,
          monthlyQuota: serviceLevel.monthlyQuota,
          startDate: new Date().toISOString(),
        });
      });
    }
    
    // Refresh all relevant data
    queryClient.invalidateQueries({ queryKey: ['/api/pump-out-requests'] });
    
    if (selectedRequest?.boatId) {
      // Invalidate specific boat request data to ensure dashboard shows it
      queryClient.invalidateQueries({ queryKey: [`/api/pump-out-requests/boat/${selectedRequest.boatId}`] });
    }
    
    // Reset form
    setStep("request");
    setSelectedRequest(null);
    
    // Redirect to dashboard to see the new request
    window.location.href = '/member/dashboard';
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
              <Link to="/member/boats">
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
              <Link to="/member/subscription">
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
          <Alert className="mb-6 bg-amber-50 border-amber-200">
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
                    {quotaInfo && quotaInfo.remaining <= 0 && serviceLevel.type === 'monthly' ? (
                      <div className="text-center py-8">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                          <h3 className="text-lg font-semibold text-red-700 mb-2">Monthly Quota Reached</h3>
                          <p className="text-gray-700">
                            You have used all {quotaInfo.total} pump-out services included in your monthly plan.
                          </p>
                          <p className="text-gray-700 mt-2">
                            Your quota will reset at the beginning of next month. If you need additional services, 
                            you can purchase a one-time service.
                          </p>
                          <Button 
                            className="mt-4 bg-[#0B1F3A]"
                            onClick={() => window.location.href = '/member/subscription'}
                          >
                            View Service Options
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <ServiceRequestForm 
                        boats={boats || []}
                        serviceLevel={serviceLevel}
                        onSuccess={handleServiceRequested}
                        quotaInfo={quotaInfo}
                      />
                    )}
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
                          {formatCurrency(serviceLevel.price / 100)}
                          <span className="text-gray-500 text-sm">
                            /{serviceLevel.type === 'one-time' ? 'service' : 
                              serviceLevel.type === 'monthly' ? 'month' : 'season'}
                          </span>
                        </span>
                      </div>
                      
                      {serviceLevel.type === 'monthly' && serviceLevel.monthlyQuota && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Monthly Quota:</span>
                          <div>
                            <span>{serviceLevel.monthlyQuota} services</span>
                            {quotaInfo && (
                              <div className="text-sm mt-1">
                                <span className={quotaInfo.remaining > 0 ? "text-green-600" : "text-red-600"}>
                                  {quotaInfo.remaining > 0 ? (
                                    <>Available: <strong>{quotaInfo.remaining} remaining</strong> this month</>
                                  ) : (
                                    <strong>Monthly quota reached</strong>
                                  )} 
                                </span>
                              </div>
                            )}
                          </div>
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
                {selectedRequest ? (
                  <PaymentForm 
                    requestId={selectedRequest.id}
                    amount={serviceLevel.price / 100}
                    onSuccess={handlePaymentComplete}
                  />
                ) : pendingPaymentRequests && pendingPaymentRequests.length > 0 ? (
                  <PaymentForm 
                    requestId={pendingPaymentRequests[0].id}
                    amount={serviceLevel.price / 100}
                    onSuccess={handlePaymentComplete}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">You don't have any pending payments.</p>
                    <Button 
                      onClick={() => setStep("request")}
                      className="bg-[#0B1F3A]"
                    >
                      Go to Request Service
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
