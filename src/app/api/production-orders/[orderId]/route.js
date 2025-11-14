import { FEATURE_KEYS } from "@/constants/featureFlags";
import { requireFeature } from "@/app/api/utils/auth";
import sql, { logStockTransaction, logProductTransaction } from "@/app/api/utils/sql";

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
    status_reason: row.status_reason ?? null,
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
  const statusReason = payload?.reason ?? payload?.status_reason ?? null;
  const quantityInput = payload?.quantity_produced ?? payload?.quantityProduced;
  const extrasInput = Array.isArray(payload?.extras) ? payload.extras : [];
  const shouldStart = payload?.started_at === true || payload?.start === true;
  const allowedStatuses = new Set(["planned", "in_progress", "completed", "cancelled", "failed"]);

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

      // Disallow changing the production order status once it has left 'planned'.
      // This prevents transitions like 'in_progress' -> 'cancelled' or manual status edits
      // after the order has already progressed beyond planning.
      if (currentStatus !== "planned" && nextStatus !== currentStatus) {
        return {
          type: "error",
          status: 400,
          message: "Production order status cannot be changed once it has left 'planned'",
        };
      }

      if (nextStatus === "in_progress" && !startedAt) {
        startedAt = new Date();
      }

      const targetCompletion = nextStatus === "completed";

      // Require a reason when cancelling or marking failed
      if ((nextStatus === "cancelled" || nextStatus === "failed") && (!statusReason || String(statusReason).trim() === "")) {
        return {
          type: "error",
          status: 400,
          message: "Provide a reason when cancelling or marking a production order as failed",
        };
      }

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

          // Handle extra ingredients if provided and allowed
          if (Array.isArray(extrasInput) && extrasInput.length) {
            // Aggregate extras per stock to enforce limits against totals
            const totalsByStock = new Map();
            for (const extra of extrasInput) {
              const stockId = Number(extra?.stock_id ?? extra?.stockId);
              const extraQty = Number(extra?.quantity);
              if (!Number.isInteger(stockId) || stockId <= 0) continue;
              if (!Number.isFinite(extraQty) || extraQty <= 0) continue;
              totalsByStock.set(stockId, (totalsByStock.get(stockId) ?? 0) + extraQty);
            }

            if (totalsByStock.size) {
              const stockIds = Array.from(totalsByStock.keys());
              // Sum extras already used for this order to enforce cumulative limits
              const usedRows = await tx`
                SELECT stock_id, SUM(quantity) AS used
                FROM stock_transactions
                WHERE reason = 'production_extra'
                  AND (metadata->>'production_order_id') = ${String(orderId)}
                  AND stock_id = ANY(${stockIds}::int[])
                GROUP BY stock_id
              `;
              const usedByStock = new Map((usedRows ?? []).map((r) => [Number(r.stock_id), Number(r.used ?? 0)]));

              const rows = await tx`
                SELECT id, name, current_quantity, base_unit_id, unit_cost, allow_extra_production, extra_production_limit
                FROM stock
                WHERE id = ANY(${stockIds}::int[])
                FOR UPDATE
              `;

              const stockById = new Map(rows.map((r) => [r.id, r]));

              // Validate all first
              for (const [stockId, totalQty] of totalsByStock.entries()) {
                const stk = stockById.get(stockId);
                if (!stk) {
                  return { type: "error", status: 400, message: "Selected extra stock item not found" };
                }
                if (stk.allow_extra_production !== true) {
                  return { type: "error", status: 400, message: `Extra ingredients not allowed for ${stk.name}` };
                }
                const absoluteLimit = Number(stk.extra_production_limit ?? 0);
                if (Number.isFinite(absoluteLimit) && absoluteLimit > 0) {
                  // cumulative enforcement across order
                  const alreadyUsed = Number(usedByStock.get(stockId) ?? 0);
                  if (alreadyUsed + totalQty - absoluteLimit > 1e-9) {
                    return { type: "error", status: 400, message: `Extra quantity for ${stk.name} exceeds allowed limit` };
                  }
                }
                if ((Number(stk.current_quantity ?? 0) + 1e-9) < totalQty) {
                  return { type: "error", status: 400, message: `Not enough ${stk.name} available for extras` };
                }
              }

              // Apply updates and logs per stock
              for (const [stockId, totalQty] of totalsByStock.entries()) {
                const stk = stockById.get(stockId);
                await tx`
                  UPDATE stock
                  SET current_quantity = current_quantity - ${totalQty}
                  WHERE id = ${stockId}
                `;

                await logStockTransaction({
                  runner: tx,
                  stockId,
                  type: "decrease",
                  quantity: totalQty,
                  unitId: stk?.base_unit_id ?? null,
                  enteredQuantity: totalQty,
                  reason: "production_extra",
                  metadata: { production_order_id: orderId, product_id: existing.product_id },
                });

                const unitCost = Number(stk.unit_cost ?? 0);
                if (Number.isFinite(unitCost) && unitCost > 0) {
                  productionCost += unitCost * totalQty;
                }
              }
            }
          }

          await tx`
            UPDATE products
            SET current_stock = current_stock + ${producedDelta}, updated_at = NOW()
            WHERE id = ${existing.product_id}
          `;

          await logProductTransaction({
            runner: tx,
            productId: existing.product_id,
            type: "increase",
            quantity: producedDelta,
            reason: "production_output",
            metadata: { production_order_id: orderId },
          });
        }
      }

      // If the order is being marked as failed, record the production cost as an expense
      // so reports that subtract expenses from revenue will reflect the loss.
      if (nextStatus === "failed") {
        try {
          const expenseDescription = `Failed production order #${orderId} - ${existing.product_name ?? "product"}`;
          const expenseNotes = JSON.stringify({ production_order_id: orderId, product_id: existing.product_id });
          const expenseDateIso = new Date().toISOString();
          const expenseAmount = Number(productionCost ?? 0);
          if (Number.isFinite(expenseAmount) && expenseAmount > 0) {
            await tx`
              INSERT INTO expenses (category, description, amount, expense_date, notes)
              VALUES (${"production_failure"}, ${expenseDescription}, ${expenseAmount}, ${expenseDateIso}, ${expenseNotes})
            `;
          }
        } catch (err) {
          // Non-fatal: log and continue, but surface later if transaction rolls back
          console.error("Failed to record production failure expense:", err);
        }
      }

      const updatedRows = await tx`
        UPDATE production_orders
        SET status = ${nextStatus},
            quantity_produced = ${nextQuantityProduced},
            started_at = ${startedAt},
            completed_at = ${completedAt},
            production_cost = ${productionCost},
            status_reason = ${statusReason},
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
