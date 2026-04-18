#!/usr/bin/env node
/**
 * Dalil · one-shot DB bootstrapper.
 *
 * Applies migrations/20260418140000_init.sql, then seed.sql. Bypasses the
 * Supabase CLI — reads creds from .env (or .env.local) and talks to
 * Postgres directly via `pg` over the Supabase pooler.
 *
 * Usage:
 *   npm run db:init
 *
 * .env requirements:
 *   NEXT_PUBLIC_SUPABASE_URL   = https://<ref>.supabase.co
 *   SUPABASE_DB_PASSWORD       = your project's DB password
 *
 * Optional overrides:
 *   SUPABASE_DB_URL            = full postgres:// URL (skips construction)
 *   SUPABASE_POOLER_REGION     = aws-0-us-east-1 (default)
 *   DALIL_SKIP_SEED=1          = apply migration only, no seed
 *   DALIL_RESET=1              = drop public schema first (destructive)
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import { config as loadEnv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load .env, then .env.local (later overrides earlier).
loadEnv({ path: path.join(ROOT, ".env") });
loadEnv({ path: path.join(ROOT, ".env.local"), override: true });

const MIGRATION = path.join(
  ROOT,
  "supabase",
  "migrations",
  "20260418140000_init.sql",
);
const SEED = path.join(ROOT, "supabase", "seed.sql");

const RESET = process.env.DALIL_RESET === "1";
const SKIP_SEED = process.env.DALIL_SKIP_SEED === "1";

function log(msg) {
  process.stdout.write(`\x1b[36m▪\x1b[0m ${msg}\n`);
}
function ok(msg) {
  process.stdout.write(`\x1b[32m✓\x1b[0m ${msg}\n`);
}
function fail(msg) {
  process.stderr.write(`\x1b[31m✗\x1b[0m ${msg}\n`);
}

function resolveConnectionString() {
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!url || !password) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD in .env.\n" +
        "  Add: SUPABASE_DB_PASSWORD=<your DB password>\n" +
        "  Or:  SUPABASE_DB_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres",
    );
  }
  const match = url.match(/^https?:\/\/([a-z0-9]+)\.supabase\.co/i);
  if (!match) {
    throw new Error(
      `Can't parse project ref from NEXT_PUBLIC_SUPABASE_URL: ${url}`,
    );
  }
  const ref = match[1];
  const region = process.env.SUPABASE_POOLER_REGION || "aws-0-us-east-1";
  const encodedPw = encodeURIComponent(password);
  // Session-mode pooler (port 5432) supports DDL; transaction mode (6543) does not.
  return `postgresql://postgres.${ref}:${encodedPw}@${region}.pooler.supabase.com:5432/postgres?sslmode=require`;
}

async function main() {
  const connectionString = resolveConnectionString();
  const redacted = connectionString.replace(/:[^:@/]+@/, ":****@");
  log(`Connecting to ${redacted}`);

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 60000,
  });

  try {
    await client.connect();
  } catch (e) {
    fail(`Connection failed: ${e.message}`);
    fail(
      "If the pooler region guess was wrong, set SUPABASE_POOLER_REGION\n" +
        "  (e.g. aws-0-us-west-1) in .env, or set SUPABASE_DB_URL directly.\n" +
        "  Your project's exact URI is at Supabase dashboard → Project Settings → Database → Connection string.",
    );
    process.exit(1);
  }
  ok("Connected.");

  if (RESET) {
    log("DALIL_RESET=1 — dropping public schema…");
    await client.query(`drop schema if exists public cascade; create schema public;`);
    await client.query(`grant usage on schema public to anon, authenticated, service_role;`);
    ok("public schema reset.");
  }

  const migrationSql = await readFile(MIGRATION, "utf8");
  log(`Applying migration: ${path.relative(ROOT, MIGRATION)}`);
  try {
    await client.query(migrationSql);
    ok("Migration applied.");
  } catch (e) {
    fail(`Migration failed: ${e.message}`);
    fail("If this is a re-run after a partial apply, try: DALIL_RESET=1 npm run db:init");
    await client.end();
    process.exit(1);
  }

  if (!SKIP_SEED) {
    const seedSql = await readFile(SEED, "utf8");
    log(`Applying seed: ${path.relative(ROOT, SEED)}`);
    try {
      await client.query(seedSql);
      ok("Seed applied.");
    } catch (e) {
      fail(`Seed failed: ${e.message}`);
      await client.end();
      process.exit(1);
    }
  } else {
    log("DALIL_SKIP_SEED=1 — skipping seed data.");
  }

  // Refresh the PostgREST schema cache so the app sees the new tables.
  try {
    await client.query(`notify pgrst, 'reload schema';`);
    ok("PostgREST schema cache reloaded.");
  } catch {
    // non-fatal
  }

  await client.end();
  ok("Done. Run `npm run dev` and open http://localhost:3000.");
}

main().catch((e) => {
  fail(e.message ?? String(e));
  process.exit(1);
});
