import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek } from "date-fns";
import { Ship, MapPin, User, CalendarIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function AdminManualServiceEntry() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMarina, setSelectedMarina] = useState("");
  const [boatName, setBoatName] = useState("");
  const [boatLength, setBoatLength] = useState("");
  const [boatColor, setBoatColor] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [serviceDate, setServiceDate] = useState<Date>(new Date());
  const [selectedPorts, setSelectedPorts] = useState<string[]>([]);
  const [serviceNotes, setServiceNotes] = useState("");
  const [isSingleHead, setIsSingleHead] = useState(true);
  const [paymentReceived, setPaymentReceived] = useState(false);

  // Fetch marinas from API instead of hardcoded list
  const { data: marinas = [], isLoading: marinasLoading } = useQuery({
    queryKey: ["/api/marinas"],
    select: (data: any[]) => data.map(marina => ({ id: marina.id.toString(), name: marina.name }))
  });

  // Port location options
  const portLocations = [
    { id: "port", label: "Port" },
    { id: "starboard", label: "Starboard" },
    { id: "bow", label: "Bow" },
    { id: "midship", label: "Mid-ship" },
    { id: "stern", label: "Stern" }
  ];

  const togglePort = (port: string) => {
    setSelectedPorts(prev => {
      if (prev.includes(port)) {
        return prev.filter(p => p !== port);
      } else {
        return [...prev, port];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!selectedMarina) {
      toast({ title: "Missing information", description: "Please select a marina", variant: "destructive" });
      return;
    }
    
    if (!boatName) {
      toast({ title: "Missing information", description: "Please enter a boat name", variant: "destructive" });
      return;
    }
    
    if (!ownerName) {
      toast({ title: "Missing information", description: "Please enter the owner's name", variant: "destructive" });
      return;
    }
    
    if (selectedPorts.length === 0) {
      toast({ title: "Missing information", description: "Please select at least one pump-out port", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format request data for API
      const weekStart = startOfWeek(serviceDate, { weekStartsOn: 1 });
      
      // Create payload for manual entry
      const requestData = {
        boatId: 0, // Temporary ID for manual entry
        manualEntry: true,
        manualBoatInfo: {
          name: boatName,
          length: boatLength || "30",
          color: boatColor || "White",
          ownerName: ownerName,
          ownerEmail: ownerEmail,
          ownerPhone: ownerPhone,
          marinaId: parseInt(selectedMarina),
          isSingleHead: isSingleHead
        },
        weekStartDate: format(weekStart, "yyyy-MM-dd"),
        requestedDate: format(serviceDate, "yyyy-MM-dd"),
        pumpOutPorts: selectedPorts,
        ownerNotes: serviceNotes || "",
        status: "Completed",
        paymentStatus: paymentReceived ? "Paid" : "Pending",
        paymentId: paymentReceived ? `manual_${Date.now()}` : undefined,
        testMode: true
      };
      
      // API call to create manual service entry
      const response = await fetch("/api/admin/manual-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatName,
          boatLength,
          boatColor,
          ownerName,
          ownerEmail,
          ownerPhone,
          selectedMarina,
          serviceDate,
          selectedPorts,
          serviceNotes,
          isSingleHead,
          paymentReceived
        }),
        credentials: "include"
      });
      
      if (response.ok) {
        toast({
          title: "Service Entry Created",
          description: "The manual service entry has been recorded successfully.",
        });
        
        // Reset form
        setSelectedMarina("");
        setBoatName("");
        setBoatLength("");
        setBoatColor("");
        setOwnerName("");
        setOwnerEmail("");
        setOwnerPhone("");
        setServiceDate(new Date());
        setSelectedPorts([]);
        setServiceNotes("");
        setIsSingleHead(true);
        setPaymentReceived(false);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to create entry: ${errorText}`);
      }
    } catch (error) {
      console.error("Error creating manual entry:", error);
      toast({
        title: "Error",
        description: "There was a problem creating the service entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Manual Service Entry - Poopalotzi</title>
        <meta name="description" content="Create manual service entries for completed pump-out services" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0B1F3A]">Manual Service Entry</h1>
          <p className="text-gray-600 mt-1">
            Record completed pump-out services that were performed outside the scheduling system
          </p>
        </div>

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            All manual entries are automatically marked as "Completed"
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle>Service Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Marina Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <MapPin className="mr-2 h-5 w-5 text-[#0B1F3A]" />
                      Marina
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="marina">Select Marina</Label>
                      <Select value={selectedMarina} onValueChange={setSelectedMarina}>
                        <SelectTrigger id="marina">
                          <SelectValue placeholder="Choose marina" />
                        </SelectTrigger>
                        <SelectContent>
                          {marinas.map((marina) => (
                            <SelectItem key={marina.id} value={marina.id}>
                              {marina.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Boat Information */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <Ship className="mr-2 h-5 w-5 text-[#0B1F3A]" />
                      Boat Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="boatName">Boat Name</Label>
                        <Input 
                          id="boatName" 
                          placeholder="Enter boat name" 
                          value={boatName} 
                          onChange={(e) => setBoatName(e.target.value)} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="boatLength">Boat Length (ft)</Label>
                        <Input 
                          id="boatLength" 
                          placeholder="e.g. 30" 
                          value={boatLength} 
                          onChange={(e) => setBoatLength(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="boatColor">Boat Color</Label>
                      <Input 
                        id="boatColor" 
                        placeholder="e.g. White/Blue" 
                        value={boatColor} 
                        onChange={(e) => setBoatColor(e.target.value)} 
                      />
                    </div>

                    <div className="flex items-center space-x-2 p-4 border rounded-md">
                      <Checkbox 
                        id="singleHead" 
                        checked={isSingleHead} 
                        onCheckedChange={(checked) => setIsSingleHead(checked as boolean)} 
                      />
                      <div>
                        <Label htmlFor="singleHead" className="font-medium">Single-Head Boat</Label>
                        <p className="text-sm text-gray-500">Check if this is a single-head boat. Uncheck for multi-head.</p>
                      </div>
                    </div>
                  </div>

                  {/* Owner Information */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <User className="mr-2 h-5 w-5 text-[#0B1F3A]" />
                      Owner Information
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Name</Label>
                      <Input 
                        id="ownerName" 
                        placeholder="Enter owner's full name" 
                        value={ownerName} 
                        onChange={(e) => setOwnerName(e.target.value)} 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ownerEmail">Email (Optional)</Label>
                        <Input 
                          id="ownerEmail" 
                          placeholder="email@example.com" 
                          value={ownerEmail} 
                          onChange={(e) => setOwnerEmail(e.target.value)} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="ownerPhone">Phone (Optional)</Label>
                        <Input 
                          id="ownerPhone" 
                          placeholder="(555) 123-4567" 
                          value={ownerPhone} 
                          onChange={(e) => setOwnerPhone(e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5 text-[#0B1F3A]" />
                      Service Details
                    </h3>
                    
                    <div className="space-y-2">
                      <Label>Service Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !serviceDate && "text-muted-foreground"
                            )}
                          >
                            {serviceDate ? (
                              format(serviceDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={serviceDate}
                            onSelect={(date) => date && setServiceDate(date)}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <div className="mb-2">
                        <Label>Pump-Out Port Locations</Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Select all port locations that were serviced
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {portLocations.map((location) => (
                          <div key={location.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`port-${location.id}`}
                              checked={selectedPorts.includes(location.id)}
                              onCheckedChange={() => togglePort(location.id)}
                            />
                            <Label htmlFor={`port-${location.id}`} className="font-normal">
                              {location.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceNotes">Service Notes</Label>
                      <Textarea
                        id="serviceNotes"
                        placeholder="Enter any notes about the service"
                        className="resize-none"
                        value={serviceNotes}
                        onChange={(e) => setServiceNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center space-x-2 p-4 border rounded-md">
                      <Checkbox 
                        id="paymentReceived" 
                        checked={paymentReceived} 
                        onCheckedChange={(checked) => setPaymentReceived(checked as boolean)} 
                      />
                      <div>
                        <Label htmlFor="paymentReceived" className="font-medium">Payment Received</Label>
                        <p className="text-sm text-gray-500">Check if payment has already been collected for this service</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="bg-[#0B1F3A] hover:bg-opacity-90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating Entry..." : "Create Service Entry"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="bg-[#F4EBD0]">
                <CardTitle>About Manual Entries</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1F3A] mb-2">When to Use</h3>
                    <p className="text-gray-600 text-sm">
                      Use manual entries when a service was performed outside the scheduling system:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-1">
                      <li>Emergency pump-outs</li>
                      <li>When the system was unavailable</li>
                      <li>For non-registered customers</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1F3A] mb-2">Important</h3>
                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-1">
                      <li>Manual entries are marked as "Completed"</li>
                      <li>If email is provided, the customer will receive a receipt</li>
                      <li>The service counts toward usage statistics</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}