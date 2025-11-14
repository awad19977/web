import sql, { logProductTransaction } from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";

// Get all sales
export async function GET(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.SALES);
    if (response) return response;

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
    const { response } = await requireFeature(request, FEATURE_KEYS.SALES);
    if (response) return response;

    const body = await request.json();
    const product_id = body?.product_id ?? body?.productId;
    const quantity = Number(body?.quantity ?? 0);
    const unit_price = Number(body?.unit_price ?? body?.unitPrice ?? 0);
    const customer_name = body?.customer_name ?? body?.customerName ?? null;
    const notes = body?.notes ?? null;

    const damaged_quantity = Number(body?.damaged_quantity ?? body?.damagedQuantity ?? 0);
    const damage_reason = body?.damage_reason ?? body?.damageReason ?? null;

    if (!product_id || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unit_price) || unit_price <= 0) {
      return Response.json(
        { error: "Product ID, quantity, and unit_price are required" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(damaged_quantity) || damaged_quantity < 0) {
      return Response.json({ error: "damaged_quantity must be a non-negative number" }, { status: 400 });
    }

    if (damaged_quantity - quantity > 1e-9) {
      return Response.json({ error: "damaged_quantity cannot exceed sold quantity" }, { status: 400 });
    }

    const total_amount = quantity * unit_price;

    // Check if we have enough stock and fetch cost fields
    const [product] = await sql`
      SELECT current_stock, selling_price
      FROM products WHERE id = ${product_id}
    `;

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.current_stock < quantity) {
      return Response.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const result = await sql.transaction(async (tx) => {
      const [createdSale] = await tx`
        INSERT INTO sales (product_id, quantity, unit_price, total_amount, customer_name, notes, damaged_quantity, damage_reason)
        VALUES (${product_id}, ${quantity}, ${unit_price}, ${total_amount}, ${customer_name}, ${notes}, ${damaged_quantity}, ${damage_reason})
        RETURNING *
      `;

      const [productRow] = await tx`
        UPDATE products 
        SET current_stock = current_stock - ${quantity},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${product_id}
        RETURNING *
      `;

      // Log the decrease for the sold units
      await logProductTransaction({
        runner: tx,
        productId: product_id,
        type: "decrease",
        quantity: quantity,
        reason: "sale",
        metadata: { sale_id: createdSale.id },
      });

      // If there are damaged items, compute damage cost (use product.unit_cost, fallback to selling_price)
      let damageExpense = null;
      if (damaged_quantity > 0) {
        const perUnitCost = Number(product.selling_price ?? 0);
        const damageCost = perUnitCost * damaged_quantity;

        // Insert an expense record for damage
        try {
          const [expenseRow] = await tx`
            INSERT INTO expenses (category, description, amount, notes)
            VALUES (${"product_damage"}, ${`Damage for sale ${createdSale.id} product ${product_id}`}, ${damageCost}, ${damage_reason})
            RETURNING *
          `;
          damageExpense = expenseRow;
        } catch (err) {
          // If expenses table is not present or insert fails, throw to rollback
          throw new Error(`Failed to create damage expense: ${err?.message ?? String(err)}`);
        }

        // Log a product transaction for damage (use same runner)
        await logProductTransaction({
          runner: tx,
          productId: product_id,
          type: "damage",
          quantity: damaged_quantity,
          reason: "damage",
          metadata: { sale_id: createdSale.id, expense_id: damageExpense?.id ?? null },
        });
      }

      return { sale: createdSale, updatedProduct: productRow, damageExpense };
    });

    return Response.json(result);
  } catch (error) {
    console.error("Error creating sale:", error);
    return Response.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
