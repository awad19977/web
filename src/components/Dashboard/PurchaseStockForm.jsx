import { useEffect, useMemo, useState } from "react";
import {
  convertToBaseQuantity,
  normalizeUnitMappings,
} from "@/utils/unitConversion";

export function PurchaseStockForm({ stock, onClose, onSubmit, loading }) {
  const normalizedUnits = useMemo(() => {
    const normalized = normalizeUnitMappings(stock.units ?? []);
    const deduped = [];
    const seenKeys = new Set();

    const addUnit = (unit) => {
      if (!unit || !unit.name) return;
      const key = unit.id ?? `name:${unit.name}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      deduped.push({
        ...unit,
        conversion_factor: Number(unit.conversion_factor ?? 1),
        is_base: Boolean(unit.is_base),
      });
    };

    addUnit(
      stock.base_unit
        ? {
            id: stock.base_unit.id ?? stock.base_unit.unit_id ?? null,
            name: stock.base_unit.name ?? stock.unit ?? "",
            symbol: stock.base_unit.symbol ?? null,
            conversion_factor: Number(stock.base_unit.conversion_factor ?? 1),
            is_base: true,
          }
        : null,
    );

    normalized.forEach(addUnit);

    if (deduped.length === 0 && stock.unit) {
      addUnit({
        id: null,
        name: stock.unit,
        symbol: null,
        conversion_factor: 1,
        is_base: true,
      });
    }

    return deduped;
  }, [stock.base_unit, stock.unit, stock.units]);

  const baseUnit = useMemo(() => {
    if (!normalizedUnits.length) return null;
    return (
      normalizedUnits.find((unit) => unit.is_base) ??
      normalizedUnits.find((unit) => unit.conversion_factor === 1) ??
      normalizedUnits[0]
    );
  }, [normalizedUnits]);

  const [selectedUnitId, setSelectedUnitId] = useState(baseUnit?.id ?? null);
  const [formData, setFormData] = useState({
    quantity: "",
    unit_cost: stock.unit_cost.toString(),
    supplier: stock.supplier || "",
    notes: "",
  });

  useEffect(() => {
    setSelectedUnitId(baseUnit?.id ?? null);
  }, [baseUnit?.id]);

  const parseUnitId = (value) => {
    if (value === "") return null;
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? value : numericValue;
  };

  const selectedUnit = useMemo(() => {
    if (selectedUnitId === null) return baseUnit ?? null;
    return (
      normalizedUnits.find((unit) => unit.id === selectedUnitId) ??
      baseUnit ??
      null
    );
  }, [baseUnit, normalizedUnits, selectedUnitId]);

  const baseUnitLabel = baseUnit?.name ?? stock.unit ?? "base units";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      stock_id: stock.id,
      quantity: parseFloat(formData.quantity),
      unit_cost: parseFloat(formData.unit_cost),
      supplier: formData.supplier,
      notes: formData.notes,
      unit_id: selectedUnitId ?? undefined,
    });
  };

  const totalCost =
    (parseFloat(formData.quantity) || 0) *
    (parseFloat(formData.unit_cost) || 0);

  const baseQuantity = convertToBaseQuantity(
    formData.quantity,
    selectedUnitId,
    normalizedUnits,
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Purchase {stock.name}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unit
            </label>
            <select
              value={selectedUnitId ?? ""}
              onChange={(e) => setSelectedUnitId(parseUnitId(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
            >
              {normalizedUnits.map((unit) => (
                <option key={`${unit.id ?? "base"}`} value={unit.id ?? ""}>
                  {unit.name}
                  {unit.symbol ? ` (${unit.symbol})` : ""}
                  {unit.is_base ? " (base)" : ""}
                </option>
              ))}
            </select>
            {selectedUnit && !selectedUnit.is_base && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                1 {selectedUnit.name} = {selectedUnit.conversion_factor} {baseUnitLabel}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity ({selectedUnit?.name ?? baseUnitLabel})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unit Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.unit_cost}
              onChange={(e) =>
                setFormData({ ...formData, unit_cost: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Supplier
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) =>
                setFormData({ ...formData, supplier: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              rows="2"
            />
          </div>
          <div className="bg-gray-50 dark:bg-[#262626] p-3 rounded-md space-y-1">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Base Quantity:{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {Number.isFinite(baseQuantity)
                  ? baseQuantity.toFixed(2)
                  : "0.00"} {baseUnitLabel}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Cost:{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                ${totalCost.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#18B84E] dark:bg-[#16A249] text-white rounded-md hover:bg-[#16A249] dark:hover:bg-[#14D45D] disabled:opacity-50"
            >
              {loading ? "Purchasing..." : "Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
