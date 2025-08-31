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
  const [isLoaded, setIsLoaded] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [serviceLevels, setServiceLevels] = useState<ServiceLevel[]>([]);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isLoadingServiceLevels, setIsLoadingServiceLevels] = useState(false);

  // Fetch subscription from API
  const fetchSubscription = async () => {
    if (!user || !isLoaded) return;
    
    setIsLoadingSubscription(true);
    try {
      const response = await fetch('/api/users/me/subscription', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else {
        // If no subscription is found, check local storage
        const localSubscription = getSubscriptionFromLocal();
        if (localSubscription) {
          // If found in local storage, try to save it to the API
          await saveSubscriptionToAPI(localSubscription.serviceLevelId);
          setSubscription(localSubscription);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Fetch service levels
  const fetchServiceLevels = async () => {
    setIsLoadingServiceLevels(true);
    try {
      const response = await fetch('/api/service-levels', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setServiceLevels(data);
      }
    } catch (error) {
      console.error('Error fetching service levels:', error);
    } finally {
      setIsLoadingServiceLevels(false);
    }
  };

  // Save subscription to API
  const saveSubscriptionToAPI = async (serviceLevelId: number) => {
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

    return response.json();
  };

  // Save subscription mutation
  const saveSubscription = {
    mutateAsync: async (serviceLevelId: number) => {
      try {
        await saveSubscriptionToAPI(serviceLevelId);
        await fetchSubscription(); // Refresh data
        toast({
          title: "Success",
          description: "Subscription saved successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save subscription",
          variant: "destructive"
        });
        throw error;
      }
    },
    isPending: false
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      fetchSubscription();
      fetchServiceLevels();
    }
  }, [user, isLoaded]);

  return {
    subscription,
    serviceLevels,
    isLoadingSubscription,
    isLoadingServiceLevels,
    saveSubscription
  };
}