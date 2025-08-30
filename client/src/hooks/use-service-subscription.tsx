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
  // React Query removed
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Get subscription from API
  const { 
    data: subscription, 
    isLoading: isLoadingSubscription,
    isError: isSubscriptionError,
    error: subscriptionError
  } = useQuery<Subscription>({
    queryFn: async () => {
      try {
        const response = await fetch('/api/users/me/subscription', {
          credentials: 'include'
        
        if (response.ok) {
