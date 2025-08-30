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

const signUpSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const { register, loginWithGoogle, loginWithFacebook, loginWithApple } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },

  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    
    try {
      await register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        role: "member", // Default role for new sign-ups
      
      onSuccess();
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
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
      // Success will be handled by auth state change in AuthContext
    } catch (error) {
      console.error(`${provider} login error:`, error);
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
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
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
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
          
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-[#FF6B6B] hover:bg-opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </form>
      </Form>

      <div className="relative flex items-center justify-center">
        <Separator className="absolute w-full" />
        <span className="relative bg-white px-2 text-xs text-gray-500">
          or sign up with
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
