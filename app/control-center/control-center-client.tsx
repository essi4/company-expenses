"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Business = {
  id: string;
  name: string;
  slug: string;
  type: "Beauty" | "Automotive" | "Medical" | "Services";
  mode: string;
  plan: "Starter" | "Professional" | "Enterprise";
  status: "Active" | "Trial" | "Suspended";
  owner: string;
  updated: string;
};

const seedBusinesses: Business[] = [
  { id: "BUS-001", name: "EASY Demo Beauty", slug: "easy-demo-beauty", type: "Beauty", mode: "Women", plan: "Professional", status: "Active", owner: "demo@easy.local", updated: "امروز" },
  { id: "BUS-002", name: "EASY Auto Center", slug: "easy-auto-center", type: "Automotive", mode: "Oil Change", plan: "Starter", status: "Trial", owner: "auto@easy.local", updated: "دیروز" },
  { id: "BUS-003", name: "EASY Clinic", slug: "easy-clinic", type: "Medical", mode: "Clinic", plan: "Enterprise", status: "Active", owner: "clinic@easy.local", updated: "۲ روز قبل" },
];

const navSections = [
  { id: "overview", label: "داشبورد", en: "Overview", icon: "⌂" },
  { id: "businesses", label: "مدیریت کسب‌وکارها", en: "مدیریت کسب‌وکارها", icon: "▣" },
  { id: "users", label: "کاربران و دسترسی", en: "Users & Access", icon: "♙" },
  { id: "subscriptions", label: "اشتراک‌ها و پلن‌ها", en: "", icon: "◆" },
  { id: "marketplace", label: "بازارچه", en: "", icon: "⬢" },
  { id: "ai", label: "هوش مصنوعی EASY", en: "", icon: "✦" },
  { id: "governance", label: "حاکمیت و سیاست‌گذاری", en: "", icon: "◈" },
  { id: "identity", label: "هویت و دسترسی", en: "", icon: "◎" },
  { id: "infrastructure", label: "زیرساخت جهانی", en: "Infrastructure", icon: "◇" },
  { id: "data", label: "داده و تحلیل", en: "Data & Analytics", icon: "▤" },
  { id: "developers", label: "پلتفرم توسعه‌دهندگان", en: "", icon: "</>" },
  { id: "partners", label: "شرکای تجاری", en: "", icon: "∞" },
  { id: "reliability", label: "پایداری و بازیابی", en: "", icon: "◉" },
  { id: "security", label: "مرکز امنیت", en: "Security Operations", icon: "⬟" },
  { id: "enterprise", label: "کنترل سازمانی", en: "", icon: "▦" },
  { id: "architecture", label: "قفل معماری", en: "", icon: "⌘" },
];

