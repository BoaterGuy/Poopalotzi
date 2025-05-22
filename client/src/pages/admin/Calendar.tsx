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
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch employees
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => {
        console.error('Error fetching employees:', err);
        toast({
          title: "Error",
          description: "Failed to load employees",
          variant: "destructive"
        });
      });

    // Fetch service requests
    fetch('/api/pump-out-requests')
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(err => {
        console.error('Error fetching requests:', err);
        toast({
          title: "Error",
          description: "Failed to load service requests",
          variant: "destructive"
        });
      });

    // Generate weeks dynamically
    const generateWeeks = () => {
      const currentDate = new Date();
      const weeks = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() + (i * 7));
        weeks.push({
          start: weekStart.toISOString().split('T')[0]
        });
      }
      setWeeks(weeks);
    };

    generateWeeks();
  }, []);

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
            {requests
              .filter(request => request.scheduledDate?.split('T')[0] === selectedDate?.toISOString().split('T')[0])
              .map(request => (
                <div key={request.id} className="mb-2 p-2 border rounded">
                  <p>Boat: {request.boatName}</p>
                  <p>Time: {new Date(request.scheduledTime).toLocaleTimeString()}</p>
                  <p>Marina: {request.marinaName}</p>
                  <p>Status: {request.status}</p>
                </div>
              ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ScheduleCalendar;