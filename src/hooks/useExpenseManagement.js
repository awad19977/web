import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const parseExpensePayload = (payload) => {
  if (!payload) return [];
  const expenses = Array.isArray(payload) ? payload : payload.expenses;
  if (!Array.isArray(expenses)) return [];
  return expenses.map((expense) => ({
    ...expense,
    amount: Number(expense.amount ?? 0),
    expense_date: expense.expense_date ?? null,
  }));
};

export function useExpenseManagement() {
  const queryClient = useQueryClient();

  const {
    data: expenses = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const response = await fetch("/api/expenses");
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const payload = await response.json();
      return parseExpensePayload(payload);
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) {
        const message = await response.json().catch(() => null);
        const error = new Error(
          message?.error || "Failed to add expense",
        );
        error.status = response.status;
        throw error;
      }
      const payload = await response.json();
      return payload?.expense
        ? parseExpensePayload([payload.expense])[0]
        : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  return {
    expenses,
    isLoading,
    isError,
    error,
    addExpense: addExpenseMutation.mutate,
    addExpenseAsync: addExpenseMutation.mutateAsync,
    addExpenseLoading: addExpenseMutation.isLoading,
  };
}
