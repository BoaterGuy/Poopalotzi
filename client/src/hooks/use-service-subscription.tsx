import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ServiceLevel } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getSubscriptionFromLocal, saveSubscriptionToLocal } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type Subscription = {
  userId: number;
  serviceLevelId: number;
  startDate: string;
};

export function useServiceSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Get subscription from API
  const { 
    data: subscription, 
    isLoading: isLoadingSubscription,
    isError: isSubscriptionError,
    error: subscriptionError
  } = useQuery<Subscription>({
    queryKey: ['/api/users/me/subscription'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/users/me/subscription', {
          credentials: 'include'
        });
        
        if (response.ok) {
          return response.json();
        }
        
        // If no subscription is found, check local storage
        const localSubscription = getSubscriptionFromLocal();
        if (localSubscription) {
          // If found in local storage, try to save it to the API
          await saveSubscriptionToAPI(localSubscription.serviceLevelId);
          return localSubscription;
        }
        
        throw new Error('No subscription found');
      } catch (error) {
        console.error('Error fetching subscription:', error);
        throw error;
      }
    },
    retry: false,
    enabled: !!user && isLoaded,
  });
  
  // Get all service levels (for reference)
  const { 
    data: serviceLevels, 
    isLoading: isLoadingServiceLevels
  } = useQuery<ServiceLevel[]>({
    queryKey: ['/api/service-levels'],
    queryFn: async () => {
      const response = await fetch('/api/service-levels', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch service levels');
      }
      
      return response.json();
    },
  });
  
  // Save subscription mutation
  const saveSubscription = useMutation({
    mutationFn: async (serviceLevelId: number) => {
      return saveSubscriptionToAPI(serviceLevelId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/subscription'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Helper function to save subscription to API
  const saveSubscriptionToAPI = async (serviceLevelId: number) => {
    try {
      const response = await fetch('/api/users/me/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ serviceLevelId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }
      
      // Find the service level to save locally
      const serviceLevel = serviceLevels?.find(level => level.id === serviceLevelId);
      if (serviceLevel) {
        const subscriptionData = {
          userId: user?.id || 0,
          serviceLevelId,
          startDate: new Date().toISOString(),
          serviceLevel: serviceLevel
        };
        
        // Save to local storage for persistence
        saveSubscriptionToLocal(subscriptionData);
        return subscriptionData;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  };
  
  // Load local subscription on mount (only once)
  useEffect(() => {
    const localSubscription = getSubscriptionFromLocal();
    setIsLoaded(true);
    
    // If we have a local subscription but no API subscription
    if (localSubscription && !subscription && user) {
      // Try to save the local subscription to the API
      saveSubscription.mutate(localSubscription.serviceLevelId);
    }
  }, [user]);
  
  // Get the service level details for the current subscription
  const currentServiceLevel = serviceLevels && subscription ? 
    serviceLevels.find(level => level.id === subscription.serviceLevelId) : null;
  
  return {
    subscription,
    currentServiceLevel,
    saveSubscription: (serviceLevelId: number) => saveSubscription.mutate(serviceLevelId),
    isLoading: isLoadingSubscription || isLoadingServiceLevels || saveSubscription.isPending,
    error: subscriptionError
  };
}