const moduleCards: Record<string, { title: string; description: string; stats: [string, string][] }> = {
  users: { title: "کاربران و دسترسی", description: "مدیریت User، Role، Permission، Membership و نشست‌های ادمین.", stats: [["Users", "احراز هویت"], ["Roles", "نقش‌ها"], ["Audit", "ثبت رویداد"]] },
  subscriptions: { title: "اشتراک‌ها و Billing", description: "پلن‌ها، اشتراک فعال، مصرف، فاکتور و Ledger در Control Plane.", stats: [["Plans", "پلن‌ها"], ["Meters", "مصرف"], ["Invoices", "فاکتورها"]] },
  marketplace: { title: "Marketplace", description: "اپلیکیشن‌ها، نسخه‌ها، نصب‌ها و Entitlementهای هر Business.", stats: [["Apps", "اپ‌ها"], ["Versions", "نسخه‌ها"], ["Entitlements", "مجوزها"]] },
  ai: { title: "EASY AI Platform", description: "مدل‌ها، Agentها، Policyها، اجرای AI و مجوز ابزارها.", stats: [["Models", "مدل‌ها"], ["Agents", "Agentها"], ["Runs", "AI Runs"]] },
  governance: { title: "Governance & Policy", description: "Policy، Rule، Approval، Violation و حاکمیت قابل ردیابی.", stats: [["Policies", "سیاست‌ها"], ["Rules", "قواعد"], ["Approvals", "تأییدها"]] },
  identity: { title: "Identity & Access 2.0", description: "Identity Provider، Session، Role Assignment و Access Log.", stats: [["Providers", "Provider"], ["Sessions", "نشست‌ها"], ["Logs", "لاگ‌ها"]] },
  infrastructure: { title: "Global Infrastructure", description: "Region، Routing، Failover و Residency Policy.", stats: [["Regions", "Regionها"], ["Routing", "Routing"], ["Failover", "Failover"]] },
  data: { title: "Data Platform & Analytics", description: "Source، Dimensions، Facts، Semantic Metrics و Jobهای تحلیلی.", stats: [["Sources", "منابع"], ["Metrics", "Metricها"], ["Jobs", "Jobها"]] },
  developers: { title: "Developer Platform & SDK", description: "Developer App، API Key، API Version، Usage و SDK Release.", stats: [["Apps", "Developer Apps"], ["API Keys", "کلیدها"], ["SDK", "Releaseها"]] },
  partners: { title: "Marketplace Economy", description: "Partner، Commission، Settlement، Payout و Revenue Share.", stats: [["Partners", "همکاران"], ["Commission", "کمیسیون"], ["Payout", "پرداخت"]] },
  reliability: { title: "Reliability & Disaster Recovery", description: "SLO، Incident، Backup، Restore Point و DR Run.", stats: [["SLO", "سیاست‌ها"], ["Incidents", "رخدادها"], ["Backups", "پشتیبان‌ها"]] },
  security: { title: "Security Operations Center", description: "Finding، Detection، Incident، Playbook و Evidence.", stats: [["Findings", "یافته‌ها"], ["Incidents", "حوادث"], ["Playbooks", "Playbookها"]] },
  enterprise: { title: "Enterprise Control Plane", description: "عملیات، Rollout، Tenant Flag، Admin Session و Audit.", stats: [["Actions", "عملیات"], ["Rollouts", "Rollout"], ["Audit", "Audit"]] },
  architecture: { title: "Architecture Lock", description: "نسخه‌های معماری، تصمیم‌ها، Change Request و Lock Window.", stats: [["Version", "Architecture"], ["Decisions", "تصمیم‌ها"], ["Changes", "تغییرات"]] },
};

function badgeClass(status: Business["status"]) {
  if (status === "Active") return "bg-emerald-400/10 text-emerald-300 border-emerald-400/20";
  if (status === "Trial") return "bg-amber-400/10 text-amber-200 border-amber-400/20";
  return "bg-rose-400/10 text-rose-200 border-rose-400/20";
}

