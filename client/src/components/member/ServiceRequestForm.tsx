import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, startOfWeek, addWeeks, isBefore } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { insertPumpOutRequestSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Ship, Info } from "lucide-react";

// Create the form schema based on the pump out request schema from DB
const serviceRequestFormSchema = insertPumpOutRequestSchema
  .extend({
    boatId: z.coerce.number({
      required_error: "Please select a boat",
    }),
    weekStartDate: z.date({
      required_error: "Please select a week",
    }),
  });

type ServiceRequestFormValues = z.infer<typeof serviceRequestFormSchema>;

interface ServiceRequestFormProps {
  boats: any[]; // The user's boats
  onSuccess: () => void; // Callback when form is successfully submitted
}

export default function ServiceRequestForm({ boats, onSuccess }: ServiceRequestFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Generate week options (next 4 weeks)
  const generateWeekOptions = () => {
    const options = [];
    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Start on Monday
    
    for (let i = 0; i < 4; i++) {
      const weekStart = addWeeks(currentWeekStart, i);
      const weekEnd = addDays(weekStart, 6);
      
      options.push({
        value: weekStart,
        label: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`,
      });
    }
    
    return options;
  };
  
  const weekOptions = generateWeekOptions();
  
  const form = useForm<ServiceRequestFormValues>({
    resolver: zodResolver(serviceRequestFormSchema),
    defaultValues: {
      boatId: boats.length === 1 ? boats[0].id : undefined,
      weekStartDate: weekOptions[0].value,
      status: "Requested",
      paymentStatus: "Pending",
      ownerNotes: "",
    },
  });

  const onSubmit = async (data: ServiceRequestFormValues) => {
    setIsSubmitting(true);
    try {
      // Format date to ISO string for the API
      const formattedData = {
        ...data,
        weekStartDate: format(data.weekStartDate, "yyyy-MM-dd"),
      };
      
      await apiRequest("POST", "/api/pump-out-requests", formattedData);
      
      toast({
        title: "Service Requested",
        description: "Your pump-out service request has been submitted successfully.",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error submitting service request:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting your service request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find the selected boat for displaying details
  const selectedBoatId = form.watch("boatId");
  const selectedBoat = boats.find(boat => boat.id === selectedBoatId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          {/* Boat Selection */}
          <FormField
            control={form.control}
            name="boatId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Boat *</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a boat" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {boats.map((boat) => (
                      <SelectItem key={boat.id} value={boat.id.toString()}>
                        {boat.name} ({boat.year} {boat.make} {boat.model})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose which boat needs a pump-out service
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Selected Boat Details */}
          {selectedBoat && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                    <Ship className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{selectedBoat.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedBoat.year} {selectedBoat.make} {selectedBoat.model}, {selectedBoat.color}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">Pump Port:</span> {
                        selectedBoat.pumpPortLocation === 'stern' ? 'Stern' :
                        selectedBoat.pumpPortLocation === 'port_side' ? 'Port Side' :
                        selectedBoat.pumpPortLocation === 'starboard_side' ? 'Starboard Side' :
                        selectedBoat.pumpPortLocation === 'cabin_roof' ? 'Cabin Roof' : 'Not specified'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Week Selection */}
          <FormField
            control={form.control}
            name="weekStartDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Service Week *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          <>Week of {format(field.value, "MMMM d, yyyy")}</>
                        ) : (
                          <span>Select a week</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        // Only allow selection of week starts (Mondays)
                        return date.getDay() !== 1 || isBefore(date, startOfWeek(new Date(), { weekStartsOn: 1 }));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Select the week you'd like your pump-out service to be performed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Simple Week Selection Alternative */}
          {/* This could replace the calendar if you prefer */}
          {/* 
          <FormField
            control={form.control}
            name="weekStartDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Week *</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(new Date(value))}
                  defaultValue={field.value?.toISOString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a week" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {weekOptions.map((week, index) => (
                      <SelectItem key={index} value={week.value.toISOString()}>
                        {week.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose which week you want the service performed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          */}

          {/* Notes */}
          <FormField
            control={form.control}
            name="ownerNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Instructions (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any special instructions or notes for the service provider..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Add any details that might help the service provider (e.g., access instructions, preferences)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Service Information</p>
            <p>
              After submitting your request, our team will schedule your pump-out service during your selected week.
              You'll receive a notification when your service is scheduled and completed.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} className="bg-[#38B2AC] hover:bg-opacity-90">
            {isSubmitting ? 'Submitting...' : 'Request Service'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}