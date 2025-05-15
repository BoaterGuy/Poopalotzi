import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Calendar, MoreHorizontal, Clock } from "lucide-react";
import { format } from "date-fns";

// Mock data until connected to API
const MOCK_REQUESTS = [
  {
    id: 1,
    boatId: 101,
    boatName: "Sea Breeze",
    ownerName: "John Doe",
    marinaName: "Harbor Bay Marina",
    slip: "A-12",
    status: "Scheduled",
    weekStartDate: "2025-05-12",
    paymentStatus: "Paid",
    createdAt: "2025-05-08T10:30:00Z",
    notes: "Owner will be on site",
  },
  {
    id: 2,
    boatId: 102,
    boatName: "Wave Runner",
    ownerName: "Jane Smith",
    marinaName: "Sunset Point Marina",
    slip: "B-24",
    status: "Completed",
    weekStartDate: "2025-05-05",
    paymentStatus: "Paid",
    createdAt: "2025-05-02T14:15:00Z",
    notes: "",
  },
  {
    id: 3,
    boatId: 103,
    boatName: "Blue Waters",
    ownerName: "Robert Johnson",
    marinaName: "Harbor Bay Marina",
    slip: "C-08",
    status: "Requested",
    weekStartDate: "2025-05-19",
    paymentStatus: "Pending",
    createdAt: "2025-05-11T09:45:00Z",
    notes: "Please call 30 minutes before arrival",
  },
  {
    id: 4,
    boatId: 104,
    boatName: "Sea Wanderer",
    ownerName: "Emily Chen",
    marinaName: "Golden Anchor Marina",
    slip: "D-15",
    status: "Waitlisted",
    weekStartDate: "2025-05-12",
    paymentStatus: "Pending",
    createdAt: "2025-05-09T16:20:00Z",
    notes: "",
  },
  {
    id: 5,
    boatId: 105,
    boatName: "Ocean Explorer",
    ownerName: "Michael Brown",
    marinaName: "Sunset Point Marina",
    slip: "E-03",
    status: "Canceled",
    weekStartDate: "2025-05-05",
    paymentStatus: "Refunded",
    createdAt: "2025-05-01T11:10:00Z",
    notes: "Customer requested cancellation",
  },
];

type StatusType = "Requested" | "Scheduled" | "Completed" | "Canceled" | "Waitlisted";
type PaymentStatusType = "Pending" | "Paid" | "Failed" | "Refunded";

export default function RequestManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");

  // This will be replaced with actual API call
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["/api/pump-out-requests", { status: statusFilter, week: weekFilter }],
    queryFn: async () => {
      // This will be replaced with actual API call
      // For now return mock data
      let filteredRequests = MOCK_REQUESTS;
      
      if (statusFilter !== "all") {
        filteredRequests = filteredRequests.filter(r => r.status === statusFilter);
      }
      
      if (weekFilter !== "all") {
        filteredRequests = filteredRequests.filter(r => r.weekStartDate === weekFilter);
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
      request.slip.toLowerCase().includes(searchQuery.toLowerCase())
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
    toast({
      title: "Status Updated",
      description: `Request #${id} status changed to ${newStatus}`,
    });
    // Will be replaced with actual API call
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

  return (
    <>
      <Helmet>
        <title>Request Management | Poopalazi</title>
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
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by boat, owner or slip..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
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
                
                <Select
                  value={weekFilter}
                  onValueChange={setWeekFilter}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by week" />
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
                      <TableHead>ID</TableHead>
                      <TableHead>Boat</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Marina & Slip</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Week
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          Created
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          No requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>#{request.id}</TableCell>
                          <TableCell className="font-medium">{request.boatName}</TableCell>
                          <TableCell>{request.ownerName}</TableCell>
                          <TableCell>
                            {request.marinaName}, Slip {request.slip}
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
                            {format(new Date(request.createdAt), "MMM d, yyyy")}
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
                                
                                {request.status !== "Completed" && request.status !== "Canceled" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Update Status</DropdownMenuLabel>
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
                                  </>
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
    </>
  );
}