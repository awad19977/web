import sql from "@/app/api/utils/sql";
import { getAuthContext, requireFeature } from "@/app/api/utils/auth";
import { hasFeatureEnabled } from "@/app/api/utils/permissions";
import { FEATURE_KEYS } from "@/constants/featureFlags";

const ADJUSTMENT_TYPES = new Set(["increase", "decrease"]);
const STATUSES = new Set(["pending", "approved", "rejected"]);

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

const loadAdjustmentById = async (adjustmentId) => {
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

export async function GET(request) {
  const { user } = await getAuthContext(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canRequest = hasFeatureEnabled(user.features, FEATURE_KEYS.STOCK_ADJUST);
  const canApprove = hasFeatureEnabled(user.features, FEATURE_KEYS.STOCK_ADJUST_APPROVE);

  if (!canRequest && !canApprove) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.toLowerCase();
  const q = (url.searchParams.get("q") || "").trim();
  const from = (url.searchParams.get("from") || "").trim();
  const to = (url.searchParams.get("to") || "").trim();
  const like = q ? `%${q}%` : null;

  const normalizedStatus = STATUSES.has(status) ? status : canApprove ? null : "pending";
  const useResolvedDate = normalizedStatus === "approved" || normalizedStatus === "rejected";

  try {
    let rows;
    if (canApprove) {
      if (normalizedStatus) {
        if (q && from && to) {
          rows = await sql`
            SELECT sa.*, s.name AS stock_name,
                   ru.name AS requested_by_name,
                   au.name AS resolved_by_name
            FROM stock_adjustments sa
            JOIN stock s ON s.id = sa.stock_id
            LEFT JOIN auth_users ru ON ru.id = sa.requested_by
            LEFT JOIN auth_users au ON au.id = sa.resolved_by
            WHERE sa.status = ${normalizedStatus}
              AND (s.name ILIKE ${like} OR ru.name ILIKE ${like} OR sa.reason ILIKE ${like})
              AND ${(useResolvedDate ? sql`sa.resolved_at::date` : sql`sa.created_at::date`)} >= ${from}
              AND ${(useResolvedDate ? sql`sa.resolved_at::date` : sql`sa.created_at::date`)} <= ${to}
            ORDER BY sa.created_at DESC, sa.id DESC
          `;
        } else if (q) {
          rows = await sql`
            SELECT sa.*, s.name AS stock_name,
                   ru.name AS requested_by_name,
                   au.name AS resolved_by_name
            FROM stock_adjustments sa
            JOIN stock s ON s.id = sa.stock_id
            LEFT JOIN auth_users ru ON ru.id = sa.requested_by
            LEFT JOIN auth_users au ON au.id = sa.resolved_by
            WHERE sa.status = ${normalizedStatus}
              AND (s.name ILIKE ${like} OR ru.name ILIKE ${like} OR sa.reason ILIKE ${like})
            ORDER BY sa.created_at DESC, sa.id DESC
          `;
        } else if (from && to) {
          rows = await sql`
            SELECT sa.*, s.name AS stock_name,
                   ru.name AS requested_by_name,
                   au.name AS resolved_by_name
            FROM stock_adjustments sa
            JOIN stock s ON s.id = sa.stock_id
            LEFT JOIN auth_users ru ON ru.id = sa.requested_by
            LEFT JOIN auth_users au ON au.id = sa.resolved_by
            WHERE sa.status = ${normalizedStatus}
              AND ${(useResolvedDate ? sql`sa.resolved_at::date` : sql`sa.created_at::date`)} >= ${from}
              AND ${(useResolvedDate ? sql`sa.resolved_at::date` : sql`sa.created_at::date`)} <= ${to}
            ORDER BY sa.created_at DESC, sa.id DESC
          `;
        } else {
          rows = await sql`
            SELECT sa.*, s.name AS stock_name,
                   ru.name AS requested_by_name,
                   au.name AS resolved_by_name
            FROM stock_adjustments sa
            JOIN stock s ON s.id = sa.stock_id
            LEFT JOIN auth_users ru ON ru.id = sa.requested_by
            LEFT JOIN auth_users au ON au.id = sa.resolved_by
            WHERE sa.status = ${normalizedStatus}
            ORDER BY sa.created_at DESC, sa.id DESC
          `;
        }
      } else {
        if (q && from && to) {
          rows = await sql`
            SELECT sa.*, s.name AS stock_name,
                   ru.name AS requested_by_name,
                   au.name AS resolved_by_name
            FROM stock_adjustments sa
            JOIN stock s ON s.id = sa.stock_id
            LEFT JOIN auth_users ru ON ru.id = sa.requested_by
            LEFT JOIN auth_users au ON au.id = sa.resolved_by
            WHERE (s.name ILIKE ${like} OR ru.name ILIKE ${like} OR sa.reason ILIKE ${like})
              AND sa.created_at::date >= ${from}
              AND sa.created_at::date <= ${to}
            ORDER BY sa.created_at DESC, sa.id DESC
          `;
        } else if (q) {
          rows = await sql`
            SELECT sa.*, s.name AS stock_name,
                   ru.name AS requested_by_name,
                   au.name AS resolved_by_name
            FROM stock_adjustments sa
            JOIN stock s ON s.id = sa.stock_id
            LEFT JOIN auth_users ru ON ru.id = sa.requested_by
            LEFT JOIN auth_users au ON au.id = sa.resolved_by
            WHERE (s.name ILIKE ${like} OR ru.name ILIKE ${like} OR sa.reason ILIKE ${like})
            ORDER BY sa.created_at DESC, sa.id DESC
          `;
        } else if (from && to) {
          rows = await sql`
            SELECT sa.*, s.name AS stock_name,
                   ru.name AS requested_by_name,
                   au.name AS resolved_by_name
            FROM stock_adjustments sa
            JOIN stock s ON s.id = sa.stock_id
            LEFT JOIN auth_users ru ON ru.id = sa.requested_by
            LEFT JOIN auth_users au ON au.id = sa.resolved_by
            WHERE sa.created_at::date >= ${from}
              AND sa.created_at::date <= ${to}
            ORDER BY sa.created_at DESC, sa.id DESC
          `;
        } else {
          rows = await sql`
            SELECT sa.*, s.name AS stock_name,
                   ru.name AS requested_by_name,
                   au.name AS resolved_by_name
            FROM stock_adjustments sa
            JOIN stock s ON s.id = sa.stock_id
            LEFT JOIN auth_users ru ON ru.id = sa.requested_by
            LEFT JOIN auth_users au ON au.id = sa.resolved_by
            ORDER BY sa.created_at DESC, sa.id DESC
          `;
        }
      }
    } else if (normalizedStatus) {
      const useResolvedForRequester = normalizedStatus === "approved" || normalizedStatus === "rejected";
      if (q && from && to) {
        rows = await sql`
          SELECT sa.*, s.name AS stock_name,
                 ru.name AS requested_by_name,
                 au.name AS resolved_by_name
          FROM stock_adjustments sa
          JOIN stock s ON s.id = sa.stock_id
          LEFT JOIN auth_users ru ON ru.id = sa.requested_by
          LEFT JOIN auth_users au ON au.id = sa.resolved_by
          WHERE sa.requested_by = ${user.id} AND sa.status = ${normalizedStatus}
            AND (s.name ILIKE ${like} OR ru.name ILIKE ${like} OR sa.reason ILIKE ${like})
            AND ${(useResolvedForRequester ? sql`sa.resolved_at::date` : sql`sa.created_at::date`)} >= ${from}
            AND ${(useResolvedForRequester ? sql`sa.resolved_at::date` : sql`sa.created_at::date`)} <= ${to}
          ORDER BY sa.created_at DESC, sa.id DESC
        `;
      } else if (q) {
        rows = await sql`
          SELECT sa.*, s.name AS stock_name,
                 ru.name AS requested_by_name,
                 au.name AS resolved_by_name
          FROM stock_adjustments sa
          JOIN stock s ON s.id = sa.stock_id
          LEFT JOIN auth_users ru ON ru.id = sa.requested_by
          LEFT JOIN auth_users au ON au.id = sa.resolved_by
          WHERE sa.requested_by = ${user.id} AND sa.status = ${normalizedStatus}
            AND (s.name ILIKE ${like} OR ru.name ILIKE ${like} OR sa.reason ILIKE ${like})
          ORDER BY sa.created_at DESC, sa.id DESC
        `;
      } else if (from && to) {
        rows = await sql`
          SELECT sa.*, s.name AS stock_name,
                 ru.name AS requested_by_name,
                 au.name AS resolved_by_name
          FROM stock_adjustments sa
          JOIN stock s ON s.id = sa.stock_id
          LEFT JOIN auth_users ru ON ru.id = sa.requested_by
          LEFT JOIN auth_users au ON au.id = sa.resolved_by
          WHERE sa.requested_by = ${user.id} AND sa.status = ${normalizedStatus}
            AND ${(useResolvedForRequester ? sql`sa.resolved_at::date` : sql`sa.created_at::date`)} >= ${from}
            AND ${(useResolvedForRequester ? sql`sa.resolved_at::date` : sql`sa.created_at::date`)} <= ${to}
          ORDER BY sa.created_at DESC, sa.id DESC
        `;
      } else {
        rows = await sql`
          SELECT sa.*, s.name AS stock_name,
                 ru.name AS requested_by_name,
                 au.name AS resolved_by_name
          FROM stock_adjustments sa
          JOIN stock s ON s.id = sa.stock_id
          LEFT JOIN auth_users ru ON ru.id = sa.requested_by
          LEFT JOIN auth_users au ON au.id = sa.resolved_by
          WHERE sa.requested_by = ${user.id} AND sa.status = ${normalizedStatus}
          ORDER BY sa.created_at DESC, sa.id DESC
        `;
      }
    } else {
      if (q && from && to) {
        rows = await sql`
          SELECT sa.*, s.name AS stock_name,
                 ru.name AS requested_by_name,
                 au.name AS resolved_by_name
          FROM stock_adjustments sa
          JOIN stock s ON s.id = sa.stock_id
          LEFT JOIN auth_users ru ON ru.id = sa.requested_by
          LEFT JOIN auth_users au ON au.id = sa.resolved_by
          WHERE sa.requested_by = ${user.id}
            AND (s.name ILIKE ${like} OR ru.name ILIKE ${like} OR sa.reason ILIKE ${like})
            AND sa.created_at::date >= ${from}
            AND sa.created_at::date <= ${to}
          ORDER BY sa.created_at DESC, sa.id DESC
        `;
      } else if (q) {
        rows = await sql`
          SELECT sa.*, s.name AS stock_name,
                 ru.name AS requested_by_name,
                 au.name AS resolved_by_name
          FROM stock_adjustments sa
          JOIN stock s ON s.id = sa.stock_id
          LEFT JOIN auth_users ru ON ru.id = sa.requested_by
          LEFT JOIN auth_users au ON au.id = sa.resolved_by
          WHERE sa.requested_by = ${user.id}
            AND (s.name ILIKE ${like} OR ru.name ILIKE ${like} OR sa.reason ILIKE ${like})
          ORDER BY sa.created_at DESC, sa.id DESC
        `;
      } else if (from && to) {
        rows = await sql`
          SELECT sa.*, s.name AS stock_name,
                 ru.name AS requested_by_name,
                 au.name AS resolved_by_name
          FROM stock_adjustments sa
          JOIN stock s ON s.id = sa.stock_id
          LEFT JOIN auth_users ru ON ru.id = sa.requested_by
          LEFT JOIN auth_users au ON au.id = sa.resolved_by
          WHERE sa.requested_by = ${user.id}
            AND sa.created_at::date >= ${from}
            AND sa.created_at::date <= ${to}
          ORDER BY sa.created_at DESC, sa.id DESC
        `;
      } else {
        rows = await sql`
          SELECT sa.*, s.name AS stock_name,
                 ru.name AS requested_by_name,
                 au.name AS resolved_by_name
          FROM stock_adjustments sa
          JOIN stock s ON s.id = sa.stock_id
          LEFT JOIN auth_users ru ON ru.id = sa.requested_by
          LEFT JOIN auth_users au ON au.id = sa.resolved_by
          WHERE sa.requested_by = ${user.id}
          ORDER BY sa.created_at DESC, sa.id DESC
        `;
      }
    }

    const adjustments = Array.isArray(rows) ? rows.map((row) => normalizeAdjustment(row)) : [];
    return Response.json({ adjustments });
  } catch (error) {
    console.error("Failed to load stock adjustments", error);
    return Response.json({ error: "Unable to load stock adjustments" }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, response } = await requireFeature(request, FEATURE_KEYS.STOCK_ADJUST);
  if (response) {
    return response;
  }

  let payload = null;
  try {
    payload = await request.json();
  } catch (error) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const stockId = Number(payload?.stock_id ?? payload?.stockId);
  const adjustmentType = typeof payload?.adjustment_type === "string"
    ? payload.adjustment_type.toLowerCase()
    : typeof payload?.adjustmentType === "string"
      ? payload.adjustmentType.toLowerCase()
      : null;
  const quantity = Number(payload?.quantity ?? 0);
  const reason = payload?.reason ? String(payload.reason).trim() : null;

  if (!Number.isInteger(stockId) || stockId <= 0) {
    return Response.json({ error: "A valid stock_id is required" }, { status: 400 });
  }

  if (!ADJUSTMENT_TYPES.has(adjustmentType)) {
    return Response.json({ error: "adjustment_type must be increase or decrease" }, { status: 400 });
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return Response.json({ error: "quantity must be a positive number" }, { status: 400 });
  }

  try {
    const stockRows = await sql`
      SELECT id
      FROM stock
      WHERE id = ${stockId}
      LIMIT 1
    `;

    if (!stockRows?.length) {
      return Response.json({ error: "Stock item not found" }, { status: 404 });
    }

    const inserted = await sql`
      INSERT INTO stock_adjustments (stock_id, requested_by, status, adjustment_type, quantity, reason)
      VALUES (${stockId}, ${user.id}, ${"pending"}, ${adjustmentType}, ${quantity}, ${reason})
      RETURNING id
    `;

    const adjustment = await loadAdjustmentById(inserted?.[0]?.id);
    return Response.json({ adjustment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create stock adjustment", error);
    return Response.json({ error: "Unable to create stock adjustment" }, { status: 500 });
  }
}
