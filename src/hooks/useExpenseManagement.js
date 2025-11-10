import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useExpenseManagement() {
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const response = await fetch("/api/expenses");
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) throw new Error("Failed to add expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  return {
    expenses,
    isLoading,
    addExpense: addExpenseMutation.mutate,
    addExpenseLoading: addExpenseMutation.isLoading,
  };
}
