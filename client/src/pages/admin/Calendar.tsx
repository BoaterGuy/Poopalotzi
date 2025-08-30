import { useState, useEffect } from 'react';
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
  // React Query removed
    queryFn: async () => {
      const response = await fetch('/api/pump-out-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
