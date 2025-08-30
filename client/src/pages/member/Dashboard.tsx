import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { formatDate, formatWeekRange } from "@/lib/utils";
import { Boat, PumpOutRequest, ServiceLevel, DockAssignment, Marina } from "@shared/schema";
import { CalendarPlus, History, AlertCircle, Check, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import BulkPlanStatus from "@/components/member/BulkPlanStatus";

export default function MemberDashboard() {
  const { user } = useAuth();

  // React Query removed
    queryFn: async () => {
      const response = await fetch('/api/boats', {
        credentials: 'include'
      if (!response.ok) {
        throw new Error('Failed to fetch boats');
