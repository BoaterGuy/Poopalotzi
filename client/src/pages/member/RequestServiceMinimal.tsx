import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, Ship, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Simple form schema
const requestSchema = z.object({
  boatId: z.coerce.number({ required_error: "Please select a boat" }),
  weekStartDate: z.string({ required_error: "Please select a week" }),
  ownerNotes: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export default function RequestServiceMinimal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch boats
  const { data: boats, isLoading: isLoadingBoats } = useQuery({
    queryKey: ['/api/boats'],
    queryFn: async () => {
      const response = await fetch('/api/boats', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch boats');
      return response.json();
    },
  });

  // Fetch credits
  const { data: creditsData, isLoading: isLoadingCredits } = useQuery({
    queryKey: ['/api/users/me/credits'],
    queryFn: async () => {
      const response = await fetch('/api/users/me/credits', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch credits');
      return response.json();
    },
    enabled: !!user,
  });

  // Generate week options
  const generateWeekOptions = () => {
    const options = [];
    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    
    for (let i = 0; i < 4; i++) {
      const weekStart = addWeeks(currentWeekStart, i);
      const weekEnd = addDays(weekStart, 6);
      
      options.push({
        value: format(weekStart, "yyyy-MM-dd"),
        label: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`,
      });
    }
    
    return options;
  };

  const weekOptions = generateWeekOptions();

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      boatId: boats?.length === 1 ? boats[0].id : undefined,
      weekStartDate: weekOptions[0]?.value,
      ownerNotes: "",
    },
  });

  const onSubmit = async (data: RequestFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/pump-out-requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          status: "Requested",
          paymentStatus: "Pending",
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      toast({
        title: "Service Requested",
        description: "Your pump-out service has been scheduled successfully.",
      });

      setIsSuccess(true);
      
      // Redirect after short delay
      setTimeout(() => {
        window.location.href = '/member/dashboard';
      }, 2000);

    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit service request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingBoats || isLoadingCredits) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#0B1F3A] mb-8">Request Pump-Out Service</h1>
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <>
        <Helmet>
          <title>Request Submitted - Poopalotzi</title>
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Request Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Your pump-out service has been scheduled. You'll be redirected to your dashboard shortly.
              </p>
              <Link to="/member/dashboard">
                <Button className="bg-[#38B2AC]">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // No boats check
  if (boats && boats.length === 0) {
    return (
      <>
        <Helmet>
          <title>Request Service - Poopalotzi</title>
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A] mb-8">Request Pump-Out Service</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <Ship className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">No Boats Found</h2>
              <p className="text-gray-600 mb-6">
                You need to register a boat before you can request pump-out services.
              </p>
              <Link to="/member/boats">
                <Button className="bg-[#38B2AC]">Add Your Boat</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // No credits check
  if (creditsData && creditsData.availableCredits === 0) {
    return (
      <>
        <Helmet>
          <title>Request Service - Poopalotzi</title>
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A] mb-8">Request Pump-Out Service</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">No Credits Available</h2>
              <p className="text-gray-600 mb-6">
                You have used all your available pump-out service credits. Purchase additional services to continue.
              </p>
              <Link to="/member/service-plans">
                <Button className="bg-[#38B2AC]">Purchase Service Credits</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Request Service - Poopalotzi</title>
        <meta name="description" content="Schedule your boat pump-out service" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#0B1F3A] mb-4">Request Pump-Out Service</h1>
        <p className="text-gray-600 mb-8">Schedule a pump-out service for your boat</p>

        {creditsData && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Credits Available</AlertTitle>
            <AlertDescription>
              You have {creditsData.availableCredits} pump-out service{creditsData.availableCredits > 1 ? 's' : ''} available.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle>Schedule a Pump-Out</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="boatId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Boat</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose your boat" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {boats?.map((boat: any) => (
                                <SelectItem key={boat.id} value={boat.id.toString()}>
                                  {boat.name} - {boat.make} {boat.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weekStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Week</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose service week" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {weekOptions.map((week) => (
                                <SelectItem key={week.value} value={week.value}>
                                  {week.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ownerNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any special instructions or requests..."
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-[#38B2AC] hover:bg-opacity-90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Schedule Service"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle>Service Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Credits:</span>
                    <span className="font-semibold">{creditsData?.availableCredits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registered Boats:</span>
                    <span className="font-semibold">{boats?.length || 0}</span>
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