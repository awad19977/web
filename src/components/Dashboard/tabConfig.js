import { FEATURE_KEYS } from "@/constants/featureFlags";

export const DASHBOARD_TABS = [
  { id: "overview", label: "Overview", feature: FEATURE_KEYS.DASHBOARD },
  { id: "stock", label: "Stock Management", feature: FEATURE_KEYS.STOCK },
  { id: "units", label: "Unit Catalog", feature: FEATURE_KEYS.UNITS_VIEW },
  { id: "sales", label: "Sales", feature: FEATURE_KEYS.SALES },
  { id: "reports", label: "Reports", feature: FEATURE_KEYS.REPORTS },
  { id: "expenses", label: "Expenses", feature: FEATURE_KEYS.EXPENSES },
  { id: "users", label: "User Management", feature: FEATURE_KEYS.USERS },
];
