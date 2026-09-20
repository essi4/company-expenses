import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BusinessCategory } from "@/packages/easy-platform/core/types";

export const dynamic = "force-dynamic";

const categories = new Set<BusinessCategory>([
  "Beauty","Automotive","Medical","Retail","Services","Hospitality","Education","Fitness","Professional","Other",
]);

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06ff-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("businesses")
    .select("id,name,slug,business_type,mode,plan,status,owner_email,locale,timezone,currency,updated_at")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const category = typeof body?.business_type === "string" ? body.business_type as BusinessCategory : "Other";
  const mode = typeof body?.mode === "string" ? body.mode.trim() : "";
  const plan = typeof body?.plan === "string" ? body.plan.trim() : "Starter";
  const ownerEmail = typeof body?.owner_email === "string" ? body.owner_email.trim() : user.email ?? "";
  const slug = slugify(typeof body?.slug === "string" ? body.slug : name);

  if (!name || !slug || !mode || !categories.has(category)) {
    return NextResponse.json({ ok: false, error: "invalid_business_payload" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("create_business_workspace", {
    p_name: name,
    p_slug: slug,
    p_business_type: category,
    p_mode: mode,
    p_plan: plan,
    p_owner_email: ownerEmail,
    p_locale: typeof body?.locale === "string" ? body.locale : "fa-IR",
    p_timezone: typeof body?.timezone === "string" ? body.timezone : "Asia/Tehran",
    p_currency: typeof body?.currency === "string" ? body.currency : "IRR",
  });

  if (error) {
    const status = error.message.includes("business_slug_exists") ? 409 : 400;
    return NextResponse.json({ ok: false, error: error.message }, { status });
  }

  return NextResponse.json({ ok: true, data }, { status: 201 });
}
