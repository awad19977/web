"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStockTransactions } from "@/hooks/useStockTransactions";
import { useI18n } from '@/i18n';

export function StockTransactionsReport({ start, end }) {
  const { t } = useI18n();
  const L = useCallback((key, fallback, params) => {
    try {
      const v = t(key, params);
      if (!v || v === key) return fallback;
      return v;
    } catch (err) {
      return fallback;
    }
  }, [t]);

  const [stockId, setStockId] = useState("");
  const [type, setType] = useState("");

  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks:min"],
    queryFn: async () => {
      const res = await fetch("/api/stock");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data)
        ? data.map((s) => ({ id: s.id, name: s.name }))
        : [];
    },
  });

  const filters = useMemo(
    () => ({
      stockId: stockId ? Number(stockId) : undefined,
      type: type || undefined,
      from: start || undefined,
      to: end || undefined,
    }),
    [stockId, type, start, end]
  );

  const { data = [], isLoading, error } = useStockTransactions(filters);

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{L('stock_transactions_report.label_stock_item','Stock Item')}</label>
          <select
            value={stockId}
            onChange={(e) => setStockId(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-1 text-sm"
          >
            <option value="">{L('stock_transactions_report.all','All')}</option>
            {stocks.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{L('stock_transactions_report.label_type','Type')}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-1 text-sm"
          >
            <option value="">{L('stock_transactions_report.all','All')}</option>
            <option value="increase">{L('stock_transactions_report.type_increase','Increase')}</option>
            <option value="decrease">{L('stock_transactions_report.type_decrease','Decrease')}</option>
            <option value="adjustment">{L('stock_transactions_report.type_adjustment','Adjustment')}</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-xs text-gray-500">{L('stock_transactions_report.range_label','Range:')}</div>
          <div className="text-sm text-gray-700">{start ?? L('dash','-')} → {end ?? L('dash','-')}</div>
          <button
            type="button"
            onClick={() => {
              const title = L('stock_transactions_report.title','Stock Transactions');
              const rowsHtml = data.map((t) => `
                <tr>
                  <td style="padding:8px;border:1px solid #ddd">${t.created_at ? new Date(t.created_at).toLocaleString() : L('dash','-')}</td>
                  <td style="padding:8px;border:1px solid #ddd">${t.stock_name ?? t.stock_id}</td>
                  <td style="padding:8px;border:1px solid #ddd">${t.type}</td>
                  <td style="padding:8px;border:1px solid #ddd;text-align:right">${Number(t.quantity ?? t.entered_quantity ?? 0)}</td>
                  <td style="padding:8px;border:1px solid #ddd">${t.unit_symbol || t.unit_name || ''}</td>
                  <td style="padding:8px;border:1px solid #ddd">${t.reason || ''}</td>
                </tr>`).join('');
              const html = `
                <html><head><meta charset="utf-8" /><title>${title}</title>
                <style>body{font-family:system-ui;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background:#f7f7f7}</style>
                </head><body><h1>${title}</h1><p>${L('stock_transactions_report.range_label','Range:')} ${start ?? L('dash','-')} → ${end ?? L('dash','-')}</p><table><thead><tr><th>${L('stock_transactions_report.table_date','Date')}</th><th>${L('stock_transactions_report.table_stock','Stock')}</th><th>${L('stock_transactions_report.table_type','Type')}</th><th style="text-align:right">${L('stock_transactions_report.table_quantity','Quantity')}</th><th>${L('stock_transactions_report.table_unit','Unit')}</th><th>${L('stock_transactions_report.table_reason','Reason')}</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
              const w = window.open('', '_blank');
              if (!w) return alert(L('stock_transactions_report.print_blocked','Unable to open print window. Check popup blocker.'));
              try {
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const newWin = window.open(url, '_blank');
                if (!newWin) {
                  URL.revokeObjectURL(url);
                  return alert(L('stock_transactions_report.print_blocked','Unable to open print window. Check popup blocker.'));
                }
                // Give the new tab a moment to load the blob content
                setTimeout(() => {
                  try { newWin.print(); } catch (err) { console.error('Print failed', err); alert(L('stock_transactions_report.print_failed','Print failed. Please try manually from the new tab.')); }
                  try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
                }, 300);
              } catch (err) {
                console.error('Failed to prepare print window', err);
                alert(L('stock_transactions_report.print_blocked','Unable to open print window. Check popup blocker.'));
              }
            }}
            className="rounded-md bg-blue-600 px-3 py-1 text-white text-sm"
          >
            {L('stock_transactions_report.print','Print')}
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error.message || L('stock_transactions_report.failed_load','Failed to load transactions')}</div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
              <tr className="text-left text-gray-600 dark:text-gray-300">
              <th className="py-2 pr-4">{L('stock_transactions_report.table_date','Date')}</th>
              <th className="py-2 pr-4">{L('stock_transactions_report.table_stock','Stock')}</th>
              <th className="py-2 pr-4">{L('stock_transactions_report.table_type','Type')}</th>
              <th className="py-2 pr-4">{L('stock_transactions_report.table_quantity','Quantity')}</th>
              <th className="py-2 pr-4">{L('stock_transactions_report.table_unit','Unit')}</th>
              <th className="py-2 pr-4">{L('stock_transactions_report.table_reason','Reason')}</th>
              <th className="py-2 pr-4">{L('stock_transactions_report.table_credit','Credit')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="py-3 text-gray-500 dark:text-gray-400" colSpan={7}>{L('stock_transactions_report.loading','Loading...')}</td></tr>
            ) : data.length === 0 ? (
              <tr><td className="py-3 text-gray-500 dark:text-gray-400" colSpan={7}>{L('stock_transactions_report.no_transactions','No transactions found')}</td></tr>
            ) : (
              data.map((t) => (
                <tr key={t.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4">{t.created_at ? new Date(t.created_at).toLocaleString() : L('dash','-')}</td>
                  <td className="py-2 pr-4">{t.stock_name ?? t.stock_id}</td>
                  <td className="py-2 pr-4 capitalize">{L(`stock_transactions_report.type_${t.type.toLowerCase()}`, t.type)}</td>
                  <td className="py-2 pr-4">{Number(t.quantity ?? t.entered_quantity ?? 0)}</td>
                  <td className="py-2 pr-4">{t.unit_symbol || t.unit_name || ""}</td>
                  <td className="py-2 pr-4">{L(`stock_transactions_report.reason_${t.reason.toLowerCase()}`, t.reason || "")}</td>
                  <td className="py-2 pr-4">{String(t.type).toLowerCase() === 'decrease' ? Number(t.quantity ?? t.entered_quantity ?? 0) : ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
