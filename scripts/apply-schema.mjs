// One-shot: apply db/schema.sql to Supabase via direct Postgres connection.
// Usage: SUPABASE_DB_URL='postgresql://...' node scripts/apply-schema.mjs
import fs from "node:fs";
import path from "node:path";
import pkg from "pg";
const { Client } = pkg;

const conn = process.env.SUPABASE_DB_URL;
if (!conn) {
  console.error("Set SUPABASE_DB_URL env var (postgresql://postgres:PWD@db.PROJECT.supabase.co:5432/postgres)");
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), "db/schema.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });

console.log("Connecting to Supabase Postgres...");
await client.connect();
console.log("Connected. Applying schema (" + sql.length + " bytes)...");

try {
  await client.query(sql);
  console.log("✅ Schema applied successfully.");
} catch (e) {
  console.error("❌ Error:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
