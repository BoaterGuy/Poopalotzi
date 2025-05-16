import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
    dock: z.string().optional().nullable(),
    slip: z.coerce.number().optional().nullable(),
    notes: z.string().optional().nullable(),
    photoUrl: z.string().optional(),
    marinaId: z.coerce.number().optional().nullable(),
  });

type BoatFormValues = z.infer<typeof boatFormSchema>;

interface BoatFormProps {
  boat?: any; // The existing boat data if editing
  onSuccess: () => void; // Callback when form is successfully submitted
}

export default function BoatForm({ boat, onSuccess }: BoatFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch existing slip assignment for this boat
  const { data: existingAssignment } = useQuery({
    queryKey: [`/api/slip-assignments/boat/${boat?.id}`],
    queryFn: async () => {
      if (!boat?.id) return null;
      
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
    enabled: !!boat?.id,
  });

  // Fetch list of marinas
  const { data: marinas = [] } = useQuery<Marina[]>({
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
    pumpPortLocations: boat?.pumpPortLocations || [],
    dock: existingAssignment?.dock || boat?.dock || "",
    slip: existingAssignment?.slip || boat?.slip || null,
    marinaId: existingAssignment?.marinaId || null,
    notes: boat?.notes || null,
    photoUrl: boat?.photoUrl || "",
  };

  const form = useForm<BoatFormValues>({
    resolver: zodResolver(boatFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: BoatFormValues) => {
    setIsSubmitting(true);
    try {
      // First save the boat information
      let savedBoat;
      if (boat) {
        // Update existing boat
        const response = await apiRequest("PUT", `/api/boats/${boat.id}`, data);
        savedBoat = await response.json();
      } else {
        // For testing, we'll use a simplified approach with a hardcoded owner ID
        // In the real app, we would need to fetch the current user's boat owner ID
        
        // Now create the boat with the fixed owner ID (using 2 for the sample data)
        const response = await apiRequest("POST", "/api/boats", {
          ...data,
          ownerId: 2
        });
        savedBoat = await response.json();
      }
      
      // Handle marina assignment
      if (data.marinaId) {
        try {
          // First check if there's an existing slip assignment
          const boatId = boat?.id || savedBoat.id;
          let existingSlipFound = false;
          
          if (boat?.id) {
            // Try to get existing slip assignment for update
            const slipResponse = await fetch(`/api/slip-assignments/boat/${boat.id}`, {
              credentials: 'include'
            });
            
            if (slipResponse.ok) {
              // Found existing assignment, update it
              existingSlipFound = true;
              const existingSlip = await slipResponse.json();
              
              await apiRequest("PUT", `/api/slip-assignments/${existingSlip.id}`, {
                marinaId: data.marinaId,
                dock: data.dock || existingSlip.dock,
                slip: data.slip || existingSlip.slip
              });
            }
          }
          
          // If no existing assignment was found, create a new one
          if (!existingSlipFound) {
            const slipData = {
              boatId,
              marinaId: data.marinaId,
              dock: data.dock || "A",
              slip: data.slip || 1
            };
            
            await apiRequest("POST", "/api/slip-assignments", slipData);
          }
        } catch (slipError) {
          console.error("Error updating slip assignment:", slipError);
          // Continue with success message - the boat info was saved even if slip assignment failed
        }
      }
      
      toast({
        title: boat ? "Boat Updated" : "Boat Added",
        description: boat ? 
          "Your boat information has been updated successfully." : 
          "Your boat has been added successfully.",
      });
      
      // Invalidate any caches related to boats or slip assignments 
      queryClient.invalidateQueries({ queryKey: ['/api/boats'] });
      if (boat?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/slip-assignments/boat/${boat.id}`] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/slip-assignments'] });
      // Also invalidate marinas query to make sure everything is fresh
      queryClient.invalidateQueries({ queryKey: ['/api/marinas/all'] });
      
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 pb-4">
        {/* Boat Photo Upload */}
        <FormField
          control={form.control}
          name="photoUrl"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel>Boat Photo</FormLabel>
              <FormControl>
                <ImageUpload 
                  value={field.value} 
                  onChange={field.onChange}
                  className="mx-auto"
                />
              </FormControl>
              <FormDescription>
                Upload a photo of your boat to help service providers identify it easily
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Marina selection - moved to top */}
          <FormField
            control={form.control}
            name="marinaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marina</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
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
                  Where your boat is docked
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dock - moved to top */}
          <FormField
            control={form.control}
            name="dock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dock</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="e.g. A" 
                    {...field} 
                    value={field.value || ""} 
                  />
                </FormControl>
                <FormDescription>
                  Your dock letter or number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Slip - moved to top */}
          <FormField
            control={form.control}
            name="slip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slip Number</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g. 42" 
                    {...field} 
                    value={field.value || ""} 
                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Your assigned slip number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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

          {/* Marina, Dock and Slip have been moved to the top of the form */}



          {/* Docking Direction */}
          <FormField
            control={form.control}
            name="dockingDirection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Docking Direction</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
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

          {/* Pump Out Port(s) */}
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="pumpPortLocations"
              render={() => (
                <FormItem>
                  <FormLabel>Pump Out Port(s) Location</FormLabel>
                  <div className="space-y-2">
                    {pumpPortLocationOptions.map((option) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="pumpPortLocations"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValues = field.value || [];
                                    return checked
                                      ? field.onChange([...currentValues, option.id])
                                      : field.onChange(
                                          currentValues.filter(
                                            (value) => value !== option.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormDescription>
                    Where the waste pump-out port(s) are located on your boat. You can select multiple options.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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

        <div className="mt-8 flex justify-center">
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="bg-[#0B1F3A] hover:bg-opacity-90 w-full max-w-xs py-6 text-lg"
          >
            {isSubmitting ? 'Saving...' : boat ? 'Update Boat' : 'Add Boat'}
          </Button>
        </div>
      </form>
    </Form>
  );
}