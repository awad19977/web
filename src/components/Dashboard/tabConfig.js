import { FEATURE_KEYS } from "@/constants/featureFlags";

export const DASHBOARD_TABS = [
  { id: "overview", labelKey: "tabs.overview", feature: FEATURE_KEYS.DASHBOARD },
  { id: "stock", labelKey: "tabs.stock", feature: FEATURE_KEYS.STOCK },
  { id: "purchases", labelKey: "tabs.purchases", feature: FEATURE_KEYS.PURCHASES },
  { id: "products", labelKey: "tabs.products", feature: FEATURE_KEYS.PRODUCTS },
  { id: "production", labelKey: "tabs.production", feature: FEATURE_KEYS.PRODUCTION },
  { id: "units", labelKey: "tabs.units", feature: FEATURE_KEYS.UNITS_VIEW },
  { id: "sales", labelKey: "tabs.sales", feature: FEATURE_KEYS.SALES },
  { id: "reports", labelKey: "tabs.reports", feature: FEATURE_KEYS.REPORTS },
  { id: "expenses", labelKey: "tabs.expenses", feature: FEATURE_KEYS.EXPENSES },
  { id: "users", labelKey: "tabs.users", feature: FEATURE_KEYS.USERS },
];
