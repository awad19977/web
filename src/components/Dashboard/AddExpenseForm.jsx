import { useState } from "react";

const EXPENSE_CATEGORIES = [
  "Utilities",
  "Rent",
  "Maintenance",
  "Transportation",
  "Office Supplies",
  "Marketing",
  "Insurance",
  "Professional Services",
  "Travel",
  "Equipment",
  "Other",
];

const getToday = () => new Date().toISOString().slice(0, 10);
const createInitialState = () => ({
  category: "",
  description: "",
  amount: "",
  notes: "",
  expense_date: getToday(),
});

export function AddExpenseForm({ onClose, onSubmit, loading, error }) {
  const [formData, setFormData] = useState(() => createInitialState());
  const [validationError, setValidationError] = useState(null);

  const resetForm = () => {
    setFormData(createInitialState());
    setValidationError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.category) {
      setValidationError("Select a category for this expense.");
      return;
    }

    if (!formData.description.trim()) {
      setValidationError("Provide a short description.");
      return;
    }

    const amountValue = parseFloat(formData.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setValidationError("Amount must be a positive number.");
      return;
    }

    const expenseDate = formData.expense_date
      ? new Date(formData.expense_date)
      : null;
    if (expenseDate && Number.isNaN(expenseDate.getTime())) {
      setValidationError("Enter a valid expense date.");
      return;
    }

    onSubmit({
      category: formData.category,
      description: formData.description.trim(),
      amount: amountValue,
      notes: formData.notes.trim() ? formData.notes.trim() : null,
      expense_date: expenseDate ? expenseDate.toISOString() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Add Expense
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              autoComplete="off"
            >
              <option value="">Select a category</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expense date
            </label>
            <input
              type="date"
              value={formData.expense_date}
              max={getToday()}
              onChange={(e) =>
                setFormData({ ...formData, expense_date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              rows="3"
              autoComplete="off"
            />
          </div>

          {(validationError || error) && (
            <div className="rounded-md border border-rose-200/70 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              {validationError || error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#18B84E] dark:bg-[#16A249] text-white rounded-md hover:bg-[#16A249] dark:hover:bg-[#14D45D] disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
