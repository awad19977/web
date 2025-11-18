import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@/i18n";
import { useSalesManagement } from "@/hooks/useSalesManagement";
import { SalesTable } from "./SalesTable";
import { AddSaleForm } from "./AddSaleForm";

export function SalesManagementTab() {
  const [showAddForm, setShowAddForm] = useState(false);
  const { t } = useI18n();
  const L = useCallback(
    (key, fallback) => {
      try {
        const value = t(key);
        if (!value || value === key) {
          return fallback;
        }
        return value;
      } catch (err) {
        return fallback;
      }
    },
    [t]
  );

  const {
    products,
    productsLoading,
    productsError,
    sales,
    salesLoading,
    salesError,
    recordSale,
    recordSaleLoading,
  } = useSalesManagement();

  const handleAddSale = (data) => {
    recordSale(data, {
      onSuccess: () => setShowAddForm(false),
    });
  };

  const isDisabled = productsLoading || productsError || products?.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('sales_management.title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {L('sales_management.description', 'Record product sales and track revenue in real time.')}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={isDisabled}
          aria-label={L('sales_management.record_sale', 'Record Sale')}
          title={L('sales_management.record_sale_tooltip', 'Record a new sale')}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#18B84E] dark:bg-[#16A249] text-white rounded-lg hover:bg-[#16A249] dark:hover:bg-[#14D45D] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {L('sales_management.record_sale', 'Record Sale')}
        </button>
      </div>

      {productsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {L(
            'sales_management.products_load_failed',
            "We couldn't load products. Refresh or check the `/api/products` endpoint before recording sales."
          )}
        </div>
      ) : null}

      <SalesTable
        sales={sales}
        loading={salesLoading}
        error={salesError}
      />

          {products?.length === 0 && !productsLoading && !productsError ? (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-200">
            {L(
              'sales_management.no_products',
              'No products found. Add products via the API or seed the database before recording sales.'
            )}
        </div>
      ) : null}

      {showAddForm && (
        <AddSaleForm
          products={products}
          productsLoading={productsLoading}
          productsError={productsError}
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddSale}
          loading={recordSaleLoading}
        />
      )}
    </div>
  );
}
