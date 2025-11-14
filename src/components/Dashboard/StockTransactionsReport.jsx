"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStockTransactions } from "@/hooks/useStockTransactions";

export function StockTransactionsReport() {
  const [stockId, setStockId] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

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
      from: from || undefined,
      to: to || undefined,
    }),
    [stockId, type, from, to]
  );

  const { data = [], isLoading, error } = useStockTransactions(filters);

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Stock Item</label>
          <select
            value={stockId}
            onChange={(e) => setStockId(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {stocks.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
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
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-1 text-sm" />
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
              <th className="py-2 pr-4">Stock</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Quantity</th>
              <th className="py-2 pr-4">Unit</th>
              <th className="py-2 pr-4">Reason</th>
              <th className="py-2 pr-4">Credit</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="py-3 text-gray-500 dark:text-gray-400" colSpan={6}>Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td className="py-3 text-gray-500 dark:text-gray-400" colSpan={6}>No transactions found</td></tr>
            ) : (
              data.map((t) => (
                <tr key={t.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4">{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</td>
                  <td className="py-2 pr-4">{t.stock_name ?? t.stock_id}</td>
                  <td className="py-2 pr-4 capitalize">{t.type}</td>
                  <td className="py-2 pr-4">{Number(t.quantity ?? t.entered_quantity ?? 0)}</td>
                  <td className="py-2 pr-4">{t.unit_symbol || t.unit_name || ""}</td>
                  <td className="py-2 pr-4">{t.reason || ""}</td>
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
