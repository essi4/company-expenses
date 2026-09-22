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
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  throw new Error(
    "Missing required environment variable: SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)"
  );
}

if (!supabaseKey.startsWith("sb_secret_") && !supabaseKey.startsWith("eyJ")) {
  throw new Error(
    "Invalid Supabase key format: expected a new sb_secret_* key or legacy JWT service_role key"
  );
}

const restBaseUrl = `${process.env.SUPABASE_URL.replace(/\\/$/, "")}/rest/v1`;
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

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || stdout || `${command} exited with code ${code}`));
    });
  });
}

async function supabaseCount(table) {
  const response = await fetch(
    `${restBaseUrl}/${table}?select=*&limit=1`,
    {
      method: "HEAD",
      headers: {
        ...restHeaders,
        Prefer: "count=exact",
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase count failed for ${table}: HTTP ${response.status} ${body}`);
  }

  const contentRange = response.headers.get("content-range");
  const match = contentRange?.match(/\\/(\\d+)$/);
  if (!match) {
    throw new Error(`Supabase count failed for ${table}: missing Content-Range total`);
  }

  return Number(match[1]);
}

const query = tables
  .map(
    (table) =>
      `SELECT '${table}' AS table_name, COUNT(*) AS row_count FROM "${table}"`
  )
  .join(" UNION ALL ");

const raw = await run("npx", [
  "wrangler@4.135.0",
  "d1",
  "execute",
  "company-expenses",
  "--remote",
  "--command",
  query,
  "--json",
]);

const parsed = JSON.parse(raw);
const rows =
  parsed?.[0]?.results ??
  parsed?.results ??
  [];

const d1Counts = new Map(
  rows.map((row) => [String(row.table_name), Number(row.row_count)])
);

const failures = [];

for (const table of tables) {
  const source = await supabaseCount(table);
  const target = d1Counts.get(table) ?? 0;

  console.log(`${table}: Supabase=${source} D1=${target}`);

  if (source !== target) {
    failures.push({ table, source, target });
  }
}

if (failures.length) {
  console.error("D1 parity verification failed:", JSON.stringify(failures));
  process.exit(1);
}

console.log("D1 parity verification passed.");
