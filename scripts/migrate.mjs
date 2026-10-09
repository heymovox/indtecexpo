/**
 * Creates the records table. Safe to re-run.
 *
 *   node scripts/migrate.mjs
 *
 * Requires DATABASE_URL in the environment (or a .env file).
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { neon } from "@neondatabase/serverless";

const root = process.cwd();
const envPath = path.join(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] === undefined) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env before running migrations.");
  process.exit(1);
}

const queries = [
  `CREATE TABLE IF NOT EXISTS records (
     collection   TEXT NOT NULL,
     id           TEXT NOT NULL,
     created_at   TEXT NOT NULL,
     updated_at   TEXT,
     stage        TEXT,
     data         JSONB NOT NULL DEFAULT '{}'::jsonb,
     PRIMARY KEY (collection, id)
   );`,
  `CREATE INDEX IF NOT EXISTS records_collection_created_at_idx
     ON records (collection, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS records_collection_slug_idx
     ON records (collection, (data ->> 'slug'));`,
];

const sql = neon(url);
for (const query of queries) {
  await sql.query(query);
  console.log("  ok:", query.split("\n")[0].trim());
}
console.log("Migration complete.");