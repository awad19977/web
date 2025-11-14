import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { normalizeUnitMappings, getBaseUnit } from "@/utils/unitConversion";

export function useStockManagement() {
  const queryClient = useQueryClient();

  const { data: stock = [], isLoading } = useQuery({
    queryKey: ["stock"],
    queryFn: async () => {
      const response = await fetch("/api/stock");
      if (!response.ok) throw new Error("Failed to fetch stock");
      const rows = await response.json();
      if (!Array.isArray(rows)) return [];

      return rows.map((item) => {
        const units = normalizeUnitMappings(item.units ?? []);
        const baseUnit = item.base_unit
          ? {
              ...item.base_unit,
              id: item.base_unit.id ?? item.base_unit.unit_id,
              conversion_factor: Number(item.base_unit.conversion_factor ?? 1),
              is_base: true,
            }
          : getBaseUnit(units);

        return {
          ...item,
          current_quantity: Number(item.current_quantity ?? 0),
          unit_cost: Number(item.unit_cost ?? 0),
          total_purchased: Number(item.total_purchased ?? 0),
          total_cost_purchased: Number(item.total_cost_purchased ?? 0),
          allow_extra_production: Boolean(item.allow_extra_production ?? item.allowExtraProduction ?? false),
          extra_production_limit: Number(item.extra_production_limit ?? item.extraProductionLimit ?? 0),
          units,
          base_unit: baseUnit,
        };
      });
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
      queryClient.invalidateQueries({ queryKey: ["stockUnits"] });
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

  const updateStockMutation = useMutation({
    mutationFn: async (stockData) => {
      const { id, ...payload } = stockData;
      const response = await fetch(`/api/stock/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update stock");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });

  const deleteStockMutation = useMutation({
    mutationFn: async (stockId) => {
      const response = await fetch(`/api/stock/${stockId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete stock");
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
    updateStock: updateStockMutation.mutate,
    updateStockLoading: updateStockMutation.isLoading,
    deleteStock: deleteStockMutation.mutate,
    deleteStockLoading: deleteStockMutation.isLoading,
  };
}
