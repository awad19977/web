"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboardReports } from "@/hooks/useDashboardReports";
import { DashboardTabs } from "./Dashboard/DashboardTabs";
import { OverviewTab } from "./Dashboard/OverviewTab";
import { StockManagementTab } from "./Dashboard/StockManagementTab";
import { SalesManagementTab } from "./Dashboard/SalesManagementTab";
import { ExpenseManagementTab } from "./Dashboard/ExpenseManagementTab";
import { UserManagementTab } from "./Dashboard/UserManagementTab";
import { ReportsTab } from "./Dashboard/ReportsTab";
import { UnitsManagementTab } from "./Dashboard/UnitsManagementTab";
import useUser from "@/utils/useUser";
import { FEATURE_KEYS } from "@/constants/featureFlags";
import { DASHBOARD_TABS } from "./Dashboard/tabConfig";

export default function Dashboard({
  activeTab: propActiveTab,
  onTabChange: propOnTabChange,
}) {
  const { user } = useUser();
  const featureFlags = user?.features ?? {};

  const canManageUnits = featureFlags[FEATURE_KEYS.UNITS] !== false;
  const canViewUnits =
    canManageUnits || featureFlags[FEATURE_KEYS.UNITS_VIEW] !== false;

  const availableTabs = useMemo(() => {
    return DASHBOARD_TABS.filter((tab) => {
      if (tab.id === "units") {
        return canViewUnits;
      }
      return featureFlags[tab.feature] !== false;
    });
  }, [canViewUnits, featureFlags]);

  // Use prop values if provided, otherwise use local state
  const defaultTab = availableTabs[0]?.id ?? "overview";
  const [localActiveTab, setLocalActiveTab] = useState(defaultTab);
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propOnTabChange || setLocalActiveTab;

  useEffect(() => {
    if (!availableTabs.length) return;
    if (!availableTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab, setActiveTab]);

  const hasReportsAccess = featureFlags[FEATURE_KEYS.REPORTS] !== false;
  const { data: reports, isLoading: reportsLoading } = useDashboardReports({
    enabled: hasReportsAccess,
  });

  if (!availableTabs.length) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No features available
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your account does not currently have access to any dashboard areas. Contact an administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={availableTabs} />

      {activeTab === "overview" && (
        <OverviewTab
          reports={reports}
          reportsLoading={reportsLoading}
          onTabChange={setActiveTab}
          features={featureFlags}
        />
      )}

      {activeTab === "stock" && featureFlags[FEATURE_KEYS.STOCK] !== false && (
        <StockManagementTab />
      )}

      {activeTab === "units" && canViewUnits && (
        <UnitsManagementTab canManageUnits={canManageUnits} />
      )}

      {activeTab === "sales" && featureFlags[FEATURE_KEYS.SALES] !== false && (
        <SalesManagementTab />
      )}

      {activeTab === "reports" && featureFlags[FEATURE_KEYS.REPORTS] !== false && (
        <ReportsTab reports={reports} reportsLoading={reportsLoading} features={featureFlags} />
      )}

      {activeTab === "expenses" && featureFlags[FEATURE_KEYS.EXPENSES] !== false && (
        <ExpenseManagementTab />
      )}

      {activeTab === "users" && featureFlags[FEATURE_KEYS.USERS] !== false && (
        <UserManagementTab />
      )}
    </div>
  );
}

// Legacy placeholder components retained for future expansion can be reintroduced if needed.
