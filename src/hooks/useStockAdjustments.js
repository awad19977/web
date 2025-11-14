import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const normalizeAdjustment = (adjustment) => {
  if (!adjustment || typeof adjustment !== "object") {
    return null;
  }

  return {
    ...adjustment,
    id: Number(adjustment.id ?? 0),
    stock_id: Number(adjustment.stock_id ?? 0),
    quantity: Number(adjustment.quantity ?? 0),
    status: typeof adjustment.status === "string" ? adjustment.status : "pending",
    adjustment_type: typeof adjustment.adjustment_type === "string"
      ? adjustment.adjustment_type
      : typeof adjustment.adjustmentType === "string"
        ? adjustment.adjustmentType
        : "increase",
    created_at: adjustment.created_at ?? null,
    updated_at: adjustment.updated_at ?? null,
    resolved_at: adjustment.resolved_at ?? null,
  };
};

const summarizeRawBody = (raw) => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("<")) {
    return "Server returned an HTML error response.";
  }

  const snippet = trimmed.slice(0, 140);
  return snippet.length === trimmed.length ? snippet : `${snippet}…`;
};

const readResponseBody = async (response) => {
  const contentType = response.headers?.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (isJson) {
    try {
      const json = await response.json();
      return { json, raw: null, isJson, parseError: null };
    } catch (error) {
      return { json: null, raw: null, isJson, parseError: error };
    }
  }

  try {
    const raw = await response.text();
    return { json: null, raw, isJson: false, parseError: null };
  } catch (error) {
    return { json: null, raw: null, isJson: false, parseError: error };
  }
};

export function useStockAdjustments(options = {}) {
  const {
    status = "pending",
    enabled = true,
    search = "",
    from = "",
    to = "",
  } = options;

  const queryClient = useQueryClient();

  const adjustmentsQuery = useQuery({
    queryKey: ["stockAdjustments", { status, search, from, to }],
    enabled,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (status) {
        searchParams.set("status", status);
      }
      if (search) {
        searchParams.set("q", search);
      }
      if (from) {
        searchParams.set("from", from);
      }
      if (to) {
        searchParams.set("to", to);
      }
      const response = await fetch(`/api/stock/adjustments?${searchParams.toString()}`);
      const { json, raw, parseError, isJson } = await readResponseBody(response);

      if (!response.ok) {
        const message = json?.error
          ?? summarizeRawBody(raw)
          ?? (parseError ? parseError.message : null)
          ?? "Failed to load stock adjustments";
        const error = new Error(message);
        error.status = response.status;
        throw error;
      }

      if (!isJson || parseError || !json || !Array.isArray(json.adjustments)) {
        const detail = parseError?.message ?? summarizeRawBody(raw);
        const base = "Unexpected response while loading adjustments.";
        const error = new Error(detail ? `${base} ${detail}` : base);
        error.status = response.status;
        throw error;
      }

      return json.adjustments
        .map((entry) => normalizeAdjustment(entry))
        .filter(Boolean);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body) => {
      const response = await fetch("/api/stock/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const { json, raw, parseError, isJson } = await readResponseBody(response);

      if (!response.ok) {
        const message = json?.error
          ?? summarizeRawBody(raw)
          ?? (parseError ? parseError.message : null)
          ?? "Unable to create stock adjustment";
        const requestError = new Error(message);
        requestError.status = response.status;
        throw requestError;
      }

      if (!isJson || parseError || !json?.adjustment) {
        const detail = parseError?.message ?? summarizeRawBody(raw);
        const message = detail
          ? `Received unexpected response while creating adjustment. ${detail}`
          : "Received unexpected response while creating adjustment.";
        const requestError = new Error(message);
        requestError.status = response.status;
        throw requestError;
      }

      return normalizeAdjustment(json.adjustment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockAdjustments"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ adjustmentId, action, notes }) => {
      if (!adjustmentId) {
        throw new Error("adjustmentId is required");
      }

      const response = await fetch(`/api/stock/adjustments/${adjustmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });

      const { json, raw, parseError, isJson } = await readResponseBody(response);

      if (!response.ok) {
        const message = json?.error
          ?? summarizeRawBody(raw)
          ?? (parseError ? parseError.message : null)
          ?? "Unable to update stock adjustment";
        const requestError = new Error(message);
        requestError.status = response.status;
        throw requestError;
      }

      if (!isJson || parseError || !json?.adjustment) {
        const detail = parseError?.message ?? summarizeRawBody(raw);
        const message = detail
          ? `Received unexpected response while updating adjustment. ${detail}`
          : "Received unexpected response while updating adjustment.";
        const requestError = new Error(message);
        requestError.status = response.status;
        throw requestError;
      }

      return normalizeAdjustment(json.adjustment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockAdjustments"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });

  return {
    adjustments: adjustmentsQuery.data ?? [],
    adjustmentsLoading: adjustmentsQuery.isLoading,
    adjustmentsError: adjustmentsQuery.isError ? adjustmentsQuery.error : null,
    refetchAdjustments: adjustmentsQuery.refetch,
    createAdjustment: createMutation.mutate,
    createAdjustmentAsync: createMutation.mutateAsync,
    creatingAdjustment: createMutation.isLoading,
    resolveAdjustment: resolveMutation.mutate,
    resolveAdjustmentAsync: resolveMutation.mutateAsync,
    resolvingAdjustment: resolveMutation.isLoading,
  };
}
