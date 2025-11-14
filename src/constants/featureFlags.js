export const FEATURE_KEYS = {
  DASHBOARD: 'dashboard:view',
  REPORTS: 'reports:view',
  REPORTS_PROFIT_LOSS: 'reports:profit-loss',
  REPORTS_STOCK_TRANSACTIONS: 'reports:stock-transactions',
  REPORTS_PRODUCT_TRANSACTIONS: 'reports:product-transactions',
  REPORTS_STOCK_LEVELS: 'reports:stock-levels',
  REPORTS_PRODUCTION_TRANSACTIONS: 'reports:production-transactions',
  STOCK: 'stock:manage',
  STOCK_EDIT: 'stock:edit',
  STOCK_DELETE: 'stock:delete',
  STOCK_EXTRA_CONFIG: 'stock:extra-config',
  STOCK_ADJUST: 'stock:adjust',
  STOCK_ADJUST_APPROVE: 'stock:adjust:approve',
  SALES: 'sales:manage',
  EXPENSES: 'expenses:manage',
  PRODUCTS: 'products:manage',
  PRODUCTION: 'production:manage',
  PRODUCTION_EXTRA: 'production:extra',
  USERS: 'users:manage',
  UNITS_VIEW: 'units:view',
  UNITS: 'units:manage',
  PURCHASES: 'purchases:view',
  PURCHASES_CREATE: 'purchases:create',
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
  [FEATURE_KEYS.REPORTS_PROFIT_LOSS]: {
    label: 'Profit & Loss Report',
    description: 'View and print consolidated revenue minus expenses report.',
  },
  [FEATURE_KEYS.REPORTS_STOCK_TRANSACTIONS]: {
    label: 'Stock Transactions Report',
    description: 'View and print stock transactions report.',
  },
  [FEATURE_KEYS.REPORTS_PRODUCT_TRANSACTIONS]: {
    label: 'Product Transactions Report',
    description: 'View and print product transactions report.',
  },
  [FEATURE_KEYS.REPORTS_PRODUCTION_TRANSACTIONS]: {
    label: 'Production Transactions Report',
    description: 'View and print production transactions report.',
  },
  [FEATURE_KEYS.REPORTS_STOCK_LEVELS]: {
    label: 'Stock Levels Report',
    description: 'View and print current stock levels (quantities > 0).',
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
  [FEATURE_KEYS.STOCK_EXTRA_CONFIG]: {
    label: 'Extra Production Limits',
    description: 'Configure extra-production allowances for stock items.',
  },
  [FEATURE_KEYS.STOCK_ADJUST]: {
    label: 'Request Stock Adjustments',
    description: 'Submit manual stock quantity adjustment requests.',
  },
  [FEATURE_KEYS.STOCK_ADJUST_APPROVE]: {
    label: 'Approve Stock Adjustments',
    description: 'Review and approve or reject manual stock adjustments.',
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
  [FEATURE_KEYS.PRODUCTION]: {
    label: 'Production Orders',
    description: 'Plan and track product production batches.',
  },
  [FEATURE_KEYS.PRODUCTION_EXTRA]: {
    label: 'Production Extras',
    description: 'Add extra stock to production orders beyond recipes.',
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
  [FEATURE_KEYS.PURCHASES]: {
    label: 'Purchases (view)',
    description: 'View stock purchase history.',
  },
  [FEATURE_KEYS.PURCHASES_CREATE]: {
    label: 'Create Purchases',
    description: 'Create new stock purchase records.',
  },
  [FEATURE_KEYS.REPORTS_PROFIT_LOSS]: {
    label: 'Profit & Loss Report',
    description: 'View the Profit & Loss report.',
  },
  [FEATURE_KEYS.REPORTS_STOCK_TRANSACTIONS]: {
    label: 'Stock Transactions Report',
    description: 'Access stock transactions reporting.',
  },
  [FEATURE_KEYS.REPORTS_PRODUCT_TRANSACTIONS]: {
    label: 'Product Transactions Report',
    description: 'Access product transactions reporting.',
  },
  [FEATURE_KEYS.REPORTS_PRODUCTION_TRANSACTIONS]: {
    label: 'Production Transactions Report',
    description: 'Access production transactions reporting.',
  },
  [FEATURE_KEYS.REPORTS_STOCK_LEVELS]: {
    label: 'Stock Levels Report',
    description: 'Access current stock levels reporting.',
  },
};

export const DEFAULT_FEATURE_FLAGS = {
  [FEATURE_KEYS.DASHBOARD]: true,
  [FEATURE_KEYS.REPORTS]: true,
  [FEATURE_KEYS.STOCK]: true,
  [FEATURE_KEYS.STOCK_EDIT]: false,
  [FEATURE_KEYS.STOCK_DELETE]: false,
  [FEATURE_KEYS.STOCK_EXTRA_CONFIG]: false,
  [FEATURE_KEYS.STOCK_ADJUST]: false,
  [FEATURE_KEYS.STOCK_ADJUST_APPROVE]: false,
  [FEATURE_KEYS.SALES]: true,
  [FEATURE_KEYS.EXPENSES]: true,
  [FEATURE_KEYS.PRODUCTS]: true,
  [FEATURE_KEYS.PRODUCTION]: true,
  [FEATURE_KEYS.PRODUCTION_EXTRA]: false,
  [FEATURE_KEYS.USERS]: false,
  [FEATURE_KEYS.UNITS_VIEW]: true,
  [FEATURE_KEYS.UNITS]: false,
  [FEATURE_KEYS.PURCHASES]: true,
  [FEATURE_KEYS.PURCHASES_CREATE]: false,
  [FEATURE_KEYS.REPORTS_PROFIT_LOSS]: true,
  [FEATURE_KEYS.REPORTS_STOCK_TRANSACTIONS]: true,
  [FEATURE_KEYS.REPORTS_PRODUCT_TRANSACTIONS]: true,
  [FEATURE_KEYS.REPORTS_PRODUCTION_TRANSACTIONS]: true,
  [FEATURE_KEYS.REPORTS_STOCK_LEVELS]: true,
};

export const ALL_FEATURE_KEYS = Object.values(FEATURE_KEYS);

export const FEATURE_LIST = ALL_FEATURE_KEYS.map((key) => ({
  key,
  label: FEATURE_METADATA[key]?.label ?? key,
  description: FEATURE_METADATA[key]?.description ?? '',
}));
