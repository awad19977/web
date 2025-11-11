import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) ? num : null;
};

const formatRecipeRow = (row) => ({
  ...row,
  id: row?.id ?? null,
  product_id: toInteger(row?.product_id) ?? row?.product_id ?? null,
  stock_id: toInteger(row?.stock_id) ?? row?.stock_id ?? null,
  quantity: toNumber(row?.quantity ?? row?.quantity_needed ?? 0),
  stock_unit_cost: toNumber(row?.stock_unit_cost ?? 0),
});

const formatProductRow = (row, recipeRows = []) => ({
  ...row,
  id: toInteger(row?.id) ?? row?.id ?? null,
  selling_price: toNumber(row?.selling_price ?? 0),
  current_stock: toNumber(row?.current_stock ?? 0),
  total_sales: toNumber(row?.total_sales ?? 0),
  total_sold: toNumber(row?.total_sold ?? 0),
  recipes: recipeRows.map(formatRecipeRow),
});

// Get all products with their recipes
export async function GET(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.PRODUCTS);
    if (response) return response;

    const productRows = await sql`
      SELECT 
        p.*,
        COALESCE(SUM(s.quantity * s.unit_price), 0) AS total_sales,
        COALESCE(SUM(s.quantity), 0) AS total_sold
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      GROUP BY p.id
      ORDER BY p.name
    `;

    if (!productRows.length) {
      return Response.json([]);
    }

    const numericIds = productRows
      .map((product) => toInteger(product.id))
      .filter((id) => id !== null);

    const recipeMap = new Map();

    if (numericIds.length) {
      const recipeRows = await sql`
        SELECT 
          pr.id,
          pr.product_id,
          pr.stock_id,
          pr.quantity_needed,
          st.name AS stock_name,
          st.unit AS stock_unit,
          st.unit_cost AS stock_unit_cost
        FROM product_recipes pr
        JOIN stock st ON pr.stock_id = st.id
        WHERE pr.product_id = ANY(${numericIds}::int[])
        ORDER BY st.name
      `;

      for (const recipe of recipeRows) {
        const productId = toInteger(recipe.product_id);
        if (productId === null) continue;
        if (!recipeMap.has(productId)) {
          recipeMap.set(productId, []);
        }
        recipeMap.get(productId).push(recipe);
      }
    }

    const payload = productRows.map((product) =>
      formatProductRow(
        product,
        recipeMap.get(toInteger(product.id) ?? product.id) ?? [],
      ),
    );

    return Response.json(payload);
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
    const { response } = await requireFeature(request, FEATURE_KEYS.PRODUCTS);
    if (response) return response;

  const body = await request.json();
  const name = String(body?.name ?? "").trim();
  const description = body?.description ? String(body.description).trim() : null;
  const sellingPrice = Number(body?.selling_price);
  const currentStockInput = body?.current_stock ?? 0;
  const currentStock = Number(currentStockInput);

    if (!name) {
      return Response.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      return Response.json(
        { error: "Selling price must be a positive number" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(currentStock) || currentStock < 0) {
      return Response.json(
        { error: "Current stock must be zero or greater" },
        { status: 400 },
      );
    }

    const [newProduct] = await sql`
      INSERT INTO products (name, description, selling_price, current_stock)
      VALUES (${name}, ${description}, ${sellingPrice}, ${currentStock})
      RETURNING *
    `;

    return Response.json(formatProductRow(newProduct));
  } catch (error) {
    if (error?.code === "23505") {
      return Response.json(
        { error: "A product with that name already exists" },
        { status: 409 },
      );
    }

    console.error("Error creating product:", error);
    return Response.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
