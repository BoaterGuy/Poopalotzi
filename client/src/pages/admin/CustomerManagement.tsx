import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

  // This will be replaced with actual API call
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/users/members"],
    queryFn: async () => {
      // This will be replaced with actual API call
      // For now return mock data
      return MOCK_CUSTOMERS;
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
    toast({
      title: "Add Customer",
      description: "Opening form to add a new customer",
    });
    // Open add customer modal/form
  };

  return (
    <>
      <Helmet>
        <title>Customer Management | Poopalazi</title>
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
            <Button onClick={handleAddCustomer} className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
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
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{customer.serviceLevel}</TableCell>
                          <TableCell>{customer.boatCount}</TableCell>
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