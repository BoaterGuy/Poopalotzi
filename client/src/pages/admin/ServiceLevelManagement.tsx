import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertServiceLevelSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Pencil, Trash2, Plus, DollarSign } from "lucide-react";

// Define service level types and validate price as a number
const serviceLevelFormSchema = insertServiceLevelSchema
  .extend({
    name: z.string().min(2, {
      message: "Service level name must be at least 2 characters.",
    }),
    price: z.coerce.number().min(0, {
      message: "Price must be a positive number.",
    }),
    type: z.enum(["one-time", "monthly", "seasonal"], {
      required_error: "Please select a service type.",
    }),
    description: z.string().min(5, {
      message: "Description must be at least 5 characters.",
    }),
  });

type ServiceLevelFormValues = z.infer<typeof serviceLevelFormSchema>;

const INITIAL_SERVICE_LEVELS = [
  {
    id: 1,
    name: "Single Service (Single Head)",
    price: 60,
    type: "one-time",
    description: "One-time pump out of a single head.",
    monthlyQuota: null,
    onDemandQuota: 1,
    isActive: true,
  },
  {
    id: 2,
    name: "Monthly Plan (Single Head)",
    price: 100,
    type: "monthly",
    description: "2 pump-outs/month, single head.",
    monthlyQuota: 2,
    onDemandQuota: null,
    isActive: true,
  },
  {
    id: 3,
    name: "Seasonal Service (Single Head)",
    price: 475,
    type: "seasonal",
    description: "May 1–Oct 31: 2 pump-outs/month + 1 on-demand.",
    monthlyQuota: 2,
    onDemandQuota: 1,
    isActive: true,
  },
  {
    id: 4,
    name: "Single Service (Multi-Head)",
    price: 75,
    type: "one-time",
    description: "One-time pump out of a multi-head boat.",
    monthlyQuota: null,
    onDemandQuota: 1,
    isActive: true,
  },
  {
    id: 5,
    name: "Monthly Plan (Multi-Head)",
    price: 140,
    type: "monthly",
    description: "2 pump-outs/month, multi-head.",
    monthlyQuota: 2,
    onDemandQuota: null,
    isActive: true,
  },
  {
    id: 6,
    name: "Seasonal Service (Multi-Head)",
    price: 675,
    type: "seasonal",
    description: "May 1–Oct 31: 2 pump-outs/month + 1 on-demand, multi-head.",
    monthlyQuota: 2,
    onDemandQuota: 1,
    isActive: true,
  },
];

