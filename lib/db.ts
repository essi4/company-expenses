import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

/**
 * Returns the request-scoped Cloudflare D1 binding.
 *
 * Never create a global database client: Worker bindings are request/runtime
 * resources and should be resolved inside the request that uses them.
 */
export function getDb(): D1Database {
  const { env } = getCloudflareContext();
  const db = (env as unknown as { DB?: D1Database }).DB;

  if (!db) {
    throw new Error(
      "Cloudflare D1 binding DB is unavailable. Run through the Workers/OpenNext runtime."
    );
  }

  return db;
}
