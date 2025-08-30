import { useState } from "react";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { CalendarIcon, Ship, MapPin, Check, AlertCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

// Define the schema for the manual entry form
const manualEntrySchema = z.object({
  marinaId: z.string({
    required_error: "Please select a marina",
  }),
  boatName: z.string({
    required_error: "Please enter a boat name",
  }).min(2, "Boat name must be at least 2 characters"),
  boatLength: z.string().optional(),
  boatColor: z.string().optional(),
  boatRegistration: z.string().optional(),
  ownerName: z.string({
    required_error: "Please enter the owner's name",
  }).min(2, "Owner name must be at least 2 characters"),
  ownerEmail: z.string().email("Please enter a valid email address").optional(),
  ownerPhone: z.string().optional(),
  serviceDate: z.date({
    required_error: "Please select a service date",
  }),
  pumpOutPorts: z.array(z.string()).min(1, "Select at least one pump-out port"),
  notes: z.string().optional(),
  isSingleHead: z.boolean().default(true),
  paymentReceived: z.boolean().default(false),

type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

export default function ManualEntry() {
  const { toast } = useToast();
  // React Query removed
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pumpOutPorts, setPumpOutPorts] = useState<string[]>([]);

  // Fetch all marinas
  // React Query removed
    queryFn: undefined,

  // The list of possible pump-out port locations
  const pumpOutPortOptions = [
    { value: "Port", label: "Port" },
    { value: "Starboard", label: "Starboard" },
    { value: "Bow", label: "Bow" },
    { value: "Mid-ship", label: "Mid-ship" },
    { value: "Stern", label: "Stern" }
  ];

  const form = useForm<ManualEntryFormValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      serviceDate: new Date(),
      notes: "",
      isSingleHead: true,
      paymentReceived: false,
      pumpOutPorts: [],
    },

  // Handle adding or removing pump-out ports
  const togglePumpOutPort = (port: string) => {
    setPumpOutPorts(prev => {
      if (prev.includes(port)) {
        const newPorts = prev.filter(p => p !== port);
        form.setValue("pumpOutPorts", newPorts);
        return newPorts;
      } else {
        const newPorts = [...prev, port];
        form.setValue("pumpOutPorts", newPorts);
        return newPorts;
  };

  const onSubmit = async (data: ManualEntryFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Format request data for the API
      const weekStartDate = startOfWeek(data.serviceDate, { weekStartsOn: 1 });
      
      // Create a request payload with all the necessary information
      const requestData = {
        // Use 0 as the boatId to indicate this is a manual entry
        boatId: 0, 
        manualBoatInfo: {
          name: data.boatName,
          length: data.boatLength,
          color: data.boatColor,
          registration: data.boatRegistration,
          ownerName: data.ownerName,
          ownerEmail: data.ownerEmail,
          ownerPhone: data.ownerPhone,
          marinaId: parseInt(data.marinaId),
          isSingleHead: data.isSingleHead
        },
        weekStartDate: format(weekStartDate, "yyyy-MM-dd"),
        requestedDate: format(data.serviceDate, "yyyy-MM-dd"),
        pumpOutPorts: data.pumpOutPorts,
        ownerNotes: data.notes,
        status: "Completed", // Manual entries are always completed
        paymentStatus: data.paymentReceived ? "Paid" : "Pending",
        paymentId: data.paymentReceived ? `manual_${Date.now()}` : undefined,
        testMode: true, // For development
        manualEntry: true // Flag to indicate this is a manual entry
      };
      
      // Send the request to the API
      const response = await fetch("/api/pump-out-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
        credentials: "include"
      
      if (response.ok) {
        toast({
          title: "Service Entry Created",
          description: "The manual service entry has been recorded successfully.",
        
        // Invalidate relevant queries to refresh any data
        
        // Reset form and selected values
        form.reset();
        setPumpOutPorts([]);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to create entry: ${errorText}`);
    } catch (error) {
      console.error("Error creating manual entry:", error);
      toast({
        title: "Error",
        description: "There was a problem creating the service entry. Please try again.",
        variant: "destructive",
    } finally {
      setIsSubmitting(false);
  };

  return (
    <>
      <Helmet>
        <title>Manual Service Entry - Poopalotzi</title>
        <meta name="description" content="Create manual service entries for completed pump-out services" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A]">Manual Service Entry</h1>
          <p className="text-gray-600">
            Record completed pump-out services that were performed outside the scheduling system
          </p>
        </div>

        <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            This form allows you to record pump-out services that were performed manually. 
            All manual entries are automatically marked as "Completed".
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
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <MapPin className="mr-2 h-5 w-5 text-[#0B1F3A]" />
                          Location Information
                        </h3>
                        <div className="space-y-4">
                          {/* Marina Selection */}
                          <FormField
                            control={form.control}
                            name="marinaId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Marina Location</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  disabled={isLoadingMarinas}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a marina" />
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
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <Ship className="mr-2 h-5 w-5 text-[#0B1F3A]" />
                          Boat Information
                        </h3>
                        <div className="space-y-4">
                          {/* Boat Information Fields */}
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              name="boatRegistration"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Registration No.</FormLabel>
                                  <FormControl>
                                    <Input placeholder="OH-12345" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

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
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <User className="mr-2 h-5 w-5 text-[#0B1F3A]" />
                          Owner Information
                        </h3>
                        <div className="space-y-4">
                          {/* Owner Information Fields */}
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
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <CalendarIcon className="mr-2 h-5 w-5 text-[#0B1F3A]" />
                          Service Details
                        </h3>
                        <div className="space-y-4">
                          {/* Service Date */}
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
                                      disabled={(date) => date > new Date() || date < new Date("2023-01-01")}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  The date when the service was performed
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Pump-Out Ports */}
                          <FormField
                            control={form.control}
                            name="pumpOutPorts"
                            render={() => (
                              <FormItem>
                                <div className="mb-4">
                                  <FormLabel>Pump-Out Ports</FormLabel>
                                  <FormDescription>
                                    Select all port locations that were serviced
                                  </FormDescription>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {pumpOutPortOptions.map((option) => (
                                    <FormField
                                      key={option.value}
                                      control={form.control}
                                      name="pumpOutPorts"
                                      render={() => {
                                        return (
                                          <FormItem
                                            key={option.value}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={pumpOutPorts.includes(option.value)}
                                                onCheckedChange={() => togglePumpOutPort(option.value)}
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Notes */}
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Service Notes</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter any notes about the service performed"
                                    className="resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Payment Received */}
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
                                    Check if payment has already been received for this service
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
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
                <CardTitle>Manual Entry Guide</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1F3A] mb-2">When to Use</h3>
                    <p className="text-gray-600 text-sm">
                      Manual entries should be used when a pump-out service was performed outside of the normal scheduling system. Examples include:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-1">
                      <li>Emergency pump-outs requested by boat owners</li>
                      <li>Services performed at marinas without internet access</li>
                      <li>When the system was unavailable</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1F3A] mb-2">Documentation</h3>
                    <p className="text-gray-600 text-sm">
                      Be sure to include accurate information about the boat and service to ensure proper record-keeping.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1F3A] mb-2">Notes</h3>
                    <p className="text-gray-600 text-sm">
                      Include any relevant information about the service, especially any unusual circumstances or issues encountered.
                    </p>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                    <h4 className="text-blue-700 font-medium">Important</h4>
                    <p className="text-sm text-blue-600">
                      Manual entries are automatically marked as "Completed" and if an email is provided, the boat owner will be notified once the entry is created.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
