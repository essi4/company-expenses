"use client";

import { useMemo, useState } from "react";
import type { BusinessBlueprint } from "@/packages/easy-platform/core/business-blueprints";

const moduleLabels: Record<string,string> = {
  customers:"مشتریان", appointments:"نوبت‌ها", catalog:"خدمات و کالا", staff:"کارکنان",
  invoicing:"فاکتور", payments:"پرداخت", cashier:"صندوق", ledger:"دفتر مالی",
  inventory:"انبار", reports:"گزارش‌ها", online_booking:"رزرو آنلاین", notifications:"اعلان‌ها",
};

const icons: Record<string,string> = {
  customers:"♙", appointments:"◷", catalog:"▦", staff:"◎", invoicing:"▤", payments:"◈",
  cashier:"▣", ledger:"◫", inventory:"▥", reports:"⌁", online_booking:"⌂", notifications:"◉",
};

export default function BusinessWorkspaceClient({
  business,
  blueprint,
  modules,
  summary,
}: {
  business: { id:string; name:string; slug:string; business_type:string; mode:string; plan:string; locale:string; timezone:string; currency:string };
  blueprint: BusinessBlueprint;
  modules: { module_id:string; state:"enabled"|"disabled"|"locked" }[];
  summary: { customers:number; services:number; appointments:number; payments:number; sales:number };
}) {
  const enabled = useMemo(() => modules.filter((x) => x.state === "enabled"), [modules]);
  const [active, setActive] = useState("dashboard");

  return (
    <main dir="rtl" className="min-h-screen bg-[#05070d] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070d]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">{blueprint.icon}</div>
            <div className="min-w-0"><b className="block truncate text-sm sm:text-base">{business.name}</b><span className="text-[10px] text-slate-500">{blueprint.title} · {business.mode}</span></div>
          </div>
          <span className="hidden rounded-full border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-400 sm:block">{business.plan}</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-5 px-3 py-4 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:py-6">
        <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.035] p-3 lg:sticky lg:top-24">
          <div className="mb-2 px-3 py-2 text-[10px] font-black tracking-[0.2em] text-slate-500">EASY WORKSPACE</div>
          <button onClick={() => setActive("dashboard")} className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right text-xs font-black ${active === "dashboard" ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/5"}`}><span>⌂</span> داشبورد</button>
          {enabled.map((item) => <button key={item.module_id} onClick={() => setActive(item.module_id)} className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right text-xs font-bold ${active === item.module_id ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/5"}`}><span>{icons[item.module_id] ?? "◆"}</span>{moduleLabels[item.module_id] ?? item.module_id}</button>)}
        </aside>

        <section className="min-w-0">
          {active === "dashboard" ? (
            <div className="space-y-5">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
                <span className="text-[10px] font-black text-cyan-300">BUSINESS WORKSPACE</span>
                <h1 className="mt-3 text-2xl font-black sm:text-3xl">سلام، {business.name}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">این Workspace از Core مشترک EASY ساخته شده و فقط Capabilityهای فعال این Business را نمایش می‌دهد.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[[summary.customers,"مشتریان"],[summary.services,"خدمات / کالا"],[summary.appointments,"نوبت‌ها / سفارش‌ها"],[summary.payments,"تراکنش‌ها"],[summary.sales,"فروش"]].map(([v,l]) => <div key={String(l)} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><span className="text-[10px] text-slate-500">{l}</span><b className="mt-2 block text-2xl font-black">{Number(v).toLocaleString("fa-IR")}</b></div>)}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <h2 className="font-black">قابلیت‌های این Business</h2>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">{enabled.map((x) => <button key={x.module_id} onClick={() => setActive(x.module_id)} className="rounded-2xl border border-white/10 px-4 py-3 text-right text-xs font-bold text-slate-300 hover:bg-white/[0.05]">✓ {moduleLabels[x.module_id] ?? x.module_id}</button>)}</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <h2 className="font-black">ویژگی‌های پیشنهادی</h2>
                  <div className="mt-4 flex flex-wrap gap-2">{blueprint.recommendedFeatures.map((x) => <span key={x} className="rounded-full border border-cyan-400/10 bg-cyan-400/[0.05] px-3 py-2 text-[10px] text-cyan-200">{x}</span>)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <span className="text-[10px] font-black text-cyan-300">EASY CORE MODULE</span>
              <h1 className="mt-3 text-2xl font-black">{moduleLabels[active] ?? active}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-400">این ماژول به‌صورت مستقل روی Core EASY اجرا می‌شود. عملیات اختصاصی این نوع کسب‌وکار به‌صورت Capability و Workflow روی همین هسته اضافه خواهد شد.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {["داده واقعی Business","Role & Permission","Audit & Event Ready"].map((x) => <div key={x} className="rounded-2xl border border-white/10 p-4 text-xs font-bold text-slate-300">✓ {x}</div>)}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
