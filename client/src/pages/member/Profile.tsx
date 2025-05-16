import { Helmet } from "react-helmet";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, ServiceLevel } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

const profileFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("profile");
  const [isUpdating, setIsUpdating] = useState(false);

  // Get current subscription data
  const { data: subscription } = useQuery({
    queryKey: ['/api/users/me/subscription'],
    queryFn: async () => {
      try {
        // First try to get from subscription endpoint
        const response = await fetch('/api/users/me/subscription', {
          credentials: 'include'
        });
        
        if (response.ok) {
          return response.json();
        }
        
        // If that fails, create a fallback subscription from user data
        if (user?.serviceLevelId) {
          return {
            userId: user.id,
            serviceLevelId: user.serviceLevelId,
            startDate: new Date().toISOString()
          };
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching subscription:', error);
        // Still create fallback from user data if possible
        if (user?.serviceLevelId) {
          return {
            userId: user.id,
            serviceLevelId: user.serviceLevelId,
            startDate: new Date().toISOString()
          };
        }
        return null;
      }
    },
  });

  // Get all service levels
  const { data: serviceLevels } = useQuery<ServiceLevel[]>({
    queryKey: ['/api/service-levels'],
    queryFn: undefined,
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onProfileSubmit(data: ProfileFormValues) {
    setIsUpdating(true);
    try {
      // This would be a real API call in a production app
      await apiRequest('PUT', '/api/users/profile', data);
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      
      // Update the cached user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    setIsUpdating(true);
    try {
      // This would be a real API call in a production app
      await apiRequest('PUT', '/api/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      passwordForm.reset();
    } catch (error) {
      console.error('Password update error:', error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your password. Please ensure your current password is correct.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleServiceLevelChange(serviceLevelId: string) {
    setIsUpdating(true);
    try {
      // This would be a real API call in a production app
      await apiRequest('PUT', '/api/users/service-level', {
        serviceLevelId: parseInt(serviceLevelId),
      });
      
      toast({
        title: "Service level updated",
        description: "Your service level has been updated successfully.",
      });
      
      // Update the cached user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      console.error('Service level update error:', error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your service level.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Profile - Poopalotzi</title>
        <meta name="description" content="Manage your account profile and preferences" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A]">Account Settings</h1>
          <p className="text-gray-600">
            Manage your profile information, password, and service plan.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="billing">Service Plan</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form className="space-y-6" onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!!user?.oauthProvider} />
                            </FormControl>
                            {user?.oauthProvider && (
                              <FormDescription>
                                Email managed by {user.oauthProvider} account.
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Used for service notifications (optional).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="bg-[#38B2AC]" disabled={isUpdating}>
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to maintain account security.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user?.oauthProvider ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-yellow-800">
                      Your account uses {user.oauthProvider} for authentication. Password management is handled by your {user.oauthProvider} account.
                    </p>
                  </div>
                ) : (
                  <Form {...passwordForm}>
                    <form className="space-y-6" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Separator />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Must be at least 8 characters.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="bg-[#38B2AC]" disabled={isUpdating}>
                        {isUpdating ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Plan Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Plan</CardTitle>
                <CardDescription>
                  Manage your subscription and service plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Current Plan</h3>
                  <div className="bg-[#F4EBD0] p-4 rounded-md">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                      <div>
                        {subscription && subscription.serviceLevelId ? (
                          <>
                            <p className="text-xl font-bold text-[#0B1F3A]">
                              {serviceLevels?.find(plan => plan.id === subscription.serviceLevelId)?.name}
                            </p>
                            <p className="text-gray-600">
                              {serviceLevels?.find(plan => plan.id === subscription.serviceLevelId)?.description}
                            </p>
                            
                            {/* Show subscription period for monthly/seasonal plans */}
                            {serviceLevels?.find(plan => plan.id === subscription.serviceLevelId)?.type !== 'one-time' && (
                              <p className="text-sm text-gray-600 mt-1">
                                {serviceLevels?.find(plan => plan.id === subscription.serviceLevelId)?.type === 'monthly' ?
                                  'Valid: May 1 - May 31' : 'Valid: May 1 - Oct 31'}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xl font-bold text-[#0B1F3A]">No active plan</p>
                        )}
                      </div>
                      {subscription && subscription.serviceLevelId && (
                        <div className="mt-2 md:mt-0">
                          <span className="text-lg font-bold text-[#0B1F3A]">
                            {formatCurrency(serviceLevels?.find(plan => plan.id === subscription.serviceLevelId)?.price || 0)}
                          </span>
                          <span className="text-gray-600 text-sm">
                            /{serviceLevels?.find(plan => plan.id === subscription.serviceLevelId)?.type === 'one-time' ? 'service' : 
                              serviceLevels?.find(plan => plan.id === subscription.serviceLevelId)?.type === 'monthly' ? 'month' : 'season'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Change Plan</h3>
                  <Select
                    onValueChange={handleServiceLevelChange}
                    defaultValue={user?.serviceLevelId?.toString()}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-full md:w-[300px]">
                      <SelectValue placeholder="Select a service plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceLevels?.map(plan => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} - {formatCurrency(plan.price)}/{plan.type === 'one-time' ? 'service' : 
                          plan.type === 'monthly' ? 'month' : 'season'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">Payment Methods</h3>
                  <p className="text-gray-600 mb-4">
                    Manage your payment methods and billing preferences.
                  </p>
                  <Button variant="outline">Manage Payment Methods</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
