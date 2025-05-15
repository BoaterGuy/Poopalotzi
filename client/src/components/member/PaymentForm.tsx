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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DialogFooter } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CreditCard, DollarSign, Lock } from "lucide-react";

const paymentFormSchema = z.object({
  cardholderName: z.string().min(2, {
    message: "Cardholder name must be at least 2 characters.",
  }),
  cardNumber: z.string()
    .min(16, { message: "Card number must be at least 16 digits." })
    .max(19, { message: "Card number must not exceed 19 digits." })
    .regex(/^[0-9]+$/, { message: "Card number must contain only digits." }),
  expiryMonth: z.string().min(1, { message: "Please enter expiry month." }),
  expiryYear: z.string().min(1, { message: "Please enter expiry year." }),
  cvv: z.string()
    .min(3, { message: "CVV must be at least 3 digits." })
    .max(4, { message: "CVV must not exceed 4 digits." })
    .regex(/^[0-9]+$/, { message: "CVV must contain only digits." }),
  zipCode: z.string().min(5, { message: "Zip code must be at least 5 characters." }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  requestId: number;
  amount: number;
  onSuccess: () => void;
}

export default function PaymentForm({ requestId, amount, onSuccess }: PaymentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardholderName: "",
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      zipCode: "",
    },
  });

  const onSubmit = async (data: PaymentFormValues) => {
    setIsSubmitting(true);
    try {
      // In a real application, this would call a secure payment processor
      // NEVER process actual payments in client-side code
      await apiRequest("POST", `/api/pump-out-requests/${requestId}/payment`, {
        paymentDetails: {
          ...data,
          amount,
        },
      });
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Failed",
        description: "There was a problem processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format card number with spaces for readability
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Generate array of months for select
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      value: month.toString().padStart(2, "0"),
      label: month.toString().padStart(2, "0"),
    };
  });

  // Generate array of years for select
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear + i;
    return {
      value: year.toString(),
      label: year.toString(),
    };
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-md border border-blue-100 flex items-center space-x-3 mb-6">
          <Lock className="h-5 w-5 text-blue-500" />
          <div>
            <h4 className="text-sm font-medium text-blue-700">Secure Payment</h4>
            <p className="text-xs text-blue-600">
              Your payment information is encrypted and secure
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Payment Details</h3>
            <p className="text-sm text-gray-500">
              Complete your payment for pump-out service
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Amount</p>
            <p className="text-2xl font-bold text-green-600">${amount.toFixed(2)}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          {/* Cardholder Name */}
          <FormField
            control={form.control}
            name="cardholderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cardholder Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Card Number */}
          <FormField
            control={form.control}
            name="cardNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      className="pl-10"
                      placeholder="4111 1111 1111 1111" 
                      {...field}
                      value={formatCardNumber(field.value)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s+/g, "");
                        field.onChange(value);
                      }}
                      maxLength={19}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            {/* Expiry Month */}
            <FormField
              control={form.control}
              name="expiryMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Month</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MM"
                      {...field}
                      maxLength={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiry Year */}
            <FormField
              control={form.control}
              name="expiryYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Year</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="YYYY"
                      {...field}
                      maxLength={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CVV */}
            <FormField
              control={form.control}
              name="cvv"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CVV</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="123"
                      {...field}
                      maxLength={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Zip Code */}
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Zip Code</FormLabel>
                <FormControl>
                  <Input placeholder="12345" {...field} maxLength={10} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <p className="text-sm text-gray-500">
          By clicking "Pay Now", you agree to the terms of service and privacy policy.
          Your card will be charged ${amount.toFixed(2)} for the pump-out service.
        </p>

        <DialogFooter>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Processing..." : (
              <span className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Pay ${amount.toFixed(2)} Now
              </span>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}