// Add missing imports for the stubs
import { useState, useEffect } from 'react';

// React Query has been removed to fix TypeScript vendor module errors
// Using simple fetch-based requests instead

// Helper function for API requests
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json();
};

// Legacy export for compatibility
export const queryClient = null;

// Temporary stubs to prevent "not defined" errors until components are fully migrated
export const useQuery = ({ queryKey, queryFn, select }: any) => {
  // Default to empty array for array-type queries to prevent .filter() errors
  const defaultValue = queryKey && queryKey[0] && (queryKey[0].includes('/marinas') || queryKey[0].includes('/customers') || queryKey[0].includes('/users') || queryKey[0].includes('/service-levels') || queryKey[0].includes('/boats') || queryKey[0].includes('/requests')) ? [] : null;
  const [data, setData] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        let result;
        if (queryFn) {
          result = await queryFn();
        } else if (typeof queryKey[0] === 'string') {
          const response = await fetch(queryKey[0], { credentials: 'include' });
          result = response.ok ? await response.json() : defaultValue;
        }
        if (select && result) {
          result = select(result);
        }
        setData(result || defaultValue);
      } catch (err: any) {
        setError(err);
        setData(defaultValue);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [JSON.stringify(queryKey)]);

  return { data, isLoading, error, refetch: () => {} };
};

export const useMutation = ({ mutationFn, onSuccess, onError }: any) => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (variables: any) => {
    try {
      setIsPending(true);
      const result = await mutationFn(variables);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      if (onError) onError(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};

// Add useQueryClient stub
export const useQueryClient = () => {
  return {
    invalidateQueries: () => {},
    setQueryData: () => {},
    getQueryData: () => null,
  };
};