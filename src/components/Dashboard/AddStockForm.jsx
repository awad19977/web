import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export function AddStockForm({ onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit: "",
    unit_cost: "",
    supplier: "",
    current_quantity: "0",
  });
  const [baseUnitId, setBaseUnitId] = useState("");
  const [conversions, setConversions] = useState([]);

  const { data: availableUnits = [], isLoading: unitsLoading } = useQuery({
    queryKey: ["stockUnits"],
    queryFn: async () => {
      const response = await fetch("/api/units");
      if (!response.ok) throw new Error("Failed to fetch units");
      return response.json();
    },
  });

  const baseUnitOptions = useMemo(() => {
    return [...availableUnits].sort((a, b) => a.name.localeCompare(b.name));
  }, [availableUnits]);

  useEffect(() => {
    if (!baseUnitOptions.length) return;
    setBaseUnitId((current) => current || baseUnitOptions[0].id);
  }, [baseUnitOptions]);

  const selectedBaseUnit = useMemo(
    () => baseUnitOptions.find((unit) => unit.id === baseUnitId) ?? null,
    [baseUnitId, baseUnitOptions],
  );

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      unit: selectedBaseUnit?.name ?? "",
    }));
  }, [selectedBaseUnit?.name]);

  useEffect(() => {
    if (!baseUnitId) return;
    setConversions((prev) =>
      prev.filter((conversion) => conversion.unitId && conversion.unitId !== baseUnitId),
    );
  }, [baseUnitId]);

  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (selectedBaseUnit) {
      setFormError("");
    }
  }, [selectedBaseUnit?.id]);

  const usedConversionUnitIds = useMemo(() => {
    return new Set(
      conversions
        .map((conversion) => conversion.unitId)
        .filter((unitId) => Boolean(unitId)),
    );
  }, [conversions]);

  const remainingConversionUnits = useMemo(() => {
    return baseUnitOptions.filter(
      (option) => option.id !== baseUnitId && !usedConversionUnitIds.has(option.id),
    );
  }, [baseUnitId, baseUnitOptions, usedConversionUnitIds]);

  const canAddConversion = remainingConversionUnits.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedBaseUnit) {
      setFormError("Select or create a base unit first in the Unit Catalog.");
      return;
    }
    setFormError("");

    const preparedConversions = conversions
      .map((conversion) => ({
        unitId: conversion.unitId,
        factor: conversion.factor ? parseFloat(conversion.factor) : null,
      }))
      .filter(
        (conversion) =>
          conversion.unitId &&
          Number.isFinite(conversion.factor) &&
          conversion.factor > 0,
      )
      .map((conversion) => ({
        id: conversion.unitId,
        factor: conversion.factor,
      }));

    const parsedCost = parseFloat(formData.unit_cost);
    const parsedQuantity = parseFloat(formData.current_quantity);

    const payload = {
      name: formData.name,
      description: formData.description,
      unit: selectedBaseUnit?.name ?? "",
      unit_cost: Number.isFinite(parsedCost) ? parsedCost : 0,
      supplier: formData.supplier,
      current_quantity: Number.isFinite(parsedQuantity) ? parsedQuantity : 0,
      baseUnit: { id: baseUnitId },
      conversions: preparedConversions,
    };

    onSubmit(payload);
  };

  const addConversionRow = () => {
    if (!canAddConversion) return;
    setConversions((prev) => [...prev, { unitId: "", factor: "" }]);
  };

  const removeConversionRow = (index) => {
    setConversions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConversionUnitChange = (index, value) => {
    setConversions((prev) => {
      if (
        value &&
        prev.some((entry, entryIndex) => entryIndex !== index && entry.unitId === value)
      ) {
        return prev;
      }
      const next = [...prev];
      next[index] = {
        ...next[index],
        unitId: value,
      };
      return next;
    });
  };

  const handleConversionFactorChange = (index, value) => {
    setConversions((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        factor: value,
      };
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Add Stock Item
        </h3>
        {formError && (
          <div className="rounded-md border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {formError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              rows="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Base Unit
            </label>
            <select
              value={baseUnitId}
              onChange={(e) => setBaseUnitId(e.target.value)}
              required
              disabled={!baseUnitOptions.length}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white disabled:opacity-70"
            >
              <option value="" disabled={baseUnitOptions.length > 0}>
                {baseUnitOptions.length ? "Select a base unit" : "No units available"}
              </option>
              {baseUnitOptions.map((unitOption) => (
                <option key={unitOption.id} value={unitOption.id}>
                  {unitOption.name}
                  {unitOption.symbol ? ` (${unitOption.symbol})` : ""}
                </option>
              ))}
            </select>
            {!unitsLoading && !baseUnitOptions.length && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                No units found. Add catalog units in the Unit Catalog tab before creating stock.
              </p>
            )}
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Units
              </label>
              <button
                type="button"
                onClick={addConversionRow}
                disabled={!canAddConversion}
                className="text-sm font-medium text-[#18B84E] dark:text-[#16A249] hover:text-[#16A249] dark:hover:text-[#14D45D] disabled:opacity-50"
              >
                Add Unit
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Define how other units relate to the base unit (<strong>{selectedBaseUnit?.name || "?"}</strong>). For example, 1 box = 12 pieces.
            </p>

            {conversions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No alternate units added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {conversions.map((conversion, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end border border-gray-200 dark:border-gray-700 rounded-md p-3"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Unit
                      </label>
                      <select
                        value={conversion.unitId}
                        onChange={(e) => handleConversionUnitChange(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">Select unit</option>
                        {baseUnitOptions
                          .filter((option) => option.id !== baseUnitId)
                          .filter((option) =>
                            option.id === conversion.unitId ||
                            conversions.every(
                              (entry, entryIndex) =>
                                entryIndex === index || entry.unitId !== option.id,
                            ),
                          )
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                              {option.symbol ? ` (${option.symbol})` : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Contains (base units)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={conversion.factor}
                        onChange={(e) => handleConversionFactorChange(index, e.target.value)}
                        placeholder="e.g. 12"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    <div className="flex gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => removeConversionRow(index)}
                        className="px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/40 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              disabled={loading || !selectedBaseUnit}
              className="flex-1 px-4 py-2 bg-[#18B84E] dark:bg-[#16A249] text-white rounded-md hover:bg-[#16A249] dark:hover:bg-[#14D45D] disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
