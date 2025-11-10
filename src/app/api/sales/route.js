import sql from "@/app/api/utils/sql";

// Get all sales
export async function GET() {
  try {
    const sales = await sql`
      SELECT 
        s.*,
        p.name as product_name,
        p.selling_price as product_price
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ORDER BY s.sale_date DESC
    `;

    return Response.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return Response.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

// Create new sale
export async function POST(request) {
  try {
    const { product_id, quantity, unit_price, customer_name, notes } =
      await request.json();

    if (!product_id || !quantity || !unit_price) {
      return Response.json(
        { error: "Product ID, quantity, and unit_price are required" },
        { status: 400 },
      );
    }

    const total_amount = quantity * unit_price;

    // Check if we have enough stock
    const [product] = await sql`
      SELECT current_stock FROM products WHERE id = ${product_id}
    `;

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.current_stock < quantity) {
      return Response.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const [sale, updatedProduct] = await sql.transaction([
      sql`
        INSERT INTO sales (product_id, quantity, unit_price, total_amount, customer_name, notes)
        VALUES (${product_id}, ${quantity}, ${unit_price}, ${total_amount}, ${customer_name}, ${notes})
        RETURNING *
      `,
      sql`
        UPDATE products 
        SET current_stock = current_stock - ${quantity},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${product_id}
        RETURNING *
      `,
    ]);

    return Response.json({ sale, updatedProduct });
  } catch (error) {
    console.error("Error creating sale:", error);
    return Response.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