export default function ControlCenterClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("section") ?? "businesses";
  const section = navSections.some((item) => item.id === requested) ? requested : "businesses";

  const [businesses, setBusinesses] = useState(seedBusinesses);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Business | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", type: "Beauty" as Business["type"], mode: "Women", plan: "Starter" as Business["plan"], owner: "" });

  const current = navSections.find((item) => item.id === section) ?? navSections[1];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter((business) => {
      const matchesQuery = !q || [business.name, business.slug, business.id, business.owner].some((v) => v.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || business.status === statusFilter;
      const matchesType = typeFilter === "all" || business.type === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [businesses, query, statusFilter, typeFilter]);

  const counts = {
    all: businesses.length,
    active: businesses.filter((b) => b.status === "Active").length,
    trial: businesses.filter((b) => b.status === "Trial").length,
    suspended: businesses.filter((b) => b.status === "Suspended").length,
  };

  function go(id: string) {
    router.replace(`/control-center?section=${id}`, { scroll: false });
  }

  function createBusiness() {
    if (!createForm.name.trim()) return;
    const id = `BUS-${String(businesses.length + 1).padStart(3, "0")}`;
    const slug = createForm.name.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, "-").replace(/^-|-$/g, "") || id.toLowerCase();
    const business: Business = {
      id,
      name: createForm.name.trim(),
      slug,
      type: createForm.type,
      mode: createForm.mode,
      plan: createForm.plan,
      status: "Trial",
      owner: createForm.owner.trim() || userEmail,
      updated: "همین الان",
    };
    setBusinesses((items) => [business, ...items]);
    setCreateForm({ name: "", type: "Beauty", mode: "Women", plan: "Starter", owner: "" });
    setShowCreate(false);
    setSelected(business);
    go("businesses");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#05070d] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070d]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => go("businesses")} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">E</button>
            <div>
              <b className="block text-sm sm:text-base">مرکز کنترل EASY</b>
              <span className="text-[10px] text-slate-500">مدیر ارشد · مرکز کنترل پلتفرم</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-left sm:block">
              <span className="block text-[10px] text-slate-500">حساب مدیر</span>
              <span className="text-xs font-bold text-slate-200">{userEmail}</span>
            </div>
            <button onClick={signOut} className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5">خروج</button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-[1500px] gap-5 px-3 py-4 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:py-6">
        <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.035] p-3 lg:sticky lg:top-24">
          <div className="mb-2 px-3 py-2 text-[10px] font-black tracking-[0.22em] text-slate-500">EASY CONTROL</div>
          <nav className="space-y-1">
            {navSections.map((item) => (
              <button key={item.id} onClick={() => go(item.id)} className={`w-full rounded-2xl px-3 py-3 text-right transition ${section === item.id ? "bg-white text-slate-950 shadow-lg" : "text-slate-300 hover:bg-white/[0.05]"}`}>
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/10 text-sm font-black">{item.icon}</span>
                  <span className="min-w-0">
                    <b className="block truncate text-xs">{item.label}</b>
                    
                  </span>
                </span>
              </button>
            ))}
          </nav>
          <div className="mt-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.05] p-4">
            <span className="text-[10px] font-black text-cyan-300">PLATFORM STATUS</span>
            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-300" /> آنلاین</div>
            <p className="mt-2 text-[10px] leading-5 text-slate-500">Feature Branch Preview · Production جداست.</p>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-[10px] font-black text-cyan-200">SUPER ADMIN</span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold text-slate-500">Stage 149 · Control Plane</span>
              </div>
              <h1 className="mt-3 text-2xl font-black sm:text-3xl">{current.label}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                {section === "businesses" ? "مرکز اصلی ساخت، جست‌وجو، فیلتر، اشتراک، وضعیت و ورود به Workspace هر کسب‌وکار." : section === "overview" ? "دید لحظه‌ای از سلامت پلتفرم، کسب‌وکارها، اشتراک و زیرساخت." : moduleCards[section]?.description}
              </p>
            </div>
            <div className="flex gap-2">
              {section === "businesses" && <button onClick={() => setShowCreate(true)} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">＋ ایجاد کسب‌وکار</button>}
              <button onClick={() => go("businesses")} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5">مدیریت کسب‌وکارها</button>
            </div>
          </div>

          {section === "overview" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[["Businesses", String(counts.all), "کسب‌وکارها"], ["Active", String(counts.active), "فعال"], ["Trial", String(counts.trial), "آزمایشی"], ["Platform", "آماده", "سلامت پلتفرم"]].map(([meta, value, label]) => (
                  <div key={meta} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                    <span className="text-[10px] font-bold text-slate-500">{meta}</span>
                    <b className="mt-2 block text-3xl font-black">{value}</b>
                    <span className="mt-1 block text-xs text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <h3 className="font-black">ماژول‌های پلتفرم</h3>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {navSections.slice(1, 10).map((item) => <button key={item.id} onClick={() => go(item.id)} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-4 text-right text-xs font-bold text-slate-300 hover:bg-white/[0.06]">{item.label}</button>)}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <h3 className="font-black">سلامت سیستم</h3>
                  <div className="mt-4 space-y-3">
                    {[["Core API", "عملیاتی"], ["Database", "محافظت‌شده"], ["Authentication", "Operational"], ["Event Bus", "Ready"], ["Automation", "Ready"]].map(([name, state]) => <div key={name} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3"><span className="text-xs font-bold text-slate-300">{name}</span><span className="text-[10px] font-black text-emerald-300">● {state}</span></div>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === "businesses" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[["همه", counts.all, "کل کسب‌وکارها"], ["ACTIVE", counts.active, "فعال"], ["TRIAL", counts.trial, "آزمایشی"], ["SUSPENDED", counts.suspended, "معلق"]].map(([code, value, label]) => (
                  <button key={code} onClick={() => setStatusFilter(code === "ALL" ? "all" : code === "ACTIVE" ? "Active" : code === "TRIAL" ? "Trial" : "Suspended")} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-right hover:bg-white/[0.05]">
                    <span className="text-[10px] font-bold text-slate-500">{code}</span><b className="mt-2 block text-3xl font-black">{value}</b><span className="mt-1 block text-xs text-slate-400">{label}</span>
                  </button>
                ))}
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_170px_170px_auto]">
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجو: نام، دامنه، Business ID یا مالک" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300">
                    <option value="all">همه وضعیت‌ها</option><option value="Active">Active</option><option value="Trial">Trial</option><option value="Suspended">Suspended</option>
                  </select>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300">
                    <option value="all">همه مدل‌ها</option><option value="Beauty">Beauty</option><option value="Automotive">Automotive</option><option value="Medical">Medical</option><option value="Services">Services</option>
                  </select>
                  <button onClick={() => { setQuery(""); setStatusFilter("all"); setTypeFilter("all"); }} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-400">پاک‌سازی</button>
                </div>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full min-w-[940px] text-right">
                    <thead className="bg-white/[0.04] text-[10px] font-black text-slate-500">
                      <tr><th className="px-4 py-4">Business</th><th className="px-4 py-4">نوع / حالت</th><th className="px-4 py-4">مالک</th><th className="px-4 py-4">Subscription</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filtered.map((business) => (
                        <tr key={business.id} className="hover:bg-white/[0.025]">
                          <td className="px-4 py-4"><button onClick={() => setSelected(business)} className="text-right"><b className="block text-sm">{business.name}</b><span className="mt-1 block text-[10px] text-slate-600">{business.id} · {business.slug}</span></button></td>
                          <td className="px-4 py-4"><span className="block text-xs font-bold text-slate-200">{business.type}</span><span className="text-[10px] text-slate-500">{business.mode}</span></td>
                          <td className="px-4 py-4 text-xs text-slate-400">{business.owner}</td>
                          <td className="px-4 py-4"><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-black">{business.plan}</span></td>
                          <td className="px-4 py-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${badgeClass(business.status)}`}>{business.status}</span></td>
                          <td className="px-4 py-4"><div className="flex gap-2"><button onClick={() => setSelected(business)} className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-bold">جزئیات</button><button onClick={() => go("businesses")} className="rounded-xl bg-white px-3 py-2 text-[10px] font-black text-slate-950">Enter</button></div></td>
                        </tr>
                      ))}
                      {!filtered.length && <tr><td colSpan={6} className="px-4 py-16 text-center"><b className="block text-sm">نتیجه‌ای پیدا نشد</b><span className="mt-2 block text-xs text-slate-500">فیلترها را پاک کنید یا Business جدید بسازید.</span></td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-[10px] leading-5 text-slate-600">داده نمایشی: رکوردهای بالا داده نمایشی همین محیط هستند؛ اتصال CRUD دائمی به هسته داده در لایه بعدی انجام می‌شود.</div>
              </div>
            </div>
          )}

          {section !== "overview" && section !== "businesses" && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                {moduleCards[section]?.stats.map(([meta, label]) => <div key={meta} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><span className="text-[10px] font-bold text-slate-500">{meta}</span><b className="mt-2 block text-lg">{label}</b><span className="mt-3 block text-[10px] text-emerald-300">● Ready</span></div>)}
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                  <div>
                    <span className="text-xs font-black text-cyan-300">ماژول آماده</span>
                    <h2 className="mt-2 text-2xl font-black">{moduleCards[section]?.title}</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-400">{moduleCards[section]?.description}</p>
                    <div className="mt-6 grid gap-2 sm:grid-cols-2">
                      {["عملیات مبتنی بر سیاست", "آگاه از نقش و مجوز", "رویدادهای آماده حسابرسی", "معماری چندکسب‌وکاره", "آماده API و گذرگاه رویداد", "سازگار با انتشار مرحله‌ای"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs font-bold text-slate-300">✓ {item}</div>)}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <span className="text-[10px] font-black text-slate-500">مرکز کنترل</span>
                    <div className="mt-4 space-y-2">
                      <div className="rounded-2xl bg-white/[0.04] p-4 text-xs font-bold">مرحله ۱۴۹ · کنترل مدیریت</div>
                      <div className="rounded-2xl bg-white/[0.04] p-4 text-xs font-bold">مرحله ۱۵۰ · قفل معماری</div>
                      <button onClick={() => go("businesses")} className="w-full rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-950">بازگشت به مدیریت کسب‌وکارها</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0b0f18] p-5 shadow-2xl sm:p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><span className="text-xs font-black text-cyan-300">ایجاد کسب‌وکار</span><h2 className="mt-2 text-2xl font-black">ایجاد کسب‌وکار جدید</h2><p className="mt-2 text-xs leading-6 text-slate-500">Workspace اولیه بر اساس Type و Mode انتخابی ساخته می‌شود.</p></div>
              <button onClick={() => setShowCreate(false)} className="rounded-xl border border-white/10 px-3 py-2 text-slate-400">×</button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-400">نام کسب‌وکار</span><input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="مثلاً سالن نیلوفر" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" /></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-400">نوع کسب‌وکار</span><select value={createForm.type} onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as Business["type"] })} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"><option>Beauty</option><option>Automotive</option><option>Medical</option><option>Services</option></select></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-400">Mode</span><input value={createForm.mode} onChange={(e) => setCreateForm({ ...createForm, mode: e.target.value })} placeholder="Women / Oil Change / Clinic..." className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" /></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-400">پلن اشتراک</span><select value={createForm.plan} onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value as Business["plan"] })} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"><option>Starter</option><option>Professional</option><option>Enterprise</option></select></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-400">ایمیل مالک</span><input type="email" value={createForm.owner} onChange={(e) => setCreateForm({ ...createForm, owner: e.target.value })} placeholder={userEmail} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" /></label>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button onClick={createBusiness} disabled={!createForm.name.trim()} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-40">ساخت Business</button>
              <button onClick={() => setShowCreate(false)} className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-400">انصراف</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 p-3" onClick={() => setSelected(null)}>
          <div className="mr-auto h-full w-full max-w-xl overflow-y-auto border border-white/10 bg-[#0b0f18] p-6 shadow-2xl sm:rounded-[2rem]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div><span className="text-xs font-black text-cyan-300">BUSINESS DETAIL</span><h2 className="mt-2 text-2xl font-black">{selected.name}</h2><p className="mt-1 text-[10px] text-slate-600">{selected.id} · {selected.slug}</p></div>
              <button onClick={() => setSelected(null)} className="rounded-xl border border-white/10 px-3 py-2 text-slate-400">×</button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[["Type", selected.type], ["Mode", selected.mode], ["Plan", selected.plan], ["Status", selected.status], ["Owner", selected.owner], ["آخرین بروزرسانی", selected.updated]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><span className="text-[10px] text-slate-600">{label}</span><b className="mt-2 block text-sm">{value}</b></div>)}
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 p-5">
              <span className="text-[10px] font-black text-slate-500">ماژول‌های فضای کاری</span>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["Dashboard", "Staff", "Customers", "Services", "Appointments", "Payments", "Reports", "Settings"].map((item) => <div key={item} className="rounded-xl border border-white/10 px-3 py-3 text-xs font-bold text-slate-300">✓ {item}</div>)}
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button onClick={() => setSelected(null)} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950">ورود به کسب‌وکار</button>
              <button onClick={() => setSelected(null)} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300">ویرایش کسب‌وکار</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
