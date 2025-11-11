import sql from "@/app/api/utils/sql";
import { requireFeature } from "@/app/api/utils/auth";
import {
  FEATURE_KEYS,
  DEFAULT_FEATURE_FLAGS,
} from "@/constants/featureFlags";
import {
  normalizeFeatureMap,
  setUserFeatureMap,
  getUserFeatureMap,
} from "@/app/api/utils/permissions";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export async function PATCH(request, { params }) {
  try {
    const { response, user: actingUser } = await requireFeature(
      request,
      FEATURE_KEYS.USERS,
    );
    if (response) return response;

    const userId = params?.userId;
    if (!userId) {
      return Response.json({ error: "User id is required" }, { status: 400 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : undefined;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const hasFeaturePayload = typeof body?.features !== "undefined";

    if (!name && !email && !hasFeaturePayload) {
      return Response.json({ error: "No changes provided" }, { status: 400 });
    }

    if (email && !EMAIL_REGEX.test(email)) {
      return Response.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const existingUsers = await sql`
      SELECT id, name, email, "emailVerified", image
      FROM auth_users
      WHERE id = ${userId}
    `;

    if (!existingUsers.length) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const existingUser = existingUsers[0];

    if (email && email !== existingUser.email) {
      const duplicateCheck = await sql`
        SELECT id FROM auth_users WHERE email = ${email} AND id <> ${userId}
      `;
      if (duplicateCheck.length) {
        return Response.json(
          { error: "Another account already uses this email" },
          { status: 409 },
        );
      }
    }

    let featurePayload = null;
    if (hasFeaturePayload) {
      featurePayload = normalizeFeatureMap(body.features ?? DEFAULT_FEATURE_FLAGS);
      if (
        userId === actingUser.id &&
        featurePayload[FEATURE_KEYS.USERS] === false
      ) {
        return Response.json(
          { error: "You cannot remove your own user-management access." },
          { status: 400 },
        );
      }
    }

    const result = await sql.transaction(async (tx) => {
      let nextUser = existingUser;
      const shouldUpdateProfile = Boolean(
        (name && name !== existingUser.name) ||
          (email && email !== existingUser.email),
      );

      if (shouldUpdateProfile) {
        const [updated] = await tx`
          UPDATE auth_users
          SET name = ${name ?? existingUser.name},
              email = ${email ?? existingUser.email},
              updated_at = NOW()
          WHERE id = ${userId}
          RETURNING id, name, email, "emailVerified", image
        `;
        nextUser = updated;
      }

      let featureMap = null;
      if (featurePayload) {
        featureMap = await setUserFeatureMap(userId, featurePayload, tx);
      }

      return { user: nextUser, features: featureMap };
    });

    const features = result.features ?? (await getUserFeatureMap(userId));

    return Response.json({
      user: {
        ...result.user,
        features,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { response, user: actingUser } = await requireFeature(
      request,
      FEATURE_KEYS.USERS,
    );
    if (response) return response;

    const userId = params?.userId;
    if (!userId) {
      return Response.json({ error: "User id is required" }, { status: 400 });
    }

    if (userId === actingUser.id) {
      return Response.json(
        { error: "You cannot delete your own account." },
        { status: 400 },
      );
    }

    const deleted = await sql`
      DELETE FROM auth_users
      WHERE id = ${userId}
      RETURNING id
    `;

    if (!deleted.length) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return Response.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
