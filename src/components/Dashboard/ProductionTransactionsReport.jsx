"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProductTransactions } from "@/hooks/useProductTransactions";

function formatCurrency(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "$0";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function isProductionTransaction(t) {
  const reason = String(t.reason || "").toLowerCase();
  if (reason.includes("production") || reason.includes("production_output") || reason.includes("production_failure")) return true;
  try {
    const meta = t.metadata || {};
    if (typeof meta === "string") {
      const parsed = JSON.parse(meta || "{}");
      if (parsed?.production_order_id) return true;
    } else if (meta && meta.production_order_id) {
      return true;
    }
  } catch (err) {
    // ignore
  }
  return false;
}

export function ProductionTransactionsReport({ start, end }) {
  const [productId, setProductId] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products:min"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data.map((p) => ({ id: p.id, name: p.name })) : [];
    },
  });

  const filters = useMemo(
    () => ({
      productId: productId ? Number(productId) : undefined,
      type: "increase",
      from: start || undefined,
      to: end || undefined,
      scope: "production",
    }),
    [productId, start, end]
  );

  const { data = [], isLoading, error } = useProductTransactions(filters);

  const productionRows = useMemo(() => {
    return (data || []).filter(isProductionTransaction);
  }, [data]);

  const handlePrint = () => {
    const title = "Production Transactions";
    const rowsHtml = productionRows
      .map((t) => {
        let metaId = "";
        try {
          const m = t.metadata || {};
          if (typeof m === "string") {
            const p = JSON.parse(m || "{}");
            metaId = p.production_order_id ?? "";
          } else {
            metaId = m.production_order_id ?? "";
          }
        } catch (err) {
          metaId = "";
        }
        return `
          <tr>
            <td style="padding:8px;border:1px solid #ddd">${t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</td>
            <td style="padding:8px;border:1px solid #ddd">${t.product_name ?? t.product_id}</td>
            <td style="padding:8px;border:1px solid #ddd">${t.type}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right">${Number(t.quantity ?? 0)}</td>
            <td style="padding:8px;border:1px solid #ddd">${t.reason ?? ""}</td>
            <td style="padding:8px;border:1px solid #ddd">${metaId}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; padding: 24px }
            table { border-collapse: collapse; width: 100%; margin-top: 12px }
            th, td { border: 1px solid #ddd; padding: 8px }
            th { background: #f7f7f7 }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Type</th>
                <th style="text-align:right">Quantity</th>
                <th>Reason</th>
                <th>Production Order</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) {
      alert("Unable to open print window. Check popup blocker.");
      return;
    }
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, '_blank');
      if (!newWin) { URL.revokeObjectURL(url); return alert('Unable to open print window. Check popup blocker.'); }
      setTimeout(() => { try { newWin.print(); } catch (err) { console.error('Print failed', err); alert('Print failed. Please try manually from the new tab.'); } try { URL.revokeObjectURL(url); } catch (e) {} }, 300);
    } catch (err) {
      console.error('Failed to prepare print window', err);
      alert('Unable to open print window. Check popup blocker.');
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Product</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-1 text-sm">
            <option value="">All</option>
            {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-xs text-gray-500">Range:</div>
          <div className="text-sm text-gray-700">{start ?? "-"} → {end ?? "-"}</div>
          <div className="ml-2">
            <button onClick={handlePrint} className="rounded-md bg-blue-600 px-3 py-1 text-white text-sm">Print</button>
          </div>
        </div>
      </div>

      {error ? <div className="text-sm text-red-600 dark:text-red-400">{error.message || "Failed to load transactions"}</div> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 dark:text-gray-300">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Product</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Quantity</th>
              <th className="py-2 pr-4">Reason</th>
              <th className="py-2 pr-4">Production Order</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="py-3 text-gray-500 dark:text-gray-400" colSpan={6}>Loading...</td></tr>
            ) : productionRows.length === 0 ? (
              <tr><td className="py-3 text-gray-500 dark:text-gray-400" colSpan={6}>No production transactions found</td></tr>
            ) : (
              productionRows.map((t) => {
                let metaId = "";
                try {
                  const m = t.metadata || {};
                  if (typeof m === "string") {
                    const p = JSON.parse(m || "{}");
                    metaId = p.production_order_id ?? "";
                  } else {
                    metaId = m.production_order_id ?? "";
                  }
                } catch (err) { metaId = ""; }
                return (
                  <tr key={t.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4">{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</td>
                    <td className="py-2 pr-4">{t.product_name ?? t.product_id}</td>
                    <td className="py-2 pr-4 capitalize">{t.type}</td>
                    <td className="py-2 pr-4">{Number(t.quantity ?? 0)}</td>
                    <td className="py-2 pr-4">{t.reason || ""}</td>
                    <td className="py-2 pr-4">{metaId}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductionTransactionsReport;
