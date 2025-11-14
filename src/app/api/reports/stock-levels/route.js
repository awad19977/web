import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";

export async function GET(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.REPORTS_STOCK_LEVELS);
    if (response) return response;

    const rows = await sql`
      SELECT
        s.id,
        s.name,
        s.description,
        COALESCE(s.current_quantity, 0) AS current_quantity,
        s.unit_cost,
        s.unit AS unit_name,
        s.supplier,
        su.name AS base_unit_name,
        su.symbol AS base_unit_symbol
      FROM stock s
      LEFT JOIN stock_units su ON su.id = s.base_unit_id
      WHERE COALESCE(s.current_quantity, 0) > 0
      ORDER BY s.name
    `;

    return Response.json(rows);
  } catch (err) {
    console.error("Error fetching stock levels:", err);
    return Response.json({ error: "Failed to fetch stock levels" }, { status: 500 });
  }
}
