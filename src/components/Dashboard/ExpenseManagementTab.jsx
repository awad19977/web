import { useState, useCallback } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { useExpenseManagement } from "@/hooks/useExpenseManagement";
import { ExpenseTable } from "./ExpenseTable";
import { AddExpenseForm } from "./AddExpenseForm";
import { useI18n } from '@/i18n';
import formatCurrency from '@/utils/formatCurrency';

export function ExpenseManagementTab() {
  const { t } = useI18n();
  const L = useCallback(
    (key, fallback, params) => {
      try {
        const value = t(key, params);
        if (!value || value === key) return fallback;
        return value;
      } catch (err) {
        return fallback;
      }
    },
    [t]
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [formError, setFormError] = useState(null);

  const { expenses, isLoading, isError, error, addExpense, addExpenseLoading } =
    useExpenseManagement();

  const handleAddExpense = (data) => {
    setFormError(null);
    addExpense(data, {
      onSuccess: (result) => {
        setShowAddForm(false);
              setFeedback({
          type: "success",
          message: L(
            'expense_management.logged',
            'Logged {desc} for {amount}',
            {
              desc: result?.description || L('expense_management.logged_default', 'expense'),
              amount: formatCurrency(result?.amount ?? data.amount ?? 0),
            }
          ),
        });
      },
      onError: (mutationError) => {
        setFormError(mutationError?.message || L('expense_management.add_failed', 'Unable to add expense right now.'));
      },
    });
  };

  const closeModal = () => {
    setShowAddForm(false);
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {L('expense_management.title','Expense Management')}
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#18B84E] dark:bg-[#16A249] text-white rounded-lg hover:bg-[#16A249] dark:hover:bg-[#14D45D] transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          {L('expense_management.add','Add Expense')}
        </button>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          {feedback.message}
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-3 text-xs font-semibold uppercase tracking-wide"
          >
            {L('dismiss','Dismiss')}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse rounded-xl border border-dashed border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-[#1E1E1E]"
            >
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 h-3 w-48 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 flex gap-2">
                <div className="h-8 flex-1 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-8 flex-1 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200/70 bg-rose-50 p-4 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div>
            <h3 className="font-semibold">{L('expense_management.unable_load','Unable to load expenses')}</h3>
            <p className="text-sm opacity-90">
              {error?.message || L('expense_management.unable_load_message','Please refresh the page or try again later.')}
            </p>
          </div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-[#1E1E1E]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {L('expense_management.no_expenses_title','No expenses logged yet')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {L('expense_management.no_expenses_message','Keep track of operational costs by recording your first expense.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#18B84E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16A249] dark:bg-[#16A249] dark:hover:bg-[#14D45D]"
          >
            <Plus className="h-4 w-4" />
            {L('expense_management.add_an_expense','Add an expense')}
          </button>
        </div>
      ) : (
        <ExpenseTable expenses={expenses} />
      )}

      {showAddForm && (
        <AddExpenseForm
          onClose={closeModal}
          onSubmit={handleAddExpense}
          loading={addExpenseLoading}
          error={formError}
        />
      )}
    </div>
  );
}
