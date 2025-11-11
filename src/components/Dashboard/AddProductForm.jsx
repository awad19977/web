import { useState } from "react";
import { AlertCircle } from "lucide-react";

export function AddProductForm({ onClose, onSubmit, loading, error }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selling_price: "",
    current_stock: "",
  });
  const [validationError, setValidationError] = useState(null);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    if (!name) {
      setValidationError("Product name is required");
      return;
    }

    const sellingPrice = Number(formData.selling_price);
    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      setValidationError("Selling price must be a positive number");
      return;
    }

    let currentStockValue = Number(formData.current_stock);
    if (formData.current_stock !== "" && (!Number.isFinite(currentStockValue) || currentStockValue < 0)) {
      setValidationError("Current stock must be zero or greater");
      return;
    }

    currentStockValue = Number.isFinite(currentStockValue) && currentStockValue >= 0
      ? currentStockValue
      : 0;

    setValidationError(null);

    onSubmit({
      name,
      description: formData.description.trim() || null,
      selling_price: sellingPrice,
      current_stock: currentStockValue,
    });
  };

  const message = validationError || error;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-[#1E1E1E]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Product</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Define a new product and optional starting stock.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleChange("name")}
              required
              placeholder="Example: Sourdough Loaf"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-[#18B84E] focus:ring-2 focus:ring-[#18B84E] dark:border-gray-600 dark:bg-[#262626] dark:text-white dark:focus:border-[#16A249] dark:focus:ring-[#16A249]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={handleChange("description")}
              rows={3}
              placeholder="Optional notes or specs"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-[#18B84E] focus:ring-2 focus:ring-[#18B84E] dark:border-gray-600 dark:bg-[#262626] dark:text-white dark:focus:border-[#16A249] dark:focus:ring-[#16A249]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Selling Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.selling_price}
                onChange={handleChange("selling_price")}
                placeholder="e.g. 12.50"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-[#18B84E] focus:ring-2 focus:ring-[#18B84E] dark:border-gray-600 dark:bg-[#262626] dark:text-white dark:focus:border-[#16A249] dark:focus:ring-[#16A249]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Stock
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.current_stock}
                onChange={handleChange("current_stock")}
                placeholder="Defaults to 0"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-[#18B84E] focus:ring-2 focus:ring-[#18B84E] dark:border-gray-600 dark:bg-[#262626] dark:text-white dark:focus:border-[#16A249] dark:focus:ring-[#16A249]"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Use decimals if you track partial units.
              </p>
            </div>
          </div>

          {message ? (
            <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-[#18B84E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16A249] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#16A249] dark:hover:bg-[#14D45D]"
            >
              {loading ? "Saving..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
