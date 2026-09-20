import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id,name,slug,business_type,mode,plan,status,owner_email,legal_name,email,website,country,locale,timezone,currency,postal_code,tax_id,logo_url,address,phone,online_booking,settings,updated_at")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error || !business) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });

  const [modules, methods, hours, branding, locations, financialSettings] = await Promise.all([
    supabase.from("business_modules").select("id,module_id,state,config,enabled_at,updated_at").eq("business_id", business.id).order("module_id"),
    supabase.from("business_payment_methods").select("id,method,title,enabled,is_default,provider,config,updated_at").eq("business_id", business.id).order("method"),
    supabase.from("business_working_hours").select("weekday,enabled,open_time,close_time,break_start,break_end").eq("business_id", business.id).order("weekday"),
    supabase.from("business_branding").select("theme_key,primary_color,secondary_color,radius_scale,logo_url,settings").eq("business_id", business.id).maybeSingle(),
    supabase.from("business_locations").select("id,name,code,phone,address,timezone,locale,currency,active,is_default").eq("business_id", business.id).order("created_at"),
    supabase.from("business_financial_settings").select("invoice_enabled,invoice_optional,auto_issue_invoice,allow_receipt_without_invoice,allow_partial_payment,allow_mixed_payment,default_payment_method,tax_enabled,tax_rate,price_includes_tax").eq("business_id", business.id).maybeSingle(),
  ]);

  return NextResponse.json({ ok: true, data: { business, modules: modules.data ?? [], paymentMethods: methods.data ?? [], workingHours: hours.data ?? [], branding: branding.data ?? null, locations: locations.data ?? [], financialSettings: financialSettings.data ?? null } });
}

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { data: business, error: findError } = await supabase.from("businesses").select("id").eq("slug", params.slug).maybeSingle();
  if (findError || !business) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });

  const profile = body?.profile && typeof body.profile === "object" ? body.profile : {};
  if (("status" in profile || "plan" in profile) && !(await supabase.rpc("is_platform_admin")).data) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const allowedProfile: Record<string, unknown> = {};
  for (const key of ["name","legal_name","email","website","phone","address","postal_code","locale","timezone","currency","logo_url","online_booking","settings","status","plan"]) {
    if (key in profile) allowedProfile[key] = profile[key];
  }

  if (Object.keys(allowedProfile).length) {
    allowedProfile.updated_at = new Date().toISOString();
    const { error } = await supabase.from("businesses").update(allowedProfile).eq("id", business.id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (Array.isArray(body?.modules)) {
    for (const item of body.modules) {
      if (!item?.module_id || !["enabled","disabled","locked"].includes(item.state)) continue;
      const { error } = await supabase.from("business_modules").upsert({
        business_id: business.id,
        module_id: item.module_id,
        state: item.state,
        config: typeof item.config === "object" && item.config ? item.config : {},
        enabled_at: item.state === "enabled" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "business_id,module_id" });
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
  }

  if (Array.isArray(body?.paymentMethods)) {
    for (const item of body.paymentMethods) {
      if (!item?.method) continue;
      const { error } = await supabase.from("business_payment_methods").upsert({
        business_id: business.id,
        method: item.method,
        title: item.title ?? null,
        enabled: Boolean(item.enabled),
        is_default: Boolean(item.is_default),
        provider: item.provider ?? null,
        config: typeof item.config === "object" && item.config ? item.config : {},
        updated_at: new Date().toISOString(),
      }, { onConflict: "business_id,method" });
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
  }

  if (body?.financialSettings && typeof body.financialSettings === "object") {
    const fs = body.financialSettings;
    const { error } = await supabase.from("business_financial_settings").upsert({
      business_id: business.id,
      invoice_enabled: fs.invoice_enabled !== false,
      invoice_optional: fs.invoice_optional !== false,
      auto_issue_invoice: Boolean(fs.auto_issue_invoice),
      allow_receipt_without_invoice: fs.allow_receipt_without_invoice !== false,
      allow_partial_payment: fs.allow_partial_payment !== false,
      allow_mixed_payment: fs.allow_mixed_payment !== false,
      default_payment_method: fs.default_payment_method ?? "card_terminal",
      tax_enabled: Boolean(fs.tax_enabled),
      tax_rate: Number(fs.tax_rate ?? 0),
      price_includes_tax: fs.price_includes_tax !== false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "business_id" });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (Array.isArray(body?.workingHours)) {
    for (const item of body.workingHours) {
      if (typeof item?.weekday !== "number") continue;
      const { error } = await supabase.from("business_working_hours").upsert({
        business_id: business.id, weekday: item.weekday, enabled: Boolean(item.enabled),
        open_time: item.open_time ?? null, close_time: item.close_time ?? null,
        break_start: item.break_start ?? null, break_end: item.break_end ?? null,
      }, { onConflict: "business_id,weekday" });
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
  }

  if (body?.branding && typeof body.branding === "object") {
    const b = body.branding;
    const { error } = await supabase.from("business_branding").upsert({
      business_id: business.id,
      theme_key: b.theme_key ?? "elegant",
      primary_color: b.primary_color ?? null,
      secondary_color: b.secondary_color ?? null,
      radius_scale: b.radius_scale ?? "comfortable",
      logo_url: b.logo_url ?? null,
      settings: typeof b.settings === "object" && b.settings ? b.settings : {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "business_id" });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return GET(request, { params });
}
