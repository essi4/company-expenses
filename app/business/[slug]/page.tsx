import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessBlueprint } from "@/packages/easy-platform/core/business-blueprints";
import type { BusinessCategory } from "@/packages/easy-platform/core/types";
import BeautyWorkspace from "@/app/control-center/beauty-workspace";

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

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-cyan-300">EASY BUSINESS WORKSPACE</span>
              <h1 className="mt-2 text-2xl font-black">{business.name}</h1>
              <p className="mt-1 text-xs text-slate-400">{blueprint.title} · {business.mode} · {business.plan}</p>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-300">فعال</span>
          </div>
        </header>
        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {blueprint.defaultModules.filter((m) => m.state === "enabled").map((m) => {
            const meta = blueprint.recommendedFeatures.find((x) => x.toLowerCase().includes(m.id.replace("_"," "))) ?? "ماژول عملیاتی";
            return <article key={m.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><span className="text-[10px] font-black text-slate-500">{m.id}</span><h2 className="mt-2 font-black">{meta}</h2><p className="mt-2 text-xs leading-6 text-slate-500">این ماژول از Core مشترک EASY استفاده می‌کند و بدون تغییر هسته قابل توسعه است.</p></article>;
          })}
        </section>
      </div>
    </main>
  );
}
