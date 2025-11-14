import { FEATURE_KEYS } from "@/constants/featureFlags";
import { SummaryCard } from "./SummaryCard";
import { StockTransactionsReport } from "./StockTransactionsReport";
import { ProductTransactionsReport } from "./ProductTransactionsReport";

function StatBlock({ label, value, helpText }) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {helpText ? (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{helpText}</p>
      ) : null}
    </div>
  );
}

function formatCurrency(number) {
  if (typeof number !== "number" || Number.isNaN(number)) {
    return "$0";
  }
  return `$${number.toLocaleString()}`;
}

export function ReportsTab({ reports, reportsLoading, features }) {
  const hasReportsAccess = features?.[FEATURE_KEYS.REPORTS] !== false;

  if (!hasReportsAccess) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Reports unavailable</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enable the reports feature to view consolidated revenue, cost, and trend information.
        </p>
      </div>
    );
  }

  if (reportsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No data available</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          There are no reports to display yet. Add sales, stock, and expense data to populate detailed insights.
        </p>
      </div>
    );
  }

  const summary = reports.summary ?? {};
  const topProducts = reports.topProducts ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Revenue"
          value={formatCurrency(summary.totalRevenue)}
          change={summary.revenueChange ?? "+0%"}
          positive={(summary.revenueChange ?? "").startsWith("+")}
        />
        <SummaryCard
          title="Expenses"
          value={formatCurrency(summary.totalCosts)}
          change={summary.costChange ?? "+0%"}
          positive={(summary.costChange ?? "").startsWith("-")}
        />
        <SummaryCard
          title="Net Profit"
          value={formatCurrency(summary.netProfit)}
          change={`${summary.profitMargin?.toFixed?.(1) ?? "0"}%`}
          positive={(summary.netProfit ?? 0) >= 0}
        />
        <StatBlock
          label="Gross Margin"
          value={`${summary.grossMargin?.toFixed?.(1) ?? "0"}%`}
          helpText="Calculated from revenue minus direct costs"
        />
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Products</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sorted by total revenue generated in the selected period.
            </p>
          </div>
        </div>

        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No product performance data yet.</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div
                key={product.id ?? index}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {product.total_sold ?? product.quantity ?? 0} sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(product.total_revenue ?? product.revenue ?? 0)}
                  </p>
                  {typeof product.margin === "number" && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Margin: {product.margin.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Stock Transactions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Filter and review stock movement per item.</p>
          <StockTransactionsReport />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Product Transactions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Track increases from production and decreases from sales.</p>
          <ProductTransactionsReport />
        </div>
      </div>
    </div>
  );
}
