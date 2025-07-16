import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import { ServiceLevel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  ArrowRight, 
  Calendar, 
  Clock, 
  DollarSign, 
  Anchor,
  Waves,
  Ship,
  CalendarClock,
  Star,
  Info
} from "lucide-react";
import BulkPlanPurchaseForm from "@/components/member/BulkPlanPurchaseForm";
import PaymentForm from "@/components/member/PaymentForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { calculateMaxAdditionalPumpOuts } from "@shared/bulk-plan-utils";

export default function ServicePlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showBulkPlanForm, setShowBulkPlanForm] = useState(false);
  const [bulkPlanDetails, setBulkPlanDetails] = useState<{additionalPumpOuts: number; totalCost: number} | null>(null);

  const { data: serviceLevels, isLoading } = useQuery<ServiceLevel[]>({
    queryKey: ['/api/service-levels'],
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery<{userId: number, serviceLevelId: number}>({
    queryKey: ['/api/users/me/subscription'],
    enabled: !!user,
    refetchOnMount: true,
    staleTime: 0,
  });

  const handleSelectPlan = (plan: ServiceLevel) => {
    setSelectedPlan(plan);
    
    if (plan.type === 'bulk') {
      setShowBulkPlanForm(true);
    } else {
      setShowPayment(true);
    }
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

  const handlePaymentSuccess = async () => {
    try {
      toast({
        title: "Success!",
        description: "Your service plan has been activated successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/subscription'] });
      setShowPayment(false);
      setSelectedPlan(null);
      setBulkPlanDetails(null);
    } catch (error) {
      console.error("Error updating subscription after payment:", error);
      toast({
        title: "Error",
        description: "Payment was successful, but there was a problem updating your subscription. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const getCurrentServiceLevel = () => {
    if (!subscription || !subscription.serviceLevelId) return null;
    return serviceLevels?.find((level: ServiceLevel) => level.id === subscription.serviceLevelId);
  };

  const currentServiceLevel = getCurrentServiceLevel();

  // Categorize plans
  const oneTime = serviceLevels?.filter(plan => plan.type === 'one-time') || [];
  const monthly = serviceLevels?.filter(plan => plan.type === 'monthly') || [];
  const bulk = serviceLevels?.filter(plan => plan.type === 'bulk') || [];
  const seasonal = serviceLevels?.filter(plan => plan.type === 'seasonal') || [];

  const ServicePlanCard = ({ plan }: { plan: ServiceLevel }) => {
    const isCurrentPlan = currentServiceLevel?.id === plan.id;
    const isPopular = plan.name.toLowerCase().includes('royal flush');
    
    return (
      <Card className={`overflow-hidden flex flex-col h-full relative ${isCurrentPlan ? 'border-primary border-2' : ''} ${isPopular ? 'border-amber-400 border-2' : ''}`}>
        {isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
            <Badge className="bg-amber-400 text-amber-900 px-3 py-1">
              <Star className="h-3 w-3 mr-1" />
              Most Popular
            </Badge>
          </div>
        )}
        {isCurrentPlan && (
          <div className="bg-primary text-white text-center py-1 text-xs font-semibold">
            Current Plan
          </div>
        )}
        <CardHeader className="pb-2 pt-6">
          <CardTitle className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {plan.type === 'one-time' && <Clock className="h-5 w-5 text-blue-500" />}
              {plan.type === 'monthly' && <Calendar className="h-5 w-5 text-green-500" />}
              {plan.type === 'bulk' && <Ship className="h-5 w-5 text-purple-500" />}
              {plan.type === 'seasonal' && <Waves className="h-5 w-5 text-cyan-500" />}
              <span>{plan.name}</span>
            </div>
            <Badge variant={plan.type === 'one-time' ? "default" : plan.type === 'monthly' ? "outline" : plan.type === 'bulk' ? "destructive" : "secondary"}>
              {plan.type === 'one-time' ? 'One-time' : plan.type === 'monthly' ? 'Monthly' : plan.type === 'bulk' ? 'Bulk' : 'Seasonal'}
            </Badge>
          </CardTitle>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="text-center mb-6">
            {plan.type === 'bulk' ? (
              <div>
                <div className="text-3xl font-bold text-primary">
                  From ${(plan.basePrice || 0).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {plan.baseQuantity} pump-outs included
                </div>
                <div className="text-xs text-muted-foreground">
                  +${(plan.pricePerAdditional || 0).toFixed(2)} per additional
                </div>
                <div className="text-xs text-amber-600 font-medium mt-1">
                  Max {calculateMaxAdditionalPumpOuts(new Date()).maxAdditionalPumpOuts} additional this season
                </div>
              </div>
            ) : (
              <div>
                <div className="text-3xl font-bold text-primary">
                  ${plan.price.toFixed(2)}
                </div>
                {plan.type !== 'one-time' && (
                  <div className="text-sm text-muted-foreground">
                    {plan.type === 'monthly' ? '/month' : '/season'}
                  </div>
                )}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">Plus Tax</div>
          </div>
          
          <div className="space-y-3 flex-1">
            {plan.type === 'bulk' && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center text-purple-700 text-sm font-medium mb-1">
                  <Info className="h-4 w-4 mr-1" />
                  Bulk Plan Benefits
                </div>
                <ul className="text-xs text-purple-600 space-y-1">
                  <li>• Customize additional pump-outs</li>
                  <li>• Maximum 1 per week until Oct 31</li>
                  <li>• Perfect for heavy usage boats</li>
                </ul>
              </div>
            )}
            
            {(plan.monthlyQuota && plan.monthlyQuota > 0) && (
              <div className="flex items-center">
                <CalendarClock className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">{plan.monthlyQuota} scheduled services per month</span>
              </div>
            )}
            
            {(plan.onDemandQuota && plan.onDemandQuota > 0) && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">{plan.onDemandQuota} on-demand service{plan.onDemandQuota > 1 ? 's' : ''}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Anchor className="h-4 w-4 mr-2 text-primary" />
              <span className="text-sm">
                {plan.name.toLowerCase().includes('multi') ? 'Multiple head boats' : 'Single head boats'}
              </span>
            </div>
            
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-sm">Service history & documentation</span>
            </div>
            
            {plan.type !== 'one-time' && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">Priority scheduling</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-auto">
          <Button 
            className="w-full" 
            variant={isCurrentPlan ? "outline" : isPopular ? "default" : "outline"}
            disabled={isCurrentPlan}
            onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
          >
            {isCurrentPlan ? (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Current Plan
              </div>
            ) : (
              <div className="flex items-center">
                {plan.type === 'one-time' ? 'Purchase' : plan.type === 'bulk' ? 'Customize & Buy' : 'Subscribe'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <>
      <Helmet>
        <title>Service Plans | Poopalotzi</title>
        <meta name="description" content="Choose the perfect pump-out service plan for your boat" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A] mb-2">Service Plans</h1>
          <p className="text-gray-600">
            Choose the perfect plan for your boating needs
          </p>
        </div>
        
        {/* Current Subscription */}
        {currentServiceLevel && (
          <Card className="bg-muted/30 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Your Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                  <Anchor className="h-6 w-6 text-white" />
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
        
        {isLoading || isLoadingSubscription ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading service plans...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Bulk Plans */}
            {bulk.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Ship className="h-6 w-6 text-purple-500" />
                  <h2 className="text-2xl font-semibold">Bulk Plans</h2>
                  <Badge variant="destructive">Popular</Badge>
                </div>
                <p className="text-muted-foreground mb-6">
                  Perfect for boats with heavy usage. Customize your pump-out quantity based on your needs.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bulk.map((plan: ServiceLevel) => (
                    <ServicePlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Monthly Plans */}
            {monthly.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-6 w-6 text-green-500" />
                  <h2 className="text-2xl font-semibold">Monthly Plans</h2>
                </div>
                <p className="text-muted-foreground mb-6">
                  Regular service with predictable monthly billing. Great for consistent usage patterns.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {monthly.map((plan: ServiceLevel) => (
                    <ServicePlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Seasonal Plans */}
            {seasonal.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Waves className="h-6 w-6 text-cyan-500" />
                  <h2 className="text-2xl font-semibold">Seasonal Plans</h2>
                </div>
                <p className="text-muted-foreground mb-6">
                  Complete seasonal coverage from May through October. Perfect for seasonal boaters.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {seasonal.map((plan: ServiceLevel) => (
                    <ServicePlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </div>
            )}
            
            {/* One-Time Services */}
            {oneTime.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-6 w-6 text-blue-500" />
                  <h2 className="text-2xl font-semibold">One-Time Services</h2>
                </div>
                <p className="text-muted-foreground mb-6">
                  Pay as you go. Perfect for occasional use or trying our service for the first time.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {oneTime.map((plan: ServiceLevel) => (
                    <ServicePlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={(open) => !open && setShowPayment(false)}>
        <DialogContent className="max-w-md sm:max-w-2xl lg:max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Enter your payment information to complete your purchase
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <PaymentForm
              requestId={0}
              amount={selectedPlan.type === 'bulk' && bulkPlanDetails ? bulkPlanDetails.totalCost : selectedPlan.price}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Bulk Plan Purchase Form Dialog */}
      <Dialog open={showBulkPlanForm} onOpenChange={(open) => !open && handleBulkPlanCancel()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
}