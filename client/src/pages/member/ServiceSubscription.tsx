import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import { ServiceLevel } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sailboat, CheckCircle, ArrowRight, Clock, DollarSign, CalendarClock, Repeat } from "lucide-react";
import PaymentForm from "@/components/member/PaymentForm";
import BulkPlanPurchaseForm from "@/components/member/BulkPlanPurchaseForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function ServiceSubscription() {

  const { toast } = useToast();
  const { user } = useAuth();
  // React Query removed
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showBulkPlanForm, setShowBulkPlanForm] = useState(false);
  

  const [bulkPlanDetails, setBulkPlanDetails] = useState<{additionalPumpOuts: number; totalCost: number} | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    // Default to current month if within May-October, otherwise default to May
    return currentMonth >= 4 && currentMonth <= 9 
      ? (currentMonth + 1).toString().padStart(2, '0') 
      : '05'; // May
  const [autoRenew, setAutoRenew] = useState(false);
  
  // Fetch service levels
  // React Query removed
    refetchOnMount: true,
    staleTime: 0,
    queryFn: async () => {
      try {
        const response = await fetch('/api/service-levels', {
          credentials: 'include',
        if (!response.ok) {
          throw new Error('Failed to fetch service levels');
        return await response.json();
      } catch (error) {
        console.error('Error fetching service levels:', error);
        // Return empty array to prevent errors
        return [];
    },
  
  // Fetch current subscription
  // React Query removed
    queryFn: async () => {
      try {
        const response = await fetch('/api/users/me/subscription', {
          credentials: 'include',
        if (!response.ok) {
          // User may not have a subscription yet
          if (response.status === 404) {
            return null;
          throw new Error('Failed to fetch subscription');
        return await response.json();
      } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
    },

  // Fetch user credits to determine if they can repurchase
  // React Query removed
    queryFn: async () => {
      try {
        const response = await fetch('/api/users/me/credits', {
          credentials: 'include',
        if (!response.ok) {
          throw new Error('Failed to fetch user credits');
        return await response.json();
      } catch (error) {
        console.error('Error fetching user credits:', error);
        return { totalPumpOuts: 0, additionalPumpOuts: 0 };
    },
  
  const filterActiveLevels = (levels: ServiceLevel[]) => {
    return levels.filter(level => level.isActive);
  };
  
  const groupByType = (levels: ServiceLevel[]) => {
    const oneTime = levels.filter(level => level.type === 'one-time');
    const monthly = levels.filter(level => level.type === 'monthly');
    const seasonal = levels.filter(level => level.type === 'seasonal');
    const bulk = levels.filter(level => level.type === 'bulk');
    
    return { oneTime, monthly, seasonal, bulk };
  };
  
  const activeServiceLevels = filterActiveLevels(serviceLevels);
  console.log('All service levels:', serviceLevels);
  console.log('Active service levels:', activeServiceLevels);
  const { oneTime, monthly, seasonal, bulk } = groupByType(activeServiceLevels);
  console.log('Grouped levels - bulk:', bulk);
  
  const handleSelectPlan = (plan: ServiceLevel) => {
    console.log('Selected plan:', plan.name, 'Type:', plan.type);
    setSelectedPlan(plan);
    
    // For bulk plans, show the purchase form instead of immediate subscription
    if (plan.type === 'bulk') {
      console.log('Opening bulk plan form for:', plan.name);
      setShowBulkPlanForm(true);
      setIsSubscribing(false); // Ensure subscription dialog doesn't show
    } else {
      setIsSubscribing(true);
      setShowBulkPlanForm(false); // Ensure bulk form doesn't show
  };

  const handleBulkPlanPurchase = (additionalPumpOuts: number, totalCost: number) => {
    setBulkPlanDetails({ additionalPumpOuts, totalCost });
    setShowBulkPlanForm(false);
    setShowPayment(true);
  };

  const handleBulkPlanCancel = () => {
    setShowBulkPlanForm(false);
    setSelectedPlan(null);
    setBulkPlanDetails(null);
  };
  
  const handleConfirmSubscription = async () => {
    if (!user || !selectedPlan) return;
    
    // All service plans require payment first
    setShowPayment(true);
  };
  
  const handlePaymentSuccess = async () => {
    try {
      // Create subscription object with additional properties for different subscription types
      const subscriptionRequest = {
        serviceLevelId: selectedPlan.id,
        // Only include these fields for monthly subscriptions
        ...(selectedPlan.type === 'monthly' && {
          activeMonth: selectedMonth,
          autoRenew: autoRenew
        }),
        // Include bulk plan details
        ...(selectedPlan.type === 'bulk' && bulkPlanDetails && {
          additionalPumpOuts: bulkPlanDetails.additionalPumpOuts,
          totalPumpOuts: (selectedPlan.baseQuantity || 0) + bulkPlanDetails.additionalPumpOuts,
          bulkPlanYear: new Date().getFullYear()
        })
      };
      
      // Update user subscription after payment
      const response = await apiRequest("POST", "/api/users/me/subscription", subscriptionRequest);
      
      // Credits are automatically updated in the subscription endpoint for one-time services
      
      // Determine subscription period text
      let periodText = '';
      if (selectedPlan.type === 'monthly') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = parseInt(selectedMonth) - 1;
        periodText = `for ${monthNames[monthIndex]}`;
        if (autoRenew) {
          periodText += ' with auto-renewal';
      } else if (selectedPlan.type === 'seasonal') {
        periodText = 'for the season (May-October)';
      } else if (selectedPlan.type === 'one-time') {
        periodText = 'giving you 1 pump-out credit for this year';
      
      toast({
        title: "Payment Successful",
        description: `Your payment for ${selectedPlan.name} ${periodText} has been processed successfully.`,
      
      // Save subscription to local storage for persistence across pages
      import("@/lib/utils").then(utils => {
        const subscriptionData = {
          serviceLevelId: selectedPlan.id,
          name: selectedPlan.name,
          price: selectedPlan.price,
          type: selectedPlan.type,
          description: selectedPlan.description,
          monthlyQuota: selectedPlan.monthlyQuota || 0,
          startDate: new Date().toISOString(),
          // Add new fields
          activeMonth: selectedPlan.type === 'monthly' ? selectedMonth : undefined,
          autoRenew: selectedPlan.type === 'monthly' ? autoRenew : undefined,
        };
        utils.saveSubscriptionToLocal(subscriptionData);
      
      // Invalidate all relevant queries to refresh dashboard data
      setShowPayment(false);
      setIsSubscribing(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error("Error updating subscription after payment:", error);
      toast({
        title: "Error",
        description: "Payment was successful, but there was a problem updating your subscription. Please contact support.",
        variant: "destructive",
  };
  
  const getCurrentServiceLevel = () => {
    if (!subscription || !subscription.serviceLevelId) return null;
    return serviceLevels.find((level: ServiceLevel) => level.id === subscription.serviceLevelId);
  };
  
  const currentServiceLevel = getCurrentServiceLevel();
  
  const ServicePlanCard = ({ plan }: { plan: ServiceLevel }) => {
    const isCurrentPlan = currentServiceLevel?.id === plan.id;
    
    // Calculate remaining credits - handle both credit types
    const remainingCredits = (userCredits?.totalPumpOuts || 0) + (userCredits?.additionalPumpOuts || 0);
    
    // Allow repurchasing if user has current plan but 0 credits remaining
    const canPurchase = !isCurrentPlan || (isCurrentPlan && remainingCredits === 0);
    
    // Determine button text and styling
    const getButtonContent = () => {
      if (isCurrentPlan && remainingCredits > 0) {
        return (
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Current Plan
          </div>
        );
      } else if (isCurrentPlan && remainingCredits === 0) {
        return (
          <div className="flex items-center">
            {plan.type === 'one-time' ? 'Purchase Again' : 'Renew Plan'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </div>
        );
      } else {
        return (
          <div className="flex items-center">
            {plan.type === 'one-time' ? 'Purchase' : 'Subscribe'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </div>
        );
    };
    
    return (
      <Card className={`overflow-hidden flex flex-col h-full ${isCurrentPlan ? 'border-primary border-2' : ''}`}>
        {isCurrentPlan && remainingCredits > 0 && (
          <div className="bg-primary text-white text-center py-1 text-xs font-semibold">
            Current Plan
          </div>
        )}
        {isCurrentPlan && remainingCredits === 0 && (
          <div className="bg-orange-500 text-white text-center py-1 text-xs font-semibold">
            Plan Expired - 0 Credits Remaining
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <div>{plan.name}</div>
            <Badge variant={plan.type === 'one-time' ? "default" : plan.type === 'monthly' ? "outline" : plan.type === 'bulk' ? "destructive" : "secondary"}>
              {plan.type === 'one-time' ? 'One-time' : plan.type === 'monthly' ? 'Monthly' : plan.type === 'bulk' ? 'Bulk' : 'Seasonal'}
            </Badge>
          </CardTitle>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="text-3xl font-bold text-center mb-6">
            {plan.type === 'bulk' ? (
              <div>
                <div>From ${(plan.basePrice || 0).toFixed(2)}</div>
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  {plan.baseQuantity} pump-outs included
                </div>
                <div className="text-xs text-muted-foreground">
                  +${(plan.pricePerAdditional || 0).toFixed(2)} per additional
                </div>
              </div>
            ) : (
              <div>
                ${plan.price.toFixed(2)}
                {plan.type !== 'one-time' && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {plan.type === 'monthly' ? '/mo' : '/season'}
                  </span>
                )}
              </div>
            )}
            <div className="text-sm font-normal text-muted-foreground mt-1">Plus Tax</div>
          </div>
          <div className="space-y-2 flex-1">
            {(plan.monthlyQuota && plan.monthlyQuota > 0) && (
              <div className="flex items-center">
                <CalendarClock className="h-4 w-4 mr-2 text-primary" />
                <span>{plan.monthlyQuota} scheduled services per month</span>
              </div>
            )}
            {(plan.onDemandQuota && plan.onDemandQuota > 0) && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                <span>{plan.onDemandQuota} on-demand service{plan.onDemandQuota > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-auto">
          <Button 
            className="w-full" 
            variant={isCurrentPlan && remainingCredits > 0 ? "outline" : "default"}
            disabled={!canPurchase}
            onClick={() => canPurchase && handleSelectPlan(plan)}
          >
            {getButtonContent()}
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <>
      <Helmet>
        <title>Service Subscription | Poopalotzi</title>
        <meta name="description" content="Choose a pump-out service subscription plan" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A]">Service Subscription</h1>
          <p className="text-gray-600">
            Choose a service plan that best fits your needs
          </p>
        </div>
        
        {isLoading || isLoadingSubscription || isLoadingCredits ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-[#38B2AC] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading service plans...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {currentServiceLevel && (
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle>Your Current Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-[#38B2AC] flex items-center justify-center">
                      <Sailboat className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{currentServiceLevel.name}</h3>
                      <p className="text-muted-foreground">{currentServiceLevel.description}</p>
                      <div className="flex items-center mt-2">
                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                        <span className="font-medium text-green-600">
                          ${currentServiceLevel.price.toFixed(2)}
                          {currentServiceLevel.type !== 'one-time' && (
                            <span className="text-sm font-normal text-muted-foreground">
                              {currentServiceLevel.type === 'monthly' ? '/mo' : '/season'}
                            </span>
                          )}
                          <span className="text-sm font-normal text-muted-foreground ml-1">Plus Tax</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {oneTime.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">One-Time Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {oneTime.map((plan: ServiceLevel) => (
                    <ServicePlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </div>
            )}
            
            {monthly.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Monthly Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {monthly.map((plan: ServiceLevel) => (
                    <ServicePlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </div>
            )}
            
            {bulk.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Bulk Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bulk.map((plan: ServiceLevel) => (
                    <ServicePlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </div>
            )}
            
            {seasonal.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Seasonal Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {seasonal.map((plan: ServiceLevel) => (
                    <ServicePlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Subscription Confirmation Dialog */}
      <Dialog open={isSubscribing && !showPayment} onOpenChange={(open) => !open && setIsSubscribing(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription>
              You are about to subscribe to the {selectedPlan?.name} plan.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="py-4">
              <div className="bg-muted rounded-md p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{selectedPlan.name}</span>
                  <Badge variant={selectedPlan.type === 'one-time' ? "default" : selectedPlan.type === 'monthly' ? "outline" : selectedPlan.type === 'bulk' ? "destructive" : "secondary"}>
                    {selectedPlan.type === 'one-time' ? 'One-time' : selectedPlan.type === 'monthly' ? 'Monthly' : selectedPlan.type === 'bulk' ? 'Bulk' : 'Seasonal'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{selectedPlan.description}</p>
                <div className="flex justify-between items-center">
                  <span>Price:</span>
                  <span className="font-bold">
                    {selectedPlan.type === 'bulk' ? (
                      <div>
                        <div>From ${(selectedPlan.basePrice || 0).toFixed(2)}</div>
                        <div className="text-sm font-normal text-muted-foreground">
                          {selectedPlan.baseQuantity} pump-outs included
                        </div>
                        <div className="text-xs text-muted-foreground">
                          +${(selectedPlan.pricePerAdditional || 0).toFixed(2)} per additional
                        </div>
                      </div>
                    ) : (
                      <div>
                        ${selectedPlan.price.toFixed(2)}
                        {selectedPlan.type !== 'one-time' && (
                          <span className="text-sm font-normal text-muted-foreground">
                            {selectedPlan.type === 'monthly' ? '/mo' : '/season'}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-sm font-normal text-muted-foreground ml-1">Plus Tax</span>
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {selectedPlan.type === 'one-time' ? (
                  "This is a one-time purchase. You will be prompted to enter payment information."
                ) : selectedPlan.type === 'monthly' ? (
                  "This is a monthly subscription valid for one month from the start date."
                ) : selectedPlan.type === 'bulk' ? (
                  "This is a bulk plan with base pump-outs included. You can customize by adding additional pump-outs for the season (May 1 - October 31)."
                ) : (
                  "This is a seasonal subscription covering May 1 through October 31."
                )}
              </p>
              
              {selectedPlan.type === 'monthly' && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="month-select">Select Active Month</Label>
                    <Select 
                      value={selectedMonth} 
                      onValueChange={setSelectedMonth}
                    >
                      <SelectTrigger id="month-select">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="05">May</SelectItem>
                        <SelectItem value="06">June</SelectItem>
                        <SelectItem value="07">July</SelectItem>
                        <SelectItem value="08">August</SelectItem>
                        <SelectItem value="09">September</SelectItem>
                        <SelectItem value="10">October</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Your plan will be active from the 1st to the last day of the selected month.
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="auto-renew" 
                      checked={autoRenew}
                      onCheckedChange={(checked) => setAutoRenew(checked as boolean)} 
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label 
                        htmlFor="auto-renew" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Auto-Renew Subscription
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically renew this subscription every month until canceled.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setIsSubscribing(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedPlan?.type === 'bulk') {
                  setIsSubscribing(false);
                  setShowBulkPlanForm(true);
                } else {
                  handleConfirmSubscription();
              }} 
              className="bg-[#0B1F3A] hover:bg-opacity-90"
            >
              {selectedPlan?.type === 'one-time' ? "Proceed to Payment" : 
               selectedPlan?.type === 'bulk' ? "Customize Plan" : "Confirm Subscription"}
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={(open) => !open && setShowPayment(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Enter your payment information to complete your purchase
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <PaymentForm
              requestId={0} // Not tied to a specific request for service subscription
              amount={selectedPlan.type === 'bulk' && bulkPlanDetails ? bulkPlanDetails.totalCost : selectedPlan.price}
              onSuccess={handlePaymentSuccess}
              isSubscriptionPayment={true}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Bulk Plan Purchase Form Dialog */}
      <Dialog open={showBulkPlanForm} onOpenChange={(open) => !open && handleBulkPlanCancel()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Bulk Plan</DialogTitle>
            <DialogDescription>
              Choose how many additional pump-outs you'd like for this season
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <BulkPlanPurchaseForm
              serviceLevel={selectedPlan}
              onPurchase={handleBulkPlanPurchase}
              onCancel={handleBulkPlanCancel}
              isLoading={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
