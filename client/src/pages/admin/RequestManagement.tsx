import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Calendar, MoreHorizontal, Camera, Anchor, MapPin, User, Pencil } from "lucide-react";
import PoopalotziSinglePersonIcon from "@/assets/poopalotzi-01_edited.png";
import { format } from "date-fns";

// Define types for our data structures
type StatusType = "Requested" | "Scheduled" | "Completed" | "Canceled" | "Waitlisted";
type PaymentStatusType = "Pending" | "Paid" | "Failed" | "Refunded";

interface RequestType {
  id: number;
  boatId: number;
  boatName: string;
  ownerName: string;
  ownerId: number | null;
  marinaId: number;
  marinaName: string;
  pier: string;
  dock: string;
  status: StatusType;
  weekStartDate: string;
  paymentStatus: PaymentStatusType;
  createdAt: string;
  notes: string;
  beforeImageUrl: string | null;
  duringImageUrl: string | null;
  afterImageUrl: string | null;
  boatNotes: string | null;
  adminNotes: string | null;
  canBeDoneByOnePerson: boolean;
}

interface MarinaType {
  id: number;
  name: string;
}

export default function RequestManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [marinaFilter, setMarinaFilter] = useState<string>("all");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<{ url: string | null, type: string }>({ url: null, type: "" });
  
  // State for request details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestType | null>(null);
  
  // State for admin notes editing
  const [adminNotesDialogOpen, setAdminNotesDialogOpen] = useState(false);
  const [editingAdminNotes, setEditingAdminNotes] = useState<{id: number, notes: string} | null>(null);
  const [adminNotesValue, setAdminNotesValue] = useState("");
  
  // WebSocket connection for real-time updates
  const wsRef = useRef<WebSocket | null>(null);
  
  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connectWebSocket = () => {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected for admin updates');
        // Subscribe to admin updates
        wsRef.current?.send(JSON.stringify({ type: 'subscribe_admin' }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'pump_out_request_created') {
            // Invalidate queries to refetch fresh data
            queryClient.invalidateQueries({ queryKey: ["/api/pump-out-requests"] });
            
            // Show notification
            toast({
              title: "New Service Request",
              description: "A new pump-out request has been submitted and requires attention.",
            });
          } else if (data.type === 'pump_out_request_updated') {
            // Invalidate queries to refetch fresh data
            queryClient.invalidateQueries({ queryKey: ["/api/pump-out-requests"] });
            
            // Show notification for status changes
            const statusMessage = data.status === 'Canceled' ? 'A service request has been canceled.' :
                                 data.status === 'Completed' ? 'A service request has been completed.' :
                                 data.status === 'Scheduled' ? 'A service request has been scheduled.' :
                                 'A service request status has been updated.';
            
            toast({
              title: "Request Updated",
              description: statusMessage,
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed, attempting to reconnect...');
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };
    
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient, toast]);

  // Fetch marinas from the database
  const { data: marinasData, isLoading: marinasLoading } = useQuery({
    queryKey: ["/api/marinas"],
    queryFn: async () => {
      const response = await fetch('/api/marinas');
      if (!response.ok) throw new Error('Failed to fetch marinas');
      return await response.json();
    }
  });
  
  const marinas: MarinaType[] = marinasData || [];
  
  // Fetch pump-out requests from the database
  const { data, isLoading } = useQuery({
    queryKey: ["/api/pump-out-requests"]
  });
  
  // Get unique weeks for the filter from the actual data
  const uniqueWeeks = Array.from(new Set((data || []).map(r => r.weekStartDate))).sort();

  // Apply filters starting with an empty array to ensure no mock data
  // Create a reference to our database data only
  let filteredRequests = data ? [...data] : [];
  
  // Apply status filter
  if (statusFilter !== "all") {
    filteredRequests = filteredRequests.filter(r => r.status === statusFilter);
  }
  
  // Apply week filter
  if (weekFilter !== "all") {
    filteredRequests = filteredRequests.filter(r => r.weekStartDate === weekFilter);
  }
  
  // Apply marina filter
  if (marinaFilter !== "all") {
    filteredRequests = filteredRequests.filter(r => r.marinaId === Number(marinaFilter));
  }
  
  // Apply search filter
  filteredRequests = filteredRequests.filter(
    (request) =>
      request.boatName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.marinaName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${request.dock || ''}-${request.slip || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-500";
      case "Completed":
        return "bg-green-500";
      case "Canceled":
        return "bg-red-500";
      case "Waitlisted":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPaymentStatusColor = (status: PaymentStatusType) => {
    switch (status) {
      case "Paid":
        return "bg-green-500";
      case "Pending":
        return "bg-yellow-500";
      case "Failed":
        return "bg-red-500";
      case "Refunded":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatWeekDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `Week of ${format(date, "MMM d, yyyy")}`;
  };

  const handleUpdateStatus = async (id: number, newStatus: StatusType) => {
    try {
      // First make the API call to update the database
      const response = await fetch(`/api/pump-out-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }
      
      // Invalidate and refetch the data from the server
      queryClient.invalidateQueries({ queryKey: ["/api/pump-out-requests"] });
      
      // Show success message
      toast({
        title: "Status Updated",
        description: `Request #${id} status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      
      // Show error message
      toast({
        title: "Update Failed",
        description: "Failed to update the request status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAssignEmployee = (id: number) => {
    toast({
      title: "Assign Employee",
      description: `Assigning employee to request #${id}`,
    });
    // Will be replaced with actual UI for employee assignment
  };

  const handleViewDetails = (id: number) => {
    const request = (data || []).find(req => req.id === id);
    if (request) {
      setSelectedRequest(request);
      setDetailsDialogOpen(true);
    } else {
      toast({
        title: "Request Not Found",
        description: `Could not find request #${id}`,
        variant: "destructive",
      });
    }
  };

  const handleViewImage = (url: string | null, type: string) => {
    if (url) {
      setCurrentImage({ url, type });
      setImageDialogOpen(true);
    } else {
      toast({
        title: "No Image Available",
        description: `No ${type} image has been uploaded yet.`,
        variant: "destructive",
      });
    }
  };

  const handleEditAdminNotes = (requestId: number, currentNotes: string) => {
    setEditingAdminNotes({ id: requestId, notes: currentNotes });
    setAdminNotesValue(currentNotes);
    setAdminNotesDialogOpen(true);
  };

  const handleSaveAdminNotes = async () => {
    if (!editingAdminNotes) return;
    
    try {
      // Find the request to get the boat ID
      const request = (data || []).find(r => r.id === editingAdminNotes.id);
      if (!request) {
        throw new Error('Request not found');
      }

      const response = await fetch(`/api/boats/${request.boatId}/admin-notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: adminNotesValue })
      });

      if (!response.ok) {
        throw new Error('Failed to update admin notes');
      }

      // Invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/pump-out-requests"] });
      
      // Close dialog and reset state
      setAdminNotesDialogOpen(false);
      setEditingAdminNotes(null);
      setAdminNotesValue("");
      
      toast({
        title: "Admin Notes Updated",
        description: "The admin notes have been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating admin notes:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update admin notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Pump-Out Request List | Poopalotzi</title>
        <meta name="description" content="Manage pump-out service requests and their status" />
      </Helmet>
      
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
            <div>
              <CardTitle className="text-2xl font-bold">Pump-Out Request List</CardTitle>
              <CardDescription>
                Manage pump-out service requests and their status
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by boat, slip..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
                {/* Marina Filter */}
                <Select
                  value={marinaFilter}
                  onValueChange={setMarinaFilter}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by marina">
                      <div className="flex items-center">
                        <Anchor className="mr-2 h-4 w-4" />
                        {marinaFilter === "all" ? "All Marinas" : marinas.find(m => m.id.toString() === marinaFilter)?.name}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Marinas</SelectItem>
                    {marinas.map(marina => (
                      <SelectItem key={marina.id} value={marina.id.toString()}>
                        {marina.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Requested">Requested</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Canceled">Canceled</SelectItem>
                    <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Week Filter */}
                <Select
                  value={weekFilter}
                  onValueChange={setWeekFilter}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by week">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        {weekFilter === "all" ? "All Weeks" : formatWeekDate(weekFilter)}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Weeks</SelectItem>
                    {uniqueWeeks.map(week => (
                      <SelectItem key={week} value={week}>
                        {formatWeekDate(week)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">Loading requests...</div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Boat Name</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4" />
                          Pier/Dock
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Week Requested
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Docking Direction</TableHead>
                      <TableHead>Tie Up Side</TableHead>
                      <TableHead>Pump-Out Ports</TableHead>
                      <TableHead>Request Notes</TableHead>
                      <TableHead>Boat Notes</TableHead>
                      <TableHead>Admin Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center">
                          No requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {request.canBeDoneByOnePerson && (
                                <div className="flex-shrink-0" title="Can be done by one person">
                                  <img src={PoopalotziSinglePersonIcon} alt="Single Person Capability" className="h-5 w-5" />
                                </div>
                              )}
                              <div>
                                {request.ownerId ? (
                                  <Link to={`/admin/customers?highlight=${request.ownerId}`}>
                                    <Button variant="link" className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800">
                                      <User className="h-4 w-4 mr-1" />
                                      {request.boatName}
                                    </Button>
                                  </Link>
                                ) : (
                                  <span className="text-gray-500">{request.boatName}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{request.marinaName}</span>
                              <span>Pier {request.pier}, Dock {request.dock}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatWeekDate(request.weekStartDate)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(request.status as StatusType)} text-white`}
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getPaymentStatusColor(request.paymentStatus as PaymentStatusType)} text-white`}
                            >
                              {request.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {request.dockingDirection || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {request.tieUpSide || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {request.pumpPortLocations && request.pumpPortLocations.length > 0 
                                ? request.pumpPortLocations.join(", ") 
                                : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={request.notes || ""}>
                              {request.notes || "No notes"}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={request.boatNotes || ""}>
                              {request.boatNotes || "No notes"}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex items-center gap-2">
                              <div className="truncate" title={request.adminNotes || ""}>
                                {request.adminNotes || "No admin notes"}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleEditAdminNotes(request.id, request.adminNotes || "")}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 bg-[#D2B48C] text-black hover:bg-[#C4A87A] rounded-full"
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewDetails(request.id)}>
                                  View Details
                                </DropdownMenuItem>
                                
                                {/* Admin can change to any status */}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                {request.status !== "Requested" && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, "Requested")}>
                                    Mark as Requested
                                  </DropdownMenuItem>
                                )}
                                {request.status !== "Scheduled" && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, "Scheduled")}>
                                    Mark as Scheduled
                                  </DropdownMenuItem>
                                )}
                                {request.status !== "Completed" && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, "Completed")}>
                                    Mark as Completed
                                  </DropdownMenuItem>
                                )}
                                {request.status !== "Canceled" && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, "Canceled")}>
                                    Mark as Canceled
                                  </DropdownMenuItem>
                                )}
                                {request.status !== "Waitlisted" && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, "Waitlisted")}>
                                    Mark as Waitlisted
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuSeparator />
                                {(request.status === "Requested" || request.status === "Scheduled") && (
                                  <DropdownMenuItem onClick={() => handleAssignEmployee(request.id)}>
                                    Assign Employee
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentImage.type} Image</DialogTitle>
            <DialogDescription>
              Photo taken {currentImage.type.toLowerCase()} the pump-out service.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {currentImage.url && (
              <img 
                src={currentImage.url} 
                alt={`${currentImage.type} pump-out service`} 
                className="max-h-[60vh] object-contain rounded-md" 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Request Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Detailed information about this service request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Boat Information</h3>
                    <div className="border rounded-lg p-4 mt-2 space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedRequest.boatName}</p>
                      <p><span className="font-medium">Owner:</span> {selectedRequest.ownerName}</p>
                      <p><span className="font-medium">ID:</span> #{selectedRequest.boatId}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">Location</h3>
                    <div className="border rounded-lg p-4 mt-2 space-y-2">
                      <p><span className="font-medium">Marina:</span> {selectedRequest.marinaName}</p>
                      <p><span className="font-medium">Pier:</span> {selectedRequest.pier}</p>
                      <p><span className="font-medium">Dock:</span> {selectedRequest.dock}</p>
                    </div>
                  </div>
                </div>
                
                {/* Right column */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Service Information</h3>
                    <div className="border rounded-lg p-4 mt-2 space-y-2">
                      <p><span className="font-medium">Status:</span> 
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(selectedRequest.status)} text-white ml-2`}
                        >
                          {selectedRequest.status}
                        </Badge>
                      </p>
                      <p><span className="font-medium">Payment:</span> 
                        <Badge
                          variant="outline"
                          className={`${getPaymentStatusColor(selectedRequest.paymentStatus)} text-white ml-2`}
                        >
                          {selectedRequest.paymentStatus}
                        </Badge>
                      </p>
                      <p><span className="font-medium">Week Requested:</span> {formatWeekDate(selectedRequest.weekStartDate)}</p>
                      <p><span className="font-medium">Created:</span> {format(new Date(selectedRequest.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">Notes</h3>
                    <div className="border rounded-lg p-4 mt-2">
                      {selectedRequest.notes ? (
                        <p>{selectedRequest.notes}</p>
                      ) : (
                        <p className="text-muted-foreground italic">No notes provided</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Images section */}
              <div>
                <h3 className="text-lg font-semibold">Service Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="border rounded-lg p-4 flex flex-col items-center">
                    <h4 className="font-medium mb-2">Before</h4>
                    {selectedRequest.beforeImageUrl ? (
                      <div className="relative h-40 w-full">
                        <img 
                          src={selectedRequest.beforeImageUrl} 
                          alt="Before service" 
                          className="h-full w-full object-cover rounded-md cursor-pointer"
                          onClick={() => handleViewImage(selectedRequest.beforeImageUrl, "Before")}
                        />
                      </div>
                    ) : (
                      <div className="h-40 w-full flex items-center justify-center bg-muted rounded-md">
                        <p className="text-muted-foreground text-sm">No image</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-4 flex flex-col items-center">
                    <h4 className="font-medium mb-2">During</h4>
                    {selectedRequest.duringImageUrl ? (
                      <div className="relative h-40 w-full">
                        <img 
                          src={selectedRequest.duringImageUrl} 
                          alt="During service" 
                          className="h-full w-full object-cover rounded-md cursor-pointer"
                          onClick={() => handleViewImage(selectedRequest.duringImageUrl, "During")}
                        />
                      </div>
                    ) : (
                      <div className="h-40 w-full flex items-center justify-center bg-muted rounded-md">
                        <p className="text-muted-foreground text-sm">No image</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-4 flex flex-col items-center">
                    <h4 className="font-medium mb-2">After</h4>
                    {selectedRequest.afterImageUrl ? (
                      <div className="relative h-40 w-full">
                        <img 
                          src={selectedRequest.afterImageUrl} 
                          alt="After service" 
                          className="h-full w-full object-cover rounded-md cursor-pointer"
                          onClick={() => handleViewImage(selectedRequest.afterImageUrl, "After")}
                        />
                      </div>
                    ) : (
                      <div className="h-40 w-full flex items-center justify-center bg-muted rounded-md">
                        <p className="text-muted-foreground text-sm">No image</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDetailsDialogOpen(false)}
                >
                  Close
                </Button>
                
                {selectedRequest.status !== "Completed" && selectedRequest.status !== "Canceled" && (
                  <Button 
                    onClick={() => {
                      handleUpdateStatus(selectedRequest.id, "Completed");
                      setDetailsDialogOpen(false);
                    }}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Admin Notes Dialog */}
      <Dialog open={adminNotesDialogOpen} onOpenChange={setAdminNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin Notes</DialogTitle>
            <DialogDescription>
              Add or update admin-only notes for this boat. These notes are only visible to admin users.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="admin-notes" className="block text-sm font-medium mb-2">
                Admin Notes
              </label>
              <Textarea
                id="admin-notes"
                value={adminNotesValue}
                onChange={(e) => setAdminNotesValue(e.target.value)}
                className="resize-none"
                rows={4}
                placeholder="Enter admin-only notes about this boat..."
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setAdminNotesDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAdminNotes}>
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}