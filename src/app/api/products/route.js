import sql from "@/app/api/utils/sql";

// Get all products with their recipes
export async function GET() {
  try {
    const products = await sql`
      SELECT 
        p.*,
        COALESCE(SUM(s.quantity * s.unit_price), 0) as total_sales,
        COALESCE(SUM(s.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      GROUP BY p.id
      ORDER BY p.name
    `;

    // Get recipes for each product
    for (let product of products) {
      const recipes = await sql`
        SELECT 
          pr.*,
          st.name as stock_name,
          st.unit as stock_unit,
          st.unit_cost as stock_unit_cost
        FROM product_recipes pr
        JOIN stock st ON pr.stock_id = st.id
        WHERE pr.product_id = ${product.id}
      `;
      product.recipes = recipes;
    }

    return Response.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

// Create new product
export async function POST(request) {
  try {
    const {
      name,
      description,
      selling_price,
      current_stock = 0,
    } = await request.json();

    if (!name || !selling_price) {
      return Response.json(
        { error: "Name and selling_price are required" },
        { status: 400 },
      );
    }

    const [newProduct] = await sql`
      INSERT INTO products (name, description, selling_price, current_stock)
      VALUES (${name}, ${description}, ${selling_price}, ${current_stock})
      RETURNING *
    `;

    return Response.json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    return Response.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
