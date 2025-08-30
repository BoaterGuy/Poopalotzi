import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ServiceRequestForm from "@/components/member/ServiceRequestForm";
import { Boat } from "@shared/schema";

export default function RequestServiceSimple() {
  const { user } = useAuth();

  // Fetch boats owned by the user
  // React Query removed
    queryFn: async () => {
      const response = await fetch('/api/boats', {
        credentials: 'include'
      if (!response.ok) {
        throw new Error('Failed to fetch boats');
