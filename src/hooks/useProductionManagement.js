import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) ? num : null;
};

const normalizeOrder = (order) => {
  if (!order || typeof order !== "object") {
    return {
      id: null,
      product_id: null,
      product_name: "",
      quantity_to_produce: 0,
      quantity_produced: 0,
      status: "planned",
      production_cost: 0,
      started_at: null,
      completed_at: null,
      created_at: null,
    };
  }

  return {
    ...order,
    id: toInteger(order.id) ?? order.id ?? null,
    product_id: toInteger(order.product_id) ?? order.product_id ?? null,
    quantity_to_produce: toNumber(order.quantity_to_produce),
    quantity_produced: toNumber(order.quantity_produced),
    production_cost: toNumber(order.production_cost),
    status: typeof order.status === "string" ? order.status : "planned",
    started_at: order.started_at ? new Date(order.started_at).toISOString() : null,
    completed_at: order.completed_at ? new Date(order.completed_at).toISOString() : null,
    created_at: order.created_at ? new Date(order.created_at).toISOString() : null,
  };
};

const fetchProductionOrders = async () => {
  const response = await fetch("/api/production-orders");
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : "Failed to fetch production orders";
    const requestError = new Error(message);
    requestError.status = response.status;
    throw requestError;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.orders)) {
    return payload.orders;
  }

  return [];
};

const normalizeOrders = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((order) => normalizeOrder(order));
};

export function useProductionManagement() {
  const queryClient = useQueryClient();

  const {
    data: orders = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["productionOrders"],
    queryFn: fetchProductionOrders,
    select: normalizeOrders,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/production-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let body = null;
      try {
        body = await response.json();
      } catch (error) {
        body = null;
      }

      if (!response.ok) {
        const message =
          body && typeof body.error === "string"
            ? body.error
            : "Failed to create production order";
        const requestError = new Error(message);
        requestError.status = response.status;
        throw requestError;
      }

      return normalizeOrder(body?.order ?? body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionOrders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async ({ orderId, ...payload }) => {
      if (!orderId) {
        throw new Error("orderId is required to update a production order");
      }

      const response = await fetch(`/api/production-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let body = null;
      try {
        body = await response.json();
      } catch (error) {
        body = null;
      }

      if (!response.ok) {
        const message =
          body && typeof body.error === "string"
            ? body.error
            : "Failed to update production order";
        const requestError = new Error(message);
        requestError.status = response.status;
        throw requestError;
      }

      return normalizeOrder(body?.order ?? body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionOrders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["stockCatalog"] });
    },
  });

  return {
    orders,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    createOrder: createOrderMutation.mutate,
    createOrderAsync: createOrderMutation.mutateAsync,
    createOrderLoading: createOrderMutation.isLoading,
    completeOrder: completeOrderMutation.mutate,
    completeOrderAsync: completeOrderMutation.mutateAsync,
    completeOrderLoading: completeOrderMutation.isLoading,
  };
}
