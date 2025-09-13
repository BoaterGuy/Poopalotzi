import { QueryClient } from '@tanstack/react-query';

// Create QueryClient with proper configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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

// Default fetch function for queries
const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  return apiRequest(queryKey[0] as string);
};

// Set default query function
queryClient.setDefaultOptions({
  queries: {
    queryFn: defaultQueryFn,
  },
});

// Re-export TanStack Query hooks for convenience
export { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';