export default function ServiceLevelManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingLevel, setIsAddingLevel] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any | null>(null);
  const [deletingLevel, setDeletingLevel] = useState<any | null>(null);

  // Fetch service levels
  const { data: serviceLevels = INITIAL_SERVICE_LEVELS, isLoading } = useQuery({
    queryKey: ['/api/service-levels'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/service-levels', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch service levels');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching service levels:', error);
        // Return initial service levels as fallback
        return INITIAL_SERVICE_LEVELS;
      }
    },
  });

  // Form handling for add/edit service level
  const ServiceLevelForm = ({ level, onSuccess }: { level?: any, onSuccess: () => void }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const defaultValues: Partial<ServiceLevelFormValues> = {
      name: level?.name || "",
      price: level?.price || 0,
      type: level?.type || "one-time",
      description: level?.description || "",
      monthlyQuota: level?.monthlyQuota || null,
      onDemandQuota: level?.onDemandQuota || null,
      isActive: level?.isActive ?? true,
    };
    
    const form = useForm<ServiceLevelFormValues>({
      resolver: zodResolver(serviceLevelFormSchema),
      defaultValues,
    });
    
    const serviceType = form.watch("type");
    
    const onSubmit = async (data: ServiceLevelFormValues) => {
      setIsSubmitting(true);
      try {
        if (level) {
          // Update existing service level
          await apiRequest("PUT", `/api/service-levels/${level.id}`, data);
          toast({
            title: "Service Level Updated",
            description: "The service level has been updated successfully.",
          });
        } else {
          // Create new service level
          await apiRequest("POST", "/api/service-levels", data);
          toast({
            title: "Service Level Created",
            description: "The new service level has been created successfully.",
          });
        }
        
        queryClient.invalidateQueries({ queryKey: ['/api/service-levels'] });
        onSuccess();
      } catch (error) {
        console.error("Error submitting service level:", error);
        toast({
          title: "Error",
          description: "There was a problem saving the service level. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };
    
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Level Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Monthly Plan (Single Head)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($) *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the service level..."
                    {...field}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            {(serviceType === "monthly" || serviceType === "seasonal") && (
              <FormField
                control={form.control}
                name="monthlyQuota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Service Quota</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 2"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of services included per month
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {(serviceType === "one-time" || serviceType === "seasonal") && (
              <FormField
                control={form.control}
                name="onDemandQuota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>On-Demand Service Quota</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 1"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of on-demand services allowed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active</FormLabel>
                  <FormDescription>
                    Only active service levels will be available for selection
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : level ? 'Update Service Level' : 'Create Service Level'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };

  const handleDeleteServiceLevel = async (id: number) => {
    try {
      await apiRequest('PUT', `/api/service-levels/${id}`, { isActive: false });
      
      toast({
        title: "Service Level Deactivated",
        description: "The service level has been deactivated successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/service-levels'] });
      setDeletingLevel(null);
    } catch (error) {
      console.error('Error deactivating service level:', error);
      toast({
        title: "Error",
        description: "There was a problem deactivating the service level.",
        variant: "destructive",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'one-time': return 'One-time';
      case 'monthly': return 'Monthly';
      case 'seasonal': return 'Seasonal';
      default: return type;
    }
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'one-time': return 'bg-blue-500';
      case 'monthly': return 'bg-green-500';
      case 'seasonal': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <Helmet>
        <title>Service Levels | Poopalazi</title>
        <meta name="description" content="Manage pump-out service levels and pricing" />
      </Helmet>
      
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-2xl font-bold">Service Level Management</CardTitle>
              <CardDescription>
                Manage pump-out service levels, pricing, and options
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddingLevel(true)} className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Add Service Level
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">Loading service levels...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Level</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceLevels.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No service levels found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      serviceLevels.map((level) => (
                        <TableRow key={level.id} className={!level.isActive ? "opacity-60" : ""}>
                          <TableCell className="font-medium">{level.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getServiceTypeColor(level.type)} text-white`}
                            >
                              {getTypeLabel(level.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">${level.price.toFixed(2)}</TableCell>
                          <TableCell className="max-w-xs truncate">{level.description}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${level.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {level.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingLevel(level)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => setDeletingLevel(level)}
                                disabled={!level.isActive}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add Service Level Dialog */}
      <Dialog open={isAddingLevel} onOpenChange={setIsAddingLevel}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Service Level</DialogTitle>
            <DialogDescription>
              Create a new service level option for customers
            </DialogDescription>
          </DialogHeader>
          <ServiceLevelForm 
            onSuccess={() => setIsAddingLevel(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Service Level Dialog */}
      <Dialog open={!!editingLevel} onOpenChange={() => setEditingLevel(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Service Level</DialogTitle>
            <DialogDescription>
              Update service level details and pricing
            </DialogDescription>
          </DialogHeader>
          {editingLevel && (
            <ServiceLevelForm 
              level={editingLevel}
              onSuccess={() => setEditingLevel(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingLevel} onOpenChange={() => setDeletingLevel(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate Service Level</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate the "{deletingLevel?.name}" service level? 
              It will no longer be available for new customers, but existing customers will 
              still have access to it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingLevel(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingLevel && handleDeleteServiceLevel(deletingLevel.id)}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}