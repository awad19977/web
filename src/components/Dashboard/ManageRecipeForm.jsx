import { useEffect, useMemo, useState, useCallback } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useI18n } from '@/i18n';

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const createEmptyRow = () => ({
  key:
    typeof crypto !== "undefined" && crypto?.randomUUID
      ? crypto.randomUUID()
      : `row-${Math.random().toString(36).slice(2)}`,
  stockId: "",
  quantity: "",
});

const buildInitialRows = (product) => {
  if (!product || !Array.isArray(product.recipes) || product.recipes.length === 0) {
    return [createEmptyRow()];
  }

  return product.recipes.map((recipe) => ({
    key: recipe.id ?? createEmptyRow().key,
    stockId:
      recipe.stock_id !== undefined && recipe.stock_id !== null
        ? String(recipe.stock_id)
        : "",
    quantity:
      recipe.quantity !== undefined && recipe.quantity !== null
        ? String(recipe.quantity)
        : "",
  }));
};

export function ManageRecipeForm({
  product,
  stock,
  stockLoading,
  stockError,
  onRefreshStock,
  onClose,
  onSubmit,
  saving,
  error,
}) {
  const [rows, setRows] = useState(buildInitialRows(product));
  const [validationError, setValidationError] = useState(null);
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

  useEffect(() => {
    setRows(buildInitialRows(product));
    setValidationError(null);
  }, [product?.id]);

  const disableAddButton = stockLoading || (Array.isArray(stock) && stock.length === 0);

  const usedStockIds = useMemo(() => new Set(rows.map((row) => row.stockId).filter(Boolean)), [rows]);

  const totalCost = useMemo(() => {
    if (!Array.isArray(stock) || stock.length === 0) {
      return 0;
    }

    return rows.reduce((sum, row) => {
      const qty = Number(row.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return sum;
      }
      const stockItem = stock.find((item) => String(item.id) === row.stockId);
      if (!stockItem) {
        return sum;
      }
      const unitCost = Number(stockItem.unit_cost ?? 0);
      if (!Number.isFinite(unitCost) || unitCost <= 0) {
        return sum;
      }
      return sum + qty * unitCost;
    }, 0);
  }, [rows, stock]);

  const handleChange = (rowKey, field) => (event) => {
    const value = event.target.value;
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.key === rowKey
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  };

  const handleRemoveRow = (rowKey) => {
    setRows((currentRows) => {
      const remaining = currentRows.filter((row) => row.key !== rowKey);
      return remaining.length > 0 ? remaining : [createEmptyRow()];
    });
  };

  const handleAddRow = () => {
    setRows((currentRows) => [...currentRows, createEmptyRow()]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const sanitized = [];
    const localSeen = new Set();

    for (const row of rows) {
      const hasStock = row.stockId !== "";
      const hasQuantity = row.quantity !== "";

      if (!hasStock && !hasQuantity) {
        continue;
      }

      if (!hasStock || !hasQuantity) {
        setValidationError(L('recipe.validation_complete_rows', 'Complete or remove partially filled recipe rows.'));
        return;
      }

      const stockId = Number(row.stockId);
      const quantity = Number(row.quantity);

      if (!Number.isInteger(stockId) || stockId <= 0) {
        setValidationError(L('recipe.validation_select_stock', 'Select a valid stock item for each ingredient.'));
        return;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        setValidationError(L('recipe.validation_positive_quantity', 'Ingredient quantities must be positive numbers.'));
        return;
      }

      if (localSeen.has(stockId)) {
        setValidationError(L('recipe.validation_unique_stock', 'Each stock item can only appear once in a recipe.'));
        return;
      }

      localSeen.add(stockId);
      sanitized.push({ stock_id: stockId, quantity });
    }

    setValidationError(null);
    onSubmit(sanitized);
  };

  const message = validationError || error;
  const stockUnavailable = !stockLoading && (!Array.isArray(stock) || stock.length === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl dark:bg-[#1E1E1E] max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('recipe.title')}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {t('recipe.description', { name: product?.name })}
            </p>
          </div>
            <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t('production.form.close')}
          </button>
        </div>

        {stockError ? (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p>{stockError}</p>
              {onRefreshStock ? (
                <button
                  type="button"
                  onClick={() => onRefreshStock()}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-rose-700 hover:underline dark:text-rose-200"
                >
                  <RefreshCw className="h-3 w-3" /> {t('recipe.retry')}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="space-y-3">
            {rows.map((row, index) => {
              const selectedStock = Array.isArray(stock)
                ? stock.find((item) => String(item.id) === row.stockId)
                : null;
              const helperText = selectedStock
                ? `${quantityFormatter.format(Number(selectedStock.current_quantity ?? 0))} in stock • ${currencyFormatter.format(Number(selectedStock.unit_cost ?? 0))} per ${selectedStock.unit ?? "unit"}`
                : null;

              return (
                <div key={row.key} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-700 dark:bg-[#262626]">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto]">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('recipe.ingredient_label')}
                      </label>
                      <select
                        value={row.stockId}
                        onChange={handleChange(row.key, "stockId")}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#18B84E] focus:ring-2 focus:ring-[#18B84E] disabled:opacity-60 dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-white dark:focus:border-[#16A249] dark:focus:ring-[#16A249]"
                        disabled={stockLoading}
                      >
                        <option value="">{stockLoading ? t('recipe.loading_stock') : t('recipe.select_stock')}</option>
                        {Array.isArray(stock)
                          ? stock.map((item) => (
                              <option
                                key={item.id}
                                value={String(item.id)}
                                disabled={row.stockId !== String(item.id) && usedStockIds.has(String(item.id))}
                              >
                                {item.name}
                              </option>
                            ))
                          : null}
                      </select>
                      {helperText ? (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('recipe.helper', { current: quantityFormatter.format(Number(selectedStock.current_quantity ?? 0)), cost: currencyFormatter.format(Number(selectedStock.unit_cost ?? 0)), unit: selectedStock.unit ?? t('recipe.unit') })}</p>
                      ) : null}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('recipe.quantity_needed')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.quantity}
                        onChange={handleChange(row.key, "quantity")}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#18B84E] focus:ring-2 focus:ring-[#18B84E] dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-white dark:focus:border-[#16A249] dark:focus:ring-[#16A249]"
                      />
                    </div>
                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.key)}
                        className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('recipe.remove')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
              <button
              type="button"
              onClick={handleAddRow}
              disabled={disableAddButton}
              className="inline-flex items-center gap-2 rounded-md border border-dashed border-gray-400 px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#18B84E] hover:text-[#18B84E] disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:border-[#16A249] dark:hover:text-[#16A249]"
            >
              <Plus className="h-4 w-4" />
              {t('recipe.add_ingredient')}
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('recipe.estimated_batch_cost')}: <span className="font-semibold text-gray-900 dark:text-gray-100">{currencyFormatter.format(totalCost)}</span>
            </div>
          </div>

          {stockUnavailable ? (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-200">
              {t('recipe.no_stock_available')}
            </div>
          ) : null}

          {message ? (
            <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t('production.form.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-[#18B84E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16A249] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#16A249] dark:hover:bg-[#14D45D]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('recipe.saving')}
                </>
              ) : (
                t('recipe.save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
