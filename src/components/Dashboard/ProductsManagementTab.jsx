import { useState, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { useProductManagement } from "@/hooks/useProductManagement";
import { useStockCatalog } from "@/hooks/useStockCatalog";
import { ProductTable } from "./ProductTable";
import { AddProductForm } from "./AddProductForm";
import { ManageRecipeForm } from "./ManageRecipeForm";
import { useI18n } from '@/i18n';

export function ProductsManagementTab() {
  const { t } = useI18n();
  const L = useCallback(
    (key, fallback, params) => {
      try {
        const value = t(key, params);
        if (!value || value === key) return fallback;
        return value;
      } catch (err) {
        return fallback;
      }
    },
    [t]
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [formError, setFormError] = useState(null);
  const [activeRecipeProduct, setActiveRecipeProduct] = useState(null);
  const [recipeError, setRecipeError] = useState(null);

  const {
    products,
    isLoading,
    isFetching,
    isError,
    error,
    createProduct,
    createProductLoading,
    updateRecipe,
    updateRecipeLoading,
  } = useProductManagement();

  const {
    stock,
    isLoading: stockLoading,
    isFetching: stockFetching,
    isError: stockLoadFailed,
    error: stockLoadError,
    refetch: refetchStock,
  } = useStockCatalog();

  const stockErrorMessage = stockLoadFailed
    ? stockLoadError?.message || L('products.stock_load_error', 'Unable to load stock catalog.')
    : null;

  const handleAddProduct = (payload) => {
    setFormError(null);
    createProduct(payload, {
      onSuccess: (product) => {
        setShowAddForm(false);
        if (product?.name) {
          const initialStock = Number(product.current_stock ?? 0);
          const stockMessage = initialStock > 0
            ? ` (${L('products.starting_stock', '(starting stock: {count})', { count: initialStock.toLocaleString() })})`
            : "";
          setFeedback({
            type: "success",
            message: L('products.created_with_stock', 'Created {name}{stockMessage}.', { name: product.name, stockMessage }),
          });
        } else {
          setFeedback({ type: "success", message: L('products.created_simple', 'Product created.') });
        }
      },
        onError: (mutationError) => {
        setFormError(mutationError?.message || L('products.create_failed', 'Unable to create product right now.'));
      },
    });
  };

  const handleOpenModal = () => {
    setFormError(null);
    setShowAddForm(true);
  };

  const handleCloseModal = () => {
    setFormError(null);
    setShowAddForm(false);
  };

  const handleOpenRecipeModal = (product) => {
    setRecipeError(null);
    setActiveRecipeProduct(product);
  };

  const handleCloseRecipeModal = () => {
    setRecipeError(null);
    setActiveRecipeProduct(null);
  };

  const handleUpdateRecipe = (items) => {
    if (!activeRecipeProduct) return;
    const targetProduct = activeRecipeProduct;
    setRecipeError(null);

    updateRecipe(
      { productId: targetProduct.id, items },
      {
        onSuccess: () => {
          const cleared = items.length === 0;
          setFeedback({
            type: "success",
            message: cleared
              ? L('products.recipe_cleared', "Cleared {name}'s recipe.", { name: targetProduct.name })
              : L('products.recipe_updated', "Updated {name}'s recipe.", { name: targetProduct.name }),
          });
          setActiveRecipeProduct(null);
        },
        onError: (mutationError) => {
          setRecipeError(mutationError?.message || L('products.update_recipe_failed', 'Unable to update recipe right now.'));
        },
      },
    );
  };

  const showTable = isLoading || isFetching || products.length > 0;
  const recipeProduct = activeRecipeProduct
    ? products.find((product) => product.id === activeRecipeProduct.id) ?? activeRecipeProduct
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{L('products.title', 'Products')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {L('products.description', 'Manage your catalog and keep product recipes aligned with inventory.')}
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 rounded-lg bg-[#18B84E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16A249] dark:bg-[#16A249] dark:hover:bg-[#14D45D]"
        >
          <Plus className="h-4 w-4" />
          {L('products.add_product', 'Add Product')}
        </button>
      </div>

      {feedback ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4" />
          <div className="flex-1">
            <p className="font-medium">{feedback.message}</p>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 hover:underline dark:text-emerald-200"
            >
              {L('dismiss', 'Dismiss')}
            </button>
          </div>
        </div>
      ) : null}

      {isError ? (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div>
            <h3 className="font-semibold">{L('products.unable_load', 'Unable to load products')}</h3>
            <p className="text-sm opacity-90">
              {error?.message || L('products.unable_load_message', 'Refresh the page or verify the /api/products endpoint.')}
            </p>
          </div>
        </div>
      ) : showTable ? (
        <ProductTable
          products={products}
          loading={isLoading && !isFetching}
          onManageRecipe={handleOpenRecipeModal}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-[#1E1E1E]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {L('products.no_products_title', 'No products defined yet')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {L('products.no_products_message', 'Create your first product to begin tracking the catalog and revenue.')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#18B84E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16A249] dark:bg-[#16A249] dark:hover:bg-[#14D45D]"
          >
            <Plus className="h-4 w-4" />
            {L('products.add_product_verbose', 'Add a product')}
          </button>
        </div>
      )}

      {showAddForm ? (
        <AddProductForm
          onClose={handleCloseModal}
          onSubmit={handleAddProduct}
          loading={createProductLoading}
          error={formError}
        />
      ) : null}

      {recipeProduct ? (
        <ManageRecipeForm
          product={recipeProduct}
          stock={stock}
          stockLoading={stockLoading || stockFetching}
          stockError={stockErrorMessage}
          onRefreshStock={refetchStock}
          onClose={handleCloseRecipeModal}
          onSubmit={handleUpdateRecipe}
          saving={updateRecipeLoading}
          error={recipeError}
        />
      ) : null}
    </div>
  );
}
