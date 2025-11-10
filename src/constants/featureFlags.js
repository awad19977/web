export const FEATURE_KEYS = {
  DASHBOARD: 'dashboard:view',
  REPORTS: 'reports:view',
  STOCK: 'stock:manage',
  SALES: 'sales:manage',
  EXPENSES: 'expenses:manage',
  PRODUCTS: 'products:manage',
  USERS: 'users:manage',
  UNITS_VIEW: 'units:view',
  UNITS: 'units:manage',
};

export const FEATURE_METADATA = {
  [FEATURE_KEYS.DASHBOARD]: {
    label: 'Dashboard Overview',
    description: 'View the main dashboard and summary metrics.',
  },
  [FEATURE_KEYS.REPORTS]: {
    label: 'Reports',
    description: 'Access financial and operational reports.',
  },
  [FEATURE_KEYS.STOCK]: {
    label: 'Stock Management',
    description: 'Manage inventory items and stock purchases.',
  },
  [FEATURE_KEYS.SALES]: {
    label: 'Sales Management',
    description: 'Record sales and view sales history.',
  },
  [FEATURE_KEYS.EXPENSES]: {
    label: 'Expenses',
    description: 'Track expenses and manage cost entries.',
  },
  [FEATURE_KEYS.PRODUCTS]: {
    label: 'Products',
    description: 'Create and manage sellable products.',
  },
  [FEATURE_KEYS.USERS]: {
    label: 'User Administration',
    description: 'Manage users and their feature-level permissions.',
  },
  [FEATURE_KEYS.UNITS_VIEW]: {
    label: 'Unit Catalog (view)',
    description: 'Browse the shared stock unit catalog.',
  },
  [FEATURE_KEYS.UNITS]: {
    label: 'Unit Catalog',
    description: 'Manage the shared stock unit catalog.',
  },
};

export const DEFAULT_FEATURE_FLAGS = {
  [FEATURE_KEYS.DASHBOARD]: true,
  [FEATURE_KEYS.REPORTS]: true,
  [FEATURE_KEYS.STOCK]: true,
  [FEATURE_KEYS.SALES]: true,
  [FEATURE_KEYS.EXPENSES]: true,
  [FEATURE_KEYS.PRODUCTS]: true,
  [FEATURE_KEYS.USERS]: false,
  [FEATURE_KEYS.UNITS_VIEW]: true,
  [FEATURE_KEYS.UNITS]: false,
};

export const ALL_FEATURE_KEYS = Object.values(FEATURE_KEYS);

export const FEATURE_LIST = ALL_FEATURE_KEYS.map((key) => ({
  key,
  label: FEATURE_METADATA[key]?.label ?? key,
  description: FEATURE_METADATA[key]?.description ?? '',
}));
