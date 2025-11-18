import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useI18n } from '@/i18n';

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch (error) {
    return "—";
  }
};

export function PendingStockAdjustments({
  adjustments = [],
  loadingAdjustmentId = null,
  onApprove,
  onReject,
  error = null,
  onRetry,
  readOnly = false,
}) {
  const { t } = useI18n();
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <div className="flex items-start">
          <AlertTriangle className="mr-2 mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">{t('pending_adjustments.unable_load')}</p>
            <p className="mt-1 text-red-600">{error}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex items-center rounded-md border border-red-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 hover:bg-red-100"
              >
                {t('pending_adjustments.retry')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (!adjustments.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
        <p className="font-medium">{t('pending_adjustments.no_pending')}</p>
        <p className="mt-1 text-gray-500">{t('pending_adjustments.no_pending_message')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-500">{t('pending_adjustments.header_stock')}</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-500">{t('pending_adjustments.header_type')}</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-500">{t('pending_adjustments.header_quantity')}</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-500">{t('pending_adjustments.header_requested_by')}</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-500">{t('pending_adjustments.header_reason')}</th>
            {readOnly ? (
              <>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">{t('pending_adjustments.header_resolved_by')}</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">{t('pending_adjustments.header_resolved')}</th>
              </>
            ) : (
              <th className="px-4 py-3 text-left font-semibold text-gray-500">{t('pending_adjustments.header_submitted')}</th>
            )}
            {!readOnly && (
              <th className="px-4 py-3 text-right font-semibold text-gray-500">{t('pending_adjustments.header_actions')}</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {adjustments.map((adjustment) => {
            const isProcessing = loadingAdjustmentId === adjustment.id;
            return (
              <tr key={adjustment.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {adjustment.stock_name ?? `Stock #${adjustment.stock_id}`}
                </td>
                <td className="px-4 py-3 capitalize text-gray-700">
                  {t(`pending_adjustments.${adjustment.adjustment_type}`)}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {numberFormatter.format(adjustment.quantity)}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {adjustment.requested_by_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {adjustment.reason ? (
                    <span className="line-clamp-2" title={adjustment.reason}>
                      {adjustment.reason}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                {readOnly ? (
                  <>
                    <td className="px-4 py-3 text-gray-700">
                      {adjustment.resolved_by_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDateTime(adjustment.resolved_at)}</td>
                  </>
                ) : (
                  <td className="px-4 py-3 text-gray-600">{formatDateTime(adjustment.created_at)}</td>
                )}
                {!readOnly && (
                  <td className="px-4 py-3 text-right text-gray-700">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onReject?.(adjustment)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 hover:bg-red-100 disabled:opacity-60"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                          {t('pending_adjustments.reject')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onApprove?.(adjustment)}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                          {t('pending_adjustments.approve')}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
