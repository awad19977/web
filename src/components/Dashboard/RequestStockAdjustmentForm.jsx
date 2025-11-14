import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export function RequestStockAdjustmentForm({
  stock = [],
  onSubmit,
  onClose,
  loading = false,
}) {
  const [formState, setFormState] = useState({
    stockId: "",
    adjustmentType: "increase",
    quantity: "",
    reason: "",
  });
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const quantity = Number(formState.quantity);

    if (!formState.stockId) {
      setError("Choose a stock item to adjust");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a positive quantity to adjust");
      return;
    }

    setError(null);
    onSubmit?.({
      stock_id: Number(formState.stockId),
      adjustment_type: formState.adjustmentType,
      quantity,
      reason: formState.reason ? formState.reason.trim() : null,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-900">Request Stock Adjustment</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock item</label>
            <select
              name="stockId"
              value={formState.stockId}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
              required
            >
              <option value="">Select stock…</option>
              {stock.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Adjustment type</label>
              <select
                name="adjustmentType"
                value={formState.adjustmentType}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                name="quantity"
                min="0"
                step="0.01"
                value={formState.quantity}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. 10"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason (optional)</label>
            <textarea
              name="reason"
              value={formState.reason}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Provide additional context for approvers"
              disabled={loading}
            />
          </div>

          {error ? (
            <div className="flex items-start rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="mr-2 mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
