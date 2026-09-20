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
const { error: adminGrantError } = await admin.from("platform_admin_users").insert({ user_id: created.user.id, enabled: true });
if (adminGrantError) throw new Error(`Platform admin bootstrap failed: ${adminGrantError.message}`);

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

const businessResponse = await fetch(`${appUrl}/api/businesses`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookieHeader },
  body: JSON.stringify({ name: "CI Tenant Business", slug: `ci-tenant-${Date.now()}`, business_type: "Services", mode: "General", plan: "Starter", owner_email: email }),
});
await expectStatus("Platform Admin Business create", businessResponse, 201);
const businessPayload = await businessResponse.json();
if (!businessPayload?.ok || !businessPayload?.data?.id) throw new Error("Business creation RPC did not return a Business");

const otherEmail = `easy-ci-other-${Date.now()}@example.test`;
const otherPassword = "EASY-CI-Other-Password-123!";
const { data: otherCreated, error: otherCreateError } = await admin.auth.admin.createUser({
  email: otherEmail,
  password: otherPassword,
  email_confirm: true,
});
if (otherCreateError || !otherCreated.user) throw new Error(`Second auth user creation failed: ${otherCreateError?.message ?? "unknown"}`);

const otherCookies = new Map();
const otherSsr = createServerClient(baseUrl, publishableKey, {
  cookies: {
    getAll: () => Array.from(otherCookies.entries()).map(([name, value]) => ({ name, value })),
    setAll: (items) => items.forEach(({ name, value }) => otherCookies.set(name, value)),
  },
});
const { data: otherSignedIn, error: otherSignInError } = await otherSsr.auth.signInWithPassword({ email: otherEmail, password: otherPassword });
if (otherSignInError || !otherSignedIn.session) throw new Error(`Second auth sign-in failed: ${otherSignInError?.message ?? "no session"}`);

const { data: customer, error: customerInsertError } = await ssr
  .from("business_customers")
  .insert({ business_id: businessPayload.data.id, name: "CI Customer", phone: "09000000000" })
  .select("id")
  .single();
if (customerInsertError || !customer) throw new Error(`Customer insert failed: ${customerInsertError?.message ?? "unknown"}`);

const { data: service, error: serviceInsertError } = await ssr
  .from("business_services")
  .insert({ business_id: businessPayload.data.id, name: "CI Service", price: 1000, duration_minutes: 30 })
  .select("id")
  .single();
if (serviceInsertError || !service) throw new Error(`Service insert failed: ${serviceInsertError?.message ?? "unknown"}`);

const { data: createdInvoice, error: invoiceCreateError } = await ssr.rpc("create_business_invoice", {
  p_business_id: businessPayload.data.id,
  p_customer_id: customer.id,
  p_location_id: null,
  p_appointment_id: null,
  p_items: [{ service_id: service.id, description: "CI Service", quantity: 1, unit_price: 1000 }],
  p_discount: 0,
  p_notes: null,
});
if (invoiceCreateError || !createdInvoice?.[0]) throw new Error(`Invoice creation failed: ${invoiceCreateError?.message ?? "unknown"}`);
const invoiceId = createdInvoice[0].invoice_id;

const paymentKey = `ci-payment-${Date.now()}`;
const { data: partialPayment, error: partialPaymentError } = await ssr.rpc("record_business_invoice_payment", {
  p_business_id: businessPayload.data.id,
  p_invoice_id: invoiceId,
  p_payments: [{ method: "cash", amount: 400 }],
  p_idempotency_key: paymentKey,
});
if (partialPaymentError || !partialPayment?.[0] || Number(partialPayment[0].paid_amount) !== 400 || partialPayment[0].status !== "partially_paid") {
  throw new Error(`Partial invoice payment failed: ${partialPaymentError?.message ?? "invalid result"}`);
}

const { data: retryPayment, error: retryPaymentError } = await ssr.rpc("record_business_invoice_payment", {
  p_business_id: businessPayload.data.id,
  p_invoice_id: invoiceId,
  p_payments: [{ method: "cash", amount: 400 }],
  p_idempotency_key: paymentKey,
});
if (retryPaymentError || !retryPayment?.[0] || Number(retryPayment[0].paid_amount) !== 400) {
  throw new Error(`Payment idempotency failed: ${retryPaymentError?.message ?? "invalid result"}`);
}

const { data: finalPayment, error: finalPaymentError } = await ssr.rpc("record_business_invoice_payment", {
  p_business_id: businessPayload.data.id,
  p_invoice_id: invoiceId,
  p_payments: [{ method: "card_terminal", amount: 600 }],
  p_idempotency_key: `ci-payment-final-${Date.now()}`,
});
if (finalPaymentError || !finalPayment?.[0] || Number(finalPayment[0].paid_amount) !== 1000 || finalPayment[0].status !== "paid" || !finalPayment[0].receipt_number) {
  throw new Error(`Final invoice settlement failed: ${finalPaymentError?.message ?? "invalid result"}`);
}

const { data: isolatedRows, error: isolationError } = await otherSsr
  .from("businesses")
  .select("id")
  .eq("id", businessPayload.data.id);
if (isolationError) throw new Error(`Business isolation query failed: ${isolationError.message}`);
if ((isolatedRows ?? []).length !== 0) throw new Error("RLS failure: unrelated authenticated user can read another Business");

const otherCookieHeader = Array.from(otherCookies.entries()).map(([name, value]) => `${name}=${value}`).join("; ");
await expectStatus("Non-admin Control Center API", await fetch(`${appUrl}/api/control-center`, { headers: { Cookie: otherCookieHeader } }), 403);
await expectStatus("Non-admin Business management API", await fetch(`${appUrl}/api/businesses`, { headers: { Cookie: otherCookieHeader } }), 403);
const payload = await authenticated.json();
if (payload?.ok !== true) throw new Error("Authenticated Control Center API did not return ok=true");
if (!Array.isArray(payload?.stages) || payload.stages.length !== 13) {
  throw new Error(`Expected 13 executed stages, got ${payload?.stages?.length ?? "invalid"}`);
}

if (businessPayload?.data?.id) await admin.from("businesses").delete().eq("id", businessPayload.data.id);
await admin.from("platform_admin_users").delete().eq("user_id", created.user.id);
await admin.from("marketplace_apps").delete().eq("id", seeded.id);
await admin.auth.admin.deleteUser(otherCreated.user.id);
await admin.auth.admin.deleteUser(created.user.id);

console.log("REAL SUPABASE STAGING INTEGRATION: PASS");
console.log("Migration + RLS + Auth + API + 13-stage pipeline verified");
