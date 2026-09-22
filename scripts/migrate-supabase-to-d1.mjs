import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const required = [
  "SUPABASE_URL",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const supabaseKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  throw new Error(
    "Missing Supabase backend key. Set SUPABASE_SECRET_KEY (preferred) or SUPABASE_SERVICE_ROLE_KEY."
  );
}

if (!/^sb_secret_|^eyJ/.test(supabaseKey)) {
  throw new Error(
    "Supabase backend key format is invalid. Use the project's Secret key (sb_secret_...) or legacy service_role JWT (eyJ...)."
  );
}

if (process.env.CONFIRM_D1_DATA_IMPORT !== "IMPORT-D1-DATA") {
  throw new Error(
    "Refusing data import. Set CONFIRM_D1_DATA_IMPORT=IMPORT-D1-DATA to continue."
  );
}

const restBaseUrl = `${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1`;
const restHeaders = {
  apikey: supabaseKey,
  Accept: "application/json",
};

const tables = [
  "companies",
  "company_members",
  "suppliers",
  "categories",
  "accounts",
  "budgets",
  "checks",
  "purchases",
  "payments",
  "purchase_items",
];

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function primaryKey(table) {
  return table === "company_members"
    ? ["company_id", "user_id"]
    : ["id"];
}

async function readTable(table) {
  const rows = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const response = await fetch(
      `${restBaseUrl}/${table}?select=*&limit=${pageSize}&offset=${offset}`,
      { headers: restHeaders }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase read failed for ${table}: HTTP ${response.status} ${body}`);
    }

    const page = await response.json();
    if (!Array.isArray(page)) {
      throw new Error(`Supabase read failed for ${table}: expected an array response`);
    }

    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows;
}

const blocks = [
  "PRAGMA foreign_keys = ON;",
  "PRAGMA defer_foreign_keys = ON;",
];

for (const table of tables) {
  const rows = await readTable(table);
  console.log(`Exported ${rows.length} rows from ${table}.`);

  if (!rows.length) continue;

  for (const row of rows) {
    const columns = Object.keys(row);
    const values = columns.map((column) => sqlValue(row[column]));
    const key = primaryKey(table);
    const updates = columns
      .filter((column) => !key.includes(column))
      .map((column) => `${quoteIdentifier(column)}=excluded.${quoteIdentifier(column)}`);

    blocks.push(
      `INSERT INTO ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT (${key.map(quoteIdentifier).join(", ")}) DO ${updates.length ? `UPDATE SET ${updates.join(", ")}` : "NOTHING"};`
    );
  }
}

blocks.push(
  "UPDATE purchases SET purchase_date = COALESCE(purchase_date, date) WHERE purchase_date IS NULL OR purchase_date = '';",
  "UPDATE payments SET payment_date = COALESCE(payment_date, date) WHERE payment_date IS NULL OR payment_date = '';"
);

const sql = blocks.join("\n") + "\n";
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "company-expenses-d1-"));
const file = path.join(dir, "supabase-data.sql");
await fs.writeFile(file, sql, "utf8");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`))
    );
  });
}

try {
  await run("npx", [
    "wrangler@4.135.0",
    "d1",
    "execute",
    "company-expenses",
    "--remote",
    "--file",
    file,
    "--yes",
  ]);
} finally {
  await fs.rm(dir, { recursive: true, force: true });
}

console.log("Supabase → D1 data import completed.");
