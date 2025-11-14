import { getToken } from '@auth/core/jwt';
import { getUserFeatureMap, hasFeatureEnabled, DEFAULT_FEATURE_FLAGS } from './permissions';

const isSecure = () => (process.env.AUTH_URL ?? '').startsWith('https');

export const getAuthContext = async (request) => {
  if (!process.env.AUTH_SECRET) {
    return { user: null };
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: isSecure(),
  });

  if (!token || !token.sub) {
    return { user: null };
  }

  let featureMap = null;
  if (token.features && typeof token.features === 'object') {
    featureMap = token.features;
  }

  if (!featureMap) {
    try {
      featureMap = await getUserFeatureMap(token.sub);
    } catch (error) {
      console.error('Failed to load user feature flags', error);
      featureMap = { ...DEFAULT_FEATURE_FLAGS };
    }
  }

  return {
    user: {
      id: token.sub,
      email: token.email,
      name: token.name,
      features: featureMap,
    },
  };
};

export const requireAuth = async (request) => {
  const { user } = await getAuthContext(request);
  if (!user) {
    return {
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { user };
};

export const requireFeature = async (request, featureKey) => {
  const { user } = await getAuthContext(request);
  if (!user) {
    return {
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasFeatureEnabled(user.features, featureKey)) {
    return {
      response: Response.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { user };
};
