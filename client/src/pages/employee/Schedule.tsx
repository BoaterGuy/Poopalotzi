import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, ArrowLeft, ArrowRight, Route, Ship, MapPin, Check, Calendar as CalendarLucide } from "lucide-react";
import { useEmployeeSchedule } from "@/hooks/use-service-requests";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { PopoverTrigger, Popover, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  id: number;
  status: string;
  boatId: number;
  boat: {
    id: number;
    name: string;
    make: string;
    model: string;
    color: string;
  };
  marina: {
    id: number;
    name: string;
  };
  dockAssignment: {
    pier: string | number;
    dock: number;
  };
  ownerNotes?: string;
  requestedDate?: string;
  weekStartDate?: string;
  pumpOutPorts?: string[];

interface MarinaGroup {
  marinaId: number;
  name: string;
  requests: ScheduleItem[];

export default function EmployeeSchedule() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRequest, setSelectedRequest] = useState<ScheduleItem | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [photoUpload, setPhotoUpload] = useState({
    before: null as File | null,
    during: null as File | null,
    after: null as File | null
  
  // Status colors function
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Requested":
        return "bg-blue-500";
      case "Scheduled":
        return "bg-yellow-500";
      case "Completed":
        return "bg-green-500";
      case "Canceled":
        return "bg-red-500";
      case "Waitlisted":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
  };
  
  // Function to handle status changes
  const handleStatusChange = (requestId: number, newStatus: string) => {
    // Update the UI immediately in the dialog
    if (selectedRequest && selectedRequest.id === requestId) {
      setSelectedRequest({
        ...selectedRequest,
        status: newStatus
    
    // Update the local requests state to reflect the change
    setLocalRequests(prevRequests => 
      prevRequests.map(request => 
        request.id === requestId 
          ? { ...request, status: newStatus } 
          : request
    );
    
    // In a production environment, this would make an API call:
    // await fetch(`/api/pump-out-requests/${requestId}/status`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ status: newStatus })
    // });
  };

  // Get initial data from the hook
  const { weekRequests: initialRequests, isLoading, error } = useEmployeeSchedule();
  
  // Use state to track the requests so we can modify them
  const [localRequests, setLocalRequests] = useState<ScheduleItem[]>([]);
  
  // Initialize local requests from the data source when it loads
  useEffect(() => {
    if (initialRequests) {
      setLocalRequests(initialRequests);
  }, [initialRequests]);

  const handlePrevDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };

  const handleCompleteService = async () => {
    if (!selectedRequest) return;
    
    setIsCompleting(true);
    
    try {
      // For a complete implementation, you would upload the photos first
      // then update the service request status
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the current status from the selected request
      const status = selectedRequest.status;
      const requestId = selectedRequest.id;
      
      // Update the local requests to reflect the status change
      setLocalRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === requestId 
            ? { ...request, status: status } 
            : request
      );
      
      // Show success toast
      toast({
        title: "Status Updated",
        description: `Service for ${selectedRequest.boat.name} has been updated to: ${status}`,
        duration: 3000 // Auto-close after 3 seconds
      
      // Close dialog immediately
      setSelectedRequest(null);
      
      // Reset photo upload state
      setPhotoUpload({
        before: null,
        during: null,
        after: null
    } catch (error) {
      console.error("Error updating service:", error);
      toast({
        title: "Error",
        description: "There was a problem updating the service. Please try again.",
        variant: "destructive",
        duration: 3000
    } finally {
      setIsCompleting(false);
  };

  // Group requests by marina
  const getMarinaGroups = (items: ScheduleItem[] = []): MarinaGroup[] => {
    const groups: { [key: number]: MarinaGroup } = {};
    
    items
      .filter(item => 
        isSameDay(new Date(selectedDate), new Date())
      .forEach(item => {
        if (!item.marina) return;
        
        const marinaId = item.marina.id;
        if (!groups[marinaId]) {
          groups[marinaId] = {
            marinaId,
            name: item.marina.name,
            requests: []
          };
        
        groups[marinaId].requests.push(item);
    
    // Sort requests by pier and dock
    Object.values(groups).forEach(group => {
      group.requests.sort((a, b) => {
        // Convert pier letters to numbers for proper comparison
        const pierA = typeof a.dockAssignment.pier === 'string' 
          ? a.dockAssignment.pier.toUpperCase().charCodeAt(0) 
          : Number(a.dockAssignment.pier);
          
        const pierB = typeof b.dockAssignment.pier === 'string' 
          ? b.dockAssignment.pier.toUpperCase().charCodeAt(0) 
          : Number(b.dockAssignment.pier);
        
        // First sort by pier (ascending)
        if (pierA !== pierB) {
          return pierA - pierB;
        
        // Then sort by dock number (ascending)
        return a.dockAssignment.dock - b.dockAssignment.dock;
    
    return Object.values(groups);
  };

  const marinaGroups = getMarinaGroups(localRequests);
  
  // Get counts for today
  const totalForToday = localRequests?.filter(req => 
    isSameDay(new Date(selectedDate), new Date()) && 
    req.status === 'Scheduled'
  ).length || 0;
  
  const completedToday = localRequests?.filter(req => 
    isSameDay(new Date(selectedDate), new Date()) && 
    req.status === 'Completed'
  ).length || 0;

  return (
    <>
      <Helmet>
        <title>My Schedule - Poopalotzi</title>
        <meta name="description" content="Employee schedule for pump-out services" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A]">My Schedule</h1>
          <p className="text-gray-600">
            Manage your pump-out service assignments for the week
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handlePrevDay}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[240px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setShowCalendar(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleNextDay}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white rounded-md shadow px-4 py-2">
              <p className="text-sm text-gray-500">Scheduled</p>
              <p className="text-2xl font-bold text-[#0B1F3A]">{totalForToday}</p>
            </div>
            <div className="bg-white rounded-md shadow px-4 py-2">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-[#38B2AC]">{completedToday}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-[#38B2AC] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading your schedule...</p>
              </div>
            ) : marinaGroups.length > 0 ? (
              <div className="space-y-6">
                {marinaGroups.map((group) => (
                  <Card key={group.marinaId}>
                    <CardHeader className="bg-[#F4EBD0] flex flex-row justify-between items-center py-4">
                      <CardTitle className="flex items-center text-lg">
                        <MapPin className="mr-2 h-5 w-5 text-[#38B2AC]" />
                        {group.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {group.requests.map((request) => (
                          <div 
                            key={request.id} 
                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-start space-x-4">
                                <div className="bg-[#0B1F3A] text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-xs">
                                  {request.dockAssignment.pier}{request.dockAssignment.dock}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-[#0B1F3A]">{request.boat.name}</h3>
                                  <p className="text-sm text-gray-600">{request.boat.make} {request.boat.model}, {request.boat.color}</p>
                                  <p className="text-sm">
                                    <span className="font-medium">Location:</span> Pier {request.dockAssignment.pier}, Dock {request.dockAssignment.dock}
                                  </p>
                                  {request.ownerNotes && (
                                    <p className="text-sm mt-1 text-gray-700">
                                      <span className="font-medium">Notes:</span> {request.ownerNotes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div>
                                <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarLucide className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Services Scheduled</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    There are no pump-out services scheduled for {format(selectedDate, "EEEE, MMMM d")}. 
                    Select a different date or check back later.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCalendar(true)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Select a Different Date
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="map">
            <Card>
              <CardContent className="p-6">
                <div className="bg-gray-100 h-[500px] rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Marina map view coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Service Details/Completion Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
            <DialogDescription>
              {selectedRequest?.boat.name} at {selectedRequest?.marina.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Boat</h3>
                  <p className="font-semibold">{selectedRequest.boat.name}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.boat.make} {selectedRequest.boat.model}, {selectedRequest.boat.color}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p className="font-semibold">{selectedRequest.marina.name}</p>
                  <p className="text-sm text-gray-600">Pier {selectedRequest.dockAssignment.pier}, Dock {selectedRequest.dockAssignment.dock}</p>
                </div>
              </div>

              {selectedRequest.ownerNotes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{selectedRequest.ownerNotes}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Service Documentation</h3>
                <p className="text-sm text-gray-600 mb-4">Upload photos before marking the service as completed</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs mb-1">Before Service</p>
                    <div className="border border-dashed rounded-md p-2 flex flex-col items-center justify-center h-24">
                      <input 
                        type="file" 
                        id="before-photo" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPhotoUpload({...photoUpload, before: e.target.files[0]});
                        }}
                      />
                      {photoUpload.before ? (
                        <div className="text-center">
                          <Check className="h-5 w-5 text-green-500 mx-auto mb-1" />
                          <p className="text-xs truncate max-w-full">{photoUpload.before.name}</p>
                          <button 
                            className="text-xs text-red-500"
                            onClick={() => setPhotoUpload({...photoUpload, before: null})}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="before-photo" className="cursor-pointer text-center">
                          <Ship className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-500">Upload Photo</span>
                        </label>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs mb-1">During Service</p>
                    <div className="border border-dashed rounded-md p-2 flex flex-col items-center justify-center h-24">
                      <input 
                        type="file" 
                        id="during-photo" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPhotoUpload({...photoUpload, during: e.target.files[0]});
                        }}
                      />
                      {photoUpload.during ? (
                        <div className="text-center">
                          <Check className="h-5 w-5 text-green-500 mx-auto mb-1" />
                          <p className="text-xs truncate max-w-full">{photoUpload.during.name}</p>
                          <button 
                            className="text-xs text-red-500"
                            onClick={() => setPhotoUpload({...photoUpload, during: null})}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="during-photo" className="cursor-pointer text-center">
                          <Ship className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-500">Upload Photo</span>
                        </label>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs mb-1">After Service</p>
                    <div className="border border-dashed rounded-md p-2 flex flex-col items-center justify-center h-24">
                      <input 
                        type="file" 
                        id="after-photo" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPhotoUpload({...photoUpload, after: e.target.files[0]});
                        }}
                      />
                      {photoUpload.after ? (
                        <div className="text-center">
                          <Check className="h-5 w-5 text-green-500 mx-auto mb-1" />
                          <p className="text-xs truncate max-w-full">{photoUpload.after.name}</p>
                          <button 
                            className="text-xs text-red-500"
                            onClick={() => setPhotoUpload({...photoUpload, after: null})}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="after-photo" className="cursor-pointer text-center">
                          <Ship className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-500">Upload Photo</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Update Status</h3>
                <div className="flex items-center gap-4">
                  <Select defaultValue={selectedRequest.status} onValueChange={(value) => handleStatusChange(selectedRequest.id, value)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Requested">Requested</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Canceled">Canceled</SelectItem>
                      <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">Current: <Badge className={`${getStatusColor(selectedRequest.status)}`}>{selectedRequest.status}</Badge></span>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleCompleteService}
                  disabled={isCompleting}
                >
                  {isCompleting ? "Processing..." : "Save"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
