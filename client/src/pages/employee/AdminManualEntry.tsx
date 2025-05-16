import { useState } from "react";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek } from "date-fns";
import { CalendarIcon, Ship, MapPin, User, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

// Define the schema for manual entry
const manualEntrySchema = z.object({
  marinaId: z.string({
    required_error: "Please select a marina",
  }),
  boatName: z.string({
    required_error: "Please enter a boat name",
  }).min(2, "Boat name must be at least 2 characters"),
  boatLength: z.string().optional(),
  boatColor: z.string().optional(),
  ownerName: z.string({
    required_error: "Please enter the owner's name",
  }).min(2, "Owner name must be at least 2 characters"),
  ownerEmail: z.string().email("Please enter a valid email address").optional(),
  ownerPhone: z.string().optional(),
  serviceDate: z.date({
    required_error: "Please select a service date",
  }),
  portLocation: z.array(z.string()).min(1, "Select at least one pump-out port"),
  notes: z.string().optional(),
  isSingleHead: z.boolean().default(true),
  paymentReceived: z.boolean().default(false),
});

type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

export default function AdminManualEntry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPortLocations, setSelectedPortLocations] = useState<string[]>([]);

  // Fetch all marinas
  const { data: marinas = [], isLoading: isLoadingMarinas } = useQuery({
    queryKey: ['/api/marinas'],
    queryFn: undefined,
  });

  // Port location options
  const portLocations = [
    { id: "port", label: "Port" },
    { id: "starboard", label: "Starboard" },
    { id: "bow", label: "Bow" },
    { id: "midship", label: "Mid-ship" },
    { id: "stern", label: "Stern" }
  ];

  const form = useForm<ManualEntryFormValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      serviceDate: new Date(),
      notes: "",
      isSingleHead: true,
      paymentReceived: false,
      portLocation: [],
    },
  });

  // Toggle port location selection
  const togglePortLocation = (location: string) => {
    setSelectedPortLocations(prev => {
      if (prev.includes(location)) {
        const newLocations = prev.filter(p => p !== location);
        form.setValue("portLocation", newLocations);
        return newLocations;
      } else {
        const newLocations = [...prev, location];
        form.setValue("portLocation", newLocations);
        return newLocations;
      }
    });
  };

  const onSubmit = async (data: ManualEntryFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Format request data for API
      const weekStart = startOfWeek(data.serviceDate, { weekStartsOn: 1 });
      
      // Create payload for manual entry
      const requestData = {
        boatId: 0, // Temporary ID for manual entry
        manualEntry: true,
        manualBoatInfo: {
          name: data.boatName,
          length: data.boatLength || "30",
          color: data.boatColor || "White",
          ownerName: data.ownerName,
          ownerEmail: data.ownerEmail,
          ownerPhone: data.ownerPhone,
          marinaId: parseInt(data.marinaId),
          isSingleHead: data.isSingleHead
        },
        weekStartDate: format(weekStart, "yyyy-MM-dd"),
        requestedDate: format(data.serviceDate, "yyyy-MM-dd"),
        pumpOutPorts: data.portLocation,
        ownerNotes: data.notes || "",
        status: "Completed",
        paymentStatus: data.paymentReceived ? "Paid" : "Pending",
        paymentId: data.paymentReceived ? `manual_${Date.now()}` : undefined,
        testMode: true
      };
      
      // API call to create pump-out request
      const response = await fetch("/api/pump-out-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
        credentials: "include"
      });
      
      if (response.ok) {
        toast({
          title: "Service Entry Created",
          description: "The manual service entry has been recorded successfully.",
        });
        
        // Update data
        queryClient.invalidateQueries({ queryKey: ['/api/pump-out-requests'] });
        
        // Reset form
        form.reset();
        setSelectedPortLocations([]);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to create entry: ${errorText}`);
      }
    } catch (error) {
      console.error("Error creating manual entry:", error);
      toast({
        title: "Error",
        description: "There was a problem creating the service entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Manual Service Entry - Poopalotzi</title>
        <meta name="description" content="Create manual service entries for completed pump-out services" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0B1F3A]">Manual Service Entry</h1>
          <p className="text-gray-600 mt-1">
            Record completed pump-out services that were performed outside the scheduling system
          </p>
        </div>

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertIcon className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            All manual entries are automatically marked as "Completed"
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle>Service Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Marina Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <MapPin className="mr-2 h-5 w-5 text-[#0B1F3A]" />
                        Marina
                      </h3>
                      <FormField
                        control={form.control}
                        name="marinaId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Marina</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose marina" />
                              </SelectTrigger>
                              <SelectContent>
                                {marinas.map((marina: any) => (
                                  <SelectItem key={marina.id} value={marina.id.toString()}>
                                    {marina.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Boat Information */}
                    <div className="space-y-4 pt-2">
                      <h3 className="text-lg font-medium flex items-center">
                        <Ship className="mr-2 h-5 w-5 text-[#0B1F3A]" />
                        Boat Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="boatName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Boat Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter boat name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="boatLength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Boat Length (ft)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 30" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="boatColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Boat Color</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. White/Blue" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isSingleHead"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Single-Head Boat</FormLabel>
                              <FormDescription>
                                Check if this is a single-head boat. Uncheck for multi-head.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Owner Information */}
                    <div className="space-y-4 pt-2">
                      <h3 className="text-lg font-medium flex items-center">
                        <User className="mr-2 h-5 w-5 text-[#0B1F3A]" />
                        Owner Information
                      </h3>
                      <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter owner's full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="ownerEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="ownerPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="(555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Service Details */}
                    <div className="space-y-4 pt-2">
                      <h3 className="text-lg font-medium flex items-center">
                        <CalendarIcon className="mr-2 h-5 w-5 text-[#0B1F3A]" />
                        Service Details
                      </h3>
                      <FormField
                        control={form.control}
                        name="serviceDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Service Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="portLocation"
                        render={() => (
                          <FormItem>
                            <div className="mb-2">
                              <FormLabel>Pump-Out Port Locations</FormLabel>
                              <FormDescription>
                                Select all port locations that were serviced
                              </FormDescription>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {portLocations.map((location) => (
                                <FormItem
                                  key={location.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={selectedPortLocations.includes(location.id)}
                                      onCheckedChange={() => togglePortLocation(location.id)}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {location.label}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter any notes about the service"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentReceived"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Payment Received</FormLabel>
                              <FormDescription>
                                Check if payment has already been collected for this service
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="bg-[#0B1F3A] hover:bg-opacity-90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating Entry..." : "Create Service Entry"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle>About Manual Entries</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1F3A] mb-2">When to Use</h3>
                    <p className="text-gray-600 text-sm">
                      Use manual entries when a service was performed outside the scheduling system:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-1">
                      <li>Emergency pump-outs</li>
                      <li>When the system was unavailable</li>
                      <li>For non-registered customers</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1F3A] mb-2">Important</h3>
                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-1">
                      <li>Manual entries are marked as "Completed"</li>
                      <li>If email is provided, the customer will receive a receipt</li>
                      <li>The service counts toward usage statistics</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}