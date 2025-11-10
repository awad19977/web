import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Pool } from "pg";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "db/migrations");

const ensureMigrationsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const getAppliedMigrations = async (client) => {
  const result = await client.query("SELECT name FROM schema_migrations ORDER BY name ASC");
  return new Set(result.rows.map((row) => row.name));
};

const loadMigrationFiles = async () => {
  const files = await readdir(MIGRATIONS_DIR);
  return files
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
};

const applyMigration = async (client, fileName) => {
  const filePath = path.join(MIGRATIONS_DIR, fileName);
  const sql = await readFile(filePath, "utf8");

  if (!sql.trim()) {
    console.log(`Skipping empty migration ${fileName}`);
    return;
  }

  console.log(`\u2022 Applying ${fileName}`);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [fileName]);
    await client.query("COMMIT");
    console.log(`  \u2713 Applied ${fileName}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`  \u2717 Failed ${fileName}`);
    throw error;
  }
};

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Export it before running migrations.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);
    const files = await loadMigrationFiles();

    if (files.length === 0) {
      console.log("No migration files found in db/migrations.");
      return;
    }

    const pending = files.filter((file) => !applied.has(file));

    if (pending.length === 0) {
      console.log("Database is already up to date.");
      return;
    }

    for (const file of pending) {
      await applyMigration(client, file);
    }

    console.log("All pending migrations applied successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
