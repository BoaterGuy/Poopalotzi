import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const marinaSchema = z.object({
  name: z.string().min(2, { message: "Marina name must be at least 2 characters" }),
  address: z.string().min(5, { message: "Please enter a valid address" }),
  phone: z.string().min(5, { message: "Please enter a valid phone number" }),
  isActive: z.boolean().default(true),
});

type MarinaFormValues = z.infer<typeof marinaSchema>;

interface MarinaFormProps {
  onClose: () => void;
  existingMarina?: {
    id: number;
    name: string;
    address: string;
    phone: string;
    isActive: boolean;
  };
}

export default function MarinaForm({ onClose, existingMarina }: MarinaFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!existingMarina;

  const form = useForm<MarinaFormValues>({
    resolver: zodResolver(marinaSchema),
    defaultValues: {
      name: existingMarina?.name || "",
      address: existingMarina?.address || "",
      phone: existingMarina?.phone || "",
      isActive: existingMarina?.isActive ?? true,
    },
  });

  const createMarina = useMutation({
    mutationFn: async (data: MarinaFormValues) => {
      const response = await apiRequest("POST", "/api/marinas", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marinas"] });
      toast({
        title: "Marina Created",
        description: "The marina has been successfully created",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create marina: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMarina = useMutation({
    mutationFn: async (data: MarinaFormValues) => {
      const response = await apiRequest("PUT", `/api/marinas/${existingMarina?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marinas"] });
      toast({
        title: "Marina Updated",
        description: "The marina has been successfully updated",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update marina: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: MarinaFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateMarina.mutateAsync(values);
      } else {
        await createMarina.mutateAsync(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marina Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter marina name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter marina address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Set whether this marina is active and available for assignments
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (isEditing ? "Updating..." : "Creating...")
              : (isEditing ? "Update Marina" : "Create Marina")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}