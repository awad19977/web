import { useQuery } from "@tanstack/react-query";

export function useDashboardReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const response = await fetch("/api/reports");
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }
      return response.json();
    },
  });
}
