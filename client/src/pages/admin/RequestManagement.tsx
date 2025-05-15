import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
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
import { useToast } from "@/hooks/use-toast";
import { Search, Calendar, MoreHorizontal, Camera, Anchor, MapPin } from "lucide-react";
import { format } from "date-fns";

// Mock data until connected to API
const MOCK_MARINAS = [
  { id: 1, name: "Harbor Bay Marina" },
  { id: 2, name: "Sunset Point Marina" },
  { id: 3, name: "Golden Anchor Marina" },
  { id: 4, name: "Cedar Point Marina" },
  { id: 5, name: "Son Rise Marina" },
  { id: 6, name: "Port Clinton Yacht Club" },
  { id: 7, name: "Craft Marine" }
];

// Mock data for pump-out requests
const MOCK_REQUESTS = [
  {
    id: 1,
    boatId: 101,
    boatName: "Sea Breeze",
    ownerName: "John Doe",
    marinaId: 1,
    marinaName: "Harbor Bay Marina",
    dock: "A",
    slip: "12",
    status: "Scheduled",
    weekStartDate: "2025-05-12",
    paymentStatus: "Paid",
    createdAt: "2025-05-08T10:30:00Z",
    notes: "Owner will be on site",
    beforeImageUrl: null,
    duringImageUrl: null,
    afterImageUrl: null
  },
  {
    id: 2,
    boatId: 102,
    boatName: "Wave Runner",
    ownerName: "Jane Smith",
    marinaId: 2,
    marinaName: "Sunset Point Marina",
    dock: "B",
    slip: "24",
    status: "Completed",
    weekStartDate: "2025-05-05",
    paymentStatus: "Paid",
    createdAt: "2025-05-02T14:15:00Z",
    notes: "",
    beforeImageUrl: "/src/assets/sample-before.jpg",
    duringImageUrl: "/src/assets/sample-during.jpg",
    afterImageUrl: "/src/assets/sample-after.jpg"
  },
  {
    id: 3,
    boatId: 103,
    boatName: "Blue Waters",
    ownerName: "Robert Johnson",
    marinaId: 1,
    marinaName: "Harbor Bay Marina",
    dock: "C",
    slip: "08",
    status: "Requested",
    weekStartDate: "2025-05-19",
    paymentStatus: "Pending",
    createdAt: "2025-05-11T09:45:00Z",
    notes: "Please call 30 minutes before arrival",
    beforeImageUrl: null,
    duringImageUrl: null,
    afterImageUrl: null
  },
  {
    id: 4,
    boatId: 104,
    boatName: "Sea Wanderer",
    ownerName: "Emily Chen",
    marinaId: 3,
    marinaName: "Golden Anchor Marina",
    dock: "D",
    slip: "15",
    status: "Waitlisted",
    weekStartDate: "2025-05-12",
    paymentStatus: "Pending",
    createdAt: "2025-05-09T16:20:00Z",
    notes: "",
    beforeImageUrl: null,
    duringImageUrl: null,
    afterImageUrl: null
  },
  {
    id: 5,
    boatId: 105,
    boatName: "Ocean Explorer",
    ownerName: "Michael Brown",
    marinaId: 2,
    marinaName: "Sunset Point Marina",
    dock: "E",
    slip: "03",
    status: "Canceled",
    weekStartDate: "2025-05-05",
    paymentStatus: "Refunded",
    createdAt: "2025-05-01T11:10:00Z",
    notes: "Customer requested cancellation",
    beforeImageUrl: null,
    duringImageUrl: null,
    afterImageUrl: null
  },
  {
    id: 6,
    boatId: 106,
    boatName: "Liberty",
    ownerName: "Thomas Wilson",
    marinaId: 4,
    marinaName: "Cedar Point Marina",
    dock: "F",
    slip: "22",
    status: "Scheduled",
    weekStartDate: "2025-05-19",
    paymentStatus: "Paid",
    createdAt: "2025-05-12T08:30:00Z",
    notes: "Gate code is 1234",
    beforeImageUrl: null,
    duringImageUrl: null,
    afterImageUrl: null
  },
  {
    id: 7,
    boatId: 107,
    boatName: "Water Dream",
    ownerName: "Lisa Parker",
    marinaId: 5,
    marinaName: "Son Rise Marina",
    dock: "G",
    slip: "05",
    status: "Requested",
    weekStartDate: "2025-05-26",
    paymentStatus: "Pending",
    createdAt: "2025-05-15T13:10:00Z",
    notes: "",
    beforeImageUrl: null,
    duringImageUrl: null,
    afterImageUrl: null
  },
];

