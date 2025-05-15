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
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { insertBoatSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  });

type BoatFormValues = z.infer<typeof boatFormSchema>;

interface BoatFormProps {
  boat?: any; // The existing boat data if editing
  onSuccess: () => void; // Callback when form is successfully submitted
}

export default function BoatForm({ boat, onSuccess }: BoatFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default values based on whether we're editing or creating
  const defaultValues: Partial<BoatFormValues> = {
    name: boat?.name || "",
    year: boat?.year || null,
    make: boat?.make || null,
    model: boat?.model || null,
    length: boat?.length || null,
    color: boat?.color || null,
    dockingDirection: boat?.dockingDirection || "bow_in",
    tieUpSide: boat?.tieUpSide || "port",
    pumpPortLocation: boat?.pumpPortLocation || "stern",
    notes: boat?.notes || null,
  };

  const form = useForm<BoatFormValues>({
    resolver: zodResolver(boatFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: BoatFormValues) => {
    setIsSubmitting(true);
    try {
      if (boat) {
        // Update existing boat
        await apiRequest("PUT", `/api/boats/${boat.id}`, data);
      } else {
        // Create new boat
        await apiRequest("POST", "/api/boats", data);
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error submitting boat form:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your boat information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Boat Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Boat Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Sea Breeze" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Year */}
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 2020"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Make */}
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Make (Manufacturer)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Sea Ray" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Model */}
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Sundancer 320" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Length */}
          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length (ft)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 32"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Color */}
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. White/Blue" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Docking Direction */}
          <FormField
            control={form.control}
            name="dockingDirection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Docking Direction</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select docking direction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bow_in">Bow In</SelectItem>
                    <SelectItem value="stern_in">Stern In</SelectItem>
                    <SelectItem value="side_to">Side To</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How your boat is positioned in the slip
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tie Up Side */}
          <FormField
            control={form.control}
            name="tieUpSide"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tie Up Side</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tie up side" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="port">Port</SelectItem>
                    <SelectItem value="starboard">Starboard</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Which side of your boat is against the dock
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Pump Port Location */}
          <FormField
            control={form.control}
            name="pumpPortLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pump Port Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pump port location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="stern">Stern</SelectItem>
                    <SelectItem value="port_side">Port Side</SelectItem>
                    <SelectItem value="starboard_side">Starboard Side</SelectItem>
                    <SelectItem value="cabin_roof">Cabin Roof</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Where the waste pump-out port is located on your boat
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any special instructions or information for the service provider"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Mention any specifics about your boat that might help during service
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} className="bg-[#38B2AC] hover:bg-opacity-90">
            {isSubmitting ? 'Saving...' : boat ? 'Update Boat' : 'Add Boat'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}