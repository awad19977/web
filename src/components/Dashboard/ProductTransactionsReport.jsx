"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProductTransactions } from "@/hooks/useProductTransactions";

export function ProductTransactionsReport({ start, end }) {
  const [productId, setProductId] = useState("");
  const [type, setType] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products:min"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data)
        ? data.map((p) => ({ id: p.id, name: p.name }))
        : [];
    },
  });

  const filters = useMemo(
    () => ({
      productId: productId ? Number(productId) : undefined,
      type: type || undefined,
      from: start || undefined,
      to: end || undefined,
    }),
    [productId, type, start, end]
  );

  const { data = [], isLoading, error } = useProductTransactions(filters);

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Product</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-1 text-sm"
          >
            <option value="">All</option>
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-xs text-gray-500">Range:</div>
          <div className="text-sm text-gray-700">{start ?? "-"} → {end ?? "-"}</div>
          <button
            type="button"
            onClick={() => {
              // Print current table
              const title = 'Product Transactions';
              const rowsHtml = data.map((t) => `
                <tr>
                  <td style="padding:8px;border:1px solid #ddd">${t.created_at ? new Date(t.created_at).toLocaleString() : '-'}</td>
                  <td style="padding:8px;border:1px solid #ddd">${t.product_name ?? t.product_id}</td>
                  <td style="padding:8px;border:1px solid #ddd">${t.type}</td>
                  <td style="padding:8px;border:1px solid #ddd;text-align:right">${Number(t.quantity ?? 0)}</td>
                  <td style="padding:8px;border:1px solid #ddd">${t.reason || ''}</td>
                </tr>`).join('');
              const html = `
                <html><head><meta charset="utf-8" /><title>${title}</title>
                <style>body{font-family:system-ui;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background:#f7f7f7}</style>
                </head><body><h1>${title}</h1><p>Range: ${start ?? '-'} → ${end ?? '-'}</p><table><thead><tr><th>Date</th><th>Product</th><th>Type</th><th style="text-align:right">Quantity</th><th>Reason</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
              const w = window.open('', '_blank');
              if (!w) return alert('Unable to open print window. Check popup blocker.');
              try {
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const newWin = window.open(url, '_blank');
                if (!newWin) {
                  URL.revokeObjectURL(url);
                  return alert('Unable to open print window. Check popup blocker.');
                }
                setTimeout(() => {
                  try { newWin.print(); } catch (err) { console.error('Print failed', err); alert('Print failed. Please try manually from the new tab.'); }
                  try { URL.revokeObjectURL(url); } catch (e) { }
                }, 300);
              } catch (err) {
                console.error('Failed to prepare print window', err);
                alert('Unable to open print window. Check popup blocker.');
              }
            }}
            className="rounded-md bg-blue-600 px-3 py-1 text-white text-sm"
          >
            Print
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error.message || "Failed to load transactions"}</div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 dark:text-gray-300">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Product</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Quantity</th>
              <th className="py-2 pr-4">Reason</th>
              <th className="py-2 pr-4">Credit</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="py-3 text-gray-500 dark:text-gray-400" colSpan={6}>Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td className="py-3 text-gray-500 dark:text-gray-400" colSpan={5}>No transactions found</td></tr>
            ) : (
              data.map((t) => (
                <tr key={t.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4">{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</td>
                  <td className="py-2 pr-4">{t.product_name ?? t.product_id}</td>
                  <td className="py-2 pr-4 capitalize">{t.type}</td>
                  <td className="py-2 pr-4">{Number(t.quantity ?? 0)}</td>
                  <td className="py-2 pr-4">{t.reason || ""}</td>
                  <td className="py-2 pr-4">{String(t.type).toLowerCase() === 'decrease' ? Number(t.quantity ?? 0) : ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
