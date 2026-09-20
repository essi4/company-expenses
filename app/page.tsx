import Link from "next/link";

const modes = [
  { icon: "✦", title: "زیبایی", text: "آرایشگاه زنانه، مردانه و یونیسکس" },
  { icon: "🚗", title: "خودرو", text: "روغن‌تعویض، تعمیرگاه، کارواش و خدمات خودرو" },
  { icon: "✚", title: "پزشکی", text: "کلینیک، مطب و مراکز درمانی" },
  { icon: "▦", title: "خدمات", text: "فروشگاه‌ها و کسب‌وکارهای خدماتی" },
];

const layers = [
  ["01", "مرکز کنترل", "مدیریت کل پلتفرم، کسب‌وکارها، اشتراک‌ها و سیاست‌ها"],
  ["02", "پلتفرم کسب‌وکار", "داشبورد، کارکنان، مشتریان، خدمات، فروش و عملیات"],
  ["03", "پرتال مشتری", "رزرو، سوابق، اعلان‌ها، پرداخت و ارتباط با کسب‌وکار"],
];

export default function HomePage() {
  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -left-24 top-72 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">E</span>
            <span>
              <b className="block text-base">EASY</b>
              <span className="text-xs text-slate-400">پلتفرم کسب‌وکار</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#platform" className="hover:text-white">پلتفرم</a>
            <a href="#businesses" className="hover:text-white">کسب‌وکارها</a>
            <a href="#architecture" className="hover:text-white">معماری</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/5">ورود</Link>
            <Link href="/login?mode=signup" className="hidden rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 sm:block">شروع کار</Link>
          </div>
        </div>
      </header>

      <section id="platform" className="relative z-10">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-16 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300" /> سامانه چندکسب‌وکاره
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl">
              یک پلتفرم واحد برای
              <span className="block text-cyan-300">ساخت و مدیریت هر کسب‌وکار</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              EASY هسته مشترک، نقش‌ها، دسترسی‌ها، مشتریان، خدمات، پرداخت، اعلان، اتوماسیون و هوش مصنوعی را یکجا مدیریت می‌کند؛
              و برای هر نوع کسب‌وکار، تجربه مخصوص همان صنعت را می‌سازد.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="rounded-2xl bg-white px-6 py-3.5 text-center font-black text-slate-950 shadow-lg shadow-white/10">ورود به EASY</Link>
              <a href="#businesses" className="rounded-2xl border border-white/15 px-6 py-3.5 text-center font-bold text-white hover:bg-white/5">دیدن مدل‌های کسب‌وکار</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
              <span>✓ چندمستاجری</span>
              <span>✓ نقش و دسترسی</span>
              <span>✓ صورتحساب و اشتراک</span>
              <span>✓ آماده برای هوش مصنوعی</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="rounded-[1.6rem] bg-white p-4 text-slate-900 sm:p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs text-slate-400">مرکز کنترل EASY</span>
                  <h2 className="mt-1 text-lg font-black">مدیریت کسب‌وکارها</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">پلتفرم آنلاین</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["۱۲۴", "کسب‌وکار"],
                  ["۱۸", "پلن"],
                  ["۹۷٫۸٪", "دردسترس‌بودن"],
                  ["۱۲", "ماژول"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <b className="block text-2xl font-black">{value}</b>
                    <span className="mt-1 block text-xs text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">فضای کاری</span>
                  <span className="text-xs font-black">دموی EASY</span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {["زیبایی", "خودرو", "پزشکی"].map((item) => (
                    <div key={item} className="rounded-xl border border-slate-200 px-3 py-3 text-center text-xs font-bold">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="businesses" className="relative z-10 border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">یک هسته · چندین کسب‌وکار</span>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">یک هسته، صدها سناریوی کسب‌وکار</h2>
            <p className="mt-4 leading-8 text-slate-400">هویت، مشتری، عضویت، نقش، پرداخت و اتوماسیون ثابت می‌ماند؛ فقط حالت و ماژول متناسب با صنعت فعال می‌شود.</p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {modes.map((mode) => (
              <article key={mode.title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-slate-950">{mode.icon}</span>
                <h3 className="mt-5 text-lg font-black">{mode.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">{mode.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-4 md:grid-cols-3">
            {layers.map(([n, title, text]) => (
              <article key={n} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <span className="text-sm font-black text-cyan-300">{n}</span>
                <h3 className="mt-5 text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.07] p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-cyan-200">EASY Business Platform</p>
                <h2 className="mt-2 text-2xl font-black">از یک ایده تا یک اکوسیستم چندکسب‌وکاره</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">هویت و داده از روز اول چندکسب‌وکاره طراحی می‌شوند تا اضافه شدن صنعت‌های جدید، بازنویسی هسته را ضروری نکند.</p>
              </div>
              <Link href="/login" className="shrink-0 rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-slate-950">ورود به پلتفرم</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>© پلتفرم کسب‌وکار EASY</span>
          <span>هسته + نوع کسب‌وکار + حالت + ماژول‌ها + گردش‌کار + پوسته + دسترسی‌ها + پلن</span>
        </div>
      </footer>
    </main>
  );
}
