import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PumpOutRequest, Boat } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Calendar, Ship, FileText, AlertCircle } from "lucide-react";
import { formatDate, formatWeekRange } from "@/lib/utils";
import PaymentForm from "@/components/member/PaymentForm";
import { useToast } from "@/hooks/use-toast";

interface RequestDetailProps {
  request: PumpOutRequest;
  boat?: Boat;
  onClose: () => void;
  onCancel?: (requestId: number) => void;
}

const RequestDetail = ({ request, boat, onClose }: RequestDetailProps) => {
  // This would fetch additional details about the request
  const { data: logs } = useQuery({
    queryKey: [`/api/pump-out-logs/${request.id}`],
    queryFn: undefined,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Request Details</h3>
          <p className="text-lg font-semibold text-[#0B1F3A]">Week of {formatDate(request.weekStartDate)}</p>
          <p className="text-gray-600">{formatWeekRange(request.weekStartDate)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Boat</h3>
          <p className="text-lg font-semibold text-[#0B1F3A]">{boat?.name || 'Unknown Boat'}</p>
          <p className="text-gray-600">{boat?.make} {boat?.model}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
        <div className="flex flex-wrap gap-2">
          <Badge className={
            request.status === 'Completed' ? 'bg-green-600' :
            request.status === 'Scheduled' ? 'bg-yellow-500' :
            request.status === 'Requested' ? 'bg-blue-500' :
            request.status === 'Canceled' ? 'bg-red-500' :
            request.status === 'Waitlisted' ? 'bg-orange-500' : ''
          }>{request.status}</Badge>
          
          <Badge variant={request.paymentStatus === 'Paid' ? 'default' : 'outline'} className={
            request.paymentStatus === 'Paid' ? 'bg-green-600' :
            request.paymentStatus === 'Pending' ? 'border-yellow-500 text-yellow-700' :
            request.paymentStatus === 'Failed' ? 'bg-red-500' :
            request.paymentStatus === 'Refunded' ? 'bg-purple-500' : ''
          }>{request.paymentStatus}</Badge>
        </div>
      </div>

      {request.ownerNotes && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Your Notes</h3>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">{request.ownerNotes}</p>
        </div>
      )}

      {request.adminNotes && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Service Notes</h3>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">{request.adminNotes}</p>
        </div>
      )}

      {logs && logs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Service Log</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Change</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.changeTimestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center">
                        {log.prevStatus && (
                          <>
                            <Badge variant="outline" className="mr-2">
                              {log.prevStatus}
                            </Badge>
                            <span className="text-gray-500 mx-1">→</span>
                          </>
                        )}
                        <Badge>
                          {log.newStatus}
                        </Badge>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Service Photos */}
      {(request.status === 'Completed' && (logs?.some((log: any) => log.beforeUrl || log.duringUrl || log.afterUrl))) ? (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Service Photos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {logs?.find((log: any) => log.beforeUrl) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Before</p>
                <img 
                  src={logs.find((log: any) => log.beforeUrl).beforeUrl} 
                  alt="Before service" 
                  className="w-full h-auto rounded-md"
                />
              </div>
            )}
            {logs?.find((log: any) => log.duringUrl) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">During</p>
                <img 
                  src={logs.find((log: any) => log.duringUrl).duringUrl} 
                  alt="During service" 
                  className="w-full h-auto rounded-md"
                />
              </div>
            )}
            {logs?.find((log: any) => log.afterUrl) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">After</p>
                <img 
                  src={logs.find((log: any) => log.afterUrl).afterUrl} 
                  alt="After service" 
                  className="w-full h-auto rounded-md"
                />
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex justify-between pt-4">
        {['Requested', 'Scheduled', 'Waitlisted'].includes(request.status) && (
          <Button 
            variant="outline" 
            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            onClick={() => {
              // First close the detail view
              onClose();
              
              // Then confirm with user before canceling
              if (confirm("Are you sure you want to cancel this pump-out service request?")) {
                // Show user we're processing
                setIsCanceling(true);
                
                // Make the API call to cancel the request
                fetch(`/api/pump-out-requests/${request.id}/status`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ status: 'Canceled' }),
                  credentials: 'include'
                })
                .then(async response => {
                  const data = await response.json();
                  
                  if (!response.ok) {
                    console.error("Server error:", data);
                    throw new Error(data.message || 'Failed to cancel request');
                  }
                  
                  // Success! Show toast and reload
                  toast({
                    title: "Request Canceled",
                    description: "Your pump-out service request has been successfully canceled.",
                    variant: "default",
                  });
                  
                  // Reload the page to show the updated status
                  setTimeout(() => window.location.reload(), 1000);
                })
                .catch(err => {
                  console.error("Error canceling request:", err);
                  toast({
                    title: "Cancellation Failed",
                    description: err.message || "There was a problem canceling your request. Please try again.",
                    variant: "destructive",
                  });
                })
                .finally(() => {
                  setIsCanceling(false);
                });
              }
            }}
          >
            Cancel Request
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>Close Details</Button>
      </div>
    </div>
  );
};

