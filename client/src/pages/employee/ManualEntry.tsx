import { useState } from "react";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
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
import { format } from "date-fns";
import { CalendarIcon, Ship, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const manualEntrySchema = z.object({
  boatId: z.string(),
  serviceDate: z.date(),
  notes: z.string().optional(),
  beforePhoto: z.any().optional(),
  duringPhoto: z.any().optional(),
  afterPhoto: z.any().optional(),
});

type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

export default function ManualEntry() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMarinaId, setSelectedMarinaId] = useState<string | null>(null);

  // Fetch all boats
  const { data: boats, isLoading: isLoadingBoats } = useQuery({
    queryKey: ['/api/boats/all'],
    queryFn: undefined,
  });

  // Fetch all marinas
  const { data: marinas, isLoading: isLoadingMarinas } = useQuery({
    queryKey: ['/api/marinas'],
    queryFn: undefined,
  });

  // Fetch slip assignments for the selected marina
  const { data: slips, isLoading: isLoadingSlips } = useQuery({
    queryKey: ['/api/slip-assignments/marina', selectedMarinaId],
    queryFn: undefined,
    enabled: !!selectedMarinaId,
  });

  const form = useForm<ManualEntryFormValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      notes: "",
      serviceDate: new Date(),
    },
  });

  const onSubmit = async (data: ManualEntryFormValues) => {
    setIsSubmitting(true);
    
    try {
      // For a real implementation, this would upload photos
      // and then create the service record
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Service Entry Created",
        description: "The manual service entry has been recorded successfully.",
      });
      
      // Reset form
      form.reset();
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A]">Manual Service Entry</h1>
          <p className="text-gray-600">
            Record completed pump-out services that were performed outside the scheduling system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle>Service Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      {/* Marina Selection */}
                      <div>
                        <FormLabel>Marina</FormLabel>
                        <Select 
                          onValueChange={(value) => setSelectedMarinaId(value)}
                          value={selectedMarinaId || undefined}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a marina" />
                          </SelectTrigger>
                          <SelectContent>
                            {marinas?.map((marina: any) => (
                              <SelectItem key={marina.id} value={marina.id.toString()}>
                                {marina.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Boat Selection */}
                      <FormField
                        control={form.control}
                        name="boatId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Boat</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!selectedMarinaId || isLoadingSlips}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a boat" />
                              </SelectTrigger>
                              <SelectContent>
                                {slips?.map((slip: any) => {
                                  const boat = boats?.find((boat: any) => boat.id === slip.boatId);
                                  return boat ? (
                                    <SelectItem key={boat.id} value={boat.id.toString()}>
                                      {boat.name} - Dock {slip.dock}, Slip {slip.slip}
                                    </SelectItem>
                                  ) : null;
                                })}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the marina first to see available boats
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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

                      {/* Photo Upload Section */}
                      <div className="space-y-3">
                        <FormLabel>Service Documentation (Optional)</FormLabel>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs mb-1">Before Service</p>
                            <div className="border border-dashed rounded-md p-2 flex flex-col items-center justify-center h-24">
                              <input 
                                type="file" 
                                id="before-photo" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    form.setValue("beforePhoto", e.target.files[0]);
                                  }
                                }}
                              />
                              {form.watch("beforePhoto") ? (
                                <div className="text-center">
                                  <Check className="h-5 w-5 text-green-500 mx-auto mb-1" />
                                  <p className="text-xs truncate max-w-full">
                                    {form.watch("beforePhoto").name}
                                  </p>
                                  <button 
                                    type="button"
                                    className="text-xs text-red-500"
                                    onClick={() => form.setValue("beforePhoto", undefined)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <label htmlFor="before-photo" className="cursor-pointer text-center">
                                  <Ship className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                  <span className="text-xs text-gray-500">Upload Photo</span>
                                </label>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs mb-1">During Service</p>
                            <div className="border border-dashed rounded-md p-2 flex flex-col items-center justify-center h-24">
                              <input 
                                type="file" 
                                id="during-photo" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    form.setValue("duringPhoto", e.target.files[0]);
                                  }
                                }}
                              />
                              {form.watch("duringPhoto") ? (
                                <div className="text-center">
                                  <Check className="h-5 w-5 text-green-500 mx-auto mb-1" />
                                  <p className="text-xs truncate max-w-full">
                                    {form.watch("duringPhoto").name}
                                  </p>
                                  <button 
                                    type="button"
                                    className="text-xs text-red-500"
                                    onClick={() => form.setValue("duringPhoto", undefined)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <label htmlFor="during-photo" className="cursor-pointer text-center">
                                  <Ship className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                  <span className="text-xs text-gray-500">Upload Photo</span>
                                </label>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs mb-1">After Service</p>
                            <div className="border border-dashed rounded-md p-2 flex flex-col items-center justify-center h-24">
                              <input 
                                type="file" 
                                id="after-photo" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    form.setValue("afterPhoto", e.target.files[0]);
                                  }
                                }}
                              />
                              {form.watch("afterPhoto") ? (
                                <div className="text-center">
                                  <Check className="h-5 w-5 text-green-500 mx-auto mb-1" />
                                  <p className="text-xs truncate max-w-full">
                                    {form.watch("afterPhoto").name}
                                  </p>
                                  <button 
                                    type="button"
                                    className="text-xs text-red-500"
                                    onClick={() => form.setValue("afterPhoto", undefined)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <label htmlFor="after-photo" className="cursor-pointer text-center">
                                  <Ship className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                  <span className="text-xs text-gray-500">Upload Photo</span>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="bg-[#38B2AC] hover:bg-opacity-90"
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
                      While uploading photos is optional, it is strongly recommended to document the service with before, during, and after photos whenever possible.
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
                      Manual entries are automatically marked as "Completed" and the boat owner will be notified via email once the entry is created.
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
}
