import { useQuery } from "@tanstack/react-query";

const fetchStock = async () => {
  const response = await fetch("/api/stock");
  if (!response.ok) {
    throw new Error("Failed to fetch stock catalog");
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item) => ({
    id: Number(item?.id ?? item?.stock_id ?? 0),
    name: item?.name ?? "Unnamed stock",
    unit: item?.unit ?? item?.base_unit?.name ?? null,
    unit_cost: Number(item?.unit_cost ?? item?.base_unit?.unit_cost ?? 0),
    current_quantity: Number(item?.current_quantity ?? 0),
    allow_extra_production: Boolean(item?.allow_extra_production ?? item?.allowExtraProduction ?? false),
    extra_production_limit: Number(item?.extra_production_limit ?? item?.extraProductionLimit ?? 0),
  }));
};

export function useStockCatalog() {
  const query = useQuery({
    queryKey: ["stockCatalog"],
    queryFn: fetchStock,
    staleTime: 30_000,
  });

  return {
    stock: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
