import { hash } from "argon2";
import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import { FEATURE_KEYS } from "@/constants/featureFlags";

export async function POST(request, { params }) {
  try {
    const { response } = await requireFeature(request, FEATURE_KEYS.USERS);
    if (response) return response;

    const userId = params?.userId;
    if (!userId) {
      return Response.json({ error: "User id is required" }, { status: 400 });
    }

    const body = await request.json();
    const password = String(body?.password ?? "").trim();

    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    const users = await sql`
      SELECT id FROM auth_users WHERE id = ${userId}
    `;

    if (!users.length) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const passwordHash = await hash(password);

    await sql`
      INSERT INTO auth_accounts ("userId", provider, type, "providerAccountId", password)
      VALUES (${userId}, 'credentials', 'credentials', ${userId}, ${passwordHash})
      ON CONFLICT ("userId", provider)
      DO UPDATE SET password = EXCLUDED.password, updated_at = NOW()
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    return Response.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
