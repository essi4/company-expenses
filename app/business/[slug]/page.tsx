import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessBlueprint } from "@/packages/easy-platform/core/business-blueprints";
import type { BusinessCategory } from "@/packages/easy-platform/core/types";
import BeautyWorkspace from "@/app/control-center/beauty-workspace";
import BusinessWorkspaceClient from "./business-workspace-client";

export const dynamic = "force-dynamic";

export default async function BusinessWorkspacePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/business/${encodeURIComponent(params.slug)}`);

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id,name,slug,business_type,mode,plan,status")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error || !business) notFound();

  const category = business.business_type as BusinessCategory;
  const blueprint = getBusinessBlueprint(category);

  if (business.status !== "Active") {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
        <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <span className="text-xs font-black text-amber-300">وضعیت Workspace</span>
          <h1 className="mt-3 text-3xl font-black">{business.name}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">این Business هنوز فعال نشده است.</p>
        </section>
      </main>
    );
  }

  if (category === "Beauty") {
    return <BeautyWorkspace name={business.name} mode={business.mode} plan={business.plan} businessSlug={business.slug} />;
  }

  const [modulesResult, customersResult, servicesResult, appointmentsResult, paymentsResult] = await Promise.all([
    supabase.from("business_modules").select("module_id,state").eq("business_id", business.id).order("module_id"),
    supabase.from("business_customers").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("business_services").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("active", true),
    supabase.from("business_appointments").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("business_payments").select("id,amount", { count: "exact" }).eq("business_id", business.id).eq("status", "paid"),
  ]);

  const sales = (paymentsResult.data ?? []).reduce((sum: number, row: { amount?: number | string }) => sum + Number(row.amount ?? 0), 0);
  return <BusinessWorkspaceClient
    business={{
      id: business.id,
      name: business.name,
      slug: business.slug,
      business_type: business.business_type,
      mode: business.mode,
      plan: business.plan,
      locale: "fa-IR",
      timezone: "Asia/Tehran",
      currency: "IRR",
    }}
    blueprint={blueprint}
    modules={modulesResult.data ?? blueprint.defaultModules.map((m) => ({ module_id: m.id, state: m.state }))}
    summary={{
      customers: customersResult.count ?? 0,
      services: servicesResult.count ?? 0,
      appointments: appointmentsResult.count ?? 0,
      payments: paymentsResult.count ?? 0,
      sales,
    }}
  />;
}
