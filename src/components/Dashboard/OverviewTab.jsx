import { QuickActions } from "./QuickActions";
import { SummaryCard } from "./SummaryCard";

export function OverviewTab({ reports, reportsLoading, onTabChange }) {
  return (
    <div className="space-y-6">
      <QuickActions onActionClick={onTabChange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Revenue"
          value={`$${reports?.summary?.totalRevenue?.toLocaleString() || "0"}`}
          change="+12.5%"
          positive={true}
          loading={reportsLoading}
        />
        <SummaryCard
          title="Net Profit"
          value={`$${reports?.summary?.netProfit?.toLocaleString() || "0"}`}
          change={`${reports?.summary?.profitMargin?.toFixed(1) || "0"}%`}
          positive={reports?.summary?.netProfit >= 0}
          loading={reportsLoading}
        />
        <SummaryCard
          title="Stock Value"
          value={`$${reports?.summary?.stockValue?.toLocaleString() || "0"}`}
          change="+5.2%"
          positive={true}
          loading={reportsLoading}
        />
        <SummaryCard
          title="Total Expenses"
          value={`$${reports?.summary?.totalCosts?.toLocaleString() || "0"}`}
          change="-3.1%"
          positive={false}
          loading={reportsLoading}
        />
      </div>
    </div>
  );
}
