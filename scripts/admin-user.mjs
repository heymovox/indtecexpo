/**
 * Admin account management.
 *
 *   node scripts/admin-user.mjs list
 *   node scripts/admin-user.mjs add <email> <password> [superadmin|admin|editor] [name]
 *   node scripts/admin-user.mjs password <email> <new-password>
 *   node scripts/admin-user.mjs disable <email>
 *   node scripts/admin-user.mjs enable <email>
 *   node scripts/admin-user.mjs remove <email>
 *
 * Requires DATABASE_URL (and ADMIN_SESSION_SECRET is not needed here).
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
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
  console.error("DATABASE_URL is not set. Add it to .env before running this script.");
  process.exit(1);
}
const sql = neon(url);

const SCRYPT = { N: 16384, r: 8, p: 1 };

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password.normalize("NFKC"), salt, 64, {
    ...SCRYPT,
    maxmem: 128 * SCRYPT.N * SCRYPT.r * 2,
  });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), derived.toString("base64")].join("$");
}

const norm = (email) => email.trim().toLowerCase();
const now = () => new Date().toISOString();

async function list() {
  const rows = await sql.query(
    `SELECT email, name, role, created_at, last_login_at, disabled_at
     FROM admin_users ORDER BY created_at ASC`,
  );
  if (rows.length === 0) {
    console.log("No admins yet. The first login seeds a superadmin from ADMIN_EMAIL/ADMIN_PASSWORD.");
    return;
  }
  console.log("email".padEnd(34), "role".padEnd(12), "last login".padEnd(22), "status");
  for (const r of rows) {
    const status = r.disabled_at ? "disabled" : "active";
    console.log(
      String(r.email).padEnd(34),
      String(r.role).padEnd(12),
      String(r.last_login_at ?? "never").slice(0, 19).padEnd(22),
      status,
    );
  }
}

async function add(email, password, role = "editor", name = null) {
  if (!["editor", "admin", "superadmin"].includes(role)) {
    console.error("Role must be editor, admin or superadmin.");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  const ts = now();
  const rows = await sql.query(
    `INSERT INTO admin_users (id, email, name, role, password_hash, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO NOTHING
     RETURNING email, role`,
    [crypto.randomUUID(), norm(email), name, role, hashPassword(password), ts, ts],
  );
  if (rows.length === 0) {
    console.error(`${norm(email)} already exists.`);
    process.exit(1);
  }
  console.log(`Created ${rows[0].email} as ${rows[0].role}.`);
}

async function setPassword(email, password) {
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  const ts = now();
  const rows = await sql.query(
    `UPDATE admin_users SET password_hash = $1, updated_at = $2 WHERE email = $3 RETURNING email`,
    [hashPassword(password), ts, norm(email)],
  );
  if (rows.length === 0) {
    console.error(`${norm(email)} not found.`);
    process.exit(1);
  }
  const sessions = await sql.query(
    `UPDATE admin_sessions SET revoked_at = $1 WHERE admin_id = (SELECT id FROM admin_users WHERE email = $2) AND revoked_at IS NULL RETURNING id`,
    [ts, norm(email)],
  );
  console.log(`Password updated for ${rows[0].email}; ${sessions.length} session(s) revoked.`);
}

async function setDisabled(email, disabled) {
  const ts = now();
  const rows = await sql.query(
    `UPDATE admin_users SET disabled_at = $1, updated_at = $2 WHERE email = $3 RETURNING email, role`,
    [disabled ? ts : null, ts, norm(email)],
  );
  if (rows.length === 0) {
    console.error(`${norm(email)} not found.`);
    process.exit(1);
  }
  if (disabled) {
    const sessions = await sql.query(
      `UPDATE admin_sessions SET revoked_at = $1 WHERE admin_id = (SELECT id FROM admin_users WHERE email = $2) AND revoked_at IS NULL RETURNING id`,
      [ts, norm(email)],
    );
    console.log(`Disabled ${rows[0].email}; ${sessions.length} session(s) revoked.`);
  } else {
    console.log(`Enabled ${rows[0].email}.`);
  }
}

async function remove(email) {
  const rows = await sql.query(
    `DELETE FROM admin_users WHERE email = $1 RETURNING email`,
    [norm(email)],
  );
  if (rows.length === 0) {
    console.error(`${norm(email)} not found.`);
    process.exit(1);
  }
  console.log(`Deleted ${rows[0].email} and all of their sessions.`);
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "list":
    await list();
    break;
  case "add":
    if (args.length < 2) {
      console.error("Usage: add <email> <password> [role] [name]");
      process.exit(1);
    }
    await add(args[0], args[1], args[2] ?? "editor", args[3] ?? null);
    break;
  case "password":
    if (args.length < 2) {
      console.error("Usage: password <email> <new-password>");
      process.exit(1);
    }
    await setPassword(args[0], args[1]);
    break;
  case "disable":
    await setDisabled(args[0], true);
    break;
  case "enable":
    await setDisabled(args[0], false);
    break;
  case "remove":
    await remove(args[0]);
    break;
  default:
    console.log(
      "Usage:\n" +
        "  node scripts/admin-user.mjs list\n" +
        "  node scripts/admin-user.mjs add <email> <password> [superadmin|admin|editor] [name]\n" +
        "  node scripts/admin-user.mjs password <email> <new-password>\n" +
        "  node scripts/admin-user.mjs disable <email>\n" +
        "  node scripts/admin-user.mjs enable <email>\n" +
        "  node scripts/admin-user.mjs remove <email>",
    );
}
