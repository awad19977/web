import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";

export async function GET(request) {
  try {
      const { searchParams } = new URL(request.url);
      const scope = searchParams.get("scope");

      // If the client explicitly requests production-scoped transactions,
      // require the production-transactions feature flag. Otherwise require
      // the general product-transactions feature flag.
      if (scope === "production") {
        const { response } = await requireFeature(request, FEATURE_KEYS.REPORTS_PRODUCTION_TRANSACTIONS);
        if (response) return response;
      } else {
        const { response } = await requireFeature(request, FEATURE_KEYS.REPORTS_PRODUCT_TRANSACTIONS);
        if (response) return response;
      }

    const productId = searchParams.get("product_id") || searchParams.get("productId");
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Ensure table exists for first-time setups
    await sql`
      CREATE TABLE IF NOT EXISTS product_transactions (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        quantity NUMERIC NOT NULL CHECK (quantity > 0),
        reason TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const conditions = [];
    const params = [];

    if (productId) {
      conditions.push(`t.product_id = $${params.length + 1}`);
      params.push(Number(productId));
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
        p.name AS product_name
      FROM product_transactions t
      JOIN products p ON p.id = t.product_id
      ${where}
      ORDER BY t.created_at DESC, t.id DESC
    `;

    const rows = await sql.raw(query, params);
    return Response.json(rows);
  } catch (error) {
    console.error("Error fetching product transactions:", error);
    return Response.json(
      { error: "Failed to fetch product transactions" },
      { status: 500 }
    );
  }
}
