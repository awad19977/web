import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";

// Get all stock purchases
export async function GET(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.STOCK);
    if (response) return response;

    const purchases = await sql`
      SELECT 
        sp.*,
        s.name as stock_name,
        s.unit as stock_unit,
        su.name as purchase_unit_name,
        su.symbol as purchase_unit_symbol
      FROM stock_purchases sp
      JOIN stock s ON sp.stock_id = s.id
      LEFT JOIN stock_units su ON su.id = sp.unit_id
      ORDER BY sp.purchase_date DESC
    `;

    return Response.json(purchases);
  } catch (error) {
    console.error("Error fetching stock purchases:", error);
    return Response.json(
      { error: "Failed to fetch stock purchases" },
      { status: 500 },
    );
  }
}

// Create new stock purchase
export async function POST(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.STOCK);
    if (response) return response;

    const { stock_id, quantity, unit_cost, supplier, notes, unit_id } =
      await request.json();

    if (!stock_id || !quantity || !unit_cost) {
      return Response.json(
        { error: "Stock ID, quantity, and unit_cost are required" },
        { status: 400 },
      );
    }

    const enteredQuantity = Number(quantity);
    if (!Number.isFinite(enteredQuantity) || enteredQuantity <= 0) {
      return Response.json(
        { error: "Quantity must be a positive number" },
        { status: 400 },
      );
    }

    let baseQuantity = enteredQuantity;

    let conversionFactor = 1;
    if (unit_id) {
      const [conversion] = await sql`
        SELECT conversion_factor
        FROM stock_unit_conversions
        WHERE stock_id = ${stock_id} AND unit_id = ${unit_id}
      `;

      if (!conversion) {
        return Response.json(
          { error: "Selected unit is not configured for this stock item" },
          { status: 400 },
        );
      }

      conversionFactor = Number(conversion.conversion_factor);
      baseQuantity = baseQuantity * conversionFactor;
    }

    const total_cost = enteredQuantity * unit_cost;

    const { purchase, updatedStock } = await sql.transaction(async (tx) => {
      const [createdPurchase] = await tx`
  INSERT INTO stock_purchases (stock_id, quantity, unit_cost, total_cost, supplier, notes, unit_id, entered_quantity)
  VALUES (${stock_id}, ${baseQuantity}, ${unit_cost}, ${total_cost}, ${supplier}, ${notes}, ${unit_id}, ${unit_id ? enteredQuantity : null})
        RETURNING *
      `;
      const [stockRow] = await tx`
        UPDATE stock 
        SET current_quantity = current_quantity + ${baseQuantity},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${stock_id}
        RETURNING *
      `;
      return { purchase: createdPurchase, updatedStock: stockRow };
    });

    return Response.json({ purchase, updatedStock });
  } catch (error) {
    console.error("Error creating stock purchase:", error);
    return Response.json(
      { error: "Failed to create stock purchase" },
      { status: 500 },
    );
  }
}
