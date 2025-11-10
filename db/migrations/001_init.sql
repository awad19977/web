CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  provider VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  access_token TEXT,
  expires_at BIGINT,
  refresh_token TEXT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_accounts_provider UNIQUE (provider, "providerAccountId"),
  CONSTRAINT auth_accounts_user_provider UNIQUE ("userId", provider)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_verification_token (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS user_feature_flags (
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, feature_key)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_auth_users_updated_at
BEFORE UPDATE ON auth_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_auth_accounts_updated_at
BEFORE UPDATE ON auth_accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_user_feature_flags_updated_at
BEFORE UPDATE ON user_feature_flags
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
