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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, MapPin, Search, Plus } from "lucide-react";

// Mock data until connected to API
const MOCK_MARINAS = [
  {
    id: 1,
    name: "Harbor Bay Marina",
    address: "123 Harbor Way, Oceanville, CA 94321",
    phone: "555-123-4567",
    isActive: true,
    boatCount: 35,
  },
  {
    id: 2,
    name: "Sunset Point Marina",
    address: "456 Sunset Blvd, Bay City, CA 94322",
    phone: "555-987-6543",
    isActive: true,
    boatCount: 42,
  },
  {
    id: 3,
    name: "Golden Anchor Marina",
    address: "789 Golden Way, Harbortown, CA 94323",
    phone: "555-456-7890",
    isActive: false,
    boatCount: 0,
  },
];

export default function MarinaManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // This will be replaced with actual API call
  const { data: marinas = [], isLoading } = useQuery({
    queryKey: ["/api/marinas", { activeOnly: !showInactive }],
    queryFn: async () => {
      // This will be replaced with actual API call
      // For now return mock data
      const result = MOCK_MARINAS;
      return showInactive ? result : result.filter(marina => marina.isActive);
    },
  });

  const filteredMarinas = marinas.filter(
    (marina) =>
      marina.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      marina.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditMarina = (id: number) => {
    toast({
      title: "Edit Marina",
      description: `Editing marina with ID: ${id}`,
    });
    // Open edit modal/form
  };

  const handleDeleteMarina = (id: number) => {
    toast({
      title: "Delete Marina",
      description: `Deleting marina with ID: ${id}`,
      variant: "destructive",
    });
    // Show confirmation dialog
  };

  const handleAddMarina = () => {
    toast({
      title: "Add Marina",
      description: "Opening form to add a new marina",
    });
    // Open add marina modal/form
  };

  const toggleMarinaStatus = (id: number, currentStatus: boolean) => {
    toast({
      title: currentStatus ? "Deactivate Marina" : "Activate Marina",
      description: `Marina with ID ${id} has been ${currentStatus ? "deactivated" : "activated"}`,
    });
    // API call to update status
  };

  return (
    <>
      <Helmet>
        <title>Marina Management | Poopalotzi</title>
        <meta name="description" content="Manage marinas and their associated docks and slips" />
      </Helmet>
      
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-2xl font-bold">Marina Management</CardTitle>
              <CardDescription>
                Manage marinas and their associated docks and slips
              </CardDescription>
            </div>
            <Button onClick={handleAddMarina} className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Add Marina
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search marinas..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="show-inactive">Show Inactive Marinas</Label>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">Loading marinas...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Boats</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMarinas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No marinas found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMarinas.map((marina) => (
                        <TableRow key={marina.id} className={!marina.isActive ? "opacity-60" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4 text-primary" />
                              {marina.name}
                            </div>
                          </TableCell>
                          <TableCell>{marina.address}</TableCell>
                          <TableCell>{marina.phone}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div
                                className={`mr-2 h-2.5 w-2.5 rounded-full ${
                                  marina.isActive ? "bg-green-500" : "bg-gray-400"
                                }`}
                              ></div>
                              {marina.isActive ? "Active" : "Inactive"}
                            </div>
                          </TableCell>
                          <TableCell>{marina.boatCount}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMarina(marina.id)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleDeleteMarina(marina.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={marina.isActive ? "destructive" : "default"}
                                size="sm"
                                onClick={() => toggleMarinaStatus(marina.id, marina.isActive)}
                              >
                                {marina.isActive ? "Deactivate" : "Activate"}
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