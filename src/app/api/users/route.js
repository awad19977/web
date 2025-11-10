import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { DEFAULT_FEATURE_FLAGS, FEATURE_KEYS } from "@/constants/featureFlags";

export async function GET(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.USERS);
    if (response) return response;

    const users = await sql`
      SELECT id, name, email, "emailVerified", image
      FROM auth_users
      ORDER BY LOWER(email)
    `;

    const featureRows = await sql`
      SELECT user_id, feature_key, enabled
      FROM user_feature_flags
    `;

    const featureMapByUser = new Map();
    for (const row of featureRows) {
      const existing = featureMapByUser.get(row.user_id) ?? { ...DEFAULT_FEATURE_FLAGS };
      existing[row.feature_key] = row.enabled;
      featureMapByUser.set(row.user_id, existing);
    }

    const payload = users.map((user) => ({
      ...user,
      features: featureMapByUser.get(user.id) ?? { ...DEFAULT_FEATURE_FLAGS },
    }));

    return Response.json({ users: payload });
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
