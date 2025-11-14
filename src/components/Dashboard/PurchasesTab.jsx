"use client";

import React, { useEffect, useState } from "react";
import { useStockManagement } from "@/hooks/useStockManagement";
import { PurchaseStockForm } from "./PurchaseStockForm";

export function PurchasesTab({ canCreate = false }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState(null);

  const { stock, isLoading: stockLoading, purchaseStock, purchaseStockLoading } = useStockManagement();

  const fetchPurchases = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/stock/purchases?page=${page}&pageSize=${pageSize}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || "Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setPurchases(data.purchases || []);
        setTotal(data.meta?.total || 0);
      })
      .catch((err) => setError(err.message || "Error fetching purchases"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  const handleOpenCreate = () => {
    setSelectedStockId(null);
    setShowCreate(true);
  };

  const handleCloseCreate = () => {
    setShowCreate(false);
  };

  const handleStartCreate = (stockId) => {
    setSelectedStockId(stockId);
  };

  const handlePurchaseSubmit = (payload) => {
    purchaseStock(payload, {
      onSuccess: () => {
        setShowCreate(false);
        fetchPurchases();
      },
      onError: (err) => {
        console.error("Purchase failed", err);
        // optionally show error to user
      },
    });
  };

  const selectedStock = stock.find((s) => s.id === selectedStockId) || null;

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchases</h3>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-400">Per page:</label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1 border rounded-md">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          {canCreate && (
            <button onClick={handleOpenCreate} className="px-3 py-1 bg-[#18B84E] text-white rounded-md">Create Purchase</button>
          )}
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading purchases...</div>}
      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium">Date</th>
                  <th className="px-3 py-2 text-left text-sm font-medium">Stock</th>
                  <th className="px-3 py-2 text-right text-sm font-medium">Quantity</th>
                  <th className="px-3 py-2 text-left text-sm font-medium">Unit</th>
                  <th className="px-3 py-2 text-right text-sm font-medium">Unit Cost</th>
                  <th className="px-3 py-2 text-right text-sm font-medium">Total Cost</th>
                  <th className="px-3 py-2 text-left text-sm font-medium">Supplier</th>
                  <th className="px-3 py-2 text-left text-sm font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-sm text-gray-500">No purchases found.</td>
                  </tr>
                )}

                {purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 text-sm text-gray-700">{p.purchase_date ? new Date(p.purchase_date).toLocaleString() : "-"}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{p.stock_name}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 text-right">{p.entered_quantity ?? p.quantity}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{p.purchase_unit_name ?? p.stock_unit}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 text-right">{typeof p.unit_cost === 'number' ? p.unit_cost.toFixed(2) : p.unit_cost}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 text-right">{typeof p.total_cost === 'number' ? p.total_cost.toFixed(2) : p.total_cost}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{p.supplier ?? "-"}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{p.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Showing page {page} of {totalPages} — {total} items</div>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 border rounded-md">Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-2 py-1 border rounded-md">Next</button>
            </div>
          </div>
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Purchase</h3>
              <button onClick={handleCloseCreate} className="text-sm text-gray-500">Close</button>
            </div>

            {!selectedStock && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Stock</label>
                  <select value={selectedStockId ?? ""} onChange={(e) => setSelectedStockId(Number(e.target.value) || null)} className="w-full px-3 py-2 border rounded-md">
                    <option value="">Select an item</option>
                    {stock.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} (In stock: {s.current_quantity})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button disabled={!selectedStockId} onClick={() => handleStartCreate(selectedStockId)} className="px-3 py-2 bg-[#18B84E] text-white rounded-md">Continue</button>
                  <button onClick={handleCloseCreate} className="px-3 py-2 border rounded-md">Cancel</button>
                </div>
              </div>
            )}

            {selectedStock && (
              <PurchaseStockForm stock={selectedStock} onClose={handleCloseCreate} onSubmit={handlePurchaseSubmit} loading={purchaseStockLoading} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
