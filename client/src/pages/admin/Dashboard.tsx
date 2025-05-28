import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
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
  Filter
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, subMonths } from "date-fns";

// Mock data - in a real app these would come from API calls
const monthlyServicesData = [
  { month: "Jan", services: 65 },
  { month: "Feb", services: 75 },
  { month: "Mar", services: 85 },
  { month: "Apr", services: 110 },
  { month: "May", services: 145 },
  { month: "Jun", services: 165 },
  { month: "Jul", services: 175 },
  { month: "Aug", services: 170 },
  { month: "Sep", services: 150 },
  { month: "Oct", services: 125 },
  { month: "Nov", services: 90 },
  { month: "Dec", services: 70 }
];

const weekdayDistribution = [
  { day: "Monday", count: 95 },
  { day: "Tuesday", count: 80 },
  { day: "Wednesday", count: 90 },
  { day: "Thursday", count: 100 },
  { day: "Friday", count: 85 }
];

const serviceLevelsData = [
  { name: "Basic", value: 35, color: "#38B2AC" },
  { name: "Standard", value: 45, color: "#805AD5" },
  { name: "Premium", value: 20, color: "#F56565" }
];

const marinaDistribution = [
  { marina: "Sunset Marina", count: 55 },
  { marina: "Harbor Point", count: 35 },
  { marina: "Bay Front", count: 25 },
  { marina: "Oceanview", count: 20 },
  { marina: "Other", count: 15 }
];

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

  const isLoading = isLoadingUsers || isLoadingCounts || isLoadingArpu;

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Poopalotzi</title>
        <meta name="description" content="Admin analytics dashboard for Poopalotzi" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A]">Analytics Dashboard</h1>
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
                  data={monthlyServicesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
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
          {/* Revenue Trend */}
          <Card>
            <CardHeader className="bg-[#F4EBD0]">
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), "Revenue"]} 
                      contentStyle={{ borderRadius: "8px" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
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
                      data={serviceLevelsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {serviceLevelsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} customers`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {serviceLevelsData.map((entry, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-1" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm">{entry.name}</span>
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
                    data={weekdayDistribution}
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
                    data={marinaDistribution}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
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
      </div>
    </>
  );
}