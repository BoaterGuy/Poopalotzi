import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, apiRequest, queryClient } from "@/lib/queryClient";
import { Users, UserPlus, Shield, User, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const createUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  role: z.enum(["member", "employee", "admin"], {
    required_error: "Please select a role",
  }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "member" | "employee" | "admin";
  createdAt: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRoleChangeDialogOpen, setIsRoleChangeDialogOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    userId: number;
    userName: string;
    currentRole: string;
    newRole: string;
  } | null>(null);

  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserValues) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user role");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CreateUserValues) => {
    createUserMutation.mutate(values);
  };

  const handleRoleChange = (userId: number, newRole: string) => {
    const user = users.find((u: User) => u.id === userId);
    if (!user) return;
    
    // If changing to member, no confirmation needed
    if (newRole === "member") {
      updateRoleMutation.mutate({ userId, role: newRole });
      return;
    }
    
    // For admin or employee roles, show confirmation
    setPendingRoleChange({
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      currentRole: user.role,
      newRole,
    });
    setIsRoleChangeDialogOpen(true);
  };

  const confirmRoleChange = () => {
    if (pendingRoleChange) {
      updateRoleMutation.mutate({
        userId: pendingRoleChange.userId,
        role: pendingRoleChange.newRole,
      });
      setIsRoleChangeDialogOpen(false);
      setPendingRoleChange(null);
    }
  };

  const cancelRoleChange = () => {
    setIsRoleChangeDialogOpen(false);
    setPendingRoleChange(null);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "employee":
        return "secondary";
      default:
        return "default";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "employee":
        return <Settings className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>User Management - Admin Dashboard</title>
        <meta name="description" content="Manage users and permissions" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0B1F3A] flex items-center gap-3">
              <Users className="h-8 w-8" />
              User Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage system users and their permissions
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF6B6B] hover:bg-opacity-90">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. Choose their role carefully.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                          <Input placeholder="john@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
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
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
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
                          <Input placeholder="••••••••" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createUserMutation.isPending}
                      className="bg-[#FF6B6B] hover:bg-opacity-90"
                    >
                      {createUserMutation.isPending ? "Creating..." : "Create User"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading users...</p>
            ) : (
              <div className="space-y-4">
                {users.map((user: User) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-[#F4EBD0] rounded-full">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0B1F3A]">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-gray-500">{user.phone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                      
                      <Select
                        defaultValue={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                
                {users.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No users found.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Change Confirmation Dialog */}
        <Dialog open={isRoleChangeDialogOpen} onOpenChange={setIsRoleChangeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                Confirm Role Change
              </DialogTitle>
              <DialogDescription>
                {pendingRoleChange && (
                  <div className="space-y-2">
                    <p>
                      Are you sure you want to change <strong>{pendingRoleChange.userName}</strong>'s role from{' '}
                      <Badge variant={getRoleBadgeVariant(pendingRoleChange.currentRole)} className="mx-1">
                        {pendingRoleChange.currentRole}
                      </Badge>
                      to{' '}
                      <Badge variant={getRoleBadgeVariant(pendingRoleChange.newRole)} className="mx-1">
                        {pendingRoleChange.newRole}
                      </Badge>?
                    </p>
                    {pendingRoleChange.newRole === "admin" && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
                        <p className="text-sm text-red-800">
                          <strong>Warning:</strong> Admin users have full system access and can modify all settings, users, and data.
                        </p>
                      </div>
                    )}
                    {pendingRoleChange.newRole === "employee" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> Employee users can access the employee dashboard and service management tools.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={cancelRoleChange}>
                Cancel
              </Button>
              <Button 
                onClick={confirmRoleChange}
                disabled={updateRoleMutation.isPending}
                className="bg-[#FF6B6B] hover:bg-opacity-90"
              >
                {updateRoleMutation.isPending ? "Updating..." : "Confirm Change"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}