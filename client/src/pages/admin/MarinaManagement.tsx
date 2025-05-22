import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import MarinaModal from "@/components/admin/MarinaModal";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Marina {
  id: number;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export default function MarinaManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [marinaModalOpen, setMarinaModalOpen] = useState(false);
  const [selectedMarina, setSelectedMarina] = useState<Marina | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [marinaToDelete, setMarinaToDelete] = useState<number | null>(null);

  // API call to get marinas
  const { data: marinas = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/marinas", { activeOnly: !showInactive }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("activeOnly", (!showInactive).toString());
      
      // Add a cache-busting timestamp to force a fresh request
      params.append("t", Date.now().toString());
      
      console.log("Fetching marinas from API...");
      const response = await fetch(`/api/marinas?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch marinas");
      }
      
      const data = await response.json();
      console.log("Marina data from API:", data);
      return data;
    },
    refetchOnMount: "always",
    staleTime: 0, // Always consider data stale
  });

  // Get boat counts for each marina (this would be a real API call in a full implementation)
  const getBoatCount = (marinaId: number) => {
    // For now we'll return a random count between 0 and 50
    return Math.floor(Math.random() * 51);
  };

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/marinas/${id}`, { isActive: !isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marinas"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update marina status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/marinas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marinas"] });
      toast({
        title: "Marina Deleted",
        description: "Marina has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete marina: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const filteredMarinas = marinas.filter(
    (marina: Marina) =>
      marina.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      marina.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditMarina = (marina: Marina) => {
    setSelectedMarina(marina);
    setMarinaModalOpen(true);
  };

  const handleDeleteMarina = (id: number) => {
    setMarinaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (marinaToDelete !== null) {
      deleteMutation.mutate(marinaToDelete);
      setDeleteDialogOpen(false);
      setMarinaToDelete(null);
    }
  };

  const handleAddMarina = () => {
    setSelectedMarina(undefined);
    setMarinaModalOpen(true);
  };

  const toggleMarinaStatus = (id: number, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, isActive: currentStatus });
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
            <Button onClick={handleAddMarina} className="flex items-center bg-[#0B1F3A] hover:bg-[#0B1F3A]/90">
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
                      filteredMarinas.map((marina: Marina) => (
                        <TableRow key={marina.id} className={!marina.isActive ? "opacity-60" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4 text-[#0B1F3A]" />
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
                          <TableCell>{getBoatCount(marina.id)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMarina(marina)}
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
      
      {/* Marina Form Modal */}
      <MarinaModal 
        isOpen={marinaModalOpen} 
        onClose={() => setMarinaModalOpen(false)} 
        existingMarina={selectedMarina}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the marina. This action cannot be undone.
              If the marina has any associated boats or slip assignments, they will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}