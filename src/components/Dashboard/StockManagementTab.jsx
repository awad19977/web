import { useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, SlidersHorizontal } from "lucide-react";
import { useStockManagement } from "@/hooks/useStockManagement";
import { StockTable } from "./StockTable";
import { AddStockForm } from "./AddStockForm";
import { PurchaseStockForm } from "./PurchaseStockForm";
import useUser from "@/utils/useUser";
import { FEATURE_KEYS } from "@/constants/featureFlags";
import { useStockAdjustments } from "@/hooks/useStockAdjustments";
import { RequestStockAdjustmentForm } from "./RequestStockAdjustmentForm";
import { PendingStockAdjustments } from "./PendingStockAdjustments";

export function StockManagementTab() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [deletingStockId, setDeletingStockId] = useState(null);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [resolvingAdjustmentId, setResolvingAdjustmentId] = useState(null);
  const [adjustmentBanner, setAdjustmentBanner] = useState(null);

  const { user } = useUser();
  const featureFlags = user?.features ?? {};

  const canManageStock = featureFlags[FEATURE_KEYS.STOCK] !== false;
  const canPurchaseStock = canManageStock;
  const canCreateStock = canManageStock;
  const canEditStock = featureFlags[FEATURE_KEYS.STOCK_EDIT] !== false;
  const canDeleteStock = featureFlags[FEATURE_KEYS.STOCK_DELETE] !== false;
  const canConfigureExtraProduction = featureFlags[FEATURE_KEYS.STOCK_EXTRA_CONFIG] === true;
  const canRequestAdjustment = featureFlags[FEATURE_KEYS.STOCK_ADJUST] === true;
  const canApproveAdjustments = featureFlags[FEATURE_KEYS.STOCK_ADJUST_APPROVE] === true;

  const {
    stock,
    addStock,
    addStockLoading,
    purchaseStock,
    purchaseStockLoading,
    updateStock,
    updateStockLoading,
    deleteStock,
    deleteStockLoading,
  } = useStockManagement();

  const handleAddStock = (data) => {
    addStock(data, {
      onSuccess: () => setShowAddForm(false),
    });
  };

  const handlePurchaseStock = (data) => {
    purchaseStock(data, {
      onSuccess: () => {
        setShowPurchaseForm(false);
        setSelectedStock(null);
      },
    });
  };

  const handlePurchaseClick = (item) => {
    if (!canPurchaseStock) return;
    setSelectedStock(item);
    setShowPurchaseForm(true);
  };

  const handleEditSubmit = (data) => {
    updateStock(data, {
      onSuccess: () => {
        setShowEditForm(false);
        setEditingStock(null);
      },
    });
  };

  const handleEditClick = (item) => {
    if (!canEditStock) return;
    setEditingStock(item);
    setShowEditForm(true);
  };

  const handleDeleteClick = (item) => {
    if (!canDeleteStock) return;
    let confirmed = true;
    if (typeof window !== "undefined") {
      confirmed = window.confirm(
        `Delete ${item.name}? This will remove the stock record but retain purchase history.`,
      );
    }
    if (!confirmed) return;

    setDeletingStockId(item.id);
    deleteStock(item.id, {
      onSuccess: () => {
        setDeletingStockId(null);
      },
      onError: () => {
        setDeletingStockId(null);
      },
    });
  };

  const [adjustmentsStatus, setAdjustmentsStatus] = useState("pending");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const {
    adjustments,
    adjustmentsLoading,
    adjustmentsError,
    refetchAdjustments,
    createAdjustment,
    creatingAdjustment,
    resolveAdjustment,
    resolvingAdjustment,
  } = useStockAdjustments({
    status: adjustmentsStatus,
    enabled: canApproveAdjustments || canRequestAdjustment,
    search: filterSearch,
    from: filterFrom,
    to: filterTo,
  });

  const handleCreateAdjustment = (payload) => {
    setAdjustmentBanner(null);
    createAdjustment(payload, {
      onSuccess: () => {
        setShowAdjustmentForm(false);
        setAdjustmentBanner({ type: "success", message: "Adjustment request submitted for review." });
      },
      onError: (error) => {
        setAdjustmentBanner({ type: "error", message: error?.message ?? "Unable to submit adjustment." });
      },
    });
  };

  const handleResolveAdjustment = (adjustment, action) => {
    if (!adjustment?.id) return;
    const promptLabel = action === "approve" ? "Add approval notes (optional)" : "Reason for rejection (optional)";
    let notes = "";

    if (typeof window !== "undefined") {
      const response = window.prompt(promptLabel, "");
      if (response === null) {
        return;
      }
      notes = response;
    }

    setAdjustmentBanner(null);
    setResolvingAdjustmentId(adjustment.id);
    resolveAdjustment(
      { adjustmentId: adjustment.id, action, notes },
      {
        onSuccess: () => {
          setResolvingAdjustmentId(null);
          setAdjustmentBanner({
            type: "success",
            message: action === "approve" ? "Adjustment approved." : "Adjustment rejected.",
          });
        },
        onError: (error) => {
          setResolvingAdjustmentId(null);
          setAdjustmentBanner({ type: "error", message: error?.message ?? "Unable to update adjustment." });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Stock Management
        </h2>
        <div className="flex items-center gap-3">
          {canRequestAdjustment ? (
            <button
              onClick={() => {
                setAdjustmentBanner(null);
                setShowAdjustmentForm(true);
              }}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Adjust Quantity
            </button>
          ) : null}
          {canCreateStock ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#18B84E] dark:bg-[#16A249] text-white rounded-lg hover:bg-[#16A249] dark:hover:bg-[#14D45D] transition-colors duration-150"
            >
              <Plus className="w-4 h-4" />
              Add Stock Item
            </button>
          ) : null}
        </div>
      </div>

      {adjustmentBanner ? (
        <div
          className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            adjustmentBanner.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {adjustmentBanner.type === "error" ? (
            <AlertTriangle className="mt-0.5 h-4 w-4" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
          )}
          <div className="flex-1">
            <p className="font-medium">{adjustmentBanner.message}</p>
            <button
              type="button"
              onClick={() => setAdjustmentBanner(null)}
              className="mt-1 text-xs font-semibold uppercase tracking-wide hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <StockTable
        stock={stock}
        onPurchaseClick={handlePurchaseClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        canPurchase={canPurchaseStock}
        canEdit={canEditStock}
        canDelete={canDeleteStock}
        deletingStockId={deletingStockId && deleteStockLoading ? deletingStockId : null}
      />

      {canApproveAdjustments || canRequestAdjustment ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock adjustments</h3>
              <div className="ml-2 inline-flex overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                {(["pending","approved","rejected"]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAdjustmentsStatus(key)}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                      adjustmentsStatus === key
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-[#1E1E1E] dark:text-gray-300 dark:hover:bg-[#262626]"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Search name/user/reason"
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-gray-700 dark:bg-[#1E1E1E] dark:text-gray-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-[#1E1E1E] dark:text-gray-100"
                  aria-label="From date"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-[#1E1E1E] dark:text-gray-100"
                  aria-label="To date"
                />
              </div>
              {adjustmentsLoading ? <span className="text-sm text-gray-500">Loading…</span> : null}
            </div>
          </div>
          <PendingStockAdjustments
            adjustments={adjustments}
            loadingAdjustmentId={resolvingAdjustment ? resolvingAdjustmentId : null}
            onApprove={
              canApproveAdjustments && adjustmentsStatus === "pending"
                ? (adjustment) => handleResolveAdjustment(adjustment, "approve")
                : undefined
            }
            onReject={
              canApproveAdjustments && adjustmentsStatus === "pending"
                ? (adjustment) => handleResolveAdjustment(adjustment, "reject")
                : undefined
            }
            readOnly={!(canApproveAdjustments && adjustmentsStatus === "pending")}
            error={adjustmentsError ? adjustmentsError.message : null}
            onRetry={refetchAdjustments}
          />
        </div>
      ) : null}

      {showAddForm && (
        <AddStockForm
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddStock}
          loading={addStockLoading}
          canConfigureExtraProduction={canConfigureExtraProduction}
        />
      )}

      {showPurchaseForm && selectedStock && (
        <PurchaseStockForm
          stock={selectedStock}
          onClose={() => {
            setShowPurchaseForm(false);
            setSelectedStock(null);
          }}
          onSubmit={handlePurchaseStock}
          loading={purchaseStockLoading}
        />
      )}

      {showEditForm && editingStock && (
        <AddStockForm
          onClose={() => {
            setShowEditForm(false);
            setEditingStock(null);
          }}
          onSubmit={handleEditSubmit}
          loading={updateStockLoading}
          initialStock={editingStock}
          mode="edit"
          canConfigureExtraProduction={canConfigureExtraProduction}
        />
      )}

      {showAdjustmentForm && canRequestAdjustment ? (
        <RequestStockAdjustmentForm
          stock={stock}
          onSubmit={handleCreateAdjustment}
          onClose={() => {
            if (!creatingAdjustment) {
              setShowAdjustmentForm(false);
            }
          }}
          loading={creatingAdjustment}
        />
      ) : null}
    </div>
  );
}
