import { useQuery } from "@tanstack/react-query";

export function useDashboardReports(options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const response = await fetch("/api/reports");
      if (!response.ok) {
        const message = await response.json().catch(() => null);
        const error = new Error(message?.error || "Failed to fetch reports");
        error.status = response.status;
        throw error;
      }
      return response.json();
    },
    enabled,
    retry: (failureCount, error) => {
      if (error?.status === 403 || error?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
