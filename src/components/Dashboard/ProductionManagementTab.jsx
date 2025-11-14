import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Factory, Loader2, Plus } from "lucide-react";
import { useProductionManagement } from "@/hooks/useProductionManagement";
import useUser from "@/utils/useUser";
import { FEATURE_KEYS } from "@/constants/featureFlags";
import { useProductManagement } from "@/hooks/useProductManagement";
import { CreateProductionOrderForm } from "./CreateProductionOrderForm";
import { ProductionOrdersTable } from "./ProductionOrdersTable";
import { CompleteProductionOrderForm } from "./CompleteProductionOrderForm";

const parseCompletedQuantity = (initialValue) => {
  if (typeof window === "undefined") return null;

  const promptValue = window.prompt(
    "Enter the quantity produced for this order",
    initialValue !== undefined && initialValue !== null ? String(initialValue) : ""
  );

  if (promptValue === null) return null;

  const quantity = Number(promptValue.trim());
  if (!Number.isFinite(quantity) || quantity < 0) {
    return undefined;
  }

  return quantity;
};

const getErrorMessage = (error) => {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  return "Something went wrong";
};

export function ProductionManagementTab() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [formError, setFormError] = useState(null);
  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [completingOrder, setCompletingOrder] = useState(null);
  const { user } = useUser();
  const featureFlags = user?.features ?? {};
  const allowExtras = featureFlags[FEATURE_KEYS.PRODUCTION_EXTRA] !== false;

  const {
    orders,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    createOrder,
    createOrderLoading,
    completeOrder,
    completeOrderLoading,
  } = useProductionManagement();

  const {
    products,
    isLoading: productsLoading,
    isError: productsLoadFailed,
    error: productsError,
  } = useProductManagement();

  const createDisabled = productsLoading || productsLoadFailed || products.length === 0;

  const handleOpenForm = () => {
    setFormError(null);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setFormError(null);
    setShowCreateForm(false);
  };

  const handleCreateOrder = useCallback(
    (payload) => {
      if (!payload?.product_id || !payload?.quantity_to_produce) {
        setFormError("Select a product and quantity to produce");
        return;
      }

      createOrder(payload, {
        onSuccess: (order) => {
          setFeedback({
            type: "success",
            message: `Created production order for ${order?.product_name ?? "product"}.`,
          });
          setShowCreateForm(false);
        },
        onError: (mutationError) => {
          setFormError(getErrorMessage(mutationError));
        },
      });
    },
    [createOrder]
  );

  const handleCompleteOrder = useCallback((order) => {
    if (!order?.id) return;
    if ((order?.status ?? 'planned') !== 'planned') {
      setFeedback({ type: 'error', message: 'Cannot change an order once it has progressed beyond planned.' });
      return;
    }
    setCompletingOrder(order);
  }, []);

  const [actioningOrder, setActioningOrder] = useState(null);
  const [actionType, setActionType] = useState(null); // 'cancel' | 'fail'
  const [actionReason, setActionReason] = useState("");

  const handleCancelOrder = useCallback((order) => {
    if (!order?.id) return;
    if ((order?.status ?? 'planned') !== 'planned') {
      setFeedback({ type: 'error', message: 'Cannot change an order once it has progressed beyond planned.' });
      return;
    }
    setActioningOrder(order);
    setActionType("cancel");
    setActionReason("");
  }, []);

  const handleFailOrder = useCallback((order) => {
    if (!order?.id) return;
    if ((order?.status ?? 'planned') !== 'planned') {
      setFeedback({ type: 'error', message: 'Cannot change an order once it has progressed beyond planned.' });
      return;
    }
    setActioningOrder(order);
    setActionType("fail");
    setActionReason("");
  }, []);

  const handleSubmitAction = useCallback(() => {
    if (!actioningOrder?.id || !actionType) return;
    const status = actionType === "cancel" ? "cancelled" : "failed";
    if (!actionReason || String(actionReason).trim() === "") {
      setFeedback({ type: "error", message: "Reason is required" });
      return;
    }
    setCompletingOrderId(actioningOrder.id);
    completeOrder(
      { orderId: actioningOrder.id, status, reason: actionReason.trim() },
      {
        onSuccess: () => {
          setFeedback({ type: "success", message: `${actioningOrder?.product_name ?? 'Order'} marked as ${status}.` });
          setActioningOrder(null);
          setActionType(null);
          setActionReason("");
          setCompletingOrderId(null);
        },
        onError: (mutationError) => {
          setFeedback({ type: "error", message: getErrorMessage(mutationError) });
          setCompletingOrderId(null);
        },
      }
    );
  }, [actionType, actionReason, actioningOrder, completeOrder]);

  const handleSubmitCompletion = useCallback(
    ({ quantity_produced, extras = [] }) => {
      if (!completingOrder?.id) return;
      setCompletingOrderId(completingOrder.id);
      completeOrder(
        {
          orderId: completingOrder.id,
          status: "completed",
          quantity_produced,
          extras,
        },
        {
          onSuccess: () => {
            setFeedback({
              type: "success",
              message: `Marked ${completingOrder?.product_name ?? "Order"} as completed.`,
            });
            setCompletingOrder(null);
            setCompletingOrderId(null);
          },
          onError: (mutationError) => {
            setFeedback({
              type: "error",
              message: getErrorMessage(mutationError),
            });
            setCompletingOrderId(null);
          },
        }
      );
    },
    [completeOrder, completingOrder]
  );

  const feedbackStyle = useMemo(() => {
    if (!feedback) return null;
    if (feedback.type === "error") {
      return {
        container: "border border-rose-200 bg-rose-50 text-rose-700",
        icon: AlertTriangle,
      };
    }
    return {
      container: "border border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    };
  }, [feedback]);

  const feedbackIcon = feedbackStyle?.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Factory className="h-5 w-5 text-blue-600" />
            Production orders
          </h2>
          <p className="text-sm text-gray-500">
            Plan and track batches using product recipes to ensure stock stays accurate.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenForm}
          disabled={createDisabled}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createOrderLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New production order
        </button>
      </div>

      {productsLoadFailed ? (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div>
            <h3 className="font-semibold">Unable to load products</h3>
            <p className="text-sm opacity-90">
              {getErrorMessage(productsError) || "Verify the product catalog before creating orders."}
            </p>
          </div>
        </div>
      ) : null}

      {feedback && feedbackStyle ? (
        <div className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${feedbackStyle.container}`}>
          {feedbackIcon ? <feedbackIcon className="mt-0.5 h-4 w-4" /> : null}
          <div className="flex-1">
            <p className="font-medium">{feedback.message}</p>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="mt-1 text-xs font-semibold uppercase tracking-wide hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <ProductionOrdersTable
        orders={orders}
        loading={isLoading}
        fetching={isFetching}
        error={getErrorMessage(error)}
        onRetry={() => refetch()}
        onComplete={handleCompleteOrder}
        onCancel={handleCancelOrder}
        onFail={handleFailOrder}
        completingOrderId={completeOrderLoading ? completingOrderId : null}
      />

      {showCreateForm ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <CreateProductionOrderForm
            products={products}
            productsLoading={productsLoading}
            onSubmit={handleCreateOrder}
            onClose={handleCloseForm}
            isSubmitting={createOrderLoading}
            submitError={formError}
          />
        </div>
      ) : null}

      {completingOrder ? (
        <CompleteProductionOrderForm
          order={completingOrder}
          onSubmit={handleSubmitCompletion}
          onClose={() => setCompletingOrder(null)}
          isSubmitting={completeOrderLoading && completingOrderId === completingOrder.id}
          allowExtras={allowExtras}
        />
      ) : null}

      {actioningOrder ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {actionType === 'cancel' ? 'Cancel Production Order' : 'Mark Production Order Failed'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Provide a reason (required).</p>
            <textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button onClick={() => { setActioningOrder(null); setActionType(null); setActionReason(''); }} className="px-3 py-2 border rounded-md">Cancel</button>
              <button onClick={handleSubmitAction} className="px-3 py-2 bg-rose-600 text-white rounded-md">Confirm</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
