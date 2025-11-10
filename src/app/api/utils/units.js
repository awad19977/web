import sql from "./sql";

const DEFAULT_SYMBOL = null;

export async function getOrCreateUnit(runner, name, symbol = DEFAULT_SYMBOL) {
  const normalizedName = name?.trim();
  if (!normalizedName) {
    throw new Error("Unit name is required");
  }
  const [unit] = await runner`
    INSERT INTO stock_units (name, symbol)
    VALUES (${normalizedName}, ${symbol ?? DEFAULT_SYMBOL})
    ON CONFLICT (name)
    DO UPDATE SET symbol = COALESCE(EXCLUDED.symbol, stock_units.symbol), updated_at = NOW()
    RETURNING id, name, symbol
  `;
  return unit;
}

export async function getUnitById(runner, id) {
  if (!id) return null;
  const [unit] = await runner`
    SELECT id, name, symbol
    FROM stock_units
    WHERE id = ${id}
  `;
  return unit ?? null;
}

export async function ensureStockUnitMapping({
  runner = sql,
  stockId,
  unitId,
  conversionFactor,
  isBase = false,
}) {
  if (!stockId) throw new Error("stockId is required");
  if (!unitId) throw new Error("unitId is required");
  const normalizedFactor = Number(conversionFactor);
  if (!Number.isFinite(normalizedFactor) || normalizedFactor <= 0) {
    throw new Error("conversionFactor must be a positive number");
  }

  const [mapping] = await runner`
    INSERT INTO stock_unit_conversions (stock_id, unit_id, conversion_factor, is_base)
    VALUES (${stockId}, ${unitId}, ${normalizedFactor}, ${isBase})
    ON CONFLICT (stock_id, unit_id)
    DO UPDATE SET conversion_factor = EXCLUDED.conversion_factor,
                  is_base = EXCLUDED.is_base,
                  updated_at = NOW()
    RETURNING id, stock_id, unit_id, conversion_factor, is_base
  `;
  return mapping;
}

export async function upsertStockUnits({
  runner = sql,
  stockId,
  baseUnit,
  conversions = [],
}) {
  if (!stockId) throw new Error("stockId is required for upsertStockUnits");

  const units = [];

  let baseUnitRecord = null;
  if (!baseUnit?.id) {
    throw new Error("Base unit id is required");
  }

  baseUnitRecord = await getUnitById(runner, baseUnit.id);
  if (!baseUnitRecord) {
    throw new Error("Base unit not found");
  }

  await ensureStockUnitMapping({
    runner,
    stockId,
    unitId: baseUnitRecord.id,
    conversionFactor: 1,
    isBase: true,
  });

  await runner`
    UPDATE stock
    SET base_unit_id = ${baseUnitRecord.id}, unit = ${baseUnitRecord.name}
    WHERE id = ${stockId}
  `;

  units.push({
    id: baseUnitRecord.id,
    name: baseUnitRecord.name,
    symbol: baseUnitRecord.symbol,
    conversion_factor: 1,
    is_base: true,
  });

  for (const conversion of conversions) {
    const factor = Number(conversion.factor ?? conversion.conversionFactor);
    if (!Number.isFinite(factor) || factor <= 0) {
      continue;
    }
    const unitId = conversion?.id ?? conversion?.unitId;
    if (!unitId || unitId === baseUnitRecord.id) {
      continue;
    }

    const unitRecord = await getUnitById(runner, unitId);
    if (!unitRecord) {
      continue;
    }

    const mapping = await ensureStockUnitMapping({
      runner,
      stockId,
      unitId: unitRecord.id,
      conversionFactor: isBaseUnit ? 1 : factor,
      isBase: isBaseUnit,
    });

    units.push({
      id: unitRecord.id,
      name: unitRecord.name,
      symbol: unitRecord.symbol,
      conversion_factor: Number(mapping.conversion_factor),
      is_base: mapping.is_base,
    });
  }

  return units;
}

export async function listUnitsForStock(stockId) {
  if (!stockId) return [];
  const rows = await sql`
    SELECT suc.stock_id, su.id, su.name, su.symbol, suc.conversion_factor, suc.is_base
    FROM stock_unit_conversions suc
    JOIN stock_units su ON su.id = suc.unit_id
    WHERE suc.stock_id = ${stockId}
    ORDER BY suc.is_base DESC, su.name ASC
  `;

  return rows.map((row) => ({
    unit_id: row.id,
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    conversion_factor: Number(row.conversion_factor),
    is_base: row.is_base,
  }));
}

export function convertToBase({ quantity, unitId, units }) {
  const amount = Number(quantity);
  if (!Number.isFinite(amount)) return 0;
  if (!unitId) return amount;
  const unit = units?.find((item) => item.id === unitId || item.unit_id === unitId);
  const factor = Number(unit?.conversion_factor ?? 1);
  return amount * factor;
}

export function convertFromBase({ quantity, unitId, units }) {
  const amount = Number(quantity);
  if (!Number.isFinite(amount)) return 0;
  if (!unitId) return amount;
  const unit = units?.find((item) => item.id === unitId || item.unit_id === unitId);
  const factor = Number(unit?.conversion_factor ?? 1);
  return factor === 0 ? 0 : amount / factor;
}
