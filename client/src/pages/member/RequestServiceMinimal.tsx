import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  const [boats, setBoats] = useState<any[]>([]);
  const [credits, setCredits] = useState<any>(null);

  // Fetch boats and credits on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [boatsResponse, creditsResponse] = await Promise.all([
          fetch('/api/boats', { credentials: 'include' }),
          fetch('/api/users/me/credits', { credentials: 'include' })
        ]);
        
        if (boatsResponse.ok) {
          const boatsData = await boatsResponse.json();
          setBoats(boatsData);
        }
        
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json();
          setCredits(creditsData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user]);

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
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit request');
      }

      setIsSuccess(true);
      toast({
        title: "Request Submitted!",
        description: "Your pump-out service request has been submitted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Login Required</AlertTitle>
            <AlertDescription>
              Please log in to request pump-out services.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Your pump-out service request has been submitted successfully.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/member/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" onClick={() => setIsSuccess(false)} className="w-full">
              Submit Another Request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Request Pump-Out Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          {boats?.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Boats Found</AlertTitle>
              <AlertDescription>
                You need to add a boat before requesting services.{" "}
                <Link href="/member/boats" className="underline">
                  Add a boat here
                </Link>
              </AlertDescription>
            </Alert>
          ) : (
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
                          {boats?.map((boat) => (
                            <SelectItem key={boat.id} value={boat.id.toString()}>
                              {boat.name} - {boat.marina?.name}
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
                          {weekOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special instructions or notes..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {credits && (
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertTitle>Available Credits</AlertTitle>
                    <AlertDescription>
                      You have {credits.totalPumpOuts} pump-out credits remaining.
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}