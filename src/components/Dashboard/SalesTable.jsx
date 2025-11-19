import { useI18n } from "@/i18n";
import { useCallback } from "react";
import formatCurrency from '@/utils/formatCurrency';
export function SalesTable({ sales, loading, error }) {
  if (error) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-red-200 dark:border-red-800 p-6 text-red-600 dark:text-red-300">
        Unable to load sales history. Please try again.
      </div>
    );
  }
const { t } = useI18n();
  const L = useCallback(
    (key, fallback) => {
      try {
        const value = t(key);
        if (!value || value === key) {
          return fallback;
        }
        return value;
      } catch (err) {
        return fallback;
      }
    },
    [t]
  );
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#262626]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {L('sales_management.header_Product', 'Product')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {L('sales_management.header_quantity', 'Quantity')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {L('sales_management.header_damaged', 'Damaged')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {L('sales_management.header_unit_price', 'Unit Price')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {L('sales_management.header_total_price', 'Total Price')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {L('sales_management.header_customer', 'Customer')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {L('sales_management.header_date', 'Date')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  {L('sales_management.loading_sales', 'Loading sales...')}
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {L('sales_management.no_sales', 'No sales recorded yet.')}
                  {L('sales_management.no_sales_message', 'Record your first sale to see it listed here.')}
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const quantity = Number(sale.quantity ?? 0);
                const unitPrice = Number(sale.unit_price ?? 0);
                const totalAmount = Number(sale.total_amount ?? quantity * unitPrice);

                return (
                  <tr
                    key={sale.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {sale.product_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {sale.notes || L('sales_management.notes', 'No notes')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {quantity}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {Number(sale.damaged_quantity ?? 0) > 0 ? (
                        <span className="text-rose-700 dark:text-rose-300">{Number(sale.damaged_quantity).toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                      {sale.damage_reason ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{sale.damage_reason}</div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {formatCurrency(unitPrice)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {sale.customer_name || L('sales_management.customer', 'Walk-in')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {sale.sale_date
                        ? new Date(sale.sale_date).toLocaleString()
                        : "--"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
