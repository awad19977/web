import sql from "@/app/api/utils/sql";

// Get all stock purchases
export async function GET() {
  try {
    const purchases = await sql`
      SELECT 
        sp.*,
        s.name as stock_name,
        s.unit as stock_unit
      FROM stock_purchases sp
      JOIN stock s ON sp.stock_id = s.id
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
    const { stock_id, quantity, unit_cost, supplier, notes } =
      await request.json();

    if (!stock_id || !quantity || !unit_cost) {
      return Response.json(
        { error: "Stock ID, quantity, and unit_cost are required" },
        { status: 400 },
      );
    }

    const total_cost = quantity * unit_cost;

    const [purchase, updatedStock] = await sql.transaction([
      sql`
        INSERT INTO stock_purchases (stock_id, quantity, unit_cost, total_cost, supplier, notes)
        VALUES (${stock_id}, ${quantity}, ${unit_cost}, ${total_cost}, ${supplier}, ${notes})
        RETURNING *
      `,
      sql`
        UPDATE stock 
        SET current_quantity = current_quantity + ${quantity},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${stock_id}
        RETURNING *
      `,
    ]);

    return Response.json({ purchase, updatedStock });
  } catch (error) {
    console.error("Error creating stock purchase:", error);
    return Response.json(
      { error: "Failed to create stock purchase" },
      { status: 500 },
    );
  }
}
