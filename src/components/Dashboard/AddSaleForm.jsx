import { useMemo, useState } from "react";
import { useI18n } from '@/i18n';
import formatCurrency from '@/utils/formatCurrency';

export function AddSaleForm({
  products,
  productsLoading,
  productsError,
  onClose,
  onSubmit,
  loading,
}) {
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    unit_price: "",
    customer_name: "",
    notes: "",
    damaged_quantity: "",
    damage_reason: "",
  });
  const [formError, setFormError] = useState(null);
  const { t } = useI18n();
  const L = (key, fallback) => {
    try {
      const v = t(key);
      if (!v || v === key) return fallback;
      return v;
    } catch (err) {
      return fallback;
    }
  };

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === formData.product_id),
    [products, formData.product_id],
  );

  const availableStock = selectedProduct?.current_stock ?? 0;

  const handleChange = (field) => (event) => {
    const value = event.target.value;

    if (field === "product_id") {
      const product = products.find((item) => String(item.id) === value);
      setFormData((prev) => ({
        ...prev,
        product_id: value,
        unit_price: product ? String(product.selling_price ?? "") : "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const product = products.find((item) => String(item.id) === formData.product_id);
    const fallbackUnitPrice = product?.selling_price ?? 0;

    // Validate damaged quantity does not exceed quantity
    const qty = parseFloat(formData.quantity || "0");
    const damagedQty = parseFloat(formData.damaged_quantity || "0") || 0;
    if (damagedQty > qty) {
      setFormError(L('add_sale.error.damaged_exceeds', 'Damaged quantity cannot exceed sold quantity'));
      return;
    }
    setFormError(null);

    onSubmit({
      product_id: product ? product.id : Number(formData.product_id),
      quantity: parseFloat(formData.quantity),
      unit_price: parseFloat(formData.unit_price || fallbackUnitPrice || 0),
      customer_name: formData.customer_name.trim() || null,
      notes: formData.notes.trim() || null,
      damaged_quantity: damagedQty,
      damage_reason: formData.damage_reason?.trim() || null,
    });
  };

  const unitPriceValue = (() => {
    if (formData.unit_price) return formData.unit_price;
    if (selectedProduct) return String(selectedProduct.selling_price ?? "");
    return "";
  })();

  const totalAmount =
    (parseFloat(formData.quantity) || 0) * (parseFloat(unitPriceValue || "0") || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {L('add_sale.title', 'Record Sale')}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {L('add_sale.product', 'Product')}
            </label>
            <select
              required
              value={formData.product_id}
              onChange={handleChange("product_id")}
              disabled={productsLoading || productsError}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
            >
              <option value="">
                {productsLoading
                  ? L('add_sale.loading_products', 'Loading products...')
                  : productsError
                    ? L('add_sale.failed_load_products', 'Failed to load products')
                    : L('add_sale.select_product', 'Select a product')}
              </option>
              {products.map((product) => (
                <option key={product.id} value={String(product.id)}>
                  {product.name} ({L('add_sale.in_stock', `In stock: ${product.current_stock}`).replace('{count}', String(product.current_stock))})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {L('add_sale.quantity', 'Quantity')}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.quantity}
                onChange={handleChange("quantity")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              />
              {formData.quantity && selectedProduct ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {L('add_sale.available', 'Available: {count}').replace('{count}', String(availableStock))}
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {L('add_sale.unit_price', 'Unit Price ($)')}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={unitPriceValue}
                onChange={handleChange("unit_price")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {formError ? (
            <div className="text-sm text-rose-700 dark:text-rose-300 mt-2">{formError}</div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {L('add_sale.customer_name', 'Customer Name')}
            </label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={handleChange("customer_name")}
              placeholder={L('add_sale.optional', 'Optional')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {L('add_sale.notes', 'Notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={handleChange("notes")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {L('add_sale.damaged_quantity', 'Damaged Quantity (optional)')}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.damaged_quantity}
                onChange={handleChange("damaged_quantity")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
                placeholder={L('add_sale.example_placeholder', 'e.g. 2')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {L('add_sale.damage_reason', 'Damage Reason (optional)')}
              </label>
              <input
                type="text"
                value={formData.damage_reason}
                onChange={handleChange("damage_reason")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
                placeholder={L('add_sale.optional', 'Optional')}
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-[#262626] p-3 rounded-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {L('add_sale.total_amount', 'Total Amount')}: <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
            </div>
            {selectedProduct ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {L('add_sale.available_for_product', 'Available stock for {name}: {count}').replace('{name}', selectedProduct.name).replace('{count}', String(availableStock))}
              </div>
            ) : null}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {L('add_sale.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.product_id ||
                parseFloat(formData.quantity || "0") <= 0 ||
                parseFloat(unitPriceValue || "0") <= 0 ||
                (parseFloat(formData.damaged_quantity || "0") || 0) > (parseFloat(formData.quantity || "0") || 0)
              }
              className="flex-1 px-4 py-2 bg-[#18B84E] dark:bg-[#16A249] text-white rounded-md hover:bg-[#16A249] dark:hover:bg-[#14D45D] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? L('add_sale.recording', 'Recording...') : L('add_sale.save', 'Save Sale')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
