import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import ServiceRequestForm from "@/components/member/ServiceRequestForm";
import PaymentForm from "@/components/member/PaymentForm";
import { Boat, PumpOutRequest, ServiceLevel } from "@shared/schema";
import { formatCurrency, formatWeekRange } from "@/lib/utils";
import { useServiceSubscription } from "@/hooks/use-service-subscription";

export default function RequestService() {
  const { user } = useAuth();
  const { toast } = useToast();
  // React Query removed
  const [step, setStep] = useState<"request" | "payment">("request");
  const [selectedRequest, setSelectedRequest] = useState<PumpOutRequest | null>(null);

  // Fetch boats owned by the user
  // React Query removed
    queryFn: async () => {
      const response = await fetch('/api/boats', {
        credentials: 'include'
      if (!response.ok) {
        throw new Error('Failed to fetch boats');
