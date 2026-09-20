import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BUSINESS_MODULE_ROUTES } from "@/packages/easy-platform/core/module-routes";
import type { CoreModule } from "@/packages/easy-platform/core/business-modules";
import BusinessFinancePanel from "@/app/control-center/business-finance-panel";

export const dynamic = "force-dynamic";

export default async function BusinessModulePage({ params }: { params: { slug: string; module: string } }) {
  const route = BUSINESS_MODULE_ROUTES.find((item) => item.path === params.module);
  if (!route) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/business/${encodeURIComponent(params.slug)}/${encodeURIComponent(params.module)}`);

  const { data: business } = await supabase
    .from("businesses")
    .select("id,name,slug,business_type,mode,plan,status")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!business) notFound();

  const { data: module } = await supabase
    .from("business_modules")
    .select("module_id,state,config")
    .eq("business_id", business.id)
    .eq("module_id", route.module)
    .maybeSingle();

  const state = module?.state ?? "disabled";
  if (state !== "enabled") {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
        <section className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
          <span className="text-[10px] font-black text-amber-300">{state === "locked" ? "MODULE LOCKED" : "MODULE DISABLED"}</span>
          <h1 className="mt-2 text-2xl font-black">{route.title}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">این ماژول برای Business فعلی فعال نشده است. وضعیت آن از Business Management و Plan/Entitlement کنترل می‌شود.</p>
        </section>
      </main>
    );
  }

  const base = { name: business.name, mode: business.mode, plan: business.plan };
  const renderFinance = route.module === ("payments" as CoreModule) || route.module === ("invoicing" as CoreModule) || route.module === ("cashier" as CoreModule) || route.module === ("ledger" as CoreModule);

  let customers: { id:string; name:string; phone:string }[] = [];
  let services: { id:string; name:string; price:number; duration:number }[] = [];
  if (renderFinance) {
    const [customerResult, serviceResult] = await Promise.all([
      supabase.from("business_customers").select("id,name,phone").eq("business_id", business.id).order("created_at"),
      supabase.from("business_services").select("id,name,price,duration_minutes").eq("business_id", business.id).eq("active", true).order("created_at"),
    ]);
    customers = customerResult.data ?? [];
    services = (serviceResult.data ?? []).map((x) => ({ id:x.id, name:x.name, price:Number(x.price), duration:x.duration_minutes }));
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <span className="text-[10px] font-black text-cyan-300">EASY BUSINESS MODULE</span>
          <h1 className="mt-2 text-2xl font-black">{route.title}</h1>
          <p className="mt-1 text-xs text-slate-500">{base.name} · {base.mode} · {base.plan}</p>
        </header>
        <section className="mt-5">
          {renderFinance
            ? <BusinessFinancePanel businessId={business.id} customers={customers} services={services} />
            : <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
                <h2 className="text-xl font-black">{route.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-400">این Route از Registry مرکزی EASY آمده و به Business فعلی scoped است. UI تخصصی این ماژول بدون تغییر در Core مالی/هویتی قابل اضافه شدن است.</p>
              </div>}
        </section>
      </div>
    </main>
  );
}
