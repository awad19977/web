import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
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

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "completed":
      return "bg-green-50 text-green-700 border-green-200";
    case "in_progress":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export function ProductionOrdersTable({
  orders = [],
  loading = false,
  fetching = false,
  error = null,
  onRetry,
  onComplete,
  completingOrderId = null,
  onCancel,
  onFail,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-gray-600">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading production orders…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <div className="flex items-start">
          <AlertTriangle className="mr-2 mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">Failed to load production orders</p>
            <p className="mt-1 text-red-600">{error}</p>
            {onRetry && (
              <button
                type="button"
                className="mt-3 rounded-md border border-red-300 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
                onClick={onRetry}
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">
        <p className="font-medium">No production orders yet.</p>
        <p className="mt-1 text-sm text-gray-500">Create your first production order to see it listed here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {fetching && (
        <div className="flex items-center justify-center bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Refreshing orders…
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Product
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Planned qty
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Produced qty
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Estimated cost
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Started
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Completed
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => {
            const status = order.status ?? "planned";
            return (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {order.product_name ?? `Product #${order.product_id}`}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {numberFormatter.format(order.quantity_to_produce ?? 0)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {numberFormatter.format(order.quantity_produced ?? 0)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusBadgeClass(status)}`}>
                    {status.replace("_", " ")}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {currencyFormatter.format(order.production_cost ?? 0)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {formatDateTime(order.started_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {formatDateTime(order.completed_at)}
                  {status === "completed" && (
                    <CheckCircle2 className="ml-1 inline h-4 w-4 text-green-500" />
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  {status === "completed" ? (
                    <span className="text-xs font-medium text-green-700">Completed</span>
                  ) : status === "planned" ? (
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onComplete?.(order)}
                        className="inline-flex items-center rounded-md border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={Boolean(completingOrderId) && completingOrderId !== order.id}
                      >
                        {completingOrderId === order.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating…
                          </>
                        ) : (
                          "Mark completed"
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onCancel?.(order)}
                        className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1 text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => onFail?.(order)}
                        className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1 text-sm font-medium text-rose-800 bg-rose-50 hover:bg-rose-100"
                      >
                        Mark failed
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-gray-600 capitalize">{status.replace("_", " ")}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
