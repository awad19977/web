import { useQuery } from "@tanstack/react-query";

export function useDashboardReports(options = {}) {
  const { enabled = true, start = null, end = null } = options;

  return useQuery({
    queryKey: ["reports", start ? String(start) : null, end ? String(end) : null],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (start) params.set("start", String(start));
      if (end) params.set("end", String(end));
      const url = `/api/reports${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
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
