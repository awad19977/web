"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProductTransactions } from "@/hooks/useProductTransactions";
import { useI18n } from '@/i18n';

export function ProductTransactionsReport({ start, end }) {
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
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{L('product_transactions.label_product','Product')}</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-1 text-sm"
          >
            <option value="">{L('product_transactions.all','All')}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{L('product_transactions.label_type','Type')}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-1 text-sm"
          >
            <option value="">{L('product_transactions.all','All')}</option>
            <option value="increase">{L('product_transactions.type_increase','Increase')}</option>
            <option value="decrease">{L('product_transactions.type_decrease','Decrease')}</option>
            <option value="adjustment">{L('product_transactions.type_adjustment','Adjustment')}</option>
            <option value="damage">{L('product_transactions.type_damage','Damage')}</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-xs text-gray-500">{L('product_transactions.range_label','Range:')}</div>
          <div className="text-sm text-gray-700">{start ?? "-"} {L('product_transactions.range_arrow','→')} {end ?? "-"}</div>
          <button
            type="button"
            onClick={() => {
              // Print current table
              const title = L('product_transactions.print_title','Product Transactions');
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
                </head><body><h1>${title}</h1><p>${L('product_transactions.range_label','Range:')} ${start ?? '-'} → ${end ?? '-'}</p><table><thead><tr><th>${L('product_transactions.header_date','Date')}</th><th>${L('product_transactions.header_product','Product')}</th><th>${L('product_transactions.header_type','Type')}</th><th style="text-align:right">${L('product_transactions.header_quantity','Quantity')}</th><th>${L('product_transactions.header_reason','Reason')}</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
              const w = window.open('', '_blank');
              if (!w) return alert('Unable to open print window. Check popup blocker.');
              try {
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const newWin = window.open(url, '_blank');
                if (!newWin) {
                  URL.revokeObjectURL(url);
                  return alert(L('product_transactions.print_blocked','Unable to open print window. Check popup blocker.'));
                }
                setTimeout(() => {
                  try { newWin.print(); } catch (err) { console.error('Print failed', err); alert(L('product_transactions.print_failed','Print failed. Please try manually from the new tab.')); }
                  try { URL.revokeObjectURL(url); } catch (e) { }
                }, 300);
              } catch (err) {
                console.error('Failed to prepare print window', err);
                alert(L('product_transactions.print_blocked','Unable to open print window. Check popup blocker.'));
              }
            }}
            className="rounded-md bg-blue-600 px-3 py-1 text-white text-sm"
          >
            {L('product_transactions.print','Print')}
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error.message || L('product_transactions.failed_load','Failed to load transactions')}</div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 dark:text-gray-300">
              <th className="py-2 pr-4">{L('product_transactions.header_date','Date')}</th>
              <th className="py-2 pr-4">{L('product_transactions.header_product','Product')}</th>
              <th className="py-2 pr-4">{L('product_transactions.header_type','Type')}</th>
              <th className="py-2 pr-4">{L('product_transactions.header_quantity','Quantity')}</th>
              <th className="py-2 pr-4">{L('product_transactions.header_reason','Reason')}</th>
              <th className="py-2 pr-4">{L('product_transactions.header_credit','Credit')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="py-3 text-gray-500 dark:text-gray-400" colSpan={6}>{L('product_transactions.loading','Loading...')}</td></tr>
            ) : data.length === 0 ? (
              <tr><td className="py-3 text-gray-500 dark:text-gray-400" colSpan={6}>{L('product_transactions.no_transactions','No transactions found')}</td></tr>
            ) : (
              data.map((t) => (
                <tr key={t.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4">{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</td>
                  <td className="py-2 pr-4">{t.product_name ?? t.product_id}</td>
                  <td className="py-2 pr-4 capitalize">{L(`product_transactions.type_${t.type.toLowerCase()}`, t.type)}</td>
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
