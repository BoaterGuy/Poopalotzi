import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { insertBoatSchema, Marina } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ui/image-upload";

// Define pump port location options
const pumpPortLocationOptions = [
  { id: "port", label: "Port" },
  { id: "starboard", label: "Starboard" },
  { id: "bow", label: "Bow" },
  { id: "mid_ship", label: "Mid-ship" },
  { id: "stern", label: "Stern" },
];

// Create the form schema based on the boat schema from DB
const boatFormSchema = insertBoatSchema
  .omit({ ownerId: true })
  .extend({
    name: z.string().min(2, {
      message: "Boat name must be at least 2 characters.",
    }),
    year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).nullable(),
    make: z.string().min(2, {
      message: "Manufacturer must be at least 2 characters.",
    }).nullable(),
    model: z.string().nullable(),
    length: z.coerce.number().min(1, {
      message: "Length must be at least 1 foot.",
    }).nullable(),
    color: z.string().nullable(),
    pumpPortLocations: z.array(z.string()).optional().nullable(),
    pier: z.string().optional().nullable(),
    dock: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    photoUrl: z.string().optional(),
    marinaId: z.coerce.number().optional().nullable(),

type BoatFormValues = z.infer<typeof boatFormSchema>;

interface BoatFormProps {
  boat?: any; // The existing boat data if editing

export default function BoatForm({ boat, onSuccess }: BoatFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // React Query removed
  
  // Fetch existing dock assignment for this boat
  // React Query removed
    queryFn: async () => {
      if (!boat?.id) return null;
      
      try {
        const response = await fetch(`/api/dock-assignments/boat/${boat.id}`, {
          credentials: 'include'
        
        if (!response.ok) {
          if (response.status === 404) {
            return null; // No assignment exists yet
          throw new Error('Failed to fetch dock assignment');
        