export default function ServiceHistory() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<PumpOutRequest | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState<boolean>(false);

  // Fetch boats first
  const { data: boats } = useQuery<Boat[]>({
    queryKey: ['/api/boats'],
    queryFn: undefined,
  });

  // Fetch service history for all boats owned by the member
  const { data: requests, isLoading } = useQuery<PumpOutRequest[]>({
    queryKey: ['/api/pump-out-requests/member'],
    queryFn: async () => {
      if (!boats || boats.length === 0) return [];
      
      // Fetch requests for all boats and combine them
      const allRequests: PumpOutRequest[] = [];
      
      for (const boat of boats) {
        const response = await fetch(`/api/pump-out-requests/boat/${boat.id}`);
        if (response.ok) {
          const boatRequests = await response.json();
          allRequests.push(...boatRequests);
        }
      }
      
      return allRequests;
    },
    enabled: !!boats && boats.length > 0,
  });

  // Fetch service levels for payment
  const { data: serviceLevel } = useQuery({
    queryKey: ['/api/service-levels/current'],
    queryFn: undefined,
  });

  const filteredRequests = requests?.filter(request => {
    // Apply text search if any
    const matchesSearch = !searchQuery || 
      formatDate(request.weekStartDate).toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      boats?.find(boat => boat.id === request.boatId)?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter if any
    const matchesStatus = !statusFilter || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: "Your payment has been processed successfully.",
    });
    setShowPaymentModal(false);
  };

  const getBoatById = (boatId?: number) => {
    return boats?.find(boat => boat.id === boatId);
  };

  return (
    <>
      <Helmet>
        <title>Service History - Poopalotzi</title>
        <meta name="description" content="View your boat pump-out service history" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0B1F3A]">Service History</h1>
            <p className="text-gray-600">
              View your past and upcoming pump-out services
            </p>
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search services..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={statusFilter === null ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setStatusFilter(null)}
                  className={statusFilter === null ? "bg-[#38B2AC]" : ""}
                >
                  All
                </Button>
                <Button 
                  variant={statusFilter === "Scheduled" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setStatusFilter("Scheduled")}
                  className={statusFilter === "Scheduled" ? "bg-yellow-500" : ""}
                >
                  Scheduled
                </Button>
                <Button 
                  variant={statusFilter === "Completed" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setStatusFilter("Completed")}
                  className={statusFilter === "Completed" ? "bg-green-600" : ""}
                >
                  Completed
                </Button>
                <Button 
                  variant={statusFilter === "Waitlisted" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setStatusFilter("Waitlisted")}
                  className={statusFilter === "Waitlisted" ? "bg-orange-500" : ""}
                >
                  Waitlisted
                </Button>
                <Button 
                  variant={statusFilter === "Canceled" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setStatusFilter("Canceled")}
                  className={statusFilter === "Canceled" ? "bg-red-500" : ""}
                >
                  Canceled
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-[#F4EBD0]">
            <CardTitle>Your Pump-Out Services</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-[#38B2AC] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your service history...</p>
              </div>
            ) : filteredRequests && filteredRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Boat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{formatDate(request.weekStartDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Ship className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{getBoatById(request.boatId)?.name || "Unknown Boat"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          request.status === 'Completed' ? 'bg-green-600' :
                          request.status === 'Scheduled' ? 'bg-yellow-500' :
                          request.status === 'Requested' ? 'bg-blue-500' :
                          request.status === 'Canceled' ? 'bg-red-500' :
                          request.status === 'Waitlisted' ? 'bg-orange-500' : ''
                        }>{request.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.paymentStatus === 'Paid' ? 'default' : 'outline'} className={
                          request.paymentStatus === 'Paid' ? 'bg-green-600' :
                          request.paymentStatus === 'Pending' ? 'border-yellow-500 text-yellow-700' :
                          request.paymentStatus === 'Failed' ? 'bg-red-500' :
                          request.paymentStatus === 'Refunded' ? 'bg-purple-500' : ''
                        }>{request.paymentStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {request.paymentStatus === 'Pending' && (
                            <Button 
                              size="sm" 
                              className="bg-[#38B2AC]"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowPaymentModal(true);
                              }}
                            >
                              Pay
                            </Button>
                          )}
                          
                          {['Requested', 'Scheduled', 'Waitlisted'].includes(request.status) && (
                            <Button 
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          )}
                          
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center">
                <Ship className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Service History</h3>
                <p className="text-gray-500 mb-4">You haven't requested any pump-out services yet.</p>
                <Button className="bg-[#38B2AC]" asChild>
                  <a href="/member/request-service">Schedule Your First Pump-Out</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest && !showPaymentModal} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
            <DialogDescription>
              Details for your pump-out service request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <RequestDetail 
              request={selectedRequest} 
              boat={getBoatById(selectedRequest.boatId)}
              onClose={() => setSelectedRequest(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Process payment for your pump-out service
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && serviceLevel && (
            <PaymentForm 
              selectedRequest={selectedRequest}
              serviceLevel={serviceLevel}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
