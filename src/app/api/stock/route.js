import sql from "@/app/api/utils/sql";

// Get all stock items
export async function GET() {
  try {
    const stock = await sql`
      SELECT 
        s.*,
        COALESCE(SUM(sp.quantity), 0) as total_purchased,
        COALESCE(SUM(sp.total_cost), 0) as total_cost_purchased
      FROM stock s
      LEFT JOIN stock_purchases sp ON s.id = sp.stock_id
      GROUP BY s.id
      ORDER BY s.name
    `;

    return Response.json(stock);
  } catch (error) {
    console.error("Error fetching stock:", error);
    return Response.json({ error: "Failed to fetch stock" }, { status: 500 });
  }
}

// Create new stock item
export async function POST(request) {
  try {
    const {
      name,
      description,
      unit,
      unit_cost,
      supplier,
      current_quantity = 0,
    } = await request.json();

    if (!name || !unit || !unit_cost) {
      return Response.json(
        { error: "Name, unit, and unit_cost are required" },
        { status: 400 },
      );
    }

    const [newStock] = await sql`
      INSERT INTO stock (name, description, unit, current_quantity, unit_cost, supplier)
      VALUES (${name}, ${description}, ${unit}, ${current_quantity}, ${unit_cost}, ${supplier})
      RETURNING *
    `;

    return Response.json(newStock);
  } catch (error) {
    console.error("Error creating stock:", error);
    return Response.json({ error: "Failed to create stock" }, { status: 500 });
  }
}
