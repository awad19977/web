"use client";

import { useState } from "react";
import { useDashboardReports } from "@/hooks/useDashboardReports";
import { DashboardTabs } from "./Dashboard/DashboardTabs";
import { OverviewTab } from "./Dashboard/OverviewTab";
import { StockManagementTab } from "./Dashboard/StockManagementTab";
import { SalesManagementTab } from "./Dashboard/SalesManagementTab";
import { ExpenseManagementTab } from "./Dashboard/ExpenseManagementTab";

export default function Dashboard({
  activeTab: propActiveTab,
  onTabChange: propOnTabChange,
}) {
  // Use prop values if provided, otherwise use local state
  const [localActiveTab, setLocalActiveTab] = useState("overview");
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propOnTabChange || setLocalActiveTab;

  const { data: reports, isLoading: reportsLoading } = useDashboardReports();

  return (
    <div className="p-4 lg:p-6">
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && (
        <OverviewTab
          reports={reports}
          reportsLoading={reportsLoading}
          onTabChange={setActiveTab}
        />
      )}

      {activeTab === "stock" && <StockManagementTab />}

      {activeTab === "sales" && <SalesManagementTab />}

      {activeTab === "expenses" && <ExpenseManagementTab />}

      {activeTab === "reports" && (
        <ReportsTab reports={reports} reportsLoading={reportsLoading} />
      )}

      {activeTab === "production" && <ProductionTab />}
    </div>
  );
}

// Additional placeholder tabs
function ReportsTab({ reports, reportsLoading }) {
  if (reportsLoading) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        Financial Reports
      </h2>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Revenue
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${reports?.summary?.totalRevenue?.toLocaleString() || "0"}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Expenses
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${reports?.summary?.totalCosts?.toLocaleString() || "0"}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Net Profit
          </h3>
          <p
            className={`text-2xl font-bold ${
              (reports?.summary?.netProfit || 0) >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            ${reports?.summary?.netProfit?.toLocaleString() || "0"}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Profit Margin
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {reports?.summary?.profitMargin?.toFixed(1) || "0"}%
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Top Products
        </h3>
        {reports?.topProducts?.length > 0 ? (
          <div className="space-y-3">
            {reports.topProducts.map((product, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {product.name}
                </span>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white">
                    ${product.total_revenue}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {product.total_sold} sold
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No sales data available
          </p>
        )}
      </div>
    </div>
  );
}

function ProductionTab() {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Production Management
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        Production management features are coming soon. This will include
        production orders, inventory tracking, and manufacturing workflows.
      </p>
    </div>
  );
}
