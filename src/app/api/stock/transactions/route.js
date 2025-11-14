import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";

export async function GET(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.REPORTS_STOCK_TRANSACTIONS);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const stockId = searchParams.get("stock_id") || searchParams.get("stockId");
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Ensure table exists for first-time setups
    await sql`
      CREATE TABLE IF NOT EXISTS stock_transactions (
        id SERIAL PRIMARY KEY,
        stock_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        quantity NUMERIC NOT NULL CHECK (quantity > 0),
        unit_id INTEGER,
        entered_quantity NUMERIC,
        reason TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const conditions = [];
    const params = [];

    if (stockId) {
      conditions.push(`t.stock_id = $${params.length + 1}`);
      params.push(Number(stockId));
    }
    if (type) {
      conditions.push(`LOWER(t.type) = LOWER($${params.length + 1})`);
      params.push(type);
    }
    if (from) {
      conditions.push(`t.created_at >= $${params.length + 1}`);
      params.push(new Date(from).toISOString());
    }
    if (to) {
      conditions.push(`t.created_at <= $${params.length + 1}`);
      params.push(new Date(to).toISOString());
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT 
        t.*, 
        s.name AS stock_name,
        su.name AS unit_name,
        su.symbol AS unit_symbol
      FROM stock_transactions t
      JOIN stock s ON s.id = t.stock_id
      LEFT JOIN stock_units su ON su.id = t.unit_id
      ${where}
      ORDER BY t.created_at DESC, t.id DESC
    `;

    // Use the raw pool via sql helper
    const rows = await sql.raw(query, params);

    return Response.json(rows);
  } catch (error) {
    console.error("Error fetching stock transactions:", error);
    return Response.json(
      { error: "Failed to fetch stock transactions" },
      { status: 500 }
    );
  }
}
