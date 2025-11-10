import { useState } from "react";
import { Plus } from "lucide-react";
import { useExpenseManagement } from "@/hooks/useExpenseManagement";
import { ExpenseTable } from "./ExpenseTable";
import { AddExpenseForm } from "./AddExpenseForm";

export function ExpenseManagementTab() {
  const [showAddForm, setShowAddForm] = useState(false);

  const { expenses, isLoading, addExpense, addExpenseLoading } =
    useExpenseManagement();

  const handleAddExpense = (data) => {
    addExpense(data, {
      onSuccess: () => setShowAddForm(false),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Expense Management
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#18B84E] dark:bg-[#16A249] text-white rounded-lg hover:bg-[#16A249] dark:hover:bg-[#14D45D] transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <ExpenseTable expenses={expenses} />

      {showAddForm && (
        <AddExpenseForm
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddExpense}
          loading={addExpenseLoading}
        />
      )}
    </div>
  );
}
