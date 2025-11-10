export function StockTable({ stock, onPurchaseClick }) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#262626]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Unit Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
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
                </td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">
                  ${item.unit_cost}
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {item.supplier || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onPurchaseClick(item)}
                    className="text-[#18B84E] dark:text-[#16A249] hover:text-[#16A249] dark:hover:text-[#14D45D] font-medium"
                  >
                    Purchase More
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
