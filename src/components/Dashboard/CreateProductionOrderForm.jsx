import { useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

const isPositiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
};

const quantityFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const computeRecipeBreakdown = (product, quantity) => {
  if (!product || !Array.isArray(product.recipes) || product.recipes.length === 0) {
    return { ingredients: [], estimatedCost: 0 };
  }

  const plannedQuantity = Number(quantity);
  if (!Number.isFinite(plannedQuantity) || plannedQuantity <= 0) {
    return { ingredients: [], estimatedCost: 0 };
  }

  const ingredients = product.recipes.map((recipe) => {
    const perUnit = Number(recipe.quantity ?? recipe.quantity_needed ?? 0);
    const total = perUnit * plannedQuantity;
    const cost = Number(recipe.stock_unit_cost ?? 0) * total;

    return {
      id: recipe.id ?? `${recipe.stock_id}-${perUnit}`,
      name: recipe.stock_name ?? recipe.stockId ?? recipe.stock_id ?? "Ingredient",
      perUnit,
      total,
      unitCost: Number(recipe.stock_unit_cost ?? 0),
      cost,
    };
  });

  const estimatedCost = ingredients.reduce((sum, ingredient) => sum + ingredient.cost, 0);

  return { ingredients, estimatedCost };
};

export function CreateProductionOrderForm({
  products = [],
  productsLoading = false,
  onSubmit,
  onClose,
  isSubmitting = false,
  submitError = null,
}) {
  const [formState, setFormState] = useState({
    productId: "",
    quantity: "",
  });
  const [validationError, setValidationError] = useState(null);

  const selectedProduct = useMemo(() => {
    if (!formState.productId) return null;
    return products.find((product) => String(product.id) === String(formState.productId)) ?? null;
  }, [formState.productId, products]);

  const { ingredients, estimatedCost } = useMemo(
    () => computeRecipeBreakdown(selectedProduct, formState.quantity),
    [selectedProduct, formState.quantity]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formState.productId) {
      setValidationError("Please choose a product to produce");
      return;
    }

    if (!isPositiveNumber(formState.quantity)) {
      setValidationError("Enter a quantity greater than zero");
      return;
    }

    setValidationError(null);

    onSubmit?.({
      product_id: Number(formState.productId),
      quantity_to_produce: Number(formState.quantity),
    });
  };

  return (
    <div className="bg-white shadow-lg rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Create Production Order</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
        {productsLoading ? (
          <div className="flex items-center text-gray-600">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading products…
          </div>
        ) : (
          <div>
            <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
              Product
            </label>
            <select
              id="productId"
              name="productId"
              value={formState.productId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            >
              <option value="">Select a product…</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
            Quantity to produce
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            value={formState.quantity}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter planned quantity"
            disabled={isSubmitting}
            required
          />
        </div>

        {selectedProduct && selectedProduct.recipes && selectedProduct.recipes.length === 0 && (
          <div className="flex items-start rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
            <AlertTriangle className="mr-2 mt-0.5 h-4 w-4" />
            This product does not have a recipe yet. Add one before starting production.
          </div>
        )}

        {ingredients.length > 0 && (
          <div className="rounded-lg border border-gray-200">
            <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
              Ingredients needed
            </div>
            <ul className="divide-y divide-gray-200">
              {ingredients.map((ingredient) => (
                <li key={ingredient.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{ingredient.name}</p>
                    <p className="text-gray-600">
                      {quantityFormatter.format(ingredient.perUnit)} per unit × {quantityFormatter.format(Number(formState.quantity) || 0)} units
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Total: {quantityFormatter.format(ingredient.total)}</p>
                    <p className="text-gray-500">
                      Cost: {currencyFormatter.format(ingredient.cost)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-900">
              <span>Estimated production cost</span>
              <span>{currencyFormatter.format(estimatedCost)}</span>
            </div>
          </div>
        )}

        {validationError && (
          <div className="flex items-start rounded-md bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mr-2 mt-0.5 h-4 w-4" />
            {validationError}
          </div>
        )}

        {submitError && (
          <div className="flex items-start rounded-md bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mr-2 mt-0.5 h-4 w-4" />
            {submitError}
          </div>
        )}

        <div className="flex justify-end space-x-2 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create order"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
