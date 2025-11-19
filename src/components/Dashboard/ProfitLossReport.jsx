import React, { useCallback } from "react";
import { useI18n } from '@/i18n';

import { formatCurrency } from '@/utils/formatCurrency';

function buildRows(salesData = [], expensesData = []) {
  const map = new Map();

  (salesData || []).forEach((row) => {
    const date = (row.date || row.sale_date || null) ? String(row.date).slice(0, 10) : null;
    if (!date) return;
    const revenue = Number(row.revenue ?? row.total_revenue ?? 0);
    const entry = map.get(date) || { revenue: 0, expenses: 0 };
    entry.revenue += isFinite(revenue) ? revenue : 0;
    map.set(date, entry);
  });

  (expensesData || []).forEach((row) => {
    const date = (row.date || row.expense_date || null) ? String(row.date).slice(0, 10) : null;
    if (!date) return;
    const expense = Number(row.total_expenses ?? row.amount ?? 0);
    const entry = map.get(date) || { revenue: 0, expenses: 0 };
    entry.expenses += isFinite(expense) ? expense : 0;
    map.set(date, entry);
  });

  const dates = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));

  const rows = dates.map((date) => {
    const { revenue, expenses } = map.get(date) || { revenue: 0, expenses: 0 };
    return { date, revenue, expenses, net: revenue - expenses };
  });

  return rows;
}

export function ProfitLossReport({ reports = {} }) {
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

  const salesData = reports.salesData ?? [];
  const expensesData = reports.expensesData ?? [];
  const rows = buildRows(salesData, expensesData);

  const totals = rows.reduce(
    (acc, r) => {
      acc.revenue += Number(r.revenue || 0);
      acc.expenses += Number(r.expenses || 0);
      acc.net += Number(r.net || 0);
      return acc;
    },
    { revenue: 0, expenses: 0, net: 0 },
  );

  const handlePrint = () => {
    const title = L('reports.profit_loss_report.title', 'no and Loss Report');
    const htmlRows = rows
      .map(
        (r) => `
          <tr>
            <td style="padding:8px;border:1px solid #ddd">${r.date}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(r.revenue)}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(r.expenses)}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(r.net)}</td>
          </tr>
        `,
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; padding: 24px; }
            table { border-collapse: collapse; width: 100%; margin-top: 12px }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background: #f7f7f7; text-align: left }
            .totals { font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>${L('reports.profit_loss_report.generated','Generated:')} ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th style="padding:8px">${L('reports.profit_loss_report.table_date','Date')}</th>
                <th style="padding:8px;text-align:right">${L('reports.profit_loss_report.table_revenue','Revenue')}</th>
                <th style="padding:8px;text-align:right">${L('reports.profit_loss_report.table_expenses','Expenses')}</th>
                <th style="padding:8px;text-align:right">${L('reports.profit_loss_report.table_net','Net')}</th>
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
              <tr class="totals">
                <td style="padding:8px;border:1px solid #ddd">${L('reports.profit_loss_report.total_label','Total')}</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(totals.revenue)}</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(totals.expenses)}</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(totals.net)}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) {
      alert(L('reports.profit_loss_report.print_blocked','Unable to open print window. Check popup blocker.'));
      return;
    }
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, '_blank');
      if (!newWin) { URL.revokeObjectURL(url); return alert(L('reports.profit_loss_report.print_blocked','Unable to open print window. Check popup blocker.')); }
      setTimeout(() => { try { newWin.print(); } catch (err) { console.error('Print failed', err); alert('Print failed. Please try manually from the new tab.'); } try { URL.revokeObjectURL(url); } catch (e) {} }, 300);
    } catch (err) {
      console.error('Failed to prepare print window', err);
      alert(L('reports.profit_loss_report.print_blocked','Unable to open print window. Check popup blocker.'));
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{L('reports.profit_loss_report.heading','Profit & Loss')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{L('reports.profit_loss_report.description','Revenue minus expenses per day and net profit for the selected period.')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="rounded-md bg-blue-600 px-3 py-1 text-white text-sm">{L('reports.profit_loss_report.print','Print')}</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-3 py-2">{L('reports.profit_loss_report.table_date','Date')}</th>
              <th className="px-3 py-2 text-right">{L('reports.profit_loss_report.table_revenue','Revenue')}</th>
              <th className="px-3 py-2 text-right">{L('reports.profit_loss_report.table_expenses','Expenses')}</th>
              <th className="px-3 py-2 text-right">{L('reports.profit_loss_report.table_net','Net')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date} className="border-t border-gray-100">
                <td className="px-3 py-2">{r.date}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(r.revenue)}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(r.expenses)}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(r.net)}</td>
              </tr>
            ))}
            <tr className="border-t border-gray-200 font-bold">
              <td className="px-3 py-2">{L('reports.profit_loss_report.total_label','Total')}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(totals.revenue)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(totals.expenses)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(totals.net)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProfitLossReport;
