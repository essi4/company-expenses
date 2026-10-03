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

function createHttpD1({
  accountId,
  databaseId,
  apiToken,
}: HttpD1Config): D1Database {
  if (!accountId || !databaseId || !apiToken) {
    throw new Error(
      "Cloudflare D1 HTTP fallback requires CF_ACCOUNT_ID, CF_D1_DATABASE_ID and CF_API_TOKEN."
    );
  }

  const endpoint =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}` +
    `/d1/database/${databaseId}/query`;

  async function query(
    sql: string,
    params: unknown[] = []
  ): Promise<HttpD1Result> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });

    const json = (await res.json()) as {
      success?: boolean;
      errors?: unknown;
      result?: HttpD1Result[];
    };

    if (!res.ok || !json.success || !json.result?.[0]) {
      throw new Error(
        JSON.stringify(json.errors ?? `Cloudflare D1 HTTP error: ${res.status}`)
      );
    }

    return json.result[0];
  }

  const db = {
    prepare(sql: string) {
      let bound: unknown[] = [];

      const statement = {
        bind(...args: unknown[]) {
          bound = args;
          return statement;
        },
        async all<T = Record<string, unknown>>() {
          const result = await query(sql, bound);
          return { results: (result.results ?? []) as T[] };
        },
        async first<T = Record<string, unknown>>() {
          const result = await query(sql, bound);
          return ((result.results ?? [])[0] ?? null) as T | null;
        },
        async run() {
          return query(sql, bound);
        },
      };

      return statement;
    },
    async exec(sql: string) {
      return query(sql);
    },
  };

  return db as unknown as D1Database;
}

/**
 * Returns the request-scoped Cloudflare D1 binding.
 *
 * Cloudflare/OpenNext uses the native binding. When the same Next.js app
 * runs on Vercel, fall back to Cloudflare's D1 HTTP API so the same D1
 * database and schema remain in use.
 */
export function getDb(): D1Database {
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
