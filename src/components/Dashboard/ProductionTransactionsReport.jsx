"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProductTransactions } from "@/hooks/useProductTransactions";
import { useI18n } from '@/i18n';

function formatCurrency(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return new Intl.NumberFormat(navigator.language, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(0);
  try {
    return new Intl.NumberFormat(navigator.language, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
  } catch (err) {
    return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
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
  const { t } = useI18n();

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
    const title = t('production.transactions.title');
    const rowsHtml = productionRows
      .map((trx) => {
        let metaId = "";
        try {
          const m = trx.metadata || {};
          if (typeof m === "string") {
            const p = JSON.parse(m || "{}");
            metaId = p.production_order_id ?? "";
          } else {
            metaId = m.production_order_id ?? "";
          }
        } catch (err) {
          metaId = "";
        }
        const rawTypeKey = `production.transactions.type_${String(trx.type || "").replace(/[^a-z0-9_]/gi, "_")}`;
        const localizedType = (t(rawTypeKey) === rawTypeKey) ? (trx.type ?? "") : t(rawTypeKey);
        return `
          <tr>
            <td style="padding:8px;border:1px solid #ddd">${trx.created_at ? new Date(trx.created_at).toLocaleString() : t('production.transactions.empty')}</td>
            <td style="padding:8px;border:1px solid #ddd">${trx.product_name ?? trx.product_id}</td>
            <td style="padding:8px;border:1px solid #ddd">${localizedType}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right">${Number(trx.quantity ?? 0)}</td>
            <td style="padding:8px;border:1px solid #ddd">${trx.reason ?? t('production.transactions.empty')}</td>
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
          <p>${t('production.transactions.generated')}: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>${t('production.transactions.header_date')}</th>
                <th>${t('production.transactions.header_product')}</th>
                <th>${t('production.transactions.header_type')}</th>
                <th style="text-align:right">${t('production.transactions.header_quantity')}</th>
                <th>${t('production.transactions.header_reason')}</th>
                <th>${t('production.transactions.header_production_order')}</th>
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
      alert(t('production.transactions.print_blocked'));
      return;
    }
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, '_blank');
      if (!newWin) { URL.revokeObjectURL(url); return alert(t('production.transactions.print_blocked')); }
      setTimeout(() => { try { newWin.print(); } catch (err) { console.error('Print failed', err); alert(t('production.transactions.print_failed')); } try { URL.revokeObjectURL(url); } catch (e) {} }, 300);
    } catch (err) {
      console.error('Failed to prepare print window', err);
      alert(t('production.transactions.print_blocked'));
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('production.transactions.product_label')}</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-1 text-sm">
            <option value="">{t('production.transactions.all')}</option>
            {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </div>
          <div className="ml-auto flex items-center gap-2">
          <div className="text-xs text-gray-500">{t('production.transactions.range_label')}</div>
          <div className="text-sm text-gray-700">{start ?? t('production.transactions.empty')} {t('production.transactions.range_arrow')} {end ?? t('production.transactions.empty')}</div>
          <div className="ml-2">
            <button onClick={handlePrint} className="rounded-md bg-blue-600 px-3 py-1 text-white text-sm">{t('production.transactions.print')}</button>
          </div>
        </div>
      </div>

      {error ? <div className="text-sm text-red-600 dark:text-red-400">{error.message || t('production.transactions.failed_load')}</div> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 dark:text-gray-300">
              <th className="py-2 pr-4">{t('production.transactions.header_date')}</th>
              <th className="py-2 pr-4">{t('production.transactions.header_product')}</th>
              <th className="py-2 pr-4">{t('production.transactions.header_type')}</th>
              <th className="py-2 pr-4">{t('production.transactions.header_quantity')}</th>
              <th className="py-2 pr-4">{t('production.transactions.header_reason')}</th>
              <th className="py-2 pr-4">{t('production.transactions.header_production_order')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="py-3 text-gray-500 dark:text-gray-400" colSpan={6}>{t('production.transactions.loading')}</td></tr>
            ) : productionRows.length === 0 ? (
              <tr><td className="py-3 text-gray-500 dark:text-gray-400" colSpan={6}>{t('production.transactions.no_data')}</td></tr>
            ) : (
              productionRows.map((trx) => {
                let metaId = "";
                try {
                  const m = trx.metadata || {};
                  if (typeof m === "string") {
                    const p = JSON.parse(m || "{}");
                    metaId = p.production_order_id ?? "";
                  } else {
                    metaId = m.production_order_id ?? "";
                  }
                } catch (err) { metaId = ""; }
                const rawTypeKey = `production.transactions.type_${String(trx.type || "").replace(/[^a-z0-9_]/gi, "_")}`;
                const localizedType = (t(rawTypeKey) === rawTypeKey) ? (trx.type ?? "") : t(rawTypeKey);
                return (
                  <tr key={trx.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4">{trx.created_at ? new Date(trx.created_at).toLocaleString() : t('production.transactions.empty')}</td>
                    <td className="py-2 pr-4">{trx.product_name ?? trx.product_id}</td>
                    <td className="py-2 pr-4">{localizedType}</td>
                    <td className="py-2 pr-4">{Number(trx.quantity ?? 0)}</td>
                    <td className="py-2 pr-4">{trx.reason || t('production.transactions.empty')}</td>
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
