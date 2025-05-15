import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { format, startOfWeek, addDays, parseISO, isSameDay } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, MapPin, Calendar as CalendarIcon, Sailboat } from "lucide-react";

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
    scheduledDate: "2025-05-14", // Wednesday
    scheduledTime: "09:00",
    paymentStatus: "Paid",
    createdAt: "2025-05-08T10:30:00Z",
    notes: "Owner will be on site",
    assignedEmployees: ["Emma Wilson"]
  },
  {
    id: 2,
    boatId: 102,
    boatName: "Wave Runner",
    ownerName: "Jane Smith",
    marinaName: "Sunset Point Marina",
    slip: "B-24",
    status: "Completed",
    weekStartDate: "2025-05-12",
    scheduledDate: "2025-05-15", // Thursday
    scheduledTime: "10:30",
    paymentStatus: "Paid",
    createdAt: "2025-05-02T14:15:00Z",
    notes: "",
    assignedEmployees: ["Mike Johnson"]
  },
  {
    id: 3,
    boatId: 103,
    boatName: "Blue Waters",
    ownerName: "Robert Johnson",
    marinaName: "Harbor Bay Marina",
    slip: "C-08",
    status: "Scheduled",
    weekStartDate: "2025-05-12",
    scheduledDate: "2025-05-14", // Wednesday
    scheduledTime: "11:15",
    paymentStatus: "Pending",
    createdAt: "2025-05-11T09:45:00Z",
    notes: "Please call 30 minutes before arrival",
    assignedEmployees: ["Emma Wilson"]
  },
  {
    id: 4,
    boatId: 104,
    boatName: "Sea Wanderer",
    ownerName: "Emily Chen",
    marinaName: "Golden Anchor Marina",
    slip: "D-15",
    status: "Scheduled",
    weekStartDate: "2025-05-12",
    scheduledDate: "2025-05-16", // Friday
    scheduledTime: "14:00",
    paymentStatus: "Paid",
    createdAt: "2025-05-09T16:20:00Z",
    notes: "",
    assignedEmployees: ["Mike Johnson", "Sarah Davis"]
  },
  {
    id: 5,
    boatId: 105,
    boatName: "Ocean Explorer",
    ownerName: "Michael Brown",
    marinaName: "Sunset Point Marina",
    slip: "E-03",
    status: "Scheduled",
    weekStartDate: "2025-05-12",
    scheduledDate: "2025-05-16", // Friday
    scheduledTime: "15:30",
    paymentStatus: "Paid",
    createdAt: "2025-05-01T11:10:00Z",
    notes: "",
    assignedEmployees: ["Sarah Davis"]
  },
  {
    id: 6,
    boatId: 106,
    boatName: "Coastal Journey",
    ownerName: "David Wilson",
    marinaName: "Harbor Bay Marina",
    slip: "F-19",
    status: "Scheduled",
    weekStartDate: "2025-05-12",
    scheduledDate: "2025-05-15", // Thursday
    scheduledTime: "13:45",
    paymentStatus: "Paid",
    createdAt: "2025-05-07T08:30:00Z",
    notes: "Owner requests early notification",
    assignedEmployees: ["Mike Johnson"]
  },
];

const MOCK_EMPLOYEES = [
  { id: 1, name: "Emma Wilson" },
  { id: 2, name: "Mike Johnson" },
  { id: 3, name: "Sarah Davis" }
];

const MOCK_WEEKS = [
  { start: "2025-05-05" },
  { start: "2025-05-12" },
  { start: "2025-05-19" },
  { start: "2025-05-26" }
];

type RequestType = typeof MOCK_REQUESTS[0];

