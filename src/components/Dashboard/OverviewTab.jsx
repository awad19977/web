import { QuickActions } from "./QuickActions";
import { SummaryCard } from "./SummaryCard";
import { FEATURE_KEYS } from "@/constants/featureFlags";
import { useI18n } from '@/i18n';

export function OverviewTab({ reports, reportsLoading, onTabChange, features = {} }) {
  const hasReportsAccess = features[FEATURE_KEYS.REPORTS] !== false;
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <QuickActions onActionClick={onTabChange} features={features} />

      {!hasReportsAccess ? (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {t('overview.reports_access_required')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('overview.reports_access_message')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title={t('overview.total_revenue')}
            value={`$${reports?.summary?.totalRevenue?.toLocaleString() || "0"}`}
            change="+12.5%"
            positive={true}
            loading={reportsLoading}
          />
          <SummaryCard
            title={t('overview.net_profit')}
            value={`$${reports?.summary?.netProfit?.toLocaleString() || "0"}`}
            change={`${reports?.summary?.profitMargin?.toFixed(1) || "0"}%`}
            positive={reports?.summary?.netProfit >= 0}
            loading={reportsLoading}
          />
          <SummaryCard
            title={t('overview.stock_value')}
            value={`$${reports?.summary?.stockValue?.toLocaleString() || "0"}`}
            change="+5.2%"
            positive={true}
            loading={reportsLoading}
          />
          <SummaryCard
            title={t('overview.total_expenses')}
            value={`$${reports?.summary?.totalCosts?.toLocaleString() || "0"}`}
            change="-3.1%"
            positive={false}
            loading={reportsLoading}
          />
        </div>
      )}

    </div>
  );
}
