import { Helmet } from "react-helmet";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Boat, Marina, SlipAssignment } from "@shared/schema";
import { AlertCircle, Ship, Edit, Trash, Plus, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import BoatForm from "@/components/member/BoatForm";
import MarinaSelection from "@/components/member/MarinaSelection";
import { apiRequest } from "@/lib/queryClient";

export default function BoatManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingBoat, setIsAddingBoat] = useState(false);
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [deletingBoat, setDeletingBoat] = useState<Boat | null>(null);
  const [assigningMarina, setAssigningMarina] = useState<Boat | null>(null);

  const { data: boats, isLoading: isLoadingBoats, refetch: refetchBoats } = useQuery<Boat[]>({
    queryKey: ['/api/boats'],
  });

  const { data: marinas } = useQuery<Marina[]>({
    queryKey: ['/api/marinas'],
    queryFn: undefined,
  });

  const handleDeleteBoat = async (boatId: number) => {
    try {
      await apiRequest('DELETE', `/api/boats/${boatId}`, {});
      
      toast({
        title: "Boat deleted",
        description: "Your boat has been successfully removed.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/boats'] });
      setDeletingBoat(null);
    } catch (error) {
      console.error('Error deleting boat:', error);
      toast({
        title: "Error",
        description: "There was a problem deleting your boat.",
        variant: "destructive",
      });
    }
  };

  const getSlipAssignment = async (boatId: number) => {
    try {
      const res = await fetch(`/api/slip-assignments/boat/${boatId}`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data: SlipAssignment = await res.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching slip assignment:', error);
      return null;
    }
  };

  const getMarinaInfo = async (marinaId: number) => {
    try {
      const res = await fetch(`/api/marinas/${marinaId}`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data: Marina = await res.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching marina info:', error);
      return null;
    }
  };

  const getBoatLocation = async (boat: Boat) => {
    const slipAssignment = await getSlipAssignment(boat.id);
    if (slipAssignment) {
      const marina = await getMarinaInfo(slipAssignment.marinaId);
      if (marina) {
        return {
          marinaName: marina.name,
          dock: slipAssignment.dock,
          slip: slipAssignment.slip,
        };
      }
    }
    return null;
  };

  return (
    <>
      <Helmet>
        <title>Boat Management - Poopalotzi</title>
        <meta name="description" content="Manage your boat information and marina assignments." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0B1F3A]">Boat Management</h1>
            <p className="text-gray-600">
              Add and manage your boats and marina assignments.
            </p>
          </div>
          <Button 
            className="mt-4 md:mt-0 bg-[#0B1F3A] hover:bg-opacity-90"
            onClick={() => setIsAddingBoat(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Boat
          </Button>
        </div>

        {isLoadingBoats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="bg-gray-100 h-12"></CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="bg-gray-100 h-24 rounded"></div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 h-16"></CardFooter>
              </Card>
            ))}
          </div>
        ) : boats && boats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boats.map((boat) => (
              <Card key={boat.id} className="overflow-hidden">
                <CardHeader className="bg-[#F4EBD0]">
                  <CardTitle className="flex items-center">
                    <Ship className="mr-2 h-5 w-5 text-[#38B2AC]" />
                    {boat.name}
                  </CardTitle>
                  <CardDescription>
                    {boat.year} {boat.make} {boat.model}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                      {boat.photoUrl ? (
                        <img 
                          src={boat.photoUrl} 
                          alt={boat.name} 
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <Ship className="h-10 w-10" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-gray-700">
                        <span className="font-medium">Color:</span> {boat.color || 'Not specified'}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Docking:</span> {boat.dockingDirection === 'bow_in' ? 'Bow In' : 
                                                                    boat.dockingDirection === 'stern_in' ? 'Stern In' : 
                                                                    boat.dockingDirection === 'side_to' ? 'Side To' : 'Not specified'}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Tie-up side:</span> {boat.tieUpSide === 'port' ? 'Port' :
                                                                         boat.tieUpSide === 'starboard' ? 'Starboard' :
                                                                         boat.tieUpSide === 'both' ? 'Both' : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Marina Assignment</h4>
                    <p className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4 text-[#38B2AC]" />
                      <span className="text-sm">
                        {getBoatLocation(boat) ? `${getBoatLocation(boat)?.marinaName} - Dock ${getBoatLocation(boat)?.dock}, Slip ${getBoatLocation(boat)?.slip}` : 'No marina assigned'}
                      </span>
                    </p>
                  </div>
                  
                  {boat.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                      <p className="text-sm text-gray-700">{boat.notes}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-gray-50 flex flex-row gap-2 justify-between p-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingBoat(boat)}
                    className="flex-1"
                  >
                    <Edit className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAssigningMarina(boat)}
                    className="flex-1"
                  >
                    <MapPin className="mr-1 h-4 w-4" /> Marina
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeletingBoat(boat)}
                  >
                    <Trash className="mr-1 h-4 w-4" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="w-full">
            <CardContent className="text-center p-10">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Boats Added</h3>
              <p className="text-gray-500 mb-6">
                You haven't added any boats yet. Add your boat to get started with pump-out services.
              </p>
              <Button 
                className="bg-[#38B2AC] hover:bg-opacity-90"
                onClick={() => setIsAddingBoat(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Your First Boat
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Boat Dialog */}
      <Dialog open={isAddingBoat} onOpenChange={setIsAddingBoat}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Boat</DialogTitle>
            <DialogDescription>
              Enter your boat details to register it for pump-out services.
            </DialogDescription>
          </DialogHeader>
          <BoatForm 
            onSuccess={() => {
              // Directly refetch the boats after adding a new one
              refetchBoats();
              setIsAddingBoat(false);
              toast({
                title: "Boat added",
                description: "Your boat has been successfully registered.",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Boat Dialog */}
      <Dialog open={!!editingBoat} onOpenChange={() => setEditingBoat(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Boat Details</DialogTitle>
            <DialogDescription>
              Update your boat information.
            </DialogDescription>
          </DialogHeader>
          {editingBoat && (
            <BoatForm 
              boat={editingBoat}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/boats'] });
                setEditingBoat(null);
                toast({
                  title: "Boat updated",
                  description: "Your boat information has been updated successfully.",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingBoat} onOpenChange={() => setDeletingBoat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your boat "{deletingBoat?.name}" and all associated records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingBoat && handleDeleteBoat(deletingBoat.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Marina Assignment Dialog */}
      <Dialog open={!!assigningMarina} onOpenChange={() => setAssigningMarina(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Marina & Slip</DialogTitle>
            <DialogDescription>
              Specify where your boat is docked for easier service planning.
            </DialogDescription>
          </DialogHeader>
          {assigningMarina && (
            <MarinaSelection
              boat={assigningMarina}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/boats'] });
                queryClient.invalidateQueries({ queryKey: ['/api/slip-assignments'] });
                setAssigningMarina(null);
                toast({
                  title: "Marina assigned",
                  description: "Your boat's marina and slip information has been updated.",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
