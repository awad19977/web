import { useQuery } from "@tanstack/react-query";

function buildQuery(params) {
  const qp = new URLSearchParams();
  if (params?.stockId) qp.set("stock_id", String(params.stockId));
  if (params?.type) qp.set("type", String(params.type));
  if (params?.from) qp.set("from", new Date(params.from).toISOString());
  if (params?.to) qp.set("to", new Date(params.to).toISOString());
  const s = qp.toString();
  return s ? `?${s}` : "";
}

export function useStockTransactions(filters = {}, options = {}) {
  const { enabled = true } = options;
  const query = buildQuery(filters);
  return useQuery({
    queryKey: ["stock-transactions", filters],
    queryFn: async () => {
      const res = await fetch(`/api/stock/transactions${query}`);
      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      if (!res.ok) {
        let message = "Failed to fetch stock transactions";
        if (isJson) {
          const body = await res.json().catch(() => null);
          if (body?.error) message = body.error;
        }
        const err = new Error(message);
        err.status = res.status;
        throw err;
      }
      return isJson ? res.json() : [];
    },
    enabled,
    retry: (failureCount, error) => {
      if (error?.status === 401 || error?.status === 403) return false;
      return failureCount < 2;
    },
  });
}
