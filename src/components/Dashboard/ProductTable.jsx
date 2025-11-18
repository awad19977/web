import { useI18n } from "@/i18n";
import { useCallback } from "react";
const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function ProductTable({ products = [], loading = false, onManageRecipe }) {
  const hasActions = typeof onManageRecipe === "function";
  const columnCount = hasActions ? 7 : 6;
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
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1E1E1E]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#262626]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {L('products.product_table.header_name', 'Name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {L('products.product_table.header_current_stock', 'Current Stock')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {L('products.product_table.header_sell_price', 'Sell Price')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {L('products.product_table.header_total_sold', 'Total Sold')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {L('products.product_table.header_revenue', 'Revenue')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {L('products.product_table.header_recipe', 'Recipe')}
              </th>
              {hasActions ? (
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {L('products.product_table.header_actions', 'Actions')}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={columnCount} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {L('products.product_table.loading', 'Loading products...')}
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  {L('products.product_table.no_products', 'No products documented yet.')}
                  {L('products.product_table.no_products_message', 'Add a new product to start tracking sales and inventory.')}
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const currentStock = quantityFormatter.format(Number(product.current_stock ?? 0));
                const sellingPrice = currencyFormatter.format(Number(product.selling_price ?? 0));
                const totalSold = quantityFormatter.format(Number(product.total_sold ?? 0));
                const revenue = currencyFormatter.format(Number(product.total_sales ?? 0));

                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {product.description || L('products.product_table.no_description', 'No description provided.')}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-gray-900 dark:text-white">
                      {currentStock}
                    </td>
                    <td className="px-6 py-4 align-top text-gray-900 dark:text-white">
                      {sellingPrice}
                    </td>
                    <td className="px-6 py-4 align-top text-gray-900 dark:text-white">
                      {totalSold}
                    </td>
                    <td className="px-6 py-4 align-top font-medium text-gray-900 dark:text-white">
                      {revenue}
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-gray-600 dark:text-gray-400">
                      {Array.isArray(product.recipes) && product.recipes.length > 0 ? (
                        <ul className="space-y-2">
                          {product.recipes.map((recipe) => {
                            const quantity =
                              recipe.quantity !== null && recipe.quantity !== undefined
                                ? quantityFormatter.format(Number(recipe.quantity))
                                : null;
                            const unit = recipe.stock_unit ? ` ${recipe.stock_unit}` : "";
                            const ingredientName = recipe.stock_name || L('products.product_table.unnamed', 'Unnamed stock');
                            const cost = Number(recipe.stock_unit_cost ?? 0);

                            return (
                              <li key={recipe.id ?? `${recipe.stock_id}-${ingredientName}`}>
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  {quantity ? `${quantity}${unit}` : L('products.product_table.no_qty', 'Qty N/A')}
                                </span>{" "}
                                of <span className="text-gray-800 dark:text-gray-100">{ingredientName}</span>
                                {cost > 0 ? (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {" "}• {currencyFormatter.format(cost)} {L('products.product_table.per_unit', 'per unit')}
                                  </span>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">{L('products.product_table.no_recipe', 'No recipe linked')}</span>
                      )}
                    </td>
                    {hasActions ? (
                      <td className="px-6 py-4 align-top">
                        <button
                          type="button"
                          onClick={() => onManageRecipe(product)}
                          className="text-sm font-semibold text-[#18B84E] hover:text-[#16A249] dark:text-[#16A249] dark:hover:text-[#14D45D]"
                        >
                          {L('products.product_table.manage_recipe', 'Manage recipe')}
                        </button>
                      </td>
                    ) : null}
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
