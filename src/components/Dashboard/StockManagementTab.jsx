import { useState } from "react";
import { Plus } from "lucide-react";
import { useStockManagement } from "@/hooks/useStockManagement";
import { StockTable } from "./StockTable";
import { AddStockForm } from "./AddStockForm";
import { PurchaseStockForm } from "./PurchaseStockForm";
import useUser from "@/utils/useUser";
import { FEATURE_KEYS } from "@/constants/featureFlags";

export function StockManagementTab() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [deletingStockId, setDeletingStockId] = useState(null);

  const { user } = useUser();
  const featureFlags = user?.features ?? {};

  const canManageStock = featureFlags[FEATURE_KEYS.STOCK] !== false;
  const canPurchaseStock = canManageStock;
  const canCreateStock = canManageStock;
  const canEditStock = featureFlags[FEATURE_KEYS.STOCK_EDIT] !== false;
  const canDeleteStock = featureFlags[FEATURE_KEYS.STOCK_DELETE] !== false;

  const {
    stock,
    isLoading,
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Stock Management
        </h2>
        {canCreateStock && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#18B84E] dark:bg-[#16A249] text-white rounded-lg hover:bg-[#16A249] dark:hover:bg-[#14D45D] transition-colors duration-150"
          >
            <Plus className="w-4 h-4" />
            Add Stock Item
          </button>
        )}
      </div>

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

      {showAddForm && (
        <AddStockForm
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddStock}
          loading={addStockLoading}
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
        />
      )}
    </div>
  );
}
