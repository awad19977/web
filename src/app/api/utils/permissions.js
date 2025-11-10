import sql from './sql';
import {
  ALL_FEATURE_KEYS,
  DEFAULT_FEATURE_FLAGS,
} from '@/constants/featureFlags';

const normalizeFeatureValue = (value) => value === true || value === 'true' || value === 1;

export const normalizeFeatureMap = (source = {}) => {
  const normalized = { ...DEFAULT_FEATURE_FLAGS };
  for (const key of ALL_FEATURE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      normalized[key] = normalizeFeatureValue(source[key]);
    }
  }
  return normalized;
};

export const getUserFeatureMap = async (userId) => {
  if (!userId) {
    return { ...DEFAULT_FEATURE_FLAGS };
  }

  const rows = await sql`
    SELECT feature_key, enabled
    FROM user_feature_flags
    WHERE user_id = ${userId}
  `;

  const normalized = { ...DEFAULT_FEATURE_FLAGS };
  for (const row of rows) {
    if (ALL_FEATURE_KEYS.includes(row.feature_key)) {
      normalized[row.feature_key] = row.enabled;
    }
  }
  return normalized;
};

export const setUserFeatureFlag = async (userId, featureKey, enabled, runner = sql) => {
  if (!ALL_FEATURE_KEYS.includes(featureKey)) {
    throw new Error(`Unsupported feature key: ${featureKey}`);
  }

  await runner`
    INSERT INTO user_feature_flags (user_id, feature_key, enabled)
    VALUES (${userId}, ${featureKey}, ${normalizeFeatureValue(enabled)})
    ON CONFLICT (user_id, feature_key)
    DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()
  `;
};

export const setUserFeatureMap = async (userId, features) => {
  const normalized = normalizeFeatureMap(features);

  await sql.transaction(async (tx) => {
    for (const key of ALL_FEATURE_KEYS) {
      const value = normalized[key] ?? false;
      await tx`
        INSERT INTO user_feature_flags (user_id, feature_key, enabled)
        VALUES (${userId}, ${key}, ${value})
        ON CONFLICT (user_id, feature_key)
        DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()
      `;
    }
  });

  return normalized;
};

export const ensureUserFeatureDefaults = async (userId) => {
  return setUserFeatureMap(userId, DEFAULT_FEATURE_FLAGS);
};

export const hasFeatureEnabled = (featureMap, featureKey) => {
  if (!featureMap) {
    return false;
  }
  return Boolean(featureMap[featureKey]);
};
