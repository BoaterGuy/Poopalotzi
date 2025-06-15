import { useState, useEffect } from 'react';
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
import { Calendar } from "@/components/ui/calendar";

const ScheduleCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  // Use React Query for fetching pump-out requests
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['/api/pump-out-requests'],
    queryFn: async () => {
      const response = await fetch('/api/pump-out-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      return response.json();
    }
  });

  // Show error toast if requests fail to load
  useEffect(() => {
    if (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load service requests",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Service Schedule</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </div>
        <div>
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-2">Schedule for {selectedDate?.toLocaleDateString()}</h2>
            {isLoading ? (
              <div className="text-center py-4">Loading schedule...</div>
            ) : (
              <>
                {Array.isArray(requests) && requests.length > 0 ? (
                  requests
                    .filter(request => request.scheduledDate?.split('T')[0] === selectedDate?.toISOString().split('T')[0])
                    .map(request => (
                      <div key={request.id} className="mb-2 p-2 border rounded">
                        <p>Boat: {request.boatName}</p>
                        <p>Time: {new Date(request.scheduledTime).toLocaleTimeString()}</p>
                        <p>Marina: {request.marinaName}</p>
                        <p>Status: {request.status}</p>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No services scheduled for this date</div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ScheduleCalendar;