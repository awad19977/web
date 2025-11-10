export const FEATURE_KEYS = {
  DASHBOARD: 'dashboard:view',
  REPORTS: 'reports:view',
  STOCK: 'stock:manage',
  STOCK_EDIT: 'stock:edit',
  STOCK_DELETE: 'stock:delete',
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
  [FEATURE_KEYS.STOCK_EDIT]: {
    label: 'Edit Stock Items',
    description: 'Edit existing stock records and their unit mappings.',
  },
  [FEATURE_KEYS.STOCK_DELETE]: {
    label: 'Delete Stock Items',
    description: 'Remove stock records from the catalog.',
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
  [FEATURE_KEYS.STOCK_EDIT]: false,
  [FEATURE_KEYS.STOCK_DELETE]: false,
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
