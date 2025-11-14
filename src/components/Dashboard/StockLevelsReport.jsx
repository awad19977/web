"use client";

import { useQuery } from "@tanstack/react-query";

function formatNumber(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "0";
  return n.toLocaleString();
}

export default function StockLevelsReport() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["reports", "stock-levels"],
    queryFn: async () => {
      const res = await fetch("/api/reports/stock-levels");
      if (!res.ok) throw new Error("Failed to fetch stock levels");
      return res.json();
    },
    retry: false,
  });

  const handlePrint = () => {
    const title = "Stock Levels";
    const rowsHtml = (data || [])
      .map((r) => `
        <tr>
          <td style="padding:8px;border:1px solid #ddd">${r.name}</td>
          <td style="padding:8px;border:1px solid #ddd">${r.description ?? ""}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatNumber(Number(r.current_quantity ?? 0))}</td>
          <td style="padding:8px;border:1px solid #ddd">${r.unit_name ?? r.base_unit_name ?? ""}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right">${r.unit_cost ?? ""}</td>
          <td style="padding:8px;border:1px solid #ddd">${r.supplier ?? ""}</td>
        </tr>
      `)
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background:#f7f7f7}</style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th style="text-align:right">Quantity</th>
                <th>Unit</th>
                <th style="text-align:right">Unit Cost</th>
                <th>Supplier</th>
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

  if (isLoading) return <div>Loading stock levels...</div>;
  if (error) return <div className="text-sm text-red-600">{error.message}</div>;

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Current Stock Levels</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Showing items with quantity &gt; 0</p>
        </div>
        <div>
          <button onClick={handlePrint} className="rounded-md bg-blue-600 px-3 py-1 text-white text-sm">Print</button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-gray-500">No stock items with positive quantity.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 dark:text-gray-300">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">Quantity</th>
                <th className="py-2 pr-4">Unit</th>
                <th className="py-2 pr-4">Unit Cost</th>
                <th className="py-2 pr-4">Supplier</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4">{r.description ?? ""}</td>
                  <td className="py-2 pr-4">{formatNumber(Number(r.current_quantity ?? 0))}</td>
                  <td className="py-2 pr-4">{r.unit_name ?? r.base_unit_name ?? ""}</td>
                  <td className="py-2 pr-4">{r.unit_cost ?? ""}</td>
                  <td className="py-2 pr-4">{r.supplier ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
