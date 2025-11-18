const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

import { useCallback } from 'react';
import { useI18n } from '@/i18n';

export function ExpenseTable({ expenses }) {
  const { t } = useI18n();
  const L = useCallback((key, fallback, params) => {
    try {
      const value = t(key, params);
      if (!value || value === key) return fallback;
      return value;
    } catch (err) {
      return fallback;
    }
  }, [t]);

  const dash = L('dash', '—');
const toKey = (s) =>
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");



  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#262626]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {L('expense_management.expense_table.header_category', 'Category')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {L('expense_management.expense_table.header_description', 'Description')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {L('expense_management.expense_table.header_amount', 'Amount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {L('expense_management.expense_table.header_date', 'Date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {L('expense_management.expense_table.header_notes', 'Notes')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                    {L(`expense_categories.${toKey(expense.category)}`, expense.category)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {expense.description}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  {currencyFormatter.format(expense.amount ?? 0)}
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : dash}
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {expense.notes?.trim() ? expense.notes : dash}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
