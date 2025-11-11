import { hash } from "argon2";
import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_KEYS,
} from "@/constants/featureFlags";
import {
  normalizeFeatureMap,
  setUserFeatureMap,
} from "@/app/api/utils/permissions";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

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

export async function POST(request) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.USERS);
    if (response) return response;

    const body = await request.json();

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "").trim();
    const featuresInput = body?.features ?? DEFAULT_FEATURE_FLAGS;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return Response.json({ error: "A valid email address is required" }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    const passwordHash = await hash(password);
    const normalizedFeatures = normalizeFeatureMap(featuresInput);

    const result = await sql.transaction(async (tx) => {
      const [newUser] = await tx`
        INSERT INTO auth_users (name, email)
        VALUES (${name}, ${email})
        RETURNING id, name, email, "emailVerified", image
      `;

      await tx`
        INSERT INTO auth_accounts ("userId", provider, type, "providerAccountId", password)
        VALUES (${newUser.id}, 'credentials', 'credentials', ${newUser.id}, ${passwordHash})
        ON CONFLICT ("userId", provider)
        DO UPDATE SET password = EXCLUDED.password, updated_at = NOW()
      `;

      const appliedFeatures = await setUserFeatureMap(
        newUser.id,
        normalizedFeatures,
        tx,
      );

      return {
        ...newUser,
        features: appliedFeatures,
      };
    });

    return Response.json({ user: result }, { status: 201 });
  } catch (error) {
    if (error?.code === "23505") {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    console.error("Error creating user:", error);
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }
}
