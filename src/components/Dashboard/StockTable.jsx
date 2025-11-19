import { useI18n } from '@/i18n';
import formatCurrency from '@/utils/formatCurrency';

export function StockTable({
  stock,
  onPurchaseClick,
  onEditClick,
  onDeleteClick,
  canPurchase,
  canEdit,
  canDelete,
  deletingStockId,
}) {
  const { t } = useI18n();
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#262626]">
            <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('stock_table.item')}
              </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('stock_table.current_stock')}
              </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('stock_table.unit_cost')}
              </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('stock_table.supplier')}
              </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('stock_table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {stock.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">
                  {item.current_quantity} {item.unit}
                  {Array.isArray(item.units) && item.units.length > 1 && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      {item.units
                        .filter((unit) => !unit.is_base)
                        .map((unit) => (
                          <div key={unit.id}>
                            1 {unit.name}
                            {item.unit ? ` = ${unit.conversion_factor} ${item.unit}` : ""}
                          </div>
                        ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">
                  {formatCurrency(Number(item.unit_cost ?? 0))}
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {item.supplier || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {canPurchase && (
                      <button
                        onClick={() => onPurchaseClick(item)}
                        className="text-[#18B84E] dark:text-[#16A249] hover:text-[#16A249] dark:hover:text-[#14D45D] font-medium"
                      >
                          {t('stock_table.purchase')}
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => onEditClick(item)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                          {t('stock_table.edit')}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDeleteClick(item)}
                        disabled={deletingStockId === item.id}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:opacity-50"
                      >
                          {deletingStockId === item.id ? t('stock_table.deleting') : t('stock_table.delete')}
                      </button>
                    )}
                    {!canPurchase && !canEdit && !canDelete && (
                        <span className="text-sm text-gray-400 dark:text-gray-500">
                          {t('stock_table.view_only')}
                        </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
