import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, Ship, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Simple form schema
const requestSchema = z.object({
  boatId: z.coerce.number({ required_error: "Please select a boat" }),
  weekStartDate: z.string({ required_error: "Please select a week" }),
  ownerNotes: z.string().optional(),

type RequestFormValues = z.infer<typeof requestSchema>;

export default function RequestServiceMinimal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch boats
  // React Query removed
    queryFn: async () => {
      const response = await fetch('/api/boats', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch boats');
