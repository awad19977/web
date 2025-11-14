"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";

const isPositive = (v) => Number.isFinite(Number(v)) && Number(v) > 0;

export function CompleteProductionOrderForm({
  order,
  onSubmit,
  onClose,
  isSubmitting = false,
  submitError = null,
  allowExtras = false,
}) {
  const suggested = useMemo(() => {
    const qp = Number(order?.quantity_to_produce ?? order?.quantity_produced ?? 0);
    return Number.isFinite(qp) && qp > 0 ? qp : 0;
  }, [order]);

  const [quantity, setQuantity] = useState(suggested);
  const [stocks, setStocks] = useState([]);
  const [extras, setExtras] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!allowExtras) return;
    (async () => {
      try {
        const res = await fetch("/api/stock");
        const data = res.ok ? await res.json() : [];
        const items = Array.isArray(data)
          ? data
              .filter((s) => s?.allow_extra_production)
              .map((s) => ({ id: s.id, name: s.name, unit: s.unit, unit_cost: Number(s.unit_cost ?? 0), limit: Number(s.extra_production_limit ?? 0), available: Number(s.current_quantity ?? 0) }))
          : [];
        if (!cancelled) setStocks(items);
      } catch (e) {
        if (!cancelled) setStocks([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allowExtras]);

  const addExtra = () => setExtras((arr) => [...arr, { stockId: "", quantity: "" }]);
  const removeExtra = (idx) => setExtras((arr) => arr.filter((_, i) => i !== idx));
  const updateExtra = (idx, key, value) => setExtras((arr) => arr.map((row, i) => (i === idx ? { ...row, [key]: value } : row)));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!isPositive(quantity)) {
      setError("Enter a valid produced quantity");
      return;
    }
    let sanitized = [];
    if (allowExtras && extras.length) {
      sanitized = extras
        .map((row) => ({ stock_id: Number(row.stockId), quantity: Number(row.quantity) }))
        .filter((r) => Number.isInteger(r.stock_id) && r.stock_id > 0 && Number.isFinite(r.quantity) && r.quantity > 0);

      // Frontend guard: enforce per-unit limit by aggregating quantities per stock
      const totals = new Map();
      for (const r of sanitized) {
        totals.set(r.stock_id, (totals.get(r.stock_id) ?? 0) + r.quantity);
      }
      for (const [stockId, totalQty] of totals.entries()) {
        const stk = stocks.find((s) => Number(s.id) === Number(stockId));
        if (!stk) continue;
        const absoluteLimit = Number(stk.limit ?? 0);
        if (Number.isFinite(absoluteLimit) && absoluteLimit > 0) {
          if (totalQty - absoluteLimit > 1e-9) {
            setError(`Extra quantity for ${stk.name} exceeds allowed limit (${absoluteLimit} ${stk.unit || ''}).`);
            return;
          }
        }
        if ((Number(stk.available ?? 0) + 1e-9) < totalQty) {
          setError(`Not enough ${stk.name} available for extras.`);
          return;
        }
      }
    }

    onSubmit?.({ quantity_produced: Number(quantity), extras: sanitized });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg w-full max-w-2xl">
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Complete Production</h3>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">Close</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Quantity produced</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isSubmitting}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {allowExtras && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Extra ingredients (optional)</h4>
                <button type="button" onClick={addExtra} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                  <Plus className="h-4 w-4" /> Add item
                </button>
              </div>
              {extras.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">No extras added.</p>
              ) : (
                <div className="space-y-2">
                  {extras.map((row, idx) => {
                    const sel = stocks.find((s) => String(s.id) === String(row.stockId));
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2">
                        <div className="col-span-7">
                          <select
                            value={row.stockId}
                            onChange={(e) => updateExtra(idx, "stockId", e.target.value)}
                            disabled={isSubmitting}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-2 text-sm"
                          >
                            <option value="">Select stock…</option>
                            {stocks.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} {s.unit ? `(${s.unit})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Quantity"
                            value={row.quantity}
                            onChange={(e) => updateExtra(idx, "quantity", e.target.value)}
                            disabled={isSubmitting}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-2 text-sm"
                          />
                          {sel ? (
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                              Avail: {sel.available} • Limit: {sel.limit || "Unlimited"}
                            </p>
                          ) : null}
                        </div>
                        <div className="col-span-1 flex items-center justify-end">
                          <button type="button" onClick={() => removeExtra(idx)} className="p-2 text-gray-500 hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {(error || submitError) && (
            <div className="flex items-start rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertTriangle className="mr-2 mt-0.5 h-4 w-4" />
              {error || submitError}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-800 pt-3">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-200">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Completing…</>) : "Complete order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
