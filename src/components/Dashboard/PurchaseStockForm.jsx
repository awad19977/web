import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useI18n } from '@/i18n';
import {
  convertPriceFromBase,
  convertPriceToBase,
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

  const formatCost = (value) =>
    Number.isFinite(value) ? value.toFixed(2) : "";

  const initialBaseCost = useMemo(() => {
    const numeric = Number(stock.unit_cost ?? 0);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  }, [stock.unit_cost]);

  const [selectedUnitId, setSelectedUnitId] = useState(baseUnit?.id ?? null);
  const [quantity, setQuantity] = useState("");
  const [baseUnitCost, setBaseUnitCost] = useState(initialBaseCost);
  const [unitCostInput, setUnitCostInput] = useState(formatCost(initialBaseCost));
  const [supplier, setSupplier] = useState(stock.supplier || "");
  const [notes, setNotes] = useState("");

  const baseUnitCostRef = useRef(baseUnitCost);

  useEffect(() => {
    baseUnitCostRef.current = baseUnitCost;
  }, [baseUnitCost]);

  useEffect(() => {
    setBaseUnitCost(initialBaseCost);
    setUnitCostInput(formatCost(initialBaseCost));
  }, [initialBaseCost]);

  useEffect(() => {
    const nextUnitId = baseUnit?.id ?? null;
    setSelectedUnitId(nextUnitId);
    const converted = convertPriceFromBase(
      baseUnitCostRef.current,
      nextUnitId,
      normalizedUnits,
    );
    setUnitCostInput(formatCost(converted));
  }, [baseUnit?.id, normalizedUnits]);

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

  const { t } = useI18n();
  const L = useCallback(
    (key, fallback) => {
      try {
        const value = t(key);
        if (!value || value === key) return fallback;
        return value;
      } catch (err) {
        return fallback;
      }
    },
    [t]
  );

  const baseUnitLabel = baseUnit?.name ?? stock.unit ?? L('purchase.base_unit_label', 'base units');
  const selectedUnitLabel = selectedUnit?.name ?? baseUnitLabel;

  const handleUnitChange = (rawValue) => {
    const parsedUnitId = parseUnitId(rawValue);
    setSelectedUnitId(parsedUnitId);
    const converted = convertPriceFromBase(
      baseUnitCost,
      parsedUnitId,
      normalizedUnits,
    );
    setUnitCostInput(formatCost(converted));
  };

  const handleUnitCostChange = (nextValue) => {
    setUnitCostInput(nextValue);
    const parsedCost = Number(nextValue);
    if (!Number.isFinite(parsedCost) || parsedCost <= 0) {
      return;
    }
    const normalizedBase = convertPriceToBase(
      parsedCost,
      selectedUnitId ?? null,
      normalizedUnits,
    );
    if (Number.isFinite(normalizedBase) && normalizedBase > 0) {
      setBaseUnitCost(normalizedBase);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      stock_id: stock.id,
      quantity: parseFloat(quantity),
      unit_cost: parseFloat(unitCostInput),
      supplier,
      notes,
      unit_id: selectedUnitId ?? undefined,
    });
  };

  const totalCost =
    (parseFloat(quantity) || 0) * (parseFloat(unitCostInput) || 0);

  const baseQuantity = convertToBaseQuantity(
    quantity,
    selectedUnitId,
    normalizedUnits,
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {t('purchase.title', { name: stock.name })}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('purchase.unit')}
            </label>
            <select
              value={selectedUnitId ?? ""}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
            >
              {normalizedUnits.map((unit) => (
                <option key={`${unit.id ?? "base"}`} value={unit.id ?? ""}>
                  {unit.name}
                  {unit.symbol ? ` (${unit.symbol})` : ""}
                  {unit.is_base ? L('purchase.base_suffix', ' (base)') : ""}
                </option>
              ))}
            </select>
            {selectedUnit && !selectedUnit.is_base && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {L('purchase.unit_conversion', '1 {unit} = {factor} {baseUnit}', {
                  unit: selectedUnit.name,
                  factor: selectedUnit.conversion_factor,
                  baseUnit: baseUnitLabel,
                })}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('purchase.quantity_label', { unit: selectedUnit?.name ?? baseUnitLabel })}
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('purchase.unit_cost_label', { unit: selectedUnitLabel })}
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={unitCostInput}
              onChange={(e) => handleUnitCostChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('purchase.supplier')}
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('purchase.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              rows="2"
            />
          </div>
            <div className="bg-gray-50 dark:bg-[#262626] p-3 rounded-md space-y-1">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('purchase.base_quantity')}: {" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {Number.isFinite(baseQuantity)
                  ? baseQuantity.toFixed(2)
                  : "0.00"} {baseUnitLabel}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('purchase.cost_per_base_unit')}: {" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {L('purchase.currency_symbol', '$')}{Number.isFinite(baseUnitCost) ? baseUnitCost.toFixed(2) : "0.00"}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('purchase.total_cost')}: {" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {L('purchase.currency_symbol', '$')}{totalCost.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#18B84E] dark:bg-[#16A249] text-white rounded-md hover:bg-[#16A249] dark:hover:bg-[#14D45D] disabled:opacity-50"
            >
              {loading ? t('purchase.purchasing') : t('purchase.purchase')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
