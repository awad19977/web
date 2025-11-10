import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useStockManagement() {
  const queryClient = useQueryClient();

  const { data: stock = [], isLoading } = useQuery({
    queryKey: ["stock"],
    queryFn: async () => {
      const response = await fetch("/api/stock");
      if (!response.ok) throw new Error("Failed to fetch stock");
      return response.json();
    },
  });

  const addStockMutation = useMutation({
    mutationFn: async (stockData) => {
      const response = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockData),
      });
      if (!response.ok) throw new Error("Failed to add stock");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });

  const purchaseStockMutation = useMutation({
    mutationFn: async (purchaseData) => {
      const response = await fetch("/api/stock/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseData),
      });
      if (!response.ok) throw new Error("Failed to purchase stock");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });

  return {
    stock,
    isLoading,
    addStock: addStockMutation.mutate,
    addStockLoading: addStockMutation.isLoading,
    purchaseStock: purchaseStockMutation.mutate,
    purchaseStockLoading: purchaseStockMutation.isLoading,
  };
}
