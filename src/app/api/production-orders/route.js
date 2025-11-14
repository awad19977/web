import { FEATURE_KEYS } from "@/constants/featureFlags";
import { requireFeature } from "@/app/api/utils/auth";
import sql, { logStockTransaction } from "@/app/api/utils/sql";

const toInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeOrder = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: toInteger(row.id) ?? row.id ?? null,
    product_id: toInteger(row.product_id) ?? row.product_id ?? null,
    product_name: row.product_name ?? "",
    quantity_to_produce: toNumber(row.quantity_to_produce),
    quantity_produced: toNumber(row.quantity_produced),
    status: typeof row.status === "string" ? row.status.toLowerCase() : "planned",
    status_reason: row.status_reason ?? null,
    production_cost: toNumber(row.production_cost),
    started_at: row.started_at ? new Date(row.started_at).toISOString() : null,
    completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
};

const loadOrderWithProduct = async (orderId) => {
  const rows = await sql`
    SELECT po.*, p.name AS product_name
    FROM production_orders po
    JOIN products p ON po.product_id = p.id
    WHERE po.id = ${orderId}
    LIMIT 1
  `;

  return normalizeOrder(rows?.[0]);
};

export async function GET(request) {
  const featureCheck = await requireFeature(request, FEATURE_KEYS.PRODUCTION);
  if (featureCheck.response) {
    return featureCheck.response;
  }

  try {
    const rows = await sql`
      SELECT po.*, p.name AS product_name
      FROM production_orders po
      JOIN products p ON po.product_id = p.id
      ORDER BY po.created_at DESC, po.id DESC
    `;

    const orders = Array.isArray(rows) ? rows.map((row) => normalizeOrder(row)) : [];

    return Response.json({ orders });
  } catch (error) {
    console.error("Failed to load production orders", error);
    return Response.json(
      {
        error: "Unable to load production orders",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const featureCheck = await requireFeature(request, FEATURE_KEYS.PRODUCTION);
  if (featureCheck.response) {
    return featureCheck.response;
  }

  let payload = null;
  try {
    payload = await request.json();
  } catch (error) {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const productId = Number(payload?.product_id ?? payload?.productId);
  const quantity = Number(payload?.quantity_to_produce ?? payload?.quantity ?? payload?.quantityRequested);

  if (!Number.isInteger(productId) || productId <= 0) {
    return Response.json(
      { error: "A valid product_id is required" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return Response.json(
      { error: "quantity_to_produce must be a positive number" },
      { status: 400 }
    );
  }

  try {
    const productRows = await sql`
      SELECT id, name
      FROM products
      WHERE id = ${productId}
      LIMIT 1
    `;

    const product = productRows?.[0];
    if (!product) {
      return Response.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const recipeRows = await sql`
      SELECT pr.quantity_needed, st.unit_cost
      FROM product_recipes pr
      LEFT JOIN stock st ON pr.stock_id = st.id
      WHERE pr.product_id = ${productId}
    `;

    const costPerUnit = Array.isArray(recipeRows)
      ? recipeRows.reduce((total, item) => {
          const needed = toNumber(item.quantity_needed);
          const unitCost = toNumber(item.unit_cost);
          return total + needed * unitCost;
        }, 0)
      : 0;

    const productionCost = costPerUnit * quantity;

    const insertedRows = await sql`
      INSERT INTO production_orders (product_id, quantity_to_produce, quantity_produced, status, production_cost)
      VALUES (${productId}, ${quantity}, 0, ${"planned"}, ${productionCost})
      RETURNING id
    `;

    const inserted = insertedRows?.[0];
    if (!inserted) {
      throw new Error("Insert did not return an order id");
    }

    const order = await loadOrderWithProduct(inserted.id);
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Failed to create production order", error);
    return Response.json(
      {
        error: "Unable to create production order",
      },
      { status: 500 }
    );
  }
}
