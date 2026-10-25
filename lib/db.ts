import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

type HttpD1Config = {
  accountId: string;
  databaseId: string;
  apiToken: string;
};

type HttpD1Result = {
  meta: {
    last_row_id?: number;
    changes?: number;
    changed_db?: boolean;
    duration?: number;
  };
  results?: unknown[];
};

function createHttpD1({ accountId, databaseId, apiToken }: HttpD1Config): D1Database {
  if (!accountId || !databaseId || !apiToken) {
    throw new Error("Cloudflare D1 HTTP fallback requires CF_ACCOUNT_ID, CF_D1_DATABASE_ID and CF_API_TOKEN.");
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  async function query(sql: string, params: unknown[] = []): Promise<HttpD1Result> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }),
    });
    const json = (await res.json()) as { success?: boolean; errors?: unknown; result?: HttpD1Result[] };
    if (!res.ok || !json.success || !json.result?.[0]) {
      throw new Error(JSON.stringify(json.errors ?? `Cloudflare D1 HTTP error: ${res.status}`));
    }
    return json.result[0];
  }

  const db = {
    prepare(sql: string) {
      let bound: unknown[] = [];
      const statement = {
        bind(...args: unknown[]) { bound = args; return statement; },
        async all<T = Record<string, unknown>>() {
          const result = await query(sql, bound);
          return { results: (result.results ?? []) as T[] };
        },
        async first<T = Record<string, unknown>>() {
          const result = await query(sql, bound);
          return ((result.results ?? [])[0] ?? null) as T | null;
        },
        async run() { return query(sql, bound); },
      };
      return statement;
    },
    async exec(sql: string) { return query(sql); },
  };
  return db as unknown as D1Database;
}

type LocalStatement = {
  bind: (...args: unknown[]) => LocalStatement;
  all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  run: () => Promise<{ meta: { last_row_id?: number; changes?: number } }>;
};

function createLocalSqlite(): D1Database {
  // Node 22+ provides SQLite without a separate native npm dependency.
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const { DatabaseSync } = require("node:sqlite") as {
    DatabaseSync: new (path: string) => {
      exec: (sql: string) => void;
      prepare: (sql: string) => {
        all: (...params: unknown[]) => Record<string, unknown>[];
        get: (...params: unknown[]) => Record<string, unknown> | undefined;
        run: (...params: unknown[]) => { lastInsertRowid: number | bigint; changes: number | bigint };
      };
      close: () => void;
    };
  };

  const dataDir = path.resolve(process.env.LOCAL_DATA_DIR || path.join(process.cwd(), "data"));
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const dbPath = path.join(dataDir, "company-expenses.sqlite");
  const sqlite = new DatabaseSync(dbPath);
  try { fs.chmodSync(dbPath, 0o600); } catch {}
  sqlite.exec("PRAGMA foreign_keys = ON;");
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("CREATE TABLE IF NOT EXISTS __app_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");

  const migrationDir = path.join(process.cwd(), "migrations");
  const migrationFiles = fs.readdirSync(migrationDir)
    .filter((name: string) => /^\d+_.+\.sql$/.test(name))
    .sort();
  const hasMigration = sqlite.prepare("SELECT name FROM __app_migrations WHERE name = ?");

  for (const name of migrationFiles) {
    if (hasMigration.get(name)) continue;
    const sql = fs.readFileSync(path.join(migrationDir, name), "utf8");
    sqlite.exec("BEGIN");
    try {
      sqlite.exec(sql);
      sqlite.prepare("INSERT INTO __app_migrations(name) VALUES (?)").run(name);
      sqlite.exec("COMMIT");
    } catch (error) {
      sqlite.exec("ROLLBACK");
      sqlite.close();
      throw new Error(`Local database migration failed (${name}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  sqlite.prepare("INSERT OR IGNORE INTO companies (id, name) VALUES (1, ?)").run(process.env.LOCAL_COMPANY_NAME || "شرکت البرز");

  const db = {
    prepare(sql: string): LocalStatement {
      let bound: unknown[] = [];
      const statement: LocalStatement = {
        bind(...args: unknown[]) { bound = args; return statement; },
        async all<T = Record<string, unknown>>() {
          return { results: sqlite.prepare(sql).all(...bound) as T[] };
        },
        async first<T = Record<string, unknown>>() {
          return (sqlite.prepare(sql).get(...bound) as T | undefined) ?? null;
        },
        async run() {
          const result = sqlite.prepare(sql).run(...bound);
          return { meta: { last_row_id: Number(result.lastInsertRowid), changes: Number(result.changes) } };
        },
      };
      return statement;
    },
    async exec(sql: string) {
      sqlite.exec(sql);
      return { success: true };
    },
  };
  return db as unknown as D1Database;
}

/** Select local SQLite only when explicitly enabled; cloud behavior stays unchanged. */
export function getDb(): D1Database {
  if (process.env.LOCAL_MODE === "true") return createLocalSqlite();

  try {
    const ctx = getCloudflareContext();
    const db = (ctx?.env as unknown as { DB?: D1Database } | undefined)?.DB;
    if (db) return db;
  } catch {
    // Not running inside the Cloudflare/OpenNext runtime.
  }

  return createHttpD1({
    accountId: process.env.CF_ACCOUNT_ID ?? "",
    databaseId: process.env.CF_D1_DATABASE_ID ?? "",
    apiToken: process.env.CF_API_TOKEN ?? "",
  });
}
