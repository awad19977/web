import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";

export async function DELETE(request, { params }) {
  try {
  const { response } = await requireFeature(request, FEATURE_KEYS.UNITS);
    if (response) return response;

    const unitId = params?.unitId;
    if (!unitId) {
      return Response.json({ error: "Unit id is required" }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM stock_units
      WHERE id = ${unitId}
      RETURNING id
    `;

    if (!result.length) {
      return Response.json({ error: "Unit not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error?.code === "23503") {
      return Response.json(
        { error: "Cannot delete a unit that is in use" },
        { status: 409 },
      );
    }

    console.error("Error deleting unit:", error);
    return Response.json({ error: "Failed to delete unit" }, { status: 500 });
  }
}
