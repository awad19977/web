import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";
import { getUnitById, upsertStockUnits } from "@/app/api/utils/units";

const NOT_FOUND_ERROR = "STOCK_NOT_FOUND";

export async function PATCH(request, { params }) {
  const { response: authResponse } = await requireFeature(
    request,
    FEATURE_KEYS.STOCK_EDIT,
  );
  if (authResponse) return authResponse;

  const stockId = Number(params?.stockId);
  if (!Number.isInteger(stockId) || stockId <= 0) {
    return Response.json({ error: "Invalid stock id" }, { status: 400 });
  }

  const existing = await sql`
    SELECT id
    FROM stock
    WHERE id = ${stockId}
  `;

  if (!existing.length) {
    return Response.json({ error: "Stock item not found" }, { status: 404 });
  }

  try {
    const {
      name,
      description,
      unit_cost,
      supplier,
      baseUnit,
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

    const result = await sql.transaction(async (tx) => {
      const [updatedStock] = await tx`
        UPDATE stock
        SET name = ${name},
            description = ${description},
            unit = ${baseUnitRecord.name},
            unit_cost = ${unit_cost},
            supplier = ${supplier},
            base_unit_id = ${baseUnitRecord.id},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${stockId}
        RETURNING *
      `;

      if (!updatedStock) {
        throw new Error(NOT_FOUND_ERROR);
      }

      await tx`
        DELETE FROM stock_unit_conversions
        WHERE stock_id = ${stockId}
      `;

      const unitMappings = await upsertStockUnits({
        runner: tx,
        stockId,
        baseUnit: { id: baseUnitRecord.id },
        conversions: sanitizedConversions,
      });

      const baseMapping =
        unitMappings.find((mapping) => mapping.is_base) ??
        (baseUnitRecord
          ? {
              id: baseUnitRecord.id,
              name: baseUnitRecord.name,
              symbol: baseUnitRecord.symbol,
              conversion_factor: 1,
              is_base: true,
            }
          : null);

      return {
        stock: updatedStock,
        unitMappings,
        baseMapping,
      };
    });

    const payload = {
      ...result.stock,
      unit: result.baseMapping?.name ?? result.stock.unit,
      base_unit: result.baseMapping,
      units: result.unitMappings,
    };

    return Response.json(payload);
  } catch (error) {
    if (error?.message === NOT_FOUND_ERROR) {
      return Response.json({ error: "Stock item not found" }, { status: 404 });
    }

    console.error("Error updating stock:", error);
    return Response.json({ error: "Failed to update stock" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { response: authResponse } = await requireFeature(
    request,
    FEATURE_KEYS.STOCK_DELETE,
  );
  if (authResponse) return authResponse;

  const stockId = Number(params?.stockId);
  if (!Number.isInteger(stockId) || stockId <= 0) {
    return Response.json({ error: "Invalid stock id" }, { status: 400 });
  }

  try {
    const deleted = await sql`
      DELETE FROM stock
      WHERE id = ${stockId}
      RETURNING id
    `;

    if (!deleted.length) {
      return Response.json({ error: "Stock item not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error?.code === "23503") {
      return Response.json(
        { error: "Cannot delete stock that is referenced by purchases" },
        { status: 409 },
      );
    }

    console.error("Error deleting stock:", error);
    return Response.json({ error: "Failed to delete stock" }, { status: 500 });
  }
}
