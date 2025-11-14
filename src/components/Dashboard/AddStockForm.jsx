import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export function AddStockForm({
  onClose,
  onSubmit,
  loading,
  initialStock = null,
  mode = "create",
  canConfigureExtraProduction = false,
}) {
  const isEditing = mode === "edit";

  const [formData, setFormData] = useState({
    name: initialStock?.name ?? "",
    description: initialStock?.description ?? "",
    unit: initialStock?.base_unit?.name ?? initialStock?.unit ?? "",
    unit_cost: initialStock?.unit_cost ? String(initialStock.unit_cost) : "",
    supplier: initialStock?.supplier ?? "",
    current_quantity: initialStock?.current_quantity
      ? String(initialStock.current_quantity)
      : "0",
  });
  const [baseUnitId, setBaseUnitId] = useState(initialStock?.base_unit?.id ?? "");
  const [conversions, setConversions] = useState(() =>
    initialStock
      ? (initialStock.units ?? [])
          .filter((unit) => !unit.is_base)
          .map((unit) => ({
            unitId: unit.id ?? unit.unit_id ?? "",
            factor: unit.conversion_factor
              ? String(unit.conversion_factor)
              : unit.factor
                ? String(unit.factor)
                : "",
          }))
      : [],
  );
  const [allowExtraProduction, setAllowExtraProduction] = useState(
    Boolean(initialStock?.allow_extra_production ?? initialStock?.allowExtraProduction ?? false),
  );
  const [extraProductionLimit, setExtraProductionLimit] = useState(
    initialStock?.extra_production_limit !== undefined && initialStock?.extra_production_limit !== null
      ? String(initialStock.extra_production_limit)
      : "0",
  );

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
    setBaseUnitId((current) => {
      if (current) return current;
      const preferred = initialStock?.base_unit?.id;
      if (preferred && baseUnitOptions.some((unit) => unit.id === preferred)) {
        return preferred;
      }
      return baseUnitOptions[0]?.id ?? "";
    });
  }, [baseUnitOptions, initialStock?.base_unit?.id]);

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
      setFormError("Select a base unit from the Unit Catalog before continuing.");
      return;
    }
    if (canConfigureExtraProduction && allowExtraProduction) {
      const parsedLimit = parseFloat(extraProductionLimit);
      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        setFormError("Provide a positive quantity limit for extra production or disable it.");
        return;
      }
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

    if (canConfigureExtraProduction) {
      const parsedLimit = parseFloat(extraProductionLimit);
      const normalizedLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 0;
      payload.allow_extra_production = Boolean(allowExtraProduction) && normalizedLimit > 0;
      payload.extra_production_limit = payload.allow_extra_production ? normalizedLimit : 0;
    }

    if (initialStock?.id) {
      payload.id = initialStock.id;
    }

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

  const title = isEditing ? "Edit Stock Item" : "Add Stock Item";
  const submitLabel = isEditing
    ? loading
      ? "Saving..."
      : "Save Changes"
    : loading
      ? "Adding..."
      : "Add Stock";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 sm:py-10 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-lg bg-white p-0 shadow-xl dark:bg-[#1E1E1E]">
          <div className="max-h-[85vh] overflow-y-auto p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
            {formError ? (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-300">
                {formError}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-[#262626] dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-[#262626] dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Base Unit
                </label>
                <select
                  value={baseUnitId}
                  onChange={(event) => setBaseUnitId(event.target.value)}
                  required
                  disabled={!baseUnitOptions.length}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 disabled:opacity-70 dark:border-gray-600 dark:bg-[#262626] dark:text-white"
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
                {!unitsLoading && !baseUnitOptions.length ? (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    No units found. Add catalog units in the Unit Catalog tab before creating stock.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unit Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.unit_cost}
                  onChange={(event) => setFormData({ ...formData, unit_cost: event.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-[#262626] dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Supplier
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(event) => setFormData({ ...formData, supplier: event.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-[#262626] dark:text-white"
                />
              </div>

              {canConfigureExtraProduction ? (
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-700 dark:bg-[#262626]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Allow extra production usage
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enable this stock item to be requested beyond recipe requirements during production, capped per order.
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={allowExtraProduction}
                        onChange={(event) => {
                          const nextValue = event.target.checked;
                          setAllowExtraProduction(nextValue);
                          if (!nextValue) {
                            setExtraProductionLimit("0");
                          }
                        }}
                      />
                      <span
                        className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${allowExtraProduction ? "bg-[#18B84E]" : "bg-gray-300 dark:bg-gray-600"}`}
                      >
                        <span
                          className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${allowExtraProduction ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </span>
                    </label>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Maximum extra quantity per production order
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={extraProductionLimit}
                      onChange={(event) => setExtraProductionLimit(event.target.value)}
                      disabled={!allowExtraProduction}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 disabled:opacity-60 dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-white"
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Additional Units
                  </label>
                  <button
                    type="button"
                    onClick={addConversionRow}
                    disabled={!canAddConversion}
                    className="text-sm font-medium text-[#18B84E] transition hover:text-[#16A249] disabled:opacity-50 dark:text-[#16A249] dark:hover:text-[#14D45D]"
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
                        className="grid grid-cols-1 items-end gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-700 md:grid-cols-3"
                      >
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Unit
                          </label>
                          <select
                            value={conversion.unitId}
                            onChange={(event) => handleConversionUnitChange(index, event.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-[#262626] dark:text-white"
                          >
                            <option value="">Select unit</option>
                            {baseUnitOptions
                              .filter((option) => option.id !== baseUnitId)
                              .filter((option) =>
                                option.id === conversion.unitId ||
                                conversions.every(
                                  (entry, entryIndex) => entryIndex === index || entry.unitId !== option.id,
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
                          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Contains (base units)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={conversion.factor}
                            onChange={(event) => handleConversionFactorChange(index, event.target.value)}
                            placeholder="e.g. 12"
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-[#262626] dark:text-white"
                          />
                        </div>
                        <div className="flex gap-2 md:justify-end">
                          <button
                            type="button"
                            onClick={() => removeConversionRow(index)}
                            className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-900/30"
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
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedBaseUnit}
                  className="flex-1 rounded-md bg-[#18B84E] px-4 py-2 text-white transition hover:bg-[#16A249] disabled:opacity-50 dark:bg-[#16A249] dark:hover:bg-[#14D45D]"
                >
                  {submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
