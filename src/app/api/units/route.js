import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";

export async function GET(request) {
  try {
    let authResult = await requireFeature(request, FEATURE_KEYS.UNITS_VIEW);
    if (authResult.response) {
      authResult = await requireFeature(request, FEATURE_KEYS.UNITS);
      if (authResult.response) {
        authResult = await requireFeature(request, FEATURE_KEYS.STOCK);
        if (authResult.response) return authResult.response;
      }
    }

    const rows = await sql`
      SELECT id, name, symbol
      FROM stock_units
      ORDER BY name ASC
    `;

    return Response.json(
      rows.map((unit) => ({
        id: unit.id,
        name: unit.name,
        symbol: unit.symbol,
      })),
    );
  } catch (error) {
    console.error("Error fetching units:", error);
    return Response.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.UNITS);
    if (response) return response;

    const { name, symbol } = await request.json();
    const normalizedName = name?.trim();
    const normalizedSymbol = symbol?.trim() || null;

    if (!normalizedName) {
      return Response.json(
        { error: "Unit name is required" },
        { status: 400 },
      );
    }

    const [unit] = await sql`
      INSERT INTO stock_units (name, symbol)
      VALUES (${normalizedName}, ${normalizedSymbol})
      ON CONFLICT (name)
      DO NOTHING
      RETURNING id, name, symbol
    `;

    if (!unit) {
      return Response.json(
        { error: "A unit with this name already exists" },
        { status: 409 },
      );
    }

    return Response.json({
      id: unit.id,
      name: unit.name,
      symbol: unit.symbol,
    });
  } catch (error) {
    console.error("Error creating unit:", error);
    return Response.json({ error: "Failed to create unit" }, { status: 500 });
  }
}
