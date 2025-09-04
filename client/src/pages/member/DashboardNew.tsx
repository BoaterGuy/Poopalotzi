import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { formatDate, formatWeekRange } from "@/lib/utils";
import { Boat, PumpOutRequest, ServiceLevel, DockAssignment, Marina } from "@shared/schema";
import { CalendarPlus, History, AlertCircle, Check, X, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@/lib/queryClient";
import BulkPlanStatus from "@/components/member/BulkPlanStatus";
import PaymentForm from "@/components/member/PaymentForm";

export default function MemberDashboardNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<PumpOutRequest | null>(null);
  const [cancelingRequestId, setCancelingRequestId] = useState<number | null>(null);



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

  const { data: subscription } = useQuery({
    queryKey: ['/api/users/me/subscription'],
    queryFn: async () => {
      const response = await fetch('/api/users/me/subscription', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      return response.json();
    },
  });

  const { data: creditInfo } = useQuery({
    queryKey: ['/api/users/me/credits'],
    queryFn: async () => {
      const response = await fetch('/api/users/me/credits', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch credit info');
      }
      return response.json();
    },
  });

  // Cancel pump-out request function
  const cancelPumpOutRequest = async (requestId: number) => {
    try {
      setCancelingRequestId(requestId);
      
      const response = await fetch(`/api/pump-out-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'Canceled' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel request');
      }

      // Show success message
      toast({
        title: "Request Canceled",
        description: "Your pump-out request has been canceled and your credit has been restored.",
        variant: "default",
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/pump-out-requests/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/credits'] });
      
    } catch (error) {
      console.error('Error canceling request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel request",
        variant: "destructive",
      });
    } finally {
      setCancelingRequestId(null);
    }
  };

  // Get all pump-out requests for all user's boats
  const allBoatIds = boats?.map(boat => boat.id) || [];
  const allRequestsQueries = useQuery({
    queryKey: ['/api/pump-out-requests/all', allBoatIds],
    queryFn: async () => {
      if (allBoatIds.length === 0) return [];
      
      const requests = await Promise.all(
        allBoatIds.map(async (boatId) => {
          const response = await fetch(`/api/pump-out-requests/boat/${boatId}`, {
            credentials: 'include'
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch requests for boat ${boatId}`);
          }
          return response.json();
        })
      );
      
      return requests.flat();
    },
    enabled: allBoatIds.length > 0,
  });

  const allRequests = allRequestsQueries.data || [];
  const serviceLevel = subscription?.serviceLevel;
  const isLoading = isLoadingBoats || allRequestsQueries.isLoading;

  // Helper functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pending': { variant: 'secondary', label: 'Pending' },
      'Scheduled': { variant: 'default', label: 'Scheduled' },
      'In Progress': { variant: 'default', label: 'In Progress' },
      'Completed': { variant: 'default', label: 'Completed' },
      'Canceled': { variant: 'destructive', label: 'Canceled' },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary', label: status };

    return (
      <Badge variant={config.variant as any} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus?: string) => {
    if (!paymentStatus) return null;

    const paymentConfig = {
      'Pending': { variant: 'secondary', label: 'Payment Pending' },
      'Paid': { variant: 'default', label: 'Paid' },
      'Failed': { variant: 'destructive', label: 'Payment Failed' },
    } as const;

    const config = paymentConfig[paymentStatus as keyof typeof paymentConfig] || { variant: 'secondary', label: paymentStatus };

    return (
      <Badge variant={config.variant as any} className="text-xs ml-2">
        {config.label}
      </Badge>
    );
  };

  // Filter upcoming requests (non-completed and non-canceled)
  const upcomingRequests = allRequests.filter(request => 
    request.status !== 'Completed' && request.status !== 'Canceled'
  );

  // Filter pending payment requests
  const pendingPaymentRequests = allRequests.filter(request => 
    request.paymentStatus === 'Pending' && request.id > 0
  );

  // Filter recent completed requests (last 5)
  const recentRequests = allRequests
    .filter(request => request.status === 'Completed')
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <>
      <Helmet>
        <title>Member Dashboard - Poopalotzi</title>
        <meta name="description" content="Manage your boat pump-out services and monitor upcoming appointments." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0B1F3A]">Welcome, {user?.firstName}!</h1>
              <p className="text-gray-600">
                Manage your boat services and monitor upcoming appointments.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/member/service-history">
                <Button variant="outline">
                  <History className="mr-2 h-4 w-4" /> Service History
                </Button>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 animate-pulse">
                <CardHeader className="bg-gray-100 h-12"></CardHeader>
                <CardContent className="h-48 bg-gray-50"></CardContent>
              </Card>
              <Card className="animate-pulse">
                <CardHeader className="bg-gray-100 h-12"></CardHeader>
                <CardContent className="h-48 bg-gray-50"></CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Upcoming Services Section */}
              <Card className="md:col-span-2">
                <CardHeader className="bg-[#F4EBD0]">
                  <CardTitle className="flex items-center text-[#0B1F3A]">
                    <CalendarPlus className="mr-2" />
                    Upcoming Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {upcomingRequests.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg overflow-hidden">
                          <div className="bg-[#38B2AC] bg-opacity-10 px-4 py-3 border-b">
                            <div className="flex justify-between items-center">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <h4 className="font-semibold text-[#0B1F3A]">
                                  Week of {formatDate(request.weekStartDate)}
                                </h4>
                                <div className="sm:flex sm:gap-2">
                                  {getStatusBadge(request.status)}
                                  {getPaymentStatusBadge(request.paymentStatus)}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {request.paymentStatus === 'Pending' && (
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPaymentRequest(request);
                                      setShowPaymentDialog(true);
                                    }}
                                    className="bg-[#38B2AC] hover:bg-[#38B2AC]/90"
                                  >
                                    Pay Now
                                  </Button>
                                )}
                                {['Requested', 'Scheduled', 'Waitlisted'].includes(request.status) && (
                                  <Button 
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => cancelPumpOutRequest(request.id)}
                                    disabled={cancelingRequestId === request.id}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    {cancelingRequestId === request.id ? 'Canceling...' : 'Cancel'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-start mb-4">
                              <div className="mr-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                                  {boats?.find(b => b.id === request.boatId)?.name?.charAt(0) || 'B'}
                                </div>
                              </div>
                              <div>
                                <h5 className="font-semibold text-lg text-[#0B1F3A] mb-1">
                                  {boats?.find(b => b.id === request.boatId)?.name || 'Unknown Boat'}
                                </h5>
                                <p className="text-gray-600 text-sm mb-2">
                                  {boats?.find(b => b.id === request.boatId)?.make} {boats?.find(b => b.id === request.boatId)?.model}
                                </p>
                                {request.ownerNotes && (
                                  <p className="text-gray-700 text-sm">
                                    <strong>Notes:</strong> {request.ownerNotes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Upcoming Services</h3>
                      <p className="text-gray-500 mb-4">You don't have any pump-out services scheduled.</p>
                      {creditInfo && (creditInfo as any).availableCredits > 0 ? (
                        <Link href="/member/request-service">
                          <Button className="bg-[#38B2AC] hover:bg-opacity-90">
                            Schedule a Pump-Out
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/member/service-plans">
                          <Button className="bg-[#0B1F3A] hover:bg-opacity-90">
                            Select a Service Level
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Summary Section */}
              <Card>
                <CardHeader className="bg-[#F4EBD0]">
                  <CardTitle className="text-[#0B1F3A]">Account Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {serviceLevel && (
                      <div>
                        <h3 className="font-semibold text-[#0B1F3A] mb-1">Service Plan</h3>
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-medium text-gray-900">{serviceLevel.name}</h4>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-[#0B1F3A] mb-1">Credits Available</h3>
                      <div className="bg-white p-3 rounded border">
                        <div className="flex items-center text-lg font-semibold">
                          <span className={`${
                            (creditInfo?.availableCredits || 0) > 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {creditInfo?.availableCredits ?? 'Loading...'}
                          </span>
                          <span className="text-gray-600 text-sm ml-2 font-normal">
                            {(creditInfo?.availableCredits || 0) === 1 ? 'credit' : 'credits'} remaining
                          </span>
                        </div>
                        {(creditInfo?.availableCredits || 0) === 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            No credits available. Purchase additional pump-outs to add credits.
                          </p>
                        )}

                      </div>
                    </div>

                    <Separator />

                    {boats && boats.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-[#0B1F3A] mb-2">Registered Boats</h3>
                        <div className="space-y-2">
                          {boats.map((boat) => (
                            <div key={boat.id} className="bg-white p-3 rounded border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-gray-900">{boat.name}</h4>
                                  <p className="text-sm text-gray-600">{boat.make} {boat.model}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Link href="/member/boats">
                          <Button variant="outline" size="sm" className="mt-3">
                            Manage Boats
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Service History */}
          {recentRequests.length > 0 && (
            <div className="mt-8">
              <Card>
                <CardHeader className="bg-[#F4EBD0]">
                  <CardTitle className="flex items-center text-[#0B1F3A]">
                    <History className="mr-2" />
                    Recent Service History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {recentRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">
                            {boats?.find(b => b.id === request.boatId)?.name || 'Unknown Boat'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Week of {formatDate(request.weekStartDate)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Completed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/member/service-history" className="inline-block mt-4">
                    <Button variant="outline" size="sm">
                      View All History
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      {showPaymentDialog && selectedPaymentRequest && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
            </DialogHeader>
            <PaymentForm
              requestId={selectedPaymentRequest.id}
              amount={60}
              onSuccess={() => {
                setShowPaymentDialog(false);
                setSelectedPaymentRequest(null);
                queryClient.invalidateQueries({ queryKey: ['/api/pump-out-requests'] });
                queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
                toast({
                  title: "Payment Successful",
                  description: "Your payment has been processed successfully.",
                });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}