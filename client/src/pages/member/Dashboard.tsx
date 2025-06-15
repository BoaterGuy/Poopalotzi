import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatWeekRange } from "@/lib/utils";
import { Boat, PumpOutRequest, ServiceLevel, DockAssignment, Marina } from "@shared/schema";
import { CalendarPlus, History, AlertCircle, Check, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function MemberDashboard() {
  const { user } = useAuth();

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

  // Get all pump-out requests for the user's boats
  const { data: allRequests, isLoading: isLoadingAllRequests } = useQuery<PumpOutRequest[]>({
    queryKey: ['/api/pump-out-requests/all-boats'],
    queryFn: async () => {
      if (!boats || boats.length === 0) return [];
      
      // Get all pump-out requests for all boats
      const allBoatRequests: PumpOutRequest[] = [];
      
      for (const boat of boats) {
        try {
          const response = await fetch(`/api/pump-out-requests/boat/${boat.id}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const boatRequests = await response.json();
            allBoatRequests.push(...boatRequests);
          }
        } catch (error) {
          console.error(`Error fetching pump-out requests for boat ${boat.id}:`, error);
        }
      }
      
      return allBoatRequests;
    },
    enabled: !!boats && boats.length > 0,
  });

  const { data: serviceLevel, isLoading: isLoadingServiceLevel } = useQuery<ServiceLevel>({
    queryKey: ['/api/service-levels', user?.serviceLevelId],
    queryFn: async () => {
      // Try to get subscription from API first
      try {
        const subResponse = await fetch('/api/users/me/subscription', {
          credentials: 'include'
        });
        
        if (subResponse.ok) {
          const subscription = await subResponse.json();
          
          // Now get the service level details
          if (subscription?.serviceLevelId) {
            const levelResponse = await fetch(`/api/service-levels/${subscription.serviceLevelId}`, {
              credentials: 'include'
            });
            
            if (levelResponse.ok) {
              return levelResponse.json();
            }
          }
        }
        
        // Fall back to user's serviceLevelId if API call fails
        if (user?.serviceLevelId) {
          const response = await fetch(`/api/service-levels/${user.serviceLevelId}`, {
            credentials: 'include'
          });
          if (response.ok) {
            return response.json();
          }
        }
        
        // If all fails, get all service levels and get the second one
        // (which should be the monthly single-head)
        const allLevelsResponse = await fetch('/api/service-levels', {
          credentials: 'include'
        });
        if (allLevelsResponse.ok) {
          const allLevels = await allLevelsResponse.json();
          if (allLevels && allLevels.length > 1) {
            return allLevels[1]; // Return the second service level as fallback
          }
        }
        
        throw new Error('Failed to fetch service level');
      } catch (error) {
        console.error("Error fetching service level:", error);
        throw error;
      }
    },
    enabled: true, // Always try to get service level
  });

  // Get the first boat's ID to fetch its requests
  const primaryBoatId = boats && boats.length > 0 ? boats[0].id : undefined;

  const { data: requests, isLoading: isLoadingRequests } = useQuery<PumpOutRequest[]>({
    queryKey: [`/api/pump-out-requests/boat/${primaryBoatId}`],
    queryFn: async () => {
      try {
        if (!primaryBoatId) {
          throw new Error('No boat ID available');
        }
        
        const response = await fetch(`/api/pump-out-requests/boat/${primaryBoatId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }
        
        return response.json();
      } catch (error) {
        console.error("Error fetching pump out requests:", error);
        return [];
      }
    },
    enabled: !!primaryBoatId,
  });

  // Get dock assignment for the primary boat
  const { data: dockAssignment, isLoading: isLoadingDock } = useQuery<DockAssignment>({
    queryKey: [`/api/dock-assignments/boat/${primaryBoatId}`],
    queryFn: async () => {
      try {
        if (!primaryBoatId) {
          throw new Error('No boat ID available');
        }
        
        const response = await fetch(`/api/dock-assignments/boat/${primaryBoatId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dock assignment');
        }
        
        return response.json();
      } catch (error) {
        console.error("Error fetching dock assignment:", error);
        return null;
      }
    },
    enabled: !!primaryBoatId,
  });

  // Get marina details if we have a dock assignment
  const { data: marina, isLoading: isLoadingMarina } = useQuery<Marina>({
    queryKey: ['/api/marinas', dockAssignment?.marinaId],
    queryFn: async () => {
      try {
        if (!dockAssignment?.marinaId) {
          throw new Error('No marina ID available');
        }
        
        const response = await fetch(`/api/marinas/${dockAssignment.marinaId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch marina');
        }
        
        return response.json();
      } catch (error) {
        console.error("Error fetching marina:", error);
        return null;
      }
    },
    enabled: !!dockAssignment?.marinaId,
  });

  const upcomingRequests = requests?.filter(
    (request) => ['Requested', 'Scheduled', 'Waitlisted'].includes(request.status)
  ).sort((a, b) => new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime());

  const pastRequests = requests?.filter(
    (request) => ['Completed', 'Canceled'].includes(request.status)
  ).sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()).slice(0, 3);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return <Badge className="bg-yellow-500">Scheduled</Badge>;
      case 'Requested':
        return <Badge className="bg-blue-500">Requested</Badge>;
      case 'Completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'Canceled':
        return <Badge className="bg-red-500">Canceled</Badge>;
      case 'Waitlisted':
        return <Badge className="bg-orange-500">Waitlisted</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-600">Paid</Badge>;
      case 'Pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Payment Needed</Badge>;
      case 'Failed':
        return <Badge className="bg-red-500">Payment Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isLoading = isLoadingBoats || isLoadingRequests || isLoadingServiceLevel || isLoadingDock;

  return (
    <>
      <Helmet>
        <title>Dashboard - Poopalotzi</title>
        <meta name="description" content="Manage your boat pump-out services and view upcoming appointments." />
      </Helmet>

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
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-gray-100 h-24 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="animate-pulse">
              <CardHeader className="bg-gray-100 h-12"></CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-100 h-8 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upcoming Services */}
            <Card className="md:col-span-2">
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle className="text-[#0B1F3A]">Upcoming Services</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {upcomingRequests && upcomingRequests.length > 0 ? (
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
                              <h5 className="font-semibold">
                                {boats?.find(b => b.id === request.boatId)?.name || 'Your Boat'}
                              </h5>
                              {marina && (
                                <p className="text-sm text-gray-600">
                                  {marina.name} - Pier {dockAssignment?.pier}, 
                                  Dock {dockAssignment?.dock}
                                </p>
                              )}
                              {request.ownerNotes && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Notes:</span> {request.ownerNotes}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            {request.status === 'Requested' || request.status === 'Scheduled' || request.status === 'Waitlisted' ? (
                              <>
                                {request.paymentStatus === 'Pending' && (
                                  <Link href="/member/service-history">
                                    <Button size="sm" className="bg-[#38B2AC] hover:bg-opacity-90">
                                      Complete Payment
                                    </Button>
                                  </Link>
                                )}
                                <Link href="/member/service-history">
                                  <Button size="sm" variant="outline" className="text-red-700 border-red-200 bg-red-50 hover:bg-red-100">
                                    Cancel
                                  </Button>
                                </Link>
                              </>
                            ) : (
                              <Link href="/member/service-history">
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </Link>
                            )}
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
                    <Link href="/member/request-service">
                      <Button className="bg-[#38B2AC] hover:bg-opacity-90">
                        Schedule a Pump-Out
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Summary */}
            <Card>
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle className="text-[#0B1F3A]">Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Service Plan</h3>
                    <p className="text-lg font-semibold text-[#0B1F3A]">
                      {serviceLevel?.name || 'No active plan'}
                    </p>
                    {serviceLevel && (
                      <>
                        <p className="text-sm text-gray-600">
                          {serviceLevel.type === 'one-time' ? 'Single Service' :
                            serviceLevel.type === 'monthly' ? `Monthly (${serviceLevel.monthlyQuota} services)` :
                            'Seasonal (Unlimited)'}
                        </p>
                        
                        {/* Display remaining pump-out requests count for monthly plans */}
                        {serviceLevel.type === 'monthly' && serviceLevel.monthlyQuota && (
                          <div className="flex items-center mt-1 text-sm">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal">
                              {(() => {
                                // Find requests for the current month
                                const now = new Date();
                                const currentMonth = now.getMonth();
                                const currentYear = now.getFullYear();
                                
                                // Filter requests that are in current month and not canceled
                                const activeRequests = allRequests?.filter(req => {
                                  if (!req.createdAt) return false;
                                  const requestDate = new Date(req.createdAt);
                                  // Explicitly filter out canceled requests
                                  return (
                                    requestDate.getMonth() === currentMonth &&
                                    requestDate.getFullYear() === currentYear &&
                                    req.status !== 'Canceled'
                                  );
                                }) || [];
                                
                                console.log('Active requests (excluding canceled):', activeRequests.length);
                                
                                // Calculate remaining requests
                                const used = activeRequests.length;
                                // Ensure the remaining count is never negative
                                const remaining = Math.max(0, serviceLevel.monthlyQuota - used);
                                
                                return `${remaining} of ${serviceLevel.monthlyQuota} pump-outs remaining`;
                              })()}
                            </Badge>
                          </div>
                        )}
                        {serviceLevel.type === 'monthly' && (
                          <div className="space-y-1 mt-1">
                            <p className="text-xs text-gray-500">
                              {user?.activeMonth ? (
                                <>
                                  {/* Display user's specific selected month */}
                                  {(() => {
                                    const monthNum = parseInt(user.activeMonth) - 1; // Convert to 0-based
                                    const year = new Date().getFullYear();
                                    const startDate = new Date(year, monthNum, 1);
                                    const endDate = new Date(year, monthNum + 1, 0);
                                    return `Valid: ${format(startDate, 'MMMM 1')} - ${format(endDate, 'MMMM d, yyyy')}`;
                                  })()}
                                </>
                              ) : (
                                <>
                                  Valid: {format(new Date(), 'MMMM 1')} - {format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'MMMM d, yyyy')}
                                </>
                              )}
                            </p>
                            {user?.autoRenew && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <Check className="h-3 w-3" />
                                <span>Auto-renewal enabled</span>
                              </div>
                            )}
                          </div>
                        )}
                        {serviceLevel.type === 'seasonal' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Valid: May 1, 2025 - October 31, 2025
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Registered Boats</h3>
                    {boats && boats.length > 0 ? (
                      <ul className="space-y-2 mt-2">
                        {boats.map((boat) => (
                          <li key={boat.id} className="flex justify-between items-center">
                            <span className="font-medium">{boat.name}</span>
                            <span className="text-sm text-gray-600">
                              {boat.make} {boat.model}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center text-gray-600 mt-2">
                        <X className="h-4 w-4 mr-2 text-red-500" />
                        <span>No boats registered</span>
                      </div>
                    )}
                    <Link href="/member/boats" className="inline-block mt-2">
                      <Button variant="outline" size="sm">
                        Manage Boats
                      </Button>
                    </Link>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Service History</h3>
                    {pastRequests && pastRequests.length > 0 ? (
                      <ul className="space-y-2 mt-2">
                        {pastRequests.map((request) => (
                          <li key={request.id} className="flex justify-between items-center">
                            <span className="text-sm">
                              {formatDate(request.weekStartDate)}
                            </span>
                            <div>
                              {getStatusBadge(request.status)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center text-gray-600 mt-2">
                        <X className="h-4 w-4 mr-2 text-red-500" />
                        <span>No past services</span>
                      </div>
                    )}
                    <Link href="/member/service-history" className="inline-block mt-2">
                      <Button variant="outline" size="sm">
                        View All History
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
