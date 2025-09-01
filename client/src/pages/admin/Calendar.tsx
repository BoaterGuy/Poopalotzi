import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, MapPin, User, Filter } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

interface PumpOutRequest {
  id: number;
  status: string;
  requestedDate: string;
  boat: {
    name: string;
    make: string;
    model: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  marina?: {
    name: string;
  };
  dockAssignment?: {
    pier: string;
    dock: number;
  };
}

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [requests, setRequests] = useState<PumpOutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  // Fetch pump-out requests
  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/pump-out-requests', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load service requests",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filterStatus === 'all') return true;
    return request.status.toLowerCase() === filterStatus;
  });

  const selectedDateRequests = filteredRequests.filter(request =>
    isSameDay(new Date(request.requestedDate), selectedDate)
  );

  const currentMonth = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(currentMonth);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayRequestCount = (date: Date) => {
    return filteredRequests.filter(request =>
      isSameDay(new Date(request.requestedDate), date)
    ).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Service Calendar - Poopalotzi Admin</title>
        <meta name="description" content="View and manage pump-out service requests by date" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Service Calendar</h1>
            <p className="text-gray-600">View and manage pump-out requests by date</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                {format(selectedDate, 'MMMM yyyy')}
              </CardTitle>
              <CardDescription>
                Click on a date to view service requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                modifiers={{
                  hasRequests: (date) => getDayRequestCount(date) > 0,
                  today: (date) => isToday(date)
                }}
                modifiersStyles={{
                  hasRequests: { backgroundColor: '#dbeafe', fontWeight: 'bold' },
                  today: { backgroundColor: '#3b82f6', color: 'white' }
                }}
              />
            </CardContent>
          </Card>

          {/* Daily Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                {format(selectedDate, 'MMM d, yyyy')}
              </CardTitle>
              <CardDescription>
                {selectedDateRequests.length} request{selectedDateRequests.length !== 1 ? 's' : ''} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDateRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No service requests scheduled for this date
                </p>
              ) : (
                selectedDateRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      <span className="text-sm text-gray-500">#{request.id}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        {request.user.firstName} {request.user.lastName}
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {request.boat.name} ({request.boat.make} {request.boat.model})
                      </div>
                      
                      {request.marina && (
                        <div className="text-sm text-gray-600">
                          {request.marina.name}
                          {request.dockAssignment && (
                            <span> - Pier {request.dockAssignment.pier}, Dock {request.dockAssignment.dock}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['pending', 'scheduled', 'in_progress', 'completed'].map((status) => {
            const count = requests.filter(r => r.status.toLowerCase() === status).length;
            return (
              <Card key={status}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}