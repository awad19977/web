import process from "node:process";
import { Pool } from "pg";
import { hash } from "argon2";
import { DEFAULT_FEATURE_FLAGS, FEATURE_KEYS } from "../src/constants/featureFlags.js";

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const name = process.env.SEED_ADMIN_NAME ?? "Administrator";
const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Export it before running the seed script.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
        INSERT INTO auth_users (name, email)
        VALUES ($1, $2)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `,
      [name, email]
    );

    const userId = userResult.rows[0].id;
    const passwordHash = await hash(password);

    await client.query(
      `
        INSERT INTO auth_accounts ("userId", provider, type, "providerAccountId", password)
        VALUES ($1, 'credentials', 'credentials', $2, $3)
        ON CONFLICT ("userId", provider)
        DO UPDATE SET password = EXCLUDED.password, updated_at = NOW()
      `,
      [userId, userId, passwordHash]
    );

    const features = { ...DEFAULT_FEATURE_FLAGS, [FEATURE_KEYS.USERS]: true };

    for (const [featureKey, enabled] of Object.entries(features)) {
      await client.query(
        `
          INSERT INTO user_feature_flags (user_id, feature_key, enabled)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, feature_key)
          DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()
        `,
        [userId, featureKey, enabled]
      );
    }

    await client.query("COMMIT");

    console.log("Seed complete. Admin credentials:");
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
