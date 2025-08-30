import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { ServiceLevel } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useState } from "react";
import { AuthModal } from "@/components/auth/AuthModal";

export default function Services() {
  const { isLoggedIn } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // React Query removed
    refetchOnMount: true,
    staleTime: 0,
    queryFn: async () => {
      const response = await fetch('/api/service-levels');
      if (!response.ok) {
        throw new Error('Failed to fetch service levels');
