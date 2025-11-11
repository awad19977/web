import { FEATURE_KEYS } from "@/constants/featureFlags";
import { requireFeature } from "@/app/api/utils/auth";
import sql, { logStockTransaction } from "@/app/api/utils/sql";

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
};

const normalizeOrder = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: toInteger(row.id) ?? row.id ?? null,
    product_id: toInteger(row.product_id) ?? row.product_id ?? null,
    product_name: row.product_name ?? "",
    quantity_to_produce: toNumber(row.quantity_to_produce),
    quantity_produced: toNumber(row.quantity_produced),
    status: typeof row.status === "string" ? row.status.toLowerCase() : "planned",
    production_cost: toNumber(row.production_cost),
    started_at: row.started_at ? new Date(row.started_at).toISOString() : null,
    completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
};

const loadOrderWithProduct = async (orderId) => {
  const rows = await sql`
    SELECT po.*, p.name AS product_name
    FROM production_orders po
    JOIN products p ON po.product_id = p.id
    WHERE po.id = ${orderId}
    LIMIT 1
  `;

  return normalizeOrder(rows?.[0]);
};

export async function PATCH(request, { params }) {
  const featureCheck = await requireFeature(request, FEATURE_KEYS.PRODUCTION);
  if (featureCheck.response) {
    return featureCheck.response;
  }

  const rawOrderId = params?.orderId;
  const orderId = Number(rawOrderId);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return Response.json(
      { error: "A valid orderId is required" },
      { status: 400 }
    );
  }

  let payload = null;
  try {
    payload = await request.json();
  } catch (error) {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const desiredStatus = typeof payload?.status === "string" ? payload.status.toLowerCase() : null;
  const quantityInput = payload?.quantity_produced ?? payload?.quantityProduced;
  const shouldStart = payload?.started_at === true || payload?.start === true;
  const allowedStatuses = new Set(["planned", "in_progress", "completed", "cancelled"]);

  try {
    const result = await sql.transaction(async (tx) => {
      const rows = await tx`
        SELECT po.*, p.name AS product_name, p.current_stock AS product_current_stock
        FROM production_orders po
        JOIN products p ON po.product_id = p.id
        WHERE po.id = ${orderId}
        FOR UPDATE
      `;

      const existing = rows?.[0];
      if (!existing) {
        return { type: "notFound" };
      }

      const safeExistingProduced = toNumber(existing.quantity_produced, 0);
      let nextQuantityProduced = safeExistingProduced;
      if (quantityInput !== undefined) {
        const parsedQuantity = Number(quantityInput);
        if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
          return {
            type: "error",
            status: 400,
            message: "quantity_produced must be zero or a positive number",
          };
        }
        nextQuantityProduced = parsedQuantity;
      }

      const currentStatus = typeof existing.status === "string" ? existing.status.toLowerCase() : "planned";
      let nextStatus = currentStatus;
      let startedAt = existing.started_at;
      let completedAt = existing.completed_at;

      if (desiredStatus) {
        if (!allowedStatuses.has(desiredStatus)) {
          return {
            type: "error",
            status: 400,
            message: "Invalid production order status",
          };
        }
        nextStatus = desiredStatus;
      }

      if (shouldStart && !startedAt) {
        startedAt = new Date();
        if (nextStatus === "planned") {
          nextStatus = "in_progress";
        }
      }

      if (nextStatus === "in_progress" && !startedAt) {
        startedAt = new Date();
      }

      const targetCompletion = nextStatus === "completed";

      if (targetCompletion) {
        if (!startedAt) {
          startedAt = new Date();
        }
        if (!completedAt) {
          completedAt = new Date();
        }
        if (!Number.isFinite(nextQuantityProduced) || nextQuantityProduced <= 0) {
          return {
            type: "error",
            status: 400,
            message: "Provide a quantity_produced greater than zero to complete the order",
          };
        }
      } else if (nextQuantityProduced < safeExistingProduced) {
        return {
          type: "error",
          status: 400,
          message: "quantity_produced cannot be reduced",
        };
      }

      const producedDelta = nextQuantityProduced - safeExistingProduced;

      if (nextStatus === "cancelled" && producedDelta > 0) {
        return {
          type: "error",
          status: 400,
          message: "Cannot increase quantity on a cancelled order",
        };
      }

      let productionCost = toNumber(existing.production_cost, 0);

      if (producedDelta > 0 || targetCompletion) {
        const recipeRows = await tx`
          SELECT pr.stock_id, pr.quantity_needed, st.current_quantity, st.base_unit_id, st.unit_cost, st.name AS stock_name
          FROM product_recipes pr
          JOIN stock st ON st.id = pr.stock_id
          WHERE pr.product_id = ${existing.product_id}
          FOR UPDATE
        `;

        const adjustments = Array.isArray(recipeRows)
          ? recipeRows.map((row) => ({
              stockId: toInteger(row.stock_id),
              quantityNeeded: toNumber(row.quantity_needed),
              available: toNumber(row.current_quantity),
              baseUnitId: row.base_unit_id ?? null,
              unitCost: toNumber(row.unit_cost),
              stockName: row.stock_name ?? "stock item",
            }))
          : [];

        const costPerUnit = adjustments.reduce(
          (total, adjustment) => total + adjustment.quantityNeeded * adjustment.unitCost,
          0,
        );

        productionCost = costPerUnit * nextQuantityProduced;

        if (producedDelta > 0) {
          for (const adjustment of adjustments) {
            if (!adjustment.stockId || adjustment.quantityNeeded <= 0) {
              continue;
            }

            const usageQuantity = adjustment.quantityNeeded * producedDelta;
            if (usageQuantity <= 0) {
              continue;
            }

            if (adjustment.available + 1e-9 < usageQuantity) {
              return {
                type: "error",
                status: 400,
                message: `Not enough ${adjustment.stockName} to cover production recipe requirements`,
              };
            }

            await tx`
              UPDATE stock
              SET current_quantity = current_quantity - ${usageQuantity}
              WHERE id = ${adjustment.stockId}
            `;

            await logStockTransaction({
              runner: tx,
              stockId: adjustment.stockId,
              type: "decrease",
              quantity: usageQuantity,
              unitId: adjustment.baseUnitId,
              enteredQuantity: usageQuantity,
              reason: "production_consumption",
              metadata: {
                production_order_id: orderId,
                product_id: existing.product_id,
              },
            });
          }

          await tx`
            UPDATE products
            SET current_stock = current_stock + ${producedDelta}, updated_at = NOW()
            WHERE id = ${existing.product_id}
          `;
        }
      }

      const updatedRows = await tx`
        UPDATE production_orders
        SET status = ${nextStatus},
            quantity_produced = ${nextQuantityProduced},
            started_at = ${startedAt},
            completed_at = ${completedAt},
            production_cost = ${productionCost},
            updated_at = NOW()
        WHERE id = ${orderId}
        RETURNING id
      `;

      const updated = updatedRows?.[0];

      if (!updated) {
        throw new Error("Production order update did not return an id");
      }

      return { type: "success", id: updated.id };
    });

    if (result.type === "notFound") {
      return Response.json(
        { error: "Production order not found" },
        { status: 404 }
      );
    }

    if (result.type === "error") {
      return Response.json(
        { error: result.message },
        { status: result.status ?? 400 }
      );
    }

    const order = await loadOrderWithProduct(result.id);
    return Response.json({ order });
  } catch (error) {
    console.error("Failed to update production order", error);
    return Response.json(
      {
        error: "Unable to update production order",
      },
      { status: 500 }
    );
  }
}
