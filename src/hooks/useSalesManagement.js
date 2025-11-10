import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const jsonFetcher = async (input, init) => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error("Request failed");
  }
  return response.json();
};

export function useSalesManagement() {
  const queryClient = useQueryClient();

  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: () => jsonFetcher("/api/products"),
  });

  const {
    data: sales = [],
    isLoading: salesLoading,
    isError: salesError,
  } = useQuery({
    queryKey: ["sales"],
    queryFn: () => jsonFetcher("/api/sales"),
  });

  const recordSaleMutation = useMutation({
    mutationFn: (payload) =>
      jsonFetcher("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return {
    products,
    productsLoading,
    productsError,
    sales,
    salesLoading,
    salesError,
    recordSale: recordSaleMutation.mutate,
    recordSaleLoading: recordSaleMutation.isLoading,
  };
}
