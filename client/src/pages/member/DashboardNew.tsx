import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { formatDate, formatWeekRange } from "@/lib/utils";
import { Boat, PumpOutRequest, ServiceLevel, DockAssignment, Marina } from "@shared/schema";
import { CalendarPlus, History, AlertCircle, Check, X, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import BulkPlanStatus from "@/components/member/BulkPlanStatus";
import PaymentForm from "@/components/member/PaymentForm";

export default function MemberDashboardNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  // React Query removed
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<PumpOutRequest | null>(null);
  const [cancelingRequestId, setCancelingRequestId] = useState<number | null>(null);



  // React Query removed
    queryFn: async () => {
      const response = await fetch('/api/boats', {
        credentials: 'include'
      if (!response.ok) {
        throw new Error('Failed to fetch boats');
