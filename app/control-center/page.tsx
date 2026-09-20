import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const nav = [
  ["Business Management", "مدیریت کسب‌وکارها"],
  ["Subscriptions", "اشتراک‌ها و پلن‌ها"],
  ["Marketplace", "Marketplace"],
  ["AI", "EASY AI"],
  ["Governance", "Governance"],
  ["Security", "Security"],
];

export const dynamic = "force-dynamic";

export default async function ControlCenterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/control-center");

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-black text-slate-950">E</span>
            <span><b className="block">EASY Control Center</b><span className="text-xs text-slate-500">Super Admin Platform</span></span>
          </Link>
          <div className="text-left">
            <span className="block text-xs text-slate-500">حساب فعال</span>
            <span className="text-xs font-bold text-slate-200">{user.email ?? "Super Admin"}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-3">
          <p className="px-3 pb-2 pt-2 text-xs font-black uppercase tracking-widest text-slate-500">Control Center</p>
          {nav.map(([title, label], i) => (
            <div key={title} className={`mt-1 rounded-2xl px-3 py-3 ${i === 0 ? "bg-white text-slate-950" : "text-slate-300"}`}>
              <b className="block text-sm">{label}</b>
              <span className="mt-0.5 block text-[11px] opacity-60">{title}</span>
            </div>
          ))}
        </aside>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Super Admin</p>
              <h1 className="mt-2 text-3xl font-black">مدیریت کسب‌وکارها</h1>
              <p className="mt-2 text-sm leading-7 text-slate-400">ستون فقرات Control Center برای ایجاد، جست‌وجو، وضعیت، Subscription و ورود به Business.</p>
            </div>
            <button className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">＋ ایجاد کسب‌وکار</button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["۰", "کسب‌وکارها", "All Businesses"],
              ["۰", "فعال", "Active"],
              ["۰", "آزمایشی", "Trial"],
              ["—", "MRR", "Subscription Revenue"],
            ].map(([value, label, meta]) => (
              <div key={meta} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <span className="text-xs text-slate-500">{meta}</span>
                <b className="mt-2 block text-3xl">{value}</b>
                <span className="mt-1 block text-sm font-bold text-slate-300">{label}</span>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none placeholder:text-slate-600" placeholder="جست‌وجوی نام، دامنه یا Business ID" />
              <select className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300">
                <option>همه وضعیت‌ها</option>
                <option>Active</option>
                <option>Trial</option>
                <option>Suspended</option>
              </select>
              <select className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300">
                <option>همه مدل‌ها</option>
                <option>Beauty</option>
                <option>Automotive</option>
                <option>Medical</option>
                <option>Services</option>
              </select>
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[760px] text-right text-sm">
                <thead className="bg-white/[0.04] text-slate-500">
                  <tr><th className="px-4 py-3">Business</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Action</th></tr>
                </thead>
                <tbody>
                  <tr><td colSpan={5} className="px-4 py-12 text-center"><b className="block text-base">هنوز کسب‌وکاری برای نمایش ثبت نشده است</b><span className="mt-2 block text-xs text-slate-500">ساختار UI آماده است؛ اتصال CRUD و Subscription به هسته داده در مرحله بعد انجام می‌شود.</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><span className="text-xs text-slate-500">Architecture</span><b className="mt-2 block">Stages 138–150</b><p className="mt-2 text-xs leading-6 text-slate-500">Marketplace، AI، Governance، Identity، Infra، Data، Billing و Control Plane.</p></div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><span className="text-xs text-slate-500">Platform Health</span><b className="mt-2 block text-emerald-300">Ready</b><p className="mt-2 text-xs leading-6 text-slate-500">ورودی Control Center از API محافظت‌شده استفاده می‌کند.</p></div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><span className="text-xs text-slate-500">Preview</span><b className="mt-2 block">Feature Branch</b><p className="mt-2 text-xs leading-6 text-slate-500">این محیط هنوز Production نیست و داده‌های واقعی را تغییر نمی‌دهد.</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
