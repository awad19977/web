import { FEATURE_KEYS } from "@/constants/featureFlags";
import { SummaryCard } from "./SummaryCard";
import { useI18n } from '@/i18n';
import formatCurrency from '@/utils/formatCurrency';
import { StockTransactionsReport } from "./StockTransactionsReport";
import { ProductTransactionsReport } from "./ProductTransactionsReport";
import ProductionTransactionsReport from "./ProductionTransactionsReport";
import ProfitLossReport from "./ProfitLossReport";
import StockLevelsReport from "./StockLevelsReport";

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
// Use shared currency formatter (SDG) from utils

export function ReportsTab({ reports, reportsLoading, features, start, end, setStart, setEnd }) {
  const hasReportsAccess = features?.[FEATURE_KEYS.REPORTS] !== false;
  const { t } = useI18n();

  if (!hasReportsAccess) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('reports.unavailable_title')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('reports.unavailable_message')}</p>
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
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('reports.no_data_title')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('reports.no_data_message')}</p>
      </div>
    );
  }

  const summary = reports.summary ?? {};
  const topProducts = reports.topProducts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-3">
        <label className="text-sm text-gray-600">{t('reports.start_label')}</label>
        <input
          type="date"
          value={String(start ?? "")}
          onChange={(e) => setStart(e.target.value)}
          className="rounded-md border border-gray-200 px-2 py-1 text-sm"
        />
        <label className="text-sm text-gray-600">{t('reports.end_label')}</label>
        <input
          type="date"
          value={String(end ?? "")}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded-md border border-gray-200 px-2 py-1 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title={t('reports.summary.revenue')}
          value={formatCurrency(summary.totalRevenue)}
          change={summary.revenueChange ?? "+0%"}
          positive={(summary.revenueChange ?? "").startsWith("+")}
        />
        <SummaryCard
          title={t('reports.summary.expenses')}
          value={formatCurrency(summary.totalCosts)}
          change={summary.costChange ?? "+0%"}
          positive={(summary.costChange ?? "").startsWith("-")}
        />
        <SummaryCard
          title={t('reports.summary.net_profit')}
          value={formatCurrency(summary.netProfit)}
          change={`${summary.profitMargin?.toFixed?.(1) ?? "0"}%`}
          positive={(summary.netProfit ?? 0) >= 0}
        />
        <StatBlock
          label={t('reports.summary.gross_margin')}
          value={`${summary.grossMargin?.toFixed?.(1) ?? "0"}%`}
          helpText={t('reports.summary.gross_margin_help')}
        />
      </div>

      {features?.[FEATURE_KEYS.REPORTS_PROFIT_LOSS] !== false && (
          <div>
            <ProfitLossReport reports={reports} />
          </div>
      )}

      {features?.[FEATURE_KEYS.REPORTS_STOCK_LEVELS] !== false && (
        <div>
          <StockLevelsReport />
        </div>
      )}

      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('reports.top_products.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('reports.top_products.description')}</p>
          </div>
        </div>

        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.top_products.no_data')}</p>
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
                    {product.total_sold ?? product.quantity ?? 0} {t('reports.sold')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(product.total_revenue ?? product.revenue ?? 0)}
                  </p>
                  {typeof product.margin === "number" && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('reports.margin_label', { value: product.margin.toFixed(1) })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {features?.[FEATURE_KEYS.REPORTS_STOCK_TRANSACTIONS] !== false && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('reports.stock_transactions')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('reports.stock_transactions_help')}</p>
            <StockTransactionsReport start={start} end={end} />
          </div>
        )}

        {features?.[FEATURE_KEYS.REPORTS_PRODUCT_TRANSACTIONS] !== false && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('reports.product_transactions')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('reports.product_transactions_help')}</p>
            <ProductTransactionsReport start={start} end={end} />
          </div>
        )}

        {features?.[FEATURE_KEYS.REPORTS_PRODUCTION_TRANSACTIONS] !== false && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('reports.production_transactions')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('reports.production_transactions_help')}</p>
            <ProductionTransactionsReport start={start} end={end} />
          </div>
        )}
      </div>
    </div>
  );
}
