import { requireFeature } from "@/app/api/utils/auth";
import { setUserFeatureFlag, getUserFeatureMap, hasFeatureEnabled } from "@/app/api/utils/permissions";
import { FEATURE_KEYS } from "@/constants/featureFlags";

export async function PATCH(request, { params }) {
  try {
    const { response, user } = await requireFeature(request, FEATURE_KEYS.USERS);
    if (response) return response;

    const { featureKey, enabled } = await request.json();

    if (!featureKey || typeof enabled === "undefined") {
      return Response.json({ error: "featureKey and enabled are required" }, { status: 400 });
    }

    if (params.userId === user.id && featureKey === FEATURE_KEYS.USERS && !enabled) {
      return Response.json(
        { error: "You cannot remove your own user-management access." },
        { status: 400 },
      );
    }

    await setUserFeatureFlag(params.userId, featureKey, enabled);
    const features = await getUserFeatureMap(params.userId);

    // Ensure the acting user still has permission if they tweaked their own flags
    if (params.userId === user.id && !hasFeatureEnabled(features, FEATURE_KEYS.USERS)) {
      await setUserFeatureFlag(params.userId, FEATURE_KEYS.USERS, true);
      const fixed = await getUserFeatureMap(params.userId);
      return Response.json({ userId: params.userId, features: fixed, forced: true });
    }

    return Response.json({ userId: params.userId, features });
  } catch (error) {
    console.error("Error updating feature flags:", error);
    return Response.json({ error: "Failed to update user permissions" }, { status: 500 });
  }
}
