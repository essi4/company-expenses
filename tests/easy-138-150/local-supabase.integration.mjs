import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.EASY_APP_URL ?? "http://127.0.0.1:3000";

if (!baseUrl || !publishableKey || !serviceRoleKey) throw new Error("Missing Supabase integration environment");

const admin = createClient(baseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const anon = createClient(baseUrl, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function expectStatus(label, response, expected) {
  if (response.status !== expected) throw new Error(`${label}: expected ${expected}, got ${response.status}`);
}

const slug = `ci-${Date.now()}`;
const { data: seeded, error: seedError } = await admin
  .from("marketplace_apps")
  .insert({ slug, name: "EASY CI Staging Probe" })
  .select("id,slug")
  .single();
if (seedError) throw new Error(`service-role insert failed: ${seedError.message}`);

const { data: blockedRows, error: blockedError } = await anon
  .from("marketplace_apps")
  .select("id,slug")
  .eq("slug", slug);
if (blockedError) throw new Error(`RLS query failed unexpectedly: ${blockedError.message}`);
if ((blockedRows ?? []).length !== 0) throw new Error("RLS failure: anonymous client can read protected marketplace_apps rows");

const email = `easy-ci-${Date.now()}@example.test`;
const password = "EASY-CI-Only-Password-123!";
const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (createError || !created.user) throw new Error(`Auth user creation failed: ${createError?.message ?? "unknown"}`);

const cookies = new Map();
const ssr = createServerClient(baseUrl, publishableKey, {
  cookies: {
    getAll: () => Array.from(cookies.entries()).map(([name, value]) => ({ name, value })),
    setAll: (items) => items.forEach(({ name, value }) => cookies.set(name, value)),
  },
});
const { data: signedIn, error: signInError } = await ssr.auth.signInWithPassword({ email, password });
if (signInError || !signedIn.session) throw new Error(`Auth sign-in failed: ${signInError?.message ?? "no session"}`);
if (cookies.size === 0) throw new Error("SSR auth did not produce cookies");

const cookieHeader = Array.from(cookies.entries()).map(([name, value]) => `${name}=${value}`).join("; ");

await expectStatus("Health API", await fetch(`${appUrl}/api/health`), 200);
const unauthenticated = await fetch(`${appUrl}/api/control-center`, { redirect: "manual" });
await expectStatus("Unauthenticated Control Center redirect", unauthenticated, 307);
const location = unauthenticated.headers.get("location") ?? "";
if (!location.startsWith("/login?next=")) throw new Error(`Unexpected unauthenticated redirect: ${location}`);

const authenticated = await fetch(`${appUrl}/api/control-center`, {
  headers: { Cookie: cookieHeader },
});
await expectStatus("Authenticated Control Center API", authenticated, 200);
const payload = await authenticated.json();
if (payload?.ok !== true) throw new Error("Authenticated Control Center API did not return ok=true");
if (!Array.isArray(payload?.stages) || payload.stages.length !== 13) {
  throw new Error(`Expected 13 executed stages, got ${payload?.stages?.length ?? "invalid"}`);
}

await admin.from("marketplace_apps").delete().eq("id", seeded.id);
await admin.auth.admin.deleteUser(created.user.id);

console.log("REAL SUPABASE STAGING INTEGRATION: PASS");
console.log("Migration + RLS + Auth + API + 13-stage pipeline verified");
