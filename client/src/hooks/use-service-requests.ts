import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { useToast } from './use-toast';

export interface PumpOutRequest {
  id: number;
  boatId: number;
  weekStartDate: string;
  status: 'Requested' | 'Scheduled' | 'Completed' | 'Canceled' | 'Waitlisted';
  ownerNotes?: string;
  adminNotes?: string;
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  boat?: any;
  slipAssignment?: any;
  marina?: any;
}

export function useServiceRequests(boatId?: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get service requests for a specific boat
  const { data: requests, isLoading, error } = useQuery({
    queryKey: [`/api/pump-out-requests/boat/${boatId}`],
    queryFn: undefined,
    enabled: !!boatId,
    staleTime: 0, // Consider data always stale
    cacheTime: 0  // Don't cache the data
  });
  
  // Create a new service request
  const createServiceRequest = useMutation({
    mutationFn: async (requestData: any) => {
      const res = await apiRequest('POST', '/api/pump-out-requests', requestData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/pump-out-requests/boat/${boatId}`] });
      toast({
        title: 'Service Request Created',
        description: 'Your pump-out service request has been submitted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Creating Request',
        description: error.message || 'There was a problem submitting your request.',
        variant: 'destructive',
      });
    },
  });
  
  // Update service request status
  const updateServiceStatus = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number, status: string }) => {
      const res = await apiRequest('PATCH', `/api/pump-out-requests/${requestId}/status`, { status });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/pump-out-requests/boat/${boatId}`] });
      
      const statusMessages = {
        Scheduled: 'Service has been scheduled.',
        Completed: 'Service has been marked as completed.',
        Canceled: 'Service has been canceled.',
        Waitlisted: 'Service has been added to the waitlist.',
      };
      
      toast({
        title: `Status Updated: ${data.status}`,
        description: statusMessages[data.status as keyof typeof statusMessages] || 'Status updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Updating Status',
        description: error.message || 'There was a problem updating the status.',
        variant: 'destructive',
      });
    },
  });
  
  return {
    requests,
    isLoading,
    error,
    createServiceRequest,
    updateServiceStatus,
  };
}

export function useEmployeeSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const queryClient = useQueryClient();
  
  // Get service requests for a specific week
  const { data: weekRequests, isLoading, error } = useQuery({
    queryKey: [`/api/pump-out-requests/week/${selectedDate.toISOString().split('T')[0]}`],
    queryFn: async () => {
      const res = await fetch(`/api/pump-out-requests/week/${selectedDate.toISOString().split('T')[0]}`);
      if (!res.ok) {
        throw new Error('Failed to fetch requests');
      }
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: true
  });

  return {
    requests: data || [],
    isLoading,
    fetch
  };
}

// Mock data for development - this should come from API
const mockRequests = [
  {
    id: 1,
    status: "Requested",
    boatId: 101,
    requestedDate: new Date().toISOString().split('T')[0],
    weekStartDate: "2025-05-12",
    pumpOutPorts: ["bow", "stern"],
    boat: {
      id: 101,
      name: "Sea Breeze",
      owner: {
        firstName: "John",
        lastName: "Smith"
      },
      marina: {
        name: "Harbor Bay Marina"
      }
    }
  },
  {
    id: 2,
    status: "Completed",
    boatId: 102,
    requestedDate: new Date().toISOString().split('T')[0],
    weekStartDate: "2025-05-12",
    pumpOutPorts: ["stern"],
    boat: {
      id: 102,
      name: "Tranquility",
      make: "Sea Ray",
      model: "340 Sundancer",
      color: "White"
    },
    marina: {
      id: 2,
      name: "Example Marina 2"
    },
    slipAssignment: {
      dock: "C",
      slip: 5
    }
  },
  {
    id: 3,
    status: "Waitlisted",
    boatId: 103,
    requestedDate: new Date().toISOString().split('T')[0],
    weekStartDate: "2025-05-12",
    pumpOutPorts: ["port"],
    boat: {
      id: 103,
      name: "Wave Dancer",
      make: "Catalina",
      model: "350",
      color: "Navy/White"
    },
    marina: {
      id: 1,
      name: "Example Marina"
    },
    slipAssignment: {
      dock: "B",
      slip: 8
    },
    ownerNotes: "Call ahead"
  }
];

export function useWeeklyServiceRequests() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { data: weekRequests, isLoading, error } = useQuery({
    queryKey: ['/api/pump-out-requests/week', selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const res = await fetch(`/api/pump-out-requests/week/${selectedDate.toISOString().split('T')[0]}`);
      if (!res.ok) {
        throw new Error('Failed to fetch requests');
      }
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: true
  });

  return {
    weekRequests: weekRequests || [],
    isLoading,
    error,
    selectedDate,
    setSelectedDate,
  };
}

export function useAdminServiceRequests() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const queryClient = useQueryClient();
  
  // Get all service requests with optional status filter
  const { data: requests, isLoading, error } = useQuery({
    queryKey: statusFilter ? [`/api/pump-out-requests/status/${statusFilter}`] : ['/api/pump-out-requests'],
    queryFn: undefined,
    enabled: !!(statusFilter || (!dateRange[0] && !dateRange[1])),
  });
  
  return {
    requests,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
  };
}
