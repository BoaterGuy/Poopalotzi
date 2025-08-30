import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { insertDockAssignmentSchema, Marina } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Create the form schema based on the dock assignment schema from DB
const marinaFormSchema = insertDockAssignmentSchema.extend({
  marinaId: z.coerce.number({
    required_error: "Please select a marina",
  }),
  pier: z.string({
    required_error: "Please enter a pier designation",
  }).min(1, {
    message: "Pier designation is required",
  }),
  dock: z.coerce.number({
    required_error: "Please enter a dock number",
  }).min(1, {
    message: "Dock number must be at least 1",
  }),

type MarinaFormValues = z.infer<typeof marinaFormSchema>;

interface MarinaSelectionProps {
  boat: any; // The boat we're assigning a marina/dock to

export default function MarinaSelection({ boat, onSuccess }: MarinaSelectionProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing dock assignment for this boat
  const { data: existingAssignment, isLoading: isLoadingAssignment } = /* useQuery removed */({
    queryKey: [`/api/dock-assignments/boat/${boat.id}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/dock-assignments/boat/${boat.id}`, {
          credentials: 'include'
        
        if (!response.ok) {
          if (response.status === 404) {
            return null; // No assignment exists yet
          throw new Error('Failed to fetch dock assignment');
        
