import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
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
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";
import { Separator } from "@/components/ui/separator";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

interface SignInFormProps {
  onSuccess: () => void;
}

export default function SignInForm({ onSuccess }: SignInFormProps) {
  const { login, loginWithGoogle, loginWithFacebook, loginWithApple } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password, { credentials: 'include' });
      onSuccess();
    } catch (error: any) {
      console.error("Login error:", error);
      const message = error?.response?.data?.message || "Login failed. Please check your credentials and try again.";
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook" | "apple") => {
    try {
      switch (provider) {
        case "google":
          await loginWithGoogle();
          break;
        case "facebook":
          await loginWithFacebook();
          break;
        case "apple":
          await loginWithApple();
          break;
      }
      // Success will be handled by auth state change in AuthContext
    } catch (error) {
      console.error(`${provider} login error:`, error);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="your@email.com" 
                    type="email" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="••••••••" 
                    type="password"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button variant="link" className="px-0 text-[#38B2AC]" type="button">
              Forgot Password?
            </Button>
          </div>
          <Button
            type="submit"
            className="w-full bg-[#FF6B6B] hover:bg-opacity-90"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>

      <div className="relative flex items-center justify-center">
        <Separator className="absolute w-full" />
        <span className="relative bg-white px-2 text-xs text-gray-500">
          or continue with
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="border-gray-300"
          type="button"
          onClick={() => handleSocialLogin("google")}
        >
          <FaGoogle className="mr-2 text-red-500" /> Google
        </Button>
        <Button
          variant="outline"
          className="border-gray-300"
          type="button"
          onClick={() => handleSocialLogin("facebook")}
        >
          <FaFacebook className="mr-2 text-blue-600" /> Facebook
        </Button>
        <Button
          variant="outline"
          className="border-gray-300"
          type="button"
          onClick={() => handleSocialLogin("apple")}
        >
          <FaApple className="mr-2" /> Apple
        </Button>
      </div>
    </div>
  );
}