export default function AdminCalendar() {
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState<string>("2025-05-12"); // Current week
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  // This will be replaced with actual API call
  const { data: scheduledRequests = [], isLoading } = useQuery({
    queryKey: ["/api/pump-out-requests/calendar", { week: currentWeekStart, employee: selectedEmployee }],
    queryFn: async () => {
      // This will be replaced with actual API call
      // For now return filtered mock data
      let filtered = MOCK_REQUESTS.filter(r => 
        r.weekStartDate === currentWeekStart && 
        r.status === "Scheduled"
      );
      
      if (selectedEmployee !== "all") {
        filtered = filtered.filter(r => 
          r.assignedEmployees.includes(selectedEmployee)
        );
      }
      
      return filtered;
    },
  });
  
  // Generate weekdays for the calendar
  const generateWeekDays = (startDateStr: string) => {
    const startDate = startOfWeek(parseISO(startDateStr), { weekStartsOn: 1 }); // Start from Monday
    const days = [];
    
    for (let i = 0; i < 5; i++) { // Monday to Friday
      const day = addDays(startDate, i);
      days.push({
        date: day,
        dayName: format(day, "EEEE"),
        dayNumber: format(day, "d"),
        month: format(day, "MMM"),
        isoDate: format(day, "yyyy-MM-dd")
      });
    }
    
    return days;
  };
  
  const weekDays = generateWeekDays(currentWeekStart);
  
  const getRequestsForDay = (dayIsoDate: string) => {
    return scheduledRequests.filter(request => 
      request.scheduledDate === dayIsoDate
    ).sort((a, b) => {
      // Sort by time
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
  };

  const handlePreviousWeek = () => {
    const currentIndex = MOCK_WEEKS.findIndex(w => w.start === currentWeekStart);
    if (currentIndex > 0) {
      setCurrentWeekStart(MOCK_WEEKS[currentIndex - 1].start);
    }
  };

  const handleNextWeek = () => {
    const currentIndex = MOCK_WEEKS.findIndex(w => w.start === currentWeekStart);
    if (currentIndex < MOCK_WEEKS.length - 1) {
      setCurrentWeekStart(MOCK_WEEKS[currentIndex + 1].start);
    }
  };

  const handleViewRequest = (requestId: number) => {
    toast({
      title: "View Request Details",
      description: `Opening details for request #${requestId}`,
    });
    // This will open a modal with request details
  };

  return (
    <>
      <Helmet>
        <title>Schedule Calendar | Poopalotzi</title>
        <meta name="description" content="View and manage the scheduled pump-out services calendar" />
      </Helmet>
      
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
            <div>
              <CardTitle className="text-2xl font-bold">Service Calendar</CardTitle>
              <CardDescription>
                View and manage the scheduled pump-out services calendar
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {MOCK_EMPLOYEES.map(employee => (
                    <SelectItem key={employee.id} value={employee.name}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                disabled={currentWeekStart === MOCK_WEEKS[0].start}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Week
              </Button>
              
              <div className="text-xl font-semibold flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Week of {format(parseISO(currentWeekStart), "MMMM d, yyyy")}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                disabled={currentWeekStart === MOCK_WEEKS[MOCK_WEEKS.length - 1].start}
              >
                Next Week
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-8">Loading calendar...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {weekDays.map((day) => (
                  <Card key={day.isoDate} className="overflow-hidden">
                    <CardHeader className="p-3 bg-muted">
                      <div className="text-center">
                        <div className="text-sm font-medium">{day.dayName}</div>
                        <div className="text-2xl font-bold">{day.dayNumber}</div>
                        <div className="text-sm text-muted-foreground">{day.month}</div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 h-[400px] overflow-y-auto">
                      {getRequestsForDay(day.isoDate).length === 0 ? (
                        <div className="text-center text-muted-foreground p-4">
                          No services scheduled
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getRequestsForDay(day.isoDate).map((request) => (
                            <div
                              key={request.id}
                              className="p-2 border rounded-md bg-card hover:bg-accent cursor-pointer"
                              onClick={() => handleViewRequest(request.id)}
                            >
                              <div className="text-sm font-medium flex items-center">
                                <Sailboat className="h-3 w-3 mr-1 text-primary" />
                                {request.boatName}
                              </div>
                              <div className="text-xs text-muted-foreground mb-1">
                                {request.ownerName}
                              </div>
                              <div className="flex items-center text-xs mb-1">
                                <MapPin className="h-3 w-3 mr-1 text-primary" />
                                {request.marinaName}, Slip {request.slip}
                              </div>
                              <div className="text-xs font-medium">
                                Time: {format(parseISO(`2025-01-01T${request.scheduledTime}`), "h:mm a")}
                              </div>
                              <Separator className="my-1" />
                              <div className="flex flex-wrap gap-1 mt-1">
                                {request.assignedEmployees.map((employee, i) => (
                                  <Badge key={i} variant="outline" className="text-xs py-0">
                                    {employee}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}