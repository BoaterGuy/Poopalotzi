import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PumpOutRequest, Boat } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Search, Calendar, Ship, FileText, AlertCircle, Edit } from "lucide-react";
import { formatDate, formatWeekRange } from "@/lib/utils";
import PaymentForm from "@/components/member/PaymentForm";
import { useToast } from "@/hooks/use-toast";

interface EditRequestFormProps {
  request: PumpOutRequest;
  boat?: Boat;
  onClose: () => void;
  onSave: (updatedRequest: Partial<PumpOutRequest>) => void;

const EditRequestForm = ({ request, boat, onClose, onSave }: EditRequestFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    weekStartDate: request.weekStartDate,
    ownerNotes: request.ownerNotes || '',
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/pump-out-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update request');

      const updatedRequest = await response.json();
      onSave(updatedRequest);
      
      toast({
        title: "Request Updated",
        description: "Your pump-out service request has been successfully updated.",
      
      onClose();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "There was a problem updating your request. Please try again.",
        variant: "destructive",
    } finally {
      setIsSubmitting(false);
  };

  const statusColor = {
    'Requested': 'bg-yellow-100 text-yellow-800',
    'Scheduled': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'Canceled': 'bg-red-100 text-red-800',
    'Waitlisted': 'bg-orange-100 text-orange-800'
  }[request.status] || 'bg-gray-100 text-gray-800';

  const paymentStatusColor = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Paid': 'bg-green-100 text-green-800',
    'Failed': 'bg-red-100 text-red-800',
    'Refunded': 'bg-blue-100 text-blue-800'
  }[request.paymentStatus] || 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Edit Pump-out Request
        </h3>
        <div className="flex items-center gap-2">
          <Badge className={statusColor}>
            {request.status}
          </Badge>
          <Badge className={paymentStatusColor}>
            {request.paymentStatus}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="requestId">Request ID</Label>
            <Input
              id="requestId"
              value={request.id}
              disabled
              className="bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="createdDate">Created Date</Label>
            <Input
              id="createdDate"
              value={request.createdAt ? formatDate(new Date(request.createdAt)) : 'Unknown'}
              disabled
              className="bg-gray-50"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="weekStartDate">Service Week Starting *</Label>
          <Input
            id="weekStartDate"
            type="date"
            value={formData.weekStartDate}
            onChange={(e) => setFormData(prev => ({ ...prev, weekStartDate: e.target.value }))}
            required
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-sm text-gray-500 mt-1">
            Current: {formatWeekRange(request.weekStartDate)}
          </p>
        </div>

        <div>
          <Label htmlFor="ownerNotes">Your Notes</Label>
          <Textarea
            id="ownerNotes"
            value={formData.ownerNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, ownerNotes: e.target.value }))}
            placeholder="Add any special instructions or notes for the service team..."
            rows={3}
          />
        </div>

        {boat && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Boat Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Boat Name</Label>
                <Input value={boat.name} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Make & Model</Label>
                <Input value={`${boat.make} ${boat.model}`} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Year</Label>
                <Input value={boat.year.toString()} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Length</Label>
                <Input value={`${boat.length} ft`} disabled className="bg-gray-50" />
              </div>
            </div>
          </div>
        )}

        {request.adminNotes && (
          <div className="border-t pt-4">
            <Label>Admin Notes</Label>
            <div className="text-base bg-blue-50 p-3 rounded-md border">
              {request.adminNotes}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default function ServiceHistory() {
  const { toast } = useToast();
  // React Query removed
  const [selectedRequest, setSelectedRequest] = useState<PumpOutRequest | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState<boolean>(false);
  const [cancelRequestId, setCancelRequestId] = useState<number | null>(null);

  // Fetch boats first
  // React Query removed
    queryFn: undefined,

  // Fetch service history for all boats owned by the member
  // React Query removed
    queryFn: async () => {
      if (!boats || boats.length === 0) return [];
      
      // Fetch requests for all boats and combine them
      const allRequests: PumpOutRequest[] = [];
      
      for (const boat of boats) {
        const response = await fetch(`/api/pump-out-requests/boat/${boat.id}`, {
          credentials: 'include'
        if (response.ok) {
          const boatRequests = await response.json();
          allRequests.push(...boatRequests);
      
      return allRequests;
    },

  // Fetch service levels for payment
  // React Query removed
    queryFn: undefined,

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
    setShowPaymentModal(false);
  };

  const getBoatById = (boatId?: number) => {
    return boats?.find(boat => boat.id === boatId);
  };

  const handleCancelRequest = async (requestId: number) => {
    setIsCanceling(true);
    try {
      const response = await fetch(`/api/pump-out-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Canceled' }),
        credentials: 'include'

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel request');
      
      toast({
        title: "Request Canceled",
        description: "Your pump-out service request has been successfully canceled.",
      
      // Refresh the data
      
    } catch (err: any) {
      toast({
        title: "Cancellation Failed",
        description: err.message || "There was a problem canceling your request. Please try again.",
        variant: "destructive",
    } finally {
      setIsCanceling(false);
      setCancelRequestId(null);
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
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={isCanceling}
                                >
                                  {isCanceling && cancelRequestId === request.id ? 'Canceling...' : 'Cancel'}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Pump-Out Request</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this pump-out service request for {getBoatById(request.boatId)?.name}? 
                                    {request.paymentStatus === 'Paid' && ' Your payment will be refunded as credits to your account.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Request</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      setCancelRequestId(request.id);
                                      handleCancelRequest(request.id);
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Cancel Request
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
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

      {/* Edit Request Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
            <DialogDescription>
              Modify your pump-out service request details
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <EditRequestForm 
              request={selectedRequest} 
              boat={getBoatById(selectedRequest.boatId)}
              onClose={() => {
                setShowEditModal(false);
                setSelectedRequest(null);
              }}
              onSave={() => {
                setShowEditModal(false);
                setSelectedRequest(null);
              }}
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
          
          {selectedRequest && selectedRequest.id && serviceLevel && (
            <PaymentForm 
              requestId={selectedRequest.id}
              amount={serviceLevel.price}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
