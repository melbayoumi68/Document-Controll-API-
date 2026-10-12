import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 401, 403, 404 or 400
        const status = error?.response?.status
        if (status === 401 || status === 403 || status === 404 || status === 400) {
          return false
        }
        return failureCount < 2
      },
    },
  },
})
