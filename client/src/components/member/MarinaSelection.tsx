import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
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
import { insertSlipAssignmentSchema, Marina } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Create the form schema based on the slip assignment schema from DB
const marinaFormSchema = insertSlipAssignmentSchema.extend({
  marinaId: z.coerce.number({
    required_error: "Please select a marina",
  }),
  dock: z.coerce.number({
    required_error: "Please enter a dock number",
  }).min(1, {
    message: "Dock number must be at least 1",
  }),
  slip: z.coerce.number({
    required_error: "Please enter a slip number",
  }).min(1, {
    message: "Slip number must be at least 1",
  }),
});

type MarinaFormValues = z.infer<typeof marinaFormSchema>;

interface MarinaSelectionProps {
  boat: any; // The boat we're assigning a marina/slip to
  onSuccess: () => void; // Callback when form is successfully submitted
}

export default function MarinaSelection({ boat, onSuccess }: MarinaSelectionProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing slip assignment for this boat
  const { data: existingAssignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: [`/api/slip-assignments/boat/${boat.id}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/slip-assignments/boat/${boat.id}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            return null; // No assignment exists yet
          }
          throw new Error('Failed to fetch slip assignment');
        }
        
        return response.json();
      } catch (error) {
        console.error("Error fetching slip assignment:", error);
        return null;
      }
    },
  });

  // Fetch list of marinas
  const { data: marinas = [], isLoading: isLoadingMarinas } = useQuery<Marina[]>({
    queryKey: ['/api/marinas'],
    queryFn: async () => {
      const response = await fetch('/api/marinas', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch marinas');
      }
      
      return response.json();
    },
  });

  // Set default values based on existing assignment
  const defaultValues: Partial<MarinaFormValues> = {
    boatId: boat.id,
    marinaId: existingAssignment?.marinaId || undefined,
    dock: existingAssignment?.dock || undefined,
    slip: existingAssignment?.slip || undefined,
  };

  const form = useForm<MarinaFormValues>({
    resolver: zodResolver(marinaFormSchema),
    defaultValues,
  });

  // Update form values when existing assignment loads
  useState(() => {
    if (existingAssignment) {
      form.reset({
        boatId: boat.id,
        marinaId: existingAssignment.marinaId,
        dock: existingAssignment.dock,
        slip: existingAssignment.slip,
      });
    }
  });

  const onSubmit = async (data: MarinaFormValues) => {
    setIsSubmitting(true);
    try {
      // Create or update slip assignment
      await apiRequest("POST", "/api/slip-assignments", data);
      
      onSuccess();
    } catch (error) {
      console.error("Error submitting marina assignment:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your marina assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAssignment || isLoadingMarinas) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Marina Selection */}
          <FormField
            control={form.control}
            name="marinaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marina *</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a marina" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {marinas.map((marina) => (
                      <SelectItem key={marina.id} value={marina.id.toString()}>
                        {marina.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The marina where your boat is docked
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-6">
            {/* Dock Number */}
            <FormField
              control={form.control}
              name="dock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dock Number *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slip Number */}
            <FormField
              control={form.control}
              name="slip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slip Number *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 42" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} className="bg-[#38B2AC] hover:bg-opacity-90">
            {isSubmitting ? 'Saving...' : existingAssignment ? 'Update Assignment' : 'Assign Marina'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}