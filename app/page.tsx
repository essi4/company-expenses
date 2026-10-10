"use client";

import { useEffect, useState } from "react";

type MonthSummary = {
  month_key: string;
  label: string;
  invoice_count: number;
  mission_count: number;
  total_amount: number;
  total_days: number;
};

type Company = { id: number; name: string };

const money = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

export default function DashboardPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [companyResponse, monthsResponse] = await Promise.all([
          fetch("/api/company", { cache: "no-store" }),
          fetch("/api/reports/months", { cache: "no-store" }),
        ]);

        const companyJson = await companyResponse.json();
        const monthsJson = await monthsResponse.json();

        if (!companyResponse.ok || !companyJson.success) {
          throw new Error(companyJson.message || "دریافت اطلاعات شرکت ناموفق بود");
        }
        if (!monthsResponse.ok || !monthsJson.success) {
          throw new Error(monthsJson.message || "دریافت گزارش ماه‌ها ناموفق بود");
        }

        if (!cancelled) {
          setCompany(companyJson.data);
          const nextMonths = monthsJson.data ?? [];
          setMonths(nextMonths);
          if (nextMonths.length > 0) setSelectedYear(String(nextMonths[0].month_key).slice(0, 4));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "خطای نامشخص");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const years = Array.from(new Set(months.map((month) => String(month.month_key).slice(0, 4)))).sort((a, b) => Number(b) - Number(a));
  const visibleMonths = selectedYear
    ? months.filter((month) => String(month.month_key).startsWith(selectedYear + "-"))
    : months;
  const yearInvoiceCount = visibleMonths.reduce((sum, month) => sum + month.invoice_count, 0);
  const yearMissionCount = visibleMonths.reduce((sum, month) => sum + month.mission_count, 0);
  const yearTotalAmount = visibleMonths.reduce((sum, month) => sum + month.total_amount, 0);
  const yearTotalDays = visibleMonths.reduce((sum, month) => sum + month.total_days, 0);
  const yearLabel = (year: string) => year.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 to-cyan-50/40 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 via-cyan-950 to-teal-800 p-6 text-white shadow-xl shadow-cyan-950/10 sm:p-8">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-100">داشبورد مالی و عملیاتی</p>
          <div className="relative z-10 mt-1 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{company?.name || "شرکت"}</h1>
              <p className="mt-2 text-sm leading-7 text-cyan-100/85">نمای یکپارچهٔ هزینه‌ها، فاکتورها و عملکرد مأموریت‌ها در هر ماه</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold backdrop-blur transition hover:bg-white/15"
            >
              ↻ بروزرسانی
            </button>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <a href="/invoice-builder" className="group flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/5 sm:p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-3xl ring-1 ring-teal-100">🧾</div>
            <h2 className="mt-2 text-lg font-black">ساخت فاکتور</h2>
            <p className="mt-1 text-sm text-slate-500">ثبت و چاپ فاکتور هزینه‌های اجرایی</p>
          </a>
          <a href="/mission-report" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md transition hover:-translate-y-0.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-3xl ring-1 ring-sky-100">🧭</div>
            <h2 className="mt-2 text-lg font-black">گزارش مأموریت</h2>
            <p className="mt-1 text-sm text-slate-500">ثبت و چاپ گزارش نفر-روز</p>
          </a>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight">گزارش‌های ماهانه</h2>
              <p className="text-xs text-slate-500">ابتدا سال را انتخاب کن، سپس ماه موردنظر را باز کن.</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-black">
              <span className="text-slate-500">سال</span>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                disabled={years.length === 0}
                className="min-w-28 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-black shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                aria-label="انتخاب سال"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{yearLabel(year)}</option>
                ))}
              </select>
            </label>
          </div>

          {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

          {loading ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">در حال دریافت گزارش‌ها…</div>
          ) : months.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
              <div className="text-3xl">📅</div>
              <h3 className="mt-3 font-black">هنوز گزارشی ثبت نشده</h3>
              <p className="mt-1 text-sm text-slate-500">اولین فاکتور یا گزارش مأموریت را ثبت کن.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4">
                  <div className="text-xs font-bold text-slate-500">فاکتور</div>
                  <div className="mt-1 font-black">{yearInvoiceCount.toLocaleString("fa-IR")}</div>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-bold text-slate-500">مأموریت</div>
                  <div className="mt-1 font-black">{yearMissionCount.toLocaleString("fa-IR")}</div>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-bold text-slate-500">مبلغ فاکتورها</div>
                  <div className="mt-1 font-black text-emerald-700">{money(yearTotalAmount)} تومان</div>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-bold text-slate-500">نفر-روز</div>
                  <div className="mt-1 font-black text-sky-700">{yearTotalDays.toLocaleString("fa-IR")}</div>
                </div>
              </div>

              {visibleMonths.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
                  <div className="text-3xl">📅</div>
                  <h3 className="mt-3 font-black">برای سال {yearLabel(selectedYear)} گزارشی ثبت نشده</h3>
                  <p className="mt-1 text-sm text-slate-500">از همین سال اولین فاکتور یا گزارش مأموریت را ثبت کن.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleMonths.map((month) => (
                    <a
                      key={month.month_key}
                      href={"/month/" + month.month_key}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black">{month.label}</h3>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                              {month.invoice_count.toLocaleString("fa-IR")} فاکتور
                            </span>
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                              {month.mission_count.toLocaleString("fa-IR")} مأموریت
                            </span>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-500">مبلغ فاکتورها</div>
                          <div className="font-black text-emerald-700">{money(month.total_amount)} تومان</div>
                          <div className="mt-2 text-xs font-bold text-slate-500">مجموع مأموریت</div>
                          <div className="font-black text-sky-700">{month.total_days.toLocaleString("fa-IR")} نفر-روز</div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