type StatusType = "Requested" | "Scheduled" | "Completed" | "Canceled" | "Waitlisted";
type PaymentStatusType = "Pending" | "Paid" | "Failed" | "Refunded";

export default function RequestManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [marinaFilter, setMarinaFilter] = useState<string>("all");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<{ url: string | null, type: string }>({ url: null, type: "" });

  // This will be replaced with actual API call for marinas
  const { data: marinas = [] } = useQuery({
    queryKey: ["/api/marinas"],
    queryFn: async () => {
      // Will be replaced with actual API call
      return MOCK_MARINAS;
    },
  });

  // State to track the requests (will be replaced with API later)
  const [requestsData, setRequestsData] = useState(MOCK_REQUESTS);

  // This will be replaced with actual API call for requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["/api/pump-out-requests", { status: statusFilter, week: weekFilter, marina: marinaFilter }],
    queryFn: async () => {
      // This will be replaced with actual API call
      // For now use local state data
      let filteredRequests = requestsData;
      
      if (statusFilter !== "all") {
        filteredRequests = filteredRequests.filter(r => r.status === statusFilter);
      }
      
      if (weekFilter !== "all") {
        filteredRequests = filteredRequests.filter(r => r.weekStartDate === weekFilter);
      }
      
      if (marinaFilter !== "all") {
        filteredRequests = filteredRequests.filter(r => r.marinaId === Number(marinaFilter));
      }
      
      return filteredRequests;
    },
  });

  // Get unique weeks for the filter
  const uniqueWeeks = Array.from(new Set(MOCK_REQUESTS.map(r => r.weekStartDate))).sort();

  const filteredRequests = requests.filter(
    (request) =>
      request.boatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.marinaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${request.dock}-${request.slip}`.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleUpdateStatus = (id: number, newStatus: StatusType) => {
    // Update the local state
    const updatedRequests = requestsData.map(request => 
      request.id === id ? { ...request, status: newStatus } : request
    );
    
    setRequestsData(updatedRequests);
    
    // Invalidate the query to refresh the UI
    queryClient.invalidateQueries({ queryKey: ["/api/pump-out-requests"] });
    
    // Show success message
    toast({
      title: "Status Updated",
      description: `Request #${id} status changed to ${newStatus}`,
    });
    
    // In production this would make an API call
    // Example: await fetch(`/api/pump-out-requests/${id}/status`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ status: newStatus })
    // });
  };

  const handleAssignEmployee = (id: number) => {
    toast({
      title: "Assign Employee",
      description: `Assigning employee to request #${id}`,
    });
    // Will be replaced with actual UI for employee assignment
  };

  const handleViewDetails = (id: number) => {
    toast({
      title: "View Details",
      description: `Viewing details for request #${id}`,
    });
    // Will be replaced with actual UI for detailed view
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

  return (
    <>
      <Helmet>
        <title>Request Management | Poopalotzi</title>
        <meta name="description" content="Manage pump-out service requests and their status" />
      </Helmet>
      
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
            <div>
              <CardTitle className="text-2xl font-bold">Service Request Management</CardTitle>
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
                          Dock/Slip
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
                      <TableHead className="text-center">Images</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.boatName}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{request.marinaName}</span>
                              <span>Dock {request.dock}, Slip {request.slip}</span>
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
                            <div className="flex justify-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewImage(request.beforeImageUrl, "Before")}
                                className={!request.beforeImageUrl ? "opacity-50" : ""}
                                title="Before image"
                              >
                                <Camera className="h-4 w-4 mr-1" />
                                B
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewImage(request.duringImageUrl, "During")}
                                className={!request.duringImageUrl ? "opacity-50" : ""}
                                title="During image"
                              >
                                <Camera className="h-4 w-4 mr-1" />
                                D
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewImage(request.afterImageUrl, "After")}
                                className={!request.afterImageUrl ? "opacity-50" : ""}
                                title="After image"
                              >
                                <Camera className="h-4 w-4 mr-1" />
                                A
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
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
    </>
  );
}