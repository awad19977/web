import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";
import { getUnitById, upsertStockUnits } from "@/app/api/utils/units";

// Get all stock items
export async function GET(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.STOCK);
    if (response) return response;

    const stockRows = await sql`
      SELECT 
        s.*,
        su.name as base_unit_name,
        su.symbol as base_unit_symbol,
        COALESCE(SUM(sp.quantity), 0) as total_purchased,
        COALESCE(SUM(sp.total_cost), 0) as total_cost_purchased
      FROM stock s
      LEFT JOIN stock_units su ON su.id = s.base_unit_id
      LEFT JOIN stock_purchases sp ON s.id = sp.stock_id
      GROUP BY s.id, su.id
      ORDER BY s.name
    `;

    const stockIds = stockRows.map((row) => row.id);
    let unitRows = [];
    if (stockIds.length) {
      unitRows = await sql`
        SELECT 
          suc.stock_id,
          su.id as unit_id,
          su.name,
          su.symbol,
          suc.conversion_factor,
          suc.is_base
        FROM stock_unit_conversions suc
        JOIN stock_units su ON su.id = suc.unit_id
        WHERE suc.stock_id = ANY(${stockIds})
        ORDER BY suc.is_base DESC, su.name ASC
      `;
    }

    const unitsByStock = new Map();
    for (const unit of unitRows) {
      const items = unitsByStock.get(unit.stock_id) ?? [];
      items.push({
        unit_id: unit.unit_id,
        id: unit.unit_id,
        name: unit.name,
        symbol: unit.symbol,
        conversion_factor: Number(unit.conversion_factor),
        is_base: unit.is_base,
      });
      unitsByStock.set(unit.stock_id, items);
    }

    const payload = stockRows.map((row) => {
      const units = unitsByStock.get(row.id) ?? [];
      const baseUnit = units.find((unit) => unit.is_base) ?? (row.base_unit_name
        ? {
            id: row.base_unit_id,
            name: row.base_unit_name,
            symbol: row.base_unit_symbol,
            conversion_factor: 1,
            is_base: true,
          }
        : null);

      return {
        ...row,
        unit: row.unit ?? baseUnit?.name ?? null,
        base_unit: baseUnit,
        units,
      };
    });

    return Response.json(payload);
  } catch (error) {
    console.error("Error fetching stock:", error);
    return Response.json({ error: "Failed to fetch stock" }, { status: 500 });
  }
}

// Create new stock item
export async function POST(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.STOCK);
    if (response) return response;

    const {
      name,
      description,
      unit,
  baseUnit,
      unit_cost,
      supplier,
      current_quantity = 0,
      conversions = [],
    } = await request.json();

    if (!name || !baseUnit?.id || !unit_cost) {
      return Response.json(
        { error: "Name, base unit, and unit_cost are required" },
        { status: 400 },
      );
    }

    const baseUnitRecord = await getUnitById(sql, baseUnit.id);

    if (!baseUnitRecord) {
      return Response.json(
        { error: "Selected base unit does not exist" },
        { status: 400 },
      );
    }

    const sanitizedConversions = [];
    const seenConversionIds = new Set();
    for (const conversion of conversions ?? []) {
      const id = conversion?.id ?? conversion?.unitId ?? null;
      const factor = Number(
        conversion?.factor ?? conversion?.conversionFactor ?? 0,
      );
      if (!id || id === baseUnitRecord.id) continue;
      if (!Number.isFinite(factor) || factor <= 0) continue;
      if (seenConversionIds.has(id)) continue;
      seenConversionIds.add(id);
      sanitizedConversions.push({ id, factor });
    }

    const initialUnitName = baseUnitRecord.name ?? null;

    const result = await sql.transaction(async (tx) => {
      const [newStock] = await tx`
        INSERT INTO stock (name, description, unit, current_quantity, unit_cost, supplier)
        VALUES (${name}, ${description}, ${initialUnitName}, ${current_quantity}, ${unit_cost}, ${supplier})
        RETURNING *
      `;

      const unitMappings = await upsertStockUnits({
        runner: tx,
        stockId: newStock.id,
        baseUnit: { id: baseUnitRecord.id },
        conversions: sanitizedConversions,
      });

      const baseMapping = unitMappings.find((mapping) => mapping.is_base);

      return {
        ...newStock,
        unit: baseMapping?.name ?? newStock.unit,
        base_unit: baseMapping ?? null,
        units: unitMappings,
      };
    });

    return Response.json(result);
  } catch (error) {
    console.error("Error creating stock:", error);
    return Response.json({ error: "Failed to create stock" }, { status: 500 });
  }
}
