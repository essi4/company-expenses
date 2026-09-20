"use client";

import { useMemo, useState } from "react";
import type { BusinessCategory } from "@/packages/easy-platform/core/types";
import { CORE_MODULES } from "@/packages/easy-platform/core/business-modules";
import { getBusinessBlueprint } from "@/packages/easy-platform/core/business-blueprints";

const categories: BusinessCategory[] = ["Beauty","Automotive","Medical","Retail","Services","Hospitality","Education","Fitness","Professional","Other"];
const paymentDefaults = [
  { method: "card_terminal", title: "کارتخوان", enabled: true, is_default: true },
  { method: "cash", title: "نقدی", enabled: true, is_default: false },
  { method: "transfer", title: "انتقال", enabled: false, is_default: false },
];

type WizardBusiness = { id: string; name: string; slug: string; type: BusinessCategory; mode: string; plan: "Starter"|"Professional"|"Enterprise"; status: "Active"|"Trial"|"Suspended"; owner: string; updated: string };

export default function BusinessOnboardingWizard({
  userEmail,
  onClose,
  onCreated,
}: {
  userEmail: string;
  onClose: () => void;
  onCreated: (business: WizardBusiness) => void;
}) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "Beauty" as BusinessCategory,
    mode: "Women",
    plan: "Starter" as WizardBusiness["plan"],
    owner: userEmail,
    locale: "fa-IR",
    timezone: "Asia/Tehran",
    currency: "IRR",
    invoiceEnabled: true,
    invoiceOptional: true,
    autoIssueInvoice: false,
    receiptWithoutInvoice: true,
    partialPayment: true,
    mixedPayment: true,
  });

  const blueprint = useMemo(() => getBusinessBlueprint(form.type), [form.type]);
  const [modules, setModules] = useState(() => Object.fromEntries(
    blueprint.defaultModules.map((m) => [m.id, m.state === "enabled"])
  ) as Record<string, boolean>);
  const [payments, setPayments] = useState(paymentDefaults);

  function setCategory(type: BusinessCategory) {
    const b = getBusinessBlueprint(type);
    setForm((x) => ({ ...x, type, mode: b.modes[0]?.value ?? "" }));
    setModules(Object.fromEntries(b.defaultModules.map((m) => [m.id, m.state === "enabled"])));
  }

  const validName = form.name.trim().length >= 2;
  const steps = ["هویت","فعالیت و پلن","ماژول‌ها","مالی و پرداخت","مرور"];

  async function finish() {
    if (!validName || saving) return;
    setSaving(true); setError("");
    const slug = form.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u0600-\u06ff-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const createResponse = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        slug,
        business_type: form.type,
        mode: form.mode,
        plan: form.plan,
        owner_email: form.owner.trim() || userEmail,
        locale: form.locale,
        timezone: form.timezone,
        currency: form.currency,
      }),
    });
    const created = await createResponse.json().catch(() => null);
    if (!createResponse.ok || !created?.ok || !created.data) {
      setSaving(false);
      setError(createResponse.status === 409 ? "این شناسه وب قبلاً استفاده شده است." : "ایجاد Business انجام نشد.");
      return;
    }

    const response = await fetch(`/api/businesses/${encodeURIComponent(created.data.slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modules: CORE_MODULES.map((m) => ({ module_id: m.id, state: modules[m.id] ? "enabled" : "disabled", config: {} })),
        paymentMethods: payments,
        financialSettings: {
          invoice_enabled: form.invoiceEnabled,
          invoice_optional: form.invoiceOptional,
          auto_issue_invoice: form.autoIssueInvoice,
          allow_receipt_without_invoice: form.receiptWithoutInvoice,
          allow_partial_payment: form.partialPayment,
          allow_mixed_payment: form.mixedPayment,
          default_payment_method: "card_terminal",
        },
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      setSaving(false);
      setError("Business ساخته شد، اما تکمیل تنظیمات اولیه ناموفق بود. از Business Detail قابل اصلاح است.");
      return;
    }

    setSaving(false);
    onCreated({
      id: created.data.id,
      name: created.data.name,
      slug: created.data.slug,
      type: created.data.business_type,
      mode: created.data.mode,
      plan: created.data.plan,
      status: created.data.status,
      owner: created.data.owner_email ?? form.owner,
      updated: "همین الان",
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-3 sm:items-center">
      <div className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-[#0b0f18] p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><span className="text-xs font-black text-cyan-300">EASY BUSINESS ONBOARDING</span><h2 className="mt-2 text-2xl font-black">ساخت Business جدید</h2><p className="mt-2 text-xs leading-6 text-slate-500">هر Business یک Workspace مستقل روی وب و یک Configuration مستقل روی Core دریافت می‌کند.</p></div>
          <button onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-slate-400">×</button>
        </div>

        <div className="mt-6 grid grid-cols-5 gap-2">
          {steps.map((label,index) => <button key={label} type="button" onClick={()=>index<=step&&setStep(index)} className={`rounded-2xl px-3 py-3 text-[10px] font-black ${step===index?"bg-white text-slate-950":"border border-white/10 text-slate-500"}`}>{index+1} · {label}</button>)}
        </div>

        <div className="mt-6 min-h-[360px]">
          {step===0 && <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><label className="easy-label" data-required="true">نام کسب‌وکار</label><input className="easy-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="مثلاً پازل" autoFocus /></div>
            <div><label className="easy-label">ایمیل مالک</label><input dir="ltr" type="email" className="easy-field" value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})}/></div>
            <div><label className="easy-label">زبان</label><select className="easy-field" value={form.locale} onChange={e=>setForm({...form,locale:e.target.value})}><option value="fa-IR">فارسی</option><option value="en-US">English</option></select></div>
          </div>}

          {step===1 && <div className="grid gap-4 md:grid-cols-2">
            <div><label className="easy-label" data-required="true">دسته</label><select className="easy-field" value={form.type} onChange={e=>setCategory(e.target.value as BusinessCategory)}>{categories.map(c=><option key={c} value={c}>{getBusinessBlueprint(c).title}</option>)}</select></div>
            <div><label className="easy-label" data-required="true">نوع فعالیت</label><select className="easy-field" value={form.mode} onChange={e=>setForm({...form,mode:e.target.value})}>{blueprint.modes.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
            <div><label className="easy-label">پلن</label><select className="easy-field" value={form.plan} onChange={e=>setForm({...form,plan:e.target.value as WizardBusiness["plan"]})}><option>Starter</option><option>Professional</option><option>Enterprise</option></select></div>
            <div><label className="easy-label">منطقه زمانی</label><select className="easy-field" value={form.timezone} onChange={e=>setForm({...form,timezone:e.target.value})}><option>Asia/Tehran</option><option>Asia/Baku</option><option>Europe/Berlin</option><option>UTC</option></select></div>
            <div><label className="easy-label">واحد پول</label><select className="easy-field" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}><option value="IRR">ریال</option><option value="IRT">تومان</option><option value="AZN">منات</option><option value="USD">دلار</option><option value="EUR">یورو</option></select></div>
          </div>}

          {step===2 && <div className="grid gap-2 sm:grid-cols-2">
            {CORE_MODULES.map(m=><label key={m.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 p-4"><span><b className="block text-xs">{m.title}</b><small className="text-[10px] text-slate-500">{m.description}</small></span><input type="checkbox" checked={Boolean(modules[m.id])} onChange={e=>setModules({...modules,[m.id]:e.target.checked})}/></label>)}
          </div>}

          {step===3 && <div className="space-y-4">
            <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.04] p-5">
              <h3 className="font-black">فاکتور</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  ["invoiceEnabled","ماژول فاکتور",form.invoiceEnabled],
                  ["invoiceOptional","فاکتور اختیاری",form.invoiceOptional],
                  ["autoIssueInvoice","صدور خودکار",form.autoIssueInvoice],
                ].map(([key,label,value])=><label key={key as string} className="flex items-center justify-between rounded-2xl border border-white/10 p-3 text-xs"><span>{label as string}</span><input type="checkbox" checked={Boolean(value)} onChange={e=>setForm({...form,[key as string]:e.target.checked})}/></label>)}
              </div>
              <label className="mt-2 flex items-center justify-between rounded-2xl border border-white/10 p-3 text-xs"><span>رسید بدون فاکتور مجاز</span><input type="checkbox" checked={form.receiptWithoutInvoice} onChange={e=>setForm({...form,receiptWithoutInvoice:e.target.checked})}/></label>
            </div>
            <div>
              <h3 className="font-black">روش پرداخت</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">{payments.map(p=><label key={p.method} className="flex items-center justify-between rounded-2xl border border-white/10 p-3 text-xs"><span>{p.title}</span><input type="checkbox" checked={p.enabled} onChange={e=>setPayments(payments.map(x=>x.method===p.method?{...x,enabled:e.target.checked}:x))}/></label>)}</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl border border-white/10 p-3 text-xs"><span>پرداخت ناقص</span><input type="checkbox" checked={form.partialPayment} onChange={e=>setForm({...form,partialPayment:e.target.checked})}/></label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 p-3 text-xs"><span>پرداخت ترکیبی</span><input type="checkbox" checked={form.mixedPayment} onChange={e=>setForm({...form,mixedPayment:e.target.checked})}/></label>
            </div>
          </div>}

          {step===4 && <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Business",form.name],["دسته",blueprint.title],["فعالیت",blueprint.modes.find(m=>m.value===form.mode)?.label ?? form.mode],
                ["Plan",form.plan],["زبان",form.locale],["منطقه زمانی",form.timezone],["واحد پول",form.currency],
                ["ماژول فعال",String(Object.values(modules).filter(Boolean).length)],["روش پرداخت",String(payments.filter(x=>x.enabled).length)],
              ].map(([a,b])=><div key={a} className="rounded-2xl border border-white/10 p-4"><span className="text-[10px] text-slate-500">{a}</span><b className="mt-1 block text-sm">{b}</b></div>)}
            </div>
            <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-4 text-xs leading-7 text-amber-100">Business ابتدا با وضعیت «آزمایشی» ساخته می‌شود. بعد از بررسی تنظیمات، Super Admin آن را فعال می‌کند.</div>
          </div>}
        </div>

        {error && <div className="mb-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs font-bold text-rose-200">{error}</div>}
        <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/10 pt-5">
          <button type="button" onClick={()=>step>0?setStep(step-1):onClose()} className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300">{step>0?"مرحله قبل":"انصراف"}</button>
          {step<4
            ? <button type="button" disabled={step===0&&!validName} onClick={()=>setStep(step+1)} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-40">مرحله بعد</button>
            : <button type="button" disabled={!validName||saving} onClick={finish} className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-40">{saving?"در حال ساخت...":"ساخت Business"}</button>}
        </div>
      </div>
    </div>
  );
}
