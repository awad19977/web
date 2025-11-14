import { FEATURE_KEYS } from "@/constants/featureFlags";
import { requireFeature } from "@/app/api/utils/auth";
import sql, { logStockTransaction } from "@/app/api/utils/sql";

const normalizeAdjustment = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    stock_id: row.stock_id,
    stock_name: row.stock_name,
    adjustment_type: row.adjustment_type,
    status: row.status,
    quantity: Number(row.quantity ?? 0),
    reason: row.reason ?? null,
    resolution_notes: row.resolution_notes ?? null,
    requested_by: row.requested_by,
    requested_by_name: row.requested_by_name ?? null,
    resolved_by: row.resolved_by,
    resolved_by_name: row.resolved_by_name ?? null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    resolved_at: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
  };
};

const loadAdjustment = async (adjustmentId) => {
  const rows = await sql`
    SELECT sa.*, s.name AS stock_name,
           ru.name AS requested_by_name,
           au.name AS resolved_by_name
    FROM stock_adjustments sa
    JOIN stock s ON s.id = sa.stock_id
    LEFT JOIN auth_users ru ON ru.id = sa.requested_by
    LEFT JOIN auth_users au ON au.id = sa.resolved_by
    WHERE sa.id = ${adjustmentId}
    LIMIT 1
  `;

  return normalizeAdjustment(rows?.[0]);
};

export async function PATCH(request, { params }) {
  const { user, response } = await requireFeature(request, FEATURE_KEYS.STOCK_ADJUST_APPROVE);
  if (response) {
    return response;
  }

  const adjustmentId = Number(params?.adjustmentId);
  if (!Number.isInteger(adjustmentId) || adjustmentId <= 0) {
    return Response.json({ error: "A valid adjustment id is required" }, { status: 400 });
  }

  let payload = null;
  try {
    payload = await request.json();
  } catch (error) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const actionRaw = payload?.action ?? payload?.status;
  const action = typeof actionRaw === "string" ? actionRaw.toLowerCase() : null;
  const resolutionNotes = payload?.notes
    ? String(payload.notes).trim()
    : payload?.resolution_notes
      ? String(payload.resolution_notes).trim()
      : null;

  if (action !== "approve" && action !== "reject") {
    return Response.json(
      { error: "action must be approve or reject" },
      { status: 400 },
    );
  }

  try {
    const result = await sql.transaction(async (tx) => {
      const rows = await tx`
        SELECT sa.*, s.current_quantity, s.base_unit_id, s.name AS stock_name
        FROM stock_adjustments sa
        JOIN stock s ON s.id = sa.stock_id
        WHERE sa.id = ${adjustmentId}
        FOR UPDATE
      `;

      const adjustment = rows?.[0];
      if (!adjustment) {
        return { type: "notFound" };
      }

      if (adjustment.status !== "pending") {
        return {
          type: "error",
          status: 409,
          message: "Only pending adjustments can be updated",
        };
      }

      const quantity = Number(adjustment.quantity ?? 0);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return {
          type: "error",
          status: 400,
          message: "Adjustment quantity is invalid",
        };
      }

      if (action === "reject") {
        await tx`
          UPDATE stock_adjustments
          SET status = ${"rejected"},
              resolved_by = ${user.id},
              resolved_at = NOW(),
              resolution_notes = ${resolutionNotes}
          WHERE id = ${adjustmentId}
        `;

        return { type: "success" };
      }

      // Approval path
      const adjustmentType = adjustment.adjustment_type;
      if (adjustmentType !== "increase" && adjustmentType !== "decrease") {
        return {
          type: "error",
          status: 400,
          message: "Unsupported adjustment type",
        };
      }

      if (adjustmentType === "decrease" && adjustment.current_quantity + 1e-9 < quantity) {
        return {
          type: "error",
          status: 400,
          message: "Cannot decrease beyond available stock",
        };
      }

      const delta = adjustmentType === "increase" ? quantity : -quantity;

      await tx`
        UPDATE stock
        SET current_quantity = current_quantity + ${delta},
            updated_at = NOW()
        WHERE id = ${adjustment.stock_id}
      `;

      await logStockTransaction({
        runner: tx,
        stockId: adjustment.stock_id,
        type: adjustmentType,
        quantity: quantity,
        unitId: adjustment.base_unit_id,
        enteredQuantity: quantity,
        reason: "manual_adjustment",
        metadata: {
          adjustment_id: adjustmentId,
          resolved_by: user.id,
        },
      });

      await tx`
        UPDATE stock_adjustments
        SET status = ${"approved"},
            resolved_by = ${user.id},
            resolved_at = NOW(),
            resolution_notes = ${resolutionNotes}
        WHERE id = ${adjustmentId}
      `;

      return { type: "success" };
    });

    if (result.type === "notFound") {
      return Response.json({ error: "Adjustment not found" }, { status: 404 });
    }

    if (result.type === "error") {
      return Response.json({ error: result.message }, { status: result.status ?? 400 });
    }

    const adjustment = await loadAdjustment(adjustmentId);
    return Response.json({ adjustment });
  } catch (error) {
    console.error("Failed to resolve stock adjustment", error);
    return Response.json({ error: "Unable to update stock adjustment" }, { status: 500 });
  }
}
