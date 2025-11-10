export function normalizeUnitMappings(units = []) {
  return units.map((unit) => ({
    id: unit.id ?? unit.unit_id,
    name: unit.name,
    symbol: unit.symbol ?? null,
    conversion_factor: Number(unit.conversion_factor ?? unit.factor ?? 1),
    is_base: Boolean(unit.is_base),
  }));
}

export function getBaseUnit(units = []) {
  const normalized = normalizeUnitMappings(units);
  return (
    normalized.find((unit) => unit.is_base) ??
    normalized.find((unit) => unit.conversion_factor === 1) ??
    null
  );
}

export function convertToBaseQuantity(quantity, unitId, units = []) {
  const amount = Number(quantity);
  if (!Number.isFinite(amount)) return 0;
  if (!unitId) return amount;
  const normalized = normalizeUnitMappings(units);
  const unit = normalized.find((item) => item.id === unitId);
  if (!unit) return amount;
  return amount * (unit.conversion_factor || 1);
}

export function convertFromBaseQuantity(quantity, unitId, units = []) {
  const amount = Number(quantity);
  if (!Number.isFinite(amount)) return 0;
  if (!unitId) return amount;
  const normalized = normalizeUnitMappings(units);
  const unit = normalized.find((item) => item.id === unitId);
  if (!unit || !unit.conversion_factor) return amount;
  return amount / unit.conversion_factor;
}

export function convertPriceToBase(price, unitId, units = []) {
  const value = Number(price);
  if (!Number.isFinite(value)) return 0;
  if (!unitId) return value;
  const normalized = normalizeUnitMappings(units);
  const unit = normalized.find((item) => item.id === unitId);
  if (!unit || !Number.isFinite(unit.conversion_factor) || unit.conversion_factor === 0) {
    return value;
  }
  return value / unit.conversion_factor;
}

export function convertPriceFromBase(price, unitId, units = []) {
  const value = Number(price);
  if (!Number.isFinite(value)) return 0;
  if (!unitId) return value;
  const normalized = normalizeUnitMappings(units);
  const unit = normalized.find((item) => item.id === unitId);
  if (!unit || !Number.isFinite(unit.conversion_factor)) {
    return value;
  }
  return value * unit.conversion_factor;
}
