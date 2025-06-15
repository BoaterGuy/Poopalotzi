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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Plus, Trash2, UserPlus, Search, Anchor, Eye, Edit, Ship, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { formatPhoneDisplay, formatPhoneInput, cleanPhoneForStorage, isValidPhone } from "@/lib/phoneUtils";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddBoatDialogOpen, setIsAddBoatDialogOpen] = useState(false);
  const [isEditBoatDialogOpen, setIsEditBoatDialogOpen] = useState(false);
  const [isViewBoatsDialogOpen, setIsViewBoatsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [selectedCustomerForBoat, setSelectedCustomerForBoat] = useState<any>(null);
  const [editingBoat, setEditingBoat] = useState<any>(null);
  const [customerBoats, setCustomerBoats] = useState<any[]>([]);
  const [selectedCustomerForBoats, setSelectedCustomerForBoats] = useState<any>(null);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    serviceLevelId: "",
  });
  const [newBoat, setNewBoat] = useState({
    name: "",
    make: "",
    model: "",
    year: "",
    length: "",
    color: "",
    dock: "",
    slip: "",
    marinaId: "",
    notes: "",
  });

  // Fetch service levels for the dropdown
  const { data: serviceLevels = [] } = useQuery({
    queryKey: ["/api/service-levels"],
    queryFn: async () => {
      const res = await fetch('/api/service-levels');
      return res.json();
    },
  });

  // Fetch marinas for boat creation
  const { data: marinas = [] } = useQuery({
    queryKey: ["/api/marinas"],
    queryFn: async () => {
      const res = await fetch('/api/marinas');
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
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add customer');
      }
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

  // Edit customer mutation
  const editCustomerMutation = useMutation({
    mutationFn: async ({ id, customerData }: { id: number, customerData: any }) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update customer');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingCustomer(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users/members"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  // Add boat mutation
  const addBoatMutation = useMutation({
    mutationFn: async (boatData: any) => {
      const res = await fetch('/api/boats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boatData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add boat');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Boat added successfully",
      });
      setIsAddBoatDialogOpen(false);
      setSelectedCustomerForBoat(null);
      setNewBoat({
        name: "",
        make: "",
        model: "",
        year: "",
        length: "",
        color: "",
        dock: "",
        slip: "",
        marinaId: "",
        notes: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add boat",
        variant: "destructive",
      });
    },
  });

  // Edit boat mutation
  const editBoatMutation = useMutation({
    mutationFn: async ({ id, boatData }: { id: number, boatData: any }) => {
      const res = await fetch(`/api/boats/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boatData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update boat');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Boat updated successfully",
      });
      setIsEditBoatDialogOpen(false);
      setEditingBoat(null);
      // Refresh boats for current customer
      if (selectedCustomerForBoats) {
        fetchCustomerBoats(selectedCustomerForBoats.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update boat",
        variant: "destructive",
      });
    },
  });

  // Delete boat mutation
  const deleteBoatMutation = useMutation({
    mutationFn: async (boatId: number) => {
      const res = await fetch(`/api/boats/${boatId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete boat');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Boat deleted successfully",
      });
      // Refresh boats for current customer
      if (selectedCustomerForBoats) {
        fetchCustomerBoats(selectedCustomerForBoats.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete boat",
        variant: "destructive",
      });
    },
  });

  // Function to get short service level label with color coding
  const getServiceLevelDisplay = (serviceLevelId: number | null, serviceLevels: any[]) => {
    if (!serviceLevelId) {
      return {
        shortLabel: "No Service",
        fullLabel: "No service level assigned",
        variant: "outline" as const,
        color: "text-gray-500"
      };
    }
    
    const level = serviceLevels.find(l => l.id === serviceLevelId);
    if (!level) {
      return {
        shortLabel: "Unknown",
        fullLabel: "Unknown service level",
        variant: "outline" as const,
        color: "text-gray-500"
      };
    }
    
    // Determine service type and head count
    const isMultiHead = level.name.toLowerCase().includes("multi");
    const type = level.type;
    
    let shortLabel = "";
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let color = "";
    
    if (type === "one-time") {
      shortLabel = isMultiHead ? "Single Multi" : "Single";
      variant = "outline";
      color = "text-gray-600";
    } else if (type === "monthly") {
      shortLabel = isMultiHead ? "Monthly Multi" : "Monthly";
      variant = "default";
      color = "text-blue-600";
    } else if (type === "seasonal") {
      shortLabel = isMultiHead ? "Seasonal Multi" : "Seasonal";
      variant = "secondary";
      color = "text-green-600";
    }
    
    return {
      shortLabel,
      fullLabel: level.name,
      variant,
      color
    };
  };

  // Function to determine boat status based on creation date and mock logic
  const getBoatStatus = (boat: any) => {
    const now = new Date();
    const createdAt = new Date(boat.createdAt);
    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Mock logic for status determination
    if (daysSinceCreated <= 3) {
      return {
        label: "Newly Added",
        variant: "secondary" as const,
        icon: Clock,
        color: "text-blue-600"
      };
    } else if (daysSinceCreated >= 7) {
      return {
        label: "Needs Pump-Out",
        variant: "destructive" as const,
        icon: AlertCircle,
        color: "text-red-600"
      };
    } else {
      return {
        label: "Up-to-Date",
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-green-600"
      };
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditCustomer = (id: number) => {
    const customer = customers.find(c => c.id === id);
    if (customer) {
      setEditingCustomer({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: formatPhoneDisplay(customer.phone) || "",
        serviceLevelId: customer.serviceLevelId ? customer.serviceLevelId.toString() : "",
      });
      setIsEditDialogOpen(true);
    }
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

  const handleAddBoatForCustomer = (customer: any) => {
    setSelectedCustomerForBoat(customer);
    setIsAddBoatDialogOpen(true);
  };

  const handleBoatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerForBoat) return;
    
    // Basic validation
    if (!newBoat.name) {
      toast({
        title: "Validation Error",
        description: "Please enter a boat name",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare boat data with user ID for admin assignment
    const boatData = {
      name: newBoat.name,
      make: newBoat.make || null,
      model: newBoat.model || null,
      year: newBoat.year ? parseInt(newBoat.year) : null,
      length: newBoat.length ? parseInt(newBoat.length) : null,
      color: newBoat.color || null,
      dock: newBoat.dock || null,
      slip: newBoat.slip ? parseInt(newBoat.slip) : null,
      notes: newBoat.notes || null,
      userId: selectedCustomerForBoat.id,
    };
    
    addBoatMutation.mutate(boatData);
  };

  const fetchCustomerBoats = async (userId: number) => {
    try {
      const res = await fetch(`/api/boats?userId=${userId}`);
      if (res.ok) {
        const boats = await res.json();
        setCustomerBoats(boats);
      } else {
        setCustomerBoats([]);
      }
    } catch (error) {
      setCustomerBoats([]);
    }
  };

  const handleViewBoats = async (customer: any) => {
    setSelectedCustomerForBoats(customer);
    await fetchCustomerBoats(customer.id);
    setIsViewBoatsDialogOpen(true);
  };

  const handleEditBoat = (boat: any) => {
    setEditingBoat({
      id: boat.id,
      name: boat.name,
      make: boat.make || "",
      model: boat.model || "",
      year: boat.year ? boat.year.toString() : "",
      length: boat.length ? boat.length.toString() : "",
      color: boat.color || "",
      dock: boat.dock || "",
      slip: boat.slip ? boat.slip.toString() : "",
      notes: boat.notes || "",
    });
    setIsEditBoatDialogOpen(true);
  };

  const handleDeleteBoat = (boatId: number) => {
    if (confirm("Are you sure you want to delete this boat?")) {
      deleteBoatMutation.mutate(boatId);
    }
  };

  const handleEditBoatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBoat) return;
    
    if (!editingBoat.name) {
      toast({
        title: "Validation Error",
        description: "Please enter a boat name",
        variant: "destructive",
      });
      return;
    }
    
    const boatData = {
      name: editingBoat.name,
      make: editingBoat.make || null,
      model: editingBoat.model || null,
      year: editingBoat.year ? parseInt(editingBoat.year) : null,
      length: editingBoat.length ? parseInt(editingBoat.length) : null,
      color: editingBoat.color || null,
      dock: editingBoat.dock || null,
      slip: editingBoat.slip ? parseInt(editingBoat.slip) : null,
      notes: editingBoat.notes || null,
    };
    
    editBoatMutation.mutate({ id: editingBoat.id, boatData });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCustomer) return;
    
    // Basic validation
    if (!editingCustomer.firstName || !editingCustomer.lastName || !editingCustomer.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    editCustomerMutation.mutate({
      id: editingCustomer.id,
      customerData: {
        firstName: editingCustomer.firstName,
        lastName: editingCustomer.lastName,
        email: editingCustomer.email,
        phone: cleanPhoneForStorage(editingCustomer.phone),
        serviceLevelId: editingCustomer.serviceLevelId,
      }
    });
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

    const customerData = {
      ...newCustomer,
      phone: cleanPhoneForStorage(newCustomer.phone)
    };

    addCustomerMutation.mutate(customerData);
  };

  return (
    <TooltipProvider>
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
                        onChange={(e) => {
                          const formatted = formatPhoneInput(e.target.value);
                          setNewCustomer({...newCustomer, phone: formatted});
                        }}
                        placeholder="(555) 123-4567"
                        maxLength={14}
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

          {/* Add Boat Dialog */}
          <Dialog open={isAddBoatDialogOpen} onOpenChange={setIsAddBoatDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Boat for {selectedCustomerForBoat?.firstName} {selectedCustomerForBoat?.lastName}</DialogTitle>
                <DialogDescription>
                  Create a new boat record for this customer.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBoatSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="boat-name">Boat Name *</Label>
                      <Input
                        id="boat-name"
                        value={newBoat.name}
                        onChange={(e) => setNewBoat({...newBoat, name: e.target.value})}
                        placeholder="My Boat"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="boat-marina">Marina</Label>
                      <Select 
                        value={newBoat.marinaId} 
                        onValueChange={(value) => setNewBoat({...newBoat, marinaId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select marina" />
                        </SelectTrigger>
                        <SelectContent>
                          {marinas.map((marina: any) => (
                            <SelectItem key={marina.id} value={marina.id.toString()}>
                              {marina.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="boat-make">Make</Label>
                      <Input
                        id="boat-make"
                        value={newBoat.make}
                        onChange={(e) => setNewBoat({...newBoat, make: e.target.value})}
                        placeholder="Beneteau"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="boat-model">Model</Label>
                      <Input
                        id="boat-model"
                        value={newBoat.model}
                        onChange={(e) => setNewBoat({...newBoat, model: e.target.value})}
                        placeholder="Oceanis 40"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="boat-year">Year</Label>
                      <Input
                        id="boat-year"
                        type="number"
                        value={newBoat.year}
                        onChange={(e) => setNewBoat({...newBoat, year: e.target.value})}
                        placeholder="2020"
                        min="1900"
                        max="2030"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="boat-length">Length (ft)</Label>
                      <Input
                        id="boat-length"
                        type="number"
                        step="0.1"
                        value={newBoat.length}
                        onChange={(e) => setNewBoat({...newBoat, length: e.target.value})}
                        placeholder="40"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="boat-color">Color</Label>
                      <Input
                        id="boat-color"
                        value={newBoat.color}
                        onChange={(e) => setNewBoat({...newBoat, color: e.target.value})}
                        placeholder="White"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="boat-dock">Dock</Label>
                      <Input
                        id="boat-dock"
                        value={newBoat.dock}
                        onChange={(e) => setNewBoat({...newBoat, dock: e.target.value})}
                        placeholder="A"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="boat-slip">Slip</Label>
                      <Input
                        id="boat-slip"
                        value={newBoat.slip}
                        onChange={(e) => setNewBoat({...newBoat, slip: e.target.value})}
                        placeholder="15"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="boat-notes">Notes</Label>
                    <Input
                      id="boat-notes"
                      value={newBoat.notes}
                      onChange={(e) => setNewBoat({...newBoat, notes: e.target.value})}
                      placeholder="Additional notes about the boat"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddBoatDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addBoatMutation.isPending}
                  >
                    {addBoatMutation.isPending ? "Adding..." : "Add Boat"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Boats Dialog */}
          <Dialog open={isViewBoatsDialogOpen} onOpenChange={setIsViewBoatsDialogOpen}>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Boats for {selectedCustomerForBoats?.firstName} {selectedCustomerForBoats?.lastName}</DialogTitle>
                <DialogDescription>
                  Manage all boats owned by this customer.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {customerBoats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No boats found for this customer.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerBoats.map((boat: any) => {
                      const status = getBoatStatus(boat);
                      const StatusIcon = status.icon;
                      return (
                        <div key={boat.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">{boat.name}</h3>
                                <Badge variant={status.variant} className="flex items-center gap-1">
                                  <StatusIcon className="h-3 w-3" />
                                  {status.label}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Make/Model:</span>
                                  <span className="ml-2">{boat.make} {boat.model}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Year:</span>
                                  <span className="ml-2">{boat.year || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Location:</span>
                                  <span className="ml-2">Pier {boat.pier}, Dock {boat.dock}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Length:</span>
                                  <span className="ml-2">{boat.length ? `${boat.length} ft` : "N/A"}</span>
                                </div>
                              </div>
                              {boat.notes && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Notes:</span>
                                  <span className="ml-2">{boat.notes}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditBoat(boat)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleDeleteBoat(boat.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsViewBoatsDialogOpen(false)}
                >
                  Close
                </Button>
                {selectedCustomerForBoats && (
                  <Button
                    onClick={() => {
                      handleAddBoatForCustomer(selectedCustomerForBoats);
                      setIsViewBoatsDialogOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Boat
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Boat Dialog */}
          <Dialog open={isEditBoatDialogOpen} onOpenChange={setIsEditBoatDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Boat</DialogTitle>
                <DialogDescription>
                  Update boat information.
                </DialogDescription>
              </DialogHeader>
              {editingBoat && (
                <form onSubmit={handleEditBoatSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-boat-name">Boat Name *</Label>
                        <Input
                          id="edit-boat-name"
                          value={editingBoat.name}
                          onChange={(e) => setEditingBoat({...editingBoat, name: e.target.value})}
                          placeholder="My Boat"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-boat-make">Make</Label>
                        <Input
                          id="edit-boat-make"
                          value={editingBoat.make}
                          onChange={(e) => setEditingBoat({...editingBoat, make: e.target.value})}
                          placeholder="Beneteau"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-boat-model">Model</Label>
                        <Input
                          id="edit-boat-model"
                          value={editingBoat.model}
                          onChange={(e) => setEditingBoat({...editingBoat, model: e.target.value})}
                          placeholder="Oceanis 40"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-boat-year">Year</Label>
                        <Input
                          id="edit-boat-year"
                          type="number"
                          value={editingBoat.year}
                          onChange={(e) => setEditingBoat({...editingBoat, year: e.target.value})}
                          placeholder="2020"
                          min="1900"
                          max="2030"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-boat-length">Length (ft)</Label>
                        <Input
                          id="edit-boat-length"
                          type="number"
                          step="0.1"
                          value={editingBoat.length}
                          onChange={(e) => setEditingBoat({...editingBoat, length: e.target.value})}
                          placeholder="40"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-boat-color">Color</Label>
                        <Input
                          id="edit-boat-color"
                          value={editingBoat.color}
                          onChange={(e) => setEditingBoat({...editingBoat, color: e.target.value})}
                          placeholder="White"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-boat-pier">Pier</Label>
                        <Input
                          id="edit-boat-pier"
                          value={editingBoat.pier}
                          onChange={(e) => setEditingBoat({...editingBoat, pier: e.target.value})}
                          placeholder="A"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-boat-pier">Pier</Label>
                        <Input
                          id="edit-boat-pier"
                          value={editingBoat.pier}
                          onChange={(e) => setEditingBoat({...editingBoat, pier: e.target.value})}
                          placeholder="A"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-boat-dock">Dock</Label>
                        <Input
                          id="edit-boat-dock"
                          value={editingBoat.dock}
                          onChange={(e) => setEditingBoat({...editingBoat, dock: e.target.value})}
                          placeholder="123"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-boat-notes">Notes</Label>
                      <Input
                        id="edit-boat-notes"
                        value={editingBoat.notes}
                        onChange={(e) => setEditingBoat({...editingBoat, notes: e.target.value})}
                        placeholder="Additional notes about the boat"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditBoatDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={editBoatMutation.isPending}
                    >
                      {editBoatMutation.isPending ? "Updating..." : "Update Boat"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Customer Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Customer</DialogTitle>
                <DialogDescription>
                  Update customer information and service subscription.
                </DialogDescription>
              </DialogHeader>
              {editingCustomer && (
                <form onSubmit={handleEditSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-firstName">First Name *</Label>
                        <Input
                          id="edit-firstName"
                          value={editingCustomer.firstName}
                          onChange={(e) => setEditingCustomer({...editingCustomer, firstName: e.target.value})}
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-lastName">Last Name *</Label>
                        <Input
                          id="edit-lastName"
                          value={editingCustomer.lastName}
                          onChange={(e) => setEditingCustomer({...editingCustomer, lastName: e.target.value})}
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-email">Email *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editingCustomer.email}
                        onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                        placeholder="john.doe@example.com"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        type="tel"
                        value={editingCustomer.phone}
                        onChange={(e) => {
                          const formatted = formatPhoneInput(e.target.value);
                          setEditingCustomer({...editingCustomer, phone: formatted});
                        }}
                        placeholder="(555) 123-4567"
                        maxLength={14}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-serviceLevel">Service Level</Label>
                      <Select 
                        value={editingCustomer.serviceLevelId || "none"} 
                        onValueChange={(value) => setEditingCustomer({...editingCustomer, serviceLevelId: value === "none" ? "" : value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No service level</SelectItem>
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
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={editCustomerMutation.isPending}
                    >
                      {editCustomerMutation.isPending ? "Updating..." : "Update Customer"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
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
                      <TableHead className="w-[200px]">Actions</TableHead>
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
                          <TableCell>{formatPhoneDisplay(customer.phone) || "Not provided"}</TableCell>
                          <TableCell>
                            {(() => {
                              const serviceDisplay = getServiceLevelDisplay(customer.serviceLevelId, serviceLevels);
                              return (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="inline-block">
                                      <Badge 
                                        variant={serviceDisplay.variant} 
                                        className="cursor-help hover:opacity-80 transition-opacity"
                                      >
                                        {serviceDisplay.shortLabel}
                                      </Badge>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-sm">{serviceDisplay.fullLabel}</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBoats(customer)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Ship className="h-4 w-4 mr-1" />
                              View Boats
                            </Button>
                          </TableCell>
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
                                onClick={() => handleAddBoatForCustomer(customer)}
                                title="Add Boat for this Owner"
                              >
                                <Anchor className="h-4 w-4 mr-1" />
                                Add Boat
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
    </TooltipProvider>
  );
}