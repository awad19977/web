import { useState } from "react";
import { Plus } from "lucide-react";
import { useStockManagement } from "@/hooks/useStockManagement";
import { StockTable } from "./StockTable";
import { AddStockForm } from "./AddStockForm";
import { PurchaseStockForm } from "./PurchaseStockForm";

export function StockManagementTab() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  const {
    stock,
    isLoading,
    addStock,
    addStockLoading,
    purchaseStock,
    purchaseStockLoading,
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
    setSelectedStock(item);
    setShowPurchaseForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Stock Management
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#18B84E] dark:bg-[#16A249] text-white rounded-lg hover:bg-[#16A249] dark:hover:bg-[#14D45D] transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          Add Stock Item
        </button>
      </div>

      <StockTable stock={stock} onPurchaseClick={handlePurchaseClick} />

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
    </div>
  );
}
