// React Query removed - using simple fetch instead
import { apiRequest } from '@/lib/queryClient';
import { useState, useEffect } from 'react';
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

export function useServiceRequests(boatId?: number) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PumpOutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch service requests for a specific boat
  useEffect(() => {
    if (!boatId) return;
    
    setIsLoading(true);
    fetch(`/api/pump-out-requests/boat/${boatId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setRequests(data);
        setError(null);
      .catch(err => {
        setError(err.message);
        setRequests([]);
      .finally(() => setIsLoading(false));
  }, [boatId]);
  
  // Create a new service request
  // React Query mutation removed
      const res = await apiRequest('POST', '/api/pump-out-requests', requestData);
      return res.json();
    },
      toast({
        title: 'Service Request Created',
        description: 'Your pump-out service request has been submitted successfully.',
    },
      toast({
        title: 'Error Creating Request',
        description: error.message || 'There was a problem submitting your request.',
        variant: 'destructive',
    },
  
  // Update service request status
  // React Query mutation removed
      const res = await apiRequest('PATCH', `/api/pump-out-requests/${requestId}/status`, { status });
      return res.json();
    },
      
      const statusMessages = {
        Scheduled: 'Service has been scheduled.',
        Completed: 'Service has been marked as completed.',
        Canceled: 'Service has been canceled.',
        Waitlisted: 'Service has been added to the waitlist.',
      };
      
      toast({
        title: `Status Updated: ${data.status}`,
        description: statusMessages[data.status as keyof typeof statusMessages] || 'Status updated successfully.',
    },
      toast({
        title: 'Error Updating Status',
        description: error.message || 'There was a problem updating the status.',
        variant: 'destructive',
    },
  
  return {
    requests,
    isLoading,
    error,
    createServiceRequest,
    updateServiceStatus,
  };

export function useEmployeeSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // React Query removed
  
  // Get service requests for a specific week
  // React Query removed
    queryFn: async () => {
      const res = await fetch(`/api/pump-out-requests/week/${selectedDate.toISOString().split('T')[0]}`);
      if (!res.ok) {
        throw new Error('Failed to fetch requests');
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: true

  return {
    requests: data || [],
    isLoading,
    fetch
  };

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
];

export function useWeeklyServiceRequests() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // React Query removed
    queryFn: async () => {
      const res = await fetch(`/api/pump-out-requests/week/${selectedDate.toISOString().split('T')[0]}`);
      if (!res.ok) {
        throw new Error('Failed to fetch requests');
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: true

  return {
    weekRequests: weekRequests || [],
    isLoading,
    error,
    selectedDate,
    setSelectedDate,
  };

export function useAdminServiceRequests() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  // React Query removed
  
  // Get all service requests with optional status filter
  // React Query removed
    queryFn: undefined,
  
  return {
    requests,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
  };
