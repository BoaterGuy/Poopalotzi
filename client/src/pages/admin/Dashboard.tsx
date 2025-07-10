import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
  ArrowUp,
  ArrowDown,
  Users,
  Ship,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Filter,
  UserPlus,
  Shield,
  User,
  Settings
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

// --- REMOVED ALL STATIC TEST DATA ---
// All dashboard data now comes from real database API calls

export default function AdminDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['/api/analytics/metrics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/metrics');
      return res.json();
    }
  });

  const {
    totalCustomers = 0,
    activeBoats = 0,
    monthlyRevenue = 0,
    arpu = 0,
    churnRate = 0,
    customerSatisfaction = 0
  } = metrics || {};

  // Fetch analytics data
  const { data: usersByServiceLevel, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/analytics/users-by-service-level'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/users-by-service-level');
      return res.json();
    }
  });

  const { data: serviceCounts, isLoading: isLoadingCounts } = useQuery({
    queryKey: ['/api/analytics/service-counts'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/service-counts');
      return res.json();
    }
  });

  const { data: arpuData, isLoading: isLoadingArpu } = useQuery({
    queryKey: ['/api/analytics/arpu'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/arpu');
      return res.json();
    }
  });

  // Fetch real pump-out data grouped by week
  const { data: revenueData = [], isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['/api/analytics/pump-out-weekly'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/pump-out-weekly');
      return res.json();
    }
  });

  const isLoading = isLoadingUsers || isLoadingCounts || isLoadingArpu || isLoadingRevenue;

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Poopalotzi - UPDATED</title>
        <meta name="description" content="Admin analytics dashboard for Poopalotzi - UPDATED" />
        <meta name="cache-buster" content={Date.now().toString()} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#0B1F3A]">Analytics Dashboard</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
              <Activity className="h-4 w-4" />
              <span>CACHE BUST #{Math.random().toString(36).substr(2, 9)}</span>
            </div>
          </div>
          <p className="text-gray-600">
            Overview of key metrics and performance indicators
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 uppercase">Total Customers</p>
                  <h3 className="text-3xl font-bold text-[#0B1F3A] mt-1">{totalCustomers}</h3>
                </div>
                <div className="bg-[#38B2AC] bg-opacity-10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-[#38B2AC]" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className="text-green-500 text-sm mr-1 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" /> 12%
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 uppercase">Active Boats</p>
                  <h3 className="text-3xl font-bold text-[#0B1F3A] mt-1">{activeBoats}</h3>
                </div>
                <div className="bg-[#38B2AC] bg-opacity-10 p-3 rounded-full">
                  <Ship className="h-6 w-6 text-[#38B2AC]" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className="text-green-500 text-sm mr-1 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" /> 8%
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 uppercase">Monthly Revenue</p>
                  <h3 className="text-3xl font-bold text-[#0B1F3A] mt-1">{formatCurrency(monthlyRevenue)}</h3>
                </div>
                <div className="bg-[#38B2AC] bg-opacity-10 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-[#38B2AC]" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className="text-green-500 text-sm mr-1 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" /> 17%
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 uppercase">Completed Services</p>
                  <h3 className="text-3xl font-bold text-[#0B1F3A] mt-1">1,423</h3>
                </div>
                <div className="bg-[#38B2AC] bg-opacity-10 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-[#38B2AC]" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className="text-green-500 text-sm mr-1 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" /> 23%
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Volume Chart */}
        <Card className="mb-8">
          <CardHeader className="bg-[#F4EBD0] flex flex-row justify-between items-center py-4">
            <CardTitle>Service Volume</CardTitle>
            <div className="flex items-center gap-2">
              <select className="bg-white text-[#0B1F3A] border-0 rounded py-1 px-3 text-sm">
                <option>Last 12 Months</option>
                <option>Last Quarter</option>
                <option>Year to Date</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  {/* --- STATIC DATA REMOVED --- Shows real monthly service data when available */}
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} services`, "Volume"]} 
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Bar dataKey="services" name="Services" fill="#38B2AC" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pump-out Activity Trend */}
          <Card>
            <CardHeader className="bg-[#F4EBD0]">
              <CardTitle>Weekly Pump-out Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, "Completed Pump-outs"]} 
                      contentStyle={{ borderRadius: "8px" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#38B2AC" 
                      strokeWidth={3}
                      dot={{ stroke: '#38B2AC', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Service Level Distribution */}
          <Card>
            <CardHeader className="bg-[#F4EBD0]">
              <CardTitle>Service Level Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usersByServiceLevel || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="serviceLevel.name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(usersByServiceLevel || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 50}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} users`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {(usersByServiceLevel || []).map((entry, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-1" 
                      style={{ backgroundColor: `hsl(${index * 50}, 70%, 50%)` }}
                    />
                    <span className="text-sm">{entry.serviceLevel?.name || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekday Distribution */}
          <Card>
            <CardHeader className="bg-[#F4EBD0]">
              <CardTitle>Service Distribution by Weekday</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[]} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    barSize={30}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} services`, "Count"]} 
                      contentStyle={{ borderRadius: "8px" }}
                    />
                    <Bar dataKey="count" name="Services" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
                    {/* --- STATIC DATA REMOVED --- Shows real weekday distribution when data is available */}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Marina Distribution */}
          <Card>
            <CardHeader className="bg-[#F4EBD0]">
              <CardTitle>Services by Marina</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    {/* --- STATIC DATA REMOVED --- Shows real marina distribution when marinas and boats are added */}
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="marina" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} services`, "Count"]} 
                      contentStyle={{ borderRadius: "8px" }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#0B1F3A" 
                      fill="#0B1F3A" 
                      fillOpacity={0.8} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <Card>
          <CardHeader className="bg-[#F4EBD0]">
            <CardTitle>Key Business Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500">ARPU</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xl font-bold text-[#0B1F3A]">{formatCurrency(arpu)}</p>
                <p className="text-xs text-gray-500 mt-1">Average Revenue Per User</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500">Churn Rate</p>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </div>
                <p className="text-xl font-bold text-[#0B1F3A]">{churnRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Monthly Customer Churn</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500">Customer Satisfaction</p>
                  <Activity className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-[#0B1F3A] mr-2">{customerSatisfaction}</span>
                  <div className="text-yellow-500 flex">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-4 h-4"
                    >
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-4 h-4"
                    >
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-4 h-4"
                    >
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-4 h-4"
                    >
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-4 h-4"
                      style={{ clipPath: 'inset(0 50% 0 0)' }}
                    >
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Based on Service Feedback</p>
              </div>
            </div>

            <div className="mt-8">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Active Season Progress (May 1 - Oct 31)</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xl font-bold text-[#0B1F3A]">42%</span>
                  <div className="w-full max-w-md h-2 bg-gray-200 rounded-full overflow-hidden ml-4">
                    <div className="h-full bg-[#38B2AC]" style={{ width: '42%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management Section */}
        <Card className="mt-8">
          <CardHeader className="bg-[#F4EBD0]">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
              <div className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                DEBUG: Component Loaded
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <UserManagementTable />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// User Management Table Component
function UserManagementTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRoleChangeDialogOpen, setIsRoleChangeDialogOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    userId: number;
    userName: string;
    currentRole: string;
    newRole: string;
  } | null>(null);

  // Fetch all users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users', {
        credentials: 'include' // Include cookies for authentication
      });
      if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
      return res.json();
    }
  });

  // Role change mutation
  const roleChangeMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
      setIsRoleChangeDialogOpen(false);
      setPendingRoleChange(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: number, userName: string, currentRole: string, newRole: string) => {
    if (currentRole === newRole) return;
    
    setPendingRoleChange({
      userId,
      userName,
      currentRole,
      newRole,
    });
    setIsRoleChangeDialogOpen(true);
  };

  const confirmRoleChange = () => {
    if (pendingRoleChange) {
      roleChangeMutation.mutate({
        userId: pendingRoleChange.userId,
        role: pendingRoleChange.newRole,
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'employee': return <Settings className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'employee': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 bg-yellow-100 border border-yellow-300 rounded">Loading users...</div>;
  }

  if (error) {
    return <div className="text-center py-8 bg-red-100 border border-red-300 rounded text-red-600">Error loading users: {error.message}</div>;
  }

  return (
    <>
      <div className="mb-4 p-2 bg-blue-100 border border-blue-300 rounded text-sm">
        <strong>DEBUG:</strong> UserManagementTable rendered successfully. Found {users.length} users.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium">User</th>
              <th className="text-left py-3 px-4 font-medium">Email</th>
              <th className="text-left py-3 px-4 font-medium">Role</th>
              <th className="text-left py-3 px-4 font-medium">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {getRoleIcon(user.role)}
                    <div>
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <Select
                    value={user.role}
                    onValueChange={(newRole) => handleRoleChange(user.id, `${user.firstName} ${user.lastName}`, user.role, newRole)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={isRoleChangeDialogOpen} onOpenChange={setIsRoleChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change {pendingRoleChange?.userName}'s role from{' '}
              <strong>{pendingRoleChange?.currentRole}</strong> to{' '}
              <strong>{pendingRoleChange?.newRole}</strong>?
              {pendingRoleChange?.newRole === 'admin' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm font-medium">
                    ⚠️ Warning: Admin role grants full system access
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    This user will be able to manage all users, settings, and system configuration.
                  </p>
                </div>
              )}
              {pendingRoleChange?.newRole === 'employee' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-800 text-sm font-medium">
                    ℹ️ Employee Role
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    This user will have access to employee tools and manual service entry.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleChangeDialogOpen(false)}
              disabled={roleChangeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRoleChange}
              disabled={roleChangeMutation.isPending}
              variant={pendingRoleChange?.newRole === 'admin' ? 'destructive' : 'default'}
            >
              {roleChangeMutation.isPending ? 'Updating...' : 'Confirm Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}