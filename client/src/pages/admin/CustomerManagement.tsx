import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, UserPlus, Search } from "lucide-react";

// Mock data until connected to API
const MOCK_CUSTOMERS = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    serviceLevelId: 2,
    serviceLevel: "Premium",
    boatCount: 2,
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "555-987-6543",
    serviceLevelId: 1,
    serviceLevel: "Basic",
    boatCount: 1,
  },
  {
    id: 3,
    firstName: "Robert",
    lastName: "Johnson",
    email: "robert.johnson@example.com",
    phone: "555-456-7890",
    serviceLevelId: 3,
    serviceLevel: "Premium Plus",
    boatCount: 3,
  },
];

export default function CustomerManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    serviceLevelId: "",
  });

  // Fetch service levels for the dropdown
  const { data: serviceLevels = [] } = useQuery({
    queryKey: ["/api/service-levels"],
    queryFn: async () => {
      const res = await fetch('/api/service-levels');
      return res.json();
    },
  });

  // Fetch real customers from database
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/users/members"],
    queryFn: async () => {
      const res = await fetch('/api/users/members');
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json();
    },
  });

  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customerData,
          role: 'member'
        }),
      });
      if (!res.ok) throw new Error('Failed to add customer');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
      setIsAddDialogOpen(false);
      setNewCustomer({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        serviceLevelId: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/members"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add customer",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditCustomer = (id: number) => {
    toast({
      title: "Edit Customer",
      description: `Editing customer with ID: ${id}`,
    });
    // Open edit modal/form
  };

  const handleDeleteCustomer = (id: number) => {
    toast({
      title: "Delete Customer",
      description: `Deleting customer with ID: ${id}`,
      variant: "destructive",
    });
    // Show confirmation dialog
  };

  const handleAddCustomer = () => {
    setIsAddDialogOpen(true);
  };

  const handleSubmitCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email || !newCustomer.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addCustomerMutation.mutate(newCustomer);
  };

  return (
    <>
      <Helmet>
        <title>Customer Management | Poopalotzi</title>
        <meta name="description" content="Manage boat owners and their service subscriptions" />
      </Helmet>
      
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-2xl font-bold">Customer Management</CardTitle>
              <CardDescription>
                Manage boat owners and their service subscriptions
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddCustomer} className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>
                    Create a new customer account with service subscription.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitCustomer}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={newCustomer.firstName}
                          onChange={(e) => setNewCustomer({...newCustomer, firstName: e.target.value})}
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={newCustomer.lastName}
                          onChange={(e) => setNewCustomer({...newCustomer, lastName: e.target.value})}
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                        placeholder="john.doe@example.com"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newCustomer.password}
                        onChange={(e) => setNewCustomer({...newCustomer, password: e.target.value})}
                        placeholder="Enter secure password"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="serviceLevel">Service Level</Label>
                      <Select 
                        value={newCustomer.serviceLevelId} 
                        onValueChange={(value) => setNewCustomer({...newCustomer, serviceLevelId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service level" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceLevels.map((level: any) => (
                            <SelectItem key={level.id} value={level.id.toString()}>
                              {level.name} - ${level.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addCustomerMutation.isPending}
                    >
                      {addCustomerMutation.isPending ? "Adding..." : "Add Customer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">Loading customers...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Service Level</TableHead>
                      <TableHead>Boats</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No customers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone || "Not provided"}</TableCell>
                          <TableCell>
                            {customer.serviceLevelId ? 
                              serviceLevels.find(level => level.id === customer.serviceLevelId)?.name || "Unknown" 
                              : "No service level"}
                          </TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCustomer(customer.id)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleDeleteCustomer(customer.id)}
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
    </>
  );
}