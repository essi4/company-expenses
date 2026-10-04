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

    const years = Array.from(new Set(months.map((month) => String(month.month_key).slice(0, 4)))).sort((a, b) => Number(b) - Number(a));
  const visibleMonths = selectedYear ? months.filter((month) => String(month.month_key).startsWith(`${selectedYear}-`)) : months;
  const yearInvoiceCount = visibleMonths.reduce((sum, month) => sum + month.invoice_count, 0);
  const yearMissionCount = visibleMonths.reduce((sum, month) => sum + month.mission_count, 0);
  const yearTotalAmount = visibleMonths.reduce((sum, month) => sum + month.total_amount, 0);
  const yearTotalDays = visibleMonths.reduce((sum, month) => sum + month.total_days, 0);
  const yearLabel = (year: string) => year.replace(/\\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

  return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <header className="mb-6 rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm font-bold text-slate-300">داشبورد مالی و عملیاتی</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black">{company?.name || "شرکت"}</h1>
              <p className="mt-1 text-sm text-slate-300">گزارش‌ها بر اساس ماه دسته‌بندی شده‌اند.</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold ring-1 ring-white/15"
            >
              ↻ بروزرسانی
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-2">
          <a href="/invoice-builder" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5">
            <div className="text-2xl">🧾</div>
            <h2 className="mt-2 text-lg font-black">ساخت فاکتور</h2>
            <p className="mt-1 text-sm text-slate-500">ثبت و چاپ فاکتور هزینه‌های اجرایی</p>
          </a>
          <a href="/mission-report" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5">
            <div className="text-2xl">🧭</div>
            <h2 className="mt-2 text-lg font-black">گزارش مأموریت</h2>
            <p className="mt-1 text-sm text-slate-500">ثبت و چاپ گزارش نفر-روز</p>
          </a>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">گزارش‌های ماهانه</h2>
              <p className="text-xs text-slate-500">ابتدا سال را انتخاب کن، سپس ماه موردنظر را باز کن.</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-black">
              <span className="text-slate-500">سال</span>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                disabled={years.length === 0}
                className="min-w-28 rounded-xl bg-white px-4 py-2.5 text-sm font-black shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-slate-400"
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
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
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
                <div className="grid gap-3">
                  {visibleMonths.map((month) => (
                <a
                  key={month.month_key}
                  href={`/month/${month.month_key}`}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-slate-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black">{month.label}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {month.invoice_count.toLocaleString("fa-IR")} فاکتور · {month.mission_count.toLocaleString("fa-IR")} مأموریت
                      </p>
                    </div>
                    <div className="text-left">
                      <div className="font-black text-emerald-700">{money(month.total_amount)} تومان</div>
                      <div className="mt-1 text-xs text-slate-500">{month.total_days.toLocaleString("fa-IR")} نفر-روز</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
