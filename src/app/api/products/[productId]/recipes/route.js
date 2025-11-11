import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";

const toInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) ? num : null;
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatRecipeRow = (row) => ({
  ...row,
  id: row?.id ?? null,
  product_id: toInteger(row?.product_id) ?? row?.product_id ?? null,
  stock_id: toInteger(row?.stock_id) ?? row?.stock_id ?? null,
  quantity: toNumber(row?.quantity ?? row?.quantity_needed ?? 0),
  stock_unit_cost: toNumber(row?.stock_unit_cost ?? 0),
});

export async function PUT(request, { params }) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.PRODUCTS);
    if (response) return response;

    const productId = toInteger(params?.productId);
    if (!productId) {
      return Response.json({ error: "Product id is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    if (!Object.prototype.hasOwnProperty.call(body ?? {}, "items")) {
      return Response.json(
        { error: "Request body must include an items array" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.items)) {
      return Response.json(
        { error: "Items must be provided as an array" },
        { status: 400 },
      );
    }

    const itemsInput = body.items;

  const normalizedItems = [];
  const seenStockIds = new Set();

    for (const item of itemsInput) {
      const stockId = toInteger(item?.stock_id ?? item?.stockId);
      const quantity = Number(item?.quantity);

      if (!stockId || stockId <= 0) {
        return Response.json(
          { error: "Each ingredient must reference a valid stock item" },
          { status: 400 },
        );
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return Response.json(
          { error: "Ingredient quantities must be positive numbers" },
          { status: 400 },
        );
      }

      if (seenStockIds.has(stockId)) {
        return Response.json(
          { error: "A stock item can only appear once per recipe" },
          { status: 400 },
        );
      }

      seenStockIds.add(stockId);
      normalizedItems.push({ stockId, quantity });
    }

    const productRows = await sql`
      SELECT id FROM products WHERE id = ${productId}
    `;

    if (!productRows.length) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    if (normalizedItems.length) {
      const stockIds = normalizedItems.map((item) => item.stockId);
      const existingStock = await sql`
        SELECT id FROM stock WHERE id = ANY(${stockIds}::int[])
      `;

      if (existingStock.length !== normalizedItems.length) {
        return Response.json(
          { error: "One or more stock items could not be found" },
          { status: 400 },
        );
      }
    }

    await sql.transaction(async (tx) => {
      await tx`
        DELETE FROM product_recipes
        WHERE product_id = ${productId}
      `;

      for (const item of normalizedItems) {
        await tx`
          INSERT INTO product_recipes (product_id, stock_id, quantity_needed)
          VALUES (${productId}, ${item.stockId}, ${item.quantity})
        `;
      }

      await tx`
        UPDATE products
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ${productId}
      `;
    });

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
        WHERE pr.product_id = ${productId}
        ORDER BY st.name
    `;

    return Response.json({
        productId,
        recipes: recipeRows.map(formatRecipeRow),
    });
  } catch (error) {
    console.error("Error updating product recipe:", error);
    return Response.json(
      { error: "Failed to update product recipe" },
      { status: 500 },
    );
  }
